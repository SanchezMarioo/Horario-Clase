import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { Toaster } from 'sonner';
import './globals.css';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Horario DM2A · Desarrollo de Aplicaciones Multiplataforma',
  description: 'Horario de clases y límite de faltas de asistencia (12% currículo) para DM2A',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="es" className={plusJakartaSans.variable}>
        <body className="font-sans antialiased bg-[#090d16] text-[#f8fafc] min-h-screen flex flex-col items-center px-4 py-8 md:py-12 relative overflow-x-hidden selection:bg-indigo-500/30 selection:text-indigo-200">
          {/* Ambient background glows */}
          <div
            aria-hidden="true"
            className="fixed -top-[120px] left-[10%] w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(99,102,241,0.18)_0%,rgba(0,0,0,0)_70%)] -z-10 pointer-events-none blur-[40px]"
          />
          <div
            aria-hidden="true"
            className="fixed -bottom-[150px] right-[10%] w-[550px] h-[550px] bg-[radial-gradient(circle,rgba(236,72,153,0.15)_0%,rgba(0,0,0,0)_70%)] -z-10 pointer-events-none blur-[50px]"
          />
          {children}

          {/* Toast notifications flotantes */}
          <Toaster
            theme="dark"
            position="top-right"
            richColors
            closeButton
            visibleToasts={2}
            duration={2200}
            gap={8}
            toastOptions={{
              style: {
                background: 'rgba(15, 23, 42, 0.95)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                backdropFilter: 'blur(20px)',
                color: '#f8fafc',
                fontSize: '13px',
              },
            }}
          />
        </body>
      </html>
    </ClerkProvider>
  );
}
