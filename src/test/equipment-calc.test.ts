import { describe, expect, it } from "vitest";
import { atsRating, genSet, transformerIccKA, transformerOriginKA, upsIcc } from "@/lib/calc/equipment";

describe("cálculos de fontes", () => {
  it("Icc do transformador 630 kVA ucc 4% ≈ 22.7 kA", () => { expect(transformerIccKA(630, 4)).toBeCloseTo(22.7, 1); });
  it("transformador inativo não impõe Icc", () => { expect(transformerOriginKA({ active: false, kVA: 630, ucc: 4 })).toBeNull(); });
  it("transformador existente usa Icc manual", () => { expect(transformerOriginKA({ active: true, kVA: 630, ucc: 4, manual: true, manualKA: 15 })).toBe(15); });
  it("2 geradores em paralelo somam potência; redundância não", () => {
    expect(genSet({ mode: "Auto", genKVA: 100, genCount: 2, genMode: "Paralelo" }).kVA).toBe(200);
    expect(genSet({ mode: "Auto", genKVA: 100, genCount: 2, genMode: "Redundante" }).kVA).toBe(100);
  });
  it("inversor automático ≥ 1,25·Ib e ≥ In do gerador", () => { expect(atsRating(100, { mode: "Auto", genKVA: 50 })).toBe(125); });
  it("UPS monofásica 10 kVA ≈ 43 A; trifásica ≈ 14 A", () => {
    expect(upsIcc(10, 1).In).toBeCloseTo(43.5, 0);
    expect(upsIcc(10, 3).In).toBeCloseTo(14.4, 0);
  });
});
