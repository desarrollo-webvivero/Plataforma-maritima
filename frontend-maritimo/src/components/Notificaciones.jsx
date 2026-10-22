import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { suscribirAvisos } from '../services/notificaciones';

const ESTILOS = {
  error: 'bg-red-950/95 border-red-500/40 text-red-100',
  exito: 'bg-emerald-950/95 border-emerald-500/40 text-emerald-100',
  info: 'bg-slate-900/95 border-blue-500/40 text-blue-100'
};

const ICONOS = { error: AlertCircle, exito: CheckCircle2, info: Info };

export default function Notificaciones() {
  const [avisos, setAvisos] = useState([]);

  useEffect(() => {
    const cerrar = (id) => setAvisos((prev) => prev.filter((a) => a.id !== id));

    return suscribirAvisos((aviso) => {
      // Evita apilar el mismo mensaje varias veces (por ejemplo, durante un sondeo)
      setAvisos((prev) =>
        prev.some((a) => a.mensaje === aviso.mensaje) ? prev : [...prev.slice(-2), aviso]
      );
      setTimeout(() => cerrar(aviso.id), 5000);
    });
  }, []);

  if (avisos.length === 0) return null;

  return (
    <div
      className="fixed top-4 right-4 z-[200] flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm"
      aria-live="polite"
    >
      {avisos.map((a) => {
        const Icono = ICONOS[a.tipo] || AlertCircle;
        return (
          <div
            key={a.id}
            role="alert"
            className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur text-sm font-semibold ${ESTILOS[a.tipo] || ESTILOS.error}`}
          >
            <Icono size={18} className="shrink-0 mt-0.5" />
            <span className="flex-1">{a.mensaje}</span>
            <button
              type="button"
              aria-label="Cerrar aviso"
              onClick={() => setAvisos((prev) => prev.filter((x) => x.id !== a.id))}
              className="opacity-70 hover:opacity-100 cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
