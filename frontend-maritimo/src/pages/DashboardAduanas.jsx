// src/pages/DashboardAduanas.jsx
export default function DashboardAduanas() {
  return (
    <div className="p-8 bg-gray-50 min-h-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Control Aduanero y Semáforo</h1>
        <p className="mt-2 text-slate-600">Gestión de inspecciones y retenciones de carga (Módulo de Seguridad).</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-green-50 p-6 rounded-xl shadow-sm border border-green-200 border-t-4 border-t-green-500 text-center">
          <div className="text-5xl mb-2">🟢</div>
          <h3 className="text-green-800 font-bold uppercase tracking-wider mb-2">Levante Libre</h3>
          <div className="text-3xl font-black text-green-700">452</div>
        </div>
        <div className="bg-yellow-50 p-6 rounded-xl shadow-sm border border-yellow-200 border-t-4 border-t-yellow-500 text-center">
          <div className="text-5xl mb-2">🟡</div>
          <h3 className="text-yellow-800 font-bold uppercase tracking-wider mb-2">Revisión Documental</h3>
          <div className="text-3xl font-black text-yellow-700">14</div>
        </div>
        <div className="bg-red-50 p-6 rounded-xl shadow-sm border border-red-200 border-t-4 border-t-red-500 text-center">
          <div className="text-5xl mb-2">🔴</div>
          <h3 className="text-red-800 font-bold uppercase tracking-wider mb-2">Inspección Física (Retenidos)</h3>
          <div className="text-3xl font-black text-red-700">38</div>
        </div>
      </div>
    </div>
  );
}