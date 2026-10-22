import React, { useState, useEffect } from 'react';
import {
  Users, UserPlus, ShieldCheck, Ship, Truck, Zap, Trash2,
  RefreshCw, Search, Mail, Building2, KeyRound, CheckCircle2, AlertCircle
} from 'lucide-react';
import { logisticaApi } from '../services/api';
import { notificar, mensajeError } from '../services/notificaciones';

export default function DashboardAdmin() {
  const [usuarios, setUsuarios] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filtroRol, setFiltroRol] = useState('TODOS');
  const [busqueda, setBusqueda] = useState('');

  const [formData, setFormData] = useState({
    rol: 'PUERTO',
    empresa: '',
    nit: '',
    representante: '',
    email: '',
    telefono: '',
    password: ''
  });

  const [mensajeExito, setMensajeExito] = useState('');
  const [mensajeError, setMensajeError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const cargarUsuarios = async () => {
    try {
      const res = await logisticaApi.get('/usuarios');
      if (Array.isArray(res.data)) {
        setUsuarios(res.data);
      }
    } catch (error) {
      if (error?.code !== 'ERR_CANCELED') notificar(mensajeError(error, 'No se pudo cargar la lista de usuarios.'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const handleCrearUsuario = async (e) => {
    e.preventDefault();
    setMensajeError('');
    setMensajeExito('');
    setGuardando(true);

    try {
      const res = await logisticaApi.post('/usuarios/registro', {
        ...formData,
        saldoInicial: formData.rol === 'EXPORTADOR' ? 10000 : 0
      });

      setUsuarios(prev => [...prev, res.data]);
      setMensajeExito(`Usuario ${res.data.email} creado con rol ${res.data.rol} (${res.data.codigoExportador}).`);
      setFormData({
        rol: formData.rol,
        empresa: '',
        nit: '',
        representante: '',
        email: '',
        telefono: '',
        password: ''
      });
    } catch (err) {
      setMensajeError(err.response?.data?.error || 'No se pudo registrar el usuario.');
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (u) => {
    if (u.email === 'admin@portlogistics.com') {
      notificar('No puedes eliminar la cuenta principal de Super Administrador.');
      return;
    }
    try {
      await logisticaApi.delete(`/usuarios/${u.id}`);
      setUsuarios(prev => prev.filter(item => item.id !== u.id));
    } catch (err) {
      notificar(mensajeError(err, 'No se pudo eliminar el usuario.'));
    }
  };

  const badgeRol = (rol) => {
    switch (rol) {
      case 'NAVIERA':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'PUERTO':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'ADUANAS':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'ADMIN':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      default:
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    }
  };

  const usuariosFiltrados = usuarios.filter(u => {
    const coincideRol = filtroRol === 'TODOS' || u.rol === filtroRol;
    const coincideTexto =
      (u.email || '').toLowerCase().includes(busqueda.toLowerCase()) ||
      (u.empresa || '').toLowerCase().includes(busqueda.toLowerCase()) ||
      (u.representante || '').toLowerCase().includes(busqueda.toLowerCase()) ||
      (u.codigoExportador || '').toLowerCase().includes(busqueda.toLowerCase());
    return coincideRol && coincideTexto;
  });

  return (
    <div className="space-y-6 text-slate-900 dark:text-white">
      
      {/* CABECERA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Administración de Usuarios y Roles (IAM)
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Control de credenciales operativas para Terminal Portuaria, Línea Naviera, Control Aduanero y Exportadores.
          </p>
        </div>

        <button
          onClick={cargarUsuarios}
          className="self-start sm:self-auto flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs font-bold text-slate-200 hover:text-blue-400 cursor-pointer"
        >
          <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
          Sincronizar Directorio
        </button>
      </div>

      {/* KPIs DE USUARIOS POR ROL */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[
          { id: 'TODOS', label: 'Total Cuentas', count: usuarios.length, color: 'text-white' },
          { id: 'PUERTO', label: 'Operadores Puerto', count: usuarios.filter(u => u.rol === 'PUERTO').length, color: 'text-emerald-400' },
          { id: 'NAVIERA', label: 'Línea Naviera', count: usuarios.filter(u => u.rol === 'NAVIERA').length, color: 'text-amber-400' },
          { id: 'ADUANAS', label: 'Inspectores Aduana', count: usuarios.filter(u => u.rol === 'ADUANAS').length, color: 'text-red-400' },
          { id: 'EXPORTADOR', label: 'Exportadores B2B', count: usuarios.filter(u => u.rol === 'EXPORTADOR').length, color: 'text-blue-400' }
        ].map(k => (
          <div
            key={k.id}
            onClick={() => setFiltroRol(k.id)}
            className={`bg-slate-800/90 p-4 rounded-xl border cursor-pointer transition-all ${
              filtroRol === k.id ? 'border-blue-500 ring-1 ring-blue-500/30' : 'border-slate-700/80 hover:border-slate-600'
            }`}
          >
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              {k.label}
            </span>
            <span className={`text-2xl font-black mt-1 block ${k.color}`}>
              {k.count}
            </span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* FORMULARIO PARA CREAR OPERADORES (PUERTO, NAVIERA, ADUANAS, ADMIN) */}
        <div className="bg-slate-800/90 rounded-xl border border-slate-700/80 overflow-hidden shadow-sm h-fit">
          <div className="px-6 py-4 bg-slate-900/70 border-b border-slate-700/80 flex items-center gap-2">
            <UserPlus size={18} className="text-blue-400" />
            <h2 className="text-sm font-black uppercase tracking-wider text-white">
              Registrar Nuevo Usuario Operativo
            </h2>
          </div>

          <form onSubmit={handleCrearUsuario} className="p-6 space-y-4">
            {mensajeError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold flex items-center gap-2">
                <AlertCircle size={15} />
                <span>{mensajeError}</span>
              </div>
            )}

            {mensajeExito && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 size={15} />
                <span>{mensajeExito}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                Rol del Usuario en Plataforma *
              </label>
              <select
                value={formData.rol}
                onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-blue-500/40 text-sm font-bold text-white cursor-pointer"
              >
                <option value="PUERTO">Terminal Portuaria (PUERTO)</option>
                <option value="NAVIERA">Línea Naviera (NAVIERA)</option>
                <option value="ADUANAS">Control Aduanero (ADUANAS)</option>
                <option value="EXPORTADOR">Cliente Exportador (EXPORTADOR)</option>
                <option value="ADMIN">Administrador General (ADMIN)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                Entidad / Dependencia / Empresa *
              </label>
              <input
                type="text"
                required
                placeholder="Ej. APM Terminals Quetzal / SAT / Maersk"
                value={formData.empresa}
                onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                  Nombre del Operador *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Carlos Méndez"
                  value={formData.representante}
                  onChange={(e) => setFormData({ ...formData, representante: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                  NIT / ID Interno *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. OP-4092"
                  value={formData.nit}
                  onChange={(e) => setFormData({ ...formData, nit: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                Correo Electrónico de Acceso *
              </label>
              <input
                type="email"
                required
                placeholder="operador@puertoquetzal.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                  Contraseña *
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                  Teléfono
                </label>
                <input
                  type="text"
                  placeholder="+502 5555-0000"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={guardando}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-blue-600/20 cursor-pointer transition-all"
            >
              {guardando ? 'Guardando en PostgreSQL...' : `Crear Usuario de ${formData.rol}`}
            </button>
          </form>
        </div>

        {/* TABLA DE USUARIOS REGISTRADOS EN POSTGRESQL */}
        <div className="lg:col-span-2 bg-slate-800/90 rounded-xl border border-slate-700/80 overflow-hidden shadow-sm flex flex-col">
          <div className="p-4 bg-slate-900/70 border-b border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-blue-400" />
              <h3 className="text-sm font-black uppercase tracking-wider text-white">
                Directorio Activo en PostgreSQL ({usuariosFiltrados.length})
              </h3>
            </div>

            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por correo, rol o nombre..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-700/80 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-900/40">
                  <th className="py-3 px-5">Código / Operador</th>
                  <th className="py-3 px-5">Rol Asignado</th>
                  <th className="py-3 px-5">Correo (Login)</th>
                  <th className="py-3 px-5">Contraseña</th>
                  <th className="py-3 px-5 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60 text-sm">
                {usuariosFiltrados.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="py-3.5 px-5">
                      <span className="font-mono text-xs font-bold text-blue-400 block">
                        {u.codigoExportador}
                      </span>
                      <span className="font-bold text-white block">{u.representante}</span>
                      <span className="text-xs text-slate-400">{u.empresa}</span>
                    </td>

                    <td className="py-3.5 px-5">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-black border ${badgeRol(u.rol)}`}>
                        {u.rol}
                      </span>
                    </td>

                    <td className="py-3.5 px-5 font-mono text-xs text-slate-200">
                      {u.email}
                    </td>

                    <td className="py-3.5 px-5 font-mono text-xs text-slate-400">
                      {u.password}
                    </td>

                    <td className="py-3.5 px-5 text-right">
                      <button
                        onClick={() => handleEliminar(u)}
                        className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors cursor-pointer"
                        title="Eliminar usuario"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
