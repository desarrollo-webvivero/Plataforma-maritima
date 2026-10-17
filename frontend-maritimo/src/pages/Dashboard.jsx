import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import DashboardExportador from './DashboardExportador';
import DashboardNaviera from './DashboardNaviera';
import DashboardPuerto from './DashboardPuerto';
import DashboardAduanas from './DashboardAduanas';
import DashboardAdmin from './DashboardAdmin';

export default function Dashboard() {
  const location = useLocation();

  const obtenerRolActual = () => {
    if (location.state?.rol) return location.state.rol.toUpperCase();
    const guardado =
      localStorage.getItem('userRole') ||
      localStorage.getItem('rol') ||
      localStorage.getItem('role') ||
      'EXPORTADOR';
    return guardado.toUpperCase();
  };

  const [rolActivo, setRolActivo] = useState(obtenerRolActual);

  useEffect(() => {
    setRolActivo(obtenerRolActual());

    const sincronizarRol = () => setRolActivo(obtenerRolActual());
    window.addEventListener('storage', sincronizarRol);
    return () => window.removeEventListener('storage', sincronizarRol);
  }, [location]);

  switch (rolActivo) {
    case 'NAVIERA':
      return <DashboardNaviera />;
    case 'PUERTO':
    case 'PORTUARIO':
      return <DashboardPuerto />;
    case 'ADUANAS':
    case 'ADUANA':
      return <DashboardAduanas />;
    case 'ADMIN':
    case 'ADMINISTRADOR':
      return <DashboardAdmin />;
    case 'EXPORTADOR':
    default:
      return <DashboardExportador />;
  }
}
