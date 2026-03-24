import { CalendarDays, LayoutDashboard, LogOut, Scissors, UserCircle, Users } from "lucide-react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navClass = ({ isActive }) => (isActive ? "active" : "");

function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-header">
          <Link className="brand" to="/dashboard">
            <span className="brand-mark" aria-hidden />
            <span className="brand-text">Agenda Barbería</span>
          </Link>
          <p className="sidebar-tagline">Panel de gestión</p>
        </div>
        <nav className="nav" aria-label="Principal">
          <NavLink to="/dashboard" end className={navClass}>
            <span className="nav-link-inner">
              <LayoutDashboard size={18} strokeWidth={2} aria-hidden />
              Dashboard
            </span>
          </NavLink>
          <NavLink to="/services" className={navClass}>
            <span className="nav-link-inner">
              <Scissors size={18} strokeWidth={2} aria-hidden />
              Servicios
            </span>
          </NavLink>
          <NavLink to="/barbers" className={navClass}>
            <span className="nav-link-inner">
              <UserCircle size={18} strokeWidth={2} aria-hidden />
              Barberos
            </span>
          </NavLink>
          <NavLink to="/clients" className={navClass}>
            <span className="nav-link-inner">
              <Users size={18} strokeWidth={2} aria-hidden />
              Clientes
            </span>
          </NavLink>
          <NavLink to="/appointments" className={navClass}>
            <span className="nav-link-inner">
              <CalendarDays size={18} strokeWidth={2} aria-hidden />
              Agenda
            </span>
          </NavLink>
        </nav>
      </aside>
      <div className="main-area">
        <header className="topbar">
          <div className="topbar-inner">
            <span className="topbar-label">Sesión</span>
            <div className="topbar-actions">
              <span className="topbar-user" title={user?.email || ""}>
                {user?.email || "Usuario"}
              </span>
              <button type="button" className="btn btn-ghost btn-small topbar-logout" onClick={handleLogout}>
                <LogOut size={15} strokeWidth={2} aria-hidden />
                Salir
              </button>
            </div>
          </div>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
