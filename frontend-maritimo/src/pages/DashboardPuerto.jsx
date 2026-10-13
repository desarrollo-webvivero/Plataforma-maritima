// src/pages/DashboardPuerto.jsx
export default function DashboardPuerto() {
  return (
    <div className="p-8 bg-gray-50 min-h-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Panel de Control Portuario</h1>
        <p className="mt-2 text-slate-600">Resumen operativo general de contenedores en patio y estados de despacho.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm mb-6 overflow-hidden">
        <div className="bg-slate-800 px-6 py-3">
          <h3 className="text-white font-bold tracking-wide flex items-center gap-2">🟢 EN PROCESO DE SALIDA (GATE-OUT)</h3>
        </div>
        <div className="flex divide-x divide-slate-200">
          <div className="flex-1 p-4 flex flex-col items-center justify-center bg-slate-50">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total en Salida</span>
            <div className="text-4xl font-black text-slate-800 mt-1">📦 125</div>
          </div>
          <div className="flex-1 p-4 flex flex-col items-center justify-center">
             <span className="text-xs text-slate-500 font-bold uppercase mb-1">0 a 5 Días</span>
             <span className="text-2xl font-bold text-slate-800">2</span>
          </div>
          <div className="flex-1 p-4 flex flex-col items-center justify-center">
             <span className="text-xs text-slate-500 font-bold uppercase mb-1">Más 16 Días</span>
             <span className="text-2xl font-bold text-slate-800">76</span>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm mb-6 overflow-hidden border-l-4 border-l-red-500">
        <div className="bg-slate-100 px-6 py-3 border-b border-slate-200">
          <h3 className="text-slate-800 font-bold tracking-wide flex items-center gap-2">🔴 RETENIDOS POR ADUANA</h3>
        </div>
        <div className="flex divide-x divide-slate-200">
          <div className="flex-1 p-4 flex flex-col items-center justify-center bg-red-50">
            <span className="text-xs text-red-600 font-bold uppercase tracking-wider">Total Retenidos</span>
            <div className="text-4xl font-black text-red-600 mt-1">⛔ 38</div>
          </div>
          <div className="flex-1 p-4 flex flex-col items-center justify-center">
             <span className="text-xs text-slate-500 font-bold uppercase mb-1">Más 16 Días</span>
             <span className="text-2xl font-bold text-red-600">38</span>
          </div>
        </div>
      </div>
    </div>
  );
}