import { Component, inject } from '@angular/core';
import { OrganisationStore, SortField } from '../../core/store/organisation.store';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { Organisation } from '../../core/models/organisation.model';

@Component({
  selector: 'app-org-table',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <div class="table-container-card">
      <!-- Loading State Skeleton (FR4) -->
      @if (store.isLoadingInitial()) {
        <div class="state-container loading-state" role="status" aria-live="polite">
          <div class="spinner-ring"></div>
          <h2 class="state-title">{{ 'states.loadingTitle' | t }}</h2>
          <p class="state-desc">{{ 'states.loadingDescription' | t }}</p>
          <div class="skeleton-table">
            @for (item of [1, 2, 3, 4, 5, 6]; track item) {
              <div class="skeleton-row">
                <div class="skeleton-cell w-30"></div>
                <div class="skeleton-cell w-15"></div>
                <div class="skeleton-cell w-10"></div>
                <div class="skeleton-cell w-25"></div>
                <div class="skeleton-cell w-15"></div>
              </div>
            }
          </div>
        </div>
      }

      <!-- Error State with Retry (FR4) -->
      @else if (store.error()) {
        <div class="state-container error-state" role="alert">
          <div class="error-icon-box">
            <svg class="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 class="state-title">{{ 'states.errorTitle' | t }}</h2>
          <p class="state-desc">{{ store.error() }}</p>
          <button
            type="button"
            class="btn-retry"
            (click)="store.loadInitial()"
          >
            <svg class="btn-icon" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
            </svg>
            {{ 'states.retryButton' | t }}
          </button>
        </div>
      }

      <!-- Empty State (FR4) -->
      @else if (store.filteredOrganisations().length === 0) {
        <div class="state-container empty-state" role="status">
          <div class="empty-icon-box">
            <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
          <h2 class="state-title">{{ 'states.emptyTitle' | t }}</h2>
          <p class="state-desc">{{ 'states.emptyDescription' | t }}</p>
          <button
            type="button"
            class="btn-reset-empty"
            (click)="store.resetFilters()"
          >
            {{ 'states.emptyReset' | t }}
          </button>
        </div>
      }

      <!-- Populated Table (FR1, FR2, Conflict 1, Conflict 2) -->
      @else {
        <div class="table-responsive">
          <table
            class="org-table"
            [class.compact-table]="store.isCompactMode()"
            [attr.aria-label]="'table.caption' | t"
          >
            <caption class="sr-only">{{ 'table.caption' | t }}</caption>
            <thead>
              <tr>
                <!-- Sortable Name Column (FR1) -->
                <th scope="col" class="th-name">
                  <button
                    type="button"
                    class="th-sort-btn"
                    (click)="store.toggleSort('name')"
                    [attr.aria-sort]="getAriaSort('name')"
                  >
                    <span>{{ 'table.colName' | t }}</span>
                    <span class="sort-indicator" aria-hidden="true">
                      @if (store.sortBy() === 'name') {
                        {{ store.sortDirection() === 'asc' ? '▲' : '▼' }}
                      } @else {
                        <span class="sort-neutral">↕</span>
                      }
                    </span>
                  </button>
                </th>

                <!-- Status Column (Conflict 2) -->
                <th scope="col" class="th-status">
                  <span>{{ 'table.colStatus' | t }}</span>
                </th>

                <!-- Members Column -->
                <th scope="col" class="th-members">
                  <span>{{ 'table.colMembers' | t }}</span>
                </th>

                <!-- Owner Column -->
                <th scope="col" class="th-owner">
                  <span>{{ 'table.colOwner' | t }}</span>
                </th>

                <!-- Sortable Created Date Column (FR1) -->
                <th scope="col" class="th-created">
                  <button
                    type="button"
                    class="th-sort-btn"
                    (click)="store.toggleSort('createdAt')"
                    [attr.aria-sort]="getAriaSort('createdAt')"
                  >
                    <span>{{ 'table.colCreated' | t }}</span>
                    <span class="sort-indicator" aria-hidden="true">
                      @if (store.sortBy() === 'createdAt') {
                        {{ store.sortDirection() === 'asc' ? '▲' : '▼' }}
                      } @else {
                        <span class="sort-neutral">↕</span>
                      }
                    </span>
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              @for (org of store.filteredOrganisations(); track org.clientUid) {
                <tr class="table-row">
                  <!-- Name Cell with RTL, Truncation & Quirks -->
                  <td class="cell-name">
                    <div class="name-wrapper">
                      @if (org.isNameMissing) {
                        <span class="unnamed-badge" [title]="'dataQuirks.emptyName' | t">
                          {{ 'table.unnamedOrg' | t }}
                        </span>
                      } @else {
                        <span
                          class="org-name-text"
                          [dir]="org.isRtl ? 'rtl' : 'auto'"
                          [title]="org.displayName"
                        >
                          {{ org.displayName }}
                        </span>
                      }

                      @if (org.id === 42) {
                        <span class="quirk-pill" [title]="'dataQuirks.duplicateId' | t:{ id: org.id }">
                          #{{ org.id }}
                        </span>
                      }
                    </div>
                  </td>

                  <!-- Status Cell (Conflict 2 Accessible Badge) -->
                  <td class="cell-status">
                    <div
                      class="status-badge status-{{ org.status }}"
                      [class.compact-badge]="store.isCompactMode()"
                      [title]="getStatusTooltip(org)"
                    >
                      <!-- Micro-icon shape for color-blind accessibility (WCAG 2.1 SC 1.4.1) -->
                      <span class="shape-indicator" aria-hidden="true">
                        @switch (org.status) {
                          @case ('active') {
                            <svg class="status-micro-icon" viewBox="0 0 12 12" fill="currentColor">
                              <circle cx="6" cy="6" r="4.5" />
                            </svg>
                          }
                          @case ('inactive') {
                            <svg class="status-micro-icon" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2">
                              <rect x="2" y="2" width="8" height="8" rx="1.5" />
                            </svg>
                          }
                          @case ('suspended') {
                            <svg class="status-micro-icon" viewBox="0 0 12 12" fill="currentColor">
                              <polygon points="6,1 11,10 1,10" />
                            </svg>
                          }
                          @default {
                            <svg class="status-micro-icon" viewBox="0 0 12 12" fill="currentColor">
                              <path d="M6 1a5 5 0 100 10A5 5 0 006 1zm0 8a.75.75 0 110-1.5.75.75 0 010 1.5zm.75-3.25a.75.75 0 01-1.5 0V3.75a.75.75 0 011.5 0v2z" />
                            </svg>
                          }
                        }
                      </span>

                      <!-- Accessible text for screen readers (ALWAYS present) -->
                      <span class="sr-only">{{ 'status.' + org.status + 'Aria' | t }}</span>

                      <!-- Visible text label: shown in Comfortable mode, hidden in Compact mode for designer -->
                      @if (!store.isCompactMode()) {
                        <span class="status-label-text">
                          {{ 'status.' + org.status | t }}
                        </span>
                      }

                      @if (org.hasStatusTypo) {
                        <span class="typo-pill" [title]="'status.typoNote' | t:{ raw: org.rawStatus }">
                          typo
                        </span>
                      }
                    </div>
                  </td>

                  <!-- Members Cell -->
                  <td class="cell-members">
                    <div class="member-wrapper">
                      <span class="member-count">{{ org.memberCount }}</span>
                      @if (org.hasDirtyMemberCount) {
                        <span
                          class="quirk-icon"
                          [title]="'dataQuirks.dirtyMemberCount' | t:{ raw: org.rawMemberCount }"
                        >
                          ⚠️
                        </span>
                      }
                    </div>
                  </td>

                  <!-- Owner Cell -->
                  <td class="cell-owner">
                    <div class="owner-wrapper">
                      @if (org.isOwnerMissing) {
                        <span class="unassigned-text">{{ 'table.unassignedOwner' | t }}</span>
                      } @else if (!org.isOwnerEmailValid) {
                        <span
                          class="invalid-email-text"
                          [title]="'dataQuirks.dirtyEmail' | t:{ raw: org.rawOwnerEmail }"
                        >
                          {{ org.ownerEmail }} ⚠️
                        </span>
                      } @else {
                        <a
                          class="owner-link"
                          [href]="'mailto:' + org.ownerEmail"
                          [title]="org.ownerEmail"
                        >
                          {{ org.ownerEmail }}
                        </a>
                      }
                    </div>
                  </td>

                  <!-- Created At Cell -->
                  <td class="cell-created">
                    <div class="date-wrapper">
                      @if (org.isCreatedAtInvalid) {
                        <span
                          class="invalid-date-text"
                          [title]="'dataQuirks.dirtyDate' | t:{ raw: org.rawCreatedAt }"
                        >
                          {{ 'table.invalidDate' | t }}
                        </span>
                      } @else {
                        <span class="date-text">{{ org.createdAtFormatted }}</span>
                      }
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
  styles: [`
    .table-container-card {
      background-color: var(--color-bg-surface);
      border-radius: var(--radius-lg);
      border: 1px solid var(--color-border-subtle);
      box-shadow: var(--shadow-sm);
      overflow: hidden;
    }

    .table-responsive {
      width: 100%;
      overflow-x: auto;
    }

    .org-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: var(--font-size-sm);
    }

    .org-table thead {
      background-color: var(--color-bg-subtle);
      border-bottom: 1px solid var(--color-border-subtle);
    }

    .org-table th {
      padding: var(--space-3) var(--space-4);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      white-space: nowrap;
    }

    .th-sort-btn {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      color: inherit;
      font-weight: inherit;
      text-transform: inherit;
      letter-spacing: inherit;
      padding: 0;
    }

    .th-sort-btn:hover {
      color: var(--color-brand);
    }

    .sort-indicator {
      font-size: 10px;
      color: var(--color-brand);
    }

    .sort-neutral {
      color: var(--color-text-placeholder);
    }

    .table-row {
      border-bottom: 1px solid var(--color-border-subtle);
      transition: background-color var(--transition-fast);
    }

    .table-row:hover {
      background-color: var(--color-bg-hover);
    }

    .org-table td {
      padding: var(--space-3) var(--space-4);
      color: var(--color-text-primary);
      vertical-align: middle;
    }

    /* Compact view styling (Ops density mode) */
    .compact-table td {
      padding: var(--space-2) var(--space-4);
    }

    .th-name { width: 34%; }
    .th-status { width: 16%; }
    .th-members { width: 12%; }
    .th-owner { width: 22%; }
    .th-created { width: 16%; }

    .name-wrapper {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      max-width: 360px;
    }

    .org-name-text {
      font-weight: var(--font-weight-medium);
      color: var(--color-text-primary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .unnamed-badge {
      font-style: italic;
      color: var(--color-text-muted);
      background-color: var(--color-bg-subtle);
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-sm);
    }

    .quirk-pill {
      font-size: 10px;
      font-family: var(--font-family-mono);
      background-color: var(--color-bg-muted);
      color: var(--color-text-muted);
      padding: 1px 4px;
      border-radius: var(--radius-xs);
    }

    /* Status Badge System (Conflict 2) */
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-full);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-medium);
      line-height: 1;
      border: 1px solid transparent;
      width: fit-content;
    }

    .status-active {
      background-color: var(--color-status-active-bg);
      color: var(--color-status-active-fg);
      border-color: var(--color-status-active-border);
    }
    .status-active .shape-indicator { color: var(--color-status-active-dot); }

    .status-inactive {
      background-color: var(--color-status-inactive-bg);
      color: var(--color-status-inactive-fg);
      border-color: var(--color-status-inactive-border);
    }
    .status-inactive .shape-indicator { color: var(--color-status-inactive-dot); }

    .status-suspended {
      background-color: var(--color-status-suspended-bg);
      color: var(--color-status-suspended-fg);
      border-color: var(--color-status-suspended-border);
    }
    .status-suspended .shape-indicator { color: var(--color-status-suspended-dot); }

    .status-unknown {
      background-color: var(--color-status-unknown-bg);
      color: var(--color-status-unknown-fg);
      border-color: var(--color-status-unknown-border);
    }
    .status-unknown .shape-indicator { color: var(--color-status-unknown-dot); }

    /* Compact Badge (Designer friendly dot+shape) */
    .compact-badge {
      padding: var(--space-1);
    }

    .shape-indicator {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 14px;
      height: 14px;
    }

    .status-micro-icon {
      width: 10px;
      height: 10px;
    }

    .status-label-text {
      text-transform: capitalize;
    }

    .typo-pill {
      font-size: 9px;
      font-weight: var(--font-weight-bold);
      text-transform: uppercase;
      background-color: var(--color-status-unknown-border);
      color: var(--color-status-unknown-fg);
      padding: 1px 3px;
      border-radius: var(--radius-xs);
    }

    .member-wrapper {
      display: flex;
      align-items: center;
      gap: var(--space-1);
    }

    .member-count {
      font-variant-numeric: tabular-nums;
      font-weight: var(--font-weight-medium);
    }

    .quirk-icon {
      font-size: 11px;
      cursor: help;
    }

    .owner-wrapper {
      max-width: 240px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .owner-link {
      color: var(--color-text-secondary);
    }

    .owner-link:hover {
      color: var(--color-brand);
    }

    .unassigned-text {
      color: var(--color-text-muted);
      font-style: italic;
    }

    .invalid-email-text {
      color: var(--color-error-fg);
      background-color: var(--color-error-bg);
      padding: 1px 4px;
      border-radius: var(--radius-xs);
    }

    .date-wrapper {
      white-space: nowrap;
      font-size: var(--font-size-xs);
      color: var(--color-text-secondary);
    }

    .invalid-date-text {
      color: var(--color-text-muted);
      font-style: italic;
    }

    /* States (Loading, Error, Empty) */
    .state-container {
      padding: var(--space-10) var(--space-6);
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    .state-title {
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-primary);
      margin-top: var(--space-4);
    }

    .state-desc {
      font-size: var(--font-size-sm);
      color: var(--color-text-muted);
      max-width: 440px;
      margin-top: var(--space-2);
    }

    .spinner-ring {
      width: 40px;
      height: 40px;
      border: 3px solid var(--color-border-subtle);
      border-top-color: var(--color-brand);
      border-radius: var(--radius-full);
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .skeleton-table {
      width: 100%;
      max-width: 800px;
      margin-top: var(--space-6);
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }

    .skeleton-row {
      display: flex;
      gap: var(--space-4);
      height: 28px;
    }

    .skeleton-cell {
      background-color: var(--color-bg-muted);
      border-radius: var(--radius-sm);
      animation: skeleton-pulse 1.2s ease-in-out infinite alternate;
    }

    .w-30 { width: 30%; }
    .w-25 { width: 25%; }
    .w-15 { width: 15%; }
    .w-10 { width: 10%; }

    @keyframes skeleton-pulse {
      0% { opacity: 0.4; }
      100% { opacity: 0.9; }
    }

    .error-icon-box {
      width: 52px;
      height: 52px;
      border-radius: var(--radius-full);
      background-color: var(--color-error-bg);
      color: var(--color-error-fg);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .error-icon {
      width: 28px;
      height: 28px;
    }

    .btn-retry {
      margin-top: var(--space-6);
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-3) var(--space-6);
      background-color: var(--color-brand);
      color: var(--color-brand-contrast);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-sm);
    }

    .btn-retry:hover {
      background-color: var(--color-brand-hover);
    }

    .btn-icon {
      width: 16px;
      height: 16px;
    }

    .empty-icon-box {
      width: 52px;
      height: 52px;
      border-radius: var(--radius-full);
      background-color: var(--color-bg-subtle);
      color: var(--color-text-muted);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .empty-icon {
      width: 28px;
      height: 28px;
    }

    .btn-reset-empty {
      margin-top: var(--space-4);
      color: var(--color-brand);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      text-decoration: underline;
    }
  `]
})
export class OrgTableComponent {
  readonly store = inject(OrganisationStore);

  getAriaSort(field: SortField): 'ascending' | 'descending' | 'none' {
    if (this.store.sortBy() !== field) return 'none';
    return this.store.sortDirection() === 'asc' ? 'ascending' : 'descending';
  }

  getStatusTooltip(org: Organisation): string {
    if (org.hasStatusTypo) {
      return `Typo detected in backend ('${org.rawStatus}'). Normalized to Active.`;
    }
    return `Status: ${org.status}`;
  }
}
