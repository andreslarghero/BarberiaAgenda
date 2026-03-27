import { UserCircle } from "lucide-react";
import { useEffect, useState } from "react";
import http from "../api/http";
import { TableListSkeleton } from "../components/Skeletons";
import { useAuth } from "../context/AuthContext";

function msg(err, fallback) {
  return err.response?.data?.message || fallback;
}

const DAY_OPTIONS = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
];

function dayLabel(dayOfWeek) {
  const found = DAY_OPTIONS.find((d) => d.value === dayOfWeek);
  return found ? found.label : `Día ${dayOfWeek}`;
}

function BarbersPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [info, setInfo] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [statusBusyId, setStatusBusyId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    notes: "",
  });
  const [scheduleBarber, setScheduleBarber] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleError, setScheduleError] = useState("");
  const [scheduleInfo, setScheduleInfo] = useState("");
  const [scheduleSubmitting, setScheduleSubmitting] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({
    dayOfWeek: 1,
    startTime: "09:00",
    endTime: "18:00",
    isWorkingDay: true,
  });

  const resetForm = () => {
    setForm({ name: "", phone: "", email: "", notes: "" });
    setEditingId(null);
    setFormError("");
  };

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await http.get("/api/barbers");
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(msg(err, "No se pudieron cargar los barberos"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");
    setInfo("");
    const body = {
      name: form.name,
      phone: form.phone || undefined,
      email: form.email || undefined,
      notes: form.notes || undefined,
    };
    try {
      if (editingId) {
        await http.put(`/api/barbers/${editingId}`, body);
        setInfo("Barbero actualizado.");
      } else {
        await http.post("/api/barbers", body);
        setInfo("Barbero creado.");
      }
      resetForm();
      await load();
    } catch (err) {
      const m = msg(err, editingId ? "No se pudo actualizar el barbero" : "No se pudo crear el barbero");
      setFormError(err.response?.status === 409 ? `Conflicto: ${m}` : m);
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      phone: item.phone || "",
      email: item.email || "",
      notes: item.notes || "",
    });
    setFormError("");
    setInfo("");
    setError("");
  };

  const toggleActive = async (item) => {
    setStatusBusyId(item.id);
    setError("");
    setInfo("");
    try {
      await http.patch(`/api/barbers/${item.id}/status`, { isActive: !item.isActive });
      setInfo(item.isActive ? "Barbero desactivado." : "Barbero reactivado.");
      await load();
    } catch (err) {
      setError(msg(err, "No se pudo cambiar el estado del barbero"));
    } finally {
      setStatusBusyId(null);
    }
  };

  const resetScheduleForm = () => {
    setEditingScheduleId(null);
    setScheduleForm({
      dayOfWeek: 1,
      startTime: "09:00",
      endTime: "18:00",
      isWorkingDay: true,
    });
  };

  const loadSchedulesForBarber = async (barber) => {
    setScheduleBarber(barber);
    setScheduleLoading(true);
    setScheduleError("");
    setScheduleInfo("");
    resetScheduleForm();
    try {
      const { data } = await http.get(`/api/barbers/${barber.id}/schedules`);
      setSchedules(Array.isArray(data) ? data : []);
    } catch (err) {
      setSchedules([]);
      setScheduleError(msg(err, "No se pudieron cargar los horarios del barbero"));
    } finally {
      setScheduleLoading(false);
    }
  };

  const startEditSchedule = (row) => {
    setEditingScheduleId(row.id);
    setScheduleForm({
      dayOfWeek: row.dayOfWeek,
      startTime: row.startTime,
      endTime: row.endTime,
      isWorkingDay: row.isWorkingDay,
    });
    setScheduleError("");
    setScheduleInfo("");
  };

  const submitSchedule = async (e) => {
    e.preventDefault();
    if (!scheduleBarber) return;
    setScheduleSubmitting(true);
    setScheduleError("");
    setScheduleInfo("");
    const payload = {
      dayOfWeek: Number(scheduleForm.dayOfWeek),
      startTime: scheduleForm.startTime,
      endTime: scheduleForm.endTime,
      isWorkingDay: Boolean(scheduleForm.isWorkingDay),
    };
    try {
      if (editingScheduleId) {
        await http.put(`/api/schedules/${editingScheduleId}`, {
          ...payload,
          barberId: scheduleBarber.id,
        });
        setScheduleInfo("Horario actualizado.");
      } else {
        await http.post(`/api/barbers/${scheduleBarber.id}/schedules`, payload);
        setScheduleInfo("Horario agregado.");
      }
      await loadSchedulesForBarber(scheduleBarber);
    } catch (err) {
      setScheduleError(msg(err, "No se pudo guardar el horario"));
    } finally {
      setScheduleSubmitting(false);
    }
  };

  const removeSchedule = async (row) => {
    if (!scheduleBarber) return;
    const ok = window.confirm("¿Eliminar este horario?");
    if (!ok) return;
    setScheduleError("");
    setScheduleInfo("");
    try {
      await http.delete(`/api/schedules/${row.id}`);
      setScheduleInfo("Horario eliminado.");
      await loadSchedulesForBarber(scheduleBarber);
    } catch (err) {
      setScheduleError(msg(err, "No se pudo eliminar el horario"));
    }
  };

  return (
    <section className="card page-shell">
      <header className="page-header">
        <h2 className="page-title">Barberos</h2>
        <p className="page-lead muted">
          {editingId
            ? `Editando barbero #${editingId}. Guardá los cambios o cancelá.`
            : "Completá el formulario para dar de alta un barbero."}
        </p>
      </header>
      {isAdmin ? (
      <form className="form-grid" onSubmit={onSubmit}>
        <input
          placeholder="Nombre"
          value={form.name}
          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          required
        />
        <input
          placeholder="Teléfono"
          value={form.phone}
          onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
        />
        <input
          placeholder="Email"
          type="email"
          value={form.email}
          onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
        />
        <input
          placeholder="Notas"
          value={form.notes}
          onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
        />
        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? "Guardando..." : editingId ? "Guardar cambios" : "Crear barbero"}
        </button>
        {editingId ? (
          <button className="btn" type="button" onClick={resetForm} disabled={submitting}>
            Cancelar edición
          </button>
        ) : null}
      </form>
      ) : (
        <p className="muted" style={{ marginBottom: 12 }}>
          Como BARBER podés consultar y editar tu disponibilidad desde esta pantalla.
        </p>
      )}
      {formError && <p className="error">{formError}</p>}
      {info && <p className="success">{info}</p>}
      {scheduleBarber ? (
        <section className="card" style={{ marginBottom: 16 }}>
          <header className="page-header">
            <h3 className="page-title">Disponibilidad de {scheduleBarber.name}</h3>
            <p className="page-lead muted">Cargá los bloques de horario laboral que estarán disponibles para reservas.</p>
          </header>
          <form className="form-grid" onSubmit={submitSchedule}>
            <select
              value={scheduleForm.dayOfWeek}
              onChange={(e) =>
                setScheduleForm((prev) => ({
                  ...prev,
                  dayOfWeek: Number(e.target.value),
                }))
              }
            >
              {DAY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <input
              type="time"
              value={scheduleForm.startTime}
              onChange={(e) => setScheduleForm((prev) => ({ ...prev, startTime: e.target.value }))}
              required
            />
            <input
              type="time"
              value={scheduleForm.endTime}
              onChange={(e) => setScheduleForm((prev) => ({ ...prev, endTime: e.target.value }))}
              required
            />
            <label style={{ margin: 0, alignItems: "flex-start", justifyContent: "center" }}>
              <span className="muted">Día laboral</span>
              <input
                type="checkbox"
                checked={scheduleForm.isWorkingDay}
                onChange={(e) => setScheduleForm((prev) => ({ ...prev, isWorkingDay: e.target.checked }))}
              />
            </label>
            <button className="btn btn-primary" type="submit" disabled={scheduleSubmitting}>
              {scheduleSubmitting ? "Guardando..." : editingScheduleId ? "Actualizar horario" : "Agregar horario"}
            </button>
            {editingScheduleId ? (
              <button className="btn" type="button" onClick={resetScheduleForm} disabled={scheduleSubmitting}>
                Cancelar edición
              </button>
            ) : (
              <button className="btn" type="button" onClick={() => setScheduleBarber(null)}>
                Cerrar disponibilidad
              </button>
            )}
          </form>
          {scheduleError ? <p className="error">{scheduleError}</p> : null}
          {scheduleInfo ? <p className="success">{scheduleInfo}</p> : null}
          {scheduleLoading ? (
            <p className="muted">Cargando horarios…</p>
          ) : schedules.length === 0 ? (
            <p className="muted">Este barbero aún no tiene horarios cargados.</p>
          ) : (
            <div className="table-wrap mobile-table-wrap">
              <table className="table mobile-card-table">
                <thead>
                  <tr>
                    <th>Día</th>
                    <th>Inicio</th>
                    <th>Fin</th>
                    <th>Laboral</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.map((row) => (
                    <tr key={row.id}>
                      <td data-label="Día">{dayLabel(row.dayOfWeek)}</td>
                      <td data-label="Inicio">{row.startTime}</td>
                      <td data-label="Fin">{row.endTime}</td>
                      <td data-label="Laboral">
                        <span className={`badge ${row.isWorkingDay ? "badge--success" : "badge--neutral"}`}>
                          {row.isWorkingDay ? "Sí" : "No"}
                        </span>
                      </td>
                      <td className="actions-cell" data-label="Acciones">
                        <button className="btn btn-small" type="button" onClick={() => startEditSchedule(row)}>
                          Editar
                        </button>
                        <button className="btn btn-small btn-danger" type="button" onClick={() => removeSchedule(row)}>
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}
      {loading ? (
        <TableListSkeleton rows={6} columns={6} />
      ) : error && !items.length ? (
        <div>
          <p className="error">{error}</p>
          <button className="btn" type="button" onClick={load}>
            Reintentar
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="page-empty-block">
          <UserCircle className="page-empty-visual" size={36} strokeWidth={1.65} aria-hidden />
          <p className="page-empty-title">Sumá al primer barbero</p>
          <p className="page-empty-text muted">
            Sin barberos activos no podés asignar turnos en la agenda. Usá el formulario de arriba para dar de alta al
            equipo con nombre y datos de contacto.
          </p>
        </div>
      ) : (
        <div className="table-wrap mobile-table-wrap">
          <table className="table mobile-card-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Teléfono</th>
                <th>Email</th>
                <th>Activo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td data-label="ID">{item.id}</td>
                  <td data-label="Nombre">{item.name}</td>
                  <td data-label="Teléfono">{item.phone || "-"}</td>
                  <td data-label="Email">{item.email || "-"}</td>
                  <td data-label="Activo">
                    <span className={`badge ${item.isActive ? "badge--success" : "badge--neutral"}`}>
                      {item.isActive ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="actions-cell" data-label="Acciones">
                    {isAdmin ? (
                      <button className="btn btn-small" type="button" onClick={() => startEdit(item)}>
                        Editar
                      </button>
                    ) : null}
                    {isAdmin || user?.barberId === item.id ? (
                      <button className="btn btn-small" type="button" onClick={() => loadSchedulesForBarber(item)}>
                        Disponibilidad
                      </button>
                    ) : null}
                    {isAdmin ? (
                      <button
                        className="btn btn-small btn-danger"
                        type="button"
                        disabled={statusBusyId === item.id}
                        onClick={() => toggleActive(item)}
                      >
                        {statusBusyId === item.id ? "..." : item.isActive ? "Desactivar" : "Reactivar"}
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {error && items.length > 0 ? <p className="error">{error}</p> : null}
    </section>
  );
}

export default BarbersPage;
