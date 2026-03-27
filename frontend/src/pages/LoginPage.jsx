import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function LoginPage() {
  const [email, setEmail] = useState("admin@agendabarberia.com");
  const [password, setPassword] = useState("123456");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await login({ email, password });
      const to = location.state?.from?.pathname || "/dashboard";
      navigate(to, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-page-bg" aria-hidden />
      <form className="card login-card" onSubmit={onSubmit}>
        <div className="login-card-head">
          <span className="brand-mark brand-mark--lg" aria-hidden />
          <h1 className="login-title">Agenda Barbería</h1>
          <p className="login-lead muted">Iniciá sesión para acceder al panel</p>
        </div>
        <div className="login-fields">
          <label className="field-label">
            <span className="field-label-text">Email</span>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required autoComplete="email" />
          </label>
          <label className="field-label">
            <span className="field-label-text">Contraseña</span>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
              autoComplete="current-password"
            />
          </label>
        </div>
        {error ? (
          <div className="login-error" role="alert">
            {error}
          </div>
        ) : null}
        <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
          {loading ? "Ingresando…" : "Ingresar"}
        </button>
        <div className="login-divider" aria-hidden />
        <Link className="btn btn-block login-booking-link" to="/booking">
          Reservar turno (clientes)
        </Link>
        <p className="login-booking-help muted">
          Si sos cliente, usá este acceso para entrar directo al flujo de reservas.
        </p>
      </form>
    </div>
  );
}

export default LoginPage;
