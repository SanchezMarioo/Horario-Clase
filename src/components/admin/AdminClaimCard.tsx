'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft, KeyRound, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { claimAdminWithCodeAction } from '@/app/actions/admins';

interface AdminClaimCardProps {
  userEmail?: string;
  userId: string;
}

export default function AdminClaimCard({ userEmail, userId }: AdminClaimCardProps) {
  const [code, setCode] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleClaim = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      toast.error('Introduce el código de invitación');
      return;
    }

    startTransition(async () => {
      const res = await claimAdminWithCodeAction(code);
      if (!res.success) {
        toast.error('Código incorrecto', {
          description: res.error || 'Verifica el código e inténtalo de nuevo.',
        });
        return;
      }

      toast.success('¡Activación completada!', {
        description: 'Ahora tienes permisos de administrador. Redirigiendo...',
      });

      setTimeout(() => {
        window.location.reload();
      }, 800);
    });
  };

  return (
    <div className="w-full max-w-lg mx-auto my-12 bg-slate-900/90 border border-white/10 rounded-3xl p-7 sm:p-8 backdrop-blur-2xl shadow-2xl flex flex-col items-center gap-5">
      <div className="p-4 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
        <ShieldCheck size={40} />
      </div>

      <div className="text-center">
        <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-[11px] font-bold uppercase tracking-wider mb-2">
          <Sparkles size={12} /> Acceso Restringido
        </span>
        <h1 className="text-xl font-extrabold text-white">Panel de Administración DM2A</h1>
        <p className="text-xs text-slate-400 mt-1 max-w-sm leading-relaxed">
          Tu cuenta (<strong className="text-slate-200">{userEmail || userId}</strong>) está autenticada, pero aún no tiene rol de administrador activo.
        </p>
      </div>

      {/* Formulario de activación por código */}
      <form
        onSubmit={handleClaim}
        className="w-full bg-slate-950/70 p-5 rounded-2xl border border-white/[0.08] flex flex-col gap-3.5"
      >
        <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
          <KeyRound size={16} className="text-amber-400" />
          <span>Activarme con Código de Invitación</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Si el delegado o profesor te proporcionó un código de acceso rápido, ingrésalo aquí para darte de alta al instante:
        </p>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            required
            placeholder="Ej. DM2A-ADMIN-2026"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-xs font-mono text-white placeholder-slate-500 tracking-wider uppercase focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={isPending}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer whitespace-nowrap"
          >
            {isPending ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Activando...
              </>
            ) : (
              'Activar Rol Admin'
            )}
          </button>
        </div>
      </form>

      {/* Alternativa: alta directa por un admin */}
      <div className="text-[11px] text-slate-400 bg-white/[0.02] p-3.5 rounded-xl border border-white/5 w-full text-left leading-relaxed">
        💡 <strong>¿No tienes código?</strong> Pide a cualquier administrador activo del curso que te dé de alta directamente introduciendo tu correo (<code className="text-indigo-300 font-semibold">{userEmail}</code>) en la pestaña <em>Administradores</em> de su panel.
      </div>

      <Link
        href="/"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-all"
      >
        <ArrowLeft size={15} /> Volver al Horario
      </Link>
    </div>
  );
}
