# forja-web-profile

El **centro de control del atleta** — perfil web de Forja. SPA mobile-first que
implementa la spec *FORJA — Especificación del Perfil de Usuario v1.0*.

Mismo stack y design system que `../onboarding`: **React + Vite + TypeScript +
TailwindCSS**, design system **Forja V2.0** (negro profundo + verde bosque +
bordo · DM Sans / Space Mono / Instrument Serif · dark-first).

## Correr

```bash
cd web_profile
npm install
npm run dev      # http://localhost:5174
```

```bash
npm run build    # tsc -b && vite build  →  dist/
npm run preview
```

## Estructura

```
src/
├── App.tsx                 # rutas /perfil/*
├── components/
│   ├── ProfileLayout.tsx   # sidebar desktop / bottom-nav mobile · barra completitud · FAB WhatsApp · footer legal
│   ├── ui.tsx              # primitivas (Pill, Tabs, Toggle, Sheet, ConfirmDialog, Row, Callout…)
│   └── charts.tsx          # SVG a mano: ScoreRing, MacroBar, LineChart, BarChart, AreaChart, WeekGrid
├── data/mock.ts            # dataset coherente del atleta (Rocío · IRONMAN 5150 · semana 14/32)
├── lib/{nav,whatsapp}.ts   # config de secciones · deeplink al bot
└── pages/                  # las 7 secciones de la spec
    ├── Home.tsx            # 1. Inicio / Mi Semana
    ├── Nutrition.tsx       # 2. Nutrición (+ editor de comida frecuente con autocompletado y macros en vivo)
    ├── Training.tsx        # 3. Entrenamiento
    ├── Health.tsx          # 4. Salud y Cuerpo
    ├── Journey.tsx         # 5. Journey
    ├── Settings.tsx        # 6. Configuración
    └── Subscription.tsx    # 7. Suscripción
```

Cada sección cubre sus sub-vistas vía tabs. **Con `VITE_USER_ID` seteado el
perfil pega 100% al backend** (`forja-api`, schema canónico): lecturas
agregadas + escrituras reales (comidas frecuentes, restricciones, datos
corporales, lesiones, crónicas/medicación/alergias, plan nutricional + PDF,
documentos clínicos, datos personales, recordatorios/tono/privacidad, export
y baja de cuenta). Sin `VITE_USER_ID` (o si la API cae) corre en modo DEMO
con `data/mock.ts` y las mutaciones quedan locales.

## Conexión al backend

```bash
cp .env.example .env.local
# VITE_API_URL=http://localhost:3000
# VITE_USER_ID=<uuid de users.id>
```

El banner de estado (arriba de cada página) indica `live` vs `demo`. Los
endpoints viven en `backend/src/routes/profile.routes.ts`; migración de
soporte: `backend/sql/migrations/006_profile_web.sql` (`user_preferences`,
`medical_documents`).

## Pendiente para producción

- Render real de Journey Cards a PNG (canvas/satori) para descarga/compartir.
- Auth + sesión del atleta (deeplink desde WhatsApp / onboarding).
- Suscripción/pagos y wearables: requieren proveedor de pagos / integración
  externa (fuera del schema canónico Fase Toyota); siguen como display.
