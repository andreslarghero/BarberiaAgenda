import { Users } from "lucide-react";
import { useEffect, useState } from "react";
import http from "../api/http";
import { TableListSkeleton } from "../components/Skeletons";

function msg(err, fallback) {
  return err.response?.data?.message || fallback;
}

function ClientsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [info, setInfo] = useState("");
  const [editingId, setEditingId] = useState(null);
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

  const load = async (term = "") => {
    setLoading(true);
    setError("");
    try {
      const query = term ? `?search=${encodeURIComponent(term)}` : "";
      const { data } = await http.get(`/api/clients${query}`);
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(msg(err, "No se pudieron cargar los clientes"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      load(search);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const startEdit = (item) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      phone: item.phone,
      email: item.email || "",
      notes: item.notes || "",
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
      phone: form.phone,
      email: form.email || undefined,
      notes: form.notes || undefined,
    };
    try {
      if (editingId) {
        await http.put(`/api/clients/${editingId}`, body);
        setInfo("Cliente actualizado.");
      } else {
        await http.post("/api/clients", body);
        setInfo("Cliente creado.");
      }
      resetForm();
      await load(search);
    } catch (err) {
      const m = msg(err, editingId ? "No se pudo actualizar el cliente" : "No se pudo crear el cliente");
      setFormError(err.response?.status === 409 ? `Conflicto: ${m}` : m);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="card page-shell">
      <header className="page-header">
        <h2 className="page-title">Clientes</h2>
        <p className="page-lead muted">
          {editingId
            ? `Editando cliente #${editingId}. La API actual no expone borrado de clientes.`
            : "Alta de cliente. Podés buscar por nombre o teléfono abajo."}
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
          placeholder="Teléfono"
          value={form.phone}
          onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
          required
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
          {submitting ? "Guardando..." : editingId ? "Guardar cambios" : "Crear cliente"}
        </button>
        {editingId ? (
          <button className="btn" type="button" onClick={resetForm} disabled={submitting}>
            Cancelar edición
          </button>
        ) : null}
      </form>
      {formError && <p className="error">{formError}</p>}
      {info && <p className="success">{info}</p>}
      <div className="toolbar">
        <input
          placeholder="Buscar por nombre o teléfono"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="btn" type="button" onClick={() => { setSearch(""); load(""); }}>
          Ver todos
        </button>
      </div>
      {loading ? (
        <TableListSkeleton rows={6} columns={6} />
      ) : error && !items.length ? (
        <div>
          <p className="error">{error}</p>
          <button className="btn" type="button" onClick={() => load(search)}>
            Reintentar
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="page-empty-block">
          <Users className="page-empty-visual" size={36} strokeWidth={1.65} aria-hidden />
          <p className="page-empty-title">
            {search.trim() ? "No encontramos clientes con ese criterio" : "Todavía no registraste clientes"}
          </p>
          <p className="page-empty-text muted">
            {search.trim()
              ? "Probá con otro nombre o teléfono, o tocá «Ver todos» para listar la base completa."
              : "Creá fichas simples con nombre y teléfono para asociarlas a los turnos. Podés hacerlo con el formulario de arriba."}
          </p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Teléfono</th>
                <th>Email</th>
                <th>Notas</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.name}</td>
                  <td>{item.phone}</td>
                  <td>{item.email || "—"}</td>
                  <td>{item.notes ? item.notes.slice(0, 30) + (item.notes.length > 30 ? "…" : "") : "—"}</td>
                  <td>
                    <button className="btn btn-small" type="button" onClick={() => startEdit(item)}>
                      Editar
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

export default ClientsPage;
