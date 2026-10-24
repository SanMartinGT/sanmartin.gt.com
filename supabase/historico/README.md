# SQL históricos del ecommerce — no ejecutar

Archivados el 23 de octubre de 2026 para corregir H01. Los 25 archivos de instalación antiguos se conservaron sin cambiar un byte, con sufijo .sql.historico, en 2026-10-23/. No forman parte de supabase/migrations ni del sitio público.

Los comentarios internos que dicen «ejecuta una vez», «SQL Editor» o mencionan otro SQL describen instrucciones antiguas y no son el procedimiento vigente. No copiar esos cuerpos sobre Supabase ni renombrarlos a .sql para instalarlos.

La base compartida con el ERP ya usa checkout idempotente, presentaciones, estados de pago/entrega y permisos posteriores. Reaplicar estos instaladores puede retirar correcciones o reinstalar consumo de inventario por CONFIRMADO.

## Integridad y reemplazos

manifest.json registra ruta original, ruta archivada, bytes, SHA-256 y contrato actual orientativo de cada archivo. Es un mapa de tratamiento, no una equivalencia exacta entre cada archivo y una única migración remota.

| Original | Contrato/tratamiento vigente |
|---|---|
| supabase-alertas-ecommerce.sql | generar_alertas_inventario y motor de alertas con autorización; no restaurar función histórica. |
| supabase-alertas-operativas.sql | Triggers vivos de pedidos con INSERT diferido y total final; conservar los contratos actuales de alertas. |
| supabase-anuncios-editoriales-ecommerce.sql | Tabla/políticas actuales de anuncios_editoriales_ecommerce; cambios solo por delta específico. |
| supabase-anuncios-inicio-ecommerce.sql | Tabla/políticas/bucket actuales; configuracion.editar y sesión activa según políticas vivas. |
| supabase-banners-ecommerce.sql | banners_ecommerce y políticas actuales; no restaurar permiso banners.editar del archivo. |
| supabase-banners-temas.sql | Restricción de tema instalada; comparar CHECK vivo antes de ampliar opciones. |
| supabase-calidad-catalogo.sql | auditoria_calidad_catalogo_ecommerce sin SELECT público; preservar cierre administrativo. |
| supabase-carrito-checkout.sql | crear_pedido_checkout y crear_pedido_checkout_presentaciones; clave durable, motor privado, estados separados. |
| supabase-carritos-cuenta.sql | carritos_ecommerce con forma actual y propiedad; no reconstruir tabla desde CREATE TABLE IF NOT EXISTS antiguo. |
| supabase-catalogo-ecommerce-read.sql | Vistas/RLS/grants actuales; no usar este script para instalar permisos o Realtime en bloque. |
| supabase-catalogo-publico-seguro.sql | catalogo_productos con unidades y filtros actuales; conservar permisos administrativos y por columna. |
| supabase-categorias-ecommerce.sql | Políticas actuales de categorías activas/visibles; delta específico si cambia modelo de acceso. |
| supabase-clientes-ecommerce.sql | Registro de perfil y favoritos actuales; edición propia mediante actualizar_mi_perfil. |
| supabase-detalle-pedidos-cliente.sql | Políticas actuales de pedidos/líneas y erp_detalle_productos_pedido autorizado por dueño. |
| supabase-disponibilidad-ecommerce.sql | estado_disponibilidad_ecommerce, validar_disponibilidad_presentaciones y ecommerce_stock_omnicanal actuales. |
| supabase-ecommerce-authenticated-read.sql | Políticas vivas de catálogo para anon/authenticated, separadas de permisos de empleados. |
| supabase-marcas-ecommerce-read.sql | Políticas y publicación de marcas actuales; no reejecutar instalación de políticas. |
| supabase-newsletter.sql | suscribir_newsletter y tabla cerrada; no conceder acceso directo a la lista. |
| supabase-ofertas-validacion.sql | Restricciones/validación de ofertas vigentes, incluida corrección de consistencia de ofertas. |
| supabase-perfiles-seguridad.sql | actualizar_mi_perfil con campos permitidos y administración de personal actual; no revocar privilegios compartidos en bloque. |
| supabase-producto-detalle-publico.sql | catalogo_producto_detalle actual con campos de unidad y filtros de publicación. |
| supabase-productos-comprados-juntos.sql | RPC actual filtra pago PAGADO y entrega ENTREGADO; conservar filtros de productos publicados. |
| supabase-registro-clientes-fix.sql | Trigger y función de perfil cliente vigentes; no reinstalar otra versión por duplicado. |
| supabase-reservas-pedidos.sql | erp_transicionar_pedido y motor privado de reservas; no reinstalar trigger por CONFIRMADO. |
| supabase-reservas-seguridad.sql | Wrappers/permisos y cron actuales; no modificar autorización ni scheduler con el ejemplo antiguo. |

## Procedimiento vigente

Consultar [guía de migraciones diferenciales](../MIGRACIONES.md). La [instantánea de catálogo](../baseline/h01-2026-10-23.json) identifica firmas/huellas/permisos observados; no es SQL ejecutable ni un respaldo completo para reconstruir la base.

Verificación offline desde la raíz del ecommerce:

    node scripts/verificar-sql-vigente.mjs

El SQL scripts/activar-webhook-catalogo.sql queda separado como propuesta pendiente. No se aplicó ni se convirtió en migración como parte de H01.
