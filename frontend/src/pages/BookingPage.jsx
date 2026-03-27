import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import http from "../api/http";
import { useAuth } from "../context/AuthContext";

const SLOT_MINUTES = 30;

function msg(err, fallback) {
  return err.response?.data?.message || fallback;
}

function ymdLocal(date = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function slotLabel(minutesFromMidnight) {
  const h = Math.floor(minutesFromMidnight / 60);
  const m = minutesFromMidnight % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function hhmmToMinutes(value) {
  const [h, m] = String(value).split(":").map(Number);
  return h * 60 + m;
}

function isOverlapping(start, end, blockStart, blockEnd) {
  return blockStart < end && blockEnd > start;
}

function buildAvailableSlots(date, availability) {
  const schedules = Array.isArray(availability?.schedules) ? availability.schedules : [];
  if (!schedules.length) return [];

  const blockedTimes = Array.isArray(availability?.blockedTimes) ? availability.blockedTimes : [];
  const appointments = Array.isArray(availability?.appointments) ? availability.appointments : [];
  const busyAppointments = appointments.filter((row) => row.status !== "CANCELLED");

  const now = new Date();
  const slots = [];

  for (const schedule of schedules) {
    const startMin = hhmmToMinutes(schedule.startTime);
    const endMin = hhmmToMinutes(schedule.endTime);
    for (let cursor = startMin; cursor + SLOT_MINUTES <= endMin; cursor += SLOT_MINUTES) {
      const [y, m, d] = date.split("-").map(Number);
      const start = new Date(y, m - 1, d, Math.floor(cursor / 60), cursor % 60, 0, 0);
      const end = new Date(start.getTime() + SLOT_MINUTES * 60000);
      if (start.getTime() <= now.getTime()) continue;

      const blocked = blockedTimes.some((row) =>
        isOverlapping(start, end, new Date(row.startDatetime), new Date(row.endDatetime))
      );
      if (blocked) continue;

      const occupied = busyAppointments.some((row) =>
        isOverlapping(start, end, new Date(row.startDatetime), new Date(row.endDatetime))
      );
      if (occupied) continue;

      slots.push({
        minutes: cursor,
        label: slotLabel(cursor),
        startIso: start.toISOString(),
      });
    }
  }

  return slots;
}

function BookingPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refsError, setRefsError] = useState("");
  const [barbers, setBarbers] = useState([]);
  const [services, setServices] = useState([]);

  const [barberId, setBarberId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState(() => ymdLocal());

  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState("");
  const [availability, setAvailability] = useState(null);

  const [selectedSlot, setSelectedSlot] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitInfo, setSubmitInfo] = useState("");

  const activeBarbers = useMemo(() => barbers.filter((row) => row.isActive), [barbers]);
  const activeServices = useMemo(() => services.filter((row) => row.isActive), [services]);

  const selectedBarber = activeBarbers.find((row) => String(row.id) === barberId);
  const selectedService = activeServices.find((row) => String(row.id) === serviceId);
  const availableSlots = useMemo(() => buildAvailableSlots(date, availability), [date, availability]);

  const loadRefs = async () => {
    setLoading(true);
    setRefsError("");
    try {
      const [barbersRes, servicesRes] = await Promise.all([http.get("/api/barbers"), http.get("/api/services")]);
      const nextBarbers = Array.isArray(barbersRes.data) ? barbersRes.data : [];
      const nextServices = Array.isArray(servicesRes.data) ? servicesRes.data : [];
      setBarbers(nextBarbers);
      setServices(nextServices);
      const firstBarber = nextBarbers.find((row) => row.isActive);
      const firstService = nextServices.find((row) => row.isActive);
      setBarberId(firstBarber ? String(firstBarber.id) : "");
      setServiceId(firstService ? String(firstService.id) : "");
    } catch (err) {
      setRefsError(msg(err, "No se pudieron cargar barberos y servicios."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRefs();
  }, []);

  useEffect(() => {
    if (!barberId || !date) return;
    const run = async () => {
      setAvailabilityLoading(true);
      setAvailabilityError("");
      setSelectedSlot(null);
      try {
        const { data } = await http.get("/api/appointments/availability", {
          params: { barberId: Number(barberId), date },
        });
        setAvailability(data || null);
      } catch (err) {
        setAvailability(null);
        setAvailabilityError(msg(err, "No se pudo cargar la disponibilidad."));
      } finally {
        setAvailabilityLoading(false);
      }
    };
    run();
  }, [barberId, date]);

  const confirmBooking = async () => {
    if (!selectedSlot || !serviceId || !barberId || !user?.clientId) return;
    setSubmitting(true);
    setSubmitError("");
    setSubmitInfo("");
    try {
      await http.post("/api/appointments", {
        clientId: Number(user.clientId),
        barberId: Number(barberId),
        serviceId: Number(serviceId),
        startDatetime: selectedSlot.startIso,
      });
      setSubmitInfo("Turno reservado correctamente.");
      const { data } = await http.get("/api/appointments/availability", {
        params: { barberId: Number(barberId), date },
      });
      setAvailability(data || null);
      setSelectedSlot(null);
    } catch (err) {
      setSubmitError(msg(err, "No se pudo reservar el turno."));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="booking-shell">
        <section className="booking-card">
          <p className="muted">Cargando booking…</p>
        </section>
      </main>
    );
  }

  return (
    <main className="booking-shell">
      <section className="booking-card">
        <header className="booking-header">
          <h1 className="booking-title">Reservar turno</h1>
          <p className="booking-subtitle">Seleccioná barbero, servicio, fecha y horario en pocos pasos.</p>
        </header>

        <div className="booking-top-actions">
          <button className="btn btn-small" type="button" onClick={() => navigate("/appointments")}>
            Ir a mi agenda
          </button>
          <button className="btn btn-small" type="button" onClick={logout}>
            Cerrar sesión
          </button>
        </div>

        {refsError ? <p className="error">{refsError}</p> : null}

        <div className="booking-steps">
          <label>
            <span>Paso 1 · Barbero</span>
            <select value={barberId} onChange={(e) => setBarberId(e.target.value)} required>
              <option value="">Seleccionar barbero</option>
              {activeBarbers.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Paso 2 · Servicio</span>
            <select value={serviceId} onChange={(e) => setServiceId(e.target.value)} required>
              <option value="">Seleccionar servicio</option>
              {activeServices.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Paso 3 · Fecha</span>
            <input type="date" value={date} min={ymdLocal()} onChange={(e) => setDate(e.target.value)} required />
          </label>
        </div>

        <section className="booking-slots">
          <h2 className="section-title">Paso 4 · Horarios disponibles</h2>
          {availabilityLoading ? <p className="muted">Cargando horarios…</p> : null}
          {availabilityError ? <p className="error">{availabilityError}</p> : null}
          {!availabilityLoading && !availabilityError && availableSlots.length === 0 ? (
            <p className="muted">No hay horarios disponibles para esa fecha.</p>
          ) : null}
          <div className="booking-slots-grid">
            {availableSlots.map((slot) => (
              <button
                key={slot.startIso}
                type="button"
                className={`booking-slot-btn${selectedSlot?.startIso === slot.startIso ? " is-selected" : ""}`}
                onClick={() => {
                  setSelectedSlot(slot);
                  setSubmitError("");
                  setSubmitInfo("");
                }}
              >
                {slot.label}
              </button>
            ))}
          </div>
        </section>

        <section className="booking-summary">
          <h2 className="section-title">Paso 5 y 6 · Confirmación</h2>
          <div className="booking-summary-grid">
            <p>
              <strong>Barbero:</strong> {selectedBarber?.name || "—"}
            </p>
            <p>
              <strong>Servicio:</strong> {selectedService?.name || "—"}
            </p>
            <p>
              <strong>Fecha:</strong> {date || "—"}
            </p>
            <p>
              <strong>Hora:</strong> {selectedSlot?.label || "—"}
            </p>
          </div>
          <button
            className="btn btn-primary"
            type="button"
            disabled={!selectedSlot || !selectedBarber || !selectedService || submitting}
            onClick={confirmBooking}
          >
            {submitting ? "Confirmando..." : "Confirmar turno"}
          </button>
        </section>

        {submitError ? <p className="error">{submitError}</p> : null}
        {submitInfo ? <p className="success">{submitInfo}</p> : null}
      </section>
    </main>
  );
}

export default BookingPage;
