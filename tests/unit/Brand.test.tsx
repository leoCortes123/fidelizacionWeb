import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Brand } from "@/components/shared/Brand";
import { coinLabel, coinPlural, coinSingular, coinWord } from "@/lib/copy";
import { brandName, brandTagline } from "@/lib/config";

describe("copy de Fideliapp", () => {
  it('usa "moneda" en singular y "monedas" en plural', () => {
    expect(coinSingular).toBe("moneda");
    expect(coinPlural).toBe("monedas");
  });

  it("elige la palabra según la cantidad", () => {
    expect(coinWord(1)).toBe("moneda");
    expect(coinWord(0)).toBe("monedas");
    expect(coinWord(2)).toBe("monedas");
    expect(coinWord(-1)).toBe("moneda");
    expect(coinWord(-3)).toBe("monedas");
  });

  it("compone la etiqueta con la cantidad", () => {
    expect(coinLabel(1)).toBe("1 moneda");
    expect(coinLabel(0)).toBe("0 monedas");
    expect(coinLabel(250)).toBe("250 monedas");
    expect(coinLabel(-5)).toBe("-5 monedas");
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
