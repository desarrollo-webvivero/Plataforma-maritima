import { Wallet, Lock, Plus, ArrowUpRight, ArrowDownRight, History, Search, CreditCard, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { logisticaApi } from '../services/api';
import { actualizarPerfilSesion } from '../services/session';

export default function Billetera() {
  const [busqueda, setBusqueda] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [montoRecarga, setMontoRecarga] = useState('');

  const usuarioActivo = JSON.parse(localStorage.getItem('exportadorActivo') || localStorage.getItem('usuarioActivo') || 'null');
  const [saldo, setSaldoTokens] = useState(() => {
    return usuarioActivo?.saldoInicial ? Number(usuarioActivo.saldoInicial) : 0;
  });
  const [transacciones, setTransacciones] = useState([
    { id: 'TX-9982-A', fecha: '11 Oct 2026, 10:45 AM', concepto: 'Recarga de Billetera (T. Crédito)', estado: 'Completado', monto: '+5,000', tipo: 'ingreso' },
    { id: 'TX-8473-B', fecha: '10 Oct 2026, 14:30 PM', concepto: 'Pago Adjudicación TEUs (MSC GÜLSÜN)', estado: 'Completado', monto: '-1,200', tipo: 'egreso' },
    { id: 'TX-8472-B', fecha: '10 Oct 2026, 09:15 AM', concepto: 'Retención por Puja Activa (EVER GIVEN)', estado: 'Bloqueado', monto: '-2,500', tipo: 'bloqueado' }
  ]);

  // Consultar saldo real al backend al cargar la página
  useEffect(() => {
    const cargarSaldoReal = async () => {
      try {
        const usr = JSON.parse(localStorage.getItem('exportadorActivo') || localStorage.getItem('usuarioActivo') || 'null');
        if (usr?.id) {
          const res = await logisticaApi.get(`/usuarios/${usr.id}/saldo`);
          setSaldoTokens(Number(res.data.saldo));
        } else {
          const response = await logisticaApi.get('/billetera/saldo');
          setSaldoTokens(response.data.saldoDisponible);
        }
      } catch (error) {
        console.error("Error al obtener saldo:", error);
      }
    };
    cargarSaldoReal();
  }, []);

  const handleRecargar = async (e) => {
    e.preventDefault();
    const montoNumerico = parseFloat(montoRecarga);
    if (!montoNumerico || montoNumerico <= 0) return;

    try {
      const usr = JSON.parse(localStorage.getItem('exportadorActivo') || localStorage.getItem('usuarioActivo') || 'null');
      let nuevoSaldoCalculado = 0;

      if (usr?.id) {
        const resUsr = await logisticaApi.put(`/usuarios/${usr.id}/saldo`, {
          recargar: montoNumerico
        });
        localStorage.setItem('exportadorActivo', JSON.stringify(resUsr.data));
        actualizarPerfilSesion(resUsr.data);
        nuevoSaldoCalculado = Number(resUsr.data.saldoInicial);
      } else {
        const response = await logisticaApi.post('/billetera/recargar', {
          monto: montoNumerico
        });
        nuevoSaldoCalculado = response.data.saldoDisponible;
      }

      setSaldoTokens(nuevoSaldoCalculado);

      // 3. Agregamos el registro visual en las transacciones
      const nuevaTx = {
        id: `TX-${Math.floor(1000 + Math.random() * 9000)}-A`,
        fecha: 'Hoy, Actualizado',
        concepto: 'Recarga de Billetera (Tarjeta / API Bancaria)',
        estado: 'Completado',
        monto: `+${montoNumerico.toLocaleString('en-US')}`,
        tipo: 'ingreso'
      };

      setTransacciones([nuevaTx, ...transacciones]);
      setIsModalOpen(false);
      setMontoRecarga('');

      // Disparamos evento global para actualizar barras de navegación o headers si existen
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('saldoActualizado'));

      alert(`¡Recarga exitosa de ${montoNumerico.toLocaleString('en-US')} Tokens!`);

    } catch (error) {
      console.error("Error al recargar en el servidor:", error);
      alert("No se pudo conectar con el servidor para procesar la recarga.");
    }
  };

  return (
    <div className="animate-in fade-in duration-500 h-full flex flex-col relative">
      
      {/* CABECERA Y BOTÓN DE RECARGA */}
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight transition-colors">Billetera Virtual</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 transition-colors">
            Gestiona tus fondos (Tokens) para participar en subastas y pagar adjudicaciones.
          </p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-md"
        >
          <Plus size={18} /> Recargar Fondos
        </button>
      </div>

      {/* TARJETAS DE RESUMEN FINANCIERO */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Tarjeta 1: Saldo Disponible */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm transition-colors relative overflow-hidden">
          <div className="absolute -right-6 -top-6 text-emerald-50 dark:text-emerald-900/20">
            <Wallet size={120} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                <Wallet size={24} />
              </div>
              <h3 className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-wider">Saldo Disponible</h3>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-slate-900 dark:text-white transition-colors">
                {saldo.toLocaleString()}
              </span>
              <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Tokens</span>
            </div>
            <p className="mt-3 text-sm text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
              <CreditCard size={14} /> Listo para operar
            </p>
          </div>
        </div>

        {/* Tarjeta 2: Fondos Bloqueados */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm transition-colors relative overflow-hidden">
          <div className="absolute -right-6 -top-6 text-amber-50 dark:text-amber-900/10">
            <Lock size={120} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg">
                <Lock size={24} />
              </div>
              <h3 className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-wider">Bloqueados en Pujas</h3>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-slate-900 dark:text-white transition-colors">2,500</span>
              <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Tokens</span>
            </div>
            <p className="mt-3 text-sm text-amber-600 dark:text-amber-400 font-medium">
              Retenidos hasta finalizar subastas
            </p>
          </div>
        </div>

      </div>

      {/* HISTORIAL DE TRANSACCIONES */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex-1 flex flex-col transition-colors">
        
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50 dark:bg-slate-800/50">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <History size={18} className="text-blue-500"/> Historial de Transacciones
          </h2>
          
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 w-full sm:w-64 transition-colors">
            <Search size={16} className="text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar transacción..." 
              className="bg-transparent border-none outline-none text-sm w-full text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider transition-colors">
              <tr>
                <th className="p-4 font-semibold">Ref / ID</th>
                <th className="p-4 font-semibold">Fecha</th>
                <th className="p-4 font-semibold">Concepto</th>
                <th className="p-4 font-semibold">Estado</th>
                <th className="p-4 font-semibold text-right">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-sm transition-colors">
              {transacciones.map((tx, index) => (
                <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="p-4 font-mono font-medium text-slate-500 dark:text-slate-400">{tx.id}</td>
                  <td className="p-4 text-slate-700 dark:text-slate-300">{tx.fecha}</td>
                  <td className="p-4 text-slate-800 dark:text-slate-200 font-medium">{tx.concepto}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold ${
                      tx.estado === 'Completado' 
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' 
                        : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
                    }`}>
                      {tx.estado}
                    </span>
                  </td>
                  <td className={`p-4 text-right font-bold flex items-center justify-end gap-1 ${
                    tx.tipo === 'ingreso' ? 'text-emerald-600 dark:text-emerald-400' : tx.tipo === 'bloqueado' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300'
                  }`}>
                    {tx.tipo === 'ingreso' && <ArrowDownRight size={16} />}
                    {tx.tipo === 'egreso' && <ArrowUpRight size={16} className="text-slate-400" />}
                    {tx.tipo === 'bloqueado' && <Lock size={14} />}
                    {tx.monto}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================== */}
      {/* MODAL PARA RECARGAR FONDOS                 */}
      {/* ========================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-slate-900 dark:bg-slate-950 px-6 py-4 flex justify-between items-center text-white">
              <h2 className="text-lg font-bold flex items-center gap-2"><CreditCard size={20}/> Recargar Tokens</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleRecargar} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Método de Pago</label>
                  <select className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-md focus:ring-2 focus:ring-emerald-500 outline-none transition-colors">
                    <option value="TARJETA">Tarjeta de Crédito / Débito (Visa/Mastercard)</option>
                    <option value="TRANSFERENCIA">Transferencia Bancaria (BancaSAT)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cantidad de Tokens a Recargar</label>
                  <input 
                    type="number" 
                    placeholder="Ej: 5000" 
                    min="100" 
                    required 
                    value={montoRecarga}
                    onChange={(e) => setMontoRecarga(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-md focus:ring-2 focus:ring-emerald-500 outline-none transition-colors font-bold text-lg" 
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">1 Token = 1.00 USD (Conversión automática).</p>
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 font-medium rounded-md transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-md shadow-sm transition-colors"
                >
                  Confirmar Recarga
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}