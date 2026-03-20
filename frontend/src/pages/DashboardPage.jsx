import { useAuth } from "../context/AuthContext";

function DashboardPage() {
  const { user } = useAuth();

  return (
    <section className="card">
      <h2>Dashboard</h2>
      <p>Panel MVP de Agenda Barberia listo para operacion basica.</p>
      <p>
        Usuario actual: <strong>{user?.email}</strong>
      </p>
    </section>
  );
}

export default DashboardPage;
