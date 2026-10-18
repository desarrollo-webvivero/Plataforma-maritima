import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Anchor, Bell, User, Search, LogOut, Wallet, Sun, Moon } from 'lucide-react';
import { logisticaApi } from '../services/api';

export default function Layout() {
  const navigate = useNavigate();
  
  // 1. Leemos el modo oscuro DESDE EL PRINCIPIO para evitar parpadeos
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  // 2. Estado para el rol y saldo global
  const [rol, setRol] = useState('');
  const [saldoGlobal, setSaldoGlobal] = useState(14500);

  const cargarSaldoHeader = async () => {
    try {
      const res = await logisticaApi.get('/billetera/saldo');
      setSaldoGlobal(res.data.saldoDisponible);
    } catch (err) {
      console.error("Error leyendo saldo en header:", err);
    }
  };

  // 3. Efecto para cargar el rol y saldo al iniciar la pantalla
  useEffect(() => {
    setRol(localStorage.getItem('rolUsuario') || 'EXPORTADOR');
    cargarSaldoHeader();
    window.addEventListener('saldoActualizado', cargarSaldoHeader);
    return () => window.removeEventListener('saldoActualizado', cargarSaldoHeader);
  }, []);

  // 4. Efecto que aplica o quita la clase 'dark' cada vez que tocas el botón
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const handleLogout = () => {
    localStorage.removeItem('rolUsuario');
    navigate('/'); 
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans flex flex-col transition-colors duration-300">
      
      {/* HEADER SUPERIOR */}
      <header className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex justify-between items-center shadow-sm transition-colors duration-300">
        
        {/* IZQUIERDA: Logo interactivo y Buscador */}
        <div className="flex items-center gap-8">
          <Link to="/dashboard" className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2 tracking-wide hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            <Anchor className="text-blue-600 dark:text-blue-500" size={24} />
            PORT LOGISTICS
          </Link>

          <div className="hidden md:flex items-center gap-3 text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-lg transition-colors">
            <Search size={18} />
            <input type="text" placeholder="Buscar contenedor o BL..." className="bg-transparent border-none focus:ring-0 text-sm w-64 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-800 dark:text-slate-200" />
          </div>
        </div>

        {/* DERECHA: Saldo, Interruptor, Notificaciones, Perfil y Cerrar Sesión */}
        <div className="flex items-center gap-4">
          
          {/* Saldo de Billetera */}
          {rol === 'EXPORTADOR' && (
            <button
              type="button"
              onClick={() => navigate('/dashboard/billetera')}
              title="Ir a Billetera Virtual"
              className="hidden sm:flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800 transition-colors cursor-pointer text-left mr-2 shadow-sm"
            >
              <Wallet size={18} />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider leading-none mb-0.5">Saldo Disp.</span>
                <span className="text-sm font-black text-slate-800 dark:text-slate-200 leading-none">
                  ${Number(saldoGlobal).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </button>
          )}

          {/* Botón Interruptor de Modo Oscuro */}
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 text-slate-400 hover:text-amber-500 dark:hover:text-blue-400 bg-slate-50 dark:bg-slate-800 rounded-full transition-all duration-300"
            title={isDarkMode ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Notificaciones */}
          <button className="relative p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-slate-900"></span>
          </button>
          
          <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block transition-colors"></div>
          
          {/* Perfil */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-none">{rol}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Operaciones</p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/50 p-2 rounded-full text-blue-700 dark:text-blue-400 transition-colors">
              <User size={20} />
            </div>
          </div>

          {/* Botón de Salir */}
          <button 
            onClick={handleLogout} 
            className="ml-2 p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" 
            title="Cerrar Sesión"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* ÁREA PRINCIPAL */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[1600px] p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}