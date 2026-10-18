import React, { useState, useEffect } from 'react';
import { Gavel, Ship, Clock, TrendingUp, Wallet, CheckCircle2, RefreshCw } from 'lucide-react';
import { logisticaApi } from '../services/api';

export default function SubastaEnVivo() {
  const [licitaciones, setLicitaciones] = useState([]);
  const [saldoDisponible, setSaldoDisponible] = useState(0);
  const [montosPuja, setMontosPuja] = useState({});
  const [mensajeExito, setMensajeExito] = useState(null);

  const cargarDatos = async () => {
    try {
      const [resLic, resSaldo] = await Promise.all([
        logisticaApi.get('/licitaciones'),
        logisticaApi.get('/billetera/saldo')
      ]);
      // Filtramos las subastas activas
      const activas = resLic.data.filter(l => l.estado !== 'ADJUDICADA');
      setLicitaciones(activas);
      setSaldoDisponible(resSaldo.data.saldoDisponible);
    } catch (err) {
      console.error("Error cargando subastas en vivo:", err);
    }
  };

  useEffect(() => {
    cargarDatos();
    const intervalo = setInterval(cargarDatos, 3000);
    return () => clearInterval(intervalo);
  }, []);

  const handlePujar = async (licitacion) => {
    const montoActual = Number(licitacion.pujaActual || licitacion.precioBase || 1000);
    const montoIngresado = Number(montosPuja[licitacion.id] || (montoActual + 100));

    if (montoIngresado <= montoActual) {
      alert(`Tu puja debe ser mayor a la oferta actual de $${montoActual.toLocaleString('en-US')}`);
      return;
    }

    if (montoIngresado > saldoDisponible) {
      alert("Fondos insuficientes en tu Billetera Virtual para cubrir esta puja.");
      return;
    }

    try {
      // 1. Guardamos la puja en PostgreSQL
      const resPuja = await logisticaApi.post(`/licitaciones/${licitacion.id}/pujar`, {
        monto: montoIngresado,
        exportadorId: 'EXP-001'
      });

      // 2. Descontamos el saldo en la billetera real
      const resBilletera = await logisticaApi.post('/billetera/descontar', {
        monto: montoIngresado
      });

      setSaldoDisponible(resBilletera.data.saldoDisponible);
      
      // 3. Recargamos desde PostgreSQL para confirmar que quedó escrito en BD
      await cargarDatos();
      window.dispatchEvent(new Event('saldoActualizado'));
      window.dispatchEvent(new Event('datosActualizados'));

      setMensajeExito({
        buque: licitacion.buque,
        monto: montoIngresado,
        teus: licitacion.espaciosTeu
      });
    } catch (err) {
      alert(err.response?.data || "Error al procesar la puja.");
    }
  };

  return (
    <div className="space-y-6 text-slate-900 dark:text-white">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black flex items-center gap-2.5">
            <Gavel className="text-amber-500" size={28} />
            Sala de Subastas de Espacios (TEUs) en Vivo
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Puja en tiempo real por lotes de capacidad publicados directamente por las navieras.
          </p>
        </div>

        <button
          onClick={cargarDatos}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer self-start"
        >
          <RefreshCw size={14} /> Actualizar Sala
        </button>
      </div>

      {licitaciones.length === 0 ? (
        <div className="bg-white dark:bg-slate-800/90 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
          <Gavel size={40} className="mx-auto text-slate-500 mb-3 opacity-50" />
          <h3 className="text-lg font-bold mb-1">No hay subastas activas en este momento</h3>
          <p className="text-xs text-slate-400">
            Cuando una Naviera publique un lote de TEUs disponible, aparecerá aquí inmediatamente.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {licitaciones.map((lic) => {
            const actual = Number(lic.pujaActual || lic.precioBase || 1000);
            const sugerido = actual + 100;

            return (
              <div
                key={lic.id}
                className="bg-white dark:bg-slate-800/90 rounded-xl border border-slate-200 dark:border-slate-700/80 p-5 shadow-sm flex flex-col justify-between relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500"></div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono font-bold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20">
                      LOTE #{lic.id} • {lic.espaciosTeu} TEUs
                    </span>
                    <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
                      EN VIVO
                    </span>
                  </div>

                  <h3 className="text-lg font-black flex items-center gap-2 mb-1">
                    <Ship size={18} className="text-blue-400" />
                    {lic.buque}
                  </h3>
                  <p className="text-xs text-slate-400 mb-4">{lic.ruta}</p>

                  <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-lg border border-slate-200 dark:border-slate-700/60 mb-4 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Oferta Actual</span>
                      <span className="text-2xl font-black text-emerald-500">
                        ${actual.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    {lic.mejorPostor && (
                      <span className="text-[11px] font-mono bg-blue-500/10 text-blue-400 px-2 py-1 rounded border border-blue-500/20">
                        Líder: {lic.mejorPostor}
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                  <div>
                    <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                      Tu Oferta (Mín. ${sugerido.toLocaleString('en-US')})
                    </label>
                    <input
                      type="number"
                      min={sugerido}
                      step="50"
                      placeholder={sugerido.toString()}
                      value={montosPuja[lic.id] || ''}
                      onChange={(e) => setMontosPuja({ ...montosPuja, [lic.id]: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-900 text-sm font-mono font-bold"
                    />
                  </div>

                  <button
                    onClick={() => handlePujar(lic)}
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider rounded-lg transition-colors cursor-pointer shadow-sm"
                  >
                    Confirmar Puja
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {mensajeExito && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6 text-center border border-slate-200 dark:border-slate-700">
            <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={36} />
            </div>
            <h3 className="text-xl font-bold mb-1">¡Puja Registrada!</h3>
            <p className="text-sm text-slate-400 mb-3">
              Ahora lideras el lote de <strong>{mensajeExito.teus} TEUs</strong> en <strong>{mensajeExito.buque}</strong>
            </p>
            <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700 mb-5">
              <span className="text-[10px] uppercase text-slate-400 block">Monto Ofertado</span>
              <span className="text-xl font-black text-emerald-400">
                ${Number(mensajeExito.monto).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <button
              onClick={() => setMensajeExito(null)}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm cursor-pointer"
            >
              Continuar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
