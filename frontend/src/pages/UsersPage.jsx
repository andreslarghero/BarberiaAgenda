import { useEffect, useMemo, useState } from "react";
import http from "../api/http";
import { useAuth } from "../context/AuthContext";

function msg(err, fallback) {
  return err.response?.data?.message || fallback;
}

function UsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busyUserId, setBusyUserId] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [barberLinkFilter, setBarberLinkFilter] = useState("ALL");
  const [creatingUser, setCreatingUser] = useState(false);
  const [createUserForm, setCreateUserForm] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "CLIENT",
  });

  const selectedUser = useMemo(
    () => users.find((row) => String(row.id) === selectedUserId) || null,
    [users, selectedUserId]
  );
  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((row) => {
      const matchesSearch =
        !q ||
        row.fullName?.toLowerCase().includes(q) ||
        row.email?.toLowerCase().includes(q);
      const matchesRole = roleFilter === "ALL" || row.role === roleFilter;
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && row.isActive) ||
        (statusFilter === "INACTIVE" && !row.isActive);
      const hasBarber = Boolean(row.barberId);
      const matchesBarberLink =
        barberLinkFilter === "ALL" ||
        (barberLinkFilter === "LINKED" && hasBarber) ||
        (barberLinkFilter === "UNLINKED" && !hasBarber);
      return matchesSearch && matchesRole && matchesStatus && matchesBarberLink;
    });
  }, [users, search, roleFilter, statusFilter, barberLinkFilter]);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [usersRes, barbersRes, clientsRes] = await Promise.all([
        http.get("/api/users"),
        http.get("/api/barbers"),
        http.get("/api/clients"),
      ]);
      const nextUsers = Array.isArray(usersRes.data) ? usersRes.data : [];
      setUsers(nextUsers);
      setBarbers(Array.isArray(barbersRes.data) ? barbersRes.data : []);
      setClients(Array.isArray(clientsRes.data) ? clientsRes.data : []);
      setSelectedUserId((prev) => {
        if (prev && nextUsers.some((u) => String(u.id) === prev)) return prev;
        return nextUsers[0] ? String(nextUsers[0].id) : "";
      });
    } catch (err) {
      setError(msg(err, "No se pudieron cargar los usuarios"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!filteredUsers.length) {
      setSelectedUserId("");
      return;
    }
    if (!selectedUserId || !filteredUsers.some((row) => String(row.id) === selectedUserId)) {
      setSelectedUserId(String(filteredUsers[0].id));
    }
  }, [filteredUsers, selectedUserId]);

  const changeRole = async (targetUser, role) => {
    setBusyUserId(targetUser.id);
    setError("");
    setInfo("");
    try {
      await http.patch(`/api/users/${targetUser.id}/role`, { role });
      setInfo("Rol actualizado.");
      await load();
    } catch (err) {
      setError(msg(err, "No se pudo actualizar el rol"));
    } finally {
      setBusyUserId(null);
    }
  };

  const linkBarber = async (targetUser, barberId) => {
    setBusyUserId(targetUser.id);
    setError("");
    setInfo("");
    try {
      await http.patch(`/api/users/${targetUser.id}/link-barber`, { barberId: Number(barberId) });
      setInfo("Barbero vinculado.");
      await load();
    } catch (err) {
      setError(msg(err, "No se pudo vincular el barbero"));
    } finally {
      setBusyUserId(null);
    }
  };

  const deleteUser = async (targetUser) => {
    const ok = window.confirm(`¿Eliminar usuario ${targetUser.fullName}?`);
    if (!ok) return;
    setBusyUserId(targetUser.id);
    setError("");
    setInfo("");
    try {
      await http.delete(`/api/users/${targetUser.id}`);
      setInfo("Usuario eliminado.");
      await load();
    } catch (err) {
      setError(msg(err, "No se pudo eliminar el usuario"));
    } finally {
      setBusyUserId(null);
    }
  };

  const createUser = async (e) => {
    e.preventDefault();
    setCreatingUser(true);
    setError("");
    setInfo("");
    try {
      await http.post("/api/users", {
        fullName: createUserForm.fullName.trim(),
        email: createUserForm.email.trim().toLowerCase(),
        password: createUserForm.password,
        role: createUserForm.role,
      });
      setInfo("Usuario creado.");
      setCreateUserForm({
        fullName: "",
        email: "",
        password: "",
        role: "CLIENT",
      });
      await load();
    } catch (err) {
      setError(msg(err, "No se pudo crear el usuario"));
    } finally {
      setCreatingUser(false);
    }
  };

  return (
    <section className="card page-shell">
      <header className="page-header">
        <h2 className="page-title">Usuarios registrados</h2>
        <p className="page-lead muted">
          Administrá cuentas existentes y permisos del sistema sin duplicar usuarios.
        </p>
      </header>

      <div className="dashboard-metrics" style={{ marginBottom: 14 }}>
        <article className="dashboard-metric-card">
          <span className="dashboard-metric-label">Usuarios</span>
          <strong className="dashboard-metric-value">{users.length}</strong>
        </article>
        <article className="dashboard-metric-card">
          <span className="dashboard-metric-label">Visibles</span>
          <strong className="dashboard-metric-value">{filteredUsers.length}</strong>
        </article>
        <article className="dashboard-metric-card">
          <span className="dashboard-metric-label">Clientes</span>
          <strong className="dashboard-metric-value">{clients.length}</strong>
        </article>
        <article className="dashboard-metric-card">
          <span className="dashboard-metric-label">Barberos</span>
          <strong className="dashboard-metric-value">{barbers.length}</strong>
        </article>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <h3 className="section-title" style={{ marginTop: 0 }}>Búsqueda y filtros</h3>
        <div className="form-grid">
          <input
            placeholder="Buscar por nombre o email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="ALL">Rol: Todos</option>
            <option value="ADMIN">Rol: ADMIN</option>
            <option value="BARBER">Rol: BARBER</option>
            <option value="CLIENT">Rol: CLIENT</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="ALL">Estado: Todos</option>
            <option value="ACTIVE">Estado: Activos</option>
            <option value="INACTIVE">Estado: Inactivos</option>
          </select>
          <select value={barberLinkFilter} onChange={(e) => setBarberLinkFilter(e.target.value)}>
            <option value="ALL">Vínculo barbero: Todos</option>
            <option value="LINKED">Con barbero vinculado</option>
            <option value="UNLINKED">Sin barbero vinculado</option>
          </select>
          <button
            className="btn"
            type="button"
            onClick={() => {
              setSearch("");
              setRoleFilter("ALL");
              setStatusFilter("ALL");
              setBarberLinkFilter("ALL");
            }}
          >
            Limpiar filtros
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <h3 className="section-title" style={{ marginTop: 0 }}>Seleccionar usuario existente</h3>
        <p className="section-desc muted">Elegí un usuario registrado y gestioná su rol o vínculo.</p>
        <div className="form-grid">
          <select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)}>
            {filteredUsers.map((row) => (
              <option key={row.id} value={row.id}>
                {row.fullName} · {row.email}
              </option>
            ))}
          </select>
          <select
            value={selectedUser?.role || "CLIENT"}
            onChange={(e) => selectedUser && changeRole(selectedUser, e.target.value)}
            disabled={!selectedUser || busyUserId === selectedUser?.id}
          >
            <option value="ADMIN">ADMIN</option>
            <option value="BARBER">BARBER</option>
            <option value="CLIENT">CLIENT</option>
          </select>
          {selectedUser?.role === "BARBER" ? (
            <select
              defaultValue={selectedUser.barberId || ""}
              onChange={(e) => {
                if (!e.target.value || !selectedUser) return;
                linkBarber(selectedUser, e.target.value);
              }}
              disabled={!selectedUser || busyUserId === selectedUser?.id}
            >
              <option value="">Vincular barbero…</option>
              {barbers.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          ) : (
            <div className="muted">Seleccioná rol BARBER para habilitar vínculo.</div>
          )}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <h3 className="section-title" style={{ marginTop: 0 }}>Crear usuario</h3>
        <form className="form-grid" onSubmit={createUser}>
          <input
            placeholder="Nombre y apellido"
            value={createUserForm.fullName}
            onChange={(e) => setCreateUserForm((prev) => ({ ...prev, fullName: e.target.value }))}
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={createUserForm.email}
            onChange={(e) => setCreateUserForm((prev) => ({ ...prev, email: e.target.value }))}
            required
          />
          <input
            type="password"
            placeholder="Contraseña (mín. 6)"
            value={createUserForm.password}
            onChange={(e) => setCreateUserForm((prev) => ({ ...prev, password: e.target.value }))}
            minLength={6}
            required
          />
          <select
            value={createUserForm.role}
            onChange={(e) => setCreateUserForm((prev) => ({ ...prev, role: e.target.value }))}
          >
            <option value="CLIENT">CLIENT</option>
            <option value="BARBER">BARBER</option>
            <option value="ADMIN">ADMIN</option>
          </select>
          <button className="btn btn-primary" type="submit" disabled={creatingUser}>
            {creatingUser ? "Creando..." : "Crear usuario"}
          </button>
        </form>
      </div>

      {loading ? <p className="muted">Cargando usuarios…</p> : null}

      {!loading ? (
        <div className="table-wrap mobile-table-wrap">
          <table className="table mobile-card-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Barbero vinculado</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((row) => (
                <tr key={row.id}>
                  <td data-label="Usuario">{row.fullName}</td>
                  <td data-label="Email">{row.email}</td>
                  <td data-label="Rol">{row.role}</td>
                  <td data-label="Barbero vinculado">{row.barber?.name || "—"}</td>
                  <td data-label="Estado">
                    <span className={`badge ${row.isActive ? "badge--success" : "badge--neutral"}`}>
                      {row.isActive ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td data-label="Acciones" className="actions-cell">
                    <button
                      className="btn btn-small btn-danger"
                      type="button"
                      disabled={busyUserId === row.id || user?.id === row.id}
                      onClick={() => deleteUser(row)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {!loading && filteredUsers.length === 0 ? (
        <p className="muted">No hay usuarios que coincidan con los filtros aplicados.</p>
      ) : null}

      {error ? <p className="error">{error}</p> : null}
      {info ? <p className="success">{info}</p> : null}
    </section>
  );
}

export default UsersPage;
