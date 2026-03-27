import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./components/AppLayout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import ServicesPage from "./pages/ServicesPage.jsx";
import BarbersPage from "./pages/BarbersPage.jsx";
import ClientsPage from "./pages/ClientsPage.jsx";
import AppointmentsPage from "./pages/AppointmentsPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";
import BookingPage from "./pages/BookingPage.jsx";
import UsersPage from "./pages/UsersPage.jsx";

function RoleRoute({ allowedRoles, children }) {
  const { user } = useAuth();
  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/appointments" replace />;
  }
  return children;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/booking"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["CLIENT"]}>
              <BookingPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route
          path="/dashboard"
          element={
            <RoleRoute allowedRoles={["ADMIN", "BARBER"]}>
              <DashboardPage />
            </RoleRoute>
          }
        />
        <Route
          path="/services"
          element={
            <RoleRoute allowedRoles={["ADMIN"]}>
              <ServicesPage />
            </RoleRoute>
          }
        />
        <Route
          path="/barbers"
          element={
            <RoleRoute allowedRoles={["ADMIN", "BARBER"]}>
              <BarbersPage />
            </RoleRoute>
          }
        />
        <Route
          path="/users"
          element={
            <RoleRoute allowedRoles={["ADMIN"]}>
              <UsersPage />
            </RoleRoute>
          }
        />
        <Route
          path="/clients"
          element={
            <RoleRoute allowedRoles={["ADMIN"]}>
              <ClientsPage />
            </RoleRoute>
          }
        />
        <Route path="/appointments" element={<AppointmentsPage />} />
        <Route
          path="/settings"
          element={
            <RoleRoute allowedRoles={["ADMIN"]}>
              <SettingsPage />
            </RoleRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
