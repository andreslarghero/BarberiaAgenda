import {
  CalendarDays,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Scissors,
  Settings,
  UserCircle,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navClass = ({ isActive }) => (isActive ? "active" : "");

function AppLayout() {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const isBarber = user?.role === "BARBER";

  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const closeMobileSidebar = () => {
    setIsMobileSidebarOpen(false);
  };

  return (
    <div
      className={`app-shell${isSidebarCollapsed ? " app-shell--collapsed" : ""}${
        isMobileSidebarOpen ? " app-shell--mobile-open" : ""
      }`}
    >
      <aside className="sidebar">
        <div className="sidebar-header">
          <Link className="brand" to="/dashboard">
            <span className="brand-mark" aria-hidden>
              <Scissors size={18} strokeWidth={2.1} />
            </span>
            <span className="brand-text">Agenda Barbería</span>
          </Link>
          <p className="sidebar-tagline">Panel de gestión</p>
          <button
            type="button"
            className="btn btn-ghost btn-small sidebar-collapse-btn"
            onClick={() => setIsSidebarCollapsed((prev) => !prev)}
            aria-label={isSidebarCollapsed ? "Expandir panel lateral" : "Colapsar panel lateral"}
            title={isSidebarCollapsed ? "Expandir panel lateral" : "Colapsar panel lateral"}
          >
            {isSidebarCollapsed ? <PanelLeftOpen size={16} strokeWidth={2.2} /> : <PanelLeftClose size={16} strokeWidth={2.2} />}
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-small sidebar-close-mobile"
            onClick={closeMobileSidebar}
            aria-label="Cerrar menú"
          >
            <X size={16} strokeWidth={2.2} />
          </button>
        </div>
        <nav className="nav" aria-label="Principal">
          {(isAdmin || isBarber) ? (
            <NavLink to="/dashboard" end className={navClass} onClick={closeMobileSidebar}>
              <span className="nav-link-inner">
                <LayoutDashboard size={18} strokeWidth={2} aria-hidden />
                <span className="nav-link-label">Dashboard</span>
              </span>
            </NavLink>
          ) : null}
          {isAdmin ? (
            <NavLink to="/services" className={navClass} onClick={closeMobileSidebar}>
              <span className="nav-link-inner">
                <Scissors size={18} strokeWidth={2} aria-hidden />
                <span className="nav-link-label">Servicios</span>
              </span>
            </NavLink>
          ) : null}
          {(isAdmin || isBarber) ? (
            <NavLink to="/barbers" className={navClass} onClick={closeMobileSidebar}>
              <span className="nav-link-inner">
                <UserCircle size={18} strokeWidth={2} aria-hidden />
                <span className="nav-link-label">Barberos</span>
              </span>
            </NavLink>
          ) : null}
          {isAdmin ? (
            <NavLink to="/users" className={navClass} onClick={closeMobileSidebar}>
              <span className="nav-link-inner">
                <Users size={18} strokeWidth={2} aria-hidden />
                <span className="nav-link-label">Usuarios</span>
              </span>
            </NavLink>
          ) : null}
          {isAdmin ? (
            <NavLink to="/clients" className={navClass} onClick={closeMobileSidebar}>
              <span className="nav-link-inner">
                <Users size={18} strokeWidth={2} aria-hidden />
                <span className="nav-link-label">Clientes</span>
              </span>
            </NavLink>
          ) : null}
          <NavLink to="/appointments" className={navClass} onClick={closeMobileSidebar}>
            <span className="nav-link-inner">
              <CalendarDays size={18} strokeWidth={2} aria-hidden />
              <span className="nav-link-label">Agenda</span>
            </span>
          </NavLink>
          {isAdmin ? (
            <NavLink to="/settings" className={navClass} onClick={closeMobileSidebar}>
              <span className="nav-link-inner">
                <Settings size={18} strokeWidth={2} aria-hidden />
                <span className="nav-link-label">Configuración</span>
              </span>
            </NavLink>
          ) : null}
        </nav>
      </aside>
      <button
        type="button"
        className="sidebar-overlay"
        aria-label="Cerrar menú lateral"
        onClick={closeMobileSidebar}
      />
      <div className="main-area">
        <header className="topbar">
          <div className="topbar-inner">
            <button
              type="button"
              className="btn btn-ghost btn-small mobile-menu-btn"
              onClick={() => setIsMobileSidebarOpen(true)}
              aria-label="Abrir menú"
            >
              <Menu size={17} strokeWidth={2.2} />
            </button>
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
