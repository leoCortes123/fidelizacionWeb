/**
 * Contenido de la landing orientada a administradores de negocios.
 * Los textos usan los términos de búsqueda más frecuentes del sector
 * (software de fidelización, programa de puntos, sistema de puntos para clientes,
 * app de fidelización, tarjeta de fidelización digital) sin sobreoptimizar.
 *
 * IMPORTANTE: `faqs` se replica como JSON-LD `FAQPage` en `index.html`.
 * Si cambias una pregunta o respuesta, actualiza también `index.html`
 * (la prueba `LandingPage.test.tsx` verifica que coincidan).
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
      "Las monedas se calculan solas con las reglas de tu programa (por ejemplo, 1 moneda por cada $1.000).",
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
      "Funciona desde el navegador y también puede instalarse como app en el celular.",
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
      "En su tarjeta de fidelización digital, el cliente ve sus monedas, una barra de progreso hacia la siguiente recompensa, el catálogo de premios que tú definiste y tu carta. Ver lo cerca que está del premio es el motivo que lo hace volver.",
    details: [
      "Tú decides qué recompensas ofreces y cuántas monedas cuesta cada una.",
      "Las monedas pueden tener vencimiento: se gastan primero las más antiguas.",
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
      "Cuando el cliente tiene las monedas suficientes, solicita la recompensa desde su celular. Las monedas quedan reservadas, se genera un código de canje y el encargado aprueba la entrega desde la lista de solicitudes pendientes o escaneando el QR de canje. Si el canje se cancela, las monedas regresan al cliente.",
    details: [
      "Solo los miembros de tu equipo con permiso pueden aprobar canjes.",
      "Puedes poner límites de canje por cliente y por periodo.",
      "Cada aprobación queda registrada en la auditoría del negocio.",
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
      "Panel de presupuesto con alertas para que el programa siga siendo rentable.",
      "Campañas para reactivar clientes en días flojos.",
      "Invita a nuevos clientes con un enlace o un QR de afiliación.",
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
    text: "Nombre del negocio, enlace de afiliación, zona horaria y días de operación. Luego completas contacto y logo en tu perfil.",
  },
  {
    title: "Datos económicos",
    text: "Paso opcional con ventas y clientes diarios para estimar tu ticket promedio, margen y presupuesto de recompensas.",
  },
  {
    title: "Programa y activación",
    text: "Defines cuántas monedas da cada compra y su vigencia. Activas el programa, agregas tu carta y recompensas, y empiezas a vender.",
  },
];

export interface AdminFeature {
  title: string;
  text: string;
}

export const adminFeatures: AdminFeature[] = [
  {
    title: "Recompensas y carta a tu medida",
    text: "Crea premios con su costo en monedas y publica tu carta de productos y combos.",
  },
  {
    title: "Reglas de puntos y vencimiento",
    text: "Define cuántas monedas da cada compra y cuánto tiempo son válidas.",
  },
  {
    title: "Campañas con multiplicador o bono",
    text: "Doble de monedas en temporada baja o un bono por compra mínima, con fecha de inicio y fin.",
  },
  {
    title: "Equipo con permisos",
    text: "Agrega encargados que registran ventas y aprueban canjes según su rol.",
  },
  {
    title: "Control de presupuesto",
    text: "Mide el costo de las recompensas y recibe alertas antes de pasarte del presupuesto.",
  },
  {
    title: "Clientes, historial y auditoría",
    text: "Consulta el saldo y los movimientos de cada cliente y quién hizo cada operación.",
  },
];

export const businessTypes: string[] = [
  "Cafeterías",
  "Restaurantes",
  "Panaderías",
  "Comidas rápidas",
  "Heladerías",
  "Tiendas de barrio",
  "Barberías y salones",
  "Tiendas de ropa",
];

export interface ComparisonRow {
  aspect: string;
  paper: string;
  app: string;
}

export const comparisonRows: ComparisonRow[] = [
  {
    aspect: "Dónde vive la tarjeta",
    paper: "En la billetera; se pierde o se olvida",
    app: "En el celular del cliente",
  },
  {
    aspect: "Control de fraude",
    paper: "Sellos fáciles de copiar",
    app: "QR único por venta y canje aprobado por tu equipo",
  },
  {
    aspect: "Conoces a tus clientes",
    paper: "No sabes quién vuelve",
    app: "Historial de compras y canjes por cliente",
  },
  {
    aspect: "Costo de los premios",
    paper: "Sin control",
    app: "Presupuesto, límites y alertas",
  },
  {
    aspect: "Promociones",
    paper: "Hay que reimprimir",
    app: "Campañas con multiplicador o bono en minutos",
  },
];

export interface Faq {
  question: string;
  answer: string;
}

export const faqs: Faq[] = [
  {
    question: "¿Qué es Fideliapp?",
    answer:
      "Fideliapp es un software de fidelización de clientes para negocios locales. Permite crear un programa de puntos en el que tus clientes acumulan monedas con cada compra escaneando un QR y las canjean por recompensas que tú defines, todo desde el celular.",
  },
  {
    question: "¿Cómo funciona el sistema de puntos para clientes?",
    answer:
      "El encargado registra la venta y la app genera un QR. El cliente lo escanea y recibe monedas según tus reglas. Cuando junta suficientes monedas solicita una recompensa, tu equipo aprueba el canje y entrega el premio.",
  },
  {
    question: "¿Mis clientes tienen que descargar una app?",
    answer:
      "No es obligatorio. Fideliapp funciona desde el navegador del celular y además se puede instalar como app desde la misma página, sin pasar por una tienda de aplicaciones.",
  },
  {
    question: "¿Necesito un lector, una impresora o integrar mi sistema POS?",
    answer:
      "No. Basta con el celular o la tablet del negocio para generar los QR de venta y aprobar canjes. No se requiere hardware adicional ni integración con tu caja.",
  },
  {
    question: "¿Puedo controlar cuánto me cuestan las recompensas?",
    answer:
      "Sí. Defines el costo en monedas de cada premio, límites de canje por cliente y periodo, y un presupuesto. El panel económico te muestra el gasto y te alerta antes de superarlo.",
  },
  {
    question: "¿Mis empleados pueden usarlo?",
    answer:
      "Sí. Puedes agregar encargados con permisos para registrar ventas y aprobar canjes. Cada operación queda registrada en la auditoría con el usuario que la hizo.",
  },
  {
    question: "¿Las monedas vencen?",
    answer:
      "Tú decides la vigencia en la configuración del programa. Cuando hay vencimiento, se consumen primero las monedas más antiguas y cada vencimiento queda registrado en el historial de movimientos.",
  },
  {
    question: "¿Puedo administrar varios negocios con la misma cuenta?",
    answer:
      "Sí. Fideliapp es multiempresa: puedes registrar varios negocios y cada uno tiene su propio programa, carta, recompensas y equipo.",
  },
];
