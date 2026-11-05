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

Dirección visual editorial: colores neutros, tipografía de sistema, estructura basada en jerarquía y líneas; sin mockups falsos, gradientes decorativos, ventanas simuladas ni promesas de funciones no publicadas. Las capturas disponibles se enlazan desde los repositorios oficiales y se identifican como tales. Si un proyecto aún no dispone de capturas oficiales, se muestra una ficha de estado.

- `assets/styles.css`: único sistema de estilos.
- `assets/nodalia-wordmark.svg` / `assets/nodalia-mark.svg`: identidad compartida.
- `scripts/data.mjs`: nombres, estados, enlaces y capturas reales de cada producto.
- `scripts/build.mjs`: páginas, metadatos, SEO, sitemap y recursos.
- `scripts/test.mjs`: validación de los cinco sitios y del manifiesto ISO.

No hay framework ni dependencia npm de ejecución. Las páginas no contienen trackers, analítica ni cookies propios. Los iconos y capturas de los proyectos provienen de GitHub; algunos recursos externos pueden registrar solicitudes según sus propias políticas.

## Desarrollo

Requiere Node.js 20 o superior.

~~~bash
npm test
npm run build
~~~

Para previsualizar, por ejemplo, el portal:

~~~bash
cd dist/portal
python3 -m http.server 8080
~~~

Abre http://localhost:8080. Otras carpetas generadas: `dist/vortia`, `dist/vinilo`, `dist/lienzo`, `dist/nodalix`.

Para generar solo un sitio: `npm run build:portal`, `npm run build:vortia`, `npm run build:vinilo`, `npm run build:lienzo` o `npm run build:nodalix`.

## Publicación en Cloudflare

Los cinco proyectos Pages ya fueron creados mediante **Direct Upload / Wrangler** y enlazados a sus dominios definitivos. Por tanto, **un push a GitHub no actualiza las webs automáticamente**. El workflow de CI de GitHub solo ejecuta las pruebas: no publica ni necesita tokens.

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

Para automatizar el despliegue en el futuro, configurar GitHub Actions con credenciales limitadas de Cloudflare Pages, guardadas como *GitHub Actions Secrets* y nunca en el código. No es necesario modificar DNS, los otros subdominios privados de Cloudflare ni los registros de correo.

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
