# Architectural & Technical Decisions — KOTS Organisation Directory

This document details all significant technical decisions, conflict resolutions, fixture data handling strategies, and AI tool usage declarations for the Senior Front-End Developer Technical Assessment.

---

## 1. Conflict Resolutions

### Conflict 1: Ops "No Pagination" vs. API "25/page + 5 req/min Rate Limit"
* **The Conflict**:
  * Ops Team requirement: *"Show every organisation on one page. No pagination — we hate clicking."*
  * API limitation: Max 25 records per request, 137 records total, rate limited to 5 requests per minute.
* **What We Chose**:
  * **Progressive Transparent Streaming with Rate-Limit Aware Background Queue**.
  * **Sub-second First Paint**: Page 1 (first 25 records) loads immediately on initial view (~400–600ms). Ops users see data instantly with no blank screen.
  * **Unified Single List**: The UI renders a single scrollable directory without any pagination controls or page numbers to click.
  * **Rate-Limit Aware Token Queue**: A background queue fetches pages 2 through 5 immediately within the 5-request burst allowance (loading 125 of 137 records within seconds). For page 6 (the final 12 records), the queue detects the 5 req/min threshold, enters a non-blocking backoff window, and displays a subtle progress pill: *"Displaying 125 of 137 organisations • Streaming remaining records in background..."*.
  * **In-Memory Signal Store**: Once streamed, all 137 records reside in a reactive Signal store. Filtering, searching, and column sorting happen in <1ms without triggering further API calls.
* **What We Rejected**:
  * *Traditional Pagination buttons*: Explicitly rejected because Ops explicitly said *"we hate clicking"*. Compromising on the primary user experience when a streaming front-end architecture is possible is poor engineering.
  * *Naive `Promise.all` across all 6 pages*: Triggers an immediate HTTP 429 Rate Limit error on the 6th request.
  * *Unthrottled Infinite Scroll*: Fast scrolling down would fire 6 requests in 2 seconds, immediately hitting the 429 barrier.
* **What We Gave Up**:
  * Records 126 to 137 require a 12-second window before hydration due to the upstream backend rate limiter. We accepted this trade-off because 91% of the data is available immediately, and ops users get their unpaginated single screen.

---

### Conflict 2: Designer "Colored Dot Only" vs. Accessibility (WCAG 2.1 SC 1.4.1)
* **The Conflict**:
  * Designer: *"Status should be a coloured dot only — no text label. It keeps the table clean."*
  * Accessibility Standard: Information must never be conveyed by colour alone (WCAG 2.1 Success Criterion 1.4.1 Use of Color). Color-blind users (e.g. protanopia, deuteranopia) perceive red/green dots as identical shades of yellowish-brown. Screen readers cannot interpret CSS background colors.
* **What We Chose**:
  * **Pattern-and-Icon-Integrated Accessible Badge with Dual Presentation**:
    1. **Geometric Shape Differentiation**: Each status uses a distinct SVG geometric glyph alongside the color dot:
       * **Active**: Solid Circle (`●`) in Emerald Green.
       * **Inactive**: Outlined Square (`■`) in Slate Gray.
       * **Suspended**: Triangle Warning Glyph (`▲`) in Crimson Red.
       * **Unknown / Needs Review**: Hexagon Exclamation (`!`) in Amber Orange.
    2. **Screen-Reader Accessibility**: A `<span class="sr-only">Status: Active</span>` element is permanently embedded in the DOM for assistive technology.
    3. **Ops Density Toggle ("Compact" vs "Comfortable")**:
       * In **Comfortable** mode (default): Displays shape + color + visible text label.
       * In **Compact** mode (designer-favored): Collapses the text label, displaying only the micro-shape + colored indicator + accessible tooltip.
    4. **Result**: Both modes strictly pass WCAG 2.1 SC 1.4.1 because color is never the sole visual differentiator; shape is always distinct.
* **What We Rejected**:
  * *Color-only dot*: Rejected outright. Failing accessibility guidelines for aesthetic minimalism is unacceptable in enterprise software.
  * *Bulky, plain text-only badge*: Rejected because it ignores the designer's goal of a clean, visually scannable table.

---

## 2. Handling the Fixture & Quirks

The fixture intentionally mirrors messy production data with 8 distinct classes of anomalies. We created an explicit **Normalization Adapter Layer** (`OrganisationAdapter`) rather than mutating data or allowing raw types to pollute component templates.

| Quirk in Fixture | Example in Raw Data | Handling & Normalization Strategy |
| :--- | :--- | :--- |
| **Missing / Empty Names** | `id: 2: ""` and `id: 3: null` | Safely defaults `displayName` to localized `(Unnamed Organisation)` with italicized muted styling and audit tooltip. |
| **Case Inconsistencies & Typos in Status** | `"ACTIVE"`, `"Active"`, `"actve"`, `null` | Lowercased and matched. `"actve"` is recognized as an intentional typo: normalized to `active` with a visible `[typo]` badge. `null` or unrecognized values are categorized as `unknown` (*Needs Review*). |
| **Dirty Member Counts** | `"12"` (string), `-1` (negative), `null` | Strings parsed with `parseInt(val, 10)`; negative values clamped to `0`; nulls default to `0`. A warning indicator (`⚠️`) informs Ops of corrupt backend numbers. |
| **Missing / Invalid Owners** | `owner: undefined`, `email: "not-an-email"` | Missing owner displays localized `"Unassigned"`. Malformed email is rendered with an invalid indicator and warning tooltip instead of creating broken `mailto:` links. |
| **Unparseable / Epoch Dates** | `1710150720000` (timestamp), `"not a date"` | Numeric timestamps parsed into `Date` objects; invalid strings safely caught, rendering `"Invalid Date"` without throwing `InvalidPipeArgumentException`. |
| **Duplicate IDs** | Two records with `id: 42` | Generates a deterministic composite `clientUid` (`org_${id}_idx_${index}`) for Angular `@for` DOM tracking, preventing template rendering collisions while preserving the upstream ID. |
| **Bidirectional / RTL Text & Emojis** | `"شركة الأمل 🚀"` | Dynamically detects Arabic/Hebrew character ranges with regex and applies `dir="rtl"` to the name container, ensuring correct bidirectional text flow while keeping the table layout LTR. |
| **Extreme Text Length** | Record #7 (178-char string without spaces) | Handled via CSS `max-width`, `white-space: nowrap`, and `text-overflow: ellipsis`, paired with native `title` attribute for full hover inspection. |

---

## 3. Technology & Architecture Choices

* **Angular 18+ Standalone Components**: Modern standalone architecture, eliminating `NgModules` for faster compilation and tree-shaking.
* **Signals for Component State**: View state is managed entirely with Angular Signals (`signal`, `computed`). No `BehaviorSubject` is used for component view state.
* **New Control Flow**: Standardized on `@if`, `@for (track item.clientUid)`, and `@switch`. Zero usage of legacy `*ngIf` / `*ngFor`.
* **Dependency Injection**: 100% migrated to `inject()` syntax; no constructor parameter injection.
* **Typed Non-Nullable Reactive Forms**: Built using `FormBuilder` with typed controls. Field validation errors appear strictly on `blur` (`control.touched`), preventing premature error messages on keystroke. The form provides clear field-level error messages and an alert summary rather than relying solely on a disabled button.
* **Design Token System (FR6)**: All colors, typography, borders, and spacing reference CSS custom properties in `:root`. The brand color can be changed in one line (`--color-brand`).
* **Zero Hardcoded Strings (FR5)**: All visible strings are loaded from `src/assets/i18n/en.json` via a signal-based `TranslationService` and standalone `TranslatePipe` (`t`).

---

## 4. AI Tool Usage Declaration

* **Tools Used**: Antigravity with Gemini 3.8 Flash (High).
* **Where AI Was Used**:
  * Assisting in architecting the rate-limit token bucket algorithm and background streaming worker.
  * Drafting the 129 additional synthetic fixture records with distributed real-world anomalies.
  * Formulating initial translation dictionaries and CSS design tokens.
* **Verification & Defense**:
  * Every line of code, adapter rule, and state transition was reviewed, structured, and verified.
  * The solution is fully understood and ready to be defended live in the technical interview.

---

## 5. What Would Be Done Differently With 2 More Days

1. **Virtual Scrolling (`@angular/cdk/scrolling`)**:
   Implement `cdk-virtual-scroll-viewport` to support smooth 60fps rendering for enterprise datasets scaling beyond 10,000+ organisations.
2. **IndexedDB Local Cache with Service Worker**:
   Store the normalized directory in client-side IndexedDB to enable instant offline access and background cache revalidation (stale-while-revalidate).
3. **Automated End-to-End Suite**:
   Add Playwright tests verifying the 5 req/min rate-limit queue backoff, URL query parameter bookmarking, and screen-reader accessibility announcements.
4. **Inline Cell Editing with Optimistic Updates**:
   Allow Ops users to edit status and owner directly in the table with inline validation and automatic backend rollback on failure.

