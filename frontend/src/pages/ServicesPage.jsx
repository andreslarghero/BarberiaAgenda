import { useEffect, useState } from "react";
import http from "../api/http";

function ServicesPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({
    name: "",
    description: "",
    durationMinutes: 30,
    price: 0,
  });

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await http.get("/api/services");
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || "No se pudieron cargar los servicios");
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
      await http.post("/api/services", {
        name: form.name,
        description: form.description || undefined,
        durationMinutes: Number(form.durationMinutes),
        price: Number(form.price),
      });
      setForm({ name: "", description: "", durationMinutes: 30, price: 0 });
      await load();
    } catch (err) {
      setFormError(err.response?.data?.message || "No se pudo crear el servicio");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="card">
      <h2>Servicios</h2>
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
          placeholder="Duracion (min)"
          value={form.durationMinutes}
          onChange={(e) => setForm((prev) => ({ ...prev, durationMinutes: e.target.value }))}
          required
        />
        <input
          type="number"
          min="0"
          placeholder="Precio"
          value={form.price}
          onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
          required
        />
        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? "Guardando..." : "Crear servicio"}
        </button>
      </form>
      {formError && <p className="error">{formError}</p>}
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
        <p>Sin servicios cargados.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Duracion</th>
              <th>Precio</th>
              <th>Activo</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.name}</td>
                <td>{item.durationMinutes} min</td>
                <td>${item.price}</td>
                <td>{item.isActive ? "Si" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

export default ServicesPage;
