import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { api } from "./api";
import { Navbar } from "./components/Navbar";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { PropertyDetail } from "./pages/PropertyDetail";
import { TenantDetail } from "./pages/TenantDetail";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const loggedIn = api.auth.isAuthenticated();
  if (!loggedIn) return <Navigate to="/login" replace />;
  return (
    <div className="app-shell">
      <Navbar />
      <main className="app-content">{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/properties/:id"
          element={
            <RequireAuth>
              <PropertyDetail />
            </RequireAuth>
          }
        />
        <Route
          path="/tenants/:id"
          element={
            <RequireAuth>
              <TenantDetail />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
