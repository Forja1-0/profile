import { ReactNode, useEffect, useState } from "react";

/* ---------- Toast global (feedback de guardado) ---------- */
type ToastKind = "ok" | "error";
const toastSub = new Set<(t: { id: number; msg: string; kind: ToastKind }) => void>();
let toastSeq = 0;
export function toast(msg: string, kind: ToastKind = "ok") {
  const t = { id: ++toastSeq, msg, kind };
  toastSub.forEach((fn) => fn(t));
}
export function Toaster() {
  const [items, setItems] = useState<{ id: number; msg: string; kind: ToastKind }[]>([]);
  useEffect(() => {
    const fn = (t: { id: number; msg: string; kind: ToastKind }) => {
      setItems((p) => [...p, t]);
      setTimeout(() => setItems((p) => p.filter((x) => x.id !== t.id)), 3200);
    };
    toastSub.add(fn);
    return () => { toastSub.delete(fn); };
  }, []);
  if (!items.length) return null;
  return (
    <div className="fixed z-[120] bottom-5 left-1/2 -translate-x-1/2 flex flex-col gap-2 items-center pointer-events-none">
      {items.map((t) => (
        <div
          key={t.id}
          className="f-fade-up pointer-events-auto flex items-center gap-2 rounded-lg px-4 py-2.5 text-[13px] shadow-lg"
          style={{
            background: t.kind === "ok" ? "rgba(58,90,64,0.95)" : "rgba(122,40,50,0.95)",
            border: `1px solid ${t.kind === "ok" ? "rgba(91,138,100,0.5)" : "rgba(168,64,77,0.5)"}`,
            color: "#E8E4DC",
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 17 }}>
            {t.kind === "ok" ? "check_circle" : "error"}
          </span>
          {t.msg}
        </div>
      ))}
    </div>
  );
}

/* Brand wordmark */
export function Wordmark({ size = 18 }: { size?: number }) {
  return (
    <span className="font-sans font-bold uppercase text-f-text" style={{ fontSize: size, letterSpacing: "0.18em" }}>
      FORJA
    </span>
  );
}

/* Reduced brand mark — "F" en cuadrado redondeado */
export function Brandmark({ size = 32, variant = "green" }: { size?: number; variant?: "green" | "surface" | "red" }) {
  const bg = variant === "green" ? "#3A5A40" : variant === "red" ? "#7A2832" : "#161619";
  const border = variant === "surface" ? "1px solid rgba(255,255,255,0.09)" : "none";
  return (
    <span
      className="inline-flex items-center justify-center font-sans font-bold text-f-text"
      style={{ width: size, height: size, background: bg, border, borderRadius: 8, fontSize: size * 0.5 }}
    >
      F
    </span>
  );
}

export type Tone = "green" | "warn" | "red" | "gold" | "neutral";

export function Pill({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`f-pill f-pill-${tone}`}>{children}</span>;
}

export function Callout({ children, icon = "bolt" }: { children: ReactNode; icon?: string }) {
  return (
    <div className="f-card-soft flex gap-3 items-start">
      <span className="material-symbols-outlined text-f-green-glow mt-0.5" style={{ fontSize: 18 }}>{icon}</span>
      <p className="font-serif italic text-[16px] leading-[1.45] text-f-text">{children}</p>
    </div>
  );
}

/**
 * SectionHeader — en mobile mostramos eyebrow compacto + título + (sin lede)
 * + acción inline. La lede se oculta porque ya hay topbar con contexto y la
 * meta era reducir el muro de texto. En desktop, todo visible: hay espacio
 * y refleja profesionalismo.
 */
export function SectionHeader({
  eyebrow, title, lede, action,
}: { eyebrow: string; title: ReactNode; lede?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-5">
      <div className="min-w-0">
        <div className="f-eyebrow mb-1.5 sm:mb-2">{eyebrow}</div>
        <h1 className="font-sans font-bold text-[22px] sm:text-[26px] leading-[1.15] text-f-text">{title}</h1>
        {lede && <p className="mt-2 text-[14px] leading-[1.55] text-f-text2 max-w-[60ch] hidden sm:block">{lede}</p>}
      </div>
      {action && (
        <div className="flex-none [&>*]:w-full sm:[&>*]:w-auto">{action}</div>
      )}
    </div>
  );
}

export function Tabs<T extends string>({
  tabs, value, onChange,
}: { tabs: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div
      className="f-tabs mb-4 sm:mb-5 -mx-4 sm:mx-0 px-4 sm:px-0 sticky top-12 lg:static z-30 bg-f-black/85 backdrop-blur-sm lg:bg-transparent lg:backdrop-blur-0 py-1.5 lg:py-0"
      role="tablist"
      style={{ scrollSnapType: "x mandatory" } as React.CSSProperties}
    >
      {tabs.map((t) => (
        <button
          key={t.value}
          role="tab"
          aria-selected={value === t.value}
          className="f-tab"
          style={{ scrollSnapAlign: "start" } as React.CSSProperties}
          onClick={() => onChange(t.value)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function Toggle({ on, onToggle, label }: { on: boolean; onToggle: () => void; label?: string }) {
  return (
    <button type="button" className="f-switch" data-on={on} aria-pressed={on} aria-label={label} onClick={onToggle} />
  );
}

export function Checkbox({ checked, onToggle, label }: { checked: boolean; onToggle: () => void; label: ReactNode }) {
  return (
    <label className="flex gap-2.5 items-center cursor-pointer select-none">
      <span className="f-check" data-checked={checked} aria-hidden onClick={onToggle} />
      <span className="text-[14px] text-f-text" onClick={onToggle}>{label}</span>
    </label>
  );
}

export function Chip({ active, onToggle, children }: { active: boolean; onToggle: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="rounded-full px-3 h-8 text-[13px] font-medium transition-colors border"
      style={{
        background: active ? "#2D4532" : "transparent",
        color: active ? "#E8E4DC" : "#8A8680",
        borderColor: active ? "#5B8A64" : "rgba(255,255,255,0.09)",
      }}
    >
      {children}
    </button>
  );
}

export function Segmented<T extends string>({
  value, onChange, options, columns,
}: {
  value: T | null;
  onChange: (v: T) => void;
  options: { value: T; label: string; icon?: string }[];
  columns?: number;
}) {
  return (
    <div className="f-seg" style={{ gridTemplateColumns: `repeat(${columns ?? options.length}, 1fr)` }}>
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={value === o.value} className="f-seg-opt" onClick={() => onChange(o.value)}>
          {o.icon && <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{o.icon}</span>}
          <span>{o.label}</span>
        </button>
      ))}
    </div>
  );
}

export function FileDrop({
  accept, label = "Subir archivo", hint,
}: { accept?: string; label?: string; hint?: ReactNode }) {
  const [file, setFile] = useState<File | null>(null);
  const inputId = `file-${Math.random().toString(36).slice(2, 8)}`;
  if (file) {
    return (
      <div className="f-card !p-3 flex items-center gap-3">
        <span className="material-symbols-outlined text-f-green-light" style={{ fontSize: 20 }}>description</span>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] text-f-text truncate">{file.name}</div>
          <div className="font-mono text-[10px] text-f-text3">{Math.round(file.size / 1024)} KB</div>
        </div>
        <button className="f-btn-ghost text-f-red-light" onClick={() => setFile(null)} aria-label="Quitar">
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
        </button>
      </div>
    );
  }
  return (
    <label
      htmlFor={inputId}
      className="block cursor-pointer rounded-lg border border-dashed border-f-border2 hover:border-f-green-light/60 transition-colors px-5 py-6 text-center bg-f-surface"
    >
      <span className="material-symbols-outlined text-f-text2 block mx-auto mb-2" style={{ fontSize: 24 }}>upload_file</span>
      <div className="font-sans font-medium text-[14px] text-f-text">{label}</div>
      {hint && <div className="text-[12px] text-f-text2 mt-1 leading-[1.5]">{hint}</div>}
      <input
        id={inputId}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) setFile(f); e.target.value = ""; }}
      />
    </label>
  );
}

export function EmptyState({ icon, title, hint }: { icon: string; title: string; hint?: string }) {
  return (
    <div className="text-center py-10">
      <span className="material-symbols-outlined text-f-text3 mb-2" style={{ fontSize: 32 }}>{icon}</span>
      <div className="text-[14px] text-f-text2">{title}</div>
      {hint && <div className="text-[12px] text-f-text3 mt-1">{hint}</div>}
    </div>
  );
}

export function Stat({ label, value, tone }: { label: string; value: ReactNode; tone?: Tone }) {
  const color =
    tone === "green" ? "#abd0af" : tone === "red" ? "#A8404D" : tone === "gold" ? "#C9A24B" : tone === "warn" ? "#C49A3C" : "#D4CFC4";
  return (
    <div>
      <div className="font-sans font-bold leading-none" style={{ fontSize: 22, color }}>{value}</div>
      <div className="f-datalabel mt-1.5">{label}</div>
    </div>
  );
}

/* Item de lista con icono + título + meta + acción */
export function Row({
  icon, iconTone = "neutral", title, sub, meta, action,
}: {
  icon?: string; iconTone?: Tone; title: ReactNode; sub?: ReactNode; meta?: ReactNode; action?: ReactNode;
}) {
  const bg =
    iconTone === "green" ? "rgba(58,90,64,0.18)" : iconTone === "red" ? "rgba(122,40,50,0.15)"
    : iconTone === "gold" ? "rgba(201,162,75,0.14)" : iconTone === "warn" ? "rgba(196,154,60,0.12)" : "#1C1C20";
  const fg =
    iconTone === "green" ? "#abd0af" : iconTone === "red" ? "#A8404D"
    : iconTone === "gold" ? "#C9A24B" : iconTone === "warn" ? "#C49A3C" : "#8A8680";
  return (
    <div className="flex items-center gap-3 py-3.5">
      {icon && (
        <span
          className="material-symbols-outlined flex-none rounded-md flex items-center justify-center"
          style={{ width: 38, height: 38, background: bg, color: fg, fontSize: 20 }}
        >
          {icon}
        </span>
      )}
      <div className="flex-1 min-w-0">
        <div className="text-[14px] text-f-text font-medium truncate">{title}</div>
        {sub && <div className="text-[12px] text-f-text2 mt-0.5 leading-[1.45]">{sub}</div>}
      </div>
      {meta && <div className="flex-none text-right">{meta}</div>}
      {action && <div className="flex-none">{action}</div>}
    </div>
  );
}

/* Confirm dialog (eliminar, etc.) */
export function ConfirmDialog({
  open, title, body, danger, confirmLabel = "Confirmar", onConfirm, onClose,
}: {
  open: boolean; title: string; body: ReactNode; danger?: boolean;
  confirmLabel?: string; onConfirm: () => void; onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-4 bg-black/70 f-fade-up" onClick={onClose}>
      <div className="w-full max-w-[420px] f-card" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-sans font-bold text-[17px] text-f-text">{title}</h3>
        <div className="text-[13px] text-f-text2 mt-2 leading-[1.55]">{body}</div>
        <div className="grid grid-cols-2 gap-2 mt-5">
          <button className="f-btn f-btn-secondary" onClick={onClose}>Cancelar</button>
          <button className={`f-btn ${danger ? "f-btn-danger" : "f-btn-primary"}`} onClick={() => { onConfirm(); onClose(); }}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Sheet — bottom-sheet en mobile con drag handle, centered modal en desktop.
 * Maneja overflow del body para evitar scroll detrás del overlay y respeta
 * safe-area inferior + URL bar de Safari/Chrome.
 */
export function Sheet({
  open, title, onClose, children, footer,
}: { open: boolean; title: string; onClose: () => void; children: ReactNode; footer?: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/70 f-fade-up" onClick={onClose}>
      <div
        className="w-full sm:max-w-[480px] bg-f-card border border-f-border rounded-t-2xl sm:rounded-2xl flex flex-col"
        style={{ maxHeight: "min(92dvh, 92vh)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sm:hidden flex justify-center pt-2.5 pb-1">
          <span className="block w-10 h-1 rounded-full bg-f-muted" aria-hidden />
        </div>
        <div className="flex items-center justify-between px-5 pt-3 pb-3 sm:py-4 border-b border-f-border">
          <h3 className="font-sans font-bold text-[17px] text-f-text">{title}</h3>
          <button className="f-btn-ghost -mr-2" onClick={onClose} aria-label="Cerrar">
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
          </button>
        </div>
        <div
          className="px-5 py-5 overflow-y-auto flex-1 flex flex-col gap-4"
          style={!footer ? { paddingBottom: "max(1.25rem, env(safe-area-inset-bottom, 0px))" } : undefined}
        >
          {children}
        </div>
        {footer && (
          <div
            className="px-5 py-3 sm:py-4 border-t border-f-border"
            style={{ paddingBottom: "max(0.875rem, env(safe-area-inset-bottom, 0px))" }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
