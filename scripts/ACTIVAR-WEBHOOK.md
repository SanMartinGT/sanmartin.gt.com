# Activar y comprobar ERP → SEO → Hostinger

Estado al 24 de octubre de 2026: Edge `catalogo-actualizado` v2 desplegada y código
local probado. La automatización completa NO está activada ni verificada todavía.
El repositorio configurado anteriormente está vacío; el usuario utilizará otro y
su URL está pendiente. El alojamiento PHP/HTML de `sanmartingmca.com` ya quedó
preparado en el plan existente. La primera publicación manual está verificada
por HTTPS: tres fichas y 26 archivos críticos coinciden con el artefacto local.
Falta conectar la ejecución automática con GitHub y sus secretos.

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

1. Confirmar el repositorio GitHub real y su rama predeterminada, con acceso de
   escritura para subir la fuente revisada y `.github/workflows/publicar.yml`.
   El workflow debe existir en la rama predeterminada para repository_dispatch.
2. Configurar en GitHub SITE_URL=`https://sanmartingmca.com/` y los secrets
   HOSTINGER_FTP_SERVER, HOSTINGER_FTP_USERNAME y HOSTINGER_FTP_PASSWORD. Puerto,
   directorio y protocolo se toman de las variables del workflow; FTPS con
   certificado verificado es el valor predeterminado. No desactivar TLS para
   resolver un certificado incorrecto: usar el hostname indicado por el proveedor.
3. Habilitar HOSTINGER_DEPLOY_ENABLED=`true` solamente con el sitio preparado y
   la publicación manual verificada. Sin esa variable solo se genera un artefacto.
4. Configurar en Supabase Edge Secrets GITHUB_REPOSITORY con el repositorio real,
   GITHUB_DISPATCH_TOKEN limitado a ese repositorio (Contents read/write para
   repository_dispatch), y CATALOGO_WEBHOOK_SECRET con una clave privada aleatoria
   de 32–256 caracteres sin espacios. Crear en Vault catalogo_webhook_secret con
   exactamente la misma clave. No poner valores en archivos, logs o el chat.
5. Revalidar el esquema vivo, la ficha y el baseline antes de aplicar el delta.
   Mantener el helper fuera de RPC públicas y sin EXECUTE para clientes.

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
