import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/auth-context";
import { EnvProvider } from "./lib/env-context";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LoginPage } from "./pages/Login";
import { OverviewPage } from "./pages/Overview";
import { EvaluationsPage } from "./pages/Evaluations";
import { EvaluationDetailPage } from "./pages/EvaluationDetail";
import { SettingsPage } from "./pages/Settings";
import { PrivacyPage } from "./pages/Privacy";

function LoginGate() {
  const { status } = useAuth();
  if (status === "authenticated") return <Navigate to="/" replace />;
  return <LoginPage />;
}

function ProtectedShell({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <EnvProvider>{children}</EnvProvider>
    </ProtectedRoute>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginGate />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route
            path="/"
            element={
              <ProtectedShell>
                <OverviewPage />
              </ProtectedShell>
            }
          />
          <Route
            path="/evaluations"
            element={
              <ProtectedShell>
                <EvaluationsPage />
              </ProtectedShell>
            }
          />
          <Route
            path="/evaluations/:id"
            element={
              <ProtectedShell>
                <EvaluationDetailPage />
              </ProtectedShell>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedShell>
                <SettingsPage />
              </ProtectedShell>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
