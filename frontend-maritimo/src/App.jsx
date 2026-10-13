// Archivo: src/App.jsx

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
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
        
        <Route path="/dashboard" element={<Layout />}>
          {/* Aquí usamos el componente limpio importado */}
          <Route index element={<Dashboard />} /> 
          <Route path="billetera" element={<Billetera />} />
          <Route path="subastas" element={<SubastaEnVivo />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;