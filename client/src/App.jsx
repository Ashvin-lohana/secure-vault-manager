import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Vault from './pages/Vault';
import Generator from './pages/Generator';
import Health from './pages/Health';
import Settings from './pages/Settings';
import { Toaster } from './hooks/useToast';

function PrivateRoute({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/vault" element={<PrivateRoute><Vault /></PrivateRoute>} />
        <Route path="/generator" element={<PrivateRoute><Generator /></PrivateRoute>} />
        <Route path="/health" element={<PrivateRoute><Health /></PrivateRoute>} />
        <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
      </Routes>
      <Toaster />
    </>
  );
}
