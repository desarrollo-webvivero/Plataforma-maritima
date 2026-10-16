import React, { useState, useEffect } from 'react';
import { 
  Ship, Gavel, Plus, Anchor, Navigation, Package, 
  CheckCircle2, X, Clock, TrendingUp, AlertCircle, RefreshCw 
} from 'lucide-react';
import { logisticaApi } from '../services/api';

export default function DashboardNaviera() {
  const [buques, setBuques] = useState([]);
  const [licitaciones, setLicitaciones] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('flota'); // 'flota' | 'licitaciones'

  // Modales
  const [isBuqueModalOpen, setIsBuqueModalOpen] = useState(false);
  const [isSubastaModalOpen, setIsSubastaModalOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [licitacionesOcultas, setLicitacionesOcultas] = useState([]);
  const [subastaDetalle, setSubastaDetalle] = useState(null);

  // Formularios
  const [nuevoBuque, setNuevoBuque] = useState({
    nombre: '',
    imo: '',
    capacidadTeu: 5000,
    teuDisponibles: 1200,
    rutaActual: 'Puerto Quetzal, Guatemala ➔ Port of Los Angeles, EE.UU.',
    estado: 'En Ruta'
  });

  const [nuevaSubasta, setNuevaSubasta] = useState({
    buqueNombre: '',
    ruta: 'Puerto Quetzal, Guatemala ➔ Port of Los Angeles, EE.UU.',
    espaciosTeu: 10,
    precioBase: 950
  });

  const rutasComerciales = [
    'Puerto Quetzal, Guatemala ➔ Port of Los Angeles, EE.UU.',
    'Puerto de Manzanillo, México ➔ Puerto Quetzal, Guatemala',
    'Puerto Barrios, Guatemala ➔ Port of Miami, EE.UU.',
    'Port of Rotterdam, Países Bajos ➔ Puerto de Santos, Brasil',
    'Port of Shanghai, China ➔ Puerto de Manzanillo, México'
  ];

  const cargarDatosNaviera = async () => {
    setIsLoading(true);
    try {
      // 1. Cargar Buques desde el backend
      try {
        const resBuques = await logisticaApi.get('/buques');
        setBuques(resBuques.data);
      } catch {
        // Fallback inicial si la tabla está vacía o el endpoint aún no se compila
        setBuques([
          { id: 1, nombre: 'MSC GÜLSÜN', imo: 'IMO-9839430', capacidadTeu: 23756, teuDisponibles: 450, rutaActual: 'Puerto Quetzal, Guatemala ➔ Port of Los Angeles, EE.UU.', estado: 'Atracado' },
          { id: 2, nombre: 'MAERSK MC-KINNEY', imo: 'IMO-9619907', capacidadTeu: 18270, teuDisponibles: 120, rutaActual: 'Puerto de Manzanillo, México ➔ Port of Rotterdam, Países Bajos', estado: 'En Ruta' },
          { id: 3, nombre: 'CMA CGM JACQUES', imo: 'IMO-9839179', capacidadTeu: 23112, teuDisponibles: 820, rutaActual: 'Puerto Barrios, Guatemala ➔ Port of Miami, EE.UU.', estado: 'En Ruta' }
        ]);
      }

      // 2. Cargar Licitaciones/Subastas desde el backend
      try {
        const resLic = await logisticaApi.get('/licitaciones');
        setLicitaciones(resLic.data);
      } catch {
        setLicitaciones([
          { id: 1, buque: 'MSC GÜLSÜN', ruta: 'Puerto Quetzal ➔ Los Angeles', espaciosTeu: 15, precioBase: 950, pujaActual: 1150, estado: 'ACTIVA' },
          { id: 2, buque: 'MAERSK MC-KINNEY', ruta: 'Manzanillo ➔ Rotterdam', espaciosTeu: 8, precioBase: 1500, pujaActual: 1850, estado: 'ACTIVA' }
        ]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Función dedicada exclusivamente a refrescar las subastas en vivo
  const sincronizarLicitaciones = async () => {
    try {
      const resLic = await logisticaApi.get('/licitaciones');
      if (resLic.data) {
        setLicitaciones(resLic.data);
      }
    } catch (err) {
      console.error("Error sincronizando licitaciones:", err);
    }
  };

  useEffect(() => {
    cargarDatosNaviera();

    // Auto-sincronización cada 2 segundos exclusiva para licitaciones (no se bloquea si /buques falla)
    const intervalo = setInterval(sincronizarLicitaciones, 2000);
    window.addEventListener('datosActualizados', sincronizarLicitaciones);

    return () => {
      clearInterval(intervalo);
      window.removeEventListener('datosActualizados', sincronizarLicitaciones);
    };
  }, []);

  // Guardar nuevo buque
  const handleCrearBuque = async (e) => {
    e.preventDefault();
    const codigoImo = nuevoBuque.imo || `IMO-${Math.floor(1000000 + Math.random() * 9000000)}`;
    const payload = { ...nuevoBuque, imo: codigoImo };

    try {
      const res = await logisticaApi.post('/buques', payload);
      setBuques([...buques, res.data]);
    } catch {
      // Si el backend aún no tiene POST /buques, lo agregamos visualmente al estado
      setBuques([...buques, { ...payload, id: Date.now() }]);
    }

    setIsBuqueModalOpen(false);
    setSuccessMsg({
      titulo: '¡Buque Incorporado!',
      detalle: `${payload.nombre} (${codigoImo})`,
      subtexto: `${payload.teuDisponibles} TEUs habilitados para operación`
    });
    setNuevoBuque({ nombre: '', imo: '', capacidadTeu: 5000, teuDisponibles: 1200, rutaActual: rutasComerciales[0], estado: 'En Ruta' });
  };

  // Publicar nueva subasta de espacios
  const handleCrearSubasta = async (e) => {
    e.preventDefault();
    const payload = {
      buque: nuevaSubasta.buqueNombre || (buques[0]?.nombre ?? 'MSC GÜLSÜN'),
      ruta: nuevaSubasta.ruta,
      espaciosTeu: parseInt(nuevaSubasta.espaciosTeu, 10),
      precioBase: parseFloat(nuevaSubasta.precioBase),
      pujaActual: parseFloat(nuevaSubasta.precioBase),
      estado: 'ACTIVA'
    };

    try {
      const res = await logisticaApi.post('/licitaciones', payload);
      setLicitaciones([...licitaciones, res.data]);
      setActiveTab('licitaciones'); // Te lleva directo a ver la subasta creada
    } catch (error) {
      console.error("Error guardando licitación en BD:", error.response?.data || error);
      alert("Error al guardar en PostgreSQL. Revisa la consola.");
      return;
    }

    setIsSubastaModalOpen(false);
    setSuccessMsg({
      titulo: '¡Subasta Publicada!',
      detalle: `${payload.espaciosTeu} TEUs en ${payload.buque}`,
      subtexto: `Precio base de salida: $${payload.precioBase.toLocaleString('en-US')}`
    });
  };

  // Cambiar estado de un buque (Atracado <-> En Ruta)
  const toggleEstadoBuque = async (buque) => {
    // Determinamos el nuevo estado base
    const esAtracado = buque.estado?.includes('Atracado');
    const nuevoEstado = esAtracado ? 'En Ruta' : 'Atracado';
    
    try {
      await logisticaApi.put(`/buques/${buque.id}/estado`, { estado: nuevoEstado });
      // Forzamos la actualización para traer la fecha formateada desde el backend
      cargarDatosNaviera(); 
    } catch (error) {
       console.error("Error cambiando estado:", error);
    }
  };

  // Cerrar, adjudicar subasta y asignarle el contenedor con el precio exacto al Exportador
  const handleCerrarSubasta = async (licitacion) => {
    try {
      await logisticaApi.put(`/licitaciones/${licitacion.id}/cerrar`);

      const prefijo = (licitacion.buque || 'MSCU').substring(0, 3).toUpperCase() + 'U';
      const numAleatorio = Math.floor(100000 + Math.random() * 900000);
      const codigoContenedor = `${prefijo}-${numAleatorio}`;
      const montoFinal = Number(licitacion.pujaActual || licitacion.precioBase || 1000);

      // Guardamos el monto real adjudicado al final del estado separado por " | $"
      await logisticaApi.post('/contenedores', {
        codigo: codigoContenedor,
        estado: `Adjudicado (${licitacion.espaciosTeu || 10} TEUs - ${licitacion.buque}) | $${montoFinal}`,
        peso: 14500, // Peso estándar por unidad para no alterar la tarifa
        tipo: 'Seca',
        precio: montoFinal
      });

      setLicitaciones(licitaciones.map(l => 
        l.id === licitacion.id ? { ...l, estado: 'ADJUDICADA' } : l
      ));

      setBuques(buques.map(b => {
        if (b.nombre === licitacion.buque) {
           return { ...b, teuDisponibles: Math.max(0, b.teuDisponibles - licitacion.espaciosTeu) };
        }
        return b;
      }));

      window.dispatchEvent(new Event('datosActualizados'));

      setSuccessMsg({
        titulo: '¡Licitación Adjudicada al Cliente!',
        detalle: `Contenedor asignado: ${codigoContenedor}`,
        subtexto: `Se adjudicaron ${licitacion.espaciosTeu} TEUs en ${licitacion.buque} por $${montoFinal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
      });

    } catch (error) {
      console.error("Error al adjudicar la subasta:", error);
      alert("Hubo un problema al adjudicar la licitación en el servidor.");
    }
  };

  // Métricas calculadas
  const buquesAtracados = buques.filter(b => b.estado === 'Atracado').length;
  const buquesEnRuta = buques.filter(b => b.estado !== 'Atracado').length;
  const subastasActivas = licitaciones.filter(l => l.estado === 'ACTIVA').length;
  const totalTeusDisponibles = buques.reduce((acc, b) => acc + (Number(b.teuDisponibles) || 0), 0);

  return (
    <div className="space-y-6 text-slate-900 dark:text-white">
      
      {/* CABECERA PRINCIPAL */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Administración de Flota y Subastas
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Control operativo de buques portacontenedores, asignación de TEUs y licitaciones en tiempo real.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsSubastaModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 rounded-lg text-sm font-bold transition-all cursor-pointer shadow-sm"
          >
            <Gavel size={16} />
            Publicar Subasta TEU
          </button>

          <button
            onClick={() => setIsBuqueModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-all cursor-pointer shadow-md"
          >
            <Plus size={16} />
            Registrar Buque
          </button>
        </div>
      </div>

      {/* TARJETAS KPI (ESTILO DARK UNIFICADO) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* KPI 1: Buques */}
        <div 
          onClick={() => setActiveTab('flota')}
          className="bg-white dark:bg-slate-800/90 p-5 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-sm hover:border-blue-500/50 transition-all cursor-pointer relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500"></div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-2">
              <Ship size={16} /> Buques en Operación
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 font-semibold">
              Flota Activa
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white mb-2">
            {buques.length}
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              {buquesAtracados} atracados
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              {buquesEnRuta} en ruta
            </span>
          </div>
        </div>

        {/* KPI 2: Licitaciones */}
        <div 
          onClick={() => setActiveTab('licitaciones')}
          className="bg-white dark:bg-slate-800/90 p-5 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-sm hover:border-amber-500/50 transition-all cursor-pointer relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500"></div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-2">
              <Gavel size={16} /> Licitaciones Activas
            </span>
            <span className="flex h-2.5 w-2.5 rounded-full bg-amber-500 animate-ping"></span>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white mb-2">
            {subastasActivas}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Recibiendo pujas de exportadores en tiempo real.
          </p>
        </div>

        {/* KPI 3: Capacidad TEUs */}
        <div className="bg-white dark:bg-slate-800/90 p-5 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500"></div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <Package size={16} /> Capacidad Disponible
            </span>
            <TrendingUp size={16} className="text-emerald-500" />
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white mb-2">
            {totalTeusDisponibles.toLocaleString('en-US')} <span className="text-sm font-normal text-slate-400">TEUs</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Espacio libre en flota para reservas y subastas.
          </p>
        </div>
      </div>

      {/* PESTAÑAS DE NAVEGACIÓN INTERNA */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('flota')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'flota'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Ship size={16} /> Flota de Buques ({buques.length})
          </button>
          <button
            onClick={() => setActiveTab('licitaciones')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'licitaciones'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Gavel size={16} /> Subastas y Licitaciones ({licitaciones.length})
          </button>
        </div>

        <button
          onClick={cargarDatosNaviera}
          className="p-2 text-slate-400 hover:text-white bg-slate-100 dark:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          title="Sincronizar con PostgreSQL"
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* CONTENIDO PESTAÑA 1: TABLA DE FLOTA DE BUQUES */}
      {activeTab === 'flota' && (
        <div className="bg-white dark:bg-slate-800/90 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700/80 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50/50 dark:bg-slate-900/40">
                  <th className="py-3.5 px-6">Buque / IMO</th>
                  <th className="py-3.5 px-6">Ruta Asignada</th>
                  <th className="py-3.5 px-6">Capacidad Libre</th>
                  <th className="py-3.5 px-6">Estado Operativo</th>
                  <th className="py-3.5 px-6 text-right">Acción de Muelle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60 text-sm">
                {buques.map((buque) => (
                  <tr key={buque.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold">
                          <Ship size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{buque.nombre}</p>
                          <p className="text-xs font-mono text-slate-400">{buque.imo || `IMO-98${buque.id}410`}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-600 dark:text-slate-300 font-medium">
                      {buque.rutaActual || 'Ruta Internacional Asignada'}
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-mono font-bold text-emerald-500">
                        {Number(buque.teuDisponibles || 500).toLocaleString('en-US')} TEUs
                      </span>
                      <span className="text-xs text-slate-400 block">
                        de {Number(buque.capacidadTeu || 15000).toLocaleString('en-US')} máx.
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                        buque.estado?.includes('Atracado')
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}>
                        {buque.estado?.includes('Atracado') ? <Anchor size={12} /> : <Navigation size={12} />}
                        {buque.estado || 'En Ruta'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => toggleEstadoBuque(buque)}
                        className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                      >
                        {buque.estado?.includes('Atracado') ? 'Zarpar (En Ruta)' : 'Autorizar Atraque'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CONTENIDO PESTAÑA 2: GESTIÓN DE LICITACIONES Y SUBASTAS */}
      {activeTab === 'licitaciones' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {licitaciones
            .filter(lic => !licitacionesOcultas.includes(lic.id))
            .map((lic) => (
            <div 
              key={lic.id} 
              className="bg-white dark:bg-slate-800/90 p-5 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-sm flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono font-bold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20">
                    LOTE #{lic.id} • {lic.espaciosTeu || 10} TEUs
                  </span>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    lic.estado === 'ADJUDICADA'
                      ? 'bg-slate-500/20 text-slate-400'
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  }`}>
                    {lic.estado || 'ACTIVA'}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
                  <Ship size={18} className="text-blue-400" />
                  {lic.buque || lic.codigoBuque || 'Buque Portacontenedores'}
                </h3>
                <p className="text-xs text-slate-400 mb-4">{lic.ruta || 'Ruta Comercial Internacional'}</p>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between relative">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Mejor Puja Actual {lic.mejorPostor ? `(${lic.mejorPostor})` : ''}
                  </span>
                  <span className="text-xl font-black text-emerald-500">
                    ${Number(lic.pujaActual ?? lic.precioBase ?? 950).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {lic.estado !== 'ADJUDICADA' ? (
                  <button
                    onClick={() => handleCerrarSubasta(lic)}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-sm"
                  >
                    Adjudicar y Cerrar
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                      <CheckCircle2 size={14} className="text-emerald-500" /> Finalizada
                    </span>
                    
                    {/* Botón de Detalles (Ojo) */}
                    <button 
                      onClick={() => setSubastaDetalle(lic)}
                      className="p-1.5 text-slate-400 hover:text-blue-500 bg-slate-100 dark:bg-slate-700/50 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-md transition-colors cursor-pointer"
                      title="Ver Detalles de Adjudicación"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                    </button>

                    {/* Botón de Ocultar/Eliminar Visual (Basurero/X) */}
                    <button 
                      onClick={() => setLicitacionesOcultas([...licitacionesOcultas, lic.id])}
                      className="p-1.5 text-slate-400 hover:text-red-500 bg-slate-100 dark:bg-slate-700/50 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                      title="Ocultar del Tablero"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL 1: REGISTRAR NUEVO BUQUE */}
      {isBuqueModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="bg-slate-900 px-6 py-4 flex justify-between items-center text-white">
              <h3 className="font-bold flex items-center gap-2">
                <Ship size={18} className="text-blue-400" /> Registrar Nuevo Buque en Flota
              </h3>
              <button onClick={() => setIsBuqueModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCrearBuque} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Nombre del Buque</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. EVER GIVEN"
                    value={nuevoBuque.nombre}
                    onChange={(e) => setNuevoBuque({ ...nuevoBuque, nombre: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Código IMO</label>
                  <input
                    type="text"
                    placeholder="Auto-generado si vacío"
                    value={nuevoBuque.imo}
                    onChange={(e) => setNuevoBuque({ ...nuevoBuque, imo: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-white text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Ruta Marítima Asignada</label>
                <select
                  value={nuevoBuque.rutaActual}
                  onChange={(e) => setNuevoBuque({ ...nuevoBuque, rutaActual: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-white text-sm"
                >
                  {rutasComerciales.map((r, i) => (
                    <option key={i} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Capacidad Total (TEU)</label>
                  <input
                    type="number"
                    min="500"
                    max="25000"
                    required
                    value={nuevoBuque.capacidadTeu}
                    onChange={(e) => setNuevoBuque({ ...nuevoBuque, capacidadTeu: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">TEUs Disponibles</label>
                  <input
                    type="number"
                    min="10"
                    max={nuevoBuque.capacidadTeu}
                    required
                    value={nuevoBuque.teuDisponibles}
                    onChange={(e) => setNuevoBuque({ ...nuevoBuque, teuDisponibles: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Estado Inicial</label>
                  <select
                    value={nuevoBuque.estado}
                    onChange={(e) => setNuevoBuque({ ...nuevoBuque, estado: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-white text-sm"
                  >
                    <option value="En Ruta">En Ruta</option>
                    <option value="Atracado">Atracado</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsBuqueModalOpen(false)}
                  className="px-4 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-md cursor-pointer"
                >
                  Guardar Buque
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: PUBLICAR NUEVA SUBASTA DE ESPACIOS (TEU) */}
      {isSubastaModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-slate-900 px-6 py-4 flex justify-between items-center text-white">
              <h3 className="font-bold flex items-center gap-2">
                <Gavel size={18} className="text-amber-400" /> Publicar Licitación de TEUs
              </h3>
              <button onClick={() => setIsSubastaModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCrearSubasta} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Buque Ofertante (Solo en Muelle)</label>
                <select
                  value={nuevaSubasta.buqueNombre}
                  onChange={(e) => setNuevaSubasta({ ...nuevaSubasta, buqueNombre: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-white text-sm"
                >
                  {buques
                    .filter(b => b.estado && b.estado.includes('Atracado'))
                    .map((b) => (
                    <option key={b.id} value={b.nombre}>
                      {b.nombre} ({b.teuDisponibles} TEUs libres)
                    </option>
                  ))}
                </select>
                {buques.filter(b => b.estado && b.estado.includes('Atracado')).length === 0 && (
                  <p className="text-xs text-amber-500 mt-2 font-medium">⚠️ Todos los buques están en ruta. Para subastar TEUs, autoriza primero el atraque de un buque en la pestaña de Flota.</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Ruta Comercial</label>
                <select
                  value={nuevaSubasta.ruta}
                  onChange={(e) => setNuevaSubasta({ ...nuevaSubasta, ruta: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-white text-sm"
                >
                  {rutasComerciales.map((r, i) => (
                    <option key={i} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Cantidad de TEUs</label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    required
                    value={nuevaSubasta.espaciosTeu}
                    onChange={(e) => setNuevaSubasta({ ...nuevaSubasta, espaciosTeu: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Precio Base Salida ($)</label>
                  <input
                    type="number"
                    min="100"
                    max="25000"
                    step="50"
                    required
                    value={nuevaSubasta.precioBase}
                    onChange={(e) => setNuevaSubasta({ ...nuevaSubasta, precioBase: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-white text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsSubastaModalOpen(false)}
                  className="px-4 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-bold rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-md cursor-pointer"
                >
                  Lanzar Subasta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN (MISMO ESTILO QUE EXPORTADOR) */}
      {successMsg && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6 text-center border border-slate-200 dark:border-slate-700">
            <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={36} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{successMsg.titulo}</h3>
            <p className="text-sm font-mono font-bold text-blue-500 mb-3">{successMsg.detalle}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">{successMsg.subtexto}</p>
            <button
              onClick={() => setSuccessMsg(null)}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm transition-colors cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* MODAL DE DETALLES DE ADJUDICACIÓN */}
      {subastaDetalle && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              <h3 className="font-bold flex items-center gap-2 text-slate-800 dark:text-white">
                <Gavel size={18} className="text-amber-500" />
                Resumen de Licitación #{subastaDetalle.id}
              </h3>
              <button onClick={() => setSubastaDetalle(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"><X size={20}/></button>
            </div>
            
            <div className="p-5 space-y-4 text-sm">
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                <span className="block text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 mb-1">Exportador Ganador</span>
                <span className="font-mono text-lg font-black text-slate-800 dark:text-white">{subastaDetalle.mejorPostor || 'EXP-001'}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1">Buque Ofertante</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{subastaDetalle.buque}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1">Volumen Adjudicado</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{subastaDetalle.espaciosTeu} TEUs</span>
                </div>
                <div className="col-span-2">
                  <span className="block text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1">Ruta Comercial</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{subastaDetalle.ruta}</span>
                </div>
                <div className="col-span-2 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-500">Monto Final Pagado:</span>
                  <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">${Number(subastaDetalle.pujaActual || subastaDetalle.precioBase).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
