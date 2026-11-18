import { describe, expect, it } from 'vitest';

// Prueba que falla A PROPÓSITO para evidenciar que el pipeline no despliega
// cuando una prueba falla (Guía Momento 3, A.5). Se elimina en el siguiente commit.
describe('Evidencia de pipeline fallido', () => {
  it('convierte 40.000 COP a USD con la tasa esperada (dato incorrecto a propósito)', () => {
    const tasa = 0.00025;
    expect(40_000 * tasa).toBe(999);
  });
});
