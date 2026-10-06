import { Center, Loader } from "@mantine/core";
import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/Layout/AppLayout";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ApiKeysPage } from "./pages/ApiKeys/ApiKeysPage";
import { CompaniesPage } from "./pages/Companies/CompaniesPage";
import { DashboardPage } from "./pages/Dashboard/DashboardPage";
import { DespatchesPage } from "./pages/Despatches/DespatchesPage";
import { DocumentsPage } from "./pages/Documents/DocumentsPage";
import { LoginPage } from "./pages/Login/LoginPage";
import { SettingsPage } from "./pages/Settings/SettingsPage";
import { UsersPage } from "./pages/Users/UsersPage";

function ProtectedRoute({
  children,
  requireSuperAdmin = false,
}: {
  children: ReactNode;
  requireSuperAdmin?: boolean;
}) {
  const { user, loading, isSuperAdmin } = useAuth();

  if (loading) {
    return (
      <Center style={{ height: "100vh", width: "100vw" }}>
        <Loader color="teal" size="lg" />
      </Center>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireSuperAdmin && !isSuperAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Center style={{ height: "100vh", width: "100vw" }}>
        <Loader color="teal" size="lg" />
      </Center>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

export function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="companies" element={<CompaniesPage />} />
          <Route path="documents" element={<DocumentsPage />} />
          <Route path="despatches" element={<DespatchesPage />} />
          <Route path="api-keys" element={<ApiKeysPage />} />

          {/* Superadmin restricted routes */}
          <Route
            path="users"
            element={
              <ProtectedRoute requireSuperAdmin>
                <UsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="settings"
            element={
              <ProtectedRoute requireSuperAdmin>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
}
