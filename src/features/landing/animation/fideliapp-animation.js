import {
  MOMENT1_META,
  renderMoment1HTML,
  createMoment1Timeline,
  mountMoment1,
} from "./moments/moment1-compra.js";
import {
  MOMENT2_META,
  renderMoment2HTML,
  createMoment2Timeline,
  mountMoment2,
} from "./moments/moment2-escaneo.js";
import {
  MOMENT3_META,
  renderMoment3HTML,
  createMoment3Timeline,
  mountMoment3,
} from "./moments/moment3-progreso.js";
import {
  MOMENT4_META,
  renderMoment4HTML,
  createMoment4Timeline,
  mountMoment4,
} from "./moments/moment4-canje.js";
import {
  MOMENT5_META,
  renderMoment5HTML,
  createMoment5Timeline,
  mountMoment5,
} from "./moments/moment5-recompensa.js";

export {
  MOMENT1_META,
  renderMoment1HTML,
  createMoment1Timeline,
  mountMoment1,
  MOMENT2_META,
  renderMoment2HTML,
  createMoment2Timeline,
  mountMoment2,
  MOMENT3_META,
  renderMoment3HTML,
  createMoment3Timeline,
  mountMoment3,
  MOMENT4_META,
  renderMoment4HTML,
  createMoment4Timeline,
  mountMoment4,
  MOMENT5_META,
  renderMoment5HTML,
  createMoment5Timeline,
  mountMoment5,
};

export const MOMENTS_REGISTRY = {
  1: {
    meta: MOMENT1_META,
    renderHTML: renderMoment1HTML,
    createTimeline: createMoment1Timeline,
    mount: mountMoment1,
    finalPreviewTime: 3.0,
  },
  2: {
    meta: MOMENT2_META,
    renderHTML: renderMoment2HTML,
    createTimeline: createMoment2Timeline,
    mount: mountMoment2,
    finalPreviewTime: 3.0,
  },
  3: {
    meta: MOMENT3_META,
    renderHTML: renderMoment3HTML,
    createTimeline: createMoment3Timeline,
    mount: mountMoment3,
    finalPreviewTime: 3.1,
  },
  4: {
    meta: MOMENT4_META,
    renderHTML: renderMoment4HTML,
    createTimeline: createMoment4Timeline,
    mount: mountMoment4,
    finalPreviewTime: 3.1,
  },
  5: {
    meta: MOMENT5_META,
    renderHTML: renderMoment5HTML,
    createTimeline: createMoment5Timeline,
    mount: mountMoment5,
    finalPreviewTime: 3.2,
  },
};

/**
 * Monta un único momento independiente (1 a 5) en cualquier contenedor de la aplicación.
 */
export function mountSingleMoment(containerEl, momentNumber, options = {}) {
  const target =
    typeof containerEl === "string"
      ? document.querySelector(containerEl)
      : containerEl;
  if (!target) {
    throw new Error(`Contenedor no encontrado para el momento ${momentNumber}`);
  }

  const entry = MOMENTS_REGISTRY[Number(momentNumber)];
  if (!entry) {
    throw new Error(`Momento inválido: ${momentNumber}. Usa un número del 1 al 5.`);
  }

  const gsapInstance = options.gsap || window.gsap;
  const showHud = options.showHud !== false;
  let showCaption = options.showCaption !== false;
  let currentSpeed =
    typeof options.speed === "number" && options.speed > 0 ? options.speed : 1;
  let currentScenePause =
    typeof options.scenePause === "number"
      ? Math.max(0.1, options.scenePause)
      : entry.meta.defaultPause;

  target.innerHTML = `
    <div class="fa-stage fa-stage-single ${showCaption ? "" : "is-caption-hidden"}" data-active-moment="${entry.meta.number}">
      ${
        showHud
          ? `<div class="fa-stage-hud">
              <span class="fa-hud-stage">${entry.meta.stageLabel}</span>
              <span class="fa-hud-dots" aria-hidden="true">
                <span class="fa-hud-dot is-active">0${entry.meta.number}</span>
              </span>
            </div>`
          : ""
      }
      <div class="fa-moments-viewport" aria-hidden="true">
        ${entry.renderHTML()}
      </div>
    </div>
  `;

  const stageEl = target.querySelector(".fa-stage");

  let tl = null;
  function buildSingleTimeline(autoplayNow = true) {
    if (tl) tl.kill();
    tl = entry.createTimeline(target, gsapInstance, {
      scenePause: currentScenePause,
    });
    if (typeof tl.timeScale === "function") {
      tl.timeScale(currentSpeed);
    }
    if (options.loop !== false) {
      tl.repeat(-1);
    }

    const prefersReduced =
      !options.ignoreReducedMotion &&
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) {
      tl.pause(entry.finalPreviewTime, false);
    } else if (!autoplayNow) {
      tl.pause(0);
    }
  }

  buildSingleTimeline(options.autoplay !== false);

  return {
    mode: "moment",
    moment: entry.meta.number,
    get timeline() {
      return tl;
    },
    play: () => tl.play(),
    pause: () => tl.pause(),
    restart: () => tl.restart(),
    setSpeed: (multiplier) => {
      const next = Number(multiplier);
      if (next > 0) {
        currentSpeed = next;
        if (typeof tl.timeScale === "function") {
          tl.timeScale(currentSpeed);
        }
      }
    },
    getSpeed: () => currentSpeed,
    setScenePause: (seconds) => {
      const next = Number(seconds);
      if (!Number.isNaN(next) && next >= 0.1) {
        currentScenePause = next;
        buildSingleTimeline(true);
      }
    },
    getScenePause: () => currentScenePause,
    setShowCaption: (visible) => {
      showCaption = Boolean(visible);
      if (stageEl) {
        stageEl.classList.toggle("is-caption-hidden", !showCaption);
      }
    },
    getShowCaption: () => showCaption,
    destroy: () => {
      if (tl) tl.kill();
      target.innerHTML = "";
    },
  };
}

/**
 * Crea la animación principal de Fideliapp (completa en bucle de 5 momentos o un momento individual).
 *
 * @param {HTMLElement|string} containerEl - Nodo DOM o selector CSS.
 * @param {Object} [options]
 * @param {"full"|"moment"} [options.mode="full"] - "full" para el ciclo completo 1..5, "moment" para una parte individual.
 * @param {number} [options.moment] - Si se especifica 1..5, monta únicamente ese momento.
 * @param {boolean} [options.loop=true] - Si debe repetirse automáticamente en bucle continuo.
 * @param {boolean} [options.autoplay=true] - Si inicia automáticamente.
 * @param {boolean} [options.showHud=true] - Si muestra la barra superior retro con el indicador de etapa (STAGE 01..05).
 * @param {boolean} [options.showCaption=true] - Si muestra la descripción corta de texto para cada escena.
 * @param {number} [options.speed=1] - Multiplicador de velocidad de la animación (ej. 0.5, 1, 1.5, 2).
 * @param {number} [options.scenePause] - Pausa en segundos al final de cada escena antes de pasar a la siguiente.
 * @param {Function} [options.onMomentChange] - Callback invocado cuando cambia el momento activo `(momentMeta) => void`.
 */
export function createFideliappAnimation(containerEl, options = {}) {
  const target =
    typeof containerEl === "string"
      ? document.querySelector(containerEl)
      : containerEl;
  if (!target) {
    throw new Error("No se encontró el contenedor para createFideliappAnimation.");
  }

  if (options.mode === "moment" || (options.moment >= 1 && options.moment <= 5)) {
    return mountSingleMoment(target, options.moment || 1, options);
  }

  const gsapInstance = options.gsap || window.gsap;
  const showHud = options.showHud !== false;
  let showCaption = options.showCaption !== false;
  let currentSpeed =
    typeof options.speed === "number" && options.speed > 0 ? options.speed : 1;
  let currentScenePause =
    typeof options.scenePause === "number"
      ? Math.max(0.1, options.scenePause)
      : undefined;

  target.innerHTML = `
    <div class="fa-stage fa-stage-full ${showCaption ? "" : "is-caption-hidden"}" data-active-moment="1">
      ${
        showHud
          ? `<div class="fa-stage-hud">
              <span class="fa-hud-stage">${MOMENT1_META.stageLabel}</span>
              <div class="fa-hud-dots" role="group" aria-label="Momentos de la animación">
                <button type="button" class="fa-hud-dot is-active" data-goto-moment="1" aria-pressed="true" aria-label="Momento 1: Compra y QR">01</button>
                <button type="button" class="fa-hud-dot" data-goto-moment="2" aria-pressed="false" aria-label="Momento 2: Escaneo y monedas">02</button>
                <button type="button" class="fa-hud-dot" data-goto-moment="3" aria-pressed="false" aria-label="Momento 3: Tarjeta de recompensas">03</button>
                <button type="button" class="fa-hud-dot" data-goto-moment="4" aria-pressed="false" aria-label="Momento 4: Validación del canje">04</button>
                <button type="button" class="fa-hud-dot" data-goto-moment="5" aria-pressed="false" aria-label="Momento 5: Recompensa y ciclo">05</button>
              </div>
            </div>`
          : ""
      }

      <div class="fa-moments-viewport" aria-hidden="true">
        ${renderMoment1HTML()}
        ${renderMoment2HTML()}
        ${renderMoment3HTML()}
        ${renderMoment4HTML()}
        ${renderMoment5HTML()}
        <!-- Cortinilla de transición pixelada rápida entre momentos -->
        <div class="fa-transition-wipe" aria-hidden="true"></div>
      </div>
    </div>
  `;

  const stageEl = target.querySelector(".fa-stage");
  const hudStageText = target.querySelector(".fa-hud-stage");
  const hudDots = target.querySelectorAll(".fa-hud-dot");
  const wipeEl = target.querySelector(".fa-transition-wipe");

  const momentEls = [1, 2, 3, 4, 5].map((num) =>
    target.querySelector(`.fa-moment[data-moment="${num}"]`)
  );

  let currentMomentNumber = 1;
  let master = null;

  function setActiveScene(num) {
    currentMomentNumber = num;
    const meta = MOMENTS_REGISTRY[num]?.meta;
    if (stageEl) stageEl.setAttribute("data-active-moment", String(num));
    if (hudStageText && meta) hudStageText.textContent = meta.stageLabel;

    hudDots.forEach((dot) => {
      const dotNum = Number(dot.getAttribute("data-goto-moment"));
      const active = dotNum === num;
      dot.classList.toggle("is-active", active);
      dot.setAttribute("aria-pressed", String(active));
    });
    if (typeof options.onMomentChange === "function" && meta) {
      options.onMomentChange(meta);
    }
  }

  function buildMasterTimeline(startMoment = 1, shouldPlay = true) {
    if (master) master.kill();

    master = gsapInstance.timeline({
      repeat: options.loop === false ? 0 : -1,
      paused: true,
    });

    master.set(momentEls, { autoAlpha: 0 });
    master.set(momentEls[0], { autoAlpha: 1 });
    master.set(wipeEl, { autoAlpha: 0, scaleY: 0 });

    [1, 2, 3, 4, 5].forEach((num, idx) => {
      const entry = MOMENTS_REGISTRY[num];
      const mEl = momentEls[idx];
      const label = `moment-${num}`;

      master.addLabel(label);
      master.call(() => setActiveScene(num));
      master.set(momentEls, { autoAlpha: 0 });
      master.set(mEl, { autoAlpha: 1 });

      const subTl = entry.createTimeline(target, gsapInstance, {
        scenePause: currentScenePause,
      });
      master.add(subTl);

      // Transición pixelada rápida en el mismo escenario hacia el siguiente momento
      master.fromTo(
        wipeEl,
        { autoAlpha: 1, scaleY: 0, transformOrigin: "50% 0%" },
        { scaleY: 1, duration: 0.08, ease: "steps(2)" }
      );
      master.to(wipeEl, {
        autoAlpha: 0,
        scaleY: 0,
        transformOrigin: "50% 100%",
        duration: 0.08,
        ease: "steps(2)",
      });
    });

    if (typeof master.timeScale === "function") {
      master.timeScale(currentSpeed);
    }

    const prefersReduced =
      !options.ignoreReducedMotion &&
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) {
      master.seek(`moment-3+=${MOMENTS_REGISTRY[3].finalPreviewTime}`, false).pause();
      setActiveScene(3);
    } else if (shouldPlay) {
      master.play(`moment-${startMoment}`);
    } else {
      master.seek(`moment-${startMoment}`, false).pause();
      setActiveScene(startMoment);
    }
  }

  buildMasterTimeline(1, options.autoplay !== false);

  // Permitir saltar a un momento al hacer clic en los indicadores 01..05 de la barra superior
  hudDots.forEach((dot) => {
    dot.addEventListener("click", () => {
      const num = Number(dot.getAttribute("data-goto-moment"));
      if (num >= 1 && num <= 5 && master) {
        const prefersReduced =
          !options.ignoreReducedMotion &&
          typeof window !== "undefined" &&
          window.matchMedia &&
          window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (prefersReduced) {
          const preview = MOMENTS_REGISTRY[num]?.finalPreviewTime ?? 0;
          master.seek(`moment-${num}+=${preview}`, false).pause();
          setActiveScene(num);
        } else {
          master.play(`moment-${num}`);
        }
      }
    });
  });

  return {
    mode: "full",
    get timeline() {
      return master;
    },
    play: () => master.play(),
    pause: () => master.pause(),
    restart: () => master.restart(),
    seekMoment: (num, playAfter = true) => {
      if (num >= 1 && num <= 5 && master) {
        if (playAfter) {
          master.play(`moment-${num}`);
        } else {
          master.seek(`moment-${num}`).pause();
        }
      }
    },
    setSpeed: (multiplier) => {
      const next = Number(multiplier);
      if (next > 0) {
        currentSpeed = next;
        if (master && typeof master.timeScale === "function") {
          master.timeScale(currentSpeed);
        }
      }
    },
    getSpeed: () => currentSpeed,
    setScenePause: (seconds) => {
      const next = Number(seconds);
      if (!Number.isNaN(next) && next >= 0.1) {
        currentScenePause = next;
        buildMasterTimeline(currentMomentNumber, true);
      }
    },
    getScenePause: () =>
      typeof currentScenePause === "number" ? currentScenePause : 1.2,
    setShowCaption: (visible) => {
      showCaption = Boolean(visible);
      if (stageEl) {
        stageEl.classList.toggle("is-caption-hidden", !showCaption);
      }
    },
    getShowCaption: () => showCaption,
    getActiveMoment: () => currentMomentNumber,
    destroy: () => {
      if (master) master.kill();
      target.innerHTML = "";
    },
  };
}

/**
 * Auto-inicializa cualquier elemento del DOM con data-fideliapp-animation="full"
 * o data-fideliapp-moment="1..5".
 */
export function autoMountFideliappAnimations(root = document) {
  const instances = [];
  root.querySelectorAll("[data-fideliapp-animation]").forEach((el) => {
    const val = el.getAttribute("data-fideliapp-animation");
    const momentAttr = el.getAttribute("data-fideliapp-moment");
    const captionAttr = el.getAttribute("data-fideliapp-caption");
    const speedAttr = el.getAttribute("data-fideliapp-speed");
    const pauseAttr = el.getAttribute("data-fideliapp-pause");

    const commonOpts = {
      showCaption: captionAttr !== "false",
      speed: speedAttr ? Number(speedAttr) : 1,
      scenePause: pauseAttr ? Number(pauseAttr) : undefined,
    };

    if (momentAttr || (val && /^[1-5]$/.test(val))) {
      instances.push(
        createFideliappAnimation(el, {
          ...commonOpts,
          mode: "moment",
          moment: Number(momentAttr || val),
        })
      );
    } else {
      instances.push(
        createFideliappAnimation(el, {
          ...commonOpts,
          mode: "full",
        })
      );
    }
  });
  return instances;
}
