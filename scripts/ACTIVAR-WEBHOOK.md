# Activar y comprobar ERP → SEO → Hostinger

Estado al 24 de octubre de 2026: Edge `catalogo-actualizado` v2 desplegada y código
local probado. La automatización completa NO está activada ni verificada todavía.
El usuario confirmó [SanMartinGT/sanmartin.gt.com](https://github.com/SanMartinGT/sanmartin.gt.com),
rama `main`. En este corte de carga hay 77 archivos de raíz y `scripts/`
en `main`, y cinco archivos de `supabase/` en proceso. La fuente revisada
de 132 archivos todavía está en carga; no se ha verificado una ejecución
de Actions. El alojamiento PHP/HTML de `sanmartingmca.com` está preparado
en el plan existente y la primera publicación manual está verificada por
HTTPS: tres fichas y 26 archivos críticos coinciden con el artefacto local.
Siguen pendientes los secretos de GitHub/Supabase, el secreto Vault, los
triggers y la aceptación completa del flujo automático.

## Un solo mecanismo de eventos

La migración diferencial preparada es
`supabase/migrations/20261024165634_conectar_puente_catalogo.sql`.
No está aplicada. Falla si no existe exactamente un secreto Vault válido llamado
`catalogo_webhook_secret`, si hay webhooks previos o si difieren los prerrequisitos
revisados. No crear además webhooks estándar del Dashboard.

`scripts/activar-webhook-catalogo.sql` conserva la propuesta anterior de siete
tablas como referencia. No ejecutarla; no sustituye la migración nueva revisada.
Los históricos bajo `supabase/historico` tampoco se reinstalan.

La captura prevista cubre las nueve dependencias del catálogo: productos,
producto_imagenes, ofertas_producto, categorias, marcas, existencias,
configuracion_ecommerce, producto_presentaciones y unidades_medida.
Los triggers AFTER ROW de INSERT/UPDATE/DELETE envían solamente tipo, esquema,
tabla y los IDs actuales/anteriores. No envían filas privadas, costos ni cantidades.
Un fallo de notificación conserva la edición/compra y exige reconstrucción manual.

## Configuración necesaria

1. Completar la carga de los 132 archivos revisados en `main` de
   `SanMartinGT/sanmartin.gt.com`, incluidos `.github/workflows/publicar.yml`,
   `supabase/`, `assets/` y los archivos ocultos. Verificar después su
   primera ejecución de Actions. El workflow debe existir en la rama
   predeterminada para `repository_dispatch`; la carga parcial no basta.
2. Configurar en GitHub SITE_URL=`https://sanmartingmca.com/` y los secrets
   HOSTINGER_FTP_SERVER, HOSTINGER_FTP_USERNAME y HOSTINGER_FTP_PASSWORD. Puerto,
   directorio y protocolo se toman de las variables del workflow; FTPS con
   certificado verificado es el valor predeterminado. No desactivar TLS para
   resolver un certificado incorrecto: usar el hostname indicado por el proveedor.
3. Habilitar HOSTINGER_DEPLOY_ENABLED=`true` solamente con el sitio preparado y
   la publicación manual verificada. Sin esa variable solo se genera un artefacto.
4. Configurar en Supabase Edge Secrets GITHUB_REPOSITORY=`SanMartinGT/sanmartin.gt.com`,
   GITHUB_DISPATCH_TOKEN limitado a ese repositorio (Contents read/write para
   repository_dispatch), y CATALOGO_WEBHOOK_SECRET con una clave privada aleatoria
   de 32–256 caracteres sin espacios. Crear en Vault catalogo_webhook_secret con
   exactamente la misma clave. No poner valores en archivos, logs o el chat.
5. Revalidar el esquema vivo, la ficha y el baseline antes de aplicar el delta.
   Mantener el helper fuera de RPC públicas y sin EXECUTE para clientes.
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

## Aceptación remota pendiente

- Probar rechazo de solicitudes sin secreto, sin crear un dispatch.
- Enviar un evento sintético mínimo y seguir su evento_id hasta Actions.
- Comprobar workflow, FTP y verificación HTTPS exitosos, con el mismo evento en
  la evidencia servida y las tres fichas/sitemap del artefacto.
- Tras activar los triggers, comprobar una edición normal del ERP. Puede probarse
  el encolado en una transacción revertida sin dejar cambios de negocio; pg_net
  no entrega solicitudes revertidas. Esa prueba se distingue del envío confirmado.
- La lectura de net._http_response debe limitarse a estado/tiempo/ID del evento;
  no imprimir headers de la cola, secretos descifrados ni respuestas con credenciales.

El cron horario y las ejecuciones manuales siguen como recuperación. La integración
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
