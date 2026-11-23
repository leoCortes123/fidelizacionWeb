import { useState } from "react";
import { Link } from "react-router-dom";
import {
  PixelArrowRightIcon,
  PixelHelpIcon,
  PixelPhoneIcon,
  PixelSearchIcon,
  PixelShieldIcon,
} from "@/features/landing/PixelIcons";
import { REGISTER_BUSINESS, SiteLayout } from "@/features/landing/SiteLayout";
import { SubpageHero } from "@/features/landing/SubpageHero";
import { usePageMeta } from "@/features/landing/usePageMeta";
import { faqs, type FaqCategory } from "@/features/landing/webContent";
import { brandName } from "@/lib/config";

const faqCategories: FaqCategory[] = [
  "Todas",
  "General",
  "Precios y Planes",
  "Clientes y App",
  "Seguridad y Equipo",
];

function normalizeSearchText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function FaqPage() {
  const brand = brandName || "Fideliapp";
  const [category, setCategory] = useState<FaqCategory>("Todas");
  const [query, setQuery] = useState("");

  usePageMeta({
    title: `Preguntas frecuentes · ${brand}`,
    description: `Resuelve tus dudas sobre ${brand}: cómo funciona el QR por venta, costos y presupuesto de premios, instalación PWA, permisos de encargados y multiempresa.`,
    path: "/preguntas",
    breadcrumbLabel: "Preguntas",
  });

  const normalized = normalizeSearchText(query.trim());
  const filteredFaqs = faqs.filter((item) => {
    const matchesCat = category === "Todas" || item.category === category;
    const matchesText =
      !normalized ||
      normalizeSearchText(item.question).includes(normalized) ||
      normalizeSearchText(item.answer).includes(normalized);
    return matchesCat && matchesText;
  });

  return (
    <SiteLayout>
      <SubpageHero
        titleId="page-faq-title"
        eyebrow="Centro de dudas · Soporte"
        titleStart="Preguntas frecuentes"
        titleHighlight={`sobre ${brand}.`}
        lead={
          <>
            Respuestas directas sobre cómo operar <strong>{brand}</strong> con QR en caja, controlar
            el presupuesto de recompensas, gestionar permisos de tu equipo y afiliar clientes sin
            hardware adicional.
          </>
        }
        actions={[
          { label: "Buscar una respuesta", to: "#lista-preguntas", variant: "start" },
          { label: "Crear mi programa", to: REGISTER_BUSINESS, variant: "primary" },
        ]}
        proofLabel="Respuestas clave"
        proofItems={[
          { icon: <PixelHelpIcon size={16} />, label: "10 respuestas directas" },
          { icon: <PixelPhoneIcon size={16} />, label: "PWA sin tiendas" },
          { icon: <PixelShieldIcon size={16} />, label: "Saldos independientes" },
        ]}
        hudLabel="GUÍA · CENTRO FAQ"
        hudTag="AYUDA"
        image="/art/hero-preguntas.jpg"
        imageAlt="Ilustración pixel art 32-bit de un manual abierto con marcador dorado, burbuja de pregunta azul, lupa sobre una moneda, sello verde verificado y bombillo encendido"
      />

      <section id="lista-preguntas" className="wrap retro-section" aria-labelledby="faq-list-title">
        <h2 id="faq-list-title" className="sr-only">
          Lista de preguntas frecuentes
        </h2>

        <div className="faq-controls">
          <label className="faq-search">
            <PixelSearchIcon size={18} />
            <span className="sr-only">Buscar pregunta</span>
            <input
              type="search"
              placeholder="Buscar por palabra clave (ej. QR, vencen, app, empleados)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>

          <div className="filter-bar" role="group" aria-label="Filtrar preguntas por categoría">
            {faqCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`filter-chip ${category === cat ? "filter-chip-active" : ""}`}
                aria-pressed={category === cat}
                onClick={() => setCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="faq">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((f) => (
              <details className="faq-item" key={f.question}>
                <summary>
                  <span>{f.question}</span>
                </summary>
                <p>{f.answer}</p>
              </details>
            ))
          ) : (
            <div className="faq-empty">
              <p>No encontramos preguntas que coincidan con "{query}".</p>
              <button
                type="button"
                className="btn btn-light btn-sm"
                onClick={() => {
                  setQuery("");
                  setCategory("Todas");
                }}
              >
                Ver todas las preguntas
              </button>
            </div>
          )}
        </div>

        <div className="center-cta">
          <Link className="btn btn-primary btn-lg" to={REGISTER_BUSINESS}>
            Crear mi programa de puntos <PixelArrowRightIcon size={16} />
          </Link>
        </div>
      </section>
    </SiteLayout>
  );
}
