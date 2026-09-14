import React from 'react';

export default function FooterStats() {
  return (
    <footer className="mt-8 flex flex-wrap justify-center gap-3 text-slate-400 text-xs sm:text-sm">
      <div className="bg-white/[0.03] px-3.5 py-1.5 rounded-full border border-white/[0.08] inline-flex items-center gap-1.5 backdrop-blur-sm">
        <span>⚠️</span> Límite faltas: <strong className="text-white font-semibold">12% de las horas totales</strong>
      </div>
      <div className="bg-white/[0.03] px-3.5 py-1.5 rounded-full border border-white/[0.08] inline-flex items-center gap-1.5 backdrop-blur-sm">
        <span>⚡</span> Carga semanal: <strong className="text-white font-semibold">30h</strong>
      </div>
      <div className="bg-white/[0.03] px-3.5 py-1.5 rounded-full border border-white/[0.08] inline-flex items-center gap-1.5 backdrop-blur-sm">
        <span>✨</span> Haz clic en cualquier asignatura o tarjeta para filtrar
      </div>
    </footer>
  );
}
