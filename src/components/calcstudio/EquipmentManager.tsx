// Equipamento do quadro: fontes/inversor, UPS, barramentos, DST, bobina MX e módulos de comando/AVAC
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ActionMenu } from "./WorkspaceControls";
import type { Circuit, CalcResult } from "@/lib/calc/engine";
import {
  CONTROL_INFO, MX_TRIGGERS, METER_INFO, TRAFO_KVA, atsRating, checkEquipment, defaultUcc, genSet, mxReasons, newControl, newMeter, recommendSpd, sizeBusbar, busIb, terminals, tiRatio, transformerIccKA, transformerOriginKA, upsIcc,
  type Bus, type BusKind, type ControlKind, type ControlModule, type MeterKind, type MxTrigger, type PanelEquip, type SpdType, type Transformer,
} from "@/lib/calc/equipment";
import { ElectricalSymbol, METER_SYMBOL } from "./ElectricalSymbol";

type Row = { c: Circuit; r: CalcResult };
const sel = "rounded border border-border bg-[color:var(--surface-2)] px-1 py-1 text-xs";
const card = "equipment-section border-b border-border py-5";
const qbtn = "rounded-md border border-border px-2 py-1 text-xs hover:bg-[color:var(--surface-2)]";
const h = "mb-2 text-sm font-bold";

function CircuitPicker({ rows, ids, onToggle, taken }: { rows: Row[]; ids: string[]; onToggle: (id: string) => void; taken?: (id: string) => string | undefined }) {
  return (
    <div className="mt-2 grid max-h-48 grid-cols-1 gap-1 overflow-auto sm:grid-cols-2 lg:grid-cols-3">
      {rows.map(({ c, r }, i) => (
        <label key={c.id} className={`flex items-center gap-2 rounded px-2 py-1 text-xs ${ids.includes(c.id) ? "bg-[color:var(--brand-green)]/15" : "hover:bg-[color:var(--surface-2)]"}`}>
          <input type="checkbox" checked={ids.includes(c.id)} onChange={() => onToggle(c.id)} />
          <span className="flex-1 truncate">C{i + 1} {c.name}</span>
          <span className="text-muted-foreground">{r.in}A</span>
          {taken?.(c.id) && <span className="text-[10px] text-muted-foreground">({taken(c.id)})</span>}
        </label>
      ))}
      {!rows.length && <span className="text-xs text-muted-foreground">Sem circuitos no quadro.</span>}
    </div>
  );
}

export function EquipmentManager({ equip, rows, onChange, isQGE, panelIb, iccKA, tri = true, onOriginKA }: { equip: PanelEquip; rows: Row[]; onChange: (e: PanelEquip) => void; isQGE: boolean; panelIb: number; iccKA: number; tri?: boolean; onOriginKA?: (kA: number) => void }) {
  const e = equip;
  const set = (p: Partial<PanelEquip>) => onChange({ ...e, ...p });
  const setTrafo = (t: Transformer) => { set({ transformer: t }); const k = transformerOriginKA(t); if (k !== null && onOriginKA) onOriginKA(k); };
  const meters = e.meters ?? [];
  const [open, setOpen] = useState<string | null>(null);
  const issues = checkEquipment(rows, e, isQGE, panelIb, iccKA);
  const reasons = mxReasons(rows, e);
  const buses = e.buses ?? [];
  const controls = e.controls ?? [];
  const bb = sizeBusbar(panelIb, iccKA);

  const toggleTrig = (t: MxTrigger) => {
    const cur = e.mxTriggers ?? [];
    const next = cur.includes(t) ? cur.filter(x => x !== t) : [...cur, t];
    set({ mxTriggers: next, mxFitted: next.length ? true : e.mxFitted });
  };
  const addBus = (kind: BusKind) => set({ buses: [...buses, { id: crypto.randomUUID(), name: kind === "Normal" ? "Barramento Normal" : kind === "Socorro" ? "Barramento Socorro (GE)" : kind === "UPS" ? "Barramento UPS" : "Pente de ligação", kind, circuitIds: [] }] });
  const patchBus = (id: string, p: Partial<Bus>) => set({ buses: buses.map(b => b.id === id ? { ...b, ...p } : b) });
  const toggleBus = (id: string, cid: string) => set({ buses: buses.map(b => b.id === id ? { ...b, circuitIds: b.circuitIds.includes(cid) ? b.circuitIds.filter(x => x !== cid) : [...b.circuitIds, cid] } : { ...b, circuitIds: b.circuitIds.filter(x => x !== cid) }) });
  const addCtl = (k: ControlKind) => { const m = newControl(k, controls); set({ controls: [...controls, m] }); setOpen(m.id); };
  const patchCtl = (id: string, p: Partial<ControlModule>) => set({ controls: controls.map(m => m.id === id ? { ...m, ...p } : m) });
  const toggleCtl = (id: string, cid: string) => set({ controls: controls.map(m => m.id === id ? { ...m, circuitIds: m.circuitIds.includes(cid) ? m.circuitIds.filter(x => x !== cid) : [...m.circuitIds, cid] } : m) });

  return (
    <div className="equipment-manager px-4">
      {/* Verificação */}
      <div className={`${card} ${issues.some(i => i.level === "critical") ? "border-destructive/60" : "border-[color:var(--brand-green)]/60"}`}>
        <div className={h}>{issues.some(i => i.level === "critical") ? "✗ Equipamento com falhas" : "✓ Equipamento verificado"}</div>
        <ul className="space-y-0.5 text-xs">
          {issues.map((i, k) => <li key={k} className={i.level === "critical" ? "text-destructive" : i.level === "warn" ? "text-warning" : "text-muted-foreground"}>{i.level === "critical" ? "✗" : i.level === "warn" ? "⚠" : "ℹ"} {i.msg}</li>)}
          {!issues.length && <li className="text-muted-foreground">Sem observações.</li>}
        </ul>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Transformador */}
        <div className={card}>
          <div className={h}>🔌 Transformador MT/BT</div>
          {!e.transformer ? <Button variant="secondary" size="sm" className={qbtn} onClick={() => setTrafo({ active: true, kVA: 630, ucc: 4 })}>+ Adicionar transformador</Button> : (() => { const t = e.transformer; const auto = transformerIccKA(t.kVA, t.ucc); return (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <label className="flex items-center gap-1 font-semibold"><input type="checkbox" checked={t.active} onChange={ev => setTrafo({ ...t, active: ev.target.checked })} /> Ativo</label>
              <select className={sel} value={t.kVA} onChange={ev => { const k = +ev.target.value; setTrafo({ ...t, kVA: k, ucc: defaultUcc(k) }); }}>{TRAFO_KVA.map(k => <option key={k} value={k}>{k} kVA</option>)}</select>
              ucc <input type="number" step="0.5" className={`${sel} w-14`} value={t.ucc} onChange={ev => setTrafo({ ...t, ucc: +ev.target.value || 4 })} /> %
              <label className="flex items-center gap-1"><input type="checkbox" checked={!!t.manual} onChange={ev => setTrafo({ ...t, manual: ev.target.checked, manualKA: t.manualKA ?? auto })} /> Icc manual (existente)</label>
              {t.manual && <><input type="number" step="0.1" className={`${sel} w-16`} value={t.manualKA ?? auto} onChange={ev => setTrafo({ ...t, manualKA: +ev.target.value || 0 })} /> kA</>}
              <span className="w-full font-mono text-muted-foreground">{t.active ? `Icc origem aplicado: ${transformerOriginKA(t)} kA` : "Inativo — Icc de origem definido nas configurações"} · calculado {auto} kA · In {(t.kVA * 1000 / (Math.sqrt(3) * 400)).toFixed(0)} A</span>
              <Button variant="secondary" size="sm" className="text-destructive" onClick={() => set({ transformer: null })}>🗑</Button>
            </div>); })()}
        </div>
        {/* Fontes e inversor */}
        <div className={card}>
          <div className={h}>⚡ Fontes e inversor (Rede / Gerador)</div>
          {!e.ats ? <Button variant="secondary" size="sm" className={qbtn} onClick={() => set({ ats: { mode: "Auto", genKVA: 100, genCount: 1, phases: tri ? 3 : 1 } })}>+ Adicionar inversor Rede/Gerador</Button> : (() => { const a = e.ats; const g = genSet(a); const pa = (p: Partial<typeof a>) => set({ ats: { ...a, ...p } }); return (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <select className={sel} value={a.mode} onChange={ev => pa({ mode: ev.target.value as "Manual" | "Auto" })}>
                <option value="Auto">Automático (ATS)</option><option value="Manual">Manual I-0-II</option>
              </select>
              <select className={sel} value={a.genCount ?? 1} onChange={ev => pa({ genCount: +ev.target.value as 1 | 2 })}><option value={1}>1 gerador</option><option value={2}>Grupo de 2 geradores</option></select>
              {(a.genCount ?? 1) === 2 && <select className={sel} value={a.genMode ?? "Paralelo"} onChange={ev => pa({ genMode: ev.target.value as "Paralelo" | "Redundante" })}><option value="Paralelo">Paralelo (soma)</option><option value="Redundante">Redundância 1+1</option></select>}
              <select className={sel} value={a.phases ?? 3} onChange={ev => pa({ phases: +ev.target.value as 1 | 3 })}><option value={3}>Trifásico</option><option value={1}>Monofásico</option></select>
              {(a.genCount ?? 1) === 2 ? "Cada" : "Gerador"} <input type="number" className={`${sel} w-20`} value={a.genKVA} onChange={ev => pa({ genKVA: +ev.target.value || 0 })} /> kVA
              <span className="w-full font-mono text-muted-foreground">Total {g.kVA} kVA · In {g.In.toFixed(0)} A · Icc ≈ {g.icc.toFixed(0)} A · Inversor automático <b className="text-brand-green">{atsRating(panelIb, a)} A {(a.phases ?? 3) === 3 ? "4P" : "2P"}</b></span>
              <Button variant="secondary" size="sm" className="text-destructive" onClick={() => set({ ats: null })}>🗑</Button>
            </div>); })()}
          <div className={`${h} mt-4`}>🔋 UPS (alimentação ininterrupta)</div>
          {!e.ups ? <Button variant="secondary" size="sm" className={qbtn} onClick={() => set({ ups: { kVA: 10, autonomyMin: 15, bypass: true, phases: tri ? 3 : 1, pf: 0.9 }, buses: buses.some(b => b.kind === "UPS") ? buses : [...buses, { id: crypto.randomUUID(), name: "Barramento UPS", kind: "UPS", circuitIds: [] }] })}>+ Adicionar UPS</Button> : (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <select className={sel} value={e.ups.phases ?? 3} onChange={ev => e.ups && set({ ups: { ...e.ups, phases: +ev.target.value as 1 | 3 } })}><option value={3}>Trifásica 400 V</option><option value={1}>Monofásica 230 V</option></select>
              <input type="number" className={`${sel} w-16`} value={e.ups.kVA} onChange={ev => e.ups && set({ ups: { ...e.ups, kVA: +ev.target.value || 0 } })} /> kVA
              FP <input type="number" step="0.05" className={`${sel} w-14`} value={e.ups.pf ?? 0.9} onChange={ev => e.ups && set({ ups: { ...e.ups, pf: +ev.target.value || 0.9 } })} />
              <input type="number" className={`${sel} w-14`} value={e.ups.autonomyMin} onChange={ev => e.ups && set({ ups: { ...e.ups, autonomyMin: +ev.target.value || 0 } })} /> min
              <label className="flex items-center gap-1"><input type="checkbox" checked={e.ups.bypass} onChange={ev => e.ups && set({ ups: { ...e.ups, bypass: ev.target.checked } })} /> Bypass</label>
              <span className="font-mono text-muted-foreground">In {upsIcc(e.ups.kVA, e.ups.phases ?? 3).In.toFixed(0)} A{(e.ups.phases ?? 3) === 3 ? "/fase" : ""} · Icc bateria ≈ {upsIcc(e.ups.kVA, e.ups.phases ?? 3).icc.toFixed(0)} A</span>
              <Button variant="secondary" size="sm" className="text-destructive" onClick={() => set({ ups: null })}>🗑</Button>
              <span className="w-full text-muted-foreground">A jusante da UPS use diferenciais Tipo F ou B e disjuntores curva B.</span>
            </div>
          )}
        </div>


        {/* DST + MX */}
        <div className={card}>
          <div className={h}>🛡 Descarregador de sobretensões (DST)</div>
          <label className="mb-2 flex items-center gap-2 text-xs"><input type="checkbox" checked={!!e.lightningRod} onChange={ev => set({ lightningRod: ev.target.checked })} /> Edifício com para-raios (SPDA) / linha aérea exposta</label>
          {!e.spd ? <Button variant="secondary" size="sm" className={qbtn} onClick={() => set({ spd: { type: recommendSpd(e, isQGE), poles: 4, iKA: e.lightningRod ? 12.5 : 40, backupA: e.lightningRod ? 63 : 32 } })}>+ Adicionar DST (recomendado: {recommendSpd(e, isQGE)})</Button> : (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <select className={sel} value={e.spd.type} onChange={ev => e.spd && set({ spd: { ...e.spd, type: ev.target.value as SpdType } })}>
                <option value="T1">Tipo 1 (10/350 µs)</option><option value="T1+2">Tipo 1+2</option><option value="T2">Tipo 2 (8/20 µs)</option><option value="T3">Tipo 3 (fina)</option>
              </select>
              <select className={sel} value={e.spd.poles} onChange={ev => e.spd && set({ spd: { ...e.spd, poles: +ev.target.value as 2 | 4 } })}><option value={2}>1P+N</option><option value={4}>3P+N</option></select>
              {e.spd.type.startsWith("T1") ? "Iimp" : "Imax"} <input type="number" className={`${sel} w-14`} value={e.spd.iKA} onChange={ev => e.spd && set({ spd: { ...e.spd, iKA: +ev.target.value || 0 } })} /> kA
              Proteção <select className={sel} value={e.spd.backupA} onChange={ev => e.spd && set({ spd: { ...e.spd, backupA: +ev.target.value } })}>{[20, 25, 32, 40, 50, 63, 80, 125].map(v => <option key={v} value={v}>{v} A</option>)}</select>
              <Button variant="secondary" size="sm" className="text-destructive" onClick={() => set({ spd: null })}>🗑</Button>
            </div>
          )}
          <div className={`${h} mt-4`}>🚨 Corte de segurança — bobina MX</div>
          <div className="grid gap-2 text-xs">
            {(Object.keys(MX_TRIGGERS) as MxTrigger[]).map(t => <label key={t} className="flex items-start gap-2"><input type="checkbox" className="mt-0.5 shrink-0" checked={e.mxTriggers?.includes(t) ?? false} onChange={() => toggleTrig(t)} /><span>{MX_TRIGGERS[t]}</span></label>)}
          </div>
          {reasons.length > 0 && <ul className="mt-2 text-xs text-warning">{reasons.map((r, i) => <li key={i}>• {r}</li>)}</ul>}
          <label className="mt-2 flex items-center gap-2 text-xs font-semibold"><input type="checkbox" checked={!!e.mxFitted} onChange={ev => set({ mxFitted: ev.target.checked })} /> Interruptor geral equipado com bobina MX (bornes C1/C2)</label>
          {reasons.length > 0 && !e.mxFitted && <Button variant="secondary" size="sm" className={`${qbtn} mt-1`} onClick={() => set({ mxFitted: true })}>Equipar bobina MX</Button>}
        </div>
      </div>

      {/* Barramentos */}
      <div className={card}>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold">▬ Barramentos</span>
          <span className="text-xs text-muted-foreground">Geral: Cu {bb.bar} mm ({bb.iz} A) para {panelIb.toFixed(0)} A · Ipk {bb.ipkKA} kA</span>
          <div className="ml-auto shrink-0"><ActionMenu label="Adicionar barramento" actions={(["Normal", "Socorro", "UPS", "Pente"] as BusKind[]).map(k => ({ label: k, run: () => addBus(k) }))} /></div>
        </div>
        {buses.map(b => {
          const ib = busIb(b, rows); const s = sizeBusbar(ib, iccKA);
          return (
            <div key={b.id} className="mb-2 rounded border border-border p-2">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <input className={`${sel} w-48 font-bold`} value={b.name} onChange={ev => patchBus(b.id, { name: ev.target.value })} />
                <span className="rounded bg-[color:var(--surface-2)] px-2 py-0.5">{b.kind}</span>
                <span className="font-mono">ΣIb {ib.toFixed(1)} A → Cu {s.bar} ({s.iz} A)</span>
                <Button variant="secondary" size="sm" className="ml-auto text-destructive" onClick={() => set({ buses: buses.filter(x => x.id !== b.id) })}>🗑</Button>
              </div>
              <CircuitPicker rows={rows} ids={b.circuitIds} onToggle={cid => toggleBus(b.id, cid)} taken={cid => buses.find(o => o.id !== b.id && o.circuitIds.includes(cid))?.name} />
            </div>
          );
        })}
      </div>

      {/* Comando e AVAC */}
      <div className={card}>
        <div className={h}>🎛 Comando e automação</div>
        <div className="mb-4 flex gap-2">
          {(["Comando", "AVAC"] as const).map(g => <ActionMenu key={g} label={g === "Comando" ? "Adicionar comando" : "Adicionar AVAC"} actions={(Object.keys(CONTROL_INFO) as ControlKind[]).filter(k => CONTROL_INFO[k].group === g).map(k => ({ label: CONTROL_INFO[k].name, run: () => addCtl(k) }))} />)}
        </div>
        {controls.map(m => {
          const info = CONTROL_INFO[m.kind];
          return (
            <div key={m.id} className="mb-2 rounded border border-border p-2">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <input className={`${sel} w-16 font-bold`} value={m.label} onChange={ev => patchCtl(m.id, { label: ev.target.value })} />
                <span className="font-semibold">{info.name}</span>
                Entradas <input type="number" min={0} className={`${sel} w-12`} value={m.inputs} onChange={ev => patchCtl(m.id, { inputs: Math.max(0, +ev.target.value) })} />
                Saídas <input type="number" min={0} className={`${sel} w-12`} value={m.outputs} onChange={ev => patchCtl(m.id, { outputs: Math.max(0, +ev.target.value) })} />
                {m.kind === "VSD" || m.kind === "DDC" ? "Analógicas" : "Auxiliares"} <input type="number" min={0} className={`${sel} w-12`} value={m.aux} onChange={ev => patchCtl(m.id, { aux: Math.max(0, +ev.target.value) })} />
                <select className={sel} value={m.coilV} onChange={ev => patchCtl(m.id, { coilV: +ev.target.value as 230 | 24 })}><option value={230}>230 V</option><option value={24}>24 V</option></select>
                <span className="text-muted-foreground">{m.circuitIds.length} circ.</span>
                <Button variant="secondary" size="sm" className={qbtn} onClick={() => setOpen(open === m.id ? null : m.id)}>{open === m.id ? "Fechar" : "Circuitos / bornes"}</Button>
                <Button variant="secondary" size="sm" className="text-destructive" onClick={() => set({ controls: controls.filter(x => x.id !== m.id) })}>🗑</Button>
              </div>
              {open === m.id && (
                <>
                  <div className="mt-1 text-[11px] text-muted-foreground">{info.hint}</div>
                  <CircuitPicker rows={rows} ids={m.circuitIds} onToggle={cid => toggleCtl(m.id, cid)} />
                  <div className="mt-2 flex flex-wrap gap-1">{terminals(m).map((t, i) => <span key={i} className="rounded bg-[color:var(--surface-2)] px-1.5 py-0.5 font-mono text-[10px]">X1:{m.label}.{t}</span>)}</div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Medição e comunicação */}
      <div className={card}>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold">📟 Medição e comunicação</span>
          <span className="text-xs text-muted-foreground">TI sugerido: {tiRatio(panelIb).label} para Ib {panelIb.toFixed(0)} A</span>
          <div className="ml-auto shrink-0"><ActionMenu label="Adicionar medição" actions={(Object.keys(METER_INFO) as MeterKind[]).map(k => ({ label: METER_INFO[k].name, run: () => set({ meters: [...meters, newMeter(k, meters, tri)] }) }))} /></div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {meters.map(m => (
            <div key={m.id} className="flex items-center gap-2 rounded border border-border p-2 text-xs">
              <svg width={44} height={52} viewBox="-22 -26 44 52" className="shrink-0 text-brand-blue"><ElectricalSymbol kind={METER_SYMBOL[m.kind]} /></svg>
              <div className="min-w-0 flex-1">
                <input className={`${sel} w-16 font-bold`} value={m.label} onChange={ev => set({ meters: meters.map(x => x.id === m.id ? { ...x, label: ev.target.value } : x) })} />
                <div className="truncate">{METER_INFO[m.kind].name}</div>
                <div className="text-muted-foreground">{m.kind === "TI" ? tiRatio(panelIb).label : `${METER_INFO[m.kind].din} mód. DIN`}</div>
              </div>
              Qtd <input type="number" min={1} className={`${sel} w-12`} value={m.qty} onChange={ev => set({ meters: meters.map(x => x.id === m.id ? { ...x, qty: Math.max(1, +ev.target.value) } : x) })} />
              <Button variant="secondary" size="sm" className="text-destructive" onClick={() => set({ meters: meters.filter(x => x.id !== m.id) })}>🗑</Button>
            </div>
          ))}
          {!meters.length && <span className="text-xs text-muted-foreground">Sem aparelhos de medição. Adicione TI, amperímetro, analisador, Modbus ou KNX.</span>}
        </div>
      </div>
    </div>
  );
}
