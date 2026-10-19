import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Anchor, Search, Wallet, Sun, Moon, Bell, User, LogOut,
  ShieldCheck, Ship, Truck, Settings, AlertTriangle, Gavel,
  Box, CheckCircle2, X
} from 'lucide-react';
import { logisticaApi } from '../services/api';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const notifRef = useRef(null);

  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  });

  const [saldo, setSaldo] = useState(0);
  const [rolActual, setRolActual] = useState('EXPORTADOR');
  const [usuarioDatos, setUsuarioDatos] = useState(null);

  // Estados para Notificaciones Reales
  const [notificaciones, setNotificaciones] = useState([]);
  const [mostrarNotif, setMostrarNotif] = useState(false);
  const [leidasIds, setLeidasIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('notifLeidas') || '[]');
    } catch {
      return [];
    }
  });

  // Sincronizar tema oscuro/claro
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Cerrar dropdown de notificaciones al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setMostrarNotif(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Leer rol y recuperar datos reales del usuario desde localStorage o PostgreSQL
  const sincronizarSesion = async () => {
    const rolGuardado = (
      location.state?.rol ||
      localStorage.getItem('userRole') ||
      localStorage.getItem('rol') ||
      localStorage.getItem('role') ||
      'EXPORTADOR'
    ).toUpperCase();

    setRolActual(rolGuardado);

    try {
      const rawUser =
        localStorage.getItem('usuarioActivo') ||
        (rolGuardado === 'EXPORTADOR' ? localStorage.getItem('exportadorActivo') : null) ||
        localStorage.getItem('operadorActivo');

      if (rawUser) {
        const parsed = JSON.parse(rawUser);
        if (parsed && (parsed.representante || parsed.empresa || parsed.email)) {
          setUsuarioDatos(parsed);
          return;
        }
      }

      // Si no había datos completos en localStorage, buscar en PostgreSQL (/usuarios)
      const resUsuarios = await logisticaApi.get('/usuarios');
      if (Array.isArray(resUsuarios.data) && resUsuarios.data.length > 0) {
        const coincidencia =
          resUsuarios.data.find(u => (u.rol || 'EXPORTADOR').toUpperCase() === rolGuardado) ||
          resUsuarios.data[0];

        if (coincidencia) {
          setUsuarioDatos(coincidencia);
          localStorage.setItem('usuarioActivo', JSON.stringify(coincidencia));
          if (rolGuardado === 'EXPORTADOR') {
            localStorage.setItem('exportadorActivo', JSON.stringify(coincidencia));
          }
        }
      }
    } catch {
      // Mantiene respaldo si la red está cargando
    }
  };

  useEffect(() => {
    sincronizarSesion();
    window.addEventListener('storage', sincronizarSesion);
    return () => window.removeEventListener('storage', sincronizarSesion);
  }, [location]);

  // Cargar Saldo + Generar Notificaciones Reales desde PostgreSQL
  const cargarDatosTiempoReal = async () => {
    try {
      const promesas = [
        logisticaApi.get('/contenedores'),
        logisticaApi.get('/licitaciones'),
        logisticaApi.get('/buques')
      ];

      if (rolActual === 'EXPORTADOR') {
        promesas.push(logisticaApi.get('/billetera/saldo'));
      }

      const [resCont, resLic, resBuques, resSaldo] = await Promise.allSettled(promesas);

      if (resSaldo && resSaldo.status === 'fulfilled' && typeof resSaldo.value.data?.saldo === 'number') {
        setSaldo(resSaldo.value.data.saldo);
      }

      const listaAlertas = [];

      // 1. Alertas de Contenedores (Retenciones, Adjudicaciones y Despachos)
      if (resCont.status === 'fulfilled' && Array.isArray(resCont.value.data)) {
        resCont.value.data.forEach((c) => {
          const est = (c.estado || '').toLowerCase();
          const retenido = Boolean(c.retenidoPorAduana) || est.includes('retenido') || est.includes('rojo');

          if (retenido) {
            listaAlertas.push({
              id: `ret-${c.id}`,
              tipo: 'URGENTE',
              titulo: `Alerta Aduanera: ${c.codigo}`,
              detalle: c.motivoRetencion || `Contenedor retenido en inspección fiscal (${c.estado}).`,
              ruta: '/dashboard',
              color: 'red'
            });
          } else if (est.includes('despacho') || est.includes('gate-out') || est.includes('levante')) {
            listaAlertas.push({
              id: `out-${c.id}`,
              tipo: 'EXITO',
              titulo: `Salida Autorizada: ${c.codigo}`,
              detalle: `Tu contenedor cuenta con levante libre y autorización de salida en terminal.`,
              ruta: '/dashboard',
              color: 'emerald'
            });
          } else if (est.includes('adjudicado') || est.includes('embarcado')) {
            listaAlertas.push({
              id: `emb-${c.id}`,
              tipo: 'INFO',
              titulo: `Carga Registrada: ${c.codigo}`,
              detalle: `${c.estado.split('|')[0].trim()}`,
              ruta: '/dashboard',
              color: 'blue'
            });
          }
        });
      }

      // 2. Alertas de Subastas Activas
      if (resLic.status === 'fulfilled' && Array.isArray(resLic.value.data)) {
        const activas = resLic.value.data.filter(l => l.estado !== 'ADJUDICADA');
        activas.forEach((l) => {
          listaAlertas.push({
            id: `lic-${l.id}-${l.pujaActual}`,
            tipo: 'SUBASTA',
            titulo: `Subasta en Vivo: ${l.buque}`,
            detalle: `${l.espaciosTeu || 10} TEUs disponibles • Oferta actual: $${Number(l.pujaActual ?? l.precioBase ?? 950).toLocaleString('en-US')}`,
            ruta: '/subastas',
            color: 'amber'
          });
        });
      }

      // 3. Alertas de Buques Atracados con Espacio Disponible
      if (resBuques.status === 'fulfilled' && Array.isArray(resBuques.value.data)) {
        const atracados = resBuques.value.data.filter(
          b => b.estado && b.estado.includes('Atracado') && Number(b.teuDisponibles) > 0
        );
        atracados.forEach((b) => {
          listaAlertas.push({
            id: `buq-${b.id}`,
            tipo: 'BUQUE',
            titulo: `Buque en Muelle: ${b.nombre}`,
            detalle: `Listo para embarque (${Number(b.teuDisponibles).toLocaleString('en-US')} TEUs libres) • ${b.ruta}`,
            ruta: '/dashboard',
            color: 'blue'
          });
        });
      }

      setNotificaciones(listaAlertas.slice(0, 12));
    } catch (err) {
      console.warn('Error actualizando notificaciones:', err);
    }
  };

  useEffect(() => {
    cargarDatosTiempoReal();
    const interval = setInterval(cargarDatosTiempoReal, 4000);
    return () => clearInterval(interval);
  }, [rolActual]);

  const marcarTodasLeidas = () => {
    const todosIds = notificaciones.map(n => n.id);
    setLeidasIds(todosIds);
    localStorage.setItem('notifLeidas', JSON.stringify(todosIds));
  };

  const abrirNotificacion = (notif) => {
    if (!leidasIds.includes(notif.id)) {
      const nuevas = [...leidasIds, notif.id];
      setLeidasIds(nuevas);
      localStorage.setItem('notifLeidas', JSON.stringify(nuevas));
    }
    setMostrarNotif(false);
    if (notif.ruta) navigate(notif.ruta);
  };

  const noLeidasCount = notificaciones.filter(n => !leidasIds.includes(n.id)).length;

  // Información de perfil personalizada con el nombre real del Exportador u Operador
  const obtenerInfoRol = () => {
    const nombrePersona = usuarioDatos?.representante || usuarioDatos?.nombre || null;
    const nombreEmpresa = usuarioDatos?.empresa || null;
    const codigoUsuario = usuarioDatos?.codigoExportador || null;

    switch (rolActual) {
      case 'PUERTO':
      case 'PORTUARIO':
        return {
          tituloPrincipal: nombrePersona || 'Control de Terminal',
          subtitulo: `${nombreEmpresa || 'Terminal Portuaria'} • ${codigoUsuario || 'PTO-001'}`,
          credencial: codigoUsuario || 'PTO-001',
          insigniaNavbar: 'Operaciones de Patio y Muelle',
          colorInsignia: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
          Icono: Truck
        };
      case 'NAVIERA':
        return {
          tituloPrincipal: nombrePersona || 'Jefe de Operaciones',
          subtitulo: `${nombreEmpresa || 'Línea Naviera'} • ${codigoUsuario || 'NAV-001'}`,
          credencial: codigoUsuario || 'NAV-001',
          insigniaNavbar: 'Dirección de Flota y Buques',
          colorInsignia: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
          Icono: Ship
        };
      case 'ADUANAS':
      case 'ADUANA':
        return {
          tituloPrincipal: nombrePersona || 'Inspector Fiscal SAT',
          subtitulo: `${nombreEmpresa || 'Control Aduanero'} • ${codigoUsuario || 'ADU-001'}`,
          credencial: codigoUsuario || 'ADU-001',
          insigniaNavbar: 'Fiscalización y Semáforo',
          colorInsignia: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30',
          Icono: ShieldCheck
        };
      case 'ADMIN':
      case 'ADMINISTRADOR':
        return {
          tituloPrincipal: nombrePersona || 'Administrador IAM',
          subtitulo: `${nombreEmpresa || 'Gestión de Accesos'} • ${codigoUsuario || 'ADM-001'}`,
          credencial: codigoUsuario || 'ADM-001',
          insigniaNavbar: 'Directorio de Usuarios y Roles',
          colorInsignia: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
          Icono: Settings
        };
      case 'EXPORTADOR':
      default:
        return {
          tituloPrincipal: nombrePersona || nombreEmpresa || 'Kevin López',
          subtitulo: `${nombreEmpresa ? nombreEmpresa.toUpperCase() : 'EXPORTADOR B2B'} • ${codigoUsuario || 'EXP-001'}`,
          credencial: codigoUsuario || 'EXP-001',
          insigniaNavbar: null,
          colorInsignia: '',
          Icono: User
        };
    }
  };

  const infoPerfil = obtenerInfoRol();
  const IconoRol = infoPerfil.Icono;

  const cerrarSesion = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('rol');
    localStorage.removeItem('role');
    localStorage.removeItem('usuarioActivo');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b1120] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      
      {/* BARRA SUPERIOR (NAVBAR) */}
      <header className="sticky top-0 z-50 h-16 bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between">
        
        {/* Izquierda: Logo + Buscador */}
        <div className="flex items-center gap-6">
          <div
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2.5 cursor-pointer"
          >
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm shadow-blue-600/30">
              <Anchor size={20} className="text-white" />
            </div>
            <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
              PORT LOGISTICS
            </span>
          </div>

          <div className="hidden md:flex items-center relative w-72">
            <Search size={15} className="absolute left-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar contenedor, buque o BL..."
              className="w-full pl-9 pr-4 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Derecha: Saldo + Tema + Campana de Notificaciones Real + Perfil del Usuario */}
        <div className="flex items-center gap-3 sm:gap-4">
          
          {rolActual === 'EXPORTADOR' ? (
            <div
              onClick={() => navigate('/billetera')}
              className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 cursor-pointer hover:bg-emerald-500/15 transition-all"
              title="Ir a Billetera Virtual"
            >
              <Wallet size={16} className="text-emerald-600 dark:text-emerald-400" />
              <div className="leading-tight">
                <span className="text-[9px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
                  SALDO DISP.
                </span>
                <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                  ${Number(saldo).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          ) : (
            <div className={`hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-bold ${infoPerfil.colorInsignia}`}>
              <IconoRol size={15} />
              <span>{infoPerfil.insigniaNavbar}</span>
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-900/10 dark:bg-white/10">
                {infoPerfil.credencial}
              </span>
            </div>
          )}

          {/* Tema Claro / Oscuro */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-blue-500 cursor-pointer transition-colors"
            title="Cambiar tema visual"
          >
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* CAMPANA DE NOTIFICACIONES CON DATOS REALES */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setMostrarNotif(!mostrarNotif)}
              className="relative w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-blue-500 cursor-pointer transition-colors"
              title="Centro de Notificaciones en Tiempo Real"
            >
              <Bell size={16} />
              {noLeidasCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center shadow-sm">
                  {noLeidasCount > 9 ? '9+' : noLeidasCount}
                </span>
              )}
            </button>

            {/* Menú Desplegable de Notificaciones */}
            {mostrarNotif && (
              <div className="absolute right-0 mt-2.5 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-50">
                <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell size={15} className="text-blue-500" />
                    <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                      Notificaciones en Vivo ({notificaciones.length})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {noLeidasCount > 0 && (
                      <button
                        onClick={marcarTodasLeidas}
                        className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                      >
                        Marcar leídas
                      </button>
                    )}
                    <button
                      onClick={() => setMostrarNotif(false)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                    >
                      <X size={15} />
                    </button>
                  </div>
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                  {notificaciones.length === 0 ? (
                    <div className="py-8 px-4 text-center text-xs text-slate-400">
                      No hay alertas operativas pendientes en este momento.
                    </div>
                  ) : (
                    notificaciones.map((n) => {
                      const esLeida = leidasIds.includes(n.id);
                      return (
                        <div
                          key={n.id}
                          onClick={() => abrirNotificacion(n)}
                          className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors ${
                            esLeida
                              ? 'bg-white dark:bg-slate-900 opacity-75 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                              : 'bg-blue-50/50 dark:bg-blue-950/20 hover:bg-blue-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          <div
                            className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                              n.color === 'red'
                                ? 'bg-red-500/10 text-red-500'
                                : n.color === 'amber'
                                ? 'bg-amber-500/10 text-amber-500'
                                : n.color === 'emerald'
                                ? 'bg-emerald-500/10 text-emerald-500'
                                : 'bg-blue-500/10 text-blue-500'
                            }`}
                          >
                            {n.color === 'red' ? (
                              <AlertTriangle size={15} />
                            ) : n.color === 'amber' ? (
                              <Gavel size={15} />
                            ) : n.color === 'emerald' ? (
                              <CheckCircle2 size={15} />
                            ) : n.tipo === 'BUQUE' ? (
                              <Ship size={15} />
                            ) : (
                              <Box size={15} />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs font-black text-slate-900 dark:text-white truncate">
                                {n.titulo}
                              </p>
                              {!esLeida && (
                                <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                              {n.detalle}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="h-7 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>

          {/* PERFIL CON NOMBRE REAL DEL EXPORTADOR / USUARIO */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block leading-tight">
              <span className="text-xs font-black tracking-wide text-slate-900 dark:text-white block">
                {infoPerfil.tituloPrincipal}
              </span>
              <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 block">
                {infoPerfil.subtitulo}
              </span>
            </div>

            <div className="w-9 h-9 rounded-full bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
              <IconoRol size={17} />
            </div>

            <button
              onClick={cerrarSesion}
              className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
              title="Cerrar Sesión"
            >
              <LogOut size={17} />
            </button>
          </div>

        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
