import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Brand } from "@/components/shared/Brand";
import { loopointLabel, loopointPlural, loopointSingular, loopointWord } from "@/lib/copy";
import { brandName, brandTagline } from "@/lib/config";

describe("copy de Fideliapp", () => {
  it('usa "moneda" en singular y "monedas" en plural', () => {
    expect(loopointSingular).toBe("moneda");
    expect(loopointPlural).toBe("monedas");
  });

  it("elige la palabra según la cantidad", () => {
    expect(loopointWord(1)).toBe("moneda");
    expect(loopointWord(0)).toBe("monedas");
    expect(loopointWord(2)).toBe("monedas");
    expect(loopointWord(-1)).toBe("moneda");
    expect(loopointWord(-3)).toBe("monedas");
  });

  it("compone la etiqueta con la cantidad", () => {
    expect(loopointLabel(1)).toBe("1 moneda");
    expect(loopointLabel(0)).toBe("0 monedas");
    expect(loopointLabel(250)).toBe("250 monedas");
    expect(loopointLabel(-5)).toBe("-5 monedas");
  });
});

describe("Brand", () => {
  it("muestra el nombre y el lema de la marca", () => {
    render(
      <MemoryRouter>
        <Brand />
      </MemoryRouter>,
    );

    expect(screen.getByText(brandName)).toBeInTheDocument();
    expect(screen.getByText(brandTagline)).toBeInTheDocument();
    expect(brandName).toBe("Fideliapp");
  });

  it("usa la moneda de Fideliapp en la imagen del logo", () => {
    const { container } = render(
      <MemoryRouter>
        <Brand />
      </MemoryRouter>,
    );

    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img?.getAttribute("src")).toBe("/fideliapp-coin.png");
    expect(img?.getAttribute("alt")).toBe("");
    expect(img?.getAttribute("aria-hidden")).toBe("true");
  });

  it("permite reemplazar el nombre de marca por el nombre del negocio", () => {
    render(
      <MemoryRouter>
        <Brand name="Taquería El Fogón" tagline={null} />
      </MemoryRouter>,
    );

    expect(screen.getByText("Taquería El Fogón")).toBeInTheDocument();
    expect(screen.queryByText(brandName)).not.toBeInTheDocument();
    expect(screen.queryByText(brandTagline)).not.toBeInTheDocument();
  });

  it("oculta el lema en modo compacto", () => {
    render(
      <MemoryRouter>
        <Brand compact />
      </MemoryRouter>,
    );

    expect(screen.getByText(brandName)).toBeInTheDocument();
    expect(screen.queryByText(brandTagline)).not.toBeInTheDocument();
  });

  it("enlaza al inicio con una etiqueta accesible", () => {
    render(
      <MemoryRouter>
        <Brand />
      </MemoryRouter>,
    );

    const link = screen.getByRole("link", { name: new RegExp(brandName, "i") });
    expect(link).toHaveAttribute("href", "/");
  });

  it("permite cambiar el destino del enlace", () => {
    render(
      <MemoryRouter>
        <Brand linkTo="/customer" />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link")).toHaveAttribute("href", "/customer");
  });

  it("sin destino no genera enlace", () => {
    render(
      <MemoryRouter>
        <Brand linkTo="" />
      </MemoryRouter>,
    );

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText(brandName)).toBeInTheDocument();
  });
});
