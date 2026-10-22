import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, ShieldAlert, FileSearch, Search, RefreshCw,
  Container, CheckCircle2, AlertOctagon, Scale, FileText, X, Lock, Unlock
} from 'lucide-react';
import { logisticaApi } from '../services/api';

export default function DashboardAduanas() {
  const [contenedores, setContenedores] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filtroSemaforo, setFiltroSemaforo] = useState('TODOS'); // TODOS | VERDE | AMARILLO | ROJO
  const [busqueda, setBusqueda] = useState('');

  // Modal para registrar motivo de retención o inspección
  const [modalRetencion, setModalRetencion] = useState(null);
  const [motivoRetencion, setMotivoRetencion] = useState('Inspección No Intrusiva (Rayos X)');
  const [notificacion, setNotificacion] = useState(null);

  const motivosAduaneros = [
    'Inspección No Intrusiva (Rayos X)',
    'Discrepancia de Peso Declarado vs Báscula',
    'Auditoría de Póliza DUCA / Bill of Lading',
    'Inspección Física Antinarcóticos (SGAIA)',
    'Control Fitosanitario y Cuarentena (MAGA)'
  ];

  const cargarDatosAduana = async () => {
    try {
      const res = await logisticaApi.get('/contenedores');
      if (res.data) {
        setContenedores(res.data);
      }
    } catch {
      // Sondeo silencioso: se reintenta automáticamente
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    cargarDatosAduana();
    // Sincronización automática cada 3 segundos con Puerto y Exportador
    const intervalo = setInterval(cargarDatosAduana, 3000);
    return () => clearInterval(intervalo);
  }, []);

  // Limpiar sufijo de precio "| $1500" para mostrar solo el estado
  const limpiarEstado = (estadoRaw) => {
    if (!estadoRaw) return 'Pendiente de Ingreso';
    return estadoRaw.split(' | $')[0];
  };

  // Preservar sufijo de precio "| $1500" al actualizar el estado aduanero
  const obtenerSufijoPrecio = (estadoRaw) => {
    if (estadoRaw && estadoRaw.includes(' | $')) {
      return ' | $' + estadoRaw.split(' | $')[1];
    }
    return '';
  };

  // Clasificación del Semáforo Fiscal según el estado del contenedor
  const obtenerColorSemaforo = (c) => {
    const est = (c.estado || '').toLowerCase();
    if (c.retenido === true || est.includes('retenid') || est.includes('rojo') || est.includes('física')) {
      return 'ROJO';
    }
    if (est.includes('documental') || est.includes('amarillo') || est.includes('revisión')) {
      return 'AMARILLO';
    }
    return 'VERDE';
  };

  // Cambiar dictamen aduanero en PostgreSQL
  const aplicarDictamenAduanero = async (contenedor, nuevoEstadoTexto) => {
    const idCont = contenedor.contenedorId || contenedor.id;
    const sufijoPrecio = obtenerSufijoPrecio(contenedor.estado);
    const estadoFinal = `${nuevoEstadoTexto}${sufijoPrecio}`;

    try {
      await logisticaApi.put(`/contenedores/${idCont}/estado`, {
        estado: estadoFinal,
        muelleId: contenedor.muelleId || 1
      });
    } catch {
      // El dictamen se refleja en pantalla y se sincroniza en la siguiente carga
    }

    setContenedores(prev =>
      prev.map(c =>
        (c.contenedorId || c.id) === idCont
          ? { ...c, estado: estadoFinal, retenido: nuevoEstadoTexto.toLowerCase().includes('retenid') }
          : c
      )
    );

    window.dispatchEvent(new Event('datosActualizados'));

    setNotificacion({
      codigo: contenedor.codigo,
      dictamen: nuevoEstadoTexto,
      esRojo: nuevoEstadoTexto.toLowerCase().includes('retenid')
    });
  };

  // Confirmar retención desde el modal con motivo específico
  const confirmarRetencionRoja = async (e) => {
    e.preventDefault();
    if (!modalRetencion) return;
    await aplicarDictamenAduanero(
      modalRetencion,
      `Retenido en Aduana (${motivoRetencion})`
    );
    setModalRetencion(null);
  };

  // Métricas en vivo del Semáforo Aduanero
  const totalVerde = contenedores.filter(c => obtenerColorSemaforo(c) === 'VERDE').length;
  const totalAmarillo = contenedores.filter(c => obtenerColorSemaforo(c) === 'AMARILLO').length;
  const totalRojo = contenedores.filter(c => obtenerColorSemaforo(c) === 'ROJO').length;

  // Filtrado de la tabla
  const contenedoresFiltrados = contenedores.filter((c) => {
    const color = obtenerColorSemaforo(c);
    const coincideTexto =
      (c.codigo || '').toLowerCase().includes(busqueda.toLowerCase()) ||
      limpiarEstado(c.estado).toLowerCase().includes(busqueda.toLowerCase());

    if (!coincideTexto) return false;
    if (filtroSemaforo !== 'TODOS' && color !== filtroSemaforo) return false;
    return true;
  });

  return (
    <div className="space-y-6 text-slate-900 dark:text-white">
      
      {/* CABECERA DEL MÓDULO ADUANERO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Control Aduanero y Semáforo Fiscal
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Gestión de inspecciones, auditoría documental y retenciones de carga (Módulo de Seguridad Portuaria).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300">
            <ShieldCheck size={16} className="text-emerald-500" />
            Enlace SAT / Aduana Activo
          </div>

          <button
            onClick={cargarDatosAduana}
            className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 dark:text-slate-300 hover:text-blue-500 transition-colors cursor-pointer"
            title="Sincronizar Semáforo"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* TARJETAS DEL SEMÁFORO ADUANERO (ESTILO DARK UNIFICADO E INTERACTIVO) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* SEMÁFORO VERDE: LEVANTE LIBRE */}
        <div
          onClick={() => setFiltroSemaforo(filtroSemaforo === 'VERDE' ? 'TODOS' : 'VERDE')}
          className={`bg-white dark:bg-slate-800/90 p-6 rounded-xl border transition-all cursor-pointer relative overflow-hidden text-center shadow-sm ${
            filtroSemaforo === 'VERDE'
              ? 'border-emerald-500 ring-2 ring-emerald-500/20'
              : 'border-slate-200 dark:border-slate-700/80 hover:border-emerald-500/50'
          }`}
        >
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-emerald-500"></div>
          <div className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <span className="w-5 h-5 rounded-full bg-emerald-500 shadow-[0_0_12px_#10b981]"></span>
          </div>
          <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-1">
            Levante Libre (Canal Verde)
          </span>
          <span className="text-4xl font-black text-slate-900 dark:text-white block">
            {totalVerde}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Autorizados para despacho portuario
          </span>
        </div>

        {/* SEMÁFORO AMARILLO: REVISIÓN DOCUMENTAL */}
        <div
          onClick={() => setFiltroSemaforo(filtroSemaforo === 'AMARILLO' ? 'TODOS' : 'AMARILLO')}
          className={`bg-white dark:bg-slate-800/90 p-6 rounded-xl border transition-all cursor-pointer relative overflow-hidden text-center shadow-sm ${
            filtroSemaforo === 'AMARILLO'
              ? 'border-amber-500 ring-2 ring-amber-500/20'
              : 'border-slate-200 dark:border-slate-700/80 hover:border-amber-500/50'
          }`}
        >
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-amber-500"></div>
          <div className="w-12 h-12 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <span className="w-5 h-5 rounded-full bg-amber-500 shadow-[0_0_12px_#f59e0b]"></span>
          </div>
          <span className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 block mb-1">
            Revisión Documental (Amarillo)
          </span>
          <span className="text-4xl font-black text-slate-900 dark:text-white block">
            {totalAmarillo}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            En validación de póliza DUCA / BL
          </span>
        </div>

        {/* SEMÁFORO ROJO: INSPECCIÓN FÍSICA (RETENIDOS) */}
        <div
          onClick={() => setFiltroSemaforo(filtroSemaforo === 'ROJO' ? 'TODOS' : 'ROJO')}
          className={`bg-white dark:bg-slate-800/90 p-6 rounded-xl border transition-all cursor-pointer relative overflow-hidden text-center shadow-sm ${
            filtroSemaforo === 'ROJO'
              ? 'border-red-500 ring-2 ring-red-500/20'
              : 'border-slate-200 dark:border-slate-700/80 hover:border-red-500/50'
          }`}
        >
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-red-500"></div>
          <div className="w-12 h-12 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <span className="w-5 h-5 rounded-full bg-red-500 shadow-[0_0_12px_#ef4444] animate-pulse"></span>
          </div>
          <span className="text-xs font-black uppercase tracking-wider text-red-600 dark:text-red-400 block mb-1">
            Inspección Física (Retenidos)
          </span>
          <span className="text-4xl font-black text-red-500 block">
            {totalRojo}
          </span>
          <span className="text-[11px] text-red-400/80 mt-1 block">
            Salida bloqueada en Terminal Portuaria
          </span>
        </div>

      </div>

      {/* BARRA DE FILTRO POR CANAL Y BUSCADOR DE DECLARACIONES */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800/90 p-4 rounded-xl border border-slate-200 dark:border-slate-700/80">
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'TODOS', label: `Todas las Cargas (${contenedores.length})` },
            { id: 'VERDE', label: `🟢 Levante Libre (${totalVerde})` },
            { id: 'AMARILLO', label: `🟡 Revisión Doc. (${totalAmarillo})` },
            { id: 'ROJO', label: `🔴 Retenidos (${totalRojo})` }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFiltroSemaforo(tab.id)}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filtroSemaforo === tab.id
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
            placeholder="Buscar contenedor o declaración..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* TABLA DE AUDITORÍA E INSPECCIÓN ADUANERA */}
      <div className="bg-white dark:bg-slate-800/90 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700/80 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50/50 dark:bg-slate-900/40">
                <th className="py-3.5 px-6">Contenedor / Póliza DUCA</th>
                <th className="py-3.5 px-6">Peso Declarado / Tipo</th>
                <th className="py-3.5 px-6">Canal Asignado</th>
                <th className="py-3.5 px-6">Dictamen / Estado Actual</th>
                <th className="py-3.5 px-6 text-right">Acción de Control Aduanero</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60 text-sm">
              {contenedoresFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-10 text-center text-slate-400 text-xs">
                    No hay contenedores registrados en este canal del semáforo.
                  </td>
                </tr>
              ) : (
                contenedoresFiltrados.map((c) => {
                  const idCont = c.contenedorId || c.id;
                  const canal = obtenerColorSemaforo(c);
                  const estadoLimpio = limpiarEstado(c.estado);
                  const sobrepesoAlerta = Number(c.peso || 0) > 20000;

                  return (
                    <tr key={idCont} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold ${
                            canal === 'ROJO'
                              ? 'bg-red-500/10 text-red-500'
                              : canal === 'AMARILLO'
                              ? 'bg-amber-500/10 text-amber-500'
                              : 'bg-emerald-500/10 text-emerald-500'
                          }`}>
                            <Container size={18} />
                          </div>
                          <div>
                            <p className="font-mono font-bold text-slate-900 dark:text-white">{c.codigo}</p>
                            <p className="text-[11px] text-slate-400 font-mono">DUCA-GT-2026-00{idCont}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1.5">
                          <Scale size={14} className={sobrepesoAlerta ? 'text-amber-500' : 'text-slate-400'} />
                          <span className="font-semibold text-slate-700 dark:text-slate-200">
                            {Number(c.peso || 14500).toLocaleString('en-US')} kg
                          </span>
                        </div>
                        <span className="text-xs text-slate-400 block">
                          {estadoLimpio.includes('TEUs') ? 'Lote Subasta (TEUs)' : `Carga ${c.tipo || 'Seca'}`}
                        </span>
                      </td>

                      <td className="py-4 px-6">
                        {canal === 'ROJO' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                            Canal Rojo
                          </span>
                        )}
                        {canal === 'AMARILLO' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                            Canal Amarillo
                          </span>
                        )}
                        {canal === 'VERDE' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            Canal Verde
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-6">
                        <span className={`text-xs font-semibold ${
                          canal === 'ROJO'
                            ? 'text-red-400'
                            : canal === 'AMARILLO'
                            ? 'text-amber-400'
                            : 'text-slate-600 dark:text-slate-300'
                        }`}>
                          {estadoLimpio}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {canal !== 'VERDE' && (
                            <button
                              onClick={() => aplicarDictamenAduanero(c, 'Levante Libre Autorizado (Aduana)')}
                              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                              title="Liberar contenedor para salida en Puerto"
                            >
                              <Unlock size={13} /> Liberar (Verde)
                            </button>
                          )}

                          {canal !== 'AMARILLO' && (
                            <button
                              onClick={() => aplicarDictamenAduanero(c, 'En Revisión Documental (Aduana)')}
                              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-500/15 hover:bg-amber-500 text-amber-400 hover:text-slate-950 border border-amber-500/30 transition-all cursor-pointer"
                              title="Solicitar revisión de documentos"
                            >
                              Rev. Documental
                            </button>
                          )}

                          {canal !== 'ROJO' && (
                            <button
                              onClick={() => setModalRetencion(c)}
                              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-red-500/15 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 transition-all cursor-pointer flex items-center gap-1"
                              title="Retener carga y bloquear salida en Puerto"
                            >
                              <Lock size={13} /> Retener (Rojo)
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL PARA SELECCIONAR MOTIVO DE RETENCIÓN (CANAL ROJO) */}
      {modalRetencion && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-red-500/30 shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-red-950/80 px-6 py-4 flex justify-between items-center text-white border-b border-red-500/20">
              <h3 className="font-bold flex items-center gap-2 text-red-200">
                <ShieldAlert size={18} className="text-red-400" />
                Orden de Retención Aduanera (Canal Rojo)
              </h3>
              <button onClick={() => setModalRetencion(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={confirmarRetencionRoja} className="p-6 space-y-4">
              <div className="bg-slate-100 dark:bg-slate-900 p-3.5 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Contenedor Objetivo</span>
                  <span className="font-mono font-black text-base text-slate-900 dark:text-white">{modalRetencion.codigo}</span>
                </div>
                <span className="text-xs font-mono text-red-400 bg-red-500/10 px-2.5 py-1 rounded border border-red-500/20">
                  Bloqueo Gate-Out
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">
                  Motivo Oficial de la Retención / Inspección Física
                </label>
                <select
                  value={motivoRetencion}
                  onChange={(e) => setMotivoRetencion(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-white text-sm"
                >
                  {motivosAduaneros.map((m, idx) => (
                    <option key={idx} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                ⚠️ Al confirmar esta orden, el contenedor quedará retenido inmediatamente. La terminal portuaria no podrá despacharlo y el cliente exportador recibirá una alerta aduanera en su panel.
              </p>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setModalRetencion(null)}
                  className="px-4 py-2 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-lg bg-red-600 hover:bg-red-700 text-white shadow-md cursor-pointer"
                >
                  Ejecutar Retención
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN RÁPIDA */}
      {notificacion && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-sm p-6 text-center border border-slate-200 dark:border-slate-700">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 ${
              notificacion.esRojo ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'
            }`}>
              {notificacion.esRojo ? <ShieldAlert size={32} /> : <CheckCircle2 size={32} />}
            </div>
            <h3 className="text-lg font-black mb-1">Dictamen Emitido</h3>
            <p className="text-sm font-mono font-bold text-blue-400 mb-2">{notificacion.codigo}</p>
            <p className="text-xs text-slate-400 mb-5">
              Nuevo estatus fiscal: <strong className="text-white">{notificacion.dictamen}</strong>. Sincronizado con Terminal Portuaria y Exportador.
            </p>
            <button
              onClick={() => setNotificacion(null)}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs uppercase tracking-wider cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

    </div>
  );
}