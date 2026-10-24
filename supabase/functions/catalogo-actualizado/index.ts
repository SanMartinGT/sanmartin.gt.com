// Servidor únicamente: nunca copiar este código ni sus secretos al navegador.
// El export permite probar el mismo handler sin desplegar una Edge Function.
type Dependencies = {
  env: (name: string) => string | undefined;
  fetch: typeof globalThis.fetch;
  uuid?: () => string;
};

const TABLES = new Set([
  'productos',
  'producto_imagenes',
  'ofertas_producto',
  'categorias',
  'marcas',
  'existencias',
  'configuracion_ecommerce',
  'producto_presentaciones',
  'unidades_medida',
]);
const MAX_BODY_BYTES = 1024 * 1024;
const TYPES = new Set(['INSERT', 'UPDATE', 'DELETE']);
const API_VERSION = '2026-03-10';

function response(status: number, message: string, eventId?: string): Response {
  return new Response(JSON.stringify({ message, ...(eventId ? { evento_id: eventId } : {}) }), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function validSecret(value: string | undefined): value is string {
  return typeof value === 'string' && value.length >= 32 && value.length <= 256 && !/\s/.test(value);
}

function equalSecret(actual: string | null, expected: string): boolean {
  if (actual === null || actual.length !== expected.length) return false;
  // Recorre todos los caracteres cuando la longitud coincide.
  let difference = 0;
  for (let i = 0; i < expected.length; i++) difference |= actual.charCodeAt(i) ^ expected.charCodeAt(i);
  return difference === 0;
}

function identifier(value: unknown): string | number | boolean | undefined {
  if (typeof value === 'string' && /^[A-Za-z0-9:_-]{1,128}$/.test(value)) return value;
  if (typeof value === 'number' && Number.isSafeInteger(value)) return value;
  if (typeof value === 'boolean') return value;
  return undefined;
}

async function readBody(request: Request): Promise<string | undefined> {
  if (!request.body) return '';
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let bytes = 0;
  let body = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) return body + decoder.decode();
      bytes += value.byteLength;
      if (bytes > MAX_BODY_BYTES) {
        await reader.cancel();
        return undefined;
      }
      body += decoder.decode(value, { stream: true });
    }
  } finally {
    reader.releaseLock();
  }
}

export function createHandler(dependencies: Dependencies) {
  return async (request: Request): Promise<Response> => {
    try {
      if (request.method !== 'POST') return response(405, 'Método no permitido.');

      const secret = dependencies.env('CATALOGO_WEBHOOK_SECRET');
      const token = dependencies.env('GITHUB_DISPATCH_TOKEN');
      const repository = dependencies.env('GITHUB_REPOSITORY');
      if (!validSecret(secret) || !token || /\s/.test(token) || !repository ||
          !/^[A-Za-z0-9][A-Za-z0-9-]*\/[A-Za-z0-9_.-]+$/.test(repository)) {
        return response(500, 'Servicio no configurado.');
      }
      if (!equalSecret(request.headers.get('x-webhook-secret'), secret)) {
        return response(401, 'No autorizado.');
      }
      if (request.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
        return response(415, 'Se requiere JSON.');
      }
      const body = await readBody(request);
      if (body === undefined) return response(413, 'Solicitud demasiado grande.');

      let payload: unknown;
      try {
        payload = JSON.parse(body);
      } catch {
        return response(400, 'Evento inválido.');
      }
      if (!isRecord(payload) || payload.schema !== 'public' ||
          typeof payload.table !== 'string' || !TABLES.has(payload.table) ||
          typeof payload.type !== 'string' || !TYPES.has(payload.type)) {
        return response(400, 'Evento inválido.');
      }
      const validRows = payload.type === 'INSERT'
        ? isRecord(payload.record) && payload.old_record === null
        : payload.type === 'UPDATE'
          ? isRecord(payload.record) && isRecord(payload.old_record)
          : payload.record === null && isRecord(payload.old_record);
      if (!validRows) return response(400, 'Evento inválido.');

      const row = (payload.type === 'DELETE' ? payload.old_record : payload.record) as Record<string, unknown>;
      const id = identifier(row.id) ?? identifier(row.producto_id);
      // No reenviar record/old_record: productos incluye datos privados del ERP.
      // Correlaciona solicitud, ejecución y artefacto; no confirma publicación.
      // Se genera después de autorizar/validar y se conserva entre reintentos.
      const eventId = dependencies.uuid?.() ?? crypto.randomUUID();
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(eventId)) {
        return response(500, 'No se pudo procesar la solicitud.');
      }
      const clientPayload = { evento_id: eventId, tipo: payload.type, tabla: payload.table, ...(id === undefined ? {} : { id }) };
      const dispatchBody = JSON.stringify({ event_type: 'catalogo_actualizado', client_payload: clientPayload });
      const endpoint = `https://api.github.com/repos/${repository}/dispatches`;

      // Reintentos breves solo para fallos transitorios; no constituyen una cola durable.
      for (let attempt = 0; attempt < 3; attempt++) {
        let retry = false;
        try {
          const upstream = await dependencies.fetch(endpoint, {
            method: 'POST',
            headers: {
              Accept: 'application/vnd.github+json',
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
              'User-Agent': 'SanMartin-Catalogo-Webhook',
              'X-GitHub-Api-Version': API_VERSION,
            },
            body: dispatchBody,
            redirect: 'error',
            signal: AbortSignal.timeout(3000),
          });
          const status = upstream.status;
          // No leer ni registrar el cuerpo de GitHub; podría contener datos internos.
          if (upstream.body) await upstream.body.cancel();
          if (status === 204) return response(202, 'Actualización solicitada.', eventId);
          retry = status === 429 || status >= 500;
        } catch {
          retry = true;
        }
        if (!retry || attempt === 2) break;
        await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
      }
      return response(502, 'No se pudo solicitar la actualización.');
    } catch {
      // No devolver mensajes de excepciones, tokens, filas ni variables de entorno.
      return response(500, 'No se pudo procesar la solicitud.');
    }
  };
}

// En Node no existe Deno: las pruebas importan createHandler sin abrir un servidor.
if (typeof Deno !== 'undefined') {
  Deno.serve(createHandler({ env: (name) => Deno.env.get(name), fetch: globalThis.fetch }));
}
