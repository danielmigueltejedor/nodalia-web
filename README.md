# Nodalia Web

Web oficial de [Nodalia](https://getnodalia.com) y páginas de producto. Un sitio estático, un generador, cero dependencias de ejecución. No modifica los repositorios de las aplicaciones.

Cada producto vive en una ruta del portal, así que una app nueva solo necesita su entrada en `data/apps.json`: ni DNS ni un proyecto Cloudflare nuevos.

| Producto | Dirección | Carpeta generada |
| --- | --- | --- |
| Nodalia | https://getnodalia.com | `dist/portal` |
| Brújula | https://getnodalia.com/brujula/ | `dist/portal/brujula` |
| Vortia | https://getnodalia.com/vortia/ | `dist/portal/vortia` |
| Vinilo | https://getnodalia.com/vinilo/ | `dist/portal/vinilo` |
| Lienzo | https://getnodalia.com/lienzo/ | `dist/portal/lienzo` |
| Forja | https://getnodalia.com/forja/ | `dist/portal/forja` |
| Nodalix OS | https://getnodalia.com/nodalix/ | `dist/portal/nodalix` |

Todo se publica en el proyecto Cloudflare Pages `nodalia-portal`. Los subdominios antiguos (`vortia.`, `vinilo.`, `lienzo.` y `nodalix.getnodalia.com`) conservan sus proyectos (`nodalia-<app>`), que ahora solo redirigen con un 301 a la misma ruta bajo `getnodalia.com/<app>/` (`dist/legacy/<app>/_redirects`), para que los enlaces antiguos sigan funcionando.

## Diseño

Dirección visual editorial: colores neutros, tipografía Sora + Inter autoalojada, estructura basada en jerarquía y líneas; sin mockups falsos, gradientes decorativos, ventanas simuladas ni promesas de funciones no publicadas. Las capturas disponibles se enlazan desde los repositorios oficiales y se identifican como tales. Si un proyecto aún no dispone de capturas oficiales, se muestra una ficha de estado.

- `assets/styles.css`: único sistema de estilos (sin CDN de tipografías).
- `assets/fonts/`: Sora (titulares) e Inter (texto), variables, subconjunto latino, autoalojadas. Licencia SIL OFL 1.1.
- `scripts/releases.mjs`: al generar, lee la última versión publicada de cada app en GitHub Releases, así las páginas salen con la versión y los enlaces de descarga actuales sin editarlas. Si GitHub no responde usa `data/releases.json`, la última lectura guardada (`npm run releases` la renueva; `NODALIA_OFFLINE=1` no consulta la red).
- `assets/releases.js`: franja de últimas versiones del portal; consulta GitHub Releases en el navegador y muestra un proyecto en cuanto publica su primera versión.
- `assets/app-download.js`: botón de descarga de Vinilo, Lienzo y cualquier app con `downloads` en `data/apps.json` (patrones de nombre de archivo por sistema). Ofrece el DMG con la manzana en un Mac, el AppImage con el pingüino en Linux y el instalador en Windows; parte de la versión con la que se generó la página y comprueba en GitHub si hay otra más nueva.
- `assets/motion.js`: animaciones de scroll (aparición, parallax, barra de progreso, sección activa), el escaparate de capturas de la portada (pestañas que avanzan solas e inclinación que se endereza al hacer scroll), las tarjetas de productos que se apilan, los principios que se iluminan al pasar por el centro y las cifras que cuentan. Se desactivan con `prefers-reduced-motion` y el contenido es visible sin JavaScript.
- Donaciones: `brand.coffee` en `scripts/data.mjs` es la página de Buy Me a Coffee; muestra la sección «Apoya Nodalia» de la portada y el enlace del pie. Vacío, no aparece ninguno de los dos.
- `scripts/scroll-story.mjs` y `assets/scroll-story.js`: una demostración de tres pasos por sitio. El panel fijo usa el scroll nativo como línea de tiempo y ofrece un salto al contenido siguiente. Sin JavaScript, con movimiento reducido o en ventanas bajas, los tres pasos aparecen juntos.
- `assets/identity.js`: firma visual de cada producto en la cabecera. Vortia: flujo potencial alrededor de un cilindro con trazadores y sonda (las líneas de corriente se generan en `build.mjs`). Lienzo: dimensiones reales de la captura en la selección. Brújula (rosa de los vientos con la aguja que se asienta al norte), Nodalix OS (arranque) y Vinilo (disco a 33⅓ rpm) son solo HTML y CSS.
- Idiomas: español (origen), inglés, francés, alemán y portugués. La plantilla y los datos se escriben en español; `scripts/i18n.mjs` traduce el HTML generado con `i18n/<idioma>.json` (clave = texto en español) y publica cada idioma en `/<idioma>/`. Los textos que no cambian (nombres, tecnologías) van en `i18n/keep.json`. Si falta una traducción, `npm test` falla y `dist/i18n-missing.json` dice cuál. Los scripts del navegador usan `t()` de `assets/i18n.js`. La portada en español redirige al idioma del navegador solo si no se ha elegido otro en el selector; la elección se guarda en `localStorage`.
- `assets/_headers`: cabeceras de seguridad y caché para Cloudflare Pages.
- `assets/nodalia-wordmark.svg` / `assets/nodalia-mark.svg`: identidad compartida.
- `data/apps.json` + `scripts/data.mjs`: catálogo de productos y resolución de URLs oficiales.
- `data/site.json`: contenido del portal (autor, ecosistema Home Assistant y preguntas frecuentes).
- `assets/favicon.svg`: favicon transparente que cambia de color con el tema del navegador; `favicon.ico` y `apple-touch-icon.png` son los respaldos.
- `scripts/build.mjs`: páginas, metadatos, SEO, sitemap y recursos.
- `scripts/test.mjs`: validación del portal y de cada página de producto, las redirecciones, los módulos de descarga y el manifiesto ISO.
- `assets/vortia-download.js` / `assets/app-download.js` / `assets/nodalix-releases.js`: módulos ES exportables y comprobados en Node.

No hay framework ni dependencia npm de ejecución. Las páginas no contienen trackers, analítica ni cookies propios. Los iconos y capturas de los proyectos provienen de GitHub; algunos recursos externos pueden registrar solicitudes según sus propias políticas.

## Desarrollo

Requiere Node.js 20 o superior.

~~~bash
npm test
npm run build
npm run preview
~~~

`npm run preview` genera el sitio y lo sirve en `http://127.0.0.1:4317/` con el servidor HTTP de Python; las apps están en `/vinilo/`, `/forja/`, etc.

## Calidad y SonarCloud

El proyecto está vinculado a SonarCloud (`danielmigueltejedor_nodalia-web`). La configuración local está en `sonar-project.properties`.

Los módulos de descarga se prueban importando funciones exportadas (sin `vm.runInNewContext`), para eliminar el uso de ejecución dinámica asociado a `javascript:S1523`, una regla de tipo Security Hotspot. Ejecuta `npm test` antes de cada análisis o despliegue.

## Publicación en Cloudflare

Los proyectos Pages se crearon mediante **Direct Upload / Wrangler** y están enlazados a sus dominios. El workflow `.github/workflows/validate.yml` comprueba la web en cada push y pull request; cuando se actualiza `main`, publica `dist/portal` en `nodalia-portal` y las redirecciones de `dist/legacy/<app>` en los proyectos de los subdominios antiguos. También se puede ejecutar manualmente desde **Actions → Validate and deploy Nodalia sites → Run workflow**.

**Configuración inicial obligatoria (una sola vez):** en **GitHub → nodalia-web → Settings → Secrets and variables → Actions**, añade el secreto `CLOUDFLARE_API_TOKEN` (token de Cloudflare con permiso **Account → Cloudflare Pages → Edit**, limitado a tu cuenta) y la variable `CLOUDFLARE_ACCOUNT_ID` (ID de cuenta Cloudflare). El ID puede configurarse como secreto del mismo nombre si lo prefieres. Los secretos de `danielmigueltejedor.com` no se comparten automáticamente con este repositorio. Si faltan, las pruebas pasan pero el job de despliegue falla deliberadamente con instrucciones; así no se anuncia una publicación que no ocurrió.

Para publicar a mano desde el repositorio clonado, con Wrangler autenticado:

~~~bash
npm test
npm run build
npx wrangler pages deploy dist/portal --project-name nodalia-portal --branch main
for app in vortia vinilo lienzo nodalix; do
  npx wrangler pages deploy dist/legacy/$app --project-name nodalia-$app --branch main
done
~~~

**Versiones automáticas.** El workflow también se ejecuta cada tres horas y con el evento `repository_dispatch` de tipo `app-released`, así que las webs se regeneran con las últimas versiones sin tocar este repositorio. Para que una publicación aparezca al momento, el workflow de release de una app puede lanzar ese evento (necesita un token con permiso sobre `nodalia-web`):

~~~bash
gh api repos/getnodalia/nodalia-web/dispatches -f event_type=app-released
~~~

Aunque no se regeneren, las páginas consultan GitHub en el navegador y muestran la versión nueva en cuanto existe.

Los despliegues automáticos se ejecutan solamente después de superar las pruebas; los pull requests se validan sin publicar. Wrangler está fijado a una versión conocida. No hace falta cambiar DNS, los subdominios privados de Cloudflare ni los registros de correo. Los secretos no deben guardarse en los archivos del repositorio.

## Vortia: descargas por sistema operativo

La web `getnodalia.com/vortia/` identifica de manera orientativa el sistema operativo del navegador y ofrece un botón directo con el icono de Linux (AppImage x86_64) o Apple (DMG arm64 de la aplicación Qt). La sección de descargas siempre muestra **Linux y las dos ediciones de macOS** (la aplicación Qt y Vortia Native, cuyo archivo lleva `-native-` en el nombre), los tamaños y los checksums SHA-256 que existan en la publicación.

`assets/vortia-download.js` consulta `https://api.github.com/repos/getnodalia/vortia/releases/latest` para mostrar los instaladores de la última publicación estable, sin cambiar el sitio cada vez que se publica Vortia. En caso de error de red o límite de la API, usa la versión con la que se generó la página y avisa de que puede no ser la más reciente.

No se ofrecen DMG para Mac Intel ni AppImage para Linux ARM64 cuando no hay un paquete compatible. Los navegadores, especialmente Safari, **no siempre permiten identificar la arquitectura de un Mac**: el botón de macOS indica explícitamente que el DMG es para Apple Silicon. Los enlaces siempre apuntan a GitHub Releases y se comprueba su origen antes de usarlos.

Los SVG de las marcas Apple y Linux proceden de [Simple Icons](https://github.com/simple-icons/simple-icons), proyecto bajo licencia CC0; sus marcas pertenecen a sus respectivos titulares.

## Nodalix OS: ISO

La página Nodalix OS consulta las publicaciones oficiales de [Nodalix OS en GitHub](https://github.com/getnodalia/nodalix-os/releases). Si la versión estable contiene una ISO completa, enlaza a ella; si se distribuye en partes, enlaza al descargador oficial y a las verificaciones disponibles. Nunca muestra un botón ficticio de descarga directa.

Opcionalmente, las ISO íntegras pueden alojarse en un bucket Cloudflare R2 con un subdominio dedicado. La fuente `data/nodalix-iso-releases.json` solo debe editarse al publicar una ISO real, después de verificar nombre, tamaño, URL pública y SHA-256. `assets/nodalix-releases.js` prioriza los enlaces directos de la versión publicada únicamente cuando son verificables.

No subir imágenes ISO a Cloudflare Pages: sus límites de tamaño por archivo son inadecuados para medios de instalación de varios GiB.

## Seguridad y cambios

- Conserva los estados de desarrollo y las limitaciones reales de cada producto.
- Mantén la verificación SHA-256 y las advertencias de instalación de Nodalix OS.
- No añadas tokens, claves, contraseñas, sesiones ni configuraciones de Home Assistant.
- Antes de publicar: ejecuta `npm test`, revisa cambios visuales en escritorio y móvil, y comprueba los enlaces de descarga.
- Las imágenes de las aplicaciones se enlazan desde las ramas oficiales de sus repositorios, no se generan artificialmente.
- Las cabeceras HTTP de seguridad se definen en `assets/_headers` y se copian a cada sitio generado.

## Logotipos para otros repositorios

`assets/brand/` contiene el logotipo de Nodalia en blanco y en negro. No se publican en las webs; los
README de las aplicaciones los enlazan desde este repositorio para mostrar el logotipo en el tema claro
y en el oscuro de GitHub.
