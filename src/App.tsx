import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { ProtectedRoute } from './components/layout';

import LoginPage           from './pages/LoginPage';
import SignUpPage          from './pages/SignUpPage';
import ForgotPasswordPage  from './pages/ForgotPasswordPage';
import DashboardPage       from './pages/DashboardPage';
import SessionPage         from './pages/SessionPage';
import SessionDetailPage   from './pages/SessionDetailPage';
import ApprovalsPage       from './pages/ApprovalsPage';
import SecurityPage        from './pages/SecurityPage';
import MLOpsPage           from './pages/MLOpsPage';
import ChatbotPage         from './pages/ChatbotPage';
import BreakingChangesPage from './pages/BreakingChangesPage';
import SimulationPage      from './pages/SimulationPage';
import TestGenerationPage  from './pages/TestGenerationPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login"           element={<LoginPage />} />
          <Route path="/signup"          element={<SignUpPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* Protected */}
          <Route path="/dashboard"       element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/sessions"        element={<ProtectedRoute><SessionPage /></ProtectedRoute>} />
          <Route path="/sessions/:id"    element={<ProtectedRoute><SessionDetailPage /></ProtectedRoute>} />
          <Route path="/approvals"       element={<ProtectedRoute><ApprovalsPage /></ProtectedRoute>} />
          <Route path="/security"        element={<ProtectedRoute><SecurityPage /></ProtectedRoute>} />
          <Route path="/mlops"           element={<ProtectedRoute><MLOpsPage /></ProtectedRoute>} />
          <Route path="/chatbot"         element={<ProtectedRoute><ChatbotPage /></ProtectedRoute>} />
          <Route path="/breaking"        element={<ProtectedRoute><BreakingChangesPage /></ProtectedRoute>} />
          <Route path="/simulation"      element={<ProtectedRoute><SimulationPage /></ProtectedRoute>} />
          <Route path="/tests"           element={<ProtectedRoute><TestGenerationPage /></ProtectedRoute>} />

          {/* Default */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
