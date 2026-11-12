import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Brand } from "@/components/shared/Brand";
import { loopointLabel, loopointPlural, loopointSingular, loopointWord } from "@/lib/copy";
import { brandName, brandTagline } from "@/lib/config";

describe("copy de Loopoint", () => {
  it('usa "loopoint" en singular y "loopoints" en plural', () => {
    expect(loopointSingular).toBe("loopoint");
    expect(loopointPlural).toBe("loopoints");
  });

  it("elige la palabra según la cantidad", () => {
    expect(loopointWord(1)).toBe("loopoint");
    expect(loopointWord(0)).toBe("loopoints");
    expect(loopointWord(2)).toBe("loopoints");
    expect(loopointWord(-1)).toBe("loopoint");
    expect(loopointWord(-3)).toBe("loopoints");
  });

  it("compone la etiqueta con la cantidad", () => {
    expect(loopointLabel(1)).toBe("1 loopoint");
    expect(loopointLabel(0)).toBe("0 loopoints");
    expect(loopointLabel(250)).toBe("250 loopoints");
    expect(loopointLabel(-5)).toBe("-5 loopoints");
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
    expect(brandName).toBe("Loopoint");
  });

  it("usa la moneda de Loopoint en la imagen del logo", () => {
    const { container } = render(
      <MemoryRouter>
        <Brand />
      </MemoryRouter>,
    );

    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img?.getAttribute("src")).toBe("/loopoint-coin.png");
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
