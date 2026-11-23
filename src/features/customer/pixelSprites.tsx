import type { ReactNode } from "react";

export type PixelSpriteKey =
  "fries" | "shake" | "burger" | "beer" | "coffee" | "cookie" | "pizza" | "gelato";

const STAGE_GRADIENTS = [
  "linear-gradient(135deg, #dce7ec 0%, #fad24b 100%)",
  "linear-gradient(135deg, #dce7ec 0%, #1765cc 100%)",
  "linear-gradient(135deg, #dce7ec 0%, #2b4652 100%)",
  "linear-gradient(135deg, #dce7ec 0%, #169c35 100%)",
] as const;

const REWARD_THUMBS = ["#fad24b", "#1765cc", "#169c35", "#2b4652", "#fce49d"] as const;
const PRODUCT_THUMBS = ["#dce7ec", "#fce49d", "#edf3f5", "#fad24b"] as const;

const SPRITE_KEYS: PixelSpriteKey[] = [
  "burger",
  "coffee",
  "pizza",
  "gelato",
  "fries",
  "shake",
  "cookie",
  "beer",
];

export function detectSpriteKey(text: string, fallbackIndex = 0): PixelSpriteKey {
  const normalized = text.toLowerCase();
  if (/cafe|café|coffee|cappuccino|espresso|latte|alquim/.test(normalized)) return "coffee";
  if (/galleta|cookie|croissant|pan|pastel|torta|postre|brownie/.test(normalized)) return "cookie";
  if (/pizza|pepperoni|napolitana|margarita|italiana/.test(normalized)) return "pizza";
  if (/helado|gelato|frost|cono|copa|waffle/.test(normalized)) return "gelato";
  if (/papa|fries|casco|rústica|rustica|nachos/.test(normalized)) return "fries";
  if (/malteada|shake|soda|agua|jugo|bebida|refresco|limonada/.test(normalized)) return "shake";
  if (/cerveza|beer|barril|pola|artesanal/.test(normalized)) return "beer";
  if (/burger|hamburguesa|forja|taco|quesadilla|combo|carne/.test(normalized)) return "burger";
  return SPRITE_KEYS[Math.abs(fallbackIndex) % SPRITE_KEYS.length] ?? "burger";
}

export function detectBusinessCategory(name: string, slug: string): string {
  const combined = `${name} ${slug}`.toLowerCase();
  if (/burger|hamburguesa|forja/.test(combined)) return "HAMBURGUESAS";
  if (/cafe|café|coffee|alquim/.test(combined)) return "CAFÉ DE ESPECIALIDAD";
  if (/pizza/.test(combined)) return "PIZZA ARTESANAL";
  if (/helad|gelato|frost|postre/.test(combined)) return "POSTRES & GELATO";
  if (/taquer|taco|fogon|fogón|mex/.test(combined)) return "TAQUERÍA";
  if (/pan|masa|miel|bakery/.test(combined)) return "PANADERÍA & CAFÉ";
  return `@${slug.toUpperCase()}`;
}

export function getBusinessStageVisual(name: string, slug: string, index = 0) {
  const spriteKey = detectSpriteKey(`${name} ${slug}`, index);
  let gradientIndex = Math.abs(index) % STAGE_GRADIENTS.length;
  if (spriteKey === "burger") gradientIndex = 0;
  else if (spriteKey === "coffee") gradientIndex = 1;
  else if (spriteKey === "pizza") gradientIndex = 2;
  else if (spriteKey === "gelato") gradientIndex = 3;

  return {
    stageBg: STAGE_GRADIENTS[gradientIndex] ?? STAGE_GRADIENTS[0],
    spriteKey,
    category: detectBusinessCategory(name, slug),
  };
}

export function getRewardVisual(name: string, index = 0) {
  return {
    bg: REWARD_THUMBS[Math.abs(index) % REWARD_THUMBS.length] ?? "#f2a541",
    spriteKey: detectSpriteKey(name, index),
  };
}

export function getProductVisual(name: string, index = 0) {
  return {
    bg: PRODUCT_THUMBS[Math.abs(index) % PRODUCT_THUMBS.length] ?? "#eadec5",
    spriteKey: detectSpriteKey(name, index),
  };
}

export function PixelItemSvg({
  sprite,
  size = 56,
}: {
  sprite: PixelSpriteKey;
  size?: number;
}): ReactNode {
  switch (sprite) {
    case "fries":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 16 16"
          shapeRendering="crispEdges"
          aria-hidden="true"
        >
          <rect x="4" y="2" width="2" height="6" fill="#FFD166" />
          <rect x="7" y="1" width="2" height="7" fill="#FFF3B0" />
          <rect x="10" y="3" width="2" height="5" fill="#F4A261" />
          <rect x="3" y="7" width="10" height="7" fill="#e6533f" />
          <rect x="5" y="9" width="6" height="3" fill="#FFD166" />
        </svg>
      );
    case "shake":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 16 16"
          shapeRendering="crispEdges"
          aria-hidden="true"
        >
          <rect x="9" y="1" width="2" height="4" fill="#e6533f" />
          <rect x="5" y="3" width="6" height="3" fill="#FFF3B0" />
          <rect x="4" y="6" width="8" height="7" fill="#f2a541" />
          <rect x="5" y="13" width="6" height="2" fill="#22d3ee" />
        </svg>
      );
    case "beer":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 16 16"
          shapeRendering="crispEdges"
          aria-hidden="true"
        >
          <rect x="4" y="2" width="6" height="3" fill="#FFF3B0" />
          <rect x="4" y="5" width="6" height="8" fill="#f2a541" />
          <rect x="10" y="6" width="2" height="5" fill="#f2a541" />
        </svg>
      );
    case "coffee":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 16 16"
          shapeRendering="crispEdges"
          aria-hidden="true"
        >
          <rect x="6" y="2" width="1" height="2" fill="#467299" />
          <rect x="3" y="5" width="8" height="7" fill="#fffdf5" />
          <rect x="4" y="6" width="6" height="2" fill="#6F4E37" />
          <rect x="11" y="6" width="2" height="4" fill="#fffdf5" />
          <rect x="2" y="12" width="10" height="2" fill="#e6533f" />
        </svg>
      );
    case "cookie":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 16 16"
          shapeRendering="crispEdges"
          aria-hidden="true"
        >
          <rect x="4" y="3" width="8" height="10" fill="#f2a541" />
          <rect x="3" y="4" width="10" height="8" fill="#f2a541" />
          <rect x="5" y="5" width="2" height="2" fill="#1e1c1a" />
          <rect x="9" y="6" width="2" height="2" fill="#1e1c1a" />
          <rect x="6" y="9" width="2" height="2" fill="#1e1c1a" />
        </svg>
      );
    case "pizza":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 16 16"
          shapeRendering="crispEdges"
          aria-hidden="true"
        >
          <rect x="3" y="2" width="10" height="2" fill="#f2a541" />
          <rect x="4" y="4" width="8" height="4" fill="#ffd166" />
          <rect x="5" y="8" width="6" height="3" fill="#ffd166" />
          <rect x="7" y="11" width="2" height="3" fill="#ffd166" />
          <rect x="5" y="5" width="2" height="2" fill="#e6533f" />
          <rect x="8" y="7" width="2" height="2" fill="#e6533f" />
        </svg>
      );
    case "gelato":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 16 16"
          shapeRendering="crispEdges"
          aria-hidden="true"
        >
          <rect x="7" y="2" width="2" height="2" fill="#e6533f" />
          <rect x="5" y="4" width="6" height="3" fill="#22d3ee" />
          <rect x="4" y="7" width="8" height="2" fill="#ffd166" />
          <rect x="5" y="9" width="6" height="5" fill="#f2a541" />
        </svg>
      );
    case "burger":
    default:
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 16 16"
          shapeRendering="crispEdges"
          aria-hidden="true"
        >
          <rect x="3" y="3" width="10" height="3" fill="#f2a541" />
          <rect x="2" y="6" width="12" height="1" fill="#4e8c57" />
          <rect x="2" y="7" width="12" height="1" fill="#ffd166" />
          <rect x="2" y="8" width="12" height="2" fill="#6D3B28" />
          <rect x="3" y="10" width="10" height="2" fill="#f2a541" />
        </svg>
      );
  }
}

/** Sprites pixel art retro de 32x32 con contorno, sombras y brillos para la tarjeta del negocio. */
export function PixelBusiness32Svg({
  sprite,
  size = 96,
}: {
  sprite: PixelSpriteKey;
  size?: number;
}): ReactNode {
  switch (sprite) {
    case "coffee":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 32 32"
          shapeRendering="crispEdges"
          aria-hidden="true"
        >
          {/* Vapor */}
          <rect x="11" y="3" width="2" height="2" fill="#fffdf5" />
          <rect x="12" y="5" width="2" height="2" fill="#eadec5" />
          <rect x="17" y="2" width="2" height="2" fill="#fffdf5" />
          <rect x="18" y="4" width="2" height="3" fill="#eadec5" />
          {/* Contorno taza */}
          <rect x="6" y="9" width="16" height="1" fill="#1e1c1a" />
          <rect x="5" y="10" width="1" height="11" fill="#1e1c1a" />
          <rect x="22" y="10" width="1" height="11" fill="#1e1c1a" />
          <rect x="6" y="21" width="16" height="1" fill="#1e1c1a" />
          {/* Asa */}
          <rect x="23" y="11" width="3" height="1" fill="#1e1c1a" />
          <rect x="26" y="12" width="1" height="6" fill="#1e1c1a" />
          <rect x="23" y="18" width="3" height="1" fill="#1e1c1a" />
          <rect x="23" y="12" width="3" height="6" fill="#fffdf5" />
          <rect x="23" y="13" width="2" height="4" fill="#467299" />
          {/* Cuerpo taza */}
          <rect x="6" y="10" width="16" height="11" fill="#fffdf5" />
          <rect x="18" y="10" width="4" height="11" fill="#eadec5" />
          {/* Café y crema */}
          <rect x="7" y="11" width="14" height="3" fill="#6F4E37" />
          <rect x="8" y="11" width="6" height="1" fill="#f2a541" />
          {/* Banda decorativa */}
          <rect x="6" y="16" width="16" height="3" fill="#e6533f" />
          <rect x="12" y="16" width="4" height="3" fill="#ffd166" />
          {/* Plato */}
          <rect x="3" y="22" width="22" height="1" fill="#1e1c1a" />
          <rect x="4" y="23" width="20" height="2" fill="#e6533f" />
          <rect x="5" y="25" width="18" height="1" fill="#1e1c1a" />
          <rect x="7" y="23" width="10" height="1" fill="#fffdf5" />
        </svg>
      );
    case "pizza":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 32 32"
          shapeRendering="crispEdges"
          aria-hidden="true"
        >
          {/* Contorno superior corteza */}
          <rect x="6" y="4" width="20" height="1" fill="#1e1c1a" />
          <rect x="4" y="5" width="2" height="2" fill="#1e1c1a" />
          <rect x="26" y="5" width="2" height="2" fill="#1e1c1a" />
          <rect x="5" y="7" width="22" height="1" fill="#1e1c1a" />
          {/* Corteza */}
          <rect x="6" y="5" width="20" height="2" fill="#f2a541" />
          <rect x="7" y="5" width="12" height="1" fill="#ffd166" />
          {/* Triángulo queso + contorno */}
          <rect x="6" y="8" width="20" height="3" fill="#ffd166" />
          <rect x="7" y="11" width="18" height="3" fill="#ffd166" />
          <rect x="8" y="14" width="16" height="3" fill="#ffd166" />
          <rect x="10" y="17" width="12" height="3" fill="#ffd166" />
          <rect x="12" y="20" width="8" height="3" fill="#ffd166" />
          <rect x="14" y="23" width="4" height="3" fill="#ffd166" />
          <rect x="15" y="26" width="2" height="2" fill="#ffd166" />
          {/* Bordes laterales */}
          <rect x="5" y="8" width="1" height="3" fill="#1e1c1a" />
          <rect x="26" y="8" width="1" height="3" fill="#1e1c1a" />
          <rect x="6" y="11" width="1" height="3" fill="#1e1c1a" />
          <rect x="25" y="11" width="1" height="3" fill="#1e1c1a" />
          <rect x="7" y="14" width="1" height="3" fill="#1e1c1a" />
          <rect x="24" y="14" width="1" height="3" fill="#1e1c1a" />
          <rect x="9" y="17" width="1" height="3" fill="#1e1c1a" />
          <rect x="22" y="17" width="1" height="3" fill="#1e1c1a" />
          <rect x="11" y="20" width="1" height="3" fill="#1e1c1a" />
          <rect x="20" y="20" width="1" height="3" fill="#1e1c1a" />
          <rect x="13" y="23" width="1" height="3" fill="#1e1c1a" />
          <rect x="18" y="23" width="1" height="3" fill="#1e1c1a" />
          <rect x="14" y="26" width="1" height="2" fill="#1e1c1a" />
          <rect x="17" y="26" width="1" height="2" fill="#1e1c1a" />
          <rect x="15" y="28" width="2" height="1" fill="#1e1c1a" />
          {/* Pepperoni y albahaca */}
          <rect x="9" y="10" width="4" height="3" fill="#e6533f" />
          <rect x="10" y="10" width="1" height="1" fill="#fffdf5" />
          <rect x="18" y="11" width="4" height="3" fill="#e6533f" />
          <rect x="19" y="11" width="1" height="1" fill="#fffdf5" />
          <rect x="13" y="16" width="4" height="3" fill="#e6533f" />
          <rect x="15" y="21" width="3" height="2" fill="#e6533f" />
          <rect x="14" y="10" width="2" height="2" fill="#4e8c57" />
          <rect x="19" y="16" width="2" height="2" fill="#4e8c57" />
        </svg>
      );
    case "gelato":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 32 32"
          shapeRendering="crispEdges"
          aria-hidden="true"
        >
          {/* Cereza */}
          <rect x="14" y="2" width="4" height="1" fill="#1e1c1a" />
          <rect x="13" y="3" width="6" height="3" fill="#e6533f" />
          <rect x="14" y="3" width="1" height="1" fill="#fffdf5" />
          <rect x="15" y="1" width="2" height="1" fill="#4e8c57" />
          {/* Bola superior */}
          <rect x="10" y="6" width="12" height="1" fill="#1e1c1a" />
          <rect x="9" y="7" width="14" height="5" fill="#22d3ee" />
          <rect x="11" y="8" width="3" height="2" fill="#fffdf5" />
          <rect x="8" y="8" width="1" height="4" fill="#1e1c1a" />
          <rect x="23" y="8" width="1" height="4" fill="#1e1c1a" />
          {/* Bola inferior */}
          <rect x="8" y="12" width="16" height="4" fill="#ffd166" />
          <rect x="7" y="12" width="1" height="4" fill="#1e1c1a" />
          <rect x="24" y="12" width="1" height="4" fill="#1e1c1a" />
          <rect x="8" y="16" width="16" height="1" fill="#1e1c1a" />
          {/* Cono */}
          <rect x="9" y="17" width="14" height="3" fill="#f2a541" />
          <rect x="11" y="20" width="10" height="3" fill="#f2a541" />
          <rect x="13" y="23" width="6" height="3" fill="#f2a541" />
          <rect x="14" y="26" width="4" height="3" fill="#d97706" />
          <rect x="15" y="29" width="2" height="1" fill="#1e1c1a" />
          {/* Trama waffle */}
          <rect x="12" y="18" width="2" height="2" fill="#b45309" />
          <rect x="17" y="18" width="2" height="2" fill="#b45309" />
          <rect x="14" y="21" width="2" height="2" fill="#b45309" />
          {/* Contorno cono */}
          <rect x="8" y="17" width="1" height="3" fill="#1e1c1a" />
          <rect x="23" y="17" width="1" height="3" fill="#1e1c1a" />
          <rect x="10" y="20" width="1" height="3" fill="#1e1c1a" />
          <rect x="21" y="20" width="1" height="3" fill="#1e1c1a" />
          <rect x="12" y="23" width="1" height="3" fill="#1e1c1a" />
          <rect x="19" y="23" width="1" height="3" fill="#1e1c1a" />
          <rect x="13" y="26" width="1" height="3" fill="#1e1c1a" />
          <rect x="18" y="26" width="1" height="3" fill="#1e1c1a" />
        </svg>
      );
    case "fries":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 32 32"
          shapeRendering="crispEdges"
          aria-hidden="true"
        >
          {/* Papas */}
          <rect x="8" y="5" width="3" height="10" fill="#ffd166" />
          <rect x="12" y="3" width="3" height="12" fill="#FFF3B0" />
          <rect x="16" y="4" width="3" height="11" fill="#ffd166" />
          <rect x="20" y="6" width="3" height="9" fill="#f2a541" />
          <rect x="10" y="8" width="2" height="7" fill="#f2a541" />
          <rect x="19" y="7" width="2" height="8" fill="#FFF3B0" />
          {/* Caja roja */}
          <rect x="6" y="14" width="20" height="1" fill="#1e1c1a" />
          <rect x="5" y="15" width="1" height="12" fill="#1e1c1a" />
          <rect x="26" y="15" width="1" height="12" fill="#1e1c1a" />
          <rect x="6" y="27" width="20" height="1" fill="#1e1c1a" />
          <rect x="6" y="15" width="20" height="12" fill="#e6533f" />
          <rect x="22" y="15" width="4" height="12" fill="#b83726" />
          {/* Emblema dorado */}
          <rect x="11" y="18" width="10" height="6" fill="#ffd166" />
          <rect x="13" y="20" width="6" height="2" fill="#f2a541" />
        </svg>
      );
    case "shake":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 32 32"
          shapeRendering="crispEdges"
          aria-hidden="true"
        >
          {/* Pitillo */}
          <rect x="19" y="2" width="2" height="9" fill="#e6533f" />
          <rect x="21" y="2" width="3" height="2" fill="#fffdf5" />
          {/* Crema */}
          <rect x="10" y="7" width="12" height="1" fill="#1e1c1a" />
          <rect x="9" y="8" width="14" height="4" fill="#fffdf5" />
          <rect x="14" y="5" width="4" height="2" fill="#e6533f" />
          {/* Vaso */}
          <rect x="8" y="12" width="16" height="1" fill="#1e1c1a" />
          <rect x="8" y="13" width="1" height="13" fill="#1e1c1a" />
          <rect x="23" y="13" width="1" height="13" fill="#1e1c1a" />
          <rect x="9" y="13" width="14" height="13" fill="#f2a541" />
          <rect x="11" y="14" width="3" height="10" fill="#ffd166" />
          <rect x="19" y="13" width="4" height="13" fill="#d97706" />
          {/* Base */}
          <rect x="9" y="26" width="14" height="2" fill="#22d3ee" />
          <rect x="8" y="28" width="16" height="1" fill="#1e1c1a" />
        </svg>
      );
    case "cookie":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 32 32"
          shapeRendering="crispEdges"
          aria-hidden="true"
        >
          <rect x="10" y="5" width="12" height="1" fill="#1e1c1a" />
          <rect x="8" y="6" width="16" height="2" fill="#f2a541" />
          <rect x="6" y="8" width="20" height="4" fill="#f2a541" />
          <rect x="5" y="12" width="22" height="8" fill="#f2a541" />
          <rect x="6" y="20" width="20" height="4" fill="#f2a541" />
          <rect x="8" y="24" width="16" height="2" fill="#d97706" />
          <rect x="10" y="26" width="12" height="1" fill="#1e1c1a" />
          {/* Contornos */}
          <rect x="4" y="12" width="1" height="8" fill="#1e1c1a" />
          <rect x="27" y="12" width="1" height="8" fill="#1e1c1a" />
          <rect x="5" y="8" width="1" height="4" fill="#1e1c1a" />
          <rect x="26" y="8" width="1" height="4" fill="#1e1c1a" />
          <rect x="5" y="20" width="1" height="4" fill="#1e1c1a" />
          <rect x="26" y="20" width="1" height="4" fill="#1e1c1a" />
          {/* Brillo */}
          <rect x="9" y="8" width="6" height="2" fill="#ffd166" />
          {/* Chispas */}
          <rect x="10" y="11" width="3" height="3" fill="#4a2c18" />
          <rect x="18" y="10" width="3" height="3" fill="#4a2c18" />
          <rect x="14" y="15" width="3" height="3" fill="#1e1c1a" />
          <rect x="9" y="18" width="3" height="3" fill="#4a2c18" />
          <rect x="19" y="18" width="4" height="3" fill="#1e1c1a" />
        </svg>
      );
    case "beer":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 32 32"
          shapeRendering="crispEdges"
          aria-hidden="true"
        >
          {/* Espuma */}
          <rect x="8" y="5" width="12" height="1" fill="#1e1c1a" />
          <rect x="7" y="6" width="14" height="5" fill="#fffdf5" />
          <rect x="6" y="7" width="1" height="4" fill="#1e1c1a" />
          <rect x="21" y="7" width="1" height="4" fill="#1e1c1a" />
          {/* Tarro */}
          <rect x="6" y="11" width="1" height="15" fill="#1e1c1a" />
          <rect x="21" y="11" width="1" height="15" fill="#1e1c1a" />
          <rect x="7" y="26" width="14" height="1" fill="#1e1c1a" />
          <rect x="7" y="11" width="14" height="15" fill="#f2a541" />
          <rect x="9" y="12" width="3" height="12" fill="#ffd166" />
          <rect x="17" y="11" width="4" height="15" fill="#d97706" />
          {/* Asa */}
          <rect x="22" y="13" width="4" height="1" fill="#1e1c1a" />
          <rect x="26" y="14" width="1" height="8" fill="#1e1c1a" />
          <rect x="22" y="22" width="4" height="1" fill="#1e1c1a" />
          <rect x="22" y="14" width="4" height="8" fill="#eadec5" />
          <rect x="22" y="16" width="2" height="4" fill="#467299" />
        </svg>
      );
    case "burger":
    default:
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 32 32"
          shapeRendering="crispEdges"
          aria-hidden="true"
        >
          {/* Contorno pan superior */}
          <rect x="8" y="6" width="16" height="1" fill="#1e1c1a" />
          <rect x="6" y="7" width="2" height="2" fill="#1e1c1a" />
          <rect x="24" y="7" width="2" height="2" fill="#1e1c1a" />
          <rect x="5" y="9" width="1" height="4" fill="#1e1c1a" />
          <rect x="26" y="9" width="1" height="4" fill="#1e1c1a" />
          {/* Pan superior */}
          <rect x="8" y="7" width="16" height="2" fill="#f2a541" />
          <rect x="6" y="9" width="20" height="4" fill="#f2a541" />
          <rect x="8" y="8" width="10" height="2" fill="#ffd166" />
          {/* Semillas de ajonjolí */}
          <rect x="10" y="9" width="2" height="1" fill="#fffdf5" />
          <rect x="16" y="8" width="2" height="1" fill="#fffdf5" />
          <rect x="21" y="10" width="2" height="1" fill="#fffdf5" />
          {/* Lechuga */}
          <rect x="4" y="13" width="24" height="2" fill="#4e8c57" />
          <rect x="6" y="13" width="4" height="1" fill="#70b77e" />
          <rect x="15" y="14" width="5" height="1" fill="#70b77e" />
          {/* Queso derretido */}
          <rect x="5" y="15" width="22" height="2" fill="#ffd166" />
          <rect x="9" y="17" width="3" height="2" fill="#ffd166" />
          <rect x="19" y="17" width="3" height="1" fill="#ffd166" />
          {/* Carne */}
          <rect x="5" y="17" width="22" height="4" fill="#6D3B28" />
          <rect x="6" y="18" width="14" height="1" fill="#8b4d35" />
          <rect x="4" y="17" width="1" height="4" fill="#1e1c1a" />
          <rect x="27" y="17" width="1" height="4" fill="#1e1c1a" />
          {/* Pan inferior */}
          <rect x="6" y="21" width="20" height="4" fill="#f2a541" />
          <rect x="5" y="21" width="1" height="3" fill="#1e1c1a" />
          <rect x="26" y="21" width="1" height="3" fill="#1e1c1a" />
          <rect x="6" y="25" width="20" height="1" fill="#1e1c1a" />
          <rect x="8" y="23" width="16" height="2" fill="#d97706" />
        </svg>
      );
  }
}

export function LoopointCoinSvg({ size = 20 }: { size?: number }) {
  return (
    <img
      src="/fideliapp-coin.png"
      alt=""
      width={size}
      height={size}
      className="inline-block shrink-0 select-none object-contain [image-rendering:pixelated]"
      aria-hidden="true"
    />
  );
}

export function HeroCoinSvg({ size = 15 }: { size?: number }) {
  return (
    <img
      src="/fideliapp-coin.png"
      alt=""
      width={size}
      height={size}
      className="inline-block shrink-0 select-none object-contain [image-rendering:pixelated]"
      aria-hidden="true"
    />
  );
}

export function ArcadeArrowLeftSvg() {
  return (
    <svg width="20" height="24" viewBox="0 0 12 14" shapeRendering="crispEdges" aria-hidden="true">
      <polygon points="9,1 7,1 7,3 5,3 5,5 3,5 3,9 5,9 5,11 7,11 7,13 9,13" fill="currentColor" />
    </svg>
  );
}

export function ArcadeArrowRightSvg() {
  return (
    <svg width="20" height="24" viewBox="0 0 12 14" shapeRendering="crispEdges" aria-hidden="true">
      <polygon points="3,1 5,1 5,3 7,3 7,5 9,5 9,9 7,9 7,11 5,11 5,13 3,13" fill="currentColor" />
    </svg>
  );
}

export function DropdownCaretSvg() {
  return (
    <svg
      className="dropdown-caret"
      width="12"
      height="12"
      viewBox="0 0 12 12"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      <polygon points="2,4 10,4 8,6 8,8 6,10 4,8 4,6" fill="currentColor" />
    </svg>
  );
}

export function SettingsGearSvg({ size = 16 }: { size?: number }) {
  return (
    <svg
      className="dropdown-gear"
      width={size}
      height={size}
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      <path
        d="M6 1h4v2h1v1h2v2h2v4h-2v2h-1v1h-2v2H6v-2H5v-1H3v-2H1V6h2V4h1V3h2V1zm1 4v1H6v4h1v1h2v-1h1V6H9V5H7z"
        fill="currentColor"
        fillRule="evenodd"
      />
    </svg>
  );
}

export function PixelUserSvg({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      data-icon="pixel-user"
      aria-hidden="true"
    >
      <rect x="6" y="2" width="4" height="1" fill="currentColor" />
      <rect x="5" y="3" width="6" height="4" fill="currentColor" />
      <rect x="6" y="7" width="4" height="1" fill="currentColor" />
      <rect x="4" y="9" width="8" height="1" fill="currentColor" />
      <rect x="3" y="10" width="10" height="1" fill="currentColor" />
      <rect x="2" y="11" width="12" height="3" fill="currentColor" />
    </svg>
  );
}

export function ProfileAvatarSvg({ size = 30 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      <rect x="4" y="2" width="8" height="2" fill="#ffd166" />
      <rect x="3" y="4" width="10" height="3" fill="#22d3ee" />
      <rect x="3" y="7" width="10" height="6" fill="#fffdf5" />
      <rect x="5" y="8" width="2" height="2" fill="#1e1c1a" />
      <rect x="9" y="8" width="2" height="2" fill="#1e1c1a" />
      <rect x="4" y="13" width="8" height="2" fill="#4e8c57" />
    </svg>
  );
}
