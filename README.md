# Nodalia Web — getnodalia.com y subdominios

Web oficial y páginas de producto independientes, generadas a partir de un único proyecto. **No modifica el código de Vortia, Vinilo ni Lienzo.**

## Contenido

| Proyecto de Cloudflare Pages | Dominio | Directorio compilado |
| --- | --- | --- |
| `nodalia-portal` | `getnodalia.com` | `dist/portal` |
| `nodalia-vortia` | `vortia.getnodalia.com` | `dist/vortia` |
| `nodalia-vinilo` | `vinilo.getnodalia.com` | `dist/vinilo` |
| `nodalia-lienzo` | `lienzo.getnodalia.com` | `dist/lienzo` |

**Importante:** los nombres de proyecto sugeridos en la primera columna deben estar disponibles en Cloudflare. Si eliges otros, utiliza sus nombres reales en los CNAME. Por ahora no se ha publicado ninguna web ni tocado DNS.

## Probar localmente

Node.js 20+; sin `npm install`, dependencias ni backend:

```bash
npm run build
cd dist/portal
python3 -m http.server 8080
```

Abrir http://localhost:8080 para el portal. Para los subdominios, ejecutar el servidor desde `dist/vortia`, `dist/vinilo`, o `dist/lienzo`.

Los iconos y capturas se cargan desde la rama `main` de los repositorios originales en GitHub. Si cambian sus rutas, actualiza `scripts/data.mjs`. Para máxima disponibilidad, se recomienda copiar esos recursos a `assets/` en una iteración posterior.

## GitHub y despliegue Cloudflare Pages

1. Crea en tu cuenta de GitHub un repositorio llamado **`nodalia-web`** y sube estos archivos a `main` (no subas `dist`, que se genera al publicar).
2. En Cloudflare → **Workers & Pages → Create → Pages → Connect to Git**, enlaza ese repositorio.
3. Configura 4 proyectos separados usando el mismo repositorio. En cada proyecto:
   - Root directory: `/` (raíz del repo).
   - Framework preset: **None**.
   - Build command: `node scripts/build.mjs`.
   - Build output directory: `dist/portal`, `dist/vortia`, `dist/vinilo` o `dist/lienzo`, respectivamente.
   - Production branch: `main`.
   - Node.js: 20 o superior.
4. Publica y comprueba que funcionan las direcciones `*.pages.dev` reales asignadas por Cloudflare.
5. Dentro de cada proyecto, **Custom domains → Set up a domain**, añade su dominio personalizado correspondiente.
6. Para los subdominios, en el panel DNS autoritativo de Hostinger crea un registro CNAME: `vortia` → `nodalia-vortia.pages.dev`, `vinilo` → `nodalia-vinilo.pages.dev`, `lienzo` → `nodalia-lienzo.pages.dev`. Solo si esos son efectivamente los nombres de tus proyectos. **Asocia primero el dominio personalizado desde Cloudflare**.

### Importante: getnodalia.com (dominio raíz)

Cloudflare Pages requiere tener una zona DNS de Cloudflare y apuntar los **nameservers** del dominio a Cloudflare para publicar el dominio raíz `getnodalia.com`. **No cambies los nameservers precipitadamente**: antes exporta/replica en Cloudflare todos los DNS que ya tienes en Hostinger, en particular MX/SPF/DKIM/DMARC del correo `hola@getnodalia.com`, registros de verificación, CNAME y servicios existentes. Comprueba las entradas, luego cambia los nameservers desde Hostinger. Con ello, Hostinger sigue siendo tu registrador; Cloudflare pasa a gestionar DNS.

Si no deseas migrar DNS todavía, publica primero los subdominios (sin cambiar nameservers) y mantén el portal principal pendiente. Otra opción es publicar temporalmente el portal en `www.getnodalia.com` mediante CNAME.

### Precaución de escalabilidad

La documentación de Cloudflare Pages actualmente indica un máximo de **5 proyectos de Pages conectados al mismo repositorio** (salvo ampliación). Este diseño utiliza cuatro. Cuando añadas más aplicaciones, podrás separar los proyectos web en otro repositorio o solicitar ampliación; no necesitas rediseñar las páginas.

### Seguridad

- Nunca subas credenciales de Hostinger, Cloudflare, tokens privados ni contraseñas al repositorio.
- Si usas un correo de Hostinger, preserva sus registros DNS en la migración.
- Las descargas enlazan a GitHub, no se ofrecen instaladores inexistentes.
- El sitio es estático, no recoge datos ni usa cookies propias ni analítica. La tipografía utiliza Google Fonts y las imágenes se cargan desde GitHub; revisa estos terceros antes de publicar una política de privacidad definitiva.

## Añadir una nueva aplicación

Edita `scripts/data.mjs`, añade un objeto con un nuevo ID, dominio, textos y enlaces reales. `node scripts/build.mjs` genera automáticamente el nuevo sitio y la ficha del catálogo. Después crea su proyecto Pages y su subdominio. Revisa el límite de proyectos por repositorio.

## Personalización

- Contenidos y capturas: `scripts/data.mjs`.
- Estilos compartidos: `assets/styles.css`.
- Logotipo provisional: `assets/logo.svg` (reemplázalo por la identidad oficial cuando esté definida).
- Plantillas y generación de SEO: `scripts/build.mjs`.

El logotipo SVG incluido es una representación **provisional**, no el logotipo oficial de Nodalia.

## Estado actual

- [x] Portal principal y páginas de Vortia, Vinilo y Lienzo preparadas.
- [x] Metadatos SEO, canonical, `robots.txt`, `sitemap.xml`, responsive, accesibilidad básica.
- [x] Compilación sin dependencias externas de JavaScript.
- [ ] Subir a GitHub (requiere crear repo).
- [ ] Enlazar proyectos Cloudflare Pages.
- [ ] Configurar subdominios y dominio raíz sin afectar al correo.
- [ ] Verificar sitios públicamente tras el despliegue.

Fuentes: https://developers.cloudflare.com/pages/configuration/custom-domains/ y https://developers.cloudflare.com/pages/configuration/monorepos/
