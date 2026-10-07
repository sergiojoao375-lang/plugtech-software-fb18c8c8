import { useState } from "react";
import { Activity, Cable, ChevronDown, ClipboardCheck, Download, FileText, Info, LayoutList, List, MoreHorizontal, PanelLeftClose, PanelLeftOpen, Plus, Save, Settings2, ShieldCheck, SlidersHorizontal, Workflow, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { checkRCD, rcdOf, type RCD } from "@/lib/calc/rcd";
import type { Circuit, CalcResult } from "@/lib/calc/engine";

export type WorkspaceView = "circuitos" | "diferenciais" | "equipamento" | "unifilar" | "frontal" | "curvas" | "auditoria" | "cosphi";
const views = [
  { id: "circuitos", label: "Circuitos", icon: List },
  { id: "diferenciais", label: "Diferenciais", icon: ShieldCheck },
  { id: "equipamento", label: "Equipamento", icon: SlidersHorizontal },
  { id: "unifilar", label: "Unifilar", icon: Workflow },
  { id: "frontal", label: "Frontal DIN", icon: LayoutList },
  { id: "curvas", label: "Curvas I-t", icon: Activity },
  { id: "auditoria", label: "Auditoria", icon: ClipboardCheck },
  { id: "cosphi", label: "Condensadores", icon: Zap },
] as const;
export function WorkspaceSidebar({ view, onView, collapsed, critical, onAbout }: { view: WorkspaceView; onView: (v: WorkspaceView) => void; collapsed: boolean; critical: boolean; onAbout: () => void }) {
  return <aside className={`workspace-sidebar ${collapsed ? "is-collapsed" : ""}`}>
    <div className="workspace-brand"><Zap className="h-7 w-7 shrink-0 text-primary" /><div className="min-w-0"><h1 className="text-lg font-bold">PLUGTECH</h1><span className="text-xs text-muted-foreground">CalcStudio</span></div></div>
    <nav aria-label="Vistas do quadro" className="flex-1 space-y-1 px-3 py-4">
      {views.map(({ id, label, icon: Icon }) => <Button key={id} variant="ghost" onClick={() => onView(id)} title={label} aria-label={label} aria-current={view === id ? "page" : undefined} className={`workspace-nav ${view === id ? "is-active" : ""}`}><Icon /><span className="min-w-0 truncate">{label}</span>{id === "auditoria" && critical && <span className="text-destructive" aria-label="Avisos críticos">●</span>}</Button>)}
    </nav>
    <Button variant="ghost" onClick={onAbout} title="Sobre o software" className="workspace-nav mb-4 mx-3"><Info /><span>Sobre</span></Button>
  </aside>;
}

type Action = { label: string; run: () => void; danger?: boolean };
export function ActionMenu({ label, actions, iconOnly = false }: { label: string; actions: Action[]; iconOnly?: boolean }) {
  return <DropdownMenu><DropdownMenuTrigger asChild><Button size={iconOnly ? "icon" : "sm"} variant="outline" aria-label={label} title={label}>{iconOnly ? <MoreHorizontal /> : <>{label}<ChevronDown /></>}</Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuLabel>{label}</DropdownMenuLabel><DropdownMenuSeparator />{actions.map(a => <DropdownMenuItem key={a.label} onSelect={a.run} className={a.danger ? "text-destructive" : ""}>{a.label}</DropdownMenuItem>)}</DropdownMenuContent></DropdownMenu>;
}

export function WorkspaceToolbar({ panelId, panels, onPanel, collapsed, onCollapse, settingsOpen, onSettings, onSave, projectActions, exportActions }: { panelId: string; panels: { id: string; name: string }[]; onPanel: (id: string) => void; collapsed: boolean; onCollapse: () => void; settingsOpen: boolean; onSettings: () => void; onSave: () => void; projectActions: Action[]; exportActions: Action[] }) {
  return <div className="workspace-toolbar">
    <div className="flex min-w-0 items-center gap-2">
      <Button variant="ghost" size="icon" onClick={onCollapse} aria-label={collapsed ? "Expandir navegação" : "Recolher navegação"} title={collapsed ? "Expandir navegação" : "Recolher navegação"}>{collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}</Button>
      <select aria-label="Quadro atual" className="min-w-0 max-w-48 rounded border border-border bg-surface-2 px-3 py-2 text-sm font-semibold" value={panelId} onChange={e => onPanel(e.target.value)}>{panels.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
      <Button variant="outline" size="sm" onClick={onSettings} aria-expanded={settingsOpen} aria-label="Configurações" title="Configurações"><Settings2 /><span className="hidden lg:inline">Configurações</span></Button>
    </div>
    <div className="flex shrink-0 items-center gap-2">
      <ActionMenu label="Projeto" actions={projectActions} iconOnly />
      <Button size="sm" onClick={onSave} aria-label="Guardar" title="Guardar projeto"><Save /><span className="hidden sm:inline">Guardar</span></Button>
      <ActionMenu label="Exportar" actions={exportActions} />
    </div>
  </div>;
}

type Row = { c: Circuit; r: CalcResult };
export function CircuitProtection({ circuit, rcds, rows, onChange }: { circuit: Circuit; rcds: RCD[]; rows: Row[]; onChange: (rcds: RCD[]) => void }) {
  const current = rcdOf(rcds, circuit.id);
  const check = current ? checkRCD(current, rows) : undefined;
  const assign = (id: string) => {
    const cleared = rcds.map(d => ({ ...d, circuitIds: d.circuitIds.filter(cid => cid !== circuit.id) }));
    if (id === "new") {
      let n = 1;
      while (rcds.some(d => d.label === `DR${n}`)) n++;
      onChange([...cleared, { id: crypto.randomUUID(), label: `DR${n}`, inA: 40, iAnmA: 30, poles: circuit.phase === "Tri" ? 4 : 2, kind: "A", circuitIds: [circuit.id] }]);
    } else onChange(cleared.map(d => d.id === id ? { ...d, circuitIds: [...d.circuitIds, circuit.id] } : d));
  };
  return <div className="min-w-44" onClick={e => e.stopPropagation()}>
    <select aria-label={`Diferencial de ${circuit.name}`} value={current?.id ?? ""} onChange={e => assign(e.target.value)} className={`w-full rounded border bg-background px-2 py-1.5 text-xs ${!current ? "border-warning/50 text-warning" : check?.ok ? "border-primary/40 text-primary" : "border-destructive/50 text-destructive"}`}>
      <option value="">Sem diferencial</option>
      {rcds.map(d => <option key={d.id} value={d.id}>{d.label} · {d.iAnmA} mA · {d.kind}</option>)}
      <option value="new">+ Novo DR · A · 30 mA</option>
    </select>
    {current && <div className={`mt-1 text-[10px] ${check?.ok ? "text-muted-foreground" : "text-destructive"}`} title={check?.issues.join("\n")}>{current.inA} A · {current.poles}P{check?.ok ? "" : " · Verificar DR"}</div>}
  </div>;
}

export function DiagramCircuitList({ rows, rcds, onRcds, onAdd, onPick }: { rows: Row[]; rcds: RCD[]; onRcds: (d: RCD[]) => void; onAdd: () => void; onPick: (c: Circuit) => void }) {
  const [open, setOpen] = useState(true);
  return <section className="diagram-circuit-list">
    <div className="flex items-center justify-between border-b border-border px-4 py-2"><Button variant="ghost" size="sm" onClick={() => setOpen(!open)} aria-expanded={open}><ChevronDown className={open ? "" : "-rotate-90"} />Circuitos <span className="text-muted-foreground">{rows.length}</span></Button><Button variant="ghost" size="sm" onClick={onAdd} className="text-primary"><Plus />Adicionar</Button></div>
    {open && <div className="max-h-56 overflow-auto"><table className="w-full whitespace-nowrap text-left text-xs"><thead className="sticky top-0 bg-background text-muted-foreground"><tr>{["#", "Designação", "P (W)", "Diferencial", "In (A)", "Secção", "ΔU %"].map(h => <th key={h} className="px-4 py-2 font-medium">{h}</th>)}</tr></thead><tbody>{rows.map(({ c, r }, i) => <tr key={c.id} className="border-t border-border/50"><td className="px-4 py-2 text-brand-blue">{i + 1}</td><td className="px-4 py-2"><Button variant="link" size="sm" className="h-auto p-0 text-foreground" onClick={() => onPick(c)}>{c.name}</Button></td><td className="px-4 py-2">{c.power}</td><td className="px-4 py-2"><CircuitProtection circuit={c} rcds={rcds} rows={rows} onChange={onRcds} /></td><td className="px-4 py-2">{r.in}</td><td className="px-4 py-2">{r.section} mm²</td><td className="px-4 py-2">{r.deltaU.toFixed(2)}</td></tr>)}</tbody></table></div>}
  </section>;
}