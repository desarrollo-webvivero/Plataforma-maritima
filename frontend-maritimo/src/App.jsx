// Archivo: src/App.jsx

import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Registro from './pages/Registro';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard'; // Importamos el nuevo archivo
import Billetera from './pages/Billetera';
import SubastaEnVivo from './pages/SubastaEnVivo';
import Notificaciones from './components/Notificaciones';
import { limpiarSesion } from './services/session';
import { notificar } from './services/notificaciones';

// Cuando el servidor rechaza el token (vencido), se cierra la sesión y se manda al login
function EscuchaSesion() {
  const navigate = useNavigate();

  useEffect(() => {
    const alExpirar = () => {
      limpiarSesion();
      window.dispatchEvent(new Event('storage'));
      notificar('Tu sesión expiró. Inicia sesión nuevamente.');
      navigate('/login', { replace: true });
    };
    window.addEventListener('sesionExpirada', alExpirar);
    return () => window.removeEventListener('sesionExpirada', alExpirar);
  }, [navigate]);

  return null;
}

function App() {
  return (
    <Router>
      <EscuchaSesion />
      <Notificaciones />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        
        <Route path="/dashboard" element={<Layout />}>
          {/* Aquí usamos el componente limpio importado */}
          <Route index element={<Dashboard />} /> 
          <Route path="billetera" element={<Billetera />} />
          <Route path="subastas" element={<SubastaEnVivo />} />
        </Route>

        {/* Rutas directas para evitar pantallas en blanco si se navega a /billetera o /subastas */}
        <Route element={<Layout />}>
          <Route path="/billetera" element={<Billetera />} />
          <Route path="/dashboard/billetera" element={<Billetera />} />
          <Route path="/subastas" element={<SubastaEnVivo />} />
          <Route path="/subasta" element={<SubastaEnVivo />} />
          <Route path="/dashboard/subastas" element={<SubastaEnVivo />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;