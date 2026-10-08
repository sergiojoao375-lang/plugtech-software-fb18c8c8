import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { CircuitProtection } from "@/components/calcstudio/WorkspaceControls";
import type { Circuit } from "@/lib/calc/engine";
import type { RCD } from "@/lib/calc/rcd";

const circuit: Circuit = { id: "c1", name: "Tomadas", type: "Tomadas", power: 2000, length: 20, cosphi: 0.95, cable: "H07V-K", material: "Cu", scenario: "Embutido", phase: "Mono" };
const dr: RCD = { id: "dr1", label: "DR1", inA: 40, iAnmA: 30, poles: 2, kind: "A", circuitIds: ["c1"] };

describe("Circuit differential assignment", () => {
  it("moves a circuit to the chosen differential without duplicating protection", () => {
    const change = vi.fn();
    render(<CircuitProtection circuit={circuit} rows={[]} rcds={[dr, { ...dr, id: "dr2", label: "DR2", circuitIds: ["c2"] }]} onChange={change} />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "dr2" } });
    expect(change.mock.calls[0][0].map((d: RCD) => d.circuitIds)).toEqual([[], ["c2", "c1"]]);
    cleanup();
  });
  it("creates and assigns a new 30 mA differential from the circuit row", () => {
    const change = vi.fn();
    render(<CircuitProtection circuit={circuit} rows={[]} rcds={[]} onChange={change} />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "new" } });
    expect(change.mock.calls[0][0][0]).toMatchObject({ iAnmA: 30, kind: "A", poles: 2, circuitIds: ["c1"] });
    cleanup();
  });
  it("removes an assignment without deleting the differential or other circuits", () => {
    const change = vi.fn();
    render(<CircuitProtection circuit={circuit} rows={[]} rcds={[{ ...dr, circuitIds: ["c1", "c2"] }]} onChange={change} />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "" } });
    expect(change.mock.calls[0][0]).toEqual([{ ...dr, circuitIds: ["c2"] }]);
    cleanup();
  });
});