import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [rol, setRol] = useState('EXPORTADOR');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    // Aquí iría la validación real con JWT en el futuro
    console.log(`Iniciando sesión como ${rol}`);
    navigate('/dashboard'); // Redirige al panel principal tras "loguearse"
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        <h2 className="mb-6 text-2xl font-bold text-center text-gray-800">Plataforma Marítima</h2>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Rol de Usuario</label>
            <select 
              value={rol} 
              onChange={(e) => setRol(e.target.value)}
              className="w-full px-3 py-2 mt-1 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="EXPORTADOR">Cliente Exportador</option>
              <option value="NAVIERA">Administrador de Naviera</option>
              <option value="PUERTO">Operador Portuario</option>
              <option value="ADUANA">Oficial de Aduanas</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Correo Electrónico</label>
            <input type="email" required className="w-full px-3 py-2 mt-1 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" placeholder="usuario@correo.com" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Contraseña</label>
            <input type="password" required className="w-full px-3 py-2 mt-1 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" placeholder="••••••••" />
          </div>

          <button type="submit" className="w-full px-4 py-2 font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
            Ingresar al Sistema
          </button>
        </form>
      </div>
    </div>
  );
}