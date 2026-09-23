'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth, UserButton } from '@clerk/nextjs';
import { ShieldCheck, LogIn, ClipboardList } from 'lucide-react';

interface HeaderProps {
  isAdmin?: boolean;
  onOpenMyAbsences?: () => void;
}

export default function Header({ isAdmin = false, onOpenMyAbsences }: HeaderProps) {
  const { isSignedIn, isLoaded } = useAuth();

  return (
    <header className="text-center max-w-4xl mb-6 relative w-full flex flex-col items-center">
      {/* Botones de acceso de usuario en esquina superior */}
      <div className="flex items-center gap-2 mb-4 self-end min-h-[36px]">
        {isLoaded && isSignedIn ? (
          <div className="flex items-center gap-2">
            {isAdmin ? (
              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-600/30 hover:text-white text-xs font-semibold transition-all backdrop-blur-sm shadow-sm"
              >
                <ShieldCheck size={14} />
                Panel Admin
              </Link>
            ) : (
              onOpenMyAbsences && (
                <button
                  type="button"
                  onClick={onOpenMyAbsences}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-600/30 hover:text-white text-xs font-semibold transition-all backdrop-blur-sm shadow-sm cursor-pointer"
                >
                  <ClipboardList size={14} />
                  Mis Faltas
                </button>
              )
            )}
            <UserButton />
          </div>
        ) : (
          <Link
            href="/sign-in"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.08] text-xs font-semibold transition-all backdrop-blur-sm"
          >
            <LogIn size={14} />
            Iniciar Sesión
          </Link>
        )}
      </div>

      <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold tracking-wider uppercase mb-3 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
        <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#22c55e] animate-pulse" />
        Curso Académico · DM2A
      </div>

      <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight bg-gradient-to-br from-white via-slate-200 to-slate-400 bg-clip-text text-transparent mb-2">
        Horario y Límite de Faltas
      </h1>
      <p className="text-slate-400 text-sm sm:text-base">
        Desarrollo de Aplicaciones Multiplataforma &bull; Pérdida de evaluación continua (12% horas totales)
      </p>
    </header>
  );
}
