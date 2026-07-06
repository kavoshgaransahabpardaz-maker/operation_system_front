# Veritariff — Frontend Plan, 6 Weeks

**Stack (decided — don't relitigate):** React 18 + TypeScript + Vite · TanStack Query (server state — this app is 90% server state) · Zustand only for UI state (viewer position, panel toggles) · Tailwind + shadcn/ui · `react-pdf` (pdf.js) for the document viewer · OpenAPI-generated TS client from the FastAPI schema (`openapi-typescript` + `openapi-fetch`) so FE types can never drift from backend Pydantic models.

**Design principle:** this is a *trust* product for a skeptical professional (a broker who's been burned by software before). Every number on screen must answer "says who?" in one click — value → source document → exact page, highlighted. If a screen shows a field without a route to its source, the screen is wrong.

**The laws, translated to UI:**
1. **Flag, don't guess** → low-confidence and missing fields are visually loud (amber/red), sorted to the top, and block "clear" status. Never render an uncertain value in the same style as a confirmed one.
2. **Provenance everywhere** → every field and every flag deep-links to `document + page` with a highlight.
3. **Never dead-end** → every empty/error state says what's missing and offers the next action ("Packing list missing — upload or forward the email").
4. **Nothing auto-resolves** → suggestions are proposals with citations and an explicit accept button. No "fix all" button exists in this product.

---

## Information architecture (4 screens — resist adding a fifth)

```
/dashboard                      Attention queue + counts
/shipments                      List w/ status + open-flag badges
/shipments/:id                  THE screen (80% of dev time)
  ├─ tab: Documents             grouped docs, type + confidence, reassign
  ├─ tab: Fields                extracted-field review table
  └─ tab: Flags                 ranked flags + resolution
/settings                       Tolerance thresholds, email connection (existing)
```

The shipment detail page is a **two-pane layout**: left = fields/flags list, right = persistent document viewer. Clicking any value or flag scrolls the viewer to the source page and highlights it. This interaction *is* the product demo — invest accordingly.

---

## Sprint 0 (Week 1) — Foundation + contract

| # | Ticket | DoD |
|---|---|---|
| F0.1 | Project scaffold (or refactor of existing BrokerAI FE): routing, layout shell, auth against existing endpoints | Deployed to staging |
| F0.2 | OpenAPI codegen pipeline wired into CI: backend schema change → regenerated client → FE type errors surface in PR | Breaking a schema breaks the FE build (this is a feature) |
| F0.3 | Mock server (MSW) from the OpenAPI spec so FE never blocks on backend sprints | All Sprint 1 screens buildable against mocks |
| F0.4 | Component primitives: `ConfidenceBadge` (high/low/missing states), `SeverityBadge`, `ProvenanceLink`, `StatusPill` | Storybook entries; states reviewed with founders |

**Why F0.2 matters more than it looks:** with a 2–3 person team and 6 weeks, the #1 schedule risk is FE/BE contract drift discovered in week 5. Generated types kill it structurally.

## Sprint 1 (Weeks 2–3) — Document viewer + field review (the core loop)

| # | Ticket | DoD |
|---|---|---|
| F1.1 | Shipment detail shell: two-pane layout, tabs, status pill | Responsive down to 13" laptop (brokers' real hardware) |
| F1.2 | **Document viewer**: pdf.js render, page navigation, programmatic scroll-to-page + bounding-box/region highlight; image (JPEG/scan) support | `viewer.goTo(documentId, page, region?)` callable from anywhere in the app |
| F1.3 | Documents tab: grouped docs w/ type + type-confidence, manual reassign (type & shipment), duplicate indicator | Reassign optimistic-updates + invalidates shipment queries |
| F1.4 | **Field review table**: canonical fields grouped by category (parties/values/logistics), low-confidence & missing sorted first, raw vs normalized value, source column | Clicking a row drives the viewer to source page + highlight |
| F1.5 | Confirm / correct interactions: inline edit w/ typed inputs per field kind (Decimal, currency select, incoterm select, date picker), correction reason optional | Correct → PATCH → field turns `reviewed_corrected`, comparisons refresh via query invalidation |
| F1.6 | Record-reuse surface: "Seen before — classified as X on shipment #Y" callout with link and explicit Apply | Never auto-applied |
| F1.7 | Upload + email-intake status: drag-drop, per-document pipeline stage indicator (`ingesting → classified → extracted → failed_*`) with loud failure states | Failure state shows the reason + retry action |

**Sprint gate:** a non-engineer can open a seeded shipment, find every low-confidence field in <10 seconds, see its source page in one click, and confirm/correct it.

## Sprint 2 (Weeks 4–5) — Flags + resolution

| # | Ticket | DoD |
|---|---|---|
| F2.1 | Flags tab: ranked by severity, grouped by type (mismatch / missing doc / missing field / low confidence) | Critical flags visually unmissable |
| F2.2 | **Mismatch flag card** — the money component: field name, each conflicting value with its document + page chip, severity, and side-by-side "compare view" that splits the viewer to show both sources simultaneously | Both source regions highlighted at once |
| F2.3 | "Cannot compare" states: missing-doc flags render as blockers with the upload/forward action inline | No dead-ends |
| F2.4 | Resolution flow: choose a value (or enter override) + decision + optional note → confirm dialog → resolved state with who/when | Resolved flags collapse but remain visible in an audit section — never disappear |
| F2.5 | `unverified` comparison state (low-confidence input): rendered distinctly from mismatch, with "review field first" link that jumps to the field row | Full loop tested: review field → flag re-evaluates live |
| F2.6 | Tolerance settings UI: per-field thresholds with defaults shown, plain-language explanation of each ("weights within 0.5% are treated as rounding") | Saves to org settings; changes re-run comparisons |

**Sprint gate:** using the backend's 5 seeded fault shipments, a broker-persona tester resolves every flag without asking a question. Any question they ask = a UX ticket.

## Sprint 3 (Week 6) — Suggestions, dashboard, pilot polish

| # | Ticket | DoD |
|---|---|---|
| F3.1 | Suggestion UI on mismatch cards: proposed value + rationale + citation chips ("3 of 4 documents state EUR") + single Accept (= logged resolution). No bulk-accept anywhere | Accept requires the flag open, no keyboard shortcut that could mass-fire |
| F3.2 | Dashboard rewire: attention queue (shipments w/ open critical flags), counts by severity, missing docs, fields pending review — every tile deep-links into the exact tab/filter | Replaces generic import-count widgets |
| F3.3 | Shipment list: status pills, open-flag badges, search by any reference number | Sub-second search on seed data |
| F3.4 | Activity/audit view per shipment: extraction events, reviews, resolutions in a timeline | Read-only, chronological |
| F3.5 | Pilot polish: loading skeletons, empty states with next actions, error toasts w/ retry, keyboard nav in review table (↑↓ + Enter to confirm — brokers live on keyboards) | Full pilot script runs with zero console errors |
| F3.6 | Live pilot: sit with a broker on 3–5 real shipments, record every hesitation | Findings triaged same day |

**MVP ship gate (joint with backend):** broker forwards an email or drags a folder in, and unaided reaches: grouped docs → reviewed fields → resolved flags → shipment "clear," with every value one click from its source page.

---

## What most frontend teams get wrong here

- **They build the tables first and the viewer last.** The provenance click (value → highlighted source page) is the trust moment and the demo; it's also the hardest component (pdf.js coordinates, scans, multi-page). It's Sprint 1 for a reason — if it slips, everything downstream is a spreadsheet with extra steps.
- **They make uncertainty subtle.** A muted grey "low confidence" tag gets ignored on a busy day with 15 entries. Uncertain data must be impossible to mistake for confirmed data — different color, different weight, sorted first, and blocking the "clear" status.
- **They add a "resolve all" convenience.** The one-flag-one-decision friction is deliberate: it produces the resolution corpus and keeps the human as the decision-maker. Removing that friction removes the moat and the regulatory posture in one PR.
- **They skip the mock server.** With FastAPI sprints running in parallel, MSW + generated types is the difference between a week-6 integration crunch and a non-event.

---
---

# TRACK B — Trade Intelligence Module (Frontend), Weeks 7–12

**Positioning (same as backend):** not a news reader — an intelligence layer on the compliance product. The design center is **"this event touches YOUR shipments"**, and the strongest single surface is intel appearing *inside the existing shipment workspace*, not a separate news app the broker forgets to open. Hard gate: starts only after the Track A MVP ship gate.

## IA additions (two screens + injections into existing ones — resist building a "news site")

```
/intel                          Feed: matched-first, filterable by HS/lane/country/event type
/intel/search                   Semantic + keyword search
/shipments/:id  → new tab: Intel   Events touching this shipment (the killer surface)
/dashboard      → new tile: "Events affecting your shipments" (count + top 3)
/settings       → Interests & alerts (auto-seeded follows, editable; email prefs)
```

## Component rules
- **Every intel card shows its receipts:** source name + link, published date, and the `match_reason` chip ("Matches HS 7208 — 4 of your products", "Lane TR→GB — 3 open shipments", "Sanctions list — party match"). An unmatched article renders visibly quieter than a matched one. No black-box "recommended for you."
- **Impact score is a labelled estimate**, styled distinctly from Track A's deterministic flags — never the same visual language as a mismatch flag. Users must be able to tell "the engine verified this" from "the model estimates this" at a glance. This distinction IS the brand.
- **Sanctions hits are not intel cards.** They surface as critical flags in the existing Flags tab and attention queue — Track A visual language, because they're compliance events, not news.

## Sprints

### Sprint 4 (Weeks 7–8) — Feed foundation
| # | Ticket | DoD |
|---|---|---|
| F4.1 | Intel feed: matched-first ranking, filters (HS, lane, country, event type, date), infinite scroll | Loads <1s on 1k articles; filter state in URL (shareable) |
| F4.2 | Intel card + detail view: summary, entities as filter-chips, match_reason chips, impact estimate (labelled), source link out | Card → detail → source in ≤2 clicks |
| F4.3 | "Unclassified" and low-confidence enrichment states rendered honestly (no fake precision) | Distinct style, filterable out |

### Sprint 5 (Weeks 9–10) — The join surfaces
| # | Ticket | DoD |
|---|---|---|
| F5.1 | **Shipment Intel tab**: events matched to this shipment, each with match_reason and link to the affected field/product | This is the demo moment for Track B — prioritize polish here over the feed |
| F5.2 | Dashboard tile: matched-event count + top 3 by impact, deep-linking to filtered feed | — |
| F5.3 | Interests settings: auto-seeded follows from shipment history shown with their origin ("following HS 7208 — from your product records"), follow/unfollow, add manual follows | Unfollow immediately affects feed ranking |
| F5.4 | Sanctions-screen flag rendering in existing Flags tab (Track A visual language, severity critical) with source-list citation | Appears in attention queue like any critical flag |

### Sprint 6 (Weeks 11–12) — Search, alerts, assistant
| # | Ticket | DoD |
|---|---|---|
| F6.1 | Search: single box, hybrid results, filters carried over from feed | <1s perceived; empty state suggests followed topics |
| F6.2 | Alert preferences UI: immediate vs daily digest per category; email preview | Matches backend prefs schema exactly (generated types) |
| F6.3 | Assistant panel (feed + shipment context): chat UI where **every answer renders its citations as chips linking to sources/shipments**; visible scope note ("summarizes and cites — does not provide legal advice") | An uncited claim cannot render (schema-enforced), mirroring backend B6.2 |
| F6.4 | Polish pass: loading/empty/error states for all intel surfaces; feed onboarding for orgs with no shipment history yet (manual interests first-run) | Zero console errors on pilot script |

## What most teams get wrong on this module
- **They build the feed beautiful and the shipment join last.** Backwards. A broker won't open a news tab on a busy day — but they're already inside the shipment. The Intel tab and the dashboard tile carry the value; the feed is the archive.
- **They blur estimated and verified.** The moment an impact score looks like a mismatch flag, you've spent Track A's trust on Track B's guesses. Two visual languages, enforced in the design system, reviewed in every PR.
- **They let the assistant freelance.** Citation-or-silence, rendered as a UI constraint, not a prompt hope.
