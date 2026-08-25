/* Servidor estatico minimo para probar el juego en local.
 * Sin dependencias: solo Node.
 *
 *   node tools/servidor-local.mjs          -> http://localhost:8080
 *   node tools/servidor-local.mjs 3000     -> http://localhost:3000
 *
 * Hace falta solo si quieres cargar archivos de audio propios (con file://
 * el navegador los bloquea). El juego en si abre bien con doble clic en
 * index.html.
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = normalize(join(fileURLToPath(new URL('.', import.meta.url)), '..'));
const PUERTO = Number(process.argv[2]) || 8080;

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8'
};

createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    let ruta = decodeURIComponent(url.pathname);
    if (ruta.endsWith('/')) { ruta += 'index.html'; }
    // Nunca servir fuera de la carpeta del proyecto.
    const destino = normalize(join(RAIZ, ruta));
    if (!destino.startsWith(RAIZ + sep) && destino !== RAIZ) {
      res.writeHead(403).end('403');
      return;
    }
    const datos = await readFile(destino);
    res.writeHead(200, {
      'Content-Type': TIPOS[extname(destino).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff'
    });
    res.end(datos);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('404');
  }
}).listen(PUERTO, () => {
  process.stdout.write(`Tio Rene Invaders en http://localhost:${PUERTO}/\n`);
});
