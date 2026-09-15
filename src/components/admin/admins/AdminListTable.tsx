'use client';

import React from 'react';
import { Users } from 'lucide-react';
import { AdminItem } from '@/app/actions/admins';

interface AdminListTableProps {
  admins: AdminItem[];
  currentUserEmail?: string;
  onRemoveAdmin: (admin: AdminItem) => void;
  isPending: boolean;
}

export default function AdminListTable({
  admins,
  currentUserEmail,
  onRemoveAdmin,
  isPending,
}: AdminListTableProps) {
  return (
    <div className="bg-slate-900/60 border border-white/[0.08] p-5 sm:p-6 rounded-3xl backdrop-blur-xl flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
            <Users size={20} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Administradores Activos</h2>
            <p className="text-[11px] text-slate-400">
              Usuarios con permisos para publicar exámenes y gestionar el sistema.
            </p>
          </div>
        </div>

        <span className="text-xs font-bold text-indigo-300 bg-indigo-500/10 px-3 py-1 rounded-xl border border-indigo-500/20">
          {admins.length} {admins.length === 1 ? 'Admin' : 'Admins'}
        </span>
      </div>

      <div className="w-full overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-white/[0.08]">
              <th className="pb-3 pl-2">Administrador</th>
              <th className="pb-3">Alta Por</th>
              <th className="pb-3">Fecha</th>
              <th className="pb-3 text-right pr-2">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {admins.map((adm) => {
              const isCurrentUser =
                adm.email.toLowerCase() === currentUserEmail?.toLowerCase();

              return (
                <tr key={adm.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 pl-2">
                    <div className="flex flex-col">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        {adm.email}
                        {isCurrentUser && (
                          <span className="text-[9px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 rounded">
                            Tú
                          </span>
                        )}
                        {(adm.isSuper || adm.isEnvSuperadmin) && (
                          <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded font-bold">
                            Superadmin
                          </span>
                        )}
                      </span>
                      {adm.name && (
                        <span className="text-[11px] text-slate-400">{adm.name}</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 text-slate-400 text-[11px]">
                    {adm.addedBy || 'Directo'}
                  </td>
                  <td className="py-3 text-slate-400 text-[11px] whitespace-nowrap">
                    {adm.createdAt ? adm.createdAt.split('T')[0] : '—'}
                  </td>
                  <td className="py-3 text-right pr-2">
                    {!adm.isEnvSuperadmin && !isCurrentUser ? (
                      <button
                        type="button"
                        onClick={() => onRemoveAdmin(adm)}
                        disabled={isPending}
                        title="Revocar permisos"
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                      >
                        Revocar
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-600 italic">
                        {isCurrentUser ? 'Protegido' : 'Solo en .env'}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
