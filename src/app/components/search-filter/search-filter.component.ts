import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { OrganisationStore } from '../../core/store/organisation.store';
import { TranslatePipe } from '../../core/i18n/translate.pipe';

@Component({
  selector: 'app-search-filter',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <div class="search-filter-card">
      <div class="controls-row">
        <!-- Debounced Search Input (FR2) -->
        <div class="search-field-wrapper">
          <svg class="search-icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
          </svg>
          <input
            type="search"
            class="search-input"
            [placeholder]="'searchFilter.searchPlaceholder' | t"
            [attr.aria-label]="'searchFilter.searchAria' | t"
            [value]="store.searchQuery()"
            (input)="onSearchInput($event)"
          />
          @if (store.searchQuery()) {
            <button
              type="button"
              class="clear-btn"
              (click)="clearSearch()"
              [attr.aria-label]="'searchFilter.clearSearchAria' | t"
            >
              ✕
            </button>
          }
        </div>

        <!-- Status Filter Tabs / Dropdown (FR2) -->
        <div class="status-filters" role="group" [attr.aria-label]="'searchFilter.filterStatusAria' | t">
          <button
            type="button"
            class="filter-pill"
            [class.active]="store.statusFilter() === 'all'"
            (click)="store.setStatusFilter('all')"
          >
            {{ 'searchFilter.statusAll' | t }}
          </button>
          <button
            type="button"
            class="filter-pill filter-pill-active"
            [class.active]="store.statusFilter() === 'active'"
            (click)="store.setStatusFilter('active')"
          >
            <span class="status-dot dot-active"></span>
            {{ 'searchFilter.statusActive' | t }}
          </button>
          <button
            type="button"
            class="filter-pill filter-pill-inactive"
            [class.active]="store.statusFilter() === 'inactive'"
            (click)="store.setStatusFilter('inactive')"
          >
            <span class="status-dot dot-inactive"></span>
            {{ 'searchFilter.statusInactive' | t }}
          </button>
          <button
            type="button"
            class="filter-pill filter-pill-suspended"
            [class.active]="store.statusFilter() === 'suspended'"
            (click)="store.setStatusFilter('suspended')"
          >
            <span class="status-dot dot-suspended"></span>
            {{ 'searchFilter.statusSuspended' | t }}
          </button>
          <button
            type="button"
            class="filter-pill filter-pill-unknown"
            [class.active]="store.statusFilter() === 'unknown'"
            (click)="store.setStatusFilter('unknown')"
          >
            <span class="status-dot dot-unknown"></span>
            {{ 'searchFilter.statusUnknown' | t }}
          </button>
        </div>

        @if (hasActiveFilters()) {
          <button
            type="button"
            class="btn-reset"
            (click)="store.resetFilters()"
          >
            {{ 'searchFilter.resetFilters' | t }}
          </button>
        }
      </div>

      <!-- Live Stream & Rate Limit Progress Status Bar (Conflict 1) -->
      <div class="status-bar-row">
        <div class="stats-counter">
          <span class="count-highlight">{{ store.filteredOrganisations().length }}</span>
          <span class="count-label">
            {{ 'streaming.loadingProgress' | t:{ loaded: store.totalLoaded(), total: store.streamProgress().total } }}
          </span>
        </div>

        @if (store.isStreaming()) {
          <div class="streaming-pill">
            <span class="pulse-indicator"></span>
            <span class="streaming-text">{{ 'streaming.streamingNotice' | t }}</span>
          </div>
        } @else if (store.isAllLoaded()) {
          <div class="loaded-badge">
            ✓ {{ 'streaming.allLoaded' | t:{ total: store.totalLoaded() } }}
          </div>
        }

        @if (store.rateLimitNotice()) {
          <div class="rate-limit-badge" role="alert">
            <span class="hourglass-icon">⏳</span>
            <span>{{ store.rateLimitNotice() }}</span>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .search-filter-card {
      background-color: var(--color-bg-surface);
      border-radius: var(--radius-lg);
      border: 1px solid var(--color-border-subtle);
      padding: var(--space-4);
      margin-bottom: var(--space-4);
      box-shadow: var(--shadow-sm);
    }

    .controls-row {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      flex-wrap: wrap;
    }

    .search-field-wrapper {
      position: relative;
      flex: 1 1 320px;
      display: flex;
      align-items: center;
    }

    .search-icon {
      position: absolute;
      left: var(--space-3);
      width: 18px;
      height: 18px;
      color: var(--color-text-placeholder);
      pointer-events: none;
    }

    .search-input {
      width: 100%;
      height: 40px;
      padding-left: var(--space-8);
      padding-right: var(--space-8);
      font-size: var(--font-size-sm);
      color: var(--color-text-primary);
      background-color: var(--color-bg-subtle);
      border: 1px solid var(--color-border-subtle);
      border-radius: var(--radius-md);
      transition: border-color var(--transition-fast), background-color var(--transition-fast);
    }

    .search-input:focus {
      background-color: var(--color-bg-surface);
      border-color: var(--color-brand);
      outline: none;
      box-shadow: var(--shadow-focus);
    }

    .clear-btn {
      position: absolute;
      right: var(--space-3);
      width: 20px;
      height: 20px;
      border-radius: var(--radius-full);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
    }

    .clear-btn:hover {
      color: var(--color-text-primary);
      background-color: var(--color-bg-muted);
    }

    .status-filters {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      flex-wrap: wrap;
    }

    .filter-pill {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-2) var(--space-3);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-medium);
      color: var(--color-text-secondary);
      background-color: var(--color-bg-subtle);
      border: 1px solid var(--color-border-subtle);
      border-radius: var(--radius-full);
      transition: all var(--transition-fast);
    }

    .filter-pill:hover {
      background-color: var(--color-bg-muted);
      color: var(--color-text-primary);
    }

    .filter-pill.active {
      background-color: var(--color-brand-subtle);
      color: var(--color-brand);
      border-color: var(--color-brand-border);
      font-weight: var(--font-weight-semibold);
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: var(--radius-full);
    }

    .dot-active { background-color: var(--color-status-active-dot); }
    .dot-inactive { background-color: var(--color-status-inactive-dot); }
    .dot-suspended { background-color: var(--color-status-suspended-dot); }
    .dot-unknown { background-color: var(--color-status-unknown-dot); }

    .btn-reset {
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
      text-decoration: underline;
      padding: var(--space-2);
    }

    .btn-reset:hover {
      color: var(--color-error-fg);
    }

    .status-bar-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-3);
      margin-top: var(--space-3);
      padding-top: var(--space-3);
      border-top: 1px solid var(--color-border-subtle);
      flex-wrap: wrap;
      font-size: var(--font-size-xs);
    }

    .stats-counter {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      color: var(--color-text-secondary);
    }

    .count-highlight {
      font-weight: var(--font-weight-bold);
      color: var(--color-text-primary);
    }

    .streaming-pill {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-1) var(--space-3);
      background-color: var(--color-brand-subtle);
      color: var(--color-brand);
      border-radius: var(--radius-full);
      font-size: var(--font-size-xs);
      border: 1px solid var(--color-brand-border);
    }

    .pulse-indicator {
      width: 6px;
      height: 6px;
      border-radius: var(--radius-full);
      background-color: var(--color-brand);
      animation: pulse 1.5s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.3; transform: scale(1.4); }
    }

    .loaded-badge {
      color: var(--color-status-active-fg);
      background-color: var(--color-status-active-bg);
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-sm);
    }

    .rate-limit-badge {
      display: inline-flex;
      align-items: center;
      gap: var(--space-1);
      color: var(--color-status-unknown-fg);
      background-color: var(--color-status-unknown-bg);
      border: 1px solid var(--color-status-unknown-border);
      padding: var(--space-1) var(--space-3);
      border-radius: var(--radius-full);
      font-weight: var(--font-weight-medium);
    }
  `]
})
export class SearchFilterComponent implements OnInit, OnDestroy {
  readonly store = inject(OrganisationStore);

  private readonly searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;

  ngOnInit(): void {
    // Debounce free-text search by 300ms (FR2)
    this.searchSubscription = this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((query) => {
        this.store.setSearchQuery(query);
      });
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchSubject.next(value);
  }

  clearSearch(): void {
    this.store.setSearchQuery('');
  }

  hasActiveFilters(): boolean {
    return !!this.store.searchQuery() || this.store.statusFilter() !== 'all';
  }
}

