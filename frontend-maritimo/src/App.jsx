import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';

// Componente temporal para el Dashboard
const DashboardDummy = () => <div className="p-10 text-2xl font-bold text-center">Bienvenido al Panel de Control</div>;

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<DashboardDummy />} />
      </Routes>
    </Router>
  );
}

export default App;