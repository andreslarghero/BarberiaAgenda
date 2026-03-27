import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import http from "../api/http";

function msg(err, fallback) {
  return err.response?.data?.message || fallback;
}

function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [form, setForm] = useState({
    businessName: "",
    currency: "ARS",
    defaultCommissionRate: 0.4,
  });

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await http.get("/api/settings");
      setForm({
        businessName: data?.businessName || "Agenda Barberia",
        currency: data?.currency || "ARS",
        defaultCommissionRate: Number(data?.defaultCommissionRate ?? 0.4),
      });
    } catch (err) {
      setError(msg(err, "No se pudo cargar la configuración"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setInfo("");
    try {
      const payload = {
        businessName: form.businessName.trim(),
        currency: form.currency.trim().toUpperCase(),
        defaultCommissionRate: Number(form.defaultCommissionRate),
      };
      const { data } = await http.put("/api/settings", payload);
      setForm({
        businessName: data.businessName,
        currency: data.currency,
        defaultCommissionRate: Number(data.defaultCommissionRate),
      });
      setInfo("Configuración guardada.");
    } catch (err) {
      setError(msg(err, "No se pudo guardar la configuración"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="card page-shell">
      <header className="page-header">
        <h2 className="page-title">Configuración del negocio</h2>
        <p className="page-lead muted">
          Ajustá los datos globales del negocio para el panel y el cálculo base de comisiones.
        </p>
      </header>

      {loading ? (
        <p className="muted">Cargando configuración…</p>
      ) : (
        <form className="form-grid" onSubmit={onSubmit}>
          <input
            placeholder="Nombre del negocio"
            value={form.businessName}
            onChange={(e) => setForm((prev) => ({ ...prev, businessName: e.target.value }))}
            required
          />
          <input
            placeholder="Moneda (ej: ARS)"
            value={form.currency}
            onChange={(e) => setForm((prev) => ({ ...prev, currency: e.target.value }))}
            required
          />
          <input
            type="number"
            min="0"
            max="1"
            step="0.01"
            placeholder="Comisión por defecto (0 a 1)"
            value={form.defaultCommissionRate}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                defaultCommissionRate: e.target.value,
              }))
            }
            required
          />
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? "Guardando..." : "Guardar configuración"}
          </button>
          <button className="btn" type="button" onClick={load} disabled={saving}>
            Recargar
          </button>
        </form>
      )}

      {error ? <p className="error">{error}</p> : null}
      {info ? <p className="success">{info}</p> : null}
      <section className="card" style={{ marginTop: 16 }}>
        <header className="page-header">
          <h3 className="page-title">Usuarios y permisos</h3>
          <p className="page-lead muted">
            La gestión de usuarios registrados se movió a una sección dedicada para mejorar claridad operativa.
          </p>
        </header>
        <Link className="btn btn-primary" to="/users">
          Ir a Usuarios registrados
        </Link>
      </section>
    </section>
  );
}

export default SettingsPage;
