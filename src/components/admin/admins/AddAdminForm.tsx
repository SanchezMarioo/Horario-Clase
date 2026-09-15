'use client';

import React, { useState } from 'react';
import { UserPlus, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

interface AddAdminFormProps {
  onAddAdmin: (email: string, name?: string) => Promise<boolean>;
  isPending: boolean;
}

export default function AddAdminForm({ onAddAdmin, isPending }: AddAdminFormProps) {
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminName, setNewAdminName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.trim()) {
      toast.error('Introduce el correo del nuevo administrador');
      return;
    }

    const success = await onAddAdmin(
      newAdminEmail.trim(),
      newAdminName.trim() ? newAdminName.trim() : undefined
    );

    if (success) {
      setNewAdminEmail('');
      setNewAdminName('');
    }
  };

  return (
    <div className="bg-slate-900/60 border border-white/[0.08] p-5 sm:p-6 rounded-3xl backdrop-blur-xl flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
          <UserPlus size={20} />
        </div>
        <div>
          <h2 className="text-sm font-bold text-white">Dar de alta a un Administrador</h2>
          <p className="text-[11px] text-slate-400">
            Añade un compañero por su correo electrónico.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1">
            Correo Electrónico *
          </label>
          <input
            type="email"
            required
            placeholder="ejemplo@gmail.com"
            value={newAdminEmail}
            onChange={(e) => setNewAdminEmail(e.target.value)}
            className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1">
            Nombre / Rol (opcional)
          </label>
          <input
            type="text"
            placeholder="Ej. Delegado DM2A, Mario..."
            value={newAdminName}
            onChange={(e) => setNewAdminName(e.target.value)}
            className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="mt-1 w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          <UserPlus size={15} />
          {isPending ? 'Guardando...' : 'Dar de Alta como Admin'}
        </button>
      </form>

      {/* Tarjeta Informativa de Solicitudes */}
      <div className="mt-2 p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 flex flex-col gap-2">
        <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
          <ShieldCheck size={13} /> Sistema de Solicitudes
        </span>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Cualquier alumno puede acceder a <code className="text-indigo-300">/admin</code> y solicitar permisos de administrador. Como superadministrador puedes revisar y aprobar sus peticiones en la sección inferior.
        </p>
      </div>
    </div>
  );
}
