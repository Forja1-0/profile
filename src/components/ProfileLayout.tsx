import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { SECTIONS } from "../lib/nav";
import { waActions } from "../lib/whatsapp";
import { useProfileData } from "../api/store";
import { Wordmark, Brandmark, Toaster } from "./ui";

function Ambient() {
  return (
    <div className="ambient" aria-hidden="true">
      <div className="orb orb-green" />
      <div className="orb orb-red" />
      <div className="grain" />
    </div>
  );
}

function Sidebar({ pathname }: { pathname: string }) {
  const { data } = useProfileData();
  const athlete = data.athlete;
  return (
    <aside className="hidden lg:flex flex-col w-[260px] flex-none border-r border-f-border bg-[#0c0c0e] sticky top-0 h-dvh">
      <div className="px-6 h-16 flex items-center gap-3 border-b border-f-border">
        <Brandmark size={30} />
        <Wordmark size={16} />
      </div>

      {/* Completitud del perfil */}
      <div className="px-6 py-5 border-b border-f-border">
        <div className="flex items-center justify-between mb-2">
          <span className="f-datalabel">Tu perfil</span>
          <span className="font-mono text-[12px] text-f-green-glow">{athlete.profileCompleteness}%</span>
        </div>
        <div className="f-progress-track">
          <div className="f-progress-fill" style={{ width: `${athlete.profileCompleteness}%`, background: "linear-gradient(90deg,#2D4532,#5B8A64)" }} />
        </div>
        <p className="text-[11px] text-f-text3 mt-2 leading-[1.4]">Subí tu apto médico y agregá 3 comidas más para llegar al 100%.</p>
      </div>

      <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
        {SECTIONS.map((s) => (
          <Link key={s.slug} to={s.path} className="f-navlink" aria-current={pathname.startsWith(s.path) ? "page" : undefined}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{s.icon}</span>
            <span>{s.label}</span>
          </Link>
        ))}
      </nav>

      <div className="px-3 pb-4">
        <a href={waActions.open} target="_blank" rel="noreferrer" className="f-btn f-btn-wa w-full">
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chat</span>
          Abrir Forja en WhatsApp
        </a>
        <div className="flex items-center gap-2.5 px-3 mt-4">
          <span className="w-8 h-8 rounded-full bg-f-green-dark flex items-center justify-center font-sans font-bold text-[13px] text-f-text">
            {athlete.firstName[0]}
          </span>
          <div className="min-w-0">
            <div className="text-[13px] text-f-text truncate">{athlete.name}</div>
            <div className="font-mono text-[10px] text-f-text3">Plan {athlete.plan}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function MobileTopbar() {
  const { data } = useProfileData();
  const athlete = data.athlete;
  return (
    <header
      className="lg:hidden sticky top-0 z-40 backdrop-blur-md bg-[#09090Bcc] border-b border-f-border"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      <div className="px-5 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Brandmark size={26} />
          <Wordmark size={14} />
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="f-datalabel">Perfil</div>
            <div className="font-mono text-[11px] text-f-green-glow leading-none">{athlete.profileCompleteness}%</div>
          </div>
          <span className="w-8 h-8 rounded-full bg-f-green-dark flex items-center justify-center font-sans font-bold text-[12px] text-f-text">
            {athlete.firstName[0]}
          </span>
        </div>
      </div>
      <div className="h-[3px] bg-f-elevated">
        <div className="h-full" style={{ width: `${athlete.profileCompleteness}%`, background: "linear-gradient(90deg,#2D4532,#5B8A64)" }} />
      </div>
    </header>
  );
}

function BottomNav({ pathname }: { pathname: string }) {
  return (
    <nav
      className="lg:hidden fixed inset-x-0 bottom-0 z-40 backdrop-blur-md bg-[#09090Bee] border-t border-f-border f-bottomnav"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      {SECTIONS.map((s) => (
        <Link key={s.slug} to={s.path} className="f-bottomtab" aria-current={pathname.startsWith(s.path) ? "page" : undefined}>
          <span className="material-symbols-outlined" style={{ fontSize: 21 }}>{s.icon}</span>
          <span>{s.short}</span>
        </Link>
      ))}
    </nav>
  );
}

function LegalFooter() {
  return (
    <footer className="border-t border-f-border mt-12 px-5 lg:px-10 py-6">
      <p className="text-[11px] leading-[1.6] text-f-text3 max-w-[80ch]">
        Forja no constituye asesoramiento médico ni nutricional profesional. No reemplaza la consulta con un
        licenciado en nutrición o profesional de la salud. Consultá siempre a tu equipo médico.
      </p>
      <p className="font-mono text-[10px] text-f-text3 mt-2">FORJA · Buenos Aires, Argentina · Ley 25.326 · Disp. 954/2025</p>
    </footer>
  );
}

/** FAB de WhatsApp — presente en toda pantalla (acción diaria vive en WA). */
function WhatsAppFab() {
  return (
    <a
      href={waActions.open}
      target="_blank"
      rel="noreferrer"
      className="lg:hidden fixed right-4 z-50 f-btn f-btn-wa shadow-lg"
      style={{ bottom: "calc(72px + env(safe-area-inset-bottom, 0px))" }}
      aria-label="Abrir Forja en WhatsApp"
    >
      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chat</span>
      WhatsApp
    </a>
  );
}

function StatusBanner() {
  const { source, loading, error } = useProfileData();
  if (loading) {
    return (
      <div className="mb-5 flex items-center gap-2.5 rounded-lg border border-f-border bg-f-surface px-4 py-2.5 text-[12px] text-f-text2">
        <span className="material-symbols-outlined animate-spin" style={{ fontSize: 15 }}>progressactivity</span>
        Conectando con forja-api…
      </div>
    );
  }
  if (source === "live") {
    return (
      <div className="mb-5 flex items-center gap-2.5 rounded-lg px-4 py-2.5 text-[12px]"
           style={{ background: "rgba(58,90,64,0.12)", border: "1px solid rgba(91,138,100,0.25)", color: "#abd0af" }}>
        <span className="material-symbols-outlined" style={{ fontSize: 15 }}>cloud_done</span>
        Conectado · datos en vivo desde la base
      </div>
    );
  }
  return (
    <div className="mb-5 flex items-center gap-2.5 rounded-lg px-4 py-2.5 text-[12px]"
         style={{ background: "rgba(196,154,60,0.10)", border: "1px solid rgba(196,154,60,0.25)", color: "#C49A3C" }}>
      <span className="material-symbols-outlined" style={{ fontSize: 15 }}>science</span>
      {error ?? "Modo demo · seteá VITE_API_URL y VITE_USER_ID para datos en vivo"}
    </div>
  );
}

export function ProfileLayout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  return (
    <div className="min-h-dvh flex">
      <Ambient />
      <Sidebar pathname={pathname} />

      <div className="flex-1 min-w-0 flex flex-col">
        <MobileTopbar />
        <main className="flex-1">
          <div className="max-w-content mx-auto px-5 lg:px-10 pt-6 lg:pt-9 f-pad-bottom-nav lg:pb-10 f-fade-up">
            <StatusBanner />
            {children}
          </div>
          <LegalFooter />
        </main>
      </div>

      <WhatsAppFab />
      <BottomNav pathname={pathname} />
      <Toaster />
    </div>
  );
}
