import {
  BadgeCheck,
  Ban,
  CalendarHeart,
  CheckCircle2,
  Clock,
  Sparkles,
  UserX,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import http from "../api/http";
import { AgendaBoardSkeleton, AgendaTimelineSkeleton } from "../components/Skeletons";

const SLOT_MINUTES = 30;

function msg(err, fallback) {
  return err.response?.data?.message || fallback;
}

function toDatetimeLocalValue(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatLocalYMD(d) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function shiftDateStr(dateStr, deltaDays) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const n = new Date(y, m - 1, d + deltaDays);
  return formatLocalYMD(n);
}

function dayRangeIso(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const from = new Date(y, m - 1, d, 0, 0, 0, 0);
  const to = new Date(y, m - 1, d, 23, 59, 59, 999);
  return { from: from.toISOString(), to: to.toISOString() };
}

function hhmmToMinutes(value) {
  const [h, min] = value.split(":").map(Number);
  return h * 60 + min;
}

function formatSlotLabel(minutesFromMidnight) {
  const h = Math.floor(minutesFromMidnight / 60);
  const m = minutesFromMidnight % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function localDateAtMinutes(dateStr, minutesFromMidnight) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const h = Math.floor(minutesFromMidnight / 60);
  const min = minutesFromMidnight % 60;
  return new Date(y, m - 1, d, h, min, 0, 0);
}

function isSameLocalDay(date, dateStr) {
  return formatLocalYMD(date) === dateStr;
}

function normalizeBusinessError(err, fallback) {
  const status = err.response?.status;
  const raw = (err.response?.data?.message || "").toLowerCase();

  if (status === 409) {
    if (raw.includes("overlapping")) {
      return "Ese barbero ya tiene un turno en ese horario. Elegí otro horario.";
    }
    if (raw.includes("blocked")) {
      return "Ese horario está bloqueado para el barbero seleccionado.";
    }
    return "No se pudo guardar el turno por conflicto de agenda.";
  }

  if (raw.includes("outside barber working hours")) {
    return "El horario está fuera del horario laboral del barbero.";
  }
  if (raw.includes("invalid startdatetime")) {
    return "La fecha y hora de inicio no es válida.";
  }
  if (status === 400) {
    return "No se pudo procesar la solicitud. Revisá los datos del turno.";
  }

  return fallback;
}

function deriveWorkingBounds(schedules, dayItems, dateStr) {
  let startMin = 8 * 60;
  let endMin = 20 * 60;
  if (schedules?.length) {
    startMin = Math.min(...schedules.map((s) => hhmmToMinutes(s.startTime)));
    endMin = Math.max(...schedules.map((s) => hhmmToMinutes(s.endTime)));
  }
  for (const a of dayItems) {
    const s = new Date(a.startDatetime);
    const e = new Date(a.endDatetime);
    if (!isSameLocalDay(s, dateStr)) continue;
    const sm = s.getHours() * 60 + s.getMinutes();
    const dur = Math.max(SLOT_MINUTES, Math.ceil((e - s) / 60000));
    startMin = Math.min(startMin, Math.floor(sm / SLOT_MINUTES) * SLOT_MINUTES);
    endMin = Math.max(endMin, sm + dur);
  }
  endMin = Math.ceil(endMin / SLOT_MINUTES) * SLOT_MINUTES;
  if (endMin <= startMin) endMin = startMin + SLOT_MINUTES;
  return { startMin, endMin };
}

function appointmentStatusUi(status) {
  if (status === "CANCELLED") return { className: "cancelled", label: "Cancelado", Icon: XCircle };
  if (status === "COMPLETED") return { className: "completed", label: "Completado", Icon: CheckCircle2 };
  if (status === "NO_SHOW") return { className: "noshow", label: "Ausente", Icon: UserX };
  if (status === "CONFIRMED") return { className: "confirmed", label: "Confirmado", Icon: BadgeCheck };
  return { className: "pending", label: "Pendiente", Icon: Clock };
}

function buildSegments(dateStr, availability, dayItems) {
  const schedules = availability?.schedules || [];
  const { startMin, endMin } = deriveWorkingBounds(schedules, dayItems, dateStr);
  const blocked = (availability?.blockedTimes || []).map((b) => ({
    start: new Date(b.startDatetime),
    end: new Date(b.endDatetime),
  }));
  const appointments = [...dayItems].sort(
    (a, b) => new Date(a.startDatetime) - new Date(b.startDatetime)
  );
  const segments = [];
  const totalSlots = Math.ceil((endMin - startMin) / SLOT_MINUTES);
  let i = 0;
  while (i < totalSlots) {
    const cursorMin = startMin + i * SLOT_MINUTES;
    const slotStart = localDateAtMinutes(dateStr, cursorMin);
    const slotEnd = localDateAtMinutes(dateStr, Math.min(cursorMin + SLOT_MINUTES, endMin));

    const apptStartingHere = appointments.find((a) => {
      const aStart = new Date(a.startDatetime);
      return aStart >= slotStart && aStart < slotEnd;
    });

    if (apptStartingHere) {
      const aStart = new Date(apptStartingHere.startDatetime);
      const aEnd = new Date(apptStartingHere.endDatetime);
      const durMin = Math.max(SLOT_MINUTES, Math.ceil((aEnd - aStart) / 60000));
      const span = Math.max(1, Math.ceil(durMin / SLOT_MINUTES));
      segments.push({
        type: "appointment",
        appt: apptStartingHere,
        span,
        startLabel: formatSlotLabel(cursorMin),
      });
      i += span;
      continue;
    }

    const overlappedByAppt = appointments.some((a) => {
      const aStart = new Date(a.startDatetime);
      const aEnd = new Date(a.endDatetime);
      return aStart < slotEnd && aEnd > slotStart;
    });
    if (overlappedByAppt) {
      i += 1;
      continue;
    }

    const blockHit = blocked.some((b) => b.start < slotEnd && b.end > slotStart);
    if (blockHit) {
      segments.push({
        type: "blocked",
        span: 1,
        startLabel: formatSlotLabel(cursorMin),
        cursorMin,
      });
      i += 1;
      continue;
    }

    segments.push({ type: "free", span: 1, startLabel: formatSlotLabel(cursorMin), cursorMin });
    i += 1;
  }
  return { segments, startMin, endMin };
}

function AppointmentsPage() {
  const [dayItems, setDayItems] = useState([]);
  const [availability, setAvailability] = useState(null);
  const [agendaDate, setAgendaDate] = useState(() => formatLocalYMD(new Date()));
  const [agendaBarberId, setAgendaBarberId] = useState("");
  const [agendaLoading, setAgendaLoading] = useState(false);
  const [agendaError, setAgendaError] = useState("");
  const [selectedSlotMin, setSelectedSlotMin] = useState(null);

  const [services, setServices] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [info, setInfo] = useState("");
  const [actionError, setActionError] = useState("");
  const [actingId, setActingId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const editingIdRef = useRef(null);
  const formSectionRef = useRef(null);
  const agendaLoadGenRef = useRef(0);
  const [form, setForm] = useState({
    clientId: "",
    barberId: "",
    serviceId: "",
    startDatetime: "",
    notes: "",
  });
  const nowLocal = toDatetimeLocalValue(new Date().toISOString());

  const emptyFormDefaults = (serviceItems, barberItems, clientItems, preferredBarberId) => ({
    clientId: clientItems[0]?.id ? String(clientItems[0].id) : "",
    barberId:
      preferredBarberId && barberItems.some((b) => String(b.id) === preferredBarberId)
        ? preferredBarberId
        : barberItems[0]?.id
          ? String(barberItems[0].id)
          : "",
    serviceId: serviceItems[0]?.id ? String(serviceItems[0].id) : "",
    startDatetime: "",
    notes: "",
  });

  const activeBarbers = barbers.filter((b) => b.isActive);
  const activeServices = services.filter((s) => s.isActive);
  const barberSelectList = editingId ? barbers : activeBarbers;
  const serviceSelectList = editingId ? services : activeServices;

  useEffect(() => {
    editingIdRef.current = editingId;
  }, [editingId]);

  const loadDayAgenda = useCallback(async () => {
    if (!agendaBarberId) return;
    const gen = ++agendaLoadGenRef.current;
    setAgendaLoading(true);
    setAgendaError("");
    try {
      const { from, to } = dayRangeIso(agendaDate);
      const barberId = Number(agendaBarberId);
      const [apptResult, availResult] = await Promise.allSettled([
        http.get("/api/appointments", { params: { barberId, from, to } }),
        http.get("/api/appointments/availability", { params: { barberId, date: agendaDate } }),
      ]);

      if (gen !== agendaLoadGenRef.current) return;

      if (apptResult.status === "fulfilled") {
        const data = apptResult.value.data;
        setDayItems(Array.isArray(data) ? data : []);
      } else {
        setDayItems([]);
        setAgendaError(msg(apptResult.reason, "No se pudieron cargar los turnos del día"));
      }

      if (gen !== agendaLoadGenRef.current) return;

      if (availResult.status === "fulfilled") {
        setAvailability(availResult.value.data || null);
      } else {
        setAvailability(null);
        if (apptResult.status === "fulfilled") {
          setAgendaError((prev) => prev || "No se pudo cargar disponibilidad (horarios libres/ocupados).");
        }
      }
    } catch (err) {
      if (gen !== agendaLoadGenRef.current) return;
      setAgendaError(msg(err, "No se pudo cargar la agenda del día"));
      setDayItems([]);
      setAvailability(null);
    } finally {
      if (gen === agendaLoadGenRef.current) {
        setAgendaLoading(false);
      }
    }
  }, [agendaDate, agendaBarberId]);

  const loadRefs = async () => {
    setLoading(true);
    setError("");
    try {
      const [servicesRes, barbersRes, clientsRes] = await Promise.all([
        http.get("/api/services"),
        http.get("/api/barbers"),
        http.get("/api/clients"),
      ]);
      const serviceItems = Array.isArray(servicesRes.data) ? servicesRes.data : [];
      const barberItems = Array.isArray(barbersRes.data) ? barbersRes.data : [];
      const clientItems = Array.isArray(clientsRes.data) ? clientsRes.data : [];

      setServices(serviceItems);
      setBarbers(barberItems);
      setClients(clientItems);

      const firstActiveServices = serviceItems.filter((s) => s.isActive);
      setForm((prev) => {
        if (editingIdRef.current) return prev;
        const next = { ...prev };
        if (!next.serviceId && firstActiveServices[0]?.id) next.serviceId = String(firstActiveServices[0].id);
        if (!next.clientId && clientItems[0]?.id) next.clientId = String(clientItems[0].id);
        return next;
      });
    } catch (err) {
      setError(msg(err, "No se pudieron cargar los datos"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRefs();
  }, []);

  useEffect(() => {
    const actives = barbers.filter((b) => b.isActive);
    if (!actives.length) return;
    setAgendaBarberId((prev) => {
      if (prev && actives.some((b) => String(b.id) === prev)) return prev;
      return String(actives[0].id);
    });
  }, [barbers]);

  useEffect(() => {
    setSelectedSlotMin(null);
  }, [agendaDate, agendaBarberId]);

  useEffect(() => {
    if (!agendaBarberId) return;
    loadDayAgenda();
  }, [agendaBarberId, agendaDate, loadDayAgenda]);

  useEffect(() => {
    if (editingId) return;
    if (!agendaBarberId) return;
    setForm((p) => ({ ...p, barberId: agendaBarberId }));
  }, [agendaBarberId, editingId]);

  const resetCreateForm = () => {
    editingIdRef.current = null;
    setEditingId(null);
    setSelectedSlotMin(null);
    setForm(emptyFormDefaults(activeServices, activeBarbers, clients, agendaBarberId));
    setFormError("");
  };

  const startEdit = (item) => {
    if (item.status === "CANCELLED") {
      window.alert("No se pueden editar turnos cancelados.");
      return;
    }
    editingIdRef.current = item.id;
    setEditingId(item.id);
    setForm({
      clientId: String(item.clientId),
      barberId: String(item.barberId),
      serviceId: String(item.serviceId),
      startDatetime: toDatetimeLocalValue(item.startDatetime),
      notes: item.notes || "",
    });
    setFormError("");
    setInfo("");
    setActionError("");
    setSelectedSlotMin(null);
  };

  const pickFreeSlot = (cursorMin) => {
    if (!clients.length || !activeBarbers.length || !activeServices.length) return;
    if (editingId) {
      window.alert("Guardá o cancelá la edición del turno antes de elegir un horario nuevo.");
      return;
    }
    if (!agendaBarberId) return;
    const start = localDateAtMinutes(agendaDate, cursorMin);
    if (start.getTime() < Date.now()) {
      setFormError("Ese horario ya pasó. Elegí una franja futura o cambiá de día.");
      setInfo("");
      setActionError("");
      return;
    }
    setSelectedSlotMin(cursorMin);
    setForm((prev) => ({
      ...prev,
      barberId: agendaBarberId,
      startDatetime: toDatetimeLocalValue(start.toISOString()),
    }));
    setFormError("");
    setInfo("");
    setActionError("");
    requestAnimationFrame(() => {
      formSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setInfo("");

    if (!form.clientId || !form.barberId || !form.serviceId || !form.startDatetime) {
      setFormError("Completá cliente, barbero, servicio y fecha/hora.");
      return;
    }

    const parsedStart = new Date(form.startDatetime);
    if (Number.isNaN(parsedStart.getTime())) {
      setFormError("La fecha y hora ingresada no es válida.");
      return;
    }

    setSubmitting(true);
    const body = {
      clientId: Number(form.clientId),
      barberId: Number(form.barberId),
      serviceId: Number(form.serviceId),
      startDatetime: parsedStart.toISOString(),
      notes: form.notes || undefined,
    };
    try {
      if (editingId) {
        await http.put(`/api/appointments/${editingId}`, body);
        setInfo("Turno actualizado.");
      } else {
        await http.post("/api/appointments", body);
        setInfo("Turno creado.");
      }
      editingIdRef.current = null;
      setEditingId(null);
      setSelectedSlotMin(null);
      setForm((prev) => ({ ...prev, startDatetime: "", notes: "" }));
      await loadDayAgenda();
    } catch (err) {
      const fallback = editingId ? "No se pudo actualizar el turno." : "No se pudo crear el turno.";
      setFormError(normalizeBusinessError(err, fallback));
    } finally {
      setSubmitting(false);
    }
  };

  const cancelAppointment = async (id) => {
    const ok = window.confirm("¿Cancelar este turno?");
    if (!ok) return;

    setActingId(id);
    setActionError("");
    setInfo("");
    try {
      await http.patch(`/api/appointments/${id}/cancel`, { reason: "Cancelado desde UI" });
      if (editingId === id) {
        editingIdRef.current = null;
        setEditingId(null);
        setForm(emptyFormDefaults(activeServices, activeBarbers, clients, agendaBarberId));
        setFormError("");
        setSelectedSlotMin(null);
      }
      setInfo("Turno cancelado.");
      await loadDayAgenda();
    } catch (err) {
      setActionError(normalizeBusinessError(err, "No se pudo cancelar el turno."));
    } finally {
      setActingId(null);
    }
  };

  const completeAppointment = async (id) => {
    const ok = window.confirm("¿Marcar este turno como completado?");
    if (!ok) return;

    setActingId(id);
    setActionError("");
    setInfo("");
    try {
      await http.patch(`/api/appointments/${id}/complete`);
      setInfo("Turno completado.");
      await loadDayAgenda();
    } catch (err) {
      setActionError(normalizeBusinessError(err, "No se pudo completar el turno."));
    } finally {
      setActingId(null);
    }
  };

  const missingRefs = !clients.length || !activeBarbers.length || !activeServices.length;
  const todayStr = formatLocalYMD(new Date());
  const { segments } = buildSegments(agendaDate, availability, dayItems);
  const barberName =
    activeBarbers.find((b) => String(b.id) === agendaBarberId)?.name ||
    barbers.find((b) => String(b.id) === agendaBarberId)?.name ||
    "";

  return (
    <section className="card appointments-page page-shell appointments-page--star">
      <header className="page-header page-header--tight appointments-page-header">
        <h2 className="page-title">Agenda / Turnos</h2>
        <p className="page-lead muted agenda-intro">
          {editingId
            ? `Editando turno #${editingId}. Guardá o cancelá la edición.`
            : "Franjas de 30 minutos. Tocá un horario libre para cargar la reserva abajo."}
        </p>
      </header>

      {missingRefs ? (
        <p className="error">
          Faltan datos: necesitás al menos un cliente, un barbero y un servicio activos para crear turnos.
        </p>
      ) : null}

      {loading ? (
        <AgendaBoardSkeleton />
      ) : error ? (
        <div>
          <p className="error">{error}</p>
          <button className="btn" type="button" onClick={loadRefs}>
            Reintentar
          </button>
        </div>
      ) : (
        <>
          <div className="agenda-star-board">
          <div className="agenda-toolbar card-inner">
            <div className="agenda-toolbar-row">
              <label className="agenda-field">
                <span className="agenda-field-label">Fecha</span>
                <input
                  type="date"
                  value={agendaDate}
                  onChange={(e) => setAgendaDate(e.target.value)}
                />
              </label>
              <label className="agenda-field agenda-field-grow">
                <span className="agenda-field-label">Barbero</span>
                <select
                  value={agendaBarberId}
                  onChange={(e) => setAgendaBarberId(e.target.value)}
                  disabled={!activeBarbers.length}
                >
                  {!activeBarbers.length ? (
                    <option value="">Sin barberos activos</option>
                  ) : null}
                  {activeBarbers.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="agenda-nav-btns">
                <button className="btn btn-small" type="button" onClick={() => setAgendaDate(shiftDateStr(agendaDate, -1))}>
                  ← Día anterior
                </button>
                <button className="btn btn-small" type="button" onClick={() => setAgendaDate(todayStr)}>
                  Hoy
                </button>
                <button className="btn btn-small" type="button" onClick={() => setAgendaDate(shiftDateStr(agendaDate, 1))}>
                  Día siguiente →
                </button>
              </div>
            </div>
            <p className="muted agenda-subtitle">
              {barberName ? (
                <>
                  <strong>{barberName}</strong>
                  {" · "}
                  {new Date(`${agendaDate}T12:00:00`).toLocaleDateString("es-AR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </>
              ) : (
                "Seleccioná un barbero activo."
              )}
            </p>
          </div>

          {agendaLoading ? (
            <AgendaTimelineSkeleton />
          ) : agendaError ? (
            <div className="agenda-error-box">
              <p className="error">{agendaError}</p>
              <button className="btn btn-small" type="button" onClick={() => loadDayAgenda()}>
                Reintentar agenda
              </button>
            </div>
          ) : null}

          {!agendaLoading && !agendaError && agendaBarberId ? (
            <div className="agenda-visual agenda-day-enter" key={`${agendaDate}-${agendaBarberId}`}>
              {dayItems.length === 0 ? (
                <div className="agenda-empty-card agenda-empty-card--polish">
                  <CalendarHeart className="agenda-empty-visual-icon" size={38} strokeWidth={1.65} aria-hidden />
                  <p className="agenda-empty-title">Día libre para {barberName}</p>
                  <p className="agenda-empty-text">
                    Todavía no hay reservas. Tocá un horario en <strong>verde</strong> en la grilla o completá el
                    formulario de abajo para cargar un turno.
                  </p>
                  <ul className="agenda-empty-hints">
                    <li>Franjas rayadas: tiempo bloqueado (no reservable).</li>
                    <li>Cada turno muestra el estado con color e icono para leerlo de un vistazo.</li>
                  </ul>
                </div>
              ) : null}
              <div className="agenda-legend-bar">
                <span className="agenda-legend-title">Leyenda</span>
                <div className="agenda-legend" role="list">
                <span className="agenda-legend-item">
                  <Sparkles className="agenda-legend-glyph agenda-legend-glyph--free" size={14} strokeWidth={2} aria-hidden /> Libre
                </span>
                <span className="agenda-legend-item">
                  <Ban className="agenda-legend-glyph agenda-legend-glyph--blocked" size={14} strokeWidth={2} aria-hidden /> Bloqueado
                </span>
                <span className="agenda-legend-item">
                  <Clock className="agenda-legend-glyph agenda-legend-glyph--pending" size={14} strokeWidth={2} aria-hidden /> Pendiente
                </span>
                <span className="agenda-legend-item">
                  <BadgeCheck className="agenda-legend-glyph agenda-legend-glyph--confirmed" size={14} strokeWidth={2} aria-hidden /> Confirmado
                </span>
                <span className="agenda-legend-item">
                  <CheckCircle2 className="agenda-legend-glyph agenda-legend-glyph--completed" size={14} strokeWidth={2} aria-hidden /> Completado
                </span>
                <span className="agenda-legend-item">
                  <XCircle className="agenda-legend-glyph agenda-legend-glyph--cancelled" size={14} strokeWidth={2} aria-hidden /> Cancelado
                </span>
                <span className="agenda-legend-item">
                  <UserX className="agenda-legend-glyph agenda-legend-glyph--noshow" size={14} strokeWidth={2} aria-hidden /> Ausente
                </span>
                </div>
              </div>
              <div className="agenda-timeline-wrap">
              <div className="agenda-timeline agenda-timeline--premium">
                <div className="agenda-timeline-head" aria-hidden="true">
                  <span className="agenda-timeline-head-time">Hora</span>
                  <span className="agenda-timeline-head-main">Citas y disponibilidad</span>
                </div>
                {segments.map((seg, idx) => {
                  const rowKey =
                    seg.type === "appointment"
                      ? `appt-${seg.appt.id}`
                      : `${seg.type}-${seg.startLabel}-${idx}`;
                  const rowHeight = seg.span * 48;

                  if (seg.type === "appointment") {
                    const st = appointmentStatusUi(seg.appt.status);
                    const StatusGlyph = st.Icon;
                    return (
                      <div key={rowKey} className="agenda-row agenda-row--appointment">
                        <div className="agenda-time">{seg.startLabel}</div>
                        <div
                          className={`agenda-appt-card agenda-appt-card--${st.className}`}
                          style={{ minHeight: rowHeight }}
                        >
                          <div className="agenda-appt-head">
                            <span className="agenda-appt-time">
                              {new Date(seg.appt.startDatetime).toLocaleTimeString("es-AR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                              {" – "}
                              {new Date(seg.appt.endDatetime).toLocaleTimeString("es-AR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            <span className={`agenda-status-badge agenda-status-badge--${st.className}`}>
                              <StatusGlyph className="agenda-status-glyph" size={13} strokeWidth={2.35} aria-hidden />
                              {st.label}
                            </span>
                          </div>
                          <div className="agenda-appt-body">
                            <span className="agenda-appt-client">
                              {seg.appt.client?.name || `Cliente #${seg.appt.clientId}`}
                            </span>
                            <span className="agenda-appt-service">
                              {seg.appt.service?.name || `Servicio #${seg.appt.serviceId}`}
                              {seg.appt.service?.durationMinutes != null
                                ? ` · ${seg.appt.service.durationMinutes} min`
                                : ""}
                            </span>
                          </div>
                          <div className="agenda-appt-actions">
                            <button
                              className="btn btn-small"
                              type="button"
                              disabled={seg.appt.status === "CANCELLED"}
                              onClick={() => startEdit(seg.appt)}
                            >
                              Editar
                            </button>
                            <button
                              className="btn btn-small"
                              type="button"
                              disabled={
                                actingId === seg.appt.id ||
                                seg.appt.status === "CANCELLED" ||
                                seg.appt.status === "COMPLETED"
                              }
                              onClick={() => cancelAppointment(seg.appt.id)}
                            >
                              {actingId === seg.appt.id ? "…" : "Cancelar"}
                            </button>
                            <button
                              className="btn btn-small"
                              type="button"
                              disabled={
                                actingId === seg.appt.id ||
                                seg.appt.status === "COMPLETED" ||
                                seg.appt.status === "CANCELLED"
                              }
                              onClick={() => completeAppointment(seg.appt.id)}
                            >
                              {actingId === seg.appt.id ? "…" : "Completar"}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  const isSelectedFree = seg.type === "free" && selectedSlotMin === seg.cursorMin;
                  return (
                    <div key={rowKey} className={`agenda-row agenda-row--${seg.type}`}>
                      <div className="agenda-time">{seg.startLabel}</div>
                      {seg.type === "free" ? (
                        <button
                          type="button"
                          className={`agenda-slot-btn${isSelectedFree ? " agenda-slot-btn--selected" : ""}`}
                          onClick={() => pickFreeSlot(seg.cursorMin)}
                          disabled={!clients.length || !activeBarbers.length || !activeServices.length}
                          title="Crear turno en este horario"
                        >
                          <span className="agenda-slot-label agenda-slot-label--free">Libre</span>
                          <span className="agenda-slot-hint">Tocá para reservar</span>
                        </button>
                      ) : (
                        <div className="agenda-slot-cell agenda-slot-cell--blocked" title="Horario no disponible">
                          <div className="agenda-slot-blocked-copy">
                            <span className="agenda-slot-label agenda-slot-label--blocked">No disponible</span>
                            <span className="agenda-slot-sub">Bloqueado o fuera de uso</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              </div>
            </div>
          ) : null}
          </div>

          <hr className="agenda-divider" />

          <div ref={formSectionRef} className="agenda-form-section agenda-form-panel">
          <h3 className="agenda-form-title section-title">Crear o editar turno</h3>
          <p className="muted agenda-form-sub section-desc">
            El fin del turno se calcula según la duración del servicio.
            {selectedSlotMin != null && !editingId ? (
              <span className="agenda-slot-picked">
                {" "}
                Horario elegido: <strong>{formatSlotLabel(selectedSlotMin)}</strong>
              </span>
            ) : null}
          </p>
          <form className="form-grid" onSubmit={onSubmit}>
            <select
              value={form.clientId}
              onChange={(e) => setForm((prev) => ({ ...prev, clientId: e.target.value }))}
              required
            >
              <option value="">Cliente</option>
              {clients.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <select
              value={form.barberId}
              onChange={(e) => setForm((prev) => ({ ...prev, barberId: e.target.value }))}
              required
            >
              <option value="">Barbero</option>
              {barberSelectList.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <select
              value={form.serviceId}
              onChange={(e) => setForm((prev) => ({ ...prev, serviceId: e.target.value }))}
              required
            >
              <option value="">Servicio</option>
              {serviceSelectList.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <input
              type="datetime-local"
              value={form.startDatetime}
              onChange={(e) => {
                const v = e.target.value;
                setForm((prev) => ({ ...prev, startDatetime: v }));
                if (selectedSlotMin == null || editingId) return;
                const d = new Date(v);
                if (Number.isNaN(d.getTime())) {
                  setSelectedSlotMin(null);
                  return;
                }
                const mins = d.getHours() * 60 + d.getMinutes();
                if (formatLocalYMD(d) !== agendaDate || mins !== selectedSlotMin) {
                  setSelectedSlotMin(null);
                }
              }}
              min={editingId ? undefined : nowLocal}
              required
            />
            <input
              placeholder="Notas"
              value={form.notes}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
            />
            <button className="btn btn-primary" type="submit" disabled={submitting || missingRefs}>
              {submitting ? "Guardando..." : editingId ? "Guardar turno" : "Crear turno"}
            </button>
            {editingId ? (
              <button className="btn" type="button" onClick={resetCreateForm} disabled={submitting}>
                Cancelar edición
              </button>
            ) : null}
          </form>
          </div>
        </>
      )}

      <div className="agenda-feedback" aria-live="polite">
        {formError ? (
          <div className="agenda-alert agenda-alert--error" role="alert">
            {formError}
          </div>
        ) : null}
        {actionError ? (
          <div className="agenda-alert agenda-alert--error" role="alert">
            {actionError}
          </div>
        ) : null}
        {info ? <div className="agenda-alert agenda-alert--success">{info}</div> : null}
      </div>
    </section>
  );
}

export default AppointmentsPage;
