# BatiGest — Logiciel de gestion tout-en-un pour artisans du batiment

## Vision
Application mobile-first de gestion complete pour artisans et petites entreprises du batiment (1-5 personnes). Remplace Excel + carnet papier + 4-5 outils separes par une seule app mobile-first.

## Infra
- **Repo GitHub** : https://github.com/guillaumedlt/batigest
- **Vercel** : projet `batigest` (team `guillaumedlts-projects`)
- **Neon PostgreSQL** : projet `old-bread-43118567` (aws-us-east-2)
- **DB URL** : configuree dans Vercel env + `.env.local`

## Stack technique
- **Monorepo** : Turborepo
- **Frontend** : Next.js 16 (App Router) + Tailwind CSS 4 + shadcn/ui
- **Mobile** : PWA (Progressive Web App) — meme codebase que le web
- **Backend** : NestJS (Node.js) — API REST
- **BDD** : Neon PostgreSQL + Prisma ORM
- **Auth** : Supabase Auth
- **Stockage fichiers** : Supabase Storage (photos chantier, PDFs, justificatifs)
- **PDF** : Puppeteer (generation devis/factures)
- **Deploiement** : Vercel (frontend) — root directory: `apps/web`
- **Tests** : Vitest (unit) + Playwright (e2e)

## Structure du monorepo
```
batigest/
├── apps/
│   ├── web/          ← Next.js frontend (dashboard + mini-site)
│   └── api/          ← NestJS backend
├── packages/
│   ├── ui/           ← Composants React partages (design system)
│   ├── db/           ← Prisma schema + migrations
│   ├── types/        ← Types TypeScript partages
│   ├── utils/        ← Fonctions utilitaires (calculs TVA, arrondis Decimal.js)
│   └── pdf/          ← Templates et generation PDF
├── docs/
│   ├── specs/        ← Specifications par module (01 a 08)
│   ├── design/       ← Design system, UX principles, user flows
│   └── legal/        ← Normes francaises, mentions legales, Factur-X
└── CLAUDE.md         ← Ce fichier
```

## Modules du projet
1. **Repertoire** — CRM simplifie (clients, fournisseurs, produits)
2. **Devis** — Creation, remises, lots, generation fiche d'achat auto
3. **Facturation** — Facture classique, situation de travaux, acompte (% configurable), avoir
4. **Fiches d'achat** — Multi-fournisseurs, multi-produits, ventilation par chantier
5. **TVA** — Declaration auto a partir des factures et achats
6. **Calendrier** — Interventions (temps -> cout main d'oeuvre), RDV clients
7. **Notes de frais** — Essence, peages, repas, rattachees au chantier
8. **Mini-site vitrine** — Page type Linktree pour chaque artisan

## Conventions de code

### General
- TypeScript strict (no any)
- Nommage : camelCase variables/fonctions, PascalCase composants/classes
- Fichiers : kebab-case (ex: devis-form.tsx)
- Imports absolus avec @/ prefix
- Pas de console.log en production
- Commentaires en francais pour la logique metier
- Messages de commit : Conventional Commits en francais
- Calculs monetaires : Decimal.js (JAMAIS les float JS)

### Frontend
- Mobile-first TOUJOURS. Desktop = media query au-dessus.
- Boutons : minimum 48x48px (tactile avec gants)
- Texte : minimum 16px body, 14px captions
- Etat : Zustand (global) + React Query (serveur)
- Formulaires : React Hook Form + Zod
- Animations : Framer Motion, subtiles
- Labels : langage simple, pas de jargon comptable

### Backend
- Chaque module = un dossier NestJS (controller, service, dto, entity)
- Validation : class-validator sur tous les DTOs
- Erreurs : messages en francais
- Tous les endpoints documentes Swagger

### Base de donnees
- Prisma pour le schema et les migrations
- Soft delete partout (deletedAt) — on ne supprime JAMAIS vraiment
- UUIDs comme identifiants
- Numerotation devis/factures : sequentielle sans rupture

## Normes francaises OBLIGATOIRES
- Numerotation chronologique sans rupture (devis + factures)
- Mentions legales Code de commerce art. L441-9
- TVA detaillee par taux (20%, 10%, 5.5%)
- Penalites de retard + indemnite forfaitaire 40 EUR
- Format Factur-X pour 2026
- RGPD : consentement, droit a l'oubli, portabilite
- Details complets dans /docs/legal/

## UX — Regles d'or
- 3 taps max pour toute action courante
- Mode hors-ligne : saisie possible, sync auto
- Zero jargon : "entree d'argent" pas "credit"
- Gros boutons : utilisable avec des gants de chantier
- Contraste eleve : lisible en plein soleil
- Feedback immediat : toast, animation sur chaque action

## Problemes connus
- `git add/status/commit` plante localement (meme probleme que lol-coach)
  - **Workaround** : utiliser l'API GitHub via `gh api repos/guillaumedlt/batigest/git/...`
  - Pattern : blobs API -> trees API -> commits API -> PATCH refs
- Vercel root directory doit etre configure sur `apps/web` dans le dashboard

## Etat d'avancement

### Phase 0 — Fondation (FAIT)
- [x] Monorepo Turborepo + structure de dossiers
- [x] App Next.js 16 (apps/web) avec Tailwind 4
- [x] API NestJS (apps/api) avec Swagger + health check
- [x] Packages partages (ui, db, types, utils, pdf)
- [x] Schema Prisma complet (8 modules + auth)
- [x] Auth Supabase (client, server, middleware)
- [x] Layout mobile : bottom nav (5 onglets) + FAB
- [x] Dashboard page avec stats cards
- [x] Page login
- [x] Repo GitHub cree et pousse
- [x] Vercel connecte au repo
- [x] Neon PostgreSQL cree + DATABASE_URL configuree
- [x] Design system de base (Button component, 48px tactile)
- [x] Docs complets (8 specs + design system + UX + legal + Factur-X)
- [x] Custom commands (.claude/commands/)

### Phase 1 — A faire
- [ ] Configurer root directory Vercel sur apps/web
- [ ] Configurer Supabase (creer le projet)
- [ ] Ajouter les env vars Supabase dans Vercel
- [ ] npm install a la racine du monorepo
- [ ] Prisma migrate (pousser le schema sur Neon)
- [ ] Premier deploy fonctionnel
- [ ] Module Repertoire (CRUD contacts)

### Decisions prises
- Neon PostgreSQL (pas Supabase DB) pour la BDD
- Supabase uniquement pour l'auth
- Vercel pour le deploy frontend
- Monorepo Turborepo avec npm workspaces
- Prisma (pas Drizzle) pour l'ORM
