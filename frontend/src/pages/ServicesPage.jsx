import { PackageOpen } from "lucide-react";
import { useEffect, useState } from "react";
import http from "../api/http";
import { TableListSkeleton } from "../components/Skeletons";

function msg(err, fallback) {
  return err.response?.data?.message || fallback;
}

function ServicesPage() {
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
    description: "",
    durationMinutes: 30,
    price: 0,
  });

  const resetForm = () => {
    setForm({ name: "", description: "", durationMinutes: 30, price: 0 });
    setEditingId(null);
    setFormError("");
  };

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await http.get("/api/services");
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(msg(err, "No se pudieron cargar los servicios"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const startEdit = (item) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      description: item.description || "",
      durationMinutes: item.durationMinutes,
      price: item.price,
    });
    setFormError("");
    setInfo("");
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");
    setInfo("");
    const body = {
      name: form.name,
      description: form.description || undefined,
      durationMinutes: Number(form.durationMinutes),
      price: Number(form.price),
    };
    try {
      if (editingId) {
        await http.put(`/api/services/${editingId}`, body);
        setInfo("Servicio actualizado.");
      } else {
        await http.post("/api/services", body);
        setInfo("Servicio creado.");
      }
      resetForm();
      await load();
    } catch (err) {
      const m = msg(err, editingId ? "No se pudo actualizar el servicio" : "No se pudo crear el servicio");
      setFormError(err.response?.status === 409 ? `Conflicto: ${m}` : m);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (item) => {
    setStatusBusyId(item.id);
    setError("");
    setInfo("");
    try {
      await http.patch(`/api/services/${item.id}/status`, { isActive: !item.isActive });
      setInfo(item.isActive ? "Servicio desactivado." : "Servicio reactivado.");
      await load();
    } catch (err) {
      setError(msg(err, "No se pudo cambiar el estado del servicio"));
    } finally {
      setStatusBusyId(null);
    }
  };

  return (
    <section className="card page-shell">
      <header className="page-header">
        <h2 className="page-title">Servicios</h2>
        <p className="page-lead muted">
          {editingId
            ? `Editando servicio #${editingId}. Guardá los cambios o cancelá.`
            : "Completá el formulario para dar de alta un servicio."}
        </p>
      </header>
      <form className="form-grid" onSubmit={onSubmit}>
        <input
          placeholder="Nombre"
          value={form.name}
          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          required
        />
        <input
          placeholder="Descripcion"
          value={form.description}
          onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
        />
        <input
          type="number"
          min="1"
          placeholder="Duración (min)"
          value={form.durationMinutes}
          onChange={(e) => setForm((prev) => ({ ...prev, durationMinutes: e.target.value }))}
          required
        />
        <input
          type="number"
          min="0"
          step="0.01"
          placeholder="Precio"
          value={form.price}
          onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
          required
        />
        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? "Guardando..." : editingId ? "Guardar cambios" : "Crear servicio"}
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
        <TableListSkeleton rows={7} columns={7} />
      ) : error && !items.length ? (
        <div>
          <p className="error">{error}</p>
          <button className="btn" type="button" onClick={load}>
            Reintentar
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="page-empty-block">
          <PackageOpen className="page-empty-visual" size={36} strokeWidth={1.65} aria-hidden />
          <p className="page-empty-title">Todavía no hay servicios</p>
          <p className="page-empty-text muted">
            Los servicios definen duración y precio de cada corte o tratamiento. Creá el primero con el formulario de
            arriba para poder agendar turnos con ese tipo de trabajo.
          </p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Duración</th>
                <th>Precio</th>
                <th>Activo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.name}</td>
                  <td>{item.description ? item.description.slice(0, 40) + (item.description.length > 40 ? "…" : "") : "—"}</td>
                  <td>{item.durationMinutes} min</td>
                  <td>${item.price}</td>
                  <td>
                    <span className={`badge ${item.isActive ? "badge--success" : "badge--neutral"}`}>
                      {item.isActive ? "Activo" : "Inactivo"}
                    </span>
                  </td>
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
                      {statusBusyId === item.id ? "…" : item.isActive ? "Desactivar" : "Reactivar"}
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

export default ServicesPage;
