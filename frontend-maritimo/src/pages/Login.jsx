import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Anchor, Mail, Lock, ArrowLeft, ArrowRight, ShieldCheck,
  Ship, Truck, Zap, AlertCircle, UserPlus, KeyRound, Settings
} from 'lucide-react';
import { logisticaApi } from '../services/api';

export default function Login() {
  const navigate = useNavigate();

  const [rolSeleccionado, setRolSeleccionado] = useState('EXPORTADOR');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Los 5 roles operativos del sistema
  const roles = [
    {
      id: 'EXPORTADOR',
      nombre: 'Cliente Exportador',
      desc: 'Subastas TEU, Billetera y Cargas',
      icono: Zap
    },
    {
      id: 'NAVIERA',
      nombre: 'Línea Naviera',
      desc: 'Flota de Buques y Licitaciones',
      icono: Ship
    },
    {
      id: 'PUERTO',
      nombre: 'Terminal Portuaria',
      desc: 'Patio, Muelles y Gate-In/Out',
      icono: Truck
    },
    {
      id: 'ADUANAS',
      nombre: 'Control Aduanero',
      desc: 'Semáforo Fiscal e Inspección',
      icono: ShieldCheck
    },
    {
      id: 'ADMIN',
      nombre: 'Administrador IAM',
      desc: 'Gestión de Usuarios y Roles',
      icono: Settings
    }
  ];

  const seleccionarRol = (rolObj) => {
    setRolSeleccionado(rolObj.id);
    setErrorMsg('');
    setEmail('');
    setPassword('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      // Validación real contra PostgreSQL para TODOS los roles
      const res = await logisticaApi.post('/usuarios/login', {
        email: email.trim().toLowerCase(),
        password: password,
        rol: rolSeleccionado
      });

      const usuarioAutenticado = res.data;
      const rolReal = (usuarioAutenticado.rol || rolSeleccionado).toUpperCase();

      // Guardamos en todas las llaves posibles que pueda leer Layout.jsx o Dashboard.jsx
      localStorage.setItem('userRole', rolReal);
      localStorage.setItem('rol', rolReal);
      localStorage.setItem('role', rolReal);
      localStorage.setItem('usuarioActivo', JSON.stringify(usuarioAutenticado));

      if (rolReal === 'EXPORTADOR') {
        localStorage.setItem('exportadorActivo', JSON.stringify(usuarioAutenticado));
      }

      // Disparamos evento para que el Layout actualice el rol en la esquina superior derecha
      window.dispatchEvent(new Event('storage'));

      navigate('/dashboard', { state: { rol: rolReal } });
    } catch (error) {
      console.error('Error en inicio de sesión:', error);
      setErrorMsg(
        error.response?.data?.error ||
          'Correo o contraseña incorrectos. Verifica tus credenciales en PostgreSQL.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1120] text-slate-100 flex flex-col font-sans selection:bg-blue-500/30">
      
      {/* NAVBAR SUPERIOR */}
      <nav className="bg-[#0f172a]/95 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div
            onClick={() => navigate('/')}
            className="flex items-center gap-3 cursor-pointer"
          >
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center shadow-md shadow-blue-600/30">
              <Anchor size={20} className="text-white" />
            </div>
            <span className="text-lg font-black tracking-wide text-white">
              PORT LOGISTICS
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/registro')}
              className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
            >
              <UserPlus size={15} />
              Crear Cuenta Exportador
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft size={15} />
              Volver al Monitor
            </button>
          </div>
        </div>
      </nav>

      {/* CONTENEDOR CENTRAL */}
      <main className="flex-grow flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[550px] h-72 bg-blue-600/10 blur-[130px] rounded-full pointer-events-none"></div>

        <div className="w-full max-w-xl relative z-10">
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
            
            <div className="px-8 py-6 bg-slate-900/70 border-b border-slate-700/80 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 block mb-1">
                  Autenticación PostgreSQL por Rol
                </span>
                <h1 className="text-2xl font-black text-white">
                  Iniciar Sesión en Plataforma
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Selecciona tu módulo operativo e ingresa tu correo y contraseña asignados.
                </p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                <KeyRound size={22} />
              </div>
            </div>

            <form onSubmit={handleLogin} className="p-8 space-y-6">
              
              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold flex items-center gap-2.5">
                  <AlertCircle size={17} className="shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* SELECTOR DE LOS 5 ROLES */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                  1. Selecciona tu Rol Operativo
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {roles.map((r) => {
                    const Icono = r.icono;
                    const activo = rolSeleccionado === r.id;

                    return (
                      <button
                        type="button"
                        key={r.id}
                        onClick={() => seleccionarRol(r)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                          r.id === 'ADMIN' ? 'sm:col-span-2' : ''
                        } ${
                          activo
                            ? 'bg-blue-600/15 border-blue-500 text-white shadow-sm ring-1 ring-blue-500/30'
                            : 'bg-slate-900/70 border-slate-700/80 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                        }`}
                      >
                        <div className={`p-2 rounded-lg mt-0.5 ${
                          activo ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
                        }`}>
                          <Icono size={16} />
                        </div>
                        <div className="overflow-hidden">
                          <span className="text-xs font-black block truncate">
                            {r.nombre}
                          </span>
                          <span className="text-[10px] text-slate-400 block truncate mt-0.5">
                            {r.desc}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* CAMPOS DE CORREO Y CONTRASEÑA */}
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Correo Electrónico Registrado
                    </label>
                    <span className="text-[10px] font-semibold text-emerald-400">
                      Verificación de Rol y Clave Activa
                    </span>
                  </div>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="email"
                      required
                      placeholder="usuario@dominio.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setErrorMsg('');
                      }}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Contraseña de Acceso
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setErrorMsg('');
                      }}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-blue-600/25 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {isLoading ? 'Verificando en PostgreSQL...' : `Ingresar como ${roles.find(r => r.id === rolSeleccionado)?.nombre}`}
                <ArrowRight size={16} />
              </button>

              <div className="pt-4 border-t border-slate-700/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
                <span className="text-slate-400">
                  ¿Eres un nuevo cliente exportador?
                </span>
                <button
                  type="button"
                  onClick={() => navigate('/registro')}
                  className="font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
                >
                  <UserPlus size={14} />
                  Crear Cuenta Exportador B2B
                </button>
              </div>

            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
