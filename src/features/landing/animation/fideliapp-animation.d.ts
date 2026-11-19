// Tipos mínimos para el módulo JS de la animación principal (copiado de /animacionPrincipal).
export interface FideliappMomentMeta {
  id: string;
  number: 1 | 2 | 3 | 4 | 5;
  stageLabel: string;
  title: string;
  description: string;
  duration: number;
  defaultPause: number;
}

export interface FideliappAnimationOptions {
  mode?: "full" | "moment";
  moment?: number;
  loop?: boolean;
  autoplay?: boolean;
  showHud?: boolean;
  showCaption?: boolean;
  speed?: number;
  scenePause?: number;
  ignoreReducedMotion?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  gsap?: any;
  onMomentChange?: (meta: FideliappMomentMeta) => void;
}

export interface FideliappAnimationController {
  mode: "full" | "moment";
  play: () => void;
  pause: () => void;
  restart: () => void;
  seekMoment?: (num: number, playAfter?: boolean) => void;
  setSpeed: (multiplier: number) => void;
  setShowCaption: (visible: boolean) => void;
  getActiveMoment?: () => number;
  destroy: () => void;
}

export function createFideliappAnimation(
  containerEl: HTMLElement | string,
  options?: FideliappAnimationOptions,
): FideliappAnimationController;
