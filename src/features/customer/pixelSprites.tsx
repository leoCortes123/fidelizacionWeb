import type { ReactNode } from "react";

export type PixelSpriteKey =
  "fries" | "shake" | "burger" | "beer" | "coffee" | "cookie" | "pizza" | "gelato";

const STAGE_GRADIENTS = [
  "linear-gradient(135deg, #eadec5 0%, #f2a541 100%)",
  "linear-gradient(135deg, #eadec5 0%, #467299 100%)",
  "linear-gradient(135deg, #eadec5 0%, #e6533f 100%)",
  "linear-gradient(135deg, #eadec5 0%, #4e8c57 100%)",
] as const;

const REWARD_THUMBS = ["#f2a541", "#467299", "#4e8c57", "#e6533f", "#ffd166"] as const;
const PRODUCT_THUMBS = ["#eadec5", "#ffd166", "#eadec5", "#f2a541"] as const;

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

export function LoopointCoinSvg({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      <rect x="5" y="1" width="6" height="1" fill="#083344" />
      <rect x="3" y="2" width="10" height="1" fill="#06b6d4" />
      <rect x="2" y="3" width="12" height="10" fill="#22d3ee" />
      <rect x="3" y="13" width="10" height="1" fill="#06b6d4" />
      <rect x="5" y="14" width="6" height="1" fill="#083344" />
      <rect x="4" y="3" width="8" height="1" fill="#a5f3fc" />
      <rect x="6" y="5" width="2" height="6" fill="#facc15" />
      <rect x="6" y="9" width="5" height="2" fill="#facc15" />
    </svg>
  );
}

export function HeroCoinSvg({ size = 15 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      <rect x="3" y="2" width="10" height="12" fill="#22d3ee" />
      <rect x="6" y="5" width="2" height="6" fill="#facc15" />
      <rect x="6" y="9" width="5" height="2" fill="#facc15" />
    </svg>
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
