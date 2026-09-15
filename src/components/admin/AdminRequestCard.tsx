'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  ArrowLeft,
  Send,
  Loader2,
  Clock,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  requestAdminAccessAction,
  getMyAdminRequestStatusAction,
  AdminRequestItem,
} from '@/app/actions/admins';

interface AdminRequestCardProps {
  userEmail?: string;
  userId: string;
}

export default function AdminRequestCard({ userEmail, userId }: AdminRequestCardProps) {
  const [reason, setReason] = useState('');
  const [requestStatus, setRequestStatus] = useState<AdminRequestItem | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [isPending, startTransition] = useTransition();

  const loadStatus = async () => {
    setLoadingStatus(true);
    const res = await getMyAdminRequestStatusAction();
    if (res.success && res.data) {
      setRequestStatus(res.data);
    } else {
      setRequestStatus(null);
    }
    setLoadingStatus(false);
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleSendRequest = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      const res = await requestAdminAccessAction(reason);
      if (!res.success) {
        toast.error('Error al enviar la solicitud', {
          description: res.error || 'No se pudo registrar la solicitud.',
        });
        return;
      }

      toast.success('¡Solicitud enviada!', {
        description: 'Un superadministrador revisará tu solicitud.',
      });

      if (res.data) {
        setRequestStatus(res.data);
      }
    });
  };

  return (
    <div className="w-full max-w-lg mx-auto my-12 bg-slate-900/95 border border-white/10 rounded-3xl p-7 sm:p-9 backdrop-blur-2xl shadow-2xl flex flex-col items-center gap-6 animate-in fade-in zoom-in-95 duration-200">
      {/* Icono Principal */}
      <div className="p-4 rounded-2xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
        <ShieldAlert size={40} />
      </div>

      {/* Cabecera */}
      <div className="text-center">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-2.5">
          <Sparkles size={13} className="text-indigo-400" /> Solicitud de Acceso
        </span>
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          Panel de Administración DM2A
        </h1>
        <p className="text-xs text-slate-400 mt-2 max-w-sm leading-relaxed">
          Tu cuenta (<strong className="text-slate-200">{userEmail || userId}</strong>) está autenticada, pero requiere aprobación previa de un <strong className="text-indigo-300 font-semibold">Superadministrador</strong>.
        </p>
      </div>

      {/* Contenido según estado de la solicitud */}
      {loadingStatus ? (
        <div className="p-8 text-slate-400 text-xs flex items-center justify-center gap-2">
          <Loader2 size={16} className="animate-spin text-indigo-400" />
          Comprobando estado de tu cuenta...
        </div>
      ) : requestStatus && requestStatus.status === 'pending' ? (
        /* Solicitud pendiente de aprobación */
        <div className="w-full bg-amber-500/10 border border-amber-500/30 p-5 rounded-2xl flex flex-col items-center text-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-300">
            <Clock size={24} className="animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-amber-200">Solicitud Pendiente de Revisión</h3>
            <p className="text-xs text-amber-300/80 mt-1 leading-relaxed">
              Has enviado tu solicitud el{' '}
              <strong className="text-amber-200">
                {new Date(requestStatus.createdAt).toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </strong>
              .
            </p>
            {requestStatus.reason && (
              <p className="text-[11px] text-slate-300 italic bg-black/20 px-3 py-1.5 rounded-xl mt-2 border border-white/5">
                &ldquo;{requestStatus.reason}&rdquo;
              </p>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            En cuanto un superadministrador apruebe tu solicitud en su panel, tendrás acceso automático e inmediato.
          </p>
          <button
            type="button"
            onClick={loadStatus}
            className="mt-2 text-xs font-bold text-amber-300 hover:text-white bg-amber-500/20 hover:bg-amber-500/30 px-4 py-1.5 rounded-xl transition-all cursor-pointer"
          >
            Actualizar Estado
          </button>
        </div>
      ) : (
        /* Formulario para enviar solicitud */
        <form
          onSubmit={handleSendRequest}
          className="w-full bg-slate-950/70 p-5 rounded-2xl border border-white/[0.08] flex flex-col gap-3.5"
        >
          {requestStatus && requestStatus.status === 'rejected' && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300 flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>Tu solicitud anterior fue rechazada. Puedes volver a enviarla indicando tu rol o motivo.</span>
            </div>
          )}

          <div className="flex flex-col gap-1.5 text-left">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Motivo o Rol en el Curso (opcional)
            </label>
            <textarea
              rows={3}
              placeholder="Ej. Soy delegado de clase DM2A, quiero colaborar en las fechas del calendario o registro de tareas..."
              value={reason}
              maxLength={250}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isPending ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Enviando solicitud...
              </>
            ) : (
              <>
                <Send size={15} />
                Enviar Solicitud al Superadministrador
              </>
            )}
          </button>
        </form>
      )}

      {/* Volver */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-all"
      >
        <ArrowLeft size={15} /> Volver al Horario
      </Link>
    </div>
  );
}
