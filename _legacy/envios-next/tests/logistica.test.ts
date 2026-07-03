import { describe, expect, it } from "vitest";
import {
  esEstadoValido,
  esTransicionValida,
  generarCodigoSeguimiento,
  validarNuevoEnvio,
} from "@/lib/logistica";

describe("generarCodigoSeguimiento", () => {
  it("genera un código con prefijo ENV- y 6 caracteres", () => {
    const codigo = generarCodigoSeguimiento();
    expect(codigo).toMatch(/^ENV-[A-Z0-9]{6}$/);
  });

  it("evita caracteres ambiguos (I, O, 0, 1)", () => {
    for (let i = 0; i < 200; i++) {
      expect(generarCodigoSeguimiento().slice(4)).not.toMatch(/[IO01]/);
    }
  });
});

describe("esEstadoValido", () => {
  it("acepta estados conocidos", () => {
    expect(esEstadoValido("pendiente")).toBe(true);
    expect(esEstadoValido("entregado")).toBe(true);
  });

  it("rechaza valores desconocidos", () => {
    expect(esEstadoValido("volando")).toBe(false);
    expect(esEstadoValido(42)).toBe(false);
  });
});

describe("esTransicionValida", () => {
  it("permite avances válidos", () => {
    expect(esTransicionValida("pendiente", "en_transito")).toBe(true);
    expect(esTransicionValida("en_transito", "entregado")).toBe(true);
  });

  it("bloquea transiciones desde estados terminales", () => {
    expect(esTransicionValida("entregado", "en_transito")).toBe(false);
    expect(esTransicionValida("cancelado", "pendiente")).toBe(false);
  });

  it("bloquea saltos inválidos", () => {
    expect(esTransicionValida("pendiente", "entregado")).toBe(false);
  });
});

describe("validarNuevoEnvio", () => {
  it("valida y normaliza una entrada correcta", () => {
    const r = validarNuevoEnvio({
      origen: "  Bogotá ",
      destino: "Medellín",
      destinatario: "Ana",
      pesoKg: "3.6",
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.datos.origen).toBe("Bogotá");
      expect(r.datos.pesoKg).toBe(4);
    }
  });

  it("acumula errores de campos obligatorios", () => {
    const r = validarNuevoEnvio({ origen: "", destino: "", destinatario: "" });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errores).toHaveLength(3);
    }
  });

  it("rechaza pesos negativos", () => {
    const r = validarNuevoEnvio({
      origen: "A",
      destino: "B",
      destinatario: "C",
      pesoKg: -5,
    });
    expect(r.ok).toBe(false);
  });
});
