import { clerkMiddleware } from '@clerk/nextjs/server';

const handler = clerkMiddleware();

export const proxy = handler;
export default handler;

export const config = {
  matcher: [
    // Omitir archivos estáticos y rutas internas de Next.js
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Ejecutar siempre para rutas de API y trpc
    '/(api|trpc)(.*)',
  ],
};
