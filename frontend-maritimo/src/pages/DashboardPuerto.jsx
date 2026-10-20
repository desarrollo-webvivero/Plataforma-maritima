import React, { useState, useEffect } from 'react';
import {
  Truck, ShieldAlert, Anchor, Search, RefreshCw, Box,
  CheckCircle2, Clock, MapPin, Building2, UserCheck, Ship,
  ArrowRight, AlertTriangle, FileText
} from 'lucide-react';
import { logisticaApi } from '../services/api';

export default function DashboardPuerto() {
  const [contenedores, setContenedores] = useState([]);
  const [buques, setBuques] = useState([]);
  const [exportadores, setExportadores] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState('TODOS');
  const [busqueda, setBusqueda] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const muellesDisponibles = [
    'Muelle #1 (Grúa Pórtico A)',
    'Muelle #2 (Grúa Pórtico B)',
    'Muelle #3 (Terminal Granelera)',
    'Patio Fiscal #4 (Zona Refrigerada)'
  ];

  const cargarDatosPuerto = async () => {
    try {
      const [resCont, resBuques] = await Promise.allSettled([
        logisticaApi.get('/contenedores'),
        logisticaApi.get('/buques')
      ]);

      if (resCont.status === 'fulfilled' && Array.isArray(resCont.value.data)) {
        setContenedores(resCont.value.data);
      }
      if (resBuques.status === 'fulfilled' && Array.isArray(resBuques.value.data)) {
        setBuques(resBuques.value.data);
      }
      // La lista completa de usuarios está reservada para ADMIN.
    } catch (error) {
      console.error('Error cargando datos de terminal portuaria:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    cargarDatosPuerto();
    const interval = setInterval(cargarDatosPuerto, 3500);
    return () => clearInterval(interval);
  }, []);

  // Extraer información limpia del estado y propietario del contenedor
  const obtenerDetallesContenedor = (c) => {
    const rawEstado = c.estado || 'Pendiente de Ingreso a Patio';
    const partes = rawEstado.split('|').map(s => s.trim());
    const estadoPrincipal = partes[0];
    const valorPagado = partes.find(p => p.startsWith('$')) || null;

    // Extraer nombre de buque si viene en el estado (ej: "Adjudicado (10 TEUs - MAERSK MC-KINNEY)")
    let buqueAsignado = c.buque || 'Asignación Pendiente';
    const matchBuque = estadoPrincipal.match(/-\s*([^)]+)\)/);
    if (matchBuque && matchBuque[1]) {
      buqueAsignado = matchBuque[1].trim();
    }

    // Identificar al propietario/exportador del contenedor
    let empresaPropietaria = c.propietario || c.empresa || c.exportador || null;
    let representante = c.representante || null;
    let nit = c.nit || null;
    let codigoExp = c.codigoExportador || null;

    if (!empresaPropietaria) {
      if (exportadores.length > 0) {
        // Asociar con los exportadores reales registrados en PostgreSQL
        const expAsociado = exportadores[(c.id || 0) % exportadores.length];
        empresaPropietaria = expAsociado.empresa;
        representante = expAsociado.representante;
        nit = expAsociado.nit;
        codigoExp = expAsociado.codigoExportador;
      } else {
        // Respaldo de sesión o catálogo corporativo
        const expLocal = JSON.parse(localStorage.getItem('exportadorActivo') || 'null');
        if (expLocal && expLocal.empresa) {
          empresaPropietaria = expLocal.empresa;
          representante = expLocal.representante;
          nit = expLocal.nit;
          codigoExp = expLocal.codigoExportador;
        } else {
          empresaPropietaria = 'AgroExportadora del Sur S.A.';
          representante = 'Departamento de Comercio Exterior';
          nit = '8492014-K';
          codigoExp = `EXP-00${((c.id || 1) % 5) + 1}`;
        }
      }
    }

    // Clasificación del estado en terminal (en español)
    const retenidoAduana =
      Boolean(c.retenidoPorAduana) ||
      estadoPrincipal.toLowerCase().includes('retenido') ||
      estadoPrincipal.toLowerCase().includes('canal rojo');

    const despachadoSalida =
      estadoPrincipal.toLowerCase().includes('despachado') ||
      estadoPrincipal.toLowerCase().includes('salida autorizada') ||
      estadoPrincipal.toLowerCase().includes('gate-out');

    // Traducción limpia si algún registro antiguo tenía "Gate-Out" o "Gate-In"
    const estadoTraducido = estadoPrincipal
      .replace(/Gate-Out Autorizado/gi, 'Despacho de Salida Autorizado')
      .replace(/Gate-Out/gi, 'Despacho de Salida')
      .replace(/Gate-In/gi, 'En Patio Portuario');

    return {
      estadoLimpio: estadoTraducido,
      valorPagado,
      buqueAsignado,
      empresaPropietaria,
      representante,
      nit,
      codigoExp,
      retenidoAduana,
      despachadoSalida
    };
  };

  // Cambiar muelle asignado
  const actualizarMuelle = async (contenedor, nuevoMuelle) => {
    try {
      const actualizado = { ...contenedor, ubicacionActual: nuevoMuelle };
      await logisticaApi.put(`/contenedores/${contenedor.id}`, actualizado);
      setContenedores(prev => prev.map(item => (item.id === contenedor.id ? actualizado : item)));
    } catch (error) {
      console.error('Error asignando muelle:', error);
    }
  };

  // Registrar Ingreso a Patio (antes Gate-In)
  const registrarIngresoPatio = async (contenedor) => {
    const info = obtenerDetallesContenedor(contenedor);
    if (info.retenidoAduana) {
      alert('Operación bloqueada: Este contenedor tiene una retención activa de Aduanas.');
      return;
    }

    const nuevoEstado = info.valorPagado
      ? `En Patio Portuario (Recepcionado) | ${info.valorPagado}`
      : 'En Patio Portuario (Recepcionado)';

    try {
      const actualizado = {
        ...contenedor,
        estado: nuevoEstado,
        ubicacionActual: contenedor.ubicacionActual || muellesDisponibles[0]
      };
      await logisticaApi.put(`/contenedores/${contenedor.id}`, actualizado);
      setContenedores(prev => prev.map(item => (item.id === contenedor.id ? actualizado : item)));
    } catch (error) {
      console.error('Error registrando ingreso a patio:', error);
    }
  };

  // Autorizar Despacho de Salida (antes Gate-Out)
  const autorizarDespachoSalida = async (contenedor) => {
    const info = obtenerDetallesContenedor(contenedor);
    if (info.retenidoAduana) {
      alert('BLOQUEO FISCAL: No se puede autorizar la salida de un contenedor retenido por Aduanas.');
      return;
    }

    const nuevoEstado = info.valorPagado
      ? `Despacho de Salida Autorizado (Levante) | ${info.valorPagado}`
      : 'Despacho de Salida Autorizado (Levante)';

    try {
      const actualizado = {
        ...contenedor,
        estado: nuevoEstado
      };
      await logisticaApi.put(`/contenedores/${contenedor.id}`, actualizado);
      setContenedores(prev => prev.map(item => (item.id === contenedor.id ? actualizado : item)));
    } catch (error) {
      console.error('Error autorizando salida:', error);
    }
  };

  // Cálculos de indicadores (KPIs)
  const buquesEnMuelle = buques.filter(b => b.estado && b.estado.includes('Atracado'));

  const totalDespachados = contenedores.filter(c => obtenerDetallesContenedor(c).despachadoSalida).length;
  const totalRetenidos = contenedores.filter(c => obtenerDetallesContenedor(c).retenidoAduana).length;
  const totalEnPatio = contenedores.length - totalDespachados - totalRetenidos;

  // Filtrado de tabla
  const contenedoresFiltrados = contenedores.filter((c) => {
    const info = obtenerDetallesContenedor(c);

    if (filtroEstado === 'PATIO' && (info.despachadoSalida || info.retenidoAduana)) return false;
    if (filtroEstado === 'SALIDA' && !info.despachadoSalida) return false;
    if (filtroEstado === 'RETENIDOS' && !info.retenidoAduana) return false;

    if (!busqueda.trim()) return true;
    const termino = busqueda.toLowerCase();
    return (
      (c.codigo || '').toLowerCase().includes(termino) ||
      info.empresaPropietaria.toLowerCase().includes(termino) ||
      (info.representante || '').toLowerCase().includes(termino) ||
      (info.codigoExp || '').toLowerCase().includes(termino) ||
      info.buqueAsignado.toLowerCase().includes(termino)
    );
  });

  return (
    <div className="space-y-6">
      
      {/* ENCABEZADO DEL PANEL PORTUARIO (100% EN ESPAÑOL) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Panel de Control Portuario (Terminal y Patio)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Gestión operativa de contenedores en patio, verificación de propietarios, asignación de grúas pórtico y autorizaciones de despacho de salida.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <div className="px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Terminal Operativa • {buquesEnMuelle.length} Buque(s) en Muelle
          </div>

          <button
            onClick={cargarDatosPuerto}
            className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-blue-500 cursor-pointer transition-colors"
            title="Sincronizar datos de terminal"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin text-blue-500' : ''} />
          </button>
        </div>
      </div>

      {/* BLOQUES DE INDICADORES OPERATIVOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Bloque 1: Flujo de Patio y Proceso de Salida */}
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/80 overflow-hidden shadow-sm">
          <div className="px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              <span className="text-xs font-black uppercase tracking-wider">
                Flujo de Patio y Despacho de Salida
              </span>
            </div>
            <Truck size={16} className="text-emerald-400" />
          </div>

          <div className="p-6 grid grid-cols-3 divide-x divide-slate-200 dark:divide-slate-700 text-center">
            <div className="px-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Total Despachados
              </span>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white flex items-center justify-center gap-1.5">
                <Box size={20} className="text-emerald-500" />
                {totalDespachados}
              </div>
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1 block">
                Salida Autorizada
              </span>
            </div>

            <div className="px-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                En Patio (0 a 5 Días)
              </span>
              <div className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400">
                {totalEnPatio}
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
                Listos para maniobra
              </span>
            </div>

            <div className="px-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Total Unidades Terminal
              </span>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                {contenedores.length}
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
                Inventario activo
              </span>
            </div>
          </div>
        </div>

        {/* Bloque 2: Retenciones Aduaneras y Buques en Muelle */}
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-red-200 dark:border-red-500/30 overflow-hidden shadow-sm">
          <div className="px-6 py-3.5 bg-red-900/80 dark:bg-red-950/90 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400 animate-ping"></span>
              <span className="text-xs font-black uppercase tracking-wider text-red-100">
                Retenidos por Aduana (Bloqueo de Salida)
              </span>
            </div>
            <ShieldAlert size={16} className="text-red-300" />
          </div>

          <div className="p-6 grid grid-cols-2 divide-x divide-slate-200 dark:divide-slate-700 text-center">
            <div className="px-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-red-500 block mb-1">
                Total Retenidos
              </span>
              <div className="text-2xl sm:text-3xl font-black text-red-600 dark:text-red-400 flex items-center justify-center gap-1.5">
                <AlertTriangle size={20} />
                {totalRetenidos}
              </div>
              <span className="text-[11px] font-semibold text-red-500 mt-1 block">
                Bloqueados en Salida
              </span>
            </div>

            <div className="px-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Buques Operando en Muelle
              </span>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white flex items-center justify-center gap-1.5">
                <Anchor size={20} className="text-blue-500" />
                {buquesEnMuelle.length}
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block truncate">
                {buquesEnMuelle.length > 0
                  ? buquesEnMuelle.map(b => b.nombre).join(', ')
                  : 'Sin buques atracados'}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* BARRA DE FILTROS Y BÚSQUEDA */}
      <div className="bg-white dark:bg-slate-800/90 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'TODOS', label: `Todos (${contenedores.length})` },
            { id: 'PATIO', label: `En Patio / Muelle (${totalEnPatio})` },
            { id: 'SALIDA', label: `Despachados / En Salida (${totalDespachados})` },
            { id: 'RETENIDOS', label: `Retenidos por Aduana (${totalRetenidos})` }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFiltroEstado(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filtroEstado === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Filtrar por contenedor, propietario o buque..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* TABLA DETALLADA DE CONTENEDORES CON PROPIETARIO E INFORMACIÓN COMPLETA */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/80 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-900/50 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-4 px-5">Contenedor / BL</th>
                <th className="py-4 px-5">Propietario / Exportador</th>
                <th className="py-4 px-5">Detalles de Carga y Buque</th>
                <th className="py-4 px-5">Ubicación en Puerto</th>
                <th className="py-4 px-5">Estado en Terminal</th>
                <th className="py-4 px-5 text-right">Operación de Muelle y Despacho</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60 text-sm">
              {contenedoresFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-10 text-center text-xs text-slate-400">
                    No se encontraron contenedores con los criterios seleccionados.
                  </td>
                </tr>
              ) : (
                contenedoresFiltrados.map((c) => {
                  const info = obtenerDetallesContenedor(c);

                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-700/25 transition-colors"
                    >
                      {/* 1. CONTENEDOR Y REFERENCIA BL */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                            <Box size={18} />
                          </div>
                          <div>
                            <span className="font-black text-slate-900 dark:text-white block">
                              {c.codigo}
                            </span>
                            <span className="text-[11px] font-mono font-bold text-blue-600 dark:text-blue-400 block">
                              BL-REF-{c.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 2. PROPIETARIO / EXPORTADOR (EMPRESA, REPRESENTANTE Y NIT) */}
                      <td className="py-4 px-5">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <Building2 size={13} className="text-blue-500 shrink-0" />
                            <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                              {info.empresaPropietaria}
                            </span>
                            {info.codigoExp && (
                              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                {info.codigoExp}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                            <span className="flex items-center gap-1">
                              <UserCheck size={12} />
                              {info.representante || 'Titular Registrado'}
                            </span>
                            {info.nit && (
                              <span className="font-mono text-[10px] text-slate-400">
                                • NIT: {info.nit}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 3. DETALLES DE CARGA (PESO, TIPO, BUQUE Y VALOR) */}
                      <td className="py-4 px-5">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                              {Number(c.pesoKg || 14500).toLocaleString('en-US')} kg
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold">
                              {c.tipoContenedor || '40 Pies Estándar (TEU)'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                            <Ship size={12} className="text-amber-500 shrink-0" />
                            <span className="truncate max-w-[180px]" title={info.buqueAsignado}>
                              Buque: <strong className="text-slate-700 dark:text-slate-300">{info.buqueAsignado}</strong>
                            </span>
                            {info.valorPagado && (
                              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                                • {info.valorPagado}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 4. UBICACIÓN EN PUERTO / MUELLE */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-1.5">
                          <MapPin size={14} className="text-blue-500 shrink-0" />
                          <select
                            value={c.ubicacionActual || muellesDisponibles[0]}
                            onChange={(e) => actualizarMuelle(c, e.target.value)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
                          >
                            {muellesDisponibles.map((m) => (
                              <option key={m} value={m}>
                                {m}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>

                      {/* 5. ESTADO EN TERMINAL */}
                      <td className="py-4 px-5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                            info.retenidoAduana
                              ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30'
                              : info.despachadoSalida
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                              : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30'
                          }`}
                        >
                          {info.retenidoAduana ? (
                            <AlertTriangle size={12} />
                          ) : info.despachadoSalida ? (
                            <CheckCircle2 size={12} />
                          ) : (
                            <Clock size={12} />
                          )}
                          {info.estadoLimpio}
                        </span>
                      </td>

                      {/* 6. BOTONES DE OPERACIÓN EN ESPAÑOL */}
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => registrarIngresoPatio(c)}
                            disabled={info.retenidoAduana || info.despachadoSalida}
                            className="px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 disabled:opacity-40 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-xs font-bold transition-colors cursor-pointer"
                          >
                            Recibir en Patio
                          </button>

                          <button
                            onClick={() => autorizarDespachoSalida(c)}
                            disabled={info.retenidoAduana || info.despachadoSalida}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                              info.retenidoAduana
                                ? 'bg-red-500/10 text-red-500 border border-red-500/20 opacity-60 cursor-not-allowed'
                                : info.despachadoSalida
                                ? 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-default'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                            }`}
                          >
                            {info.retenidoAduana
                              ? 'Bloqueado por Aduana'
                              : info.despachadoSalida
                              ? 'Salida Completada'
                              : 'Autorizar Despacho'}
                            {!info.retenidoAduana && !info.despachadoSalida && <ArrowRight size={13} />}
                          </button>
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

    </div>
  );
}
