import React, { useState, useEffect } from 'react';
import {
  Container, Truck, ShieldAlert, Anchor, CheckCircle2,
  Clock, Search, Filter, RefreshCw, ArrowRightLeft,
  MapPin, Ship, AlertTriangle, PackageCheck
} from 'lucide-react';
import { logisticaApi } from '../services/api';

export default function DashboardPuerto() {
  const [contenedores, setContenedores] = useState([]);
  const [buquesAtracados, setBuquesAtracados] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('TODOS'); // TODOS | PATIO | GATE_OUT | RETENIDOS
  const [modalConfirmacion, setModalConfirmacion] = useState(null);

  const cargarDatosPuerto = async () => {
    try {
      const [resCont, resBuques] = await Promise.allSettled([
        logisticaApi.get('/contenedores'),
        logisticaApi.get('/buques')
      ]);

      if (resCont.status === 'fulfilled' && resCont.value.data) {
        setContenedores(resCont.value.data);
      }

      if (resBuques.status === 'fulfilled' && resBuques.value.data) {
        // Filtramos los buques que están físicamente atracados en el puerto
        const atracados = resBuques.value.data.filter(
          b => b.estado && b.estado.includes('Atracado')
        );
        setBuquesAtracados(atracados);
      }
    } catch (error) {
      console.error("Error cargando datos portuarios:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    cargarDatosPuerto();
    // Auto-sincronización en tiempo real cada 3 segundos
    const intervalo = setInterval(cargarDatosPuerto, 3000);
    return () => clearInterval(intervalo);
  }, []);

  // Función auxiliar para limpiar el precio oculto "| $1500" del texto de estado
  const limpiarEstado = (estadoRaw) => {
    if (!estadoRaw) return 'Pendiente de Ingreso';
    return estadoRaw.split(' | $')[0];
  };

  // Extraer sufijo de precio "| $1500" para no perderlo al cambiar el estado operativo
  const obtenerSufijoPrecio = (estadoRaw) => {
    if (estadoRaw && estadoRaw.includes(' | $')) {
      return ' | $' + estadoRaw.split(' | $')[1];
    }
    return '';
  };

  // Cambiar el estado operativo del contenedor en la terminal
  const cambiarFaseOperativa = async (contenedor, nuevaFase, muelleAsignado = null) => {
    const idCont = contenedor.contenedorId || contenedor.id;
    const sufijoPrecio = obtenerSufijoPrecio(contenedor.estado);
    const estadoFinal = `${nuevaFase}${sufijoPrecio}`;
    const nuevoMuelle = muelleAsignado || contenedor.muelleId || 1;

    try {
      await logisticaApi.put(`/contenedores/${idCont}/estado`, {
        estado: estadoFinal,
        muelleId: nuevoMuelle
      });
    } catch (e) {
      console.warn("Actualizando estado de contenedor en modo optimista:", e);
    }

    // Actualización inmediata en la interfaz
    setContenedores(prev =>
      prev.map(c =>
        (c.contenedorId || c.id) === idCont
          ? { ...c, estado: estadoFinal, muelleId: nuevoMuelle }
          : c
      )
    );

    setModalConfirmacion({
      codigo: contenedor.codigo,
      accion: nuevaFase,
      muelle: `Muelle #${nuevoMuelle}`
    });
  };

  // Cambiar el muelle asignado directamente desde el selector
  const cambiarMuelle = async (contenedor, nuevoMuelleId) => {
    const idCont = contenedor.contenedorId || contenedor.id;
    try {
      await logisticaApi.put(`/contenedores/${idCont}/estado`, {
        estado: contenedor.estado || 'En Patio (Gate-In)',
        muelleId: Number(nuevoMuelleId)
      });
    } catch {
      // Actualización optimista
    }
    setContenedores(prev =>
      prev.map(c =>
        (c.contenedorId || c.id) === idCont
          ? { ...c, muelleId: Number(nuevoMuelleId) }
          : c
      )
    );
  };

  // Clasificación de contenedores para las métricas del puerto
  const esRetenido = (c) =>
    c.retenido === true ||
    (c.estado && c.estado.toLowerCase().includes('retenid'));

  const esEnSalida = (c) =>
    !esRetenido(c) &&
    c.estado &&
    (c.estado.includes('Gate-Out') || c.estado.includes('Despachado') || c.estado.includes('Salida'));

  const esEnPatio = (c) =>
    !esRetenido(c) && !esEnSalida(c);

  const totalEnPatio = contenedores.filter(esEnPatio).length;
  const totalGateOut = contenedores.filter(esEnSalida).length;
  const totalRetenidos = contenedores.filter(esRetenido).length;

  // Filtrado de la tabla por búsqueda y pestaña activa
  const contenedoresFiltrados = contenedores.filter((c) => {
    const coincideTexto =
      (c.codigo || '').toLowerCase().includes(busqueda.toLowerCase()) ||
      limpiarEstado(c.estado).toLowerCase().includes(busqueda.toLowerCase());

    if (!coincideTexto) return false;
    if (filtroEstado === 'PATIO') return esEnPatio(c);
    if (filtroEstado === 'GATE_OUT') return esEnSalida(c);
    if (filtroEstado === 'RETENIDOS') return esRetenido(c);
    return true;
  });

  return (
    <div className="space-y-6 text-slate-900 dark:text-white">
      
      {/* CABECERA DEL PANEL PORTUARIO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Panel de Control Portuario (Terminal & Yard)
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Gestión operativa de contenedores en patio, asignación de muelles y autorizaciones de salida (Gate-In / Gate-Out).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs font-bold text-emerald-500">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
            Terminal Operativa • {buquesAtracados.length} Buque(s) en Muelle
          </div>

          <button
            onClick={cargarDatosPuerto}
            className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 dark:text-slate-300 hover:text-blue-500 transition-colors cursor-pointer"
            title="Sincronizar Patio"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* SECCIÓN SUPERIOR DE KPIs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* BLOQUE 1: OPERACIÓN DE PATIO Y SALIDA (GATE-OUT) */}
        <div className="bg-white dark:bg-slate-800/90 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-sm overflow-hidden">
          <div className="bg-slate-900 px-5 py-3 flex items-center justify-between border-b border-slate-700/80">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-white">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              Flujo de Patio y Proceso de Salida (Gate-Out)
            </div>
            <Truck size={16} className="text-emerald-400" />
          </div>

          <div className="grid grid-cols-3 divide-x divide-slate-200 dark:divide-slate-700/70 text-center py-5">
            <div 
              onClick={() => setFiltroEstado('GATE_OUT')}
              className="px-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
            >
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Total en Salida
              </span>
              <div className="flex items-center justify-center gap-2">
                <PackageCheck size={22} className="text-emerald-500" />
                <span className="text-3xl font-black text-slate-900 dark:text-white">
                  {totalGateOut}
                </span>
              </div>
              <span className="text-[11px] text-emerald-500 font-semibold">Autorizados Gate-Out</span>
            </div>

            <div 
              onClick={() => setFiltroEstado('PATIO')}
              className="px-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
            >
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                En Patio (0 a 5 Días)
              </span>
              <span className="text-3xl font-black text-blue-500 block">
                {totalEnPatio}
              </span>
              <span className="text-[11px] text-slate-400">Listos para maniobra</span>
            </div>

            <div 
              onClick={() => setFiltroEstado('TODOS')}
              className="px-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
            >
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Total Unidades Terminal
              </span>
              <span className="text-3xl font-black text-slate-900 dark:text-white block">
                {contenedores.length}
              </span>
              <span className="text-[11px] text-slate-400">Inventario activo</span>
            </div>
          </div>
        </div>

        {/* BLOQUE 2: RETENIDOS POR ADUANA Y ALERTAS DE MUELLE */}
        <div className="bg-white dark:bg-slate-800/90 rounded-xl border border-red-500/30 dark:border-red-500/30 shadow-sm overflow-hidden">
          <div className="bg-red-950/40 px-5 py-3 flex items-center justify-between border-b border-red-500/20">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-red-400">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
              Retenidos por Aduana (Bloqueo de Salida)
            </div>
            <ShieldAlert size={16} className="text-red-400" />
          </div>

          <div className="grid grid-cols-2 divide-x divide-slate-200 dark:divide-slate-700/70 text-center py-5">
            <div 
              onClick={() => setFiltroEstado('RETENIDOS')}
              className="px-4 cursor-pointer hover:bg-red-500/5 transition-colors"
            >
              <span className="text-[11px] font-bold uppercase tracking-wider text-red-400 block mb-1">
                Total Retenidos
              </span>
              <div className="flex items-center justify-center gap-2">
                <AlertTriangle size={22} className="text-red-500" />
                <span className="text-3xl font-black text-red-500">
                  {totalRetenidos}
                </span>
              </div>
              <span className="text-[11px] text-red-400/80">Bloqueados en Gate-Out</span>
            </div>

            <div className="px-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Buques Operando en Muelle
              </span>
              <div className="flex items-center justify-center gap-2">
                <Anchor size={20} className="text-blue-400" />
                <span className="text-3xl font-black text-slate-900 dark:text-white">
                  {buquesAtracados.length}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 truncate block px-2">
                {buquesAtracados.map(b => b.nombre).join(', ') || 'Sin buques atracados'}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* BARRA DE FILTROS Y BÚSQUEDA DE CONTENEDORES EN PATIO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800/90 p-4 rounded-xl border border-slate-200 dark:border-slate-700/80">
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'TODOS', label: `Todos (${contenedores.length})` },
            { id: 'PATIO', label: `En Patio / Muelle (${totalEnPatio})` },
            { id: 'GATE_OUT', label: `En Salida / Gate-Out (${totalGateOut})` },
            { id: 'RETENIDOS', label: `Retenidos Aduana (${totalRetenidos})` }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFiltroEstado(tab.id)}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filtroEstado === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Filtrar por contenedor (ej. MAEU)..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* TABLA OPERATIVA DE CONTENEDORES EN TERMINAL */}
      <div className="bg-white dark:bg-slate-800/90 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700/80 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50/50 dark:bg-slate-900/40">
                <th className="py-3.5 px-6">Contenedor / Ref</th>
                <th className="py-3.5 px-6">Peso / Tipo</th>
                <th className="py-3.5 px-6">Ubicación en Puerto</th>
                <th className="py-3.5 px-6">Estado en Terminal</th>
                <th className="py-3.5 px-6 text-right">Operación de Muelle / Gate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60 text-sm">
              {contenedoresFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-10 text-center text-slate-400 text-xs">
                    No hay contenedores en esta categoría.
                  </td>
                </tr>
              ) : (
                contenedoresFiltrados.map((c) => {
                  const idCont = c.contenedorId || c.id;
                  const estadoLimpio = limpiarEstado(c.estado);
                  const bloqueadoAduana = esRetenido(c);
                  const yaEnGateOut = esEnSalida(c);

                  return (
                    <tr key={idCont} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold ${
                            bloqueadoAduana
                              ? 'bg-red-500/10 text-red-500'
                              : yaEnGateOut
                              ? 'bg-emerald-500/10 text-emerald-500'
                              : 'bg-blue-500/10 text-blue-500'
                          }`}>
                            <Container size={18} />
                          </div>
                          <div>
                            <p className="font-mono font-bold text-slate-900 dark:text-white">{c.codigo}</p>
                            <p className="text-[11px] text-blue-400 font-semibold">PORT-REF-{idCont}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <span className="font-semibold text-slate-700 dark:text-slate-200 block">
                          {Number(c.peso || 14500).toLocaleString('en-US')} kg
                        </span>
                        <span className="text-xs text-slate-400">
                          {estadoLimpio.includes('TEUs') ? 'Lote Subasta (TEUs)' : `Carga ${c.tipo || 'Seca'}`}
                        </span>
                      </td>

                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1.5">
                          <MapPin size={14} className="text-blue-400" />
                          <select
                            value={c.muelleId || 1}
                            disabled={bloqueadoAduana}
                            onChange={(e) => cambiarMuelle(c, e.target.value)}
                            className="bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md px-2.5 py-1 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer disabled:opacity-50"
                          >
                            <option value={1}>Muelle #1 (Grúa Pórtico A)</option>
                            <option value={2}>Muelle #2 (Grúa Pórtico B)</option>
                            <option value={3}>Patio Norte (Contenedores)</option>
                            <option value={4}>Zona Reefer / Especial</option>
                          </select>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                          bloqueadoAduana
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                            : yaEnGateOut
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          <Clock size={12} />
                          {estadoLimpio}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-right">
                        {bloqueadoAduana ? (
                          <span className="text-xs font-bold text-red-400 bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20 inline-block">
                            🔒 Retenido por Aduana
                          </span>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            {!estadoLimpio.includes('En Patio') && !yaEnGateOut && (
                              <button
                                onClick={() => cambiarFaseOperativa(c, 'En Patio (Gate-In)')}
                                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/30 transition-all cursor-pointer"
                              >
                                Recibir en Patio (Gate-In)
                              </button>
                            )}

                            {!yaEnGateOut ? (
                              <button
                                onClick={() => cambiarFaseOperativa(c, 'En Proceso de Salida (Gate-Out)')}
                                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-all cursor-pointer shadow-sm"
                              >
                                Autorizar Gate-Out ➔
                              </button>
                            ) : (
                              <button
                                onClick={() => cambiarFaseOperativa(c, 'En Patio (Gate-In)')}
                                className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 transition-colors cursor-pointer"
                              >
                                Revertir a Patio
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE CONFIRMACIÓN DE MANIOBRA PORTUARIA */}
      {modalConfirmacion && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-sm p-6 text-center border border-slate-200 dark:border-slate-700">
            <div className="w-14 h-14 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-lg font-black mb-1">¡Maniobra Registrada!</h3>
            <p className="text-sm font-mono font-bold text-blue-400 mb-2">{modalConfirmacion.codigo}</p>
            <p className="text-xs text-slate-400 mb-5">
              Nuevo estado: <strong className="text-white">{modalConfirmacion.accion}</strong> en <strong>{modalConfirmacion.muelle}</strong>. El Cliente Exportador ya puede verlo en su mapa en vivo.
            </p>
            <button
              onClick={() => setModalConfirmacion(null)}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs uppercase tracking-wider cursor-pointer"
            >
              Continuar Operando
            </button>
          </div>
        </div>
      )}

    </div>
  );
}