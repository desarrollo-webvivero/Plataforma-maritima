import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Wallet, Gavel, Plus, Search, MapPin, Clock,
  AlertTriangle, CheckCircle2, X, Ship, Anchor, ArrowRight
} from 'lucide-react';
import { logisticaApi } from '../services/api';

export default function DashboardExportador() {
  const navigate = useNavigate();

  const [contenedores, setContenedores] = useState([]);
  const [licitaciones, setLicitaciones] = useState([]);
  const [buques, setBuques] = useState([]);
  const [saldo, setSaldo] = useState(0);
  const [exportadorInfo, setExportadorInfo] = useState(null);
  const [busqueda, setBusqueda] = useState('');

  // Estados del Modal "Registrar Nuevo Contenedor"
  const [mostrarModal, setMostrarModal] = useState(false);
  const [buqueSeleccionadoId, setBuqueSeleccionadoId] = useState('');
  const [puertoOrigen, setPuertoOrigen] = useState('Puerto Quetzal, Guatemala');
  const [puertoDestino, setPuertoDestino] = useState('Puerto de Manzanillo, México');
  const [naturaleza, setNaturaleza] = useState('Carga Seca (General)');
  const [tamanoTeu, setTamanoTeu] = useState('20'); // '20' = 1 TEU, '40' = 2 TEUs
  const [pesoKg, setPesoKg] = useState('14500');
  const [procesandoPago, setProcesandoPago] = useState(false);
  const [errorModal, setErrorModal] = useState('');

  // Cargar todos los datos reales desde PostgreSQL
  const cargarDatosDashboard = async () => {
    try {

    const usrLocal = JSON.parse(
      localStorage.getItem('usuarioActivo') ||
      localStorage.getItem('exportadorActivo') ||
      'null'
    );

    const [resCont, resLic, resBuques, resSaldo, resUsuarios] =
      await Promise.allSettled([
        logisticaApi.get('/contenedores'),
        logisticaApi.get('/licitaciones'),
        logisticaApi.get('/buques'),
        usrLocal?.id
          ? logisticaApi.get(`/usuarios/${usrLocal.id}/saldo`)
          : logisticaApi.get('/billetera/saldo'),
        logisticaApi.get('/usuarios')
      ]);


      if (resCont.status === 'fulfilled' && Array.isArray(resCont.value.data)) {
        setContenedores(resCont.value.data);
      }

      if (resLic.status === 'fulfilled' && Array.isArray(resLic.value.data)) {
        const activas = resLic.value.data.filter(l => l.estado !== 'ADJUDICADA');
        setLicitaciones(activas);
      }

      if (resBuques.status === 'fulfilled' && Array.isArray(resBuques.value.data)) {
        const listaBuques = resBuques.value.data;
        setBuques(listaBuques);

        // Preseleccionar SOLO la primera vez si prevId está vacío
        setBuqueSeleccionadoId((prevId) => {
          if (prevId) return prevId; // Si ya elegiste uno, NO lo toca
          const preferido =
            listaBuques.find(b => (b.estado || '').includes('Atracado') && Number(b.teuDisponibles) > 0) ||
            listaBuques.find(b => Number(b.teuDisponibles) > 0) ||
            listaBuques[0];
          if (preferido) {
            sincronizarRutaConBuque(preferido);
            return String(preferido.id);
          }
          return prevId;
        });
      }

   

      // Cargar datos reales del Exportador activo
      const guardado = localStorage.getItem('exportadorActivo') || localStorage.getItem('usuarioActivo');
      if (guardado) {
        setExportadorInfo(JSON.parse(guardado));
      } else if (resUsuarios.status === 'fulfilled' && Array.isArray(resUsuarios.value.data)) {
        const exp = resUsuarios.value.data.find(u => (u.rol || 'EXPORTADOR') === 'EXPORTADOR') || resUsuarios.value.data[0];
        if (exp) {
          setExportadorInfo(exp);
          localStorage.setItem('exportadorActivo', JSON.stringify(exp));
        }
      }
    } catch (error) {
      console.error('Error cargando panel del exportador:', error);
    }
  };

  useEffect(() => {
    cargarDatosDashboard();
    const interval = setInterval(cargarDatosDashboard, 4000);
    return () => clearInterval(interval);
  }, []);

  // Sincronizar origen y destino según la ruta del buque elegido
  const sincronizarRutaConBuque = (buqueObj) => {
    if (!buqueObj || !buqueObj.ruta) return;
    const partes = buqueObj.ruta.split(/->|→|-/).map(s => s.trim()).filter(Boolean);
    if (partes.length >= 2) {
      setPuertoOrigen(partes[0]);
      setPuertoDestino(partes[partes.length - 1]);
    }
  };

  const handleSeleccionarBuque = (idStr) => {
    setBuqueSeleccionadoId(idStr);
    setErrorModal('');
    const encontrado = buques.find(b => String(b.id) === String(idStr));
    if (encontrado) {
      sincronizarRutaConBuque(encontrado);
    }
  };

  // Buques disponibles con capacidad libre
  const buquesConEspacio = buques.filter(b => Number(b.teuDisponibles || 0) > 0);
  const buqueActualObj = buques.find(b => String(b.id) === String(buqueSeleccionadoId)) || null;

  // Cálculo de TEUs requeridos y cotización dinámica
  const teusRequeridos = tamanoTeu === '40' ? 2 : 1;

  const calcularCotizacion = () => {
    const pesoNum = Number(pesoKg) || 0;
    if (pesoNum < 100) return 0;

    let base = tamanoTeu === '40' ? 1450 : 950;
    if (naturaleza.includes('Refrigerada')) base += 450;
    if (naturaleza.includes('Peligrosa')) base += 600;
    if (pesoNum > 20000) base += 250;

    return base;
  };

  const cotizacionActual = calcularCotizacion();

  // Confirmar y Pagar: Resta TEUs al Buque + Descuenta Saldo + Crea Contenedor
  const handleConfirmarOperacion = async (e) => {
    e.preventDefault();
    setErrorModal('');

    const pesoNum = Number(pesoKg);
    if (!pesoNum || pesoNum < 100 || pesoNum > 32000) {
      setErrorModal('Ingresa un peso válido entre 100 kg y 32,000 kg.');
      return;
    }

    if (!buqueActualObj) {
      setErrorModal('Selecciona un buque disponible para asignar tu contenedor.');
      return;
    }

    const teusLibresBuque = Number(buqueActualObj.teuDisponibles || 0);
    if (teusLibresBuque < teusRequeridos) {
      setErrorModal(
        `El buque ${buqueActualObj.nombre} solo tiene ${teusLibresBuque} TEU(s) libres y tu unidad requiere ${teusRequeridos} TEU(s).`
      );
      return;
    }

    if (saldo < cotizacionActual) {
      setErrorModal('Saldo insuficiente en tu Billetera Virtual para cubrir esta operación.');
      return;
    }

    setProcesandoPago(true);

    try {
   // 1. Descontar saldo directamente del usuario exportador en PostgreSQL
   if (exportadorInfo?.id) {
     const resUsr = await logisticaApi.put(`/usuarios/${exportadorInfo.id}/saldo`, {
       descontar: cotizacionActual
     });
     localStorage.setItem('exportadorActivo', JSON.stringify(resUsr.data));
     localStorage.setItem('usuarioActivo', JSON.stringify(resUsr.data));
     setSaldo(Number(resUsr.data.saldoInicial));
   } else {
     await logisticaApi.post('/billetera/descontar', { monto: cotizacionActual });
   }

   // 2. Restar los TEUs correspondientes al buque seleccionado en PostgreSQL
   const nuevosTeusDisponibles = Math.max(0, teusLibresBuque - teusRequeridos);
   const buqueActualizado = {
     ...buqueActualObj,
     teuDisponibles: nuevosTeusDisponibles
   };
   await logisticaApi.put(`/buques/${buqueActualObj.id}`, buqueActualizado);

      // 3. Crear el nuevo contenedor vinculado al buque y al exportador
      const prefijos = ['MAEU', 'MSCU', 'CMAU', 'HLCU'];
      const prefijo = prefijos[Math.floor(Math.random() * prefijos.length)];
      const numeroRandom = Math.floor(100000 + Math.random() * 900000);
      const codigoContenedor = `${prefijo}-${numeroRandom}`;

      const nombreTitular = exportadorInfo?.empresa || exportadorInfo?.representante || 'Exportador B2B';

      const nuevoContenedor = {
        codigo: codigoContenedor,
        pesoKg: pesoNum,
        tipoContenedor: `${tamanoTeu} Pies (${teusRequeridos} TEU) - ${naturaleza}`,
        ubicacionActual: `Muelle #1 (${buqueActualObj.nombre})`,
        estado: `Embarcado (${teusRequeridos} TEU - ${buqueActualObj.nombre} • ${nombreTitular}) | $${cotizacionActual}`,
        retenidoPorAduana: false
      };

      await logisticaApi.post('/contenedores', nuevoContenedor);

      // Actualizar estado local y cerrar modal
      await cargarDatosDashboard();
      window.dispatchEvent(new Event('storage'));
      setMostrarModal(false);
    } catch (err) {
      console.error('Error registrando contenedor:', err);
      setErrorModal(
        err.response?.data?.error || 'Error al procesar la reserva con el servidor.'
      );
    } finally {
      setProcesandoPago(false);
    }
  };

  // Estadísticas de contenedores
  const retenidosCount = contenedores.filter(
    c => Boolean(c.retenidoPorAduana) || (c.estado || '').toLowerCase().includes('retenido')
  ).length;
  const activosCount = contenedores.length - retenidosCount;

  const contenedoresFiltrados = contenedores.filter(c => {
    if (!busqueda.trim()) return true;
    const t = busqueda.toLowerCase();
    return (
      (c.codigo || '').toLowerCase().includes(t) ||
      (c.estado || '').toLowerCase().includes(t) ||
      `port-ref-${c.id}`.includes(t)
    );
  });

  const nombreSaludo =
    exportadorInfo?.representante ||
    exportadorInfo?.empresa ||
    'Exportador';

  return (
    <div className="space-y-6">
      
      {/* CABECERA CON NOMBRE REAL DEL EXPORTADOR Y BOTONES DE ACCIÓN */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              ¡Hola, {nombreSaludo}!
            </h1>
            {exportadorInfo?.empresa && (
              <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-black uppercase">
                {exportadorInfo.empresa} ({exportadorInfo.codigoExportador || 'EXP-001'})
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Tienes{' '}
            <strong className="text-red-500">{retenidosCount} alerta(s) aduanera(s)</strong>,{' '}
            <strong className="text-slate-900 dark:text-white underline">
              {licitaciones.length} subasta(s) disponible(s)
            </strong>{' '}
            y{' '}
            <strong className="text-emerald-600 dark:text-emerald-400">
              {buquesConEspacio.length} buque(s) con espacio TEU
            </strong>{' '}
            hoy.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => navigate('/subastas')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-amber-500/50 transition-all cursor-pointer shadow-sm"
          >
            <Gavel size={15} className="text-amber-500" />
            Subastas en Vivo
            <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[11px] font-black">
              {licitaciones.length}
            </span>
          </button>

          <button
            onClick={() => navigate('/billetera')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-emerald-500/50 transition-all cursor-pointer shadow-sm"
          >
            <Wallet size={15} className="text-emerald-500" />
            Billetera Virtual
          </button>

          <button
            onClick={() => {
              setErrorModal('');
              setMostrarModal(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black tracking-wide shadow-md shadow-blue-600/25 transition-all cursor-pointer"
          >
            Nueva Operación
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* GRID PRINCIPAL */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* COLUMNA IZQUIERDA: TARJETAS KPI */}
        <div className="space-y-4">
          
          {/* Tarjeta Contenedores */}
          <div className="bg-white dark:bg-slate-800/90 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 mb-2">
              <Box size={15} />
              <span>Contenedores</span>
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white mb-3">
              {contenedores.length}
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <strong>{activosCount}</strong> activos
              </div>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                <strong>{retenidosCount}</strong> retenidos
              </div>
            </div>
          </div>

          {/* Tarjeta Finanzas */}
          <div className="bg-white dark:bg-slate-800/90 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2">
              <Wallet size={15} />
              <span>Finanzas</span>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              ${Number(saldo).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          {/* Tarjeta Buques Disponibles y Subastas */}
          <div className="bg-white dark:bg-slate-800/90 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-500">
                <Ship size={15} /> Flota con Espacio TEU
              </span>
              <span className="text-xs font-black text-emerald-500">
                {buquesConEspacio.length} buques
              </span>
            </div>

            <div className="space-y-2 pt-1">
              {buquesConEspacio.slice(0, 3).map((b) => (
                <div
                  key={b.id}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-700/70 flex items-center justify-between text-xs"
                >
                  <div className="truncate pr-2">
                    <span className="font-bold text-slate-800 dark:text-white block truncate">
                      {b.nombre}
                    </span>
                    <span className="text-[10px] text-slate-400 block truncate">
                      {b.estado || 'En Puerto'}
                    </span>
                  </div>
                  <span className="font-black text-emerald-600 dark:text-emerald-400 shrink-0">
                    {Number(b.teuDisponibles).toLocaleString('en-US')} TEUs
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* COLUMNA DERECHA (3/4): MAPA + LISTA DE SEGUIMIENTO DE CARGAS */}
        <div className="lg:col-span-3 relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700/80 bg-slate-200 dark:bg-[#162032] min-h-[500px] flex justify-end p-4 sm:p-6 shadow-sm">
          
          {/* Fondo estilizado de Mapa */}
          <div
            className="absolute inset-0 opacity-35 dark:opacity-25 pointer-events-none bg-cover bg-center"
            style={{
              backgroundImage: `url('https://upload.wikimedia.org/wikipedia/commons/e/ec/World_map_blank_without_borders.svg')`
            }}
          />

          {/* Panel Flotante de Seguimiento de Cargas */}
          <div className="relative z-10 w-full max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl flex flex-col max-h-[460px]">
            
            <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
              <MapPin size={16} className="text-blue-500 shrink-0" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar contenedor o BL..."
                className="w-full bg-transparent text-xs text-slate-900 dark:text-white focus:outline-none"
              />
              <Search size={15} className="text-slate-400 shrink-0" />
            </div>

            <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <span>Seguimiento de Cargas</span>
              <span>{contenedoresFiltrados.length} cargas</span>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              {contenedoresFiltrados.map((c) => {
                const retenido =
                  Boolean(c.retenidoPorAduana) ||
                  (c.estado || '').toLowerCase().includes('retenido');

                return (
                  <div
                    key={c.id}
                    className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-mono font-black text-blue-600 dark:text-blue-400">
                        PORT-REF-{c.id}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400">
                        {Number(c.pesoKg || 14500).toLocaleString('en-US')} kg
                      </span>
                    </div>

                    <p className="text-sm font-black text-slate-900 dark:text-white mb-1">
                      Contenedor - {c.codigo}
                    </p>

                    <div className="flex items-center gap-1.5 text-xs">
                      {retenido ? (
                        <AlertTriangle size={13} className="text-red-500 shrink-0" />
                      ) : (
                        <Clock size={13} className="text-amber-500 shrink-0" />
                      )}
                      <span
                        className={
                          retenido
                            ? 'text-red-600 dark:text-red-400 font-bold'
                            : 'text-slate-500 dark:text-slate-400'
                        }
                      >
                        {c.estado}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>

      </div>

      {/* MODAL: REGISTRAR NUEVO CONTENEDOR CON SELECCIÓN DE BUQUE Y DESCUENTO DE TEUS */}
      {mostrarModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            
            {/* Cabecera del Modal */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Box size={20} className="text-blue-400" />
                <h2 className="text-base font-black">
                  Registrar Nuevo Contenedor y Asignar Buque
                </h2>
              </div>
              <button
                onClick={() => setMostrarModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmarOperacion} className="p-6 space-y-4">
              
              {errorModal && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-2">
                  <AlertTriangle size={15} className="shrink-0" />
                  <span>{errorModal}</span>
                </div>
              )}

              {/* 1. SELECCIONAR BUQUE DISPONIBLE (RESTA TEUS AUTOMÁTICAMENTE) */}
              <div className="p-3.5 rounded-xl bg-blue-500/5 border border-blue-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                    <Ship size={14} /> Buque Disponible para Embarque *
                  </label>
                  {buqueActualObj && (
                    <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400">
                      Disponibles: {Number(buqueActualObj.teuDisponibles).toLocaleString('en-US')} TEUs
                    </span>
                  )}
                </div>

                <select
                  value={buqueSeleccionadoId}
                  onChange={(e) => handleSeleccionarBuque(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  {buques.length === 0 ? (
                    <option value="">No hay buques registrados en la Naviera</option>
                  ) : (
                    buques.map((b) => {
                      const libres = Number(b.teuDisponibles || 0);
                      return (
                        <option key={b.id} value={b.id} disabled={libres < teusRequeridos}>
                          {b.nombre} • ({libres} TEUs libres) • {b.estado || 'En Puerto'}
                        </option>
                      );
                    })
                  )}
                </select>

                {buqueActualObj && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                    <span>Ruta del buque: <strong>{buqueActualObj.ruta}</strong></span>
                    <span className="text-amber-600 dark:text-amber-400 font-bold">
                      Se descontarán -{teusRequeridos} TEU(s)
                    </span>
                  </p>
                )}
              </div>

              {/* 2. PUERTO DE ORIGEN Y DESTINO */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Puerto de Origen
                  </label>
                  <input
                    type="text"
                    value={puertoOrigen}
                    onChange={(e) => setPuertoOrigen(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Puerto de Destino
                  </label>
                  <input
                    type="text"
                    value={puertoDestino}
                    onChange={(e) => setPuertoDestino(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* 3. NATURALEZA, TAMAÑO (TEUs) Y PESO (KG) */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                    Naturaleza
                  </label>
                  <select
                    value={naturaleza}
                    onChange={(e) => setNaturaleza(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white"
                  >
                    <option value="Carga Seca (General)">Carga Seca (General)</option>
                    <option value="Carga Refrigerada (Reefer)">Carga Refrigerada</option>
                    <option value="Carga Peligrosa (IMO)">Carga Peligrosa (IMO)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                    Tamaño Eq. (TEUs)
                  </label>
                  <select
                    value={tamanoTeu}
                    onChange={(e) => setTamanoTeu(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                  >
                    <option value="20">20 Pies (1 TEU)</option>
                    <option value="40">40 Pies (2 TEUs)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                    Peso Neto (KG)
                  </label>
                  <input
                    type="number"
                    required
                    value={pesoKg}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPesoKg(val);
                      if (val === '' || Number(val) < 100) {
                        setErrorModal('El peso neto debe ser mayor o igual a 100 kg.');
                      } else if (Number(val) > 32000) {
                        setErrorModal('El peso neto no puede superar los 32,000 kg.');
                      } else {
                        setErrorModal('');
                      }
                    }}
                    placeholder="Mín: 100 kg"
                    className={`w-full px-2.5 py-2 rounded-lg bg-white dark:bg-slate-900 border text-xs font-bold text-slate-900 dark:text-white ${
                      Number(pesoKg) < 100 ? 'border-red-500 focus:border-red-500' : 'border-slate-300 dark:border-slate-700'
                    }`}
                  />
                  {Number(pesoKg) < 100 && (
                    <span className="text-[10px] font-bold text-red-500 mt-1 block">
                      * Debe ser mínimo 100 kg
                    </span>
                  )}
                </div>
              </div>

              {/* 4. RESUMEN DE COTIZACIÓN Y DESCUENTO DE CAPACIDAD */}
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                <div>
                  <span className="text-xs font-black text-emerald-800 dark:text-emerald-300 block">
                    Cotización Estimada ({teusRequeridos} TEU en {buqueActualObj?.nombre || 'Buque'})
                  </span>
                  <span className="text-[11px] text-emerald-700 dark:text-emerald-400">
                    Incluye flete marítimo, reserva de bodega y despacho.
                  </span>
                </div>
                <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
                  ${cotizacionActual.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {/* BOTONES DEL MODAL */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setMostrarModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={procesandoPago || cotizacionActual <= 0}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-black flex items-center gap-2 shadow-lg shadow-blue-600/25 cursor-pointer"
                >
                  <Wallet size= {15} />
                  {procesandoPago ? 'Procesando y Restando TEUs...' : 'Confirmar y Pagar'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
