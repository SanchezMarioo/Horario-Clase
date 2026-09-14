import { SignUp } from '@clerk/nextjs';
import Link from 'next/link';

export default function SignUpPage() {
  return (
    <div className="w-full max-w-md flex flex-col items-center justify-center min-h-[75vh] py-8">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors bg-white/[0.04] border border-white/[0.08] px-3.5 py-1.5 rounded-full backdrop-blur-sm"
      >
        <span>←</span> Volver al horario
      </Link>

      <div className="w-full flex justify-center">
        <SignUp
          appearance={{
            elements: {
              card: 'bg-slate-900/90 border border-white/[0.1] backdrop-blur-2xl shadow-2xl',
              headerTitle: 'text-white',
              headerSubtitle: 'text-slate-400',
              socialButtonsBlockButton: 'bg-white/5 border-white/10 text-white hover:bg-white/10',
              formFieldLabel: 'text-slate-300',
              formFieldInput: 'bg-slate-950/80 border-white/10 text-white placeholder-slate-500',
              formButtonPrimary: 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30',
              footerActionLink: 'text-indigo-400 hover:text-indigo-300',
            },
          }}
        />
      </div>
    </div>
  );
}
