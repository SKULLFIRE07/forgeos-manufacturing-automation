# ForgeOS

ForgeOS is a working manufacturing operations and accountability application built from the client workbook analysis. It places one connected work lifecycle between planning systems and factory execution.

[Open the live product](https://skullfire07.github.io/forgeos-manufacturing-automation/) | [Open the client overview PDF](docs/ForgeOS_Client_Overview.pdf)

## Included product areas

- Role-aware Command Center for operators, supervisors, HODs, executives, and administrators
- Accountable work register with list and board views
- Work creation, ownership, due time, blocker, evidence, verification, and closure flows
- Projects, Quality, Maintenance, Safety, Workforce, KPIs, Documents, Suppliers, and Settings
- Global search, notifications, site and shift context, controlled records, and activity history
- Responsive desktop, tablet, and mobile navigation
- Keyboard navigation, screen reader semantics, reduced motion, forced colors, and WCAG 2.2 AA support
- Offline status and local work persistence for the current product build
- A compact black and white interface using the supplied ITC Avant Garde Gothic family

## Client-shaped data

The seed model preserves the audited source totals, including 83 employees, a workforce requirement of 92, a gap of 9, 83 audit findings, 22 major nonconformities, 26 KPIs, and 31 project-linked employees across 7 project codes.

## Run locally

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

## Verify

```bash
pnpm typecheck
pnpm test
pnpm build
```

For live DOM, workflow, responsive, monochrome design, and axe accessibility checks, start the app on port 3000 and run:

```bash
pnpm test:browser
```

## Deploy

The application is configured as a static export. Every push to `main` runs type checks, tests, a production build, and a GitHub Pages deployment through `.github/workflows/deploy-pages.yml`.

## Current integration boundary

This build is a complete interactive product implementation with realistic local data and persistence. Production identity, database storage, file uploads, notifications, and ERP, MES, HRMS, or QMS connections require the client's credentials and target system contracts.

Product principles are documented in `PRODUCT.md`. Visual and interaction rules are documented in `DESIGN.md`.
