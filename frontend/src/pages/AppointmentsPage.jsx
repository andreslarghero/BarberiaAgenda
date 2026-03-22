import { useEffect, useRef, useState } from "react";
import http from "../api/http";

function msg(err, fallback) {
  return err.response?.data?.message || fallback;
}

function toDatetimeLocalValue(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function AppointmentsPage() {
  const [items, setItems] = useState([]);
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
  const [form, setForm] = useState({
    clientId: "",
    barberId: "",
    serviceId: "",
    startDatetime: "",
    notes: "",
  });

  const emptyFormDefaults = (serviceItems, barberItems, clientItems) => ({
    clientId: clientItems[0]?.id ? String(clientItems[0].id) : "",
    barberId: barberItems[0]?.id ? String(barberItems[0].id) : "",
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

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [appointmentsRes, servicesRes, barbersRes, clientsRes] = await Promise.all([
        http.get("/api/appointments"),
        http.get("/api/services"),
        http.get("/api/barbers"),
        http.get("/api/clients"),
      ]);
      const appointmentItems = Array.isArray(appointmentsRes.data) ? appointmentsRes.data : [];
      const serviceItems = Array.isArray(servicesRes.data) ? servicesRes.data : [];
      const barberItems = Array.isArray(barbersRes.data) ? barbersRes.data : [];
      const clientItems = Array.isArray(clientsRes.data) ? clientsRes.data : [];

      setItems(appointmentItems);
      setServices(serviceItems);
      setBarbers(barberItems);
      setClients(clientItems);

      const firstActiveServices = serviceItems.filter((s) => s.isActive);
      const firstActiveBarbers = barberItems.filter((b) => b.isActive);
      setForm((prev) => {
        if (editingIdRef.current) return prev;
        const next = { ...prev };
        if (!next.serviceId && firstActiveServices[0]?.id) next.serviceId = String(firstActiveServices[0].id);
        if (!next.barberId && firstActiveBarbers[0]?.id) next.barberId = String(firstActiveBarbers[0].id);
        if (!next.clientId && clientItems[0]?.id) next.clientId = String(clientItems[0].id);
        return next;
      });
    } catch (err) {
      setError(msg(err, "No se pudieron cargar los turnos"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- carga inicial
  }, []);

  const resetCreateForm = () => {
    editingIdRef.current = null;
    setEditingId(null);
    setForm(emptyFormDefaults(activeServices, activeBarbers, clients));
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
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");
    setInfo("");
    const body = {
      clientId: Number(form.clientId),
      barberId: Number(form.barberId),
      serviceId: Number(form.serviceId),
      startDatetime: new Date(form.startDatetime).toISOString(),
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
      setForm((prev) => ({ ...prev, startDatetime: "", notes: "" }));
      await load();
    } catch (err) {
      const status = err.response?.status;
      const m = msg(err, editingId ? "No se pudo actualizar el turno" : "No se pudo crear el turno");
      if (status === 409) {
        setFormError(
          `Superposición u horario no disponible: ${m}`
        );
      } else {
        setFormError(m);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const cancelAppointment = async (id) => {
    setActingId(id);
    setActionError("");
    try {
      await http.patch(`/api/appointments/${id}/cancel`, { reason: "Cancelado desde UI" });
      if (editingId === id) {
        editingIdRef.current = null;
        setEditingId(null);
        setForm(emptyFormDefaults(activeServices, activeBarbers, clients));
        setFormError("");
      }
      await load();
    } catch (err) {
      setActionError(msg(err, "No se pudo cancelar"));
    } finally {
      setActingId(null);
    }
  };

  const completeAppointment = async (id) => {
    setActingId(id);
    setActionError("");
    try {
      await http.patch(`/api/appointments/${id}/complete`);
      await load();
    } catch (err) {
      setActionError(msg(err, "No se pudo completar"));
    } finally {
      setActingId(null);
    }
  };

  const missingRefs = !clients.length || !activeBarbers.length || !activeServices.length;

  return (
    <section className="card">
      <h2>Agenda / Turnos</h2>
      <p className="muted">
        {editingId
          ? `Editando turno #${editingId}. Guardá o cancelá la edición.`
          : "Creá un turno eligiendo cliente, barbero, servicio e inicio. El fin se calcula según la duración del servicio."}
      </p>
      {missingRefs ? (
        <p className="error">
          Faltan datos: necesitás al menos un cliente, un barbero y un servicio activos para crear turnos.
        </p>
      ) : null}
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
          onChange={(e) => setForm((prev) => ({ ...prev, startDatetime: e.target.value }))}
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
      {formError && <p className="error">{formError}</p>}
      {info && <p className="success">{info}</p>}
      {actionError && <p className="error">{actionError}</p>}
      {loading ? (
        <p>Cargando...</p>
      ) : error ? (
        <div>
          <p className="error">{error}</p>
          <button className="btn" type="button" onClick={load}>
            Reintentar
          </button>
        </div>
      ) : items.length === 0 ? (
        <p className="muted">Sin turnos registrados.</p>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Barbero</th>
                <th>Cliente</th>
                <th>Servicio</th>
                <th>Inicio</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.barber?.name || item.barberId}</td>
                  <td>{item.client?.name || item.clientId}</td>
                  <td>{item.service?.name || item.serviceId}</td>
                  <td>{new Date(item.startDatetime).toLocaleString()}</td>
                  <td>{item.status}</td>
                  <td className="actions-cell">
                    <button
                      className="btn btn-small"
                      type="button"
                      disabled={item.status === "CANCELLED"}
                      onClick={() => startEdit(item)}
                    >
                      Editar
                    </button>
                    <button
                      className="btn btn-small"
                      type="button"
                      disabled={actingId === item.id || item.status === "CANCELLED" || item.status === "COMPLETED"}
                      onClick={() => cancelAppointment(item.id)}
                    >
                      Cancelar
                    </button>
                    <button
                      className="btn btn-small"
                      type="button"
                      disabled={actingId === item.id || item.status === "COMPLETED" || item.status === "CANCELLED"}
                      onClick={() => completeAppointment(item.id)}
                    >
                      Completar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default AppointmentsPage;
