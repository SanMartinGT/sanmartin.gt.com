# Activar y comprobar ERP → SEO → Hostinger

Estado al 24 de octubre de 2026 en Guatemala: Edge `catalogo-actualizado` ACTIVE,
revisión remota **5** observada con el código H09 revisado, secretos de
GitHub/Supabase y Vault configurados, y nueve triggers
instalados. Las fuentes y el workflow están en `main` de
[SanMartinGT/sanmartin.gt.com](https://github.com/SanMartinGT/sanmartin.gt.com).
La automatización está activa y se probó el evento de base → Edge → GitHub
Actions → FTPS → HTTPS en `https://sanmartingmca.com/`. El mismo `evento_id`
aparece en la respuesta de Edge y en la evidencia del sitio publicado.

## Un solo mecanismo de eventos

La migración diferencial aplicada es
`supabase/migrations/20261025043945_conectar_puente_catalogo.sql`.
Su nombre inicial de CLI fue `20261024165634_conectar_puente_catalogo.sql`;
el archivo se renombró al ID remoto preservando todos los bytes aplicados.
La ficha conserva el origen y el baseline previo inmutable. No reaplicarla.
El guard comprueba secreto Vault válido, ausencia de webhooks previos y demás
prerrequisitos revisados. No crear además webhooks estándar del Dashboard.

`scripts/activar-webhook-catalogo.sql` conserva la propuesta anterior de siete
tablas como referencia. No ejecutarla; no sustituye la migración nueva revisada.
Los históricos bajo `supabase/historico` tampoco se reinstalan.

La captura instalada cubre las nueve dependencias del catálogo: productos,
producto_imagenes, ofertas_producto, categorias, marcas, existencias,
configuracion_ecommerce, producto_presentaciones y unidades_medida.
Los triggers AFTER ROW de INSERT/UPDATE/DELETE envían solamente tipo, esquema,
tabla y los IDs actuales/anteriores. No envían filas privadas, costos ni cantidades.
Un fallo de notificación conserva la edición/compra y exige reconstrucción manual.

## Configuración y mantenimiento

1. Conservar la fuente y `.github/workflows/publicar.yml` en `main` de
   `SanMartinGT/sanmartin.gt.com`, incluidos `supabase/`, `assets/` y archivos
   ocultos. El workflow debe existir en la rama predeterminada para recibir
   `repository_dispatch`; verificar CI y el artefacto después de cada cambio.
2. Configurar en GitHub SITE_URL=`https://sanmartingmca.com/` y los secrets
   HOSTINGER_FTP_SERVER, HOSTINGER_FTP_USERNAME y HOSTINGER_FTP_PASSWORD. Puerto,
   directorio y protocolo se toman de las variables del workflow; el guard exige
   FTPS con certificado verificado y rechaza `HOSTINGER_FTP_PROTOCOL=ftp` antes
   de escribir. No desactivar TLS para
   resolver un certificado incorrecto: usar el hostname indicado por el proveedor.
   El destino comprobado es `srv486.hstgr.io:21`, con una cuenta FTP dedicada
   al sitio y ruta `/public_html/`; las credenciales quedan sólo en los secrets.
3. HOSTINGER_DEPLOY_ENABLED=`true` está habilitado y probado. Si se retira o se
   cambia a `false`, el workflow sólo genera un artefacto y no publica en hosting.
4. Mantener en Supabase Edge Secrets GITHUB_REPOSITORY=`SanMartinGT/sanmartin.gt.com`,
   GITHUB_DISPATCH_TOKEN limitado a ese repositorio (Contents read/write para
   repository_dispatch), y CATALOGO_WEBHOOK_SECRET con una clave privada aleatoria
   de 32–256 caracteres sin espacios. Vault debe conservar exactamente un secreto
   catalogo_webhook_secret con la misma clave; no duplicarlo. No poner valores
   en archivos, logs o el chat.
   El token de GitHub vence el **22 de enero de 2027**: renovarlo y actualizar
   GITHUB_DISPATCH_TOKEN en Edge Secrets antes de esa fecha para conservar el
   disparo automático por eventos.
5. Para cambios posteriores, revalidar el esquema vivo y preparar un delta nuevo
   con su ficha y baseline. Mantener el helper fuera de RPC públicas y sin
   EXECUTE para clientes; no reinstalar la migración aplicada.
   Repetir consultas de sólo `id` con `limit=0` y `Accept-Profile: net` y `vault`
   usando la publishable key pública: ambas deben rechazar el schema con
   HTTP406/PGRST106 y anunciar sólo `public, graphql_public`. Si no se puede
   comprobar o cambia la lista, detener la activación y revisar la Data API.

pg_net concede permisos de tabla a `PUBLIC` como condición de la plataforma.
El delta no intenta revocarlos: conserva las verificaciones de Vault y esquemas
privados, y exige `anon`/`authenticated` sin LOGIN ni privilegios administrativos.
La exposición de schemas de la Data API se acepta fuera de esta sesión SQL.
Los roles SQL con LOGIN deben ser de confianza: pueden leer los headers
transitorios de pg_net, incluido `x-webhook-secret`; Vault no vuelve privada esa
cola. El token de GitHub permanece exclusivamente en Edge Secrets.
Ver [límites oficiales de permisos de pg_net](https://supabase.com/docs/guides/troubleshooting/revoking-access-to-pg_net-objects-has-no-effect-0bbc16).

La Edge ya conserva verify_jwt=false porque verifica x-webhook-secret por sí misma.
No se desactivan otras protecciones ni se utiliza una service_role en el navegador.

## Qué prueba cada fase

Un POST autorizado y válido recibe HTTP202 con `evento_id` UUID. Ese mismo ID
viaja en `client_payload.evento_id` a GitHub y se conserva durante los reintentos.
HTTP202 solo significa solicitud aceptada, no sitio generado o publicado.

Tras generar y verificar el sitio, el workflow crea `_site/publicacion.json` con
ID único del artefacto, evento, commit/ejecución GitHub y SHA256 de los archivos
críticos (fichas, índices, sitemap, robots, JS/CSS). No contiene secretos.

El publicador existente transfiere por FTPS; después
`scripts/verificar-publicacion-remota.mjs` comprueba por HTTPS el manifiesto de
esta ejecución y todos los archivos críticos. Rechaza un build anterior, un
archivo parcial, una redirección o una página de dominio aparcado aunque responda
HTTP200. Guarda `work/publicacion-verificada.json`.

Si Hostinger está deshabilitado, `--skip` guarda estado OMITIDA y verified=false.
La evidencia se adjunta como artefacto de Actions. Solo transferencia y verificación
HTTPS exitosas permiten afirmar publicación de ese artefacto.

## Aceptación remota completada

La prueba técnica hizo un UPDATE con los mismos valores en
`configuracion_ecommerce` y confirmó que sus campos quedaron iguales después
del COMMIT. El trigger de auditoría existente dejó una entrada técnica normal.
Fue una prueba del evento de la base, sin una edición comercial desde la UI del
ERP ni cambios de producto, precio o inventario.

- pg_net registró la solicitud **2113** y Edge respondió HTTP202 con
  `evento_id=0823d672-b9ed-4cf3-99d6-17fe4b338b5d`.
- Ese evento inició la [ejecución automática 40162772575](https://github.com/SanMartinGT/sanmartin.gt.com/actions/runs/40162772575).
- El artefacto y la evidencia servida por HTTPS conservaron el mismo evento;
  la verificación terminó con `verified:true`, **26 archivos críticos y tres
  fichas**, el `2026-10-25T04:41:32.931Z` (24-10-2026, 22:41 en Guatemala).

Esta aceptación demuestra la cadena completa para ese evento técnico. Las
pruebas aisladas cubren INSERT/UPDATE/DELETE en las nueve tablas; no se hicieron
ediciones comerciales reales en todas ellas. Una prueba revertida sólo acredita
encolado transaccional: pg_net no entrega solicitudes de un ROLLBACK.
Al consultar `net._http_response`, limitarse a estado/tiempo/ID del evento; no
imprimir headers de la cola, secretos descifrados ni valores de credenciales.

La recuperación horaria también se probó: la [ejecución programada
40162843342](https://github.com/SanMartinGT/sanmartin.gt.com/actions/runs/40162843342)
terminó con FTPS y verificación HTTPS exitosos. Esa ejecución posterior es
legítima y no tiene `evento_id`; el recibo histórico del evento técnico se
conserva en la ejecución 40162772575 enlazada arriba. Las ejecuciones manuales
siguen disponibles como recuperación. La integración
no garantiza un plazo exacto ni entrega durable por cada modificación. Un fallo
posterior requiere revisar la evidencia y reejecutar la reconstrucción del catálogo.

## Pruebas locales

```sh
node scripts/probar-webhook-catalogo.mjs
node scripts/probar-puente-sql.mjs
node scripts/probar-evidencia-publicacion.mjs
```

El handler se prueba con Node>=22.13 y stripTypeScriptTypes, sin instalar dependencias
nuevas. Vault/pg_net/GitHub/hosting de las pruebas son simulados explícitamente.
Estas pruebas no sustituyen la aceptación remota anterior.
