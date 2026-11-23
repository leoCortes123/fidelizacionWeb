/**
 * Contenido estructurado del sitio web multipágina de Fideliapp.
 * Diseñado con patrones SEO + GEO (Generative Engine Optimization):
 * - Respuestas directas ("journalistic lead") bajo cada encabezado.
 * - Datos estructurados por rol, funciones con apoyo visual, planes de precios y FAQ.
 */

export type StepActor = "Encargado" | "Cliente" | "Negocio y cliente";

export interface ManualStep {
  moment: 1 | 2 | 3 | 4 | 5;
  tab: string;
  title: string;
  actor: StepActor;
  summary: string;
  details: string[];
  tip: string;
}

export const manualSteps: ManualStep[] = [
  {
    moment: 1,
    tab: "Venta",
    title: "Registra la venta y genera el QR",
    actor: "Encargado",
    summary:
      "Al cobrar, el encargado abre Fideliapp en el celular o la tablet del negocio, escribe el valor de la compra en pesos y la app genera un código QR único para esa venta. No necesitas lector, impresora ni integrar tu caja: el QR aparece en pantalla y el cliente lo escanea en el mostrador.",
    details: [
      "Las monedas se calculan solas con las reglas de tu programa (por ejemplo, 1 moneda por cada $1.000 COP).",
      "Cada QR corresponde a una sola venta y solo puede reclamarse una vez.",
      "La venta queda en el historial con la fecha y el usuario que la registró.",
    ],
    tip: "Deja la tablet o el celular de caja con la sesión del encargado abierta para registrar ventas en segundos.",
  },
  {
    moment: 2,
    tab: "Escaneo",
    title: "Tu cliente escanea el QR y suma monedas",
    actor: "Cliente",
    summary:
      "El cliente escanea el QR con la cámara de su celular. Si es su primera visita, crea su cuenta en segundos; si ya es cliente, las monedas entran de inmediato a la billetera de tu negocio. Su saldo contigo nunca se mezcla con el de otros negocios.",
    details: [
      "Funciona desde el navegador y también puede instalarse como app en el celular (PWA).",
      "Si tienes una campaña activa (doble de monedas o bono), se aplica automáticamente.",
      "El cliente ve al instante cuántas monedas ganó con esa compra.",
    ],
    tip: "Pega un aviso junto a la caja: «Escanea y gana monedas». Los clientes preguntan menos y participan más.",
  },
  {
    moment: 3,
    tab: "Progreso",
    title: "El cliente ve su avance hacia el premio",
    actor: "Cliente",
    summary:
      "En su tarjeta de fidelización digital estilo pixel-art, el cliente ve sus monedas, una barra de progreso hacia la siguiente recompensa, el catálogo de premios que tú definiste y tu carta. Ver lo cerca que está del premio es el motivo que lo hace volver.",
    details: [
      "Tú decides qué recompensas ofreces y cuántas monedas cuesta cada una.",
      "Las monedas pueden tener vencimiento FIFO: se gastan primero las más antiguas.",
      "Tu carta de productos y combos queda visible desde la misma tarjeta.",
    ],
    tip: "Ofrece una recompensa alcanzable en 3 o 4 visitas: un primer premio rápido engancha más que uno grande y lejano.",
  },
  {
    moment: 4,
    tab: "Canje",
    title: "Aprueba el canje desde tu caja",
    actor: "Encargado",
    summary:
      "Cuando el cliente tiene las monedas suficientes, solicita la recompensa desde su celular. Las monedas quedan reservadas, se genera un código QR de canje y el encargado aprueba la entrega desde la lista de solicitudes pendientes o escaneando el QR en un solo paso. Si el canje se cancela, las monedas regresan al cliente.",
    details: [
      "Solo los miembros de tu equipo con permiso pueden aprobar canjes.",
      "Puedes poner límites de canje por cliente y por periodo.",
      "Cada aprobación queda registrada en la auditoría del negocio con origen manual o QR.",
    ],
    tip: "Define qué encargados pueden aprobar canjes y cuáles solo registran ventas.",
  },
  {
    moment: 5,
    tab: "Fidelización",
    title: "Entrega el premio y haz que vuelva",
    actor: "Negocio y cliente",
    summary:
      "Entregas la recompensa, el saldo del cliente se actualiza y empieza un nuevo ciclo de compras. Mientras tanto, en tu panel ves clientes activos, ventas, canjes y cuánto te cuestan las recompensas frente al presupuesto que definiste.",
    details: [
      "Panel económico con alertas de presupuesto para que el programa siga siendo rentable.",
      "Campañas para reactivar clientes en días flojos.",
      "Invita a nuevos clientes con un enlace (/join) o un QR de afiliación.",
    ],
    tip: "Revisa cada mes qué recompensas se canjean más y ajusta el catálogo con esos datos.",
  },
];

export interface SetupStep {
  title: string;
  text: string;
}

export const setupSteps: SetupStep[] = [
  {
    title: "Datos del negocio",
    text: "Nombre del negocio, enlace de afiliación único, zona horaria y días de operación. Luego completas contacto y logo en tu perfil.",
  },
  {
    title: "Datos económicos",
    text: "Paso opcional con ventas y clientes diarios para estimar tu ticket promedio, margen y presupuesto mensual de recompensas.",
  },
  {
    title: "Programa y activación",
    text: "Defines cuántas monedas da cada compra y su vigencia. Activas el programa, agregas tu carta y recompensas, y empiezas a vender.",
  },
];

export type RoleKey = "admin" | "encargado" | "cliente";

export interface RoleShowcase {
  key: RoleKey;
  label: string;
  badge: string;
  headline: string;
  summary: string;
  highlights: string[];
  routeExample: string;
  image: string;
  imageAlt: string;
}

export const roleShowcases: RoleShowcase[] = [
  {
    key: "admin",
    label: "Administrador",
    badge: "Control total",
    headline: "Configura tu programa, mide el margen y audita cada movimiento",
    summary:
      "El administrador diseña las reglas del programa de puntos, publica la carta y los premios, gestiona encargados y vigila el presupuesto desde un solo panel.",
    highlights: [
      "Asistente de onboarding en 3 pasos listo para operar en minutos.",
      "Panel económico con costo real de premios, margen estimado y alertas de presupuesto.",
      "Auditoría legible: quién registró cada venta, quién aprobó cada canje y cuándo.",
    ],
    routeExample: "/admin/dashboard",
    image: "/art/economy-budget.jpg",
    imageAlt: "Ilustración pixel art de panel económico, métricas y escudo de seguridad",
  },
  {
    key: "encargado",
    label: "Encargado en caja",
    badge: "Operación ágil",
    headline: "Genera el QR de venta y valida entregas de premios en segundos",
    summary:
      "El encargado usa una vista enfocada en el mostrador: registra el monto de la compra, muestra el QR al cliente y aprueba canjes escaneando el QR del cliente.",
    highlights: [
      "QR único e irrepetible por cada compra registrada en pesos COP.",
      "Validación de canjes por escaneo directo (/scan) o lista de solicitudes pendientes.",
      "Permisos granulares definidos por el administrador (solo ventas o ventas + canjes).",
    ],
    routeExample: "/encargado/venta",
    image: "/art/qr-scan.jpg",
    imageAlt:
      "Ilustración pixel art de dos celulares: uno mostrando el QR de venta y otro escaneándolo con monedas",
  },
  {
    key: "cliente",
    label: "Cliente",
    badge: "Tarjeta digital",
    headline: "Suma monedas por compra y canjea premios sin descargar tiendas de apps",
    summary:
      "El cliente lleva su tarjeta pixel-art digital en el navegador o instalada como PWA. Consulta sus monedas por negocio y pide su canje con un toque.",
    highlights: [
      "Billetera separada por cada negocio: sus monedas nunca se mezclan.",
      "Barra de progreso hacia la próxima recompensa, catálogo de premios y carta visible.",
      "Afiliación instantánea por enlace (/join) o escaneo de QR en mostrador.",
    ],
    routeExample: "/customer",
    image: "/art/campaigns-gifts.jpg",
    imageAlt: "Ilustración pixel art de recompensas, regalos y bonos de fidelización",
  },
];

export interface FeatureSpotlight {
  id: string;
  tag: string;
  title: string;
  lead: string;
  bullets: string[];
  image: string;
  imageAlt: string;
  comingSoon?: boolean;
}

export const featureSpotlights: FeatureSpotlight[] = [
  {
    id: "qr-operacion",
    tag: "Operación en caja",
    title: "QR único por venta y canje verificado",
    lead: "Cada compra genera un código irrepetible y cada entrega de premio se valida desde el celular del encargado.",
    bullets: [
      "Idempotencia real: un QR de venta solo puede reclamarse una vez.",
      "Canje con token SHA-256, vigencia configurable y devolución si se cancela.",
      "Funciona como PWA instalable en Android, iOS y computador sin hardware extra.",
    ],
    image: "/art/qr-scan.jpg",
    imageAlt: "Dos celulares escaneando un código QR de venta mientras se transfieren monedas",
  },
  {
    id: "campanas-difusion",
    tag: "Campañas y difusión",
    title: "Promociones dinámicas y mensajes a tus clientes",
    lead: "Activa multiplicadores o bonos en minutos y mantén activos a tus clientes con difusiones segmentadas.",
    bullets: [
      "Multiplicador 2x o bonos por compra mínima con fecha de inicio y fin.",
      "Vencimiento FIFO de monedas: al canjear se consumen primero las más antiguas.",
      "Campañas de cumpleaños y sistema de difusión multicanal (Próximamente).",
    ],
    image: "/art/campaigns-gifts.jpg",
    imageAlt: "Caja de regalo, multiplicador 2x, pastel de cumpleaños y megáfono de difusión",
  },
  {
    id: "economia-seguridad",
    tag: "Economía y auditoría",
    title: "Control de presupuesto, roles y multiempresa",
    lead: "Sabe exactamente cuánto te cuestan los premios frente a tus ventas y quién ejecutó cada movimiento en caja.",
    bullets: [
      "Panel económico con margen estimado, límites por cliente y alertas de presupuesto.",
      "Encargados con permisos específicos y auditoría legible por operación.",
      "Administra varios locales independientes desde una sola cuenta.",
    ],
    image: "/art/economy-budget.jpg",
    imageAlt: "Tablero de métricas económicas, alcancía de presupuesto y escudo de seguridad",
  },
  {
    id: "suite-arcade",
    tag: "Suite completa · Próximamente",
    title: "Plataforma de juegos, comandera, facturación y chatbot IA",
    lead: "La evolución de Fideliapp integra gamificación para clientes y operación completa de punto de venta para tu negocio.",
    bullets: [
      "Plataforma de juegos para que tus clientes ganen monedas extra (Próximamente).",
      "Comandera y flujo de facturación integrados para el día a día del local (Próximamente).",
      "Chatbot IA para resolver dudas de clientes, caja y métricas del negocio (Próximamente).",
    ],
    image: "/art/arcade-suite.jpg",
    imageAlt: "Máquina arcade pixel art junto a comandera de pedidos y factura digital",
    comingSoon: true,
  },
];

export interface PricingFeature {
  label: string;
  comingSoon?: boolean;
}

export interface PricingPlan {
  id: "free" | "pro" | "suite";
  name: string;
  badge: string;
  tagline: string;
  monthlyCop: number;
  annualMonthlyCop: number;
  ctaLabel: string;
  ctaTo: string;
  highlighted?: boolean;
  image: string;
  imageAlt: string;
  features: PricingFeature[];
}

export const pricingPlans: PricingPlan[] = [
  {
    id: "free",
    name: "Player 1 · Gratis",
    badge: "Para empezar",
    tagline: "Ideal para probar la fidelización en un único local sin costo fijo.",
    monthlyCop: 0,
    annualMonthlyCop: 0,
    ctaLabel: "Empezar gratis",
    ctaTo: "/admin/onboarding?new=1",
    image: "/art/qr-scan.jpg",
    imageAlt: "Ilustración pixel art de QR de venta y monedas",
    features: [
      { label: "1 solo local o negocio activo" },
      { label: "Acumulación de puntos (monedas) con QR por venta" },
      { label: "Canje y redención de recompensas en caja" },
      { label: "Tarjeta digital del cliente y carta visible" },
      { label: "Instalación PWA en celular o tablet" },
    ],
  },
  {
    id: "pro",
    name: "Level Up · Pro",
    badge: "Más popular",
    tagline: "Impulsa la recompra con campañas, difusiones y control financiero.",
    monthlyCop: 59000,
    annualMonthlyCop: 49000,
    ctaLabel: "Elegir Level Up",
    ctaTo: "/admin/onboarding?new=1",
    highlighted: true,
    image: "/art/campaigns-gifts.jpg",
    imageAlt: "Ilustración pixel art de campañas, bonos y difusión",
    features: [
      { label: "Todo lo de Player 1 · Gratis + múltiples locales" },
      { label: "Campañas con multiplicador, bonos y promociones" },
      { label: "Campañas automáticas de cumpleaños y fechas especiales", comingSoon: true },
      {
        label: "Cuota mensual de difusiones por canales permitidos por el cliente",
        comingSoon: true,
      },
      { label: "Panel económico, alertas de presupuesto, encargados y auditoría" },
    ],
  },
  {
    id: "suite",
    name: "Modo Arcade · Suite",
    badge: "Negocio completo",
    tagline: "Fidelización gamificada + operación completa desde comandera hasta facturación.",
    monthlyCop: 129000,
    annualMonthlyCop: 109000,
    ctaLabel: "Solicitar acceso anticipado",
    ctaTo: "/admin/onboarding?new=1",
    image: "/art/arcade-suite.jpg",
    imageAlt: "Ilustración pixel art de plataforma de juegos, comandera y facturación",
    features: [
      { label: "Todo lo de Level Up · Pro con mayor cuota de difusión" },
      { label: "Plataforma de juegos interactivos para clientes", comingSoon: true },
      { label: "Comandera operativa para cocina o barra", comingSoon: true },
      { label: "Módulo de facturación y cierre de caja integrado", comingSoon: true },
      { label: "Chatbot asistente con IA para negocio y clientes", comingSoon: true },
    ],
  },
];

export interface PlanComparisonRow {
  feature: string;
  free: string;
  pro: string;
  suite: string;
  comingSoon?: boolean;
}

export const planComparisonRows: PlanComparisonRow[] = [
  {
    feature: "Locales permitidos",
    free: "1 local",
    pro: "Múltiples locales",
    suite: "Múltiples locales",
  },
  {
    feature: "Acumular puntos y redimir recompensas",
    free: "Incluido",
    pro: "Incluido",
    suite: "Incluido",
  },
  { feature: "Campañas y promociones (2x, bonos)", free: "—", pro: "Incluido", suite: "Incluido" },
  {
    feature: "Campañas de cumpleaños",
    free: "—",
    pro: "Incluido",
    suite: "Incluido",
    comingSoon: true,
  },
  {
    feature: "Difusiones por canales permitidos",
    free: "—",
    pro: "Cuota mensual",
    suite: "Cuota ampliada",
    comingSoon: true,
  },
  { feature: "Panel económico y auditoría", free: "Básico", pro: "Completo", suite: "Completo" },
  {
    feature: "Plataforma de juegos para clientes",
    free: "—",
    pro: "—",
    suite: "Incluido",
    comingSoon: true,
  },
  {
    feature: "Aplicación completa (comandera a facturación)",
    free: "—",
    pro: "—",
    suite: "Incluido",
    comingSoon: true,
  },
  { feature: "Chatbot asistente IA", free: "—", pro: "—", suite: "Incluido", comingSoon: true },
];

export interface RoadmapProposal {
  code: string;
  title: string;
  area: string;
  status: "Próximamente" | "En diseño";
  summary: string;
}

export const proposedFeatures: RoadmapProposal[] = [
  {
    code: "TAREA-1",
    title: "Suscripciones y pasarela de pago local",
    area: "Plataforma y Pagos",
    status: "Próximamente",
    summary:
      "Cobro recurrente en pesos COP con PSE, Nequi y tarjetas, cambios de plan sin interrumpir caja y comprobantes automáticos.",
  },
  {
    code: "TAREA-3",
    title: "Sistema de difusión y cumpleaños",
    area: "Marketing directo",
    status: "Próximamente",
    summary:
      "Envíos segmentados por Web Push, correo y WhatsApp solo a clientes que dieron permiso, más automatización de cumpleaños.",
  },
  {
    code: "TAREA-4",
    title: "Chatbot asistente con IA",
    area: "IA / Soporte",
    status: "En diseño",
    summary:
      "Asistente para consultar saldos y premios, guiar al encargado en caja y explicar métricas del panel económico.",
  },
  {
    code: "SUITE",
    title: "Juegos para clientes, comandera y facturación",
    area: "Suite Negocio",
    status: "En diseño",
    summary:
      "Minijuegos para fidelizar clientes y operación integral del negocio desde la toma de comanda hasta la facturación.",
  },
];

export type FaqCategory =
  "Todas" | "General" | "Precios y Planes" | "Clientes y App" | "Seguridad y Equipo";

export interface Faq {
  question: string;
  answer: string;
  category: Exclude<FaqCategory, "Todas">;
}

export const faqs: Faq[] = [
  {
    category: "General",
    question: "¿Qué es Fideliapp?",
    answer:
      "Fideliapp es un software de fidelización de clientes para negocios locales. Permite crear un programa de puntos en el que tus clientes acumulan monedas con cada compra escaneando un QR y las canjean por recompensas que tú defines, todo desde el celular.",
  },
  {
    category: "General",
    question: "¿Cómo funciona el sistema de puntos para clientes?",
    answer:
      "El encargado registra la venta y la app genera un QR único. El cliente lo escanea y recibe monedas según tus reglas. Cuando junta suficientes monedas solicita una recompensa, tu equipo aprueba el canje y entrega el premio.",
  },
  {
    category: "Precios y Planes",
    question: "¿Qué incluye el plan Player 1 · Gratis?",
    answer:
      "El plan Player 1 · Gratis permite operar 1 solo local con las funciones esenciales de fidelización: acumular monedas por venta con código QR y redimir recompensas en caja.",
  },
  {
    category: "Precios y Planes",
    question: "¿Qué diferencia hay entre Level Up · Pro y Modo Arcade · Suite?",
    answer:
      "Level Up · Pro añade creación de campañas (promociones, bonos y próximamente cumpleaños) y difusiones por los canales permitidos por el usuario. Modo Arcade · Suite sumará próximamente la plataforma de juegos para clientes y la aplicación completa de administración desde comandera hasta facturación.",
  },
  {
    category: "Clientes y App",
    question: "¿Mis clientes tienen que descargar una app?",
    answer:
      "No es obligatorio. Fideliapp funciona desde el navegador del celular y además se puede instalar como app (PWA) desde la misma página, sin pasar por una tienda de aplicaciones.",
  },
  {
    category: "Precios y Planes",
    question: "¿Necesito un lector, una impresora o integrar mi sistema POS?",
    answer:
      "No. Basta con el celular o la tablet del negocio para generar los QR de venta y aprobar canjes. No se requiere hardware adicional ni integración con tu caja.",
  },
  {
    category: "Seguridad y Equipo",
    question: "¿Mis empleados pueden usarlo?",
    answer:
      "Sí. Puedes agregar encargados con permisos para registrar ventas y aprobar canjes. Cada operación queda registrada en la auditoría con el usuario que la hizo.",
  },
  {
    category: "Precios y Planes",
    question: "¿Las monedas vencen?",
    answer:
      "Tú decides la vigencia en la configuración del programa. Cuando hay vencimiento, se consumen primero las monedas más antiguas (FIFO) y cada vencimiento queda registrado en el historial de movimientos.",
  },
  {
    category: "Clientes y App",
    question: "¿El saldo de un cliente se mezcla entre diferentes negocios?",
    answer:
      "No. Cada negocio tiene su propia billetera de monedas, su propia carta y su catálogo de recompensas. El cliente ve todos sus negocios afiliados en un solo lugar, pero con saldos independientes.",
  },
  {
    category: "Seguridad y Equipo",
    question: "¿Qué pasa si un cliente intenta escanear el mismo QR de venta dos veces?",
    answer:
      "El sistema valida que cada QR corresponda a una única venta y solo permite reclamarlo una vez. Los intentos repetidos son rechazados automáticamente en la base de datos.",
  },
];
