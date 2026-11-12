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
  const screenshot = (index, className) => {
    const [url] = app.previews[index];
    // Reuse the product's existing images, including the local Lienzo captures.
    return `<figure class="story-screen ${className}"><img src="${safeUrl(url)}" alt="" loading="lazy" decoding="async"/></figure>`;
  };
  const appNode = (name) => {
    const product = apps.find((item) => item.id === name);
    return `<span class="story-node story-node--${name}"><img src="${safeUrl(product.icon)}" alt="" width="60" height="60" loading="lazy" decoding="async"/><span translate="no">${e(product.name)}</span></span>`;
  };
  const visuals = {
    portal: () => `<div class="story-network">
      <div class="story-network-lines"></div><div class="story-network-ring"></div>
      <div class="story-brand"><img src="/nodalia-mark.svg" alt="" width="76" height="76"/></div>
      ${appNode('nodalix')}${appNode('vinilo')}${appNode('lienzo')}${appNode('vortia')}
    </div>`,
    vortia: () => `<div class="story-nozzle"><div class="story-nozzle-shell"></div><div class="story-nozzle-mesh"></div><div class="story-nozzle-flow"></div></div>
      ${screenshot(0, 'story-vortia-result')}`,
    vinilo: () => `<div class="story-disc"></div><div class="story-sources">
      <span>Este equipo</span><span translate="no">Apple Music</span><span translate="no">Spotify</span>
      <span translate="no">YouTube Music</span><span translate="no">Tidal</span>
    </div>${screenshot(0, 'story-vinilo-player')}${screenshot(1, 'story-vinilo-queue')}`,
    lienzo: () => `<div class="story-layer story-layer--base"></div><div class="story-layer story-layer--adjustment"></div>
      ${screenshot(0, 'story-lienzo-image')}${screenshot(1, 'story-lienzo-curves')}`,
    nodalix: () => `${screenshot(0, 'story-desktop')}${screenshot(1, 'story-settings')}${screenshot(2, 'story-updates')}`,
  };
  return `<section id="demostracion" class="scroll-story scroll-story--${id}" data-scroll-story aria-labelledby="story-title">
    <div class="story-pin" data-story-pin>
      <div class="container story-layout">
        <header class="story-heading">
          <h2 id="story-title">${e(title)}</h2>
        </header>
        <div class="story-stage" aria-hidden="true">${visuals[id]()}</div>
        <div class="story-details">
          <p class="story-instruction">Desplázate para ver los tres pasos.</p>
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
