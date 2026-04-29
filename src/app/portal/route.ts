import { readFile } from 'node:fs/promises';
import path from 'node:path';

export const runtime = 'nodejs';

export async function GET() {
  const filePath = path.join(process.cwd(), 'index.html');
  const html = await readFile(filePath, 'utf8');

  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      // Evita caché agresiva mientras estás desarrollando
      'cache-control': 'no-store'
    }
  });
}

