import type { ControlKind } from "@/lib/calc/equipment";

export type SymbolKind = "breaker" | "switch" | "rcd" | "rcbo" | "fuse" | "fused-switch" | "terminal" | "earth" | "contactor" | "impulse" | "timer" | "clock" | "transformer" | "voltage" | "meter" | "ups" | "generator" | "ats" | "spd" | "coil" | "thermal" | "vsd" | "thermostat" | "pressure" | "ddc" | "twilight" | "lamp" | "socket" | "motor" | "ct" | "vt" | "ammeter" | "voltmeter" | "analyzer" | "modbus" | "knx" | "knxpsu";

export const METER_SYMBOL: Record<import("@/lib/calc/equipment").MeterKind, SymbolKind> = {
  TI: "ct", TT: "vt", Amperimetro: "ammeter", Voltimetro: "voltmeter", Analisador: "analyzer", Contador: "meter", Modbus: "modbus", KNX: "knx", FonteKNX: "knxpsu",
};

export const CONTROL_SYMBOL: Record<ControlKind, SymbolKind> = {
  Telerruptor: "impulse", Escada: "timer", Contactor: "contactor", Crepuscular: "twilight", Horario: "clock", Sinalizador: "lamp",
  Termostato: "thermostat", ContactorTermico: "contactor", VSD: "vsd", Pressostato: "pressure", DDC: "ddc",
};

// Vertical symbols: terminals at y = -22 and +22. Rectangles below are actual
// device symbols (fuse, converter, relay), never generic equipment containers.
export function ElectricalSymbol({ kind, x = 0, y = 0 }: { kind: SymbolKind; x?: number; y?: number }) {
  const contact = <><path d="M0 -22V-8 M0 8V22 M0 8L10 -6" /><circle cx={0} cy={-8} r={1.5} fill="currentColor" /></>;
  const converter = <><path d="M0 -22V-14 M0 14V22" /><rect x={-12} y={-14} width={24} height={28} /><path d="M-12 14L12 -14 M-9 -6Q-6 -12 -3 -6T3 -6 M1 7H9 M1 10H9" /></>;
  let shape;
  switch (kind) {
    case "switch": shape = contact; break;
    case "breaker": case "rcbo":
      shape = <>{contact}<path d="M-4 4L4 12 M-4 12L4 4 M-7 -7H-12V3H-7 M-12 -2H-16" />{kind === "rcbo" && <><ellipse cx={0} cy={-16} rx={8} ry={3} /><path d="M-8 -16H-19V8H-4" strokeDasharray="2 2" /></>}</>; break;
    case "rcd": shape = <>{contact}<ellipse cx={0} cy={-16} rx={8} ry={3} /><path d="M-8 -16H-17V8H-3" strokeDasharray="2 2" /></>; break;
    case "fuse": shape = <><path d="M0 -22V22" /><rect x={-4} y={-12} width={8} height={24} /></>; break;
    case "fused-switch": shape = <>{contact}<rect x={-4} y={-21} width={8} height={11} /></>; break;
    case "terminal": shape = <><path d="M0 -22V-3 M0 3V22" /><circle r={3} /></>; break;
    case "earth": shape = <path d="M0 -22V0 M-12 0H12 M-8 5H8 M-4 10H4" />; break;
    case "contactor": shape = <>{contact}<path d="M-9 0H15 M-9 -3V3" strokeDasharray="3 2" /></>; break;
    case "impulse": shape = <>{contact}<path d="M-11 -2H-5V-9H1 M-11 2H-5V-5H1" /></>; break;
    case "timer": case "clock": case "twilight":
      shape = <><path d="M0 -22V-11 M0 11V22" /><rect x={-7} y={-11} width={14} height={22} />{kind === "timer" ? <path d="M-4 -4H4 M-4 4H4 M-3 -4L3 4 M3 -4L-3 4" /> : kind === "clock" ? <><circle r={5} /><path d="M0 -4V0H3" /></> : <><circle r={4} /><path d="M-17 -8L-10 -3 M-17 0L-10 4 M-14 -4L-10 -3L-12 -7" /></>}</>; break;
    case "transformer": shape = <><path d="M0 -22V-12 M0 12V22" /><circle cy={-5} r={7} /><circle cy={5} r={7} /></>; break;
    case "voltage": case "meter": case "generator": case "motor": case "lamp":
      shape = <><path d="M0 -22V-12 M0 12V22" /><circle r={12} />{kind === "lamp" ? <path d="M-8 -8L8 8 M8 -8L-8 8" /> : <text y={4} textAnchor="middle" stroke="none" fill="currentColor" fontSize={kind === "meter" ? 8 : 12}>{kind === "meter" ? "kWh" : kind === "voltage" ? "V" : kind === "generator" ? "G" : "M"}</text>}{(kind === "motor" || kind === "generator") && <path d="M-5 6Q-2 2 1 6T7 6" />}</>; break;
    case "ups": shape = <>{converter}<path d="M-19 -5V5 M-23 -2V2 M-19 0H-12" /></>; break;
    case "vsd": shape = <>{converter}<path d="M1 7Q3 3 5 7T9 7" /></>; break;
    case "ats": shape = <><path d="M-14 -22V-7 M14 -22V-7 M0 10V22 M0 10L12 -5" /><circle cx={-14} cy={-7} r={2} /><circle cx={14} cy={-7} r={2} /><path d="M-12 2H12" strokeDasharray="3 2" /></>; break;
    case "spd": shape = <><path d="M0 -22V-13 M0 13V22" /><rect x={-7} y={-13} width={14} height={26} /><path d="M3 -9L-3 1H3L-3 9" /></>; break;
    case "coil": shape = <><path d="M-22 0H-12 M12 0H22" /><rect x={-12} y={-7} width={24} height={14} /><path d="M-8 5L8 -5" /></>; break;
    case "thermal": shape = <><path d="M0 -22V-12 M0 12V22 M-7 -12H7V12H-7Z M-3 -6V6H3" /></>; break;
    case "thermostat": case "pressure": shape = <>{contact}<circle cx={-13} r={7} /><text x={-13} y={3} textAnchor="middle" stroke="none" fill="currentColor" fontSize={9}>{kind === "pressure" ? "P" : "ϑ"}</text><path d="M-6 0H4" strokeDasharray="2 2" /></>; break;
    case "ddc": shape = <><path d="M0 -22V-11 M0 11V22" /><path d="M-13 -11H13V11H-13Z M-19 -6H-13 M-19 0H-13 M-19 6H-13 M13 -6H19 M13 0H19 M13 6H19" /><text y={3} textAnchor="middle" stroke="none" fill="currentColor" fontSize={8}>I/O</text></>; break;
    case "socket": shape = <><path d="M0 -22V-10 M-10 0A10 10 0 0 1 10 0 M-5 0V7 M5 0V7 M0 -6V0" /></>; break;
    case "ct": shape = <><path d="M0 -22V22 M-14 0H-8 M8 0H14" /><circle r={8} /><text x={16} y={-10} stroke="none" fill="currentColor" fontSize={7}>S1 S2</text></>; break;
    case "vt": shape = <><path d="M0 -22V-14 M0 14V22" /><circle cy={-6} r={8} /><circle cy={6} r={8} /><text x={11} y={3} stroke="none" fill="currentColor" fontSize={7}>TT</text></>; break;
    case "ammeter": case "voltmeter":
      shape = <><path d="M0 -22V-12 M0 12V22" /><circle r={12} /><text y={5} textAnchor="middle" stroke="none" fill="currentColor" fontSize={13}>{kind === "ammeter" ? "A" : "V"}</text></>; break;
    case "analyzer": shape = <><path d="M0 -22V-12 M0 12V22" /><rect x={-14} y={-12} width={28} height={24} /><path d="M-10 4L-5 -2L0 3L5 -6L10 0" /><text y={10} textAnchor="middle" stroke="none" fill="currentColor" fontSize={6}>kW·cos</text></>; break;
    case "modbus": case "knx": case "knxpsu":
      shape = <><path d="M0 -22V-10 M0 10V22 M14 0H22" strokeDasharray={kind === "knxpsu" ? undefined : "3 2"} /><rect x={-14} y={-10} width={28} height={20} /><text y={4} textAnchor="middle" stroke="none" fill="currentColor" fontSize={kind === "modbus" ? 6 : 8}>{kind === "modbus" ? "RS485" : kind === "knx" ? "KNX" : "PSU"}</text></>; break;
  }
  return <g transform={`translate(${x},${y})`} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="square" strokeLinejoin="miter">{shape}</g>;
}

export const SYMBOL_LEGEND: Array<[SymbolKind, string]> = [
  ["meter", "Contador de energia"], ["switch", "Interruptor"], ["fuse", "Corta-circuito fusível"],
  ["terminal", "Ligador / borne amovível"], ["earth", "Elétrodo de terra"], ["breaker", "Disjuntor magnetotérmico"],
  ["rcd", "Interruptor diferencial"], ["rcbo", "Disjuntor diferencial"], ["contactor", "Contactor"],
  ["impulse", "Telerruptor"], ["timer", "Automático de escada"], ["clock", "Interruptor horário modular"],
  ["fused-switch", "Seccionador com fusíveis"], ["transformer", "Transformador"], ["voltage", "Indicador de tensão"],
  ["ups", "Alimentação ininterrupta / UPS"], ["spd", "DST"], ["coil", "Bobina MX"], ["ats", "Inversor Rede / Gerador"],
  ["thermal", "Relé térmico"], ["vsd", "Variador de velocidade"], ["twilight", "Interruptor crepuscular"],
  ["thermostat", "Termóstato"], ["pressure", "Pressostato / fluxostato"], ["ddc", "DDC / PLC / BMS"],
  ["ct", "Transformador de intensidade (TI)"], ["vt", "Transformador de tensão (TT)"], ["ammeter", "Amperímetro"], ["voltmeter", "Voltímetro"],
  ["analyzer", "Analisador de redes"], ["modbus", "Gateway Modbus RS485"], ["knx", "Actuador KNX"], ["knxpsu", "Fonte KNX"],
];