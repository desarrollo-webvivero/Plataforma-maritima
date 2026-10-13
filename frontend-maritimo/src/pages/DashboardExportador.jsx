import { Package, AlertTriangle, Clock, CheckCircle2, Gavel, Wallet, MapPin, Search, Plus, X } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function DashboardExportador() {
  const [busqueda, setBusqueda] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleGuardarOperacion = (e) => {
    e.preventDefault();
    alert("¡Operación registrada con éxito! (Simulación)");
    setIsModalOpen(false);
  };

  return (
    <div className="animate-in fade-in duration-500 h-full flex flex-col relative">
      
      {/* CABECERA Y GRUPO DE BOTONES DE NAVEGACIÓN */}
      <div className="mb-6 flex flex-col xl:flex-row justify-between items-start xl:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight transition-colors">¡Hola, Exportador!</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 transition-colors">
            Tienes <span className="font-bold text-red-600 dark:text-red-400">1 alerta aduanera</span> y <span className="font-bold text-slate-800 dark:text-slate-200">3 subastas disponibles</span> hoy.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <Link 
            to="/dashboard/billetera" 
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-medium rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm text-sm"
          >
            <Wallet size={16} className="text-emerald-600 dark:text-emerald-400" /> Billetera Virtual
          </Link>
          
          <Link 
            to="/dashboard/subastas" 
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-medium rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm text-sm"
          >
            <Gavel size={16} className="text-blue-600 dark:text-blue-400" /> Subastas en Vivo
          </Link>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm"
          >
            Nueva Operación <Plus size={16} />
          </button>
        </div>
      </div>

      {/* CONTENEDOR PRINCIPAL */}
      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-[600px]">
        {/* COLUMNA IZQUIERDA: MÉTRICAS */}
        <div className="w-full lg:w-64 flex-shrink-0 flex flex-col gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-5 shadow-sm transition-colors">
            <h3 className="text-sm font-bold text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-2"><Package size={16} /> Contenedores</h3>
            <div className="text-4xl font-black text-slate-900 dark:text-white mb-3">12</div>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2 text-slate-600 dark:text-slate-300"><span className="w-2 h-2 rounded-full bg-teal-500"></span><strong>8</strong> en tránsito</li>
              <li className="flex items-center gap-2 text-slate-600 dark:text-slate-300"><span className="w-2 h-2 rounded-full bg-blue-500"></span><strong>4</strong> en patio</li>
            </ul>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-5 shadow-sm transition-colors">
            <h3 className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-2"><Wallet size={16} /> Finanzas</h3>
            <div className="mb-4">
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Saldo Disponible</p>
              <div className="text-2xl font-black text-slate-900 dark:text-white">$14,500.00</div>
            </div>
            <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold mb-1">Próximos Embarques</p>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-slate-900 dark:text-white">3</span>
                <span className="text-xs text-emerald-600 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded font-medium">Adjudicados</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-5 shadow-sm transition-colors">
            <h3 className="text-sm font-bold text-red-600 dark:text-red-400 mb-2 flex items-center gap-2"><AlertTriangle size={16} /> Alertas Aduaneras</h3>
            <div className="text-3xl font-black text-slate-900 dark:text-white mb-2">1</div>
            <p className="text-xs text-red-600 dark:text-red-300 font-medium bg-red-50 dark:bg-red-900/20 p-2 rounded">Contenedor TRLU8943 retenido.</p>
          </div>
        </div>

        {/* COLUMNA DERECHA: MAPA Y PANEL FLOTANTE */}
        <div className="flex-1 bg-slate-300 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 relative overflow-hidden shadow-inner flex justify-end p-4 lg:p-6 min-h-[500px] transition-colors">
          
          {/* MAPA CORREGIDO: Se invierte en modo oscuro y se le sube la opacidad */}
          <div 
            className="absolute inset-0 opacity-30 mix-blend-multiply dark:mix-blend-normal dark:invert dark:opacity-40" 
            style={{ backgroundImage: "url('https://upload.wikimedia.org/wikipedia/commons/8/80/World_map_-_low_resolution.svg')", backgroundSize: "cover", backgroundPosition: "center" }}
          ></div>
          
          <svg className="absolute inset-0 w-full h-full opacity-60 z-0">
            <path d="M 200 300 Q 400 100 600 250 T 900 200" fill="transparent" stroke="#2563EB" strokeWidth="2" strokeDasharray="5,5" />
            <circle cx="200" cy="300" r="4" fill="#2563EB" />
            <circle cx="900" cy="200" r="4" fill="#2563EB" />
          </svg>

          <div className="w-full max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-lg shadow-2xl z-10 flex flex-col h-full border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center gap-3">
              <MapPin size={18} className="text-blue-600 dark:text-blue-400" />
              <input type="text" placeholder="Buscar contenedor o BL..." className="w-full bg-transparent border-none outline-none text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
              <Search size={16} className="text-slate-400 dark:text-slate-500" />
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 text-xs font-bold text-slate-500 dark:text-slate-400 flex justify-between">
                <span>SEGUIMIENTO DE CARGAS</span>
                <span>3 cargas</span>
              </div>

              <div className="p-4 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-mono text-sm font-bold text-blue-600 dark:text-blue-400">PORT-1059179</span>
                  <Gavel size={14} className="text-slate-400 dark:text-slate-500" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">Carga Seca (20ft) - MSCU-123456</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><Clock size={12} className="text-amber-500"/> Pendiente Gate-out (Toma 45)</p>
              </div>

              <div className="p-4 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-mono text-sm font-bold text-blue-600 dark:text-blue-400">PORT-1059234</span>
                  <Gavel size={14} className="text-slate-400 dark:text-slate-500" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">Carga Seca (40ft) - HLBU-987654</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><CheckCircle2 size={12} className="text-teal-500"/> En tránsito (Buque MSC GÜLSÜN)</p>
              </div>

              <div className="p-4 border-b border-slate-100 dark:border-slate-800 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer transition-colors bg-red-50/50 dark:bg-red-900/10">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-mono text-sm font-bold text-red-600 dark:text-red-400">PORT-1059254</span>
                  <AlertTriangle size={14} className="text-red-500" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">Refrigerada (40ft) - TRLU-894321</h4>
                <p className="text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-red-600 dark:bg-red-500"></span> Retenido SAT (Patio Central)</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL PARA NUEVA OPERACIÓN */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-slate-900 dark:bg-slate-950 px-6 py-4 flex justify-between items-center text-white">
              <h2 className="text-lg font-bold flex items-center gap-2"><Package size={20}/> Registrar Nuevo Contenedor</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleGuardarOperacion} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipo de Carga</label>
                  <select className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500 outline-none transition-colors">
                    <option value="CARGA_SECA">Carga Seca (Estándar)</option>
                    <option value="CARGA_REFRIGERADA">Carga Refrigerada (Reefer)</option>
                    <option value="CARGA_PELIGROSA">Carga Peligrosa (IMO)</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Código del Contenedor</label>
                    <input type="text" placeholder="Ej: TRLU1234567" required className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500 outline-none transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Peso (Toneladas)</label>
                    <input type="number" step="0.01" placeholder="Ej: 24.5" required className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500 outline-none transition-colors" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Puerto de Destino</label>
                  <input type="text" placeholder="Ej: Puerto de Manzanillo, México" className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500 outline-none transition-colors" />
                </div>
              </div>
              <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 font-medium rounded-md transition-colors">Cancelar</button>
                <button type="submit" className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow-sm transition-colors">Guardar Operación</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}