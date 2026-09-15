'use client';

import React from 'react';
import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

interface AdminHeaderProps {
  userEmail?: string;
  isSuperAdmin?: boolean;
}

export default function AdminHeader({ userEmail, isSuperAdmin = false }: AdminHeaderProps) {
  return (
    <header className="flex flex-wrap justify-between items-center bg-slate-900/70 border border-white/[0.08] p-4 rounded-2xl backdrop-blur-xl gap-4">
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white bg-white/[0.05] border border-white/[0.1] px-3.5 py-2 rounded-xl transition-all hover:bg-white/[0.1]"
        >
          <ArrowLeft size={16} />
          Volver al Horario
        </Link>
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <ShieldCheck className="text-indigo-400" size={20} />
            Panel de Administración DM2A
          </h1>
          <p className="text-xs text-slate-400">
            Control de faltas de asistencia y gestión del calendario
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.06] px-3.5 py-1.5 rounded-xl">
        <div className="text-right">
          <span className="text-[11px] block text-slate-400">
            {isSuperAdmin ? (
              <span className="text-amber-400 font-bold flex items-center gap-1 justify-end">
                ⭐ Superadministrador
              </span>
            ) : (
              'Administrador'
            )}
          </span>
          <span className="text-xs font-semibold text-indigo-300">
            {userEmail || 'Administrador'}
          </span>
        </div>
        <UserButton />
      </div>
    </header>
  );
}
