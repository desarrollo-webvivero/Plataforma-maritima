// src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import DashboardExportador from './DashboardExportador';
import DashboardAduanas from './DashboardAduanas';
import DashboardPuerto from './DashboardPuerto';
import DashboardNaviera from './DashboardNaviera';

export default function Dashboard() {
  const [rol, setRol] = useState('');

  useEffect(() => {
    // Lee la sesión iniciada
    const rolGuardado = localStorage.getItem('rolUsuario') || 'EXPORTADOR';
    setRol(rolGuardado);
  }, []);

  // Retorna el archivo completo según el rol
  if (rol === 'EXPORTADOR') return <DashboardExportador />;
  if (rol === 'ADUANAS') return <DashboardAduanas />;
  if (rol === 'PUERTO') return <DashboardPuerto />;
  if (rol === 'NAVIERA') return <DashboardNaviera />;

  return <DashboardExportador />; // Vista por defecto
}