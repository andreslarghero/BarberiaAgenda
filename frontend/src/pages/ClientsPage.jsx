import { useEffect, useState } from "react";
import http from "../api/http";

function ClientsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    notes: "",
  });

  const load = async (term = "") => {
    setLoading(true);
    setError("");
    try {
      const query = term ? `?search=${encodeURIComponent(term)}` : "";
      const { data } = await http.get(`/api/clients${query}`);
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || "No se pudieron cargar los clientes");
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
      await http.post("/api/clients", {
        name: form.name,
        phone: form.phone,
        email: form.email || undefined,
        notes: form.notes || undefined,
      });
      setForm({ name: "", phone: "", email: "", notes: "" });
      await load(search);
    } catch (err) {
      setFormError(err.response?.data?.message || "No se pudo crear el cliente");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="card">
      <h2>Clientes</h2>
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
          {submitting ? "Guardando..." : "Crear cliente"}
        </button>
      </form>
      {formError && <p className="error">{formError}</p>}
      <div className="toolbar">
        <input
          placeholder="Buscar por nombre o telefono"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="btn" onClick={() => load(search)}>
          Buscar
        </button>
      </div>
      {loading ? (
        <p>Cargando...</p>
      ) : error ? (
        <div>
          <p className="error">{error}</p>
          <button className="btn" onClick={() => load(search)}>
            Reintentar
          </button>
        </div>
      ) : items.length === 0 ? (
        <p>Sin clientes para mostrar.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Telefono</th>
              <th>Email</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.name}</td>
                <td>{item.phone}</td>
                <td>{item.email || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

export default ClientsPage;
