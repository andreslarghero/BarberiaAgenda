import { useEffect, useState } from "react";
import http from "../api/http";

function AppointmentsPage() {
  const [items, setItems] = useState([]);
  const [services, setServices] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [actionError, setActionError] = useState("");
  const [actingId, setActingId] = useState(null);
  const [form, setForm] = useState({
    clientId: "",
    barberId: "",
    serviceId: "",
    startDatetime: "",
    notes: "",
  });

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

      if (!form.serviceId && serviceItems[0]?.id) {
        setForm((prev) => ({ ...prev, serviceId: String(serviceItems[0].id) }));
      }
      if (!form.barberId && barberItems[0]?.id) {
        setForm((prev) => ({ ...prev, barberId: String(barberItems[0].id) }));
      }
      if (!form.clientId && clientItems[0]?.id) {
        setForm((prev) => ({ ...prev, clientId: String(clientItems[0].id) }));
      }
    } catch (err) {
      setError(err.response?.data?.message || "No se pudieron cargar los turnos");
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
    try {
      await http.post("/api/appointments", {
        clientId: Number(form.clientId),
        barberId: Number(form.barberId),
        serviceId: Number(form.serviceId),
        startDatetime: new Date(form.startDatetime).toISOString(),
        notes: form.notes || undefined,
      });
      setForm((prev) => ({ ...prev, startDatetime: "", notes: "" }));
      await load();
    } catch (err) {
      setFormError(err.response?.data?.message || "No se pudo crear el turno");
    } finally {
      setSubmitting(false);
    }
  };

  const cancelAppointment = async (id) => {
    setActingId(id);
    setActionError("");
    try {
      await http.patch(`/api/appointments/${id}/cancel`, { reason: "Cancelado desde UI" });
      await load();
    } catch (err) {
      setActionError(err.response?.data?.message || "No se pudo cancelar");
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
      setActionError(err.response?.data?.message || "No se pudo completar");
    } finally {
      setActingId(null);
    }
  };

  return (
    <section className="card">
      <h2>Agenda / Turnos</h2>
      <p>Vista inicial del MVP consumiendo turnos actuales.</p>
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
          {barbers.map((item) => (
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
          {services.map((item) => (
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
        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? "Guardando..." : "Crear turno"}
        </button>
      </form>
      {formError && <p className="error">{formError}</p>}
      {actionError && <p className="error">{actionError}</p>}
      {loading ? (
        <p>Cargando...</p>
      ) : error ? (
        <div>
          <p className="error">{error}</p>
          <button className="btn" onClick={load}>
            Reintentar
          </button>
        </div>
      ) : items.length === 0 ? (
        <p>Sin turnos registrados.</p>
      ) : (
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
                    disabled={actingId === item.id || item.status === "CANCELLED" || item.status === "COMPLETED"}
                    onClick={() => cancelAppointment(item.id)}
                  >
                    Cancelar
                  </button>
                  <button
                    className="btn btn-small"
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
      )}
    </section>
  );
}

export default AppointmentsPage;
