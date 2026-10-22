import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Anchor, ArrowRight, ShieldCheck, Ship, Zap, LogIn,
  Gavel, Box, Navigation, RefreshCw, CheckCircle2,
  Building2, Truck, Container, ChevronRight, Activity, Sun, Wind
} from 'lucide-react';
import { logisticaApi } from '../services/api';

export default function Landing() {
  const navigate = useNavigate();
  const seccionOperacionesRef = useRef(null);
  const seccionComoFuncionaRef = useRef(null);

  const [buques, setBuques] = useState([]);
  const [licitacionesActivas, setLicitacionesActivas] = useState([]);
  const [contenedoresTotal, setContenedoresTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [ultimaActualizacion, setUltimaActualizacion] = useState('');

  // Cargar datos reales desde Spring Boot / PostgreSQL
  const cargarEstadoPortuario = async () => {
    try {
      const [resBuques, resLic, resCont] = await Promise.allSettled([
        logisticaApi.get('/buques'),
        logisticaApi.get('/licitaciones'),
        logisticaApi.get('/contenedores')
      ]);

      if (resBuques.status === 'fulfilled' && Array.isArray(resBuques.value.data)) {
        setBuques(resBuques.value.data);
      }

      if (resLic.status === 'fulfilled' && Array.isArray(resLic.value.data)) {
        const activas = resLic.value.data.filter(l => l.estado !== 'ADJUDICADA');
        setLicitacionesActivas(activas);
      }

      if (resCont.status === 'fulfilled' && Array.isArray(resCont.value.data)) {
        setContenedoresTotal(resCont.value.data.length);
      }

      const ahora = new Date();
      setUltimaActualizacion(
        ahora.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    } catch {
      // Portal en modo sin conexión: se muestran los valores por defecto
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    cargarEstadoPortuario();
    // Sincronización automática cada 4 segundos igual que en los dashboards
    const intervalo = setInterval(cargarEstadoPortuario, 4000);
    return () => clearInterval(intervalo);
  }, []);

  // Cálculos en tiempo real de la flota y subastas
  const buquesAtracados = buques.filter(b => b.estado && b.estado.includes('Atracado'));
  const buquesEnRuta = buques.filter(b => !b.estado || !b.estado.includes('Atracado'));

  const teusTotalesFlota = buques.reduce(
    (acc, b) => acc + (Number(b.teuDisponibles) || 0),
    0
  );

  const teusEnAtracados = buquesAtracados.reduce(
    (acc, b) => acc + (Number(b.teuDisponibles) || 0),
    0
  );

  // Scroll suave hacia las secciones
  const irASeccion = (ref) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1120] text-slate-100 flex flex-col font-sans selection:bg-blue-500/30">
      
      {/* NAVBAR SUPERIOR ESTILO DASHBOARD */}
      <nav className="sticky top-0 z-50 bg-[#0f172a]/95 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          
          {/* Logo Port Logistics */}
          <div
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-3 cursor-pointer"
          >
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center shadow-md shadow-blue-600/30">
              <Anchor size={20} className="text-white" />
            </div>
            <span className="text-lg font-black tracking-wide text-white">
              PORT LOGISTICS
            </span>
          </div>

          {/* Enlaces y Estado en Vivo */}
          <div className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-300">
            <button
              onClick={() => irASeccion(seccionOperacionesRef)}
              className="hover:text-blue-400 transition-colors cursor-pointer flex items-center gap-2"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              Monitor de Puerto ({buquesAtracados.length} en Muelle)
            </button>
            <button
              onClick={() => irASeccion(seccionOperacionesRef)}
              className="hover:text-amber-400 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Gavel size={14} className="text-amber-400" />
              Subastas Activas ({licitacionesActivas.length})
            </button>
            <button
              onClick={() => irASeccion(seccionComoFuncionaRef)}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Cómo funciona
            </button>
          </div>

          {/* Botones de Acción */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
              <Box size={14} />
              <span>{teusTotalesFlota.toLocaleString('en-US')} TEUs Libres</span>
            </div>

            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all shadow-md shadow-blue-600/20 cursor-pointer"
            >
              <LogIn size={15} />
              Iniciar Sesión
            </button>
          </div>
        </div>
      </nav>

      {/* HERO PRINCIPAL + RESUMEN EJECUTIVO EN TIEMPO REAL */}
      <header className="relative pt-14 pb-12 px-6 border-b border-slate-800/80 overflow-hidden">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-72 bg-blue-600/10 blur-[130px] rounded-full pointer-events-none"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-800/90 border border-slate-700 text-blue-400 text-[11px] font-bold uppercase tracking-wider mb-5">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              Ecosistema Portuario Conectado en Tiempo Real
            </div>

            <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight text-white mb-5">
              Gestión Logística y{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                Aduanera Inteligente
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-400 leading-relaxed mb-8">
              Consulta la disponibilidad real de TEUs en buques atracados, compite en subastas en vivo, gestiona tu billetera virtual B2B y monitorea el semáforo aduanero y despacho Gate-Out desde un solo panel.
            </p>

            {/* Botones Principales */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => navigate('/login')}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-lg shadow-blue-600/25 cursor-pointer group"
              >
                Acceder al Portal Operativo
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => irASeccion(seccionOperacionesRef)}
                className="flex items-center gap-2 px-5 py-3 bg-slate-800/90 hover:bg-slate-800 text-amber-400 border border-amber-500/30 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer"
              >
                <Gavel size={16} />
                Ver Subastas y Buques ({licitacionesActivas.length} en vivo)
              </button>

              <button
                onClick={() => navigate('/registro')}
                className="flex items-center gap-2 px-5 py-3 bg-slate-800/60 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer"
              >
                Crear Cuenta Exportador
              </button>
            </div>
          </div>

          {/* 4 TARJETAS KPI EN VIVO (MISMO ESTILO QUE DASHBOARD NAVIERA Y EXPORTADOR) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* KPI 1: Buques en Puerto */}
            <div className="bg-slate-800/80 rounded-xl p-5 border border-slate-700/80 border-t-2 border-t-blue-500 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                  <Ship size={14} /> Buques en Operación
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Flota Activa
                </span>
              </div>
              <div className="text-3xl font-black text-white mb-2">
                {buques.length}
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  {buquesAtracados.length} atracados en puerto
                </span>
                <span className="flex items-center gap-1.5 text-blue-400">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  {buquesEnRuta.length} en ruta
                </span>
              </div>
            </div>

            {/* KPI 2: Subastas en Vivo */}
            <div className="bg-slate-800/80 rounded-xl p-5 border border-slate-700/80 border-t-2 border-t-amber-500 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Gavel size={14} /> Subastas TEU en Vivo
                </span>
                <span className={`w-2.5 h-2.5 rounded-full ${licitacionesActivas.length > 0 ? 'bg-amber-500 animate-ping' : 'bg-slate-600'}`}></span>
              </div>
              <div className="text-3xl font-black text-white mb-2">
                {licitacionesActivas.length}
              </div>
              <p className="text-xs text-slate-400">
                {licitacionesActivas.length > 0
                  ? 'Recibiendo ofertas de exportadores ahora.'
                  : 'Sin lotes abiertos en este momento.'}
              </p>
            </div>

            {/* KPI 3: Capacidad Disponible en Buques */}
            <div className="bg-slate-800/80 rounded-xl p-5 border border-slate-700/80 border-t-2 border-t-emerald-500 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <Box size={14} /> Capacidad Disponible
                </span>
                <Activity size={14} className="text-emerald-400" />
              </div>
              <div className="text-3xl font-black text-white mb-2">
                {teusTotalesFlota.toLocaleString('en-US')}{' '}
                <span className="text-sm font-semibold text-slate-400">TEUs</span>
              </div>
              <p className="text-xs text-slate-400">
                <strong className="text-emerald-400">{teusEnAtracados.toLocaleString('en-US')} TEUs</strong> listos en muelle para carga inmediata.
              </p>
            </div>

            {/* KPI 4: Contenedores & Clima Portuario */}
            <div className="bg-slate-800/80 rounded-xl p-5 border border-slate-700/80 border-t-2 border-t-purple-500 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                  <Container size={14} /> Cargas en Terminal
                </span>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                  Puerto Quetzal
                </span>
              </div>
              <div className="text-3xl font-black text-white mb-2">
                {contenedoresTotal}
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Sun size={13} className="text-amber-400" /> 28°C
                </span>
                <span className="flex items-center gap-1">
                  <Wind size={13} className="text-blue-400" /> 12 nudos
                </span>
                <span className="text-emerald-400 font-semibold">Operativo</span>
              </div>
            </div>

          </div>
        </div>
      </header>

      {/* MONITOR EN TIEMPO REAL: ESTADO DE BUQUES Y SUBASTAS ACTIVAS */}
      <section ref={seccionOperacionesRef} className="py-12 px-6 max-w-7xl mx-auto w-full space-y-8">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
              <Activity size={22} className="text-blue-400" />
              Monitor Portuario de Flota y Subastas en Tiempo Real
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Información sincronizada directamente con las Navieras y la Terminal Portuaria.
              {ultimaActualizacion && ` Última sincronización: ${ultimaActualizacion}`}
            </p>
          </div>

          <button
            onClick={cargarEstadoPortuario}
            className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-300 cursor-pointer transition-colors"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin text-blue-400' : ''} />
            Actualizar Monitor
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* COLUMNA IZQUIERDA (2/3): TABLA DE BUQUES Y CAPACIDAD TEU */}
          <div className="lg:col-span-2 bg-slate-800/80 rounded-xl border border-slate-700/80 overflow-hidden shadow-sm">
            <div className="px-6 py-4 bg-slate-900/60 border-b border-slate-700/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Ship size={18} className="text-blue-400" />
                <h3 className="text-sm font-black uppercase tracking-wider text-white">
                  Estado de Buques y Disponibilidad de Bodega
                </h3>
              </div>
              <span className="text-xs font-bold text-emerald-400">
                {buquesAtracados.length} disponibles para embarque
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-700/80 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-900/30">
                    <th className="py-3.5 px-5">Buque / IMO</th>
                    <th className="py-3.5 px-5">Ruta Comercial</th>
                    <th className="py-3.5 px-5">Espacio Libre (TEUs)</th>
                    <th className="py-3.5 px-5">Estado en Puerto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60 text-sm">
                  {buques.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-8 text-center text-xs text-slate-400">
                        Cargando flota de buques...
                      </td>
                    </tr>
                  ) : (
                    buques.map((b) => {
                      const atracado = b.estado && b.estado.includes('Atracado');
                      const libres = Number(b.teuDisponibles || 0);
                      const tieneEspacio = libres > 0;

                      return (
                        <tr key={b.id} className="hover:bg-slate-700/30 transition-colors">
                          <td className="py-4 px-5">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                                atracado ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'
                              }`}>
                                <Ship size={18} />
                              </div>
                              <div>
                                <p className="font-bold text-white">{b.nombre}</p>
                                <p className="text-[11px] font-mono text-slate-400">{b.imo}</p>
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-5 text-xs text-slate-300 font-medium">
                            {b.ruta}
                          </td>

                          <td className="py-4 px-5">
                            {tieneEspacio ? (
                              <div>
                                <span className="font-black text-emerald-400">
                                  {libres.toLocaleString('en-US')} TEUs
                                </span>
                                <span className="block text-[11px] text-slate-400">
                                  de {Number(b.capacidadTotal || 20000).toLocaleString('en-US')} máx.
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs font-bold text-red-400">
                                Sin espacio disponible
                              </span>
                            )}
                          </td>

                          <td className="py-4 px-5">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                              atracado
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            }`}>
                              {atracado ? <Anchor size={12} /> : <Navigation size={12} />}
                              {b.estado || 'En Ruta'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* COLUMNA DERECHA (1/3): SUBASTAS EN VIVO DISPONIBLES */}
          <div className="bg-slate-800/80 rounded-xl border border-slate-700/80 flex flex-col justify-between overflow-hidden shadow-sm">
            <div>
              <div className="px-5 py-4 bg-slate-900/60 border-b border-slate-700/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Gavel size={17} className="text-amber-400" />
                  <h3 className="text-sm font-black uppercase tracking-wider text-white">
                    Subastas Abiertas Hoy
                  </h3>
                </div>
                <span className="px-2 py-0.5 text-[11px] font-black rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  {licitacionesActivas.length} Activas
                </span>
              </div>

              <div className="p-4 space-y-3 max-h-[320px] overflow-y-auto">
                {licitacionesActivas.length === 0 ? (
                  <div className="text-center py-8 px-4">
                    <Gavel size={28} className="text-slate-600 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-300">
                      No hay subastas activas en este instante
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Ingresa como Naviera para publicar nuevos lotes de TEUs o reserva un contenedor directo como Exportador.
                    </p>
                  </div>
                ) : (
                  licitacionesActivas.map((lic) => (
                    <div
                      key={lic.id}
                      onClick={() => navigate('/login')}
                      className="p-3.5 rounded-lg bg-slate-900/70 border border-slate-700/80 hover:border-amber-500/50 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          Lote #{lic.id} • {lic.espaciosTeu || 10} TEUs
                        </span>
                        <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                          EN VIVO
                        </span>
                      </div>

                      <p className="text-sm font-black text-white group-hover:text-amber-400 transition-colors">
                        {lic.buque}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate mb-2.5">
                        {lic.ruta}
                      </p>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                        <div>
                          <span className="text-[10px] uppercase text-slate-400 block">Oferta Actual</span>
                          <span className="text-sm font-black text-emerald-400">
                            ${Number(lic.pujaActual ?? lic.precioBase ?? 950).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-blue-400 flex items-center gap-1">
                          Pujar ahora <ChevronRight size={14} />
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-900/50 border-t border-slate-700/80">
              <button
                onClick={() => navigate('/login')}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
              >
                Entrar a la Sala de Subastas
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* SECCIÓN: CÓMO FUNCIONA (LOS 4 MÓDULOS CON ACCESO DIRECTO) */}
      <section ref={seccionComoFuncionaRef} className="py-14 px-6 bg-[#0f172a]/80 border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
              Ecosistema Integrado de 4 Roles Operativos
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Cada acción se sincroniza automáticamente en PostgreSQL entre el Exportador, la Naviera, la Terminal Portuaria y Aduanas.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            
            {/* Rol 1: Exportador */}
            <div className="bg-slate-800/80 p-6 rounded-xl border border-slate-700/80 hover:border-blue-500/40 transition-all flex flex-col justify-between">
              <div>
                <div className="w-11 h-11 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
                  <Zap size={22} />
                </div>
                <h3 className="text-base font-black text-white mb-2">1. Cliente Exportador</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Recarga su Billetera Virtual, registra contenedores, puja en subastas de TEUs y rastrea el estatus aduanero y portuario de sus cargas.
                </p>
              </div>
              <button
                onClick={() => navigate('/login')}
                className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
              >
                Ingresar como Exportador <ArrowRight size={14} />
              </button>
            </div>

            {/* Rol 2: Naviera */}
            <div className="bg-slate-800/80 p-6 rounded-xl border border-slate-700/80 hover:border-amber-500/40 transition-all flex flex-col justify-between">
              <div>
                <div className="w-11 h-11 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
                  <Ship size={22} />
                </div>
                <h3 className="text-base font-black text-white mb-2">2. Línea Naviera</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Administra el atraque y zarpe de buques, publica subastas de espacios libres (TEUs) cuando el buque está en muelle y adjudica lotes al mejor postor.
                </p>
              </div>
              <button
                onClick={() => navigate('/login')}
                className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
              >
                Ingresar como Naviera <ArrowRight size={14} />
              </button>
            </div>

            {/* Rol 3: Terminal Portuaria */}
            <div className="bg-slate-800/80 p-6 rounded-xl border border-slate-700/80 hover:border-emerald-500/40 transition-all flex flex-col justify-between">
              <div>
                <div className="w-11 h-11 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
                  <Truck size={22} />
                </div>
                <h3 className="text-base font-black text-white mb-2">3. Operaciones Puerto</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Controla la recepción en patio (Gate-In), asigna muelles y grúas pórtico, y autoriza la salida (Gate-Out) validando que no existan bloqueos.
                </p>
              </div>
              <button
                onClick={() => navigate('/login')}
                className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
              >
                Ingresar como Puerto <ArrowRight size={14} />
              </button>
            </div>

            {/* Rol 4: Aduanas */}
            <div className="bg-slate-800/80 p-6 rounded-xl border border-slate-700/80 hover:border-red-500/40 transition-all flex flex-col justify-between">
              <div>
                <div className="w-11 h-11 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-4">
                  <ShieldCheck size={22} />
                </div>
                <h3 className="text-base font-black text-white mb-2">4. Control Aduanero</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Opera el Semáforo Fiscal (Levante Libre, Revisión Documental o Retención en Canal Rojo), bloqueando salidas en Puerto de forma instantánea.
                </p>
              </div>
              <button
                onClick={() => navigate('/login')}
                className="text-xs font-bold text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer"
              >
                Ingresar como Aduanas <ArrowRight size={14} />
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-6 px-6 border-t border-slate-800/80 bg-[#0b1120] text-center">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2 font-bold text-slate-400">
            <Anchor size={15} className="text-blue-500" />
            PORT LOGISTICS • Sistema de Gestión Marítima y Aduanera
          </div>
          <p>© {new Date().getFullYear()} Todos los derechos reservados.</p>
        </div>
      </footer>

    </div>
  );
}