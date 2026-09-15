'use client';

import React from 'react';
import { UserCheck, CheckCircle2, X, Check } from 'lucide-react';
import { AdminRequestItem } from '@/app/actions/admins';

interface AdminPendingRequestsProps {
  requests: AdminRequestItem[];
  onApprove: (id: string, email: string) => Promise<void>;
  onReject: (id: string, email: string) => Promise<void>;
  onRefresh: () => Promise<void>;
}

export default function AdminPendingRequests({
  requests,
  onApprove,
  onReject,
  onRefresh,
}: AdminPendingRequestsProps) {
  return (
    <div className="lg:col-span-3 bg-slate-900/60 border border-white/[0.08] p-5 sm:p-6 rounded-3xl backdrop-blur-xl flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
            <UserCheck size={20} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              Solicitudes de Acceso a Administrador
              {requests.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                  {requests.length} pendientes
                </span>
              )}
            </h2>
            <p className="text-[11px] text-slate-400">
              Alumnos que han solicitado rol de administrador. Los superadministradores pueden aceptarlas o rechazarlas.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          className="text-xs font-semibold text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
        >
          Actualizar Lista
        </button>
      </div>

      {requests.length === 0 ? (
        <div className="py-6 text-center text-slate-500 text-xs bg-white/[0.01] rounded-2xl border border-white/[0.04] flex flex-col items-center gap-1.5">
          <CheckCircle2 size={24} className="text-slate-600" />
          <span>No hay solicitudes de acceso pendientes en este momento.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {requests.map((req) => (
            <div
              key={req.id}
              className="p-4 rounded-2xl bg-slate-950/80 border border-amber-500/30 flex flex-col justify-between gap-3 shadow-sm"
            >
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold text-white">
                    {req.userName || 'Alumno'}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(req.createdAt).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <span className="text-xs font-mono text-indigo-300">{req.userEmail}</span>
                {req.reason && (
                  <p className="text-[11px] text-slate-300 italic bg-white/[0.03] p-2 rounded-xl mt-1 border border-white/5">
                    &ldquo;{req.reason}&rdquo;
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => onReject(req.id, req.userEmail)}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 border border-white/10 hover:border-red-500/30"
                >
                  <X size={13} /> Rechazar
                </button>
                <button
                  type="button"
                  onClick={() => onApprove(req.id, req.userEmail)}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Check size={13} /> Aceptar como Admin
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
