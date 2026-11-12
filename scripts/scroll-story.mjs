const stories = {
  portal: {
    title: 'Un escritorio, muchas formas de hacer.',
    chapters: [
      ['Un sistema para el día a día', 'Nodalix OS reúne escritorio, ajustes y actualizaciones en un solo sistema.'],
      ['Herramientas para cada tarea', 'Escucha con Vinilo, edita por capas con Lienzo y simula fluidos con Vortia.'],
      ['Un lenguaje visual común', 'Las aplicaciones comparten el diseño de Nodalia y también funcionan por separado.'],
    ],
    next: 'aplicaciones',
  },
  vortia: {
    title: 'De una forma a un campo de flujo.',
    chapters: [
      ['Dibuja la geometría', 'Define la forma de la tobera y el dominio donde vas a simular el flujo.'],
      ['Divide el dominio en celdas', 'Genera la malla y revisa su calidad antes de ejecutar el cálculo.'],
      ['Lee el campo de velocidad', 'Ejecuta el caso con OpenFOAM e inspecciona el resultado en el visor 3D.'],
    ],
    next: 'funciones',
  },
  vinilo: {
    title: 'Así empieza una sesión de escucha.',
    chapters: [
      ['Elige la fuente', 'Busca en tus archivos locales o en los catálogos compatibles desde Vinilo.'],
      ['Pon la música en marcha', 'Abre el reproductor para ver la portada y controlar la reproducción.'],
      ['Decide qué suena después', 'Abre la cola desde el reproductor para ver y ordenar las próximas pistas.'],
    ],
    next: 'funciones',
  },
  lienzo: {
    title: 'Una imagen, capa a capa.',
    chapters: [
      ['Empieza por la imagen', 'Abre un documento y trabaja sobre la imagen de base.'],
      ['Añade un ajuste', 'Una capa de curvas permite cambiar los tonos conservando la imagen original.'],
      ['Revisa la composición', 'El resultado combina la imagen y sus ajustes. Cada capa sigue siendo editable.'],
    ],
    next: 'funciones',
  },
  forja: {
    title: 'Del primer trazo al plano impreso.',
    chapters: [
      ['Dibuja desde la línea de comandos', 'Escribe una orden, marca dos puntos y sigue con coordenadas relativas o polares.'],
      ['Lleva el plano al papel', 'Una presentación coloca el dibujo a escala en la hoja y lo traza en PDF.'],
      ['Trabaja a tu manera', 'Cambia al tema claro o a otro idioma sin cerrar el dibujo.'],
    ],
    next: 'funciones',
  },
  nodalix: {
    title: 'Del escritorio a los ajustes.',
    chapters: [
      ['Abre tu espacio de trabajo', 'El escritorio y el dock te dan acceso a tus aplicaciones.'],
      ['Cambia lo necesario al vuelo', 'Abre los ajustes rápidos desde la barra superior.'],
      ['Actualiza desde un solo sitio', 'Configuración reúne actualizaciones del sistema, paquetes, aplicaciones y firmware.'],
    ],
    next: 'funciones',
  },
};

export function scrollStory(id, apps, { e, safeUrl }) {
  const { title, chapters, next } = stories[id];
  const app = apps.find((item) => item.id === id);
  const picture = (product, index) => {
    const [url] = product.previews[index];
    const localPath = new URL(url).pathname;
    // Screenshots the site serves itself load from the same origin; the rest come from GitHub.
    const src = product.localScreens.some((file) => localPath === `/${product.id}${file}`) ? e(localPath) : safeUrl(url);
    return `<img src="${src}" alt="" loading="lazy" decoding="async"/>`;
  };
  const screenshot = (index, className) => `<figure class="story-screen ${className}">${picture(app, index)}</figure>`;
  const plate = (name) => {
    const product = apps.find((item) => item.id === name);
    return `<figure class="story-plate story-plate--${name}">${picture(product, 0)}<figcaption translate="no">${e(product.name)}</figcaption></figure>`;
  };
  const visuals = {
    portal: () => `<div class="story-contact-sheet">
      ${plate('nodalix')}${plate('vinilo')}${plate('lienzo')}${plate('vortia')}
      <img class="story-imprint" src="/nodalia-wordmark.svg" alt="" width="118" height="30"/>
    </div>`,
    vortia: () => `<canvas class="story-drawing" data-story-canvas="nozzle"></canvas>${screenshot(0, 'story-vortia-result')}`,
    vinilo: () => `<div class="story-turntable"><div class="story-disc"></div><div class="story-arm"></div></div><div class="story-sources">
      <span>Este equipo</span><span translate="no">Apple Music</span><span translate="no">Spotify</span>
      <span translate="no">YouTube Music</span><span translate="no">Tidal</span>
    </div><div class="story-player">${screenshot(0, 'story-vinilo-player')}${screenshot(1, 'story-vinilo-queue')}</div>`,
    lienzo: () => `<div class="story-print"><div class="story-print-paper">${picture(app, 0)}</div>
      <div class="story-print-proof">${picture(app, 0)}</div><div class="story-print-edge"></div>
    </div><canvas class="story-curve" data-story-canvas="curve"></canvas>
      ${screenshot(1, 'story-lienzo-curves')}`,
    forja: () => `<div class="story-drafting">${screenshot(0, 'story-forja-model')}<span class="story-forja-cursor"></span>${screenshot(1, 'story-forja-layout')}${screenshot(2, 'story-forja-light')}</div>`,
    nodalix: () => `<div class="story-monitor">${screenshot(0, 'story-desktop')}${screenshot(1, 'story-settings')}
      <span class="story-system-cursor"></span>${screenshot(2, 'story-updates')}</div>`,
  };
  return `<section id="demostracion" class="scroll-story scroll-story--${id}" data-scroll-story="${id}" aria-labelledby="story-title">
    <div class="story-pin" data-story-pin>
      <div class="container story-layout">
        <header class="story-heading">
          <h2 id="story-title">${e(title)}</h2>
        </header>
        <div class="story-stage" aria-hidden="true">${visuals[id]()}</div>
        <div class="story-details">
          <div class="story-progress" aria-hidden="true">${chapters.map(() => '<i></i>').join('')}</div>
          <ol class="story-chapters">${chapters.map(([name, description], i) => `
            <li data-story-chapter="${i + 1}"><h3>${e(name)}</h3><p>${e(description)}</p></li>`).join('')}
          </ol>
          <a class="story-skip text-link" href="#${next}">Saltar la demostración <span aria-hidden="true">↓</span></a>
        </div>
      </div>
    </div>
  </section>`;
}
