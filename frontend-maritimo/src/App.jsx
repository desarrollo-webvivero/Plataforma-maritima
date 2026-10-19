// Archivo: src/App.jsx

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Registro from './pages/Registro';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard'; // Importamos el nuevo archivo
import Billetera from './pages/Billetera';
import SubastaEnVivo from './pages/SubastaEnVivo';

function App() {
  return (
    <Router>
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