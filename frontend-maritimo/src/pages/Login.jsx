import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();
  // Estado para capturar el rol seleccionado en el select
  const [rol, setRol] = useState('EXPORTADOR');

  const handleLogin = (e) => {
    e.preventDefault();
    
    // Guardamos el rol en el navegador simulando el futuro JWT
    localStorage.setItem('rolUsuario', rol);
    
    // Redirigimos al dashboard
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold text-center mb-6 text-slate-800">Plataforma Marítima</h2>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Rol de Usuario</label>
            <select 
              value={rol}
              onChange={(e) => setRol(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="EXPORTADOR">Cliente Exportador</option>
              <option value="NAVIERA">Administrador de Naviera</option>
              <option value="PUERTO">Operador Portuario</option>
              <option value="ADUANAS">Oficial de Aduanas</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Correo Electrónico</label>
            <input type="email" placeholder="usuario@correo.com" className="w-full px-3 py-2 border border-slate-300 rounded-md" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
            <input type="password" placeholder="••••••••" className="w-full px-3 py-2 border border-slate-300 rounded-md" />
          </div>

          <button type="submit" className="w-full py-2 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 transition-colors">
            Ingresar al Sistema
          </button>
        </form>
      </div>
    </div>
  );
}