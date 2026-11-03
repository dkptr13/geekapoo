/// <reference types="vite/client" />

/**
 * Identificador del build, inyectado por `vite.config.ts`.
 *
 * En Vercel es el SHA del commit; en local, `dev`. Se usa para
 * invalidar la URL y la caché del índice de búsqueda estático.
 */
declare const __BUILD_ID__: string;
