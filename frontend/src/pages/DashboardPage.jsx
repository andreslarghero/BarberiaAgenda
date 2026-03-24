import {
  CalendarClock,
  CalendarDays,
  CalendarOff,
  CalendarRange,
  Scissors,
  Users,
  UserCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import http from "../api/http";
import { DashboardSkeleton } from "../components/Skeletons";
import { useAuth } from "../context/AuthContext";

function msg(err, fallback) {
  return err.response?.data?.message || fallback;
}

function dayRangeIsoLocal(d) {
  const y = d.getFullYear();
  const m = d.getMonth();
  const day = d.getDate();
  const from = new Date(y, m, day, 0, 0, 0, 0);
  const to = new Date(y, m, day, 23, 59, 59, 999);
  return { from: from.toISOString(), to: to.toISOString() };
}

function upcomingRangeIso() {
  const from = new Date();
  from.setSeconds(0, 0);
  const to = new Date(from);
  to.setDate(to.getDate() + 14);
  to.setHours(23, 59, 59, 999);
  return { from: from.toISOString(), to: to.toISOString() };
}

function sortByStartAsc(items) {
  return [...items].sort((a, b) => new Date(a.startDatetime) - new Date(b.startDatetime));
}

function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [clients, setClients] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [services, setServices] = useState([]);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [upcomingRaw, setUpcomingRaw] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const today = new Date();
    const { from: todayFrom, to: todayTo } = dayRangeIsoLocal(today);
    const { from: upFrom, to: upTo } = upcomingRangeIso();
    try {
      const [clientsRes, barbersRes, servicesRes, todayRes, upcomingRes] = await Promise.all([
        http.get("/api/clients"),
        http.get("/api/barbers"),
        http.get("/api/services"),
        http.get("/api/appointments", { params: { from: todayFrom, to: todayTo } }),
        http.get("/api/appointments", { params: { from: upFrom, to: upTo } }),
      ]);
      setClients(Array.isArray(clientsRes.data) ? clientsRes.data : []);
      setBarbers(Array.isArray(barbersRes.data) ? barbersRes.data : []);
      setServices(Array.isArray(servicesRes.data) ? servicesRes.data : []);
      setTodayAppointments(Array.isArray(todayRes.data) ? todayRes.data : []);
      setUpcomingRaw(Array.isArray(upcomingRes.data) ? upcomingRes.data : []);
    } catch (err) {
      setError(msg(err, "No se pudieron cargar los datos del panel."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const activeBarbersCount = barbers.filter((b) => b.isActive).length;
  const activeServicesCount = services.filter((s) => s.isActive).length;
  const clientsTotal = clients.length;

  const todaySorted = sortByStartAsc(todayAppointments);
  const todayNonCancelled = todaySorted.filter((a) => a.status !== "CANCELLED");
  const todayCancelledCount = todaySorted.length - todayNonCancelled.length;

  const nowMs = Date.now();
  const upcoming = sortByStartAsc(
    upcomingRaw.filter((a) => a.status !== "CANCELLED" && new Date(a.startDatetime).getTime() >= nowMs)
  ).slice(0, 8);

  const todayLabel = new Date().toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <p className="dashboard-eyebrow">Panel principal</p>
          <h2 className="dashboard-title">Dashboard</h2>
          <p className="muted dashboard-sub">
            Resumen operativo de <strong>Agenda Barbería</strong>
            {user?.email ? (
              <>
                {" · "}
                <span className="dashboard-user">{user.email}</span>
              </>
            ) : null}
          </p>
        </div>
        <Link to="/appointments" className="btn btn-primary dashboard-cta">
          <CalendarDays size={17} strokeWidth={2} aria-hidden />
          Abrir agenda
        </Link>
      </header>

      {loading ? (
        <DashboardSkeleton />
      ) : error ? (
        <section className="card dashboard-error-card notice-board notice-board--error">
          <p className="error">{error}</p>
          <button type="button" className="btn" onClick={load}>
            Reintentar
          </button>
        </section>
      ) : (
        <>
          <section className="dashboard-metrics" aria-label="Métricas rápidas">
            <article className="dashboard-metric-card dashboard-metric-card--lead">
              <div className="dashboard-metric-label-row">
                <span className="dashboard-metric-label">Turnos hoy</span>
                <CalendarClock className="dashboard-metric-icon" size={20} strokeWidth={2} aria-hidden />
              </div>
              <span className="dashboard-metric-value">{todayNonCancelled.length}</span>
              <span className="dashboard-metric-hint">
                {todayCancelledCount > 0 ? `${todayCancelledCount} cancelados` : "Sin cancelados hoy"}
              </span>
            </article>
            <article className="dashboard-metric-card">
              <div className="dashboard-metric-label-row">
                <span className="dashboard-metric-label">Clientes</span>
                <Users className="dashboard-metric-icon" size={20} strokeWidth={2} aria-hidden />
              </div>
              <span className="dashboard-metric-value">{clientsTotal}</span>
              <span className="dashboard-metric-hint">Registrados en el sistema</span>
            </article>
            <article className="dashboard-metric-card">
              <div className="dashboard-metric-label-row">
                <span className="dashboard-metric-label">Barberos activos</span>
                <UserCircle className="dashboard-metric-icon" size={20} strokeWidth={2} aria-hidden />
              </div>
              <span className="dashboard-metric-value">{activeBarbersCount}</span>
              <span className="dashboard-metric-hint">De {barbers.length} en total</span>
            </article>
            <article className="dashboard-metric-card">
              <div className="dashboard-metric-label-row">
                <span className="dashboard-metric-label">Servicios activos</span>
                <Scissors className="dashboard-metric-icon" size={20} strokeWidth={2} aria-hidden />
              </div>
              <span className="dashboard-metric-value">{activeServicesCount}</span>
              <span className="dashboard-metric-hint">De {services.length} en total</span>
            </article>
          </section>

          <div className="dashboard-columns">
            <section className="card dashboard-panel dashboard-panel--day">
              <div className="dashboard-panel-head">
                <h3 className="dashboard-panel-title">Estado del día</h3>
                <p className="muted dashboard-panel-date">{todayLabel}</p>
              </div>
              {todayNonCancelled.length === 0 ? (
                <div className="dashboard-empty">
                  <CalendarOff className="dashboard-empty-icon" size={40} strokeWidth={1.75} aria-hidden />
                  <p className="dashboard-empty-title">Hoy no hay turnos agendados</p>
                  <p className="dashboard-empty-text">
                    Tu equipo puede tomar reservas cuando quieras. Abrí la agenda para crear el primer turno del día o
                    revisá otras fechas.
                  </p>
                  <Link to="/appointments" className="btn btn-small btn-with-icon">
                    <CalendarDays size={15} strokeWidth={2} aria-hidden />
                    Ir a la agenda
                  </Link>
                </div>
              ) : (
                <>
                  <p className="dashboard-summary">
                    <strong>{todayNonCancelled.length}</strong>{" "}
                    {todayNonCancelled.length === 1 ? "turno activo" : "turnos activos"} para hoy.
                  </p>
                  <ul className="dashboard-today-list dashboard-today-list--premium">
                    {todayNonCancelled.slice(0, 6).map((a) => (
                      <li key={a.id} className="dashboard-today-item dashboard-today-item--tile">
                        <span className="dashboard-today-time">
                          {new Date(a.startDatetime).toLocaleTimeString("es-AR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <div className="dashboard-today-body">
                          <span className="dashboard-today-client">
                            {a.client?.name || `Cliente #${a.clientId}`}
                          </span>
                          <span className="dashboard-today-meta">
                            {a.barber?.name || `Barbero #${a.barberId}`} ·{" "}
                            {a.service?.name || `Servicio #${a.serviceId}`}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                  {todayNonCancelled.length > 6 ? (
                    <p className="muted dashboard-more">
                      +{todayNonCancelled.length - 6} más en la{" "}
                      <Link to="/appointments">agenda</Link>
                    </p>
                  ) : null}
                </>
              )}
            </section>

            <section className="card dashboard-panel dashboard-panel--upcoming">
              <div className="dashboard-panel-head">
                <h3 className="dashboard-panel-title">Próximos turnos</h3>
                <p className="muted dashboard-panel-sub">Próximas 2 semanas · no cancelados</p>
              </div>
              {upcoming.length === 0 ? (
                <div className="dashboard-empty dashboard-empty--soft">
                  <CalendarRange className="dashboard-empty-icon" size={36} strokeWidth={1.75} aria-hidden />
                  <p className="dashboard-empty-title">No hay turnos en las próximas dos semanas</p>
                  <p className="dashboard-empty-text">
                    Cuando agendes citas futuras, verás acá un resumen con día y hora. Podés planificar todo desde la
                    agenda.
                  </p>
                  <Link to="/appointments" className="btn btn-small btn-ghost btn-with-icon">
                    <CalendarDays size={15} strokeWidth={2} aria-hidden />
                    Planificar en agenda
                  </Link>
                </div>
              ) : (
                <ul className="dashboard-upcoming-list dashboard-upcoming-list--premium">
                  {upcoming.map((a) => (
                    <li key={a.id} className="dashboard-upcoming-item dashboard-upcoming-item--tile">
                      <div className="dashboard-upcoming-when">
                        <span className="dashboard-upcoming-day">
                          {new Date(a.startDatetime).toLocaleDateString("es-AR", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                        <span className="dashboard-upcoming-hour">
                          {new Date(a.startDatetime).toLocaleTimeString("es-AR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <div className="dashboard-upcoming-body">
                        <span className="dashboard-upcoming-client">
                          {a.client?.name || `Cliente #${a.clientId}`}
                        </span>
                        <span className="dashboard-upcoming-meta">
                          {a.barber?.name || `Barbero #${a.barberId}`} ·{" "}
                          {a.service?.name || `Servicio #${a.serviceId}`}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}

export default DashboardPage;
