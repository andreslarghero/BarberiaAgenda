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

function ymdLocal(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseYmdLocal(value) {
  const [y, m, d] = String(value || "").split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1, 12, 0, 0, 0);
}

function shiftYmd(baseYmd, days) {
  const date = parseYmdLocal(baseYmd);
  date.setDate(date.getDate() + days);
  return ymdLocal(date);
}

function money(value) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2,
  }).format(amount);
}

function trendText(diff, percent, { positive = "Subió", negative = "Bajó", neutral = "Sin cambios" } = {}) {
  const safeDiff = Number(diff || 0);
  if (safeDiff === 0) return neutral;
  const direction = safeDiff > 0 ? positive : negative;
  const absDiff = Math.abs(safeDiff);
  if (percent === null || percent === undefined) {
    return `${direction} ${absDiff}`;
  }
  return `${direction} ${absDiff} (${Math.abs(Number(percent || 0)).toFixed(1)}%)`;
}

function DashboardPage() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(() => ymdLocal(new Date()));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [clients, setClients] = useState([]);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [upcomingRaw, setUpcomingRaw] = useState([]);
  const [businessSummary, setBusinessSummary] = useState({
    date: "",
    totalRevenueToday: 0,
    completedAppointmentsToday: 0,
    revenueByService: [],
    revenueByBarber: [],
  });
  const [overview, setOverview] = useState({
    date: "",
    totalRevenueToday: 0,
    totalRevenueWeek: 0,
    totalRevenueMonth: 0,
    completedAppointmentsToday: 0,
    completedAppointmentsWeek: 0,
    completedAppointmentsMonth: 0,
    revenueDeltaToday: 0,
    revenueDeltaWeek: 0,
    revenueDeltaMonth: 0,
    completedDeltaToday: 0,
    completedDeltaWeek: 0,
    completedDeltaMonth: 0,
    comparisons: {
      revenue: {
        today: { current: 0, previous: 0, diff: 0, percentChange: null },
        week: { current: 0, previous: 0, diff: 0, percentChange: null },
        month: { current: 0, previous: 0, diff: 0, percentChange: null },
      },
      completed: {
        today: { current: 0, previous: 0, diff: 0, percentChange: null },
        week: { current: 0, previous: 0, diff: 0, percentChange: null },
        month: { current: 0, previous: 0, diff: 0, percentChange: null },
      },
    },
  });
  const [commissions, setCommissions] = useState({
    date: "",
    items: [],
  });
  const [exporting, setExporting] = useState("");
  const [exportInfo, setExportInfo] = useState("");
  const [exportError, setExportError] = useState("");

  const downloadCsv = async (type) => {
    setExporting(type);
    setExportInfo("");
    setExportError("");
    const endpointByType = {
      appointments: "/api/dashboard/export/appointments",
      summary: "/api/dashboard/export/summary",
      commissions: "/api/dashboard/export/commissions",
    };
    const endpoint = endpointByType[type];
    try {
      const response = await http.get(endpoint, {
        params: { date: selectedDate },
        responseType: "blob",
      });
      const blob = new Blob([response.data], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      const filename = `${type}-${selectedDate}.csv`;
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setExportInfo(`Exportación lista: ${filename}`);
    } catch (err) {
      setExportError(msg(err, "No se pudo exportar el CSV"));
    } finally {
      setExporting("");
    }
  };

  const load = useCallback(async (dateValue) => {
    setLoading(true);
    setError("");
    const safeDate = dateValue || ymdLocal(new Date());
    const dayDate = parseYmdLocal(safeDate);
    const { from: todayFrom, to: todayTo } = dayRangeIsoLocal(dayDate);
    const { from: upFrom, to: upTo } = upcomingRangeIso();
    try {
      const [clientsRes, todayRes, upcomingRes, summaryRes, overviewRes, commissionsRes] = await Promise.all([
        http.get("/api/clients"),
        http.get("/api/appointments", { params: { from: todayFrom, to: todayTo } }),
        http.get("/api/appointments", { params: { from: upFrom, to: upTo } }),
        http.get("/api/dashboard/summary", { params: { date: safeDate } }),
        http.get("/api/dashboard/overview", { params: { date: safeDate } }),
        http.get("/api/dashboard/commissions", { params: { date: safeDate } }),
      ]);
      setClients(Array.isArray(clientsRes.data) ? clientsRes.data : []);
      setTodayAppointments(Array.isArray(todayRes.data) ? todayRes.data : []);
      setUpcomingRaw(Array.isArray(upcomingRes.data) ? upcomingRes.data : []);
      setBusinessSummary({
        date: summaryRes.data?.date || safeDate,
        totalRevenueToday: Number(summaryRes.data?.totalRevenueToday || 0),
        completedAppointmentsToday: Number(summaryRes.data?.completedAppointmentsToday || 0),
        revenueByService: Array.isArray(summaryRes.data?.revenueByService) ? summaryRes.data.revenueByService : [],
        revenueByBarber: Array.isArray(summaryRes.data?.revenueByBarber) ? summaryRes.data.revenueByBarber : [],
      });
      setOverview({
        date: overviewRes.data?.date || safeDate,
        totalRevenueToday: Number(overviewRes.data?.totalRevenueToday || 0),
        totalRevenueWeek: Number(overviewRes.data?.totalRevenueWeek || 0),
        totalRevenueMonth: Number(overviewRes.data?.totalRevenueMonth || 0),
        completedAppointmentsToday: Number(overviewRes.data?.completedAppointmentsToday || 0),
        completedAppointmentsWeek: Number(overviewRes.data?.completedAppointmentsWeek || 0),
        completedAppointmentsMonth: Number(overviewRes.data?.completedAppointmentsMonth || 0),
        revenueDeltaToday: Number(overviewRes.data?.revenueDeltaToday || 0),
        revenueDeltaWeek: Number(overviewRes.data?.revenueDeltaWeek || 0),
        revenueDeltaMonth: Number(overviewRes.data?.revenueDeltaMonth || 0),
        completedDeltaToday: Number(overviewRes.data?.completedDeltaToday || 0),
        completedDeltaWeek: Number(overviewRes.data?.completedDeltaWeek || 0),
        completedDeltaMonth: Number(overviewRes.data?.completedDeltaMonth || 0),
        comparisons: {
          revenue: {
            today: overviewRes.data?.comparisons?.revenue?.today || {
              current: 0,
              previous: 0,
              diff: 0,
              percentChange: null,
            },
            week: overviewRes.data?.comparisons?.revenue?.week || {
              current: 0,
              previous: 0,
              diff: 0,
              percentChange: null,
            },
            month: overviewRes.data?.comparisons?.revenue?.month || {
              current: 0,
              previous: 0,
              diff: 0,
              percentChange: null,
            },
          },
          completed: {
            today: overviewRes.data?.comparisons?.completed?.today || {
              current: 0,
              previous: 0,
              diff: 0,
              percentChange: null,
            },
            week: overviewRes.data?.comparisons?.completed?.week || {
              current: 0,
              previous: 0,
              diff: 0,
              percentChange: null,
            },
            month: overviewRes.data?.comparisons?.completed?.month || {
              current: 0,
              previous: 0,
              diff: 0,
              percentChange: null,
            },
          },
        },
      });
      setCommissions({
        date: commissionsRes.data?.date || safeDate,
        items: Array.isArray(commissionsRes.data?.items) ? commissionsRes.data.items : [],
      });
    } catch (err) {
      setError(msg(err, "No se pudieron cargar los datos del panel."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(selectedDate);
  }, [load, selectedDate]);

  const clientsTotal = clients.length;

  const todaySorted = sortByStartAsc(todayAppointments);
  const todayNonCancelled = todaySorted.filter((a) => a.status !== "CANCELLED");
  const todayCancelledCount = todaySorted.length - todayNonCancelled.length;

  const nowMs = Date.now();
  const upcoming = sortByStartAsc(
    upcomingRaw.filter((a) => a.status !== "CANCELLED" && new Date(a.startDatetime).getTime() >= nowMs)
  ).slice(0, 8);

  const selectedDateLabel = parseYmdLocal(selectedDate).toLocaleDateString("es-AR", {
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

      <section className="card dashboard-panel" style={{ marginBottom: 16 }}>
        <div className="dashboard-panel-head">
          <h3 className="dashboard-panel-title">Fecha del resumen</h3>
          <p className="muted dashboard-panel-sub">Seleccioná la fecha para métricas e ingresos</p>
        </div>
        <div className="toolbar">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            max="9999-12-31"
          />
          <button className="btn btn-small" type="button" onClick={() => setSelectedDate(ymdLocal(new Date()))}>
            Hoy
          </button>
          <button className="btn btn-small" type="button" onClick={() => setSelectedDate(shiftYmd(ymdLocal(new Date()), -1))}>
            Ayer
          </button>
          <span className="muted">Visualizando: {selectedDateLabel}</span>
        </div>
        <div className="toolbar" style={{ marginTop: 10 }}>
          <button
            className="btn btn-small"
            type="button"
            disabled={exporting === "appointments"}
            onClick={() => downloadCsv("appointments")}
          >
            {exporting === "appointments" ? "Exportando..." : "Exportar turnos (CSV)"}
          </button>
          <button
            className="btn btn-small"
            type="button"
            disabled={exporting === "summary"}
            onClick={() => downloadCsv("summary")}
          >
            {exporting === "summary" ? "Exportando..." : "Exportar resumen (CSV)"}
          </button>
          <button
            className="btn btn-small"
            type="button"
            disabled={exporting === "commissions"}
            onClick={() => downloadCsv("commissions")}
          >
            {exporting === "commissions" ? "Exportando..." : "Exportar comisiones (CSV)"}
          </button>
        </div>
        {exportError ? <p className="error" style={{ marginTop: 8 }}>{exportError}</p> : null}
        {exportInfo ? <p className="success" style={{ marginTop: 8 }}>{exportInfo}</p> : null}
      </section>

      {loading ? (
        <DashboardSkeleton />
      ) : error ? (
        <section className="card dashboard-error-card notice-board notice-board--error">
          <p className="error">{error}</p>
          <button type="button" className="btn" onClick={() => load(selectedDate)}>
            Reintentar
          </button>
        </section>
      ) : (
        <>
          <section className="dashboard-metrics" aria-label="Métricas rápidas">
            <article className="dashboard-metric-card dashboard-metric-card--lead">
              <div className="dashboard-metric-label-row">
                <span className="dashboard-metric-label">Ingresos hoy</span>
                <CalendarClock className="dashboard-metric-icon" size={20} strokeWidth={2} aria-hidden />
              </div>
              <span className="dashboard-metric-value">{money(overview.totalRevenueToday)}</span>
              <span className="dashboard-metric-hint">
                {trendText(overview.revenueDeltaToday, overview.comparisons.revenue.today.percentChange, {
                  positive: "Subió vs ayer",
                  negative: "Bajó vs ayer",
                })}
              </span>
            </article>
            <article className="dashboard-metric-card">
              <div className="dashboard-metric-label-row">
                <span className="dashboard-metric-label">Ingresos semana</span>
                <Users className="dashboard-metric-icon" size={20} strokeWidth={2} aria-hidden />
              </div>
              <span className="dashboard-metric-value">{money(overview.totalRevenueWeek)}</span>
              <span className="dashboard-metric-hint">
                {trendText(overview.revenueDeltaWeek, overview.comparisons.revenue.week.percentChange, {
                  positive: "Subió vs semana pasada",
                  negative: "Bajó vs semana pasada",
                })}
              </span>
            </article>
            <article className="dashboard-metric-card">
              <div className="dashboard-metric-label-row">
                <span className="dashboard-metric-label">Ingresos mes</span>
                <UserCircle className="dashboard-metric-icon" size={20} strokeWidth={2} aria-hidden />
              </div>
              <span className="dashboard-metric-value">{money(overview.totalRevenueMonth)}</span>
              <span className="dashboard-metric-hint">
                {trendText(overview.revenueDeltaMonth, overview.comparisons.revenue.month.percentChange, {
                  positive: "Subió vs mes pasado",
                  negative: "Bajó vs mes pasado",
                })}
              </span>
            </article>
            <article className="dashboard-metric-card">
              <div className="dashboard-metric-label-row">
                <span className="dashboard-metric-label">Completados hoy</span>
                <Users className="dashboard-metric-icon" size={20} strokeWidth={2} aria-hidden />
              </div>
              <span className="dashboard-metric-value">{overview.completedAppointmentsToday}</span>
              <span className="dashboard-metric-hint">
                {trendText(overview.completedDeltaToday, overview.comparisons.completed.today.percentChange, {
                  positive: "Más que ayer",
                  negative: "Menos que ayer",
                })}
              </span>
            </article>
            <article className="dashboard-metric-card">
              <div className="dashboard-metric-label-row">
                <span className="dashboard-metric-label">Clientes</span>
                <UserCircle className="dashboard-metric-icon" size={20} strokeWidth={2} aria-hidden />
              </div>
              <span className="dashboard-metric-value">{clientsTotal}</span>
              <span className="dashboard-metric-hint">Registrados en el sistema</span>
            </article>
            <article className="dashboard-metric-card">
              <div className="dashboard-metric-label-row">
                <span className="dashboard-metric-label">Turnos hoy</span>
                <Scissors className="dashboard-metric-icon" size={20} strokeWidth={2} aria-hidden />
              </div>
              <span className="dashboard-metric-value">{todayNonCancelled.length}</span>
              <span className="dashboard-metric-hint">
                {todayCancelledCount > 0 ? `${todayCancelledCount} cancelados` : "Sin cancelados hoy"}
              </span>
            </article>
          </section>

          <div className="dashboard-columns">
            <section className="card dashboard-panel">
              <div className="dashboard-panel-head">
                <h3 className="dashboard-panel-title">Comisiones del día</h3>
                <p className="muted dashboard-panel-sub">Estimación según comisión por defecto configurada</p>
              </div>
              {commissions.items.length === 0 ? (
                <p className="muted">No hay comisiones para la fecha seleccionada.</p>
              ) : (
                <div className="table-wrap mobile-table-wrap">
                  <table className="table mobile-card-table">
                    <thead>
                      <tr>
                        <th>Barbero</th>
                        <th>Completados</th>
                        <th>Revenue</th>
                        <th>Comisión</th>
                      </tr>
                    </thead>
                    <tbody>
                      {commissions.items.map((item) => (
                        <tr key={item.barberId}>
                          <td data-label="Barbero">{item.barberName}</td>
                          <td data-label="Completados">{item.completedAppointments}</td>
                          <td data-label="Revenue">{money(item.revenue)}</td>
                          <td data-label="Comisión">
                            {money(item.commissionAmount)} ({Math.round(Number(item.commissionRate || 0) * 100)}%)
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="card dashboard-panel">
              <div className="dashboard-panel-head">
                <h3 className="dashboard-panel-title">Top servicios</h3>
                <p className="muted dashboard-panel-sub">Ingresos por servicio (hoy)</p>
              </div>
              {businessSummary.revenueByService.length === 0 ? (
                <p className="muted">Sin ingresos por servicios en la fecha seleccionada.</p>
              ) : (
                <div className="table-wrap mobile-table-wrap">
                  <table className="table mobile-card-table">
                    <thead>
                      <tr>
                        <th>Servicio</th>
                        <th>Ingresos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {businessSummary.revenueByService.slice(0, 5).map((item) => (
                        <tr key={item.id}>
                          <td data-label="Servicio">{item.name}</td>
                          <td data-label="Ingresos">{money(item.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="card dashboard-panel">
              <div className="dashboard-panel-head">
                <h3 className="dashboard-panel-title">Top barberos</h3>
                <p className="muted dashboard-panel-sub">Ingresos por barbero (hoy)</p>
              </div>
              {businessSummary.revenueByBarber.length === 0 ? (
                <p className="muted">Sin ingresos por barberos en la fecha seleccionada.</p>
              ) : (
                <div className="table-wrap mobile-table-wrap">
                  <table className="table mobile-card-table">
                    <thead>
                      <tr>
                        <th>Barbero</th>
                        <th>Ingresos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {businessSummary.revenueByBarber.slice(0, 5).map((item) => (
                        <tr key={item.id}>
                          <td data-label="Barbero">{item.name}</td>
                          <td data-label="Ingresos">{money(item.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>

          <div className="dashboard-columns">
            <section className="card dashboard-panel dashboard-panel--day">
              <div className="dashboard-panel-head">
                <h3 className="dashboard-panel-title">Estado del día</h3>
                <p className="muted dashboard-panel-date">{selectedDateLabel}</p>
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
