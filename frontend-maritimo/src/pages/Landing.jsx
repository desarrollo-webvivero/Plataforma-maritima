import { Link } from 'react-router-dom';
import { Anchor, Ship, Package, Droplets, Radio, ThermometerSun, Wind, ArrowRight } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      
      {/* ========================================== */}
      {/* NAVBAR SUPERIOR                            */}
      {/* ========================================== */}
      <nav className="flex items-center justify-between px-6 lg:px-12 py-4 bg-white/95 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="text-xl font-black text-slate-900 flex items-center gap-2 tracking-wide">
          {/* Logo ahora en color Índigo */}
          <Anchor className="text-indigo-600" size={24} />
          PORT LOGISTICS
        </div>
        <div>
          <Link 
            to="/login" 
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors shadow-sm flex items-center gap-2"
          >
            Iniciar Sesión <ArrowRight size={16} />
          </Link>
        </div>
      </nav>

      {/* ========================================== */}
      {/* HERO SECTION (Sección Principal)           */}
      {/* ========================================== */}
      <header className="relative bg-slate-900 text-white py-24 lg:py-32 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1494412519320-aa613dfb7738?auto=format&fit=crop&q=80')] bg-cover bg-center mix-blend-overlay opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 to-slate-900"></div>
        
        <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center">
          {/* Etiqueta superior elegante */}
          <span className="px-3 py-1 text-xs font-bold tracking-wider uppercase bg-indigo-500/20 text-indigo-300 rounded-full mb-6 border border-indigo-500/30 backdrop-blur-sm">
            Plataforma de Clase Mundial
          </span>
          
          <h1 className="text-4xl lg:text-6xl font-extrabold mb-6 leading-tight tracking-tight">
            Gestión Logística y Aduanera <span className="text-indigo-400">Inteligente</span>
          </h1>
          
          <p className="text-lg lg:text-xl text-slate-300 mb-10 max-w-2xl leading-relaxed">
            Optimiza tus operaciones marítimas, gestiona billeteras virtuales, participa en subastas de TEUs en tiempo real y agiliza tus trámites de Gate-out.
          </p>
          
          <Link 
            to="/login" 
            className="px-8 py-4 bg-white text-slate-900 font-bold text-lg rounded-lg hover:bg-slate-100 shadow-xl transition-all hover:scale-105 flex items-center gap-2"
          >
            Acceder al Portal <ArrowRight size={20} />
          </Link>
        </div>
      </header>

      {/* ========================================== */}
      {/* TABLERO DE ARRIBOS                         */}
      {/* ========================================== */}
      <section className="py-12 px-6 lg:px-12 max-w-[1400px] mx-auto w-full -mt-12 relative z-20">
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          
          <div className="bg-slate-50 px-6 py-5 border-b border-slate-200 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Radio size={22} className="text-indigo-600" /> Estado de Buques y Arribos
            </h2>
            
            <div className="flex gap-4 text-sm font-medium text-slate-600 bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200">
              <span className="flex items-center gap-1.5">
                <ThermometerSun size={16} className="text-amber-500" /> 28°C Puerto Quetzal
              </span>
              <span className="text-slate-300">|</span>
              <span className="flex items-center gap-1.5">
                <Wind size={16} className="text-sky-500" /> 12 nudos
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-white text-slate-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="p-4 border-b border-slate-200 font-semibold">Nave / Buque</th>
                  <th className="p-4 border-b border-slate-200 font-semibold">Naviera</th>
                  <th className="p-4 border-b border-slate-200 font-semibold">Tipo de Carga</th>
                  <th className="p-4 border-b border-slate-200 font-semibold">Ubicación / Muelle</th>
                  <th className="p-4 border-b border-slate-200 font-semibold text-right">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                
                {/* Buque 1 */}
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-bold text-slate-900 flex items-center gap-3">
                    <Ship size={18} className="text-slate-400" /> MSC GÜLSÜN
                  </td>
                  <td className="p-4 text-slate-600">Mediterranean Shg</td>
                  <td className="p-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-medium border border-slate-200">
                      <Package size={12}/> Contenedores
                    </span>
                  </td>
                  <td className="p-4 text-slate-600">Comercial Sur</td>
                  <td className="p-4 text-right">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-teal-50 text-teal-700 border border-teal-200 rounded-md text-xs font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span> Atracado
                    </span>
                  </td>
                </tr>

                {/* Buque 2 (Actualizado a Cyan) */}
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-bold text-slate-900 flex items-center gap-3">
                    <Ship size={18} className="text-slate-400" /> EVER GIVEN
                  </td>
                  <td className="p-4 text-slate-600">Evergreen Marine</td>
                  <td className="p-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-medium border border-slate-200">
                      <Package size={12}/> Contenedores
                    </span>
                  </td>
                  <td className="p-4 text-slate-600 italic">Asignando...</td>
                  <td className="p-4 text-right">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-cyan-50 text-cyan-700 border border-cyan-200 rounded-md text-xs font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-600 animate-pulse"></span> En Aproximación
                    </span>
                  </td>
                </tr>

                {/* Buque 3 */}
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-bold text-slate-900 flex items-center gap-3">
                    <Ship size={18} className="text-slate-400" /> CHEM PATRIOT
                  </td>
                  <td className="p-4 text-slate-600">Chemship B.V.</td>
                  <td className="p-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-md text-xs font-medium border border-amber-200">
                      <Droplets size={12}/> Peligrosa / Líquida
                    </span>
                  </td>
                  <td className="p-4 text-slate-600">Terminal Gas</td>
                  <td className="p-4 text-right">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-md text-xs font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span> Fondeado
                    </span>
                  </td>
                </tr>

              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ========================================== */}
      {/* FOOTER                                     */}
      {/* ========================================== */}
      <footer className="bg-slate-900 text-slate-400 py-8 text-center text-sm mt-auto border-t border-slate-800">
        <div className="flex justify-center gap-2 mb-4">
           <Anchor className="text-slate-600" size={24} />
        </div>
        <p>© 2026 Port Logistics - Universidad Mariano Gálvez.</p>
        <p className="mt-1 text-slate-500">Plataforma desarrollada para la clase de Análisis de Sistemas II.</p>
      </footer>
    </div>
  );
}