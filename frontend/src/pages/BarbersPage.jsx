import { useEffect, useState } from "react";
import http from "../api/http";

function msg(err, fallback) {
  return err.response?.data?.message || fallback;
}

function BarbersPage() {
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

  return (
    <section className="card">
      <h2>Barberos</h2>
      <p className="muted">
        {editingId
          ? `Editando barbero #${editingId}. Guardá los cambios o cancelá.`
          : "Completá el formulario para dar de alta un barbero."}
      </p>
      <form className="form-grid" onSubmit={onSubmit}>
        <input
          placeholder="Nombre"
          value={form.name}
          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          required
        />
        <input
          placeholder="Telefono"
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
      {formError && <p className="error">{formError}</p>}
      {info && <p className="success">{info}</p>}
      {loading ? (
        <p>Cargando...</p>
      ) : error && !items.length ? (
        <div>
          <p className="error">{error}</p>
          <button className="btn" type="button" onClick={load}>
            Reintentar
          </button>
        </div>
      ) : items.length === 0 ? (
        <p className="muted">Sin barberos cargados.</p>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Telefono</th>
                <th>Email</th>
                <th>Activo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.name}</td>
                  <td>{item.phone || "-"}</td>
                  <td>{item.email || "-"}</td>
                  <td>{item.isActive ? "Si" : "No"}</td>
                  <td className="actions-cell">
                    <button className="btn btn-small" type="button" onClick={() => startEdit(item)}>
                      Editar
                    </button>
                    <button
                      className="btn btn-small btn-danger"
                      type="button"
                      disabled={statusBusyId === item.id}
                      onClick={() => toggleActive(item)}
                    >
                      {statusBusyId === item.id ? "..." : item.isActive ? "Desactivar" : "Reactivar"}
                    </button>
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
