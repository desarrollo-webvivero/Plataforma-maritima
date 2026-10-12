// src/pages/DashboardNaviera.jsx
export default function DashboardNaviera() {
  return (
    <div className="p-8 bg-gray-50 min-h-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Administración de Flota y Subastas</h1>
        <p className="mt-2 text-slate-600">Gestión de buques, TEUs y licitaciones activas.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 border-t-4 border-t-indigo-500">
          <h3 className="text-slate-500 font-bold text-xs uppercase tracking-wider mb-2">Buques en Operación</h3>
          <div className="text-4xl font-black text-slate-800">⛴️ 5</div>
          <p className="text-sm text-slate-500 mt-2">2 atracados, 3 en ruta.</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 border-t-4 border-t-orange-500">
          <h3 className="text-slate-500 font-bold text-xs uppercase tracking-wider mb-2">Licitaciones Activas</h3>
          <div className="text-4xl font-black text-slate-800">⚖️ 2</div>
          <p className="text-sm text-slate-500 mt-2">Recibiendo pujas en tiempo real.</p>
        </div>
      </div>
    </div>
  );
}