import { Package, AlertTriangle, Clock, Gavel, Wallet, MapPin, Search, Plus, X, Loader2, CheckCircle2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { logisticaApi } from '../services/api'; // Importamos tu API centralizada

export default function DashboardExportador() {
  const navigate = useNavigate();
  const [busqueda, setBusqueda] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null); // <-- NUEVO ESTADO
  const [cargaSeleccionada, setCargaSeleccionada] = useState(null); // <-- ESTADO PARA DETALLES DE CARGA
  const [saldo, setSaldo] = useState(0); // Nuevo estado para la Billetera real
  const [subastas, setSubastas] = useState([]);
  
  // Estados para los datos reales
  const [cargas, setCargas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorConeccion, setErrorConeccion] = useState(false);

  // NUEVO ESTADO: Formulario más real (Booking)
  const [formData, setFormData] = useState({
    puertoOrigen: '',
    puertoDestino: '',
    tipo: 'Seca', 
    tamano: '20ft', // 20 o 40 pies
    peso: ''
    // NOTA: Quitamos el 'codigo' porque se generará automáticamente
  });

  const [costoTotal, setCostoTotal] = useState(0);

  // LISTA DE PUERTOS DE EJEMPLO
  const puertosMundiales = [
    "Puerto Quetzal, Guatemala",
    "Santo Tomás de Castilla, Guatemala",
    "Puerto de Manzanillo, México",
    "Puerto de Balboa, Panamá",
    "Port of Los Angeles, EE.UU.",
    "Port of Shanghai, China",
    "Port of Rotterdam, Países Bajos"
  ];

  // Extrae el país (después de la coma)
  const getPais = (puertoCompleto) => {
    if (!puertoCompleto) return '';
    return puertoCompleto.split(', ')[1];
  };

  // Límites dinámicos según el tamaño del equipo
  const pesoMaximo = formData.tamano === '20ft' ? 28000 : 29000;
  const pesoMinimo = 100;

  // LOGICA DE COTIZACIÓN AUTOMÁTICA
  useEffect(() => {
    if (!formData.peso) {
      setCostoTotal(0);
      return;
    }

    // 1. Tarifa base por tamaño del contenedor
    let tarifaBase = formData.tamano === '20ft' ? 1200 : 2000;

    // 2. Recargo por tipo de equipo especial
    if (formData.tipo === 'Refrigerada') tarifaBase += 850; // Requiere generador eléctrico
    if (formData.tipo === 'Peligrosa') tarifaBase += 1500;  // Seguros especiales (IMO)

    // 3. Recargo por exceso de peso (ej. $0.15 por cada kg extra después de 15,000 kg)
    let recargoPeso = 0;
    const pesoNum = parseFloat(formData.peso);
    if (pesoNum > 15000) {
      recargoPeso = (pesoNum - 15000) * 0.15;
    }

    setCostoTotal(tarifaBase + recargoPeso);
  }, [formData]);

  useEffect(() => {
    const fetchDatosIniciales = async () => {
      try {
        const [responseContenedores, responseSaldo, responseSubastas] = await Promise.all([
          logisticaApi.get('/contenedores'),
          logisticaApi.get('/billetera/saldo'),
          logisticaApi.get('/licitaciones')
        ]);

        const cargasNormalizadas = responseContenedores.data.map(c => ({
          ...c,
          retenido: c.retenido === true || (c.estado && c.estado.toLowerCase().includes('retenid'))
        }));
        setCargas(cargasNormalizadas);
        
        try {
            setSaldo(responseSaldo.data.saldoDisponible);
        } catch (e) {
            setSaldo(14500.00);
        }

        // Filtramos solo las subastas ACTIVAS
        const soloActivas = responseSubastas.data.filter(sub => sub.estado !== 'ADJUDICADA');
        setSubastas(soloActivas);

        setErrorConeccion(false);
        setIsLoading(false);
      } catch (error) {
        console.error("Error conectando al backend:", error);
        setIsLoading(false);
      }
    };

    fetchDatosIniciales();

    // Se sincroniza automáticamente cada 3 segundos en tiempo real
    const intervalo = setInterval(fetchDatosIniciales, 3000);
    window.addEventListener('datosActualizados', fetchDatosIniciales);

    return () => {
      clearInterval(intervalo);
      window.removeEventListener('datosActualizados', fetchDatosIniciales);
    };
  }, []);

  // NUEVO: Manejador para actualizar el estado cuando el usuario escribe en el formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Si el campo que están modificando es el peso, aplicamos el bloqueo estricto
    if (name === 'peso') {
      const maximoPermitido = formData.tamano === '20ft' ? 28000 : 29000;
      
      // Si el valor ingresado es mayor al máximo legal, cortamos la ejecución aquí
      // y no dejamos que el número se escriba en la pantalla
      if (value !== '' && parseFloat(value) > maximoPermitido) {
        return; 
      }
    }

    // Para el resto de campos (o si el peso es válido), actualizamos normal
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleGuardarOperacion = async (e) => {
    e.preventDefault();
    
    const paisOrigen = getPais(formData.puertoOrigen);
    const paisDestino = getPais(formData.puertoDestino);

    if (paisOrigen === paisDestino) {
      alert("Por leyes de cabotaje, el puerto de origen y destino no pueden pertenecer al mismo país.");
      return;
    }

    const pesoIngresado = parseFloat(formData.peso);
    if (pesoIngresado < pesoMinimo || pesoIngresado > pesoMaximo) {
      alert(`El peso de la carga debe estar entre ${pesoMinimo} kg y un máximo legal de ${pesoMaximo} kg para un equipo de ${formData.tamano}.`);
      return;
    }

    try {
      // GENERACIÓN AUTOMÁTICA DEL CÓDIGO (Ej: HLBU-739281)
      const prefijosNavieras = ['MSCU', 'HLBU', 'MAEU', 'CMAU', 'ZIMU'];
      const prefijoAleatorio = prefijosNavieras[Math.floor(Math.random() * prefijosNavieras.length)];
      const numeroAleatorio = Math.floor(100000 + Math.random() * 900000); 
      const codigoGenerado = `${prefijoAleatorio}-${numeroAleatorio}`;

      // Armamos el objeto tal como lo espera tu backend actual en Java
      const payloadBackend = {
        codigo: codigoGenerado,
        tipo: formData.tipo,
        estado: 'Pendiente de Ingreso',
        peso: formData.peso
        // Nota: Si luego agregas puertos y costos a tu backend, los puedes enviar aquí
      };

      const response = await logisticaApi.post('/contenedores', payloadBackend);
      
      setCargas([...cargas, response.data]);
      
      // NUEVO: Descontar el dinero de la billetera visualmente
      setSaldo(saldoAnterior => saldoAnterior - costoTotal);

      // Enviamos el cobro real a PostgreSQL
      await logisticaApi.post('/billetera/descontar', { monto: costoTotal });

      // Sincronizamos la barra de navegación superior
      window.dispatchEvent(new Event('saldoActualizado'));
      
      // Reseteamos el formulario y cerramos el modal de creación
      setFormData({ puertoOrigen: '', puertoDestino: '', tipo: 'Seca', tamano: '20ft', peso: '' });
      setIsModalOpen(false);
      
      // NUEVO: En lugar del alert, guardamos los datos en el estado para mostrar el modal bonito
      setSuccessMsg({
        codigo: codigoGenerado,
        costo: costoTotal
      });
      
    } catch (error) {
      console.error("Error al guardar:", error);
      alert("Hubo un error al procesar la reserva.");
    }
  };

  // Filtrado de búsquedas
  const cargasFiltradas = cargas.filter(carga => 
    (carga.codigo && carga.codigo.toLowerCase().includes(busqueda.toLowerCase())) || 
    (carga.referencia && carga.referencia.toLowerCase().includes(busqueda.toLowerCase()))
  );

  return (
    <div className="animate-in fade-in duration-500 h-full flex flex-col relative">
      
      {/* CABECERA */}
      <div className="mb-6 flex flex-col xl:flex-row justify-between items-start xl:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight transition-colors">¡Hola, Exportador!</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 transition-colors">
            {errorConeccion && <span className="text-amber-500 font-bold mr-2">⚠️ Modo Offline.</span>}
            Tienes <span className="font-bold text-red-600 dark:text-red-400">{cargas.filter(c => c.retenido).length} alerta aduanera</span> y{' '}
            <button
              type="button"
              onClick={() => navigate('/dashboard/subastas')}
              className="font-bold text-slate-900 dark:text-white underline decoration-amber-500/60 hover:text-amber-500 transition-colors cursor-pointer"
            >
              {subastas.length} subastas disponibles
            </button>{' '}
            hoy.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/dashboard/subastas')}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors shadow-sm cursor-pointer"
          >
            <Gavel size={16} className="text-amber-500" />
            Subastas en Vivo
            <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full">
              {subastas.length}
            </span>
          </button>

          <button
            onClick={() => navigate('/dashboard/billetera')}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors shadow-sm"
          >
            <Wallet size={16} className="text-emerald-500" />
            Billetera Virtual
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            Nueva Operación +
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-[600px]">
        
        {/* COLUMNA IZQUIERDA: MÉTRICAS */}
        <div className="w-full lg:w-64 flex-shrink-0 flex flex-col gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-5 shadow-sm transition-colors">
            <h3 className="text-sm font-bold text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-2"><Package size={16} /> Contenedores</h3>
            <div className="text-4xl font-black text-slate-900 dark:text-white mb-3">{cargas.length}</div>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2 text-slate-600 dark:text-slate-300"><span className="w-2 h-2 rounded-full bg-teal-500"></span><strong>{cargas.filter(c => !c.retenido).length}</strong> activos</li>
              <li className="flex items-center gap-2 text-slate-600 dark:text-slate-300"><span className="w-2 h-2 rounded-full bg-red-500"></span><strong>{cargas.filter(c => c.retenido).length}</strong> retenidos</li>
            </ul>
          </div>
          {/* Tarjeta de Finanzas convertida en botón */}
          <button
            type="button"
            onClick={() => navigate('/dashboard/billetera')}
            className="w-full text-left bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-500/50 dark:hover:border-emerald-500/50 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Wallet size={16} className="group-hover:scale-110 transition-transform" />
              <span>Finanzas</span>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              ${Number(saldo).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </button>

          {/* Tarjeta de Información de Subastas */}
          <button
            type="button"
            onClick={() => navigate('/dashboard/subastas')}
            className="w-full text-left bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-amber-500/50 dark:hover:border-amber-500/50 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-amber-500 text-xs font-bold uppercase tracking-wider">
                <Gavel size={16} className="group-hover:rotate-12 transition-transform" />
                <span>Subastas Activas</span>
              </div>
              <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-ping"></span>
            </div>

            <div className="text-2xl font-black text-slate-900 dark:text-white mb-3">
              {subastas.length} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">buques ofertando</span>
            </div>

            {/* Lista rápida de las primeras 2 subastas */}
            <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-700/60">
              {subastas.slice(0, 2).map((sub, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[130px]">
                    {sub.buque || sub.codigoBuque || `Lote #${sub.id}`}
                  </span>
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                    ${Number(sub.pujaActual || sub.precioBase || 1200).toLocaleString('en-US')}
                  </span>
                </div>
              ))}
            </div>
          </button>
        </div>

        {/* COLUMNA DERECHA: MAPA Y PANEL FLOTANTE */}
        <div className="flex-1 bg-slate-300 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 relative overflow-hidden shadow-inner flex justify-end p-4 lg:p-6 min-h-[500px] transition-colors">
          <div className="absolute inset-0 opacity-30 mix-blend-multiply dark:mix-blend-normal dark:invert dark:opacity-40" style={{ backgroundImage: "url('https://upload.wikimedia.org/wikipedia/commons/8/80/World_map_-_low_resolution.svg')", backgroundSize: "cover", backgroundPosition: "center" }}></div>
          
          <div className="w-full max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-lg shadow-2xl z-10 flex flex-col h-full border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors">
            
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center gap-3">
              <MapPin size={18} className="text-blue-600 dark:text-blue-400" />
              <input type="text" placeholder="Buscar contenedor o BL..." className="w-full bg-transparent border-none outline-none text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
              <Search size={16} className="text-slate-400" />
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 text-xs font-bold text-slate-500 dark:text-slate-400 flex justify-between">
                <span>SEGUIMIENTO DE CARGAS</span>
                <span>{cargasFiltradas.length} cargas</span>
              </div>

              {isLoading ? (
                <div className="p-8 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
                  <Loader2 className="animate-spin mb-2" size={24} />
                  <p className="text-sm">Conectando con el puerto...</p>
                </div>
              ) : (
                cargasFiltradas.map((carga, index) => (
                  <div 
                    key={index} 
                    onClick={() => setCargaSeleccionada(carga)} // <-- NUEVO EVENTO CLICK
                    className={`p-4 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors ${carga.retenido ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className={`font-mono text-sm font-bold ${carga.retenido ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}>
                        {carga.referencia || `PORT-REF-${carga.id}`}
                      </span>
                      {carga.retenido ? <AlertTriangle size={14} className="text-red-500" /> : <Gavel size={14} className="text-slate-400 dark:text-slate-500" />}
                    </div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">{carga.tipo || 'Contenedor'} - {carga.codigo}</h4>
                    <p className={`text-xs font-medium flex items-center gap-1.5 ${carga.retenido ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`}>
                      {carga.retenido ? <span className="w-1.5 h-1.5 rounded-full bg-red-600 dark:bg-red-500"></span> : <Clock size={12} className="text-amber-500"/>} 
                      {carga.estado}
                    </p>
                  </div>
                ))
       )}

      {/* MODAL DE ÉXITO PERSONALIZADO */}
      {successMsg && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden transform transition-all scale-in-95">
            <div className="p-6 text-center">
              
              {/* Círculo verde con check */}
              <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
                <CheckCircle2 size={40} />
              </div>
              
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">¡Reserva Confirmada!</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-5">
                Su contenedor asignado es el <br/>
                <span className="text-lg font-mono font-bold text-slate-800 dark:text-slate-200 mt-1 block">
                  {successMsg.codigo}
                </span>
              </p>
              
              {/* Tarjeta interna de cobro */}
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 mb-6 border border-slate-100 dark:border-slate-700">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Costo Debitado</p>
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  ${successMsg.costo.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </p>
              </div>
              
              <button
                onClick={() => setSuccessMsg(null)}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-md"
              >
                Aceptar y Continuar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
          </div>
        </div>
      </div>

      {/* MODAL PARA NUEVA OPERACIÓN */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
            <div className="bg-slate-900 px-6 py-4 flex justify-between items-center text-white">
              <h2 className="text-lg font-bold flex items-center gap-2"><Package size={20}/> Registrar Nuevo Contenedor</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white"><X size={24} /></button>
            </div>
            
            {/* NUEVO: Formulario JSX integrado con el estado */}
            <form onSubmit={handleGuardarOperacion} className="p-0">
               <div className="p-6 space-y-5 text-left max-h-[60vh] overflow-y-auto">
                 
                 {/* Puertos de Origen y Destino */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                       <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Puerto de Origen</label>
                       <select name="puertoOrigen" value={formData.puertoOrigen} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white" required>
                           <option value="">Seleccione origen...</option>
                           {puertosMundiales.map(p => {
                               const esMismoPais = getPais(formData.puertoDestino) === getPais(p);
                               return (
                                 <option key={`orig-${p}`} value={p} disabled={esMismoPais}>
                                   {p} {esMismoPais ? '(Restringido)' : ''}
                                 </option>
                               );
                           })}
                       </select>
                   </div>
                   <div>
                       <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Puerto de Destino</label>
                       <select name="puertoDestino" value={formData.puertoDestino} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white" required>
                           <option value="">Seleccione destino...</option>
                           {puertosMundiales.map(p => {
                               const esMismoPais = getPais(formData.puertoOrigen) === getPais(p);
                               return (
                                 <option key={`dest-${p}`} value={p} disabled={esMismoPais}>
                                   {p} {esMismoPais ? '(Restringido)' : ''}
                                 </option>
                               );
                           })}
                       </select>
                   </div>
                 </div>

                 {/* Detalles de la Carga */}
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700">
                   <div>
                       <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Naturaleza</label>
                       <select name="tipo" value={formData.tipo} onChange={handleInputChange} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white">
                           <option value="Seca">Carga Seca (General)</option>
                           <option value="Refrigerada">Refrigerada (Reefer)</option>
                           <option value="Peligrosa">Peligrosa (IMO)</option>
                       </select>
                   </div>
                   <div>
                       <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Tamaño Eq.</label>
                       <select name="tamano" value={formData.tamano} onChange={handleInputChange} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white">
                           <option value="20ft">20 Pies (TEU)</option>
                           <option value="40ft">40 Pies (FEU)</option>
                       </select>
                   </div>
                     <div>
                         <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Peso (Kg)</label>
                         <input 
                           type="number" 
                           step="0.01" 
                           min={pesoMinimo} 
                           max={pesoMaximo} 
                           name="peso" 
                           value={formData.peso} 
                           onChange={handleInputChange} 
                           onInvalid={(e) => {
                             if (e.target.validity.rangeUnderflow) {
                               e.target.setCustomValidity(`El peso mínimo requerido es de ${pesoMinimo} kg.`);
                             } else if (e.target.validity.rangeOverflow) {
                               e.target.setCustomValidity(`El peso máximo permitido es de ${pesoMaximo} kg.`);
                             } else if (e.target.validity.valueMissing) {
                               e.target.setCustomValidity('Por favor, ingrese el peso de la carga.');
                             }
                           }}
                           onInput={(e) => e.target.setCustomValidity('')}
                           placeholder={`Min: ${pesoMinimo} | Máx: ${pesoMaximo}`} 
                           className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white" 
                           required 
                         />
                     </div>
                 </div>

                 {/* Resumen de Cotización */}
                 <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4 flex justify-between items-center">
                    <div>
                      <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-400">Cotización Estimada</h4>
                      <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-0.5">Incluye flete marítimo y recargos por equipo.</p>
                    </div>
                    <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300">
                      ${costoTotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </div>
                 </div>
                 
               </div>

               {/* Botones de acción */}
               <div className="flex justify-end gap-3 px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700">
                 <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors rounded-md font-medium">Cancelar</button>
                 <button type="submit" className="px-6 py-2 text-sm bg-blue-600 hover:bg-blue-700 transition-colors text-white rounded-md font-medium flex items-center gap-2">
                    <Wallet size={16} /> Confirmar y Pagar
                 </button>
               </div>
            </form>

          </div>
        </div>
       )}

      {/* MODAL DE DETALLES DEL CONTENEDOR */}
      {cargaSeleccionada && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden transform transition-all scale-in-95">
            
            {/* Cabecera del Modal */}
            <div className="bg-slate-900 px-6 py-4 flex justify-between items-center text-white">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Package size={20}/> Detalles de Operación
              </h2>
              <button onClick={() => setCargaSeleccionada(null)} className="text-slate-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            
            {/* Cuerpo del Modal con la información */}
            <div className="p-6">
              
              {/* Encabezado del contenedor */}
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100 dark:border-slate-700">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center">
                  <Package size={24} />
                </div>
                <div>
                  <h3 className="font-mono text-xl font-bold text-slate-900 dark:text-white">{cargaSeleccionada.codigo}</h3>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">{cargaSeleccionada.referencia || `PORT-REF-${cargaSeleccionada.id}`}</p>
                </div>
              </div>

              {/* Grid de Datos */}
              <div className="grid grid-cols-2 gap-y-6 gap-x-4 mb-6">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">Estado Actual</p>
                  <div className="flex items-center gap-1.5">
                    {cargaSeleccionada.retenido ? <span className="w-2 h-2 rounded-full bg-red-600"></span> : <Clock size={14} className="text-amber-500"/>}
                    <span className={`text-sm font-medium ${cargaSeleccionada.retenido ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-200'}`}>
                      {/* Quitamos la etiqueta interna del precio si viene en el texto del estado */}
                      {cargaSeleccionada.estado ? cargaSeleccionada.estado.split(' | $')[0] : 'Pendiente de Ingreso'}
                    </span>
                  </div>
                </div>
                
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">Tipo de Equipo</p>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {cargaSeleccionada.estado?.includes('TEUs') 
                      ? 'Lote Subasta (TEUs)' 
                      : (cargaSeleccionada.tipo ? `Carga ${cargaSeleccionada.tipo}` : 'Carga Seca (Estándar)')}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">Peso Registrado</p>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {cargaSeleccionada.peso ? `${parseFloat(cargaSeleccionada.peso).toLocaleString('en-US')} kg` : 'No especificado'}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">Precio Pagado</p>
                  <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                    {(() => {
                      // 1. Si viene el precio directo de la base de datos
                      if (cargaSeleccionada.precio) {
                        return `$${parseFloat(cargaSeleccionada.precio).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
                      }
                      // 2. Si es una adjudicación con el precio incrustado ("... | $1550")
                      if (cargaSeleccionada.estado && cargaSeleccionada.estado.includes(' | $')) {
                        const precioSubasta = parseFloat(cargaSeleccionada.estado.split(' | $')[1]);
                        return `$${precioSubasta.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
                      }
                      // 3. Si es una adjudicación anterior sin etiqueta, mostramos su base o tarifa normal
                      const base = cargaSeleccionada.tipo === 'Refrigerada' ? 2050 : cargaSeleccionada.tipo === 'Peligrosa' ? 2700 : 1200;
                      const recargo = parseFloat(cargaSeleccionada.peso) > 15000 ? (parseFloat(cargaSeleccionada.peso) - 15000) * 0.15 : 0;
                      return `$${(base + recargo).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
                    })()}
                  </p>
                </div>
              </div>

              {/* Botón de cierre */}
              <div className="pt-2">
                <button
                  onClick={() => setCargaSeleccionada(null)}
                  className="w-full py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg font-medium transition-colors"
                >
                  Cerrar Detalles
                </button>
              </div>
              
            </div>
          </div>
        </div>
      )}
    </div>
  );
}