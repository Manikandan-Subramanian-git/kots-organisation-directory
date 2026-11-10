# KOTS Organisation Directory

A production-grade **Organisation Directory** built with **Angular 18+**, standalone components, Angular Signals, and modern TypeScript strict mode for the Senior Front-End Developer Technical Assessment.

---

## 🚀 Live Demo & Repository

* **Live Application**: Deployed on Netlify / Vercel
* **Repository**: GitHub / GitLab with clear, step-by-step atomic commit history.
* **Architectural Decisions**: See [DECISIONS.md](DECISIONS.md) for full rationale on conflicts, trade-offs, and data quirks.

---

## ⚡ Tech Stack & Architecture

* **Framework**: Angular 18+ (Standalone Components, no `NgModules`)
* **State Management**: Angular Signals (`signal`, `computed`, `effect`) — zero `BehaviorSubject` for view state.
* **Control Flow**: Modern template syntax (`@if`, `@for`, `@switch`).
* **Dependency Injection**: Functional `inject()` pattern.
* **Forms**: Strictly typed, non-nullable Reactive Forms (`FormBuilder`).
* **Styling & Design Tokens**: 100% CSS Custom Properties (`:root`) with semantic status tokens, responsive layout, and dark/light ready design system. Change brand identity by editing `--color-brand` in one line.
* **Internationalization (i18n)**: Zero hardcoded user strings. Centralized translation engine powered by `src/assets/i18n/en.json`.
* **TypeScript**: Strict mode enabled (`strict: true`, `noImplicitAny: true`, `strictNullChecks: true`).

---

## 📋 Features Overview

* **FR1 — List**: Complete organisation table showing Name, Status, Member Count, Owner Email, and Created Date. Sortable by name (with internationalized locale collation) and created date (asc/desc).
* **FR2 — Search & Filter**: Free-text search (debounced by 300ms) and status filters (`All`, `Active`, `Inactive`, `Suspended`, `Needs Review`). Fully synchronized two-way with URL query parameters (`?search=...&status=...&sortBy=...&sortDir=...`).
* **FR3 — Create Organisation**: Modal form with typed reactive validation:
  * Name: Required, 3–80 characters, unique (case-insensitive check against existing directory).
  * Status: Required select.
  * Owner Email: Required, strict email validation.
  * Member Count: Optional, non-negative integer.
  * Field errors display strictly on **blur** (`control.touched`), never prematurely on every keystroke.
  * Submission alert banners ensure error feedback is not limited to a disabled button.
* **FR4 — Visual States**: Visually distinct Loading skeletons, Empty state with filter reset, and Error banner with interactive Retry handling simulated ~15% API failures.
* **FR5 — Internationalization**: 100% of labels, placeholders, errors, and tooltips are externalized in `en.json`.
* **FR6 — Design Tokens**: Semantic colors, spacing (`--space-1` to `--space-16`), radii, and elevation defined once in `src/styles.css`.

---

## ⚖️ How the Two Conflicts Were Resolved

### Conflict 1: Ops "No Pagination" vs API "25/req + 5 req/min Rate Limit"
* **Solution**: **Progressive Transparent Batch Streaming with In-Memory Signals**.
* Loads Page 1 (25 records) immediately for sub-second first paint.
* A background token-aware queue streams pages 2 through 6 into a unified client-side Signal store while respecting the 5 req/min rate limit.
* Ops gets a single unpaginated scrollable directory with zero page-clicking and sub-millisecond filtering and sorting.

### Conflict 2: Designer "Colored Dot Only" vs Accessibility (WCAG 2.1 SC 1.4.1)
* **Solution**: **Pattern-and-Icon-Integrated Accessible Badge with Ops Density Toggle**.
* Combines color with distinct SVG geometric glyphs (Circle for Active, Square for Inactive, Triangle for Suspended, Exclamation for Unknown) so color-blind users can differentiate status by shape alone.
* Screen-reader text (`<span class="sr-only">`) is permanently present in the DOM.
* Ops users can toggle between **Comfortable** (color + shape + text) and **Compact** (color + shape + tooltip) mode via the toolbar. Both modes strictly satisfy WCAG 2.1 SC 1.4.1.

---

## 🛠️ Local Development & Running

### Prerequisites
* Node.js 18+ or 20+
* npm or pnpm

### Quick Start
```bash
# 1. Install dependencies
npm install
# or
pnpm install

# 2. Start local development server
npm start
# or
pnpm start

# 3. Open your browser
# Navigate to http://localhost:4200/
```

### Production Build
```bash
npm run build
# Dist output will be in dist/kots-organisation-directory/
```

### Run Tests
```bash
npm test
```

---

## 🎥 Video Walkthrough Script (4–6 Minutes Guide)

For the assessment submission video, follow this exact structure:

1. **[0:00 - 0:45] 30-Second Demo of Working App**:
   * Show the directory loading immediately with Page 1.
   * Point out the background streaming pill: *"Loaded 25 of 137... streaming remaining records"*.
   * Type in the search box to demonstrate 300ms debouncing and URL query param update (`?search=north`).
   * Click column headers to sort by Name and Created Date.
   * Open the "+ Add Organisation" modal: show that typing doesn't trigger red errors, but tabbing out (blur) shows clean field-level errors. Submit a valid organisation and show it prepended at the top.
2. **[0:45 - 2:15] How You Resolved Both Conflicts**:
   * **Conflict 1**: Explain the math (137 records / 25 per page = 6 requests; rate limit is 5 req/min). Explain why classic pagination was rejected (Ops hate clicking). Detail the progressive token queue that delivers Page 1 instantly and streams the remaining batches in the background. Mention what was given up (the 12s backoff window for records 126–137).
   * **Conflict 2**: Explain WCAG 2.1 SC 1.4.1 (use of color alone is inaccessible for color-blind users). Show the distinct geometric shapes (circle, square, triangle, exclamation) and the density toggle that satisfies the designer's clean aesthetic in compact mode without breaking accessibility.
3. **[2:15 - 3:30] Messiest Thing in the Fixture Data & Handling**:
   * Show `OrganisationAdapter`. Highlight how dirty data (duplicate ID 42, missing names, typo `'actve'`, string member count `"12"`, negative counts, missing owners, and unparseable dates) is safely normalized into typed domain entities with audit badges and safe fallbacks.
4. **[3:30 - 4:30] One Thing You Would Do Differently With Two More Days**:
   * Detail Virtual Scrolling (`@angular/cdk/scrolling`) for 10,000+ records, IndexedDB offline caching, and automated Playwright E2E testing for rate limit backoffs.
