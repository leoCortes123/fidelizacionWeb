import { useEffect, useRef } from "react";
import { gsap } from "gsap";

import {
  createFideliappAnimation,
  type FideliappAnimationController,
} from "./animation/fideliapp-animation.js";
import "./animation/fideliapp-animation.css";

export interface ProcessAnimationProps {
  /** Sin `moment` reproduce el ciclo completo 1..5; con `moment` monta solo esa escena. */
  moment?: 1 | 2 | 3 | 4 | 5;
  showHud?: boolean;
  showCaption?: boolean;
  /** Permite pausar externamente la animación (WCAG 2.2.2). */
  paused?: boolean;
  /** Se invoca cuando el ciclo completo cambia de escena. */
  onMomentChange?: (moment: number) => void;
  label: string;
  className?: string;
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Envoltorio React de la animación pixel-art (GSAP) del proceso de fidelización.
 * Se carga de forma diferida desde la landing para no penalizar el LCP y se pausa
 * automáticamente cuando sale del viewport para ahorrar batería en móvil.
 */
export default function ProcessAnimation({
  moment,
  showHud = true,
  showCaption = true,
  paused = false,
  onMomentChange,
  label,
  className = "",
}: ProcessAnimationProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const controllerRef = useRef<FideliappAnimationController | null>(null);
  const pausedRef = useRef(paused);
  const visibleRef = useRef(true);
  const onChangeRef = useRef(onMomentChange);
  pausedRef.current = paused;
  onChangeRef.current = onMomentChange;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let controller: FideliappAnimationController | null = null;
    try {
      controller = createFideliappAnimation(el, {
        gsap,
        mode: moment ? "moment" : "full",
        moment,
        loop: true,
        autoplay: !pausedRef.current,
        showHud,
        showCaption,
        onMomentChange: (meta) => onChangeRef.current?.(meta.number),
      });
      controllerRef.current = controller;
    } catch {
      // Entornos sin soporte (p. ej. pruebas sin layout): la página sigue siendo usable sin animación.
    }

    let observer: IntersectionObserver | null = null;
    if (controller && typeof IntersectionObserver === "function") {
      observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (!entry || !controllerRef.current) return;
          visibleRef.current = entry.isIntersecting;
          if (prefersReducedMotion() || pausedRef.current) return;
          if (entry.isIntersecting) {
            controllerRef.current.play();
          } else {
            controllerRef.current.pause();
          }
        },
        { threshold: 0.1 },
      );
      observer.observe(el);
    }

    return () => {
      observer?.disconnect();
      controllerRef.current = null;
      controller?.destroy();
    };
  }, [moment, showHud, showCaption]);

  useEffect(() => {
    const controller = controllerRef.current;
    if (!controller || prefersReducedMotion()) return;
    if (paused) {
      controller.pause();
    } else if (visibleRef.current) {
      controller.play();
    }
  }, [paused]);

  return <div ref={containerRef} className={className} role="group" aria-label={label} />;
}
