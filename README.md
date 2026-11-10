# Nodalia Web

Web oficial de [Nodalia](https://getnodalia.com) y páginas independientes de producto. Cinco sitios estáticos, un generador, cero dependencias de ejecución. No modifica los repositorios de las aplicaciones.

| Producto | Dominio | Proyecto Cloudflare Pages | Carpeta generada |
| --- | --- | --- | --- |
| Nodalia | https://getnodalia.com | `nodalia-portal` | `dist/portal` |
| Vortia | https://vortia.getnodalia.com | `nodalia-vortia` | `dist/vortia` |
| Vinilo | https://vinilo.getnodalia.com | `nodalia-vinilo` | `dist/vinilo` |
| Lienzo | https://lienzo.getnodalia.com | `nodalia-lienzo` | `dist/lienzo` |
| Nodalix OS | https://nodalix.getnodalia.com | `nodalia-nodalix` | `dist/nodalix` |

## Diseño

Dirección visual editorial: colores neutros, tipografía Sora + Inter autoalojada, estructura basada en jerarquía y líneas; sin mockups falsos, gradientes decorativos, ventanas simuladas ni promesas de funciones no publicadas. Las capturas disponibles se enlazan desde los repositorios oficiales y se identifican como tales. Si un proyecto aún no dispone de capturas oficiales, se muestra una ficha de estado.

- `assets/styles.css`: único sistema de estilos (sin CDN de tipografías).
- `assets/fonts/`: Sora (titulares) e Inter (texto), variables, subconjunto latino, autoalojadas. Licencia SIL OFL 1.1.
- `assets/releases.js`: franja de últimas versiones del portal; consulta GitHub Releases y conserva el valor de `data/site.json` si no hay respuesta.
- `assets/motion.js`: animaciones de scroll (aparición, parallax, barra de progreso, sección activa). Se desactivan con `prefers-reduced-motion` y el contenido es visible sin JavaScript.
- `assets/_headers`: cabeceras de seguridad y caché para Cloudflare Pages.
- `assets/nodalia-wordmark.svg` / `assets/nodalia-mark.svg`: identidad compartida.
- `data/apps.json` + `scripts/data.mjs`: catálogo de productos y resolución de URLs oficiales.
- `data/site.json`: contenido del portal (autor, ecosistema Home Assistant y preguntas frecuentes).
- `assets/favicon.svg`: favicon transparente que cambia de color con el tema del navegador; `favicon.ico` y `apple-touch-icon.png` son los respaldos.
- `scripts/build.mjs`: páginas, metadatos, SEO, sitemap y recursos.
- `scripts/test.mjs`: validación de los cinco sitios, módulos de descarga y manifiesto ISO.
- `assets/vortia-download.js` / `assets/nodalix-releases.js`: módulos ES exportables y comprobados en Node.

No hay framework ni dependencia npm de ejecución. Las páginas no contienen trackers, analítica ni cookies propios. Los iconos y capturas de los proyectos provienen de GitHub; algunos recursos externos pueden registrar solicitudes según sus propias políticas.

## Desarrollo

Requiere Node.js 20 o superior.

~~~bash
npm test
npm run build
npm run preview
~~~

`npm run preview` genera el portal y lo sirve en `http://127.0.0.1:4317/` con el servidor HTTP de Python. Otras vistas: `npm run preview:vortia`, `npm run preview:nodalix`. También puedes generar un sitio concreto con `npm run build:portal`, `npm run build:vortia`, `npm run build:vinilo`, `npm run build:lienzo` o `npm run build:nodalix`.

## Calidad y SonarCloud

El proyecto está vinculado a SonarCloud (`danielmigueltejedor_nodalia-web`). La configuración local está en `sonar-project.properties`.

Los módulos de descarga se prueban importando funciones exportadas (sin `vm.runInNewContext`), para eliminar el uso de ejecución dinámica asociado a `javascript:S1523`, una regla de tipo Security Hotspot. Ejecuta `npm test` antes de cada análisis o despliegue.

## Publicación en Cloudflare

Los cinco proyectos Pages se crearon mediante **Direct Upload / Wrangler** y están enlazados a sus dominios. El workflow `.github/workflows/validate.yml` comprueba las cinco webs en cada push y pull request; cuando se actualiza `main`, publica automáticamente las cinco carpetas `dist/portal`, `dist/vortia`, `dist/vinilo`, `dist/lienzo` y `dist/nodalix` en sus proyectos Cloudflare Pages. También se puede ejecutar manualmente desde **Actions → Validate and deploy Nodalia sites → Run workflow**.

**Configuración inicial obligatoria (una sola vez):** en **GitHub → nodalia-web → Settings → Secrets and variables → Actions**, añade el secreto `CLOUDFLARE_API_TOKEN` (token de Cloudflare con permiso **Account → Cloudflare Pages → Edit**, limitado a tu cuenta) y la variable `CLOUDFLARE_ACCOUNT_ID` (ID de cuenta Cloudflare). El ID puede configurarse como secreto del mismo nombre si lo prefieres. Los secretos de `danielmigueltejedor.com` no se comparten automáticamente con este repositorio. Si faltan, las pruebas pasan pero el job de despliegue falla deliberadamente con instrucciones; así no se anuncia una publicación que no ocurrió.

Para publicar manualmente los cinco sitios desde el repositorio clonado, con Wrangler autenticado:

~~~bash
npm test
npm run build
npx wrangler pages deploy dist/portal --project-name nodalia-portal --branch main
npx wrangler pages deploy dist/vortia --project-name nodalia-vortia --branch main
npx wrangler pages deploy dist/vinilo --project-name nodalia-vinilo --branch main
npx wrangler pages deploy dist/lienzo --project-name nodalia-lienzo --branch main
npx wrangler pages deploy dist/nodalix --project-name nodalia-nodalix --branch main
~~~

Los despliegues automáticos se ejecutan solamente después de superar las pruebas; los pull requests se validan sin publicar. Wrangler está fijado a una versión conocida. No hace falta cambiar DNS, los subdominios privados de Cloudflare ni los registros de correo. Los secretos no deben guardarse en los archivos del repositorio.

## Vortia: descargas por sistema operativo

La web `vortia.getnodalia.com` identifica de manera orientativa el sistema operativo del navegador y ofrece un botón directo con el icono de Linux (AppImage x86_64) o Apple (DMG arm64). La sección de descargas siempre muestra **ambas plataformas**, los tamaños y los checksums SHA-256 que existan en la publicación.

`assets/vortia-download.js` consulta `https://api.github.com/repos/danielmigueltejedor/vortia/releases/latest` para mostrar los instaladores de la última publicación estable, sin cambiar el sitio cada vez que se publica Vortia. En caso de error de red o límite de la API, usa como respaldo los archivos oficiales verificados de `v0.1.1` y avisa de que pueden no ser los más recientes.

No se ofrecen DMG para Mac Intel ni AppImage para Linux ARM64 cuando no hay un paquete compatible. Los navegadores, especialmente Safari, **no siempre permiten identificar la arquitectura de un Mac**: el botón de macOS indica explícitamente que el DMG es para Apple Silicon. Los enlaces siempre apuntan a GitHub Releases y se comprueba su origen antes de usarlos.

Los SVG de las marcas Apple y Linux proceden de [Simple Icons](https://github.com/simple-icons/simple-icons), proyecto bajo licencia CC0; sus marcas pertenecen a sus respectivos titulares.

## Nodalix OS: ISO

La página Nodalix OS consulta las publicaciones oficiales de [Nodalix OS en GitHub](https://github.com/danielmigueltejedor/nodalix-os/releases). Si la versión estable contiene una ISO completa, enlaza a ella; si se distribuye en partes, enlaza al descargador oficial y a las verificaciones disponibles. Nunca muestra un botón ficticio de descarga directa.

Opcionalmente, las ISO íntegras pueden alojarse en un bucket Cloudflare R2 con un subdominio dedicado. La fuente `data/nodalix-iso-releases.json` solo debe editarse al publicar una ISO real, después de verificar nombre, tamaño, URL pública y SHA-256. `assets/nodalix-releases.js` prioriza los enlaces directos de la versión publicada únicamente cuando son verificables.

No subir imágenes ISO a Cloudflare Pages: sus límites de tamaño por archivo son inadecuados para medios de instalación de varios GiB.

## Seguridad y cambios

- Conserva los estados de desarrollo y las limitaciones reales de cada producto.
- Mantén la verificación SHA-256 y las advertencias de instalación de Nodalix OS.
- No añadas tokens, claves, contraseñas, sesiones ni configuraciones de Home Assistant.
- Antes de publicar: ejecuta `npm test`, revisa cambios visuales en escritorio y móvil, y comprueba los enlaces de descarga.
- Las imágenes de las aplicaciones se enlazan desde las ramas oficiales de sus repositorios, no se generan artificialmente.
- Las cabeceras HTTP de seguridad se definen en `assets/_headers` y se copian a cada sitio generado.
