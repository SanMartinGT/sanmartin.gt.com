# Publicacion inicial de SAN MARTIN

Estos paquetes preparan los repositorios; no activan Pages ni publican por si solos.
Los originales de OneDrive no se modificaron.

1. Extrae staging-repositorio.zip para el repositorio sanmartingt/staging.
2. Extrae produccion-repositorio.zip para sanmartingt/sanmartin.gt.com.
3. En cada repositorio de GitHub entra a Settings > Pages > Build and deployment.
4. En Source selecciona GitHub Actions. No configures Custom domain.
5. Sube el CONTENIDO de la carpeta extraida a la raiz del repositorio, incluyendo .github.
   No subas el ZIP ni una carpeta contenedora. Haz commit en la rama main.
6. En Actions revisa Publicar sitio. Si no se ejecuto, usa Run workflow > main.
7. Cuando termine, comprueba las URLs previstas y abre catalogo.html y una ficha.

Subida desde PowerShell con Git (ejecutar dentro de cada carpeta extraida):

    git init -b main
    git add .
    git commit -m "Preparar publicacion inicial"
    git remote add origin https://github.com/sanmartingt/staging.git
    git push -u origin main

Para produccion cambia el remoto a https://github.com/sanmartingt/sanmartin.gt.com.git.
Si Git pide acceso, inicia sesion con tu cuenta de GitHub. No incluyas tokens en comandos.
Si el repositorio ya tiene commits, clonalo primero y copia los archivos dentro.

Ambos entornos comienzan con noindex mientras se completa la auditoria.
staging permanece noindex aunque cambies allowIndexing.
Cuando produccion este lista, cambia allowIndexing a true en entorno.json y haz commit.
No actives indexacion antes de corregir canonical, schema, fichas de prueba y sitemap.
No envies el sitemap de staging a Google.

El workflow publica solo archivos web: no publica scripts, SQL ni configuraciones.
Se excluyo el workflow antiguo que actualizaba SEO cada seis horas: esta primera
configuracion no ejecuta el generador defectuoso ni requiere secrets de Supabase.
El catalogo del navegador sigue consultando el mismo Supabase en ambos entornos.
Una accion en staging puede escribir en la misma base real: no son bases aisladas.
No se borraron los tres productos ni sus fichas; falta la limpieza SEO posterior.
Los archivos robots.txt en /staging/ y /sanmartin.gt.com/ no controlan rastreo:
el efectivo seria https://sanmartingt.github.io/robots.txt. Se usa noindex en HTML.

En Supabase > Authentication > URL Configuration, establece Site URL como
https://sanmartingt.github.io/sanmartin.gt.com/ y agrega en Redirect URLs:
https://sanmartingt.github.io/sanmartin.gt.com/**
https://sanmartingt.github.io/staging/**
Esto prepara retornos de autenticacion; requiere prueba real de registro y recuperacion.

Verificacion: el codigo fuente HTML debe mostrar noindex en ambos entornos,
las imagenes/CSS deben cargar desde su subruta y Actions debe terminar en verde.
HTTPS se administra en Pages; comprueba Enforce HTTPS si la opcion aparece.
No hay configuracion DNS para estas URLs de github.io.

Pendientes: validar permisos RLS, datos actuales, checkout, enlaces canonical,
precio/disponibilidad del JSON-LD, generacion completa de fichas y auditoria movil.
GitHub Pages restringe sitios destinados a facilitar transacciones comerciales;
antes de activar ese uso debe revisarse la migracion al hosting previsto.
