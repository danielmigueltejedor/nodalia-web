# Nodalia Web — getnodalia.com y subdominios

Web oficial y páginas de producto independientes, generadas a partir de un único proyecto. **No modifica el código de Vortia, Vinilo, Lienzo ni Nodalix OS.**

## Contenido

| Proyecto de Cloudflare Pages | Dominio | Directorio compilado |
| --- | --- | --- |
| `nodalia-portal` | `getnodalia.com` | `dist/portal` |
| `nodalia-vortia` | `vortia.getnodalia.com` | `dist/vortia` |
| `nodalia-vinilo` | `vinilo.getnodalia.com` | `dist/vinilo` |
| `nodalia-lienzo` | `lienzo.getnodalia.com` | `dist/lienzo` |
| `nodalia-nodalix` | `nodalix.getnodalia.com` | `dist/nodalix` |

**Importante:** los nombres de proyecto sugeridos en la primera columna deben estar disponibles en Cloudflare. Si eliges otros, utiliza sus nombres reales en los CNAME. Por ahora no se ha publicado ninguna web ni tocado DNS.

## Probar localmente

Node.js 20+; sin `npm install`, dependencias ni backend:

```bash
npm run build
npm test
cd dist/portal
python3 -m http.server 8080
```

Abrir http://localhost:8080 para el portal. Para los subdominios, ejecutar el servidor desde `dist/vortia`, `dist/vinilo`, `dist/lienzo` o `dist/nodalix`.

Los iconos y capturas se cargan desde la rama `main` de los repositorios originales en GitHub. Si cambian sus rutas, actualiza `scripts/data.mjs`. Para máxima disponibilidad, se recomienda copiar esos recursos a `assets/` en una iteración posterior.

## GitHub y despliegue Cloudflare Pages

1. Crea en tu cuenta de GitHub un repositorio llamado **`nodalia-web`** y sube estos archivos a `main` (no subas `dist`, que se genera al publicar).
2. En Cloudflare → **Workers & Pages → Create → Pages → Connect to Git**, enlaza ese repositorio.
3. Configura 5 proyectos separados usando el mismo repositorio. En cada proyecto:
   - Root directory: `/` (raíz del repo).
   - Framework preset: **None**.
   - Build command: `node scripts/build.mjs`.
   - Build output directory: `dist/portal`, `dist/vortia`, `dist/vinilo`, `dist/lienzo` o `dist/nodalix`, respectivamente.
   - Production branch: `main`.
   - Node.js: 20 o superior.
4. Publica y comprueba que funcionan las direcciones `*.pages.dev` reales asignadas por Cloudflare.
5. Dentro de cada proyecto, **Custom domains → Set up a domain**, añade su dominio personalizado correspondiente.
6. Para los subdominios, en el panel DNS autoritativo de Hostinger crea un registro CNAME: `vortia` → `nodalia-vortia.pages.dev`, `vinilo` → `nodalia-vinilo.pages.dev`, `lienzo` → `nodalia-lienzo.pages.dev`, `nodalix` → `nodalia-nodalix.pages.dev`. Solo si esos son efectivamente los nombres de tus proyectos. **Asocia primero el dominio personalizado desde Cloudflare**.

### Importante: getnodalia.com (dominio raíz)

Cloudflare Pages requiere tener una zona DNS de Cloudflare y apuntar los **nameservers** del dominio a Cloudflare para publicar el dominio raíz `getnodalia.com`. **No cambies los nameservers precipitadamente**: antes exporta/replica en Cloudflare todos los DNS que ya tienes en Hostinger, en particular MX/SPF/DKIM/DMARC del correo `hola@getnodalia.com`, registros de verificación, CNAME y servicios existentes. Comprueba las entradas, luego cambia los nameservers desde Hostinger. Con ello, Hostinger sigue siendo tu registrador; Cloudflare pasa a gestionar DNS.

Si no deseas migrar DNS todavía, publica primero los subdominios (sin cambiar nameservers) y mantén el portal principal pendiente. Otra opción es publicar temporalmente el portal en `www.getnodalia.com` mediante CNAME.

### Precaución de escalabilidad

La documentación de Cloudflare Pages actualmente indica un máximo de **5 proyectos de Pages conectados al mismo repositorio** (salvo ampliación). Este diseño utiliza cinco: portal, Vortia, Vinilo, Lienzo y Nodalix OS. Ya alcanza ese límite. Cuando añadas más aplicaciones, podrás separar los proyectos web en otro repositorio o solicitar ampliación; no necesitas rediseñar las páginas.

### Seguridad

- Nunca subas credenciales de Hostinger, Cloudflare, tokens privados ni contraseñas al repositorio.
- Si usas un correo de Hostinger, preserva sus registros DNS en la migración.
- Las descargas enlazan a los archivos oficiales existentes en GitHub Releases o, cuando lo configures, a ISO verificadas publicadas en Cloudflare R2. No se inventan archivos ni versiones.
- El sitio es estático, no recoge datos ni usa cookies propias ni analítica. La tipografía utiliza Google Fonts y las imágenes se cargan desde GitHub; revisa estos terceros antes de publicar una política de privacidad definitiva.

## Nodalix OS: ISO para memorias USB y discos

La página `nodalix.getnodalia.com` es distinta de una página de una aplicación: incluye características del sistema, guía de instalación, arquitectura x86_64, requisitos de Secure Boot, verificación de hash y descargas oficiales.

**Estado actual:** la web usa la API pública de GitHub Releases como fuente de versiones de `danielmigueltejedor/nodalix-os`. Si una release estable contiene una `.iso`, crea un enlace directo a ese asset. Si la imagen se ha dividido en `.iso.part01`, `.iso.part02`, etc., enlaza al descargador oficial `nodalix-download-iso.py`, a las partes y a sus checksums (si existen). No muestra una ISO directa ficticia. Si no se encuentra un archivo válido o falla la API, enlaza a GitHub Releases.

### Descarga de una sola ISO (Cloudflare R2, recomendada)

Cloudflare Pages aloja la **web**, no las ISO. Sus assets tienen un límite de 25 MiB. Para ISO de varios GiB, recomiendo **Cloudflare R2**, con un bucket `nodalix-isos` y un dominio opcional `downloads.getnodalia.com`. Este dominio requiere que la zona DNS de `getnodalia.com` esté incorporada a Cloudflare en la misma cuenta que el bucket; si de momento mantienes los nameservers de Hostinger sin una configuración Cloudflare compatible, se debe resolver primero la parte DNS. **No crees un CNAME manual a `*.r2.dev`**: Cloudflare no lo admite como configuración de producción. No cambies nameservers sin preservar los registros de correo de Hostinger.

1. Compila, prueba y verifica criptográficamente la ISO de la release de Nodalix OS antes de distribuirla. No subas imágenes que contengan secretos de usuario o claves privadas.
2. Sube al bucket R2 la ISO final íntegra, preferiblemente en una ruta con versión inmutable, por ejemplo `stable/<VERSION>/nodalix-<VERSION>-x86_64.iso`. Comprueba que es accesible públicamente desde la URL real de tu dominio R2 y que el tamaño y el SHA-256 coinciden con la release.
3. Añade un objeto real al archivo `data/nodalix-iso-releases.json`, por ejemplo este **FORMATO DE EJEMPLO NO PUBLICABLE** (los valores entre `<...>` deben sustituirse):

```json
{
  "schema": 1,
  "isos": [
    {
      "version": "<VERSION>",
      "channel": "stable",
      "url": "https://downloads.getnodalia.com/stable/<VERSION>/nodalix-<VERSION>-x86_64.iso",
      "sizeBytes": 0,
      "sha256": "<SHA256-REAL-DE-64-CARACTERES-HEXADECIMALES>",
      "publishedAt": "2026-11-05T12:00:00Z"
    }
  ]
}
```

El ejemplo **no pasa la validación** mientras no se reemplacen el tamaño y SHA por valores reales. Un `npm run build:nodalix` copia ese manifiesto a `dist/nodalix/releases.json`. El navegador prioriza la ISO completa de R2 si coincide con la versión publicada en GitHub; en caso de aparecer una nueva versión en GitHub que aún no tenga copia en R2, presenta su descarga oficial, incluso si viene dividida en partes.

4. Configura un flujo de publicación de ISO en el repositorio Nodalix OS que automatice la subida a R2 tras las pruebas, hashes y firma de release; publica el manifiesto únicamente una vez que hayas comprobado su URL y SHA. El paquete inicial **no incluye acceso a R2 ni automatización con credenciales**: son pasos pendientes de configurar.

**Costes:** R2 ofrece 10 GB-mes de almacenamiento estándar sin coste y sin cargos de salida de datos; el espacio y las operaciones por encima del cupo sí se facturan. Revisa los precios vigentes antes de publicar varias ISO grandes. GitHub Releases sigue siendo el archivo principal de versiones.

Documentación oficial: https://developers.cloudflare.com/pages/platform/limits/ y https://developers.cloudflare.com/r2/buckets/public-buckets/

## Añadir una nueva aplicación

Edita `scripts/data.mjs`, añade un objeto con un nuevo ID, dominio, textos y enlaces reales. `node scripts/build.mjs` genera automáticamente el nuevo sitio y la ficha del catálogo. Después crea su proyecto Pages y su subdominio. Revisa el límite de proyectos por repositorio.

## Personalización

- Contenidos y capturas: `scripts/data.mjs`.
- Estilos compartidos: `assets/styles.css`.
- Logotipo provisional: `assets/logo.svg` (reemplázalo por la identidad oficial cuando esté definida).
- Plantillas y generación de SEO: `scripts/build.mjs`.

El logotipo SVG incluido es una representación **provisional**, no el logotipo oficial de Nodalia.

## Estado actual

- [x] Portal principal y páginas de Vortia, Vinilo, Lienzo y Nodalix OS preparadas.
- [x] Área de descargas de Nodalix OS con detección de ISO directa, ISO en partes, enlace al descargador oficial y verificación SHA-256 cuando exista.
- [x] Metadatos SEO, canonical, `robots.txt`, `sitemap.xml`, responsive, accesibilidad básica.
- [x] Compilación sin dependencias externas de JavaScript.
- [ ] Subir a GitHub (requiere crear repo).
- [ ] Enlazar proyectos Cloudflare Pages.
- [ ] Configurar subdominios y dominio raíz sin afectar al correo.
- [ ] Verificar sitios públicamente tras el despliegue.
- [ ] Subir las ISO completas a Cloudflare R2 y publicar su manifiesto real (si se quiere descarga en un solo clic).

Fuentes: https://developers.cloudflare.com/pages/configuration/custom-domains/ y https://developers.cloudflare.com/pages/configuration/monorepos/
