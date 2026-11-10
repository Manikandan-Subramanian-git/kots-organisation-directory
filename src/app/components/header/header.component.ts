import { Component, inject, output } from '@angular/core';
import { OrganisationStore } from '../../core/store/organisation.store';
import { TranslatePipe } from '../../core/i18n/translate.pipe';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <header class="app-header">
      <div class="header-container">
        <div class="brand-section">
          <div class="brand-badge">
            <svg class="brand-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span class="brand-tag">{{ 'app.badgeOps' | t }}</span>
          </div>
          <div>
            <h1 class="header-title">{{ 'app.title' | t }}</h1>
            <p class="header-subtitle">{{ 'app.subtitle' | t }}</p>
          </div>
        </div>

        <div class="header-actions">
          <!-- Density Toggle (Conflict 2 Ops Tool) -->
          <button
            type="button"
            class="btn btn-secondary density-btn"
            (click)="store.toggleDensity()"
            [attr.aria-pressed]="store.isCompactMode()"
            [title]="'app.densityToggle' | t"
          >
            <svg class="action-icon" viewBox="0 0 20 20" fill="currentColor">
              @if (store.isCompactMode()) {
                <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd" />
              } @else {
                <path fill-rule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd" />
              }
            </svg>
            <span>
              {{ store.isCompactMode() ? ('app.densityCompact' | t) : ('app.densityNormal' | t) }}
            </span>
          </button>

          <!-- Add Organisation CTA -->
          <button
            type="button"
            class="btn btn-primary"
            (click)="openCreateModal.emit()"
          >
            {{ 'app.addOrgButton' | t }}
          </button>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .app-header {
      background-color: var(--color-bg-surface);
      border-bottom: 1px solid var(--color-border-subtle);
      padding: var(--space-4) var(--space-6);
      box-shadow: var(--shadow-sm);
    }

    .header-container {
      max-width: 1400px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-4);
      flex-wrap: wrap;
    }

    .brand-section {
      display: flex;
      align-items: center;
      gap: var(--space-4);
    }

    .brand-badge {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 44px;
      border-radius: var(--radius-lg);
      background-color: var(--color-brand-subtle);
      color: var(--color-brand);
      border: 1px solid var(--color-brand-border);
    }

    .brand-icon {
      width: 22px;
      height: 22px;
    }

    .brand-tag {
      font-size: 8px;
      font-weight: var(--font-weight-bold);
      letter-spacing: 0.5px;
      text-transform: uppercase;
      line-height: 1;
      margin-top: 1px;
    }

    .header-title {
      font-size: var(--font-size-xl);
      font-weight: var(--font-weight-bold);
      color: var(--color-text-primary);
      line-height: var(--line-height-tight);
    }

    .header-subtitle {
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
      margin-top: var(--space-1);
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-2);
      padding: var(--space-2) var(--space-4);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      border-radius: var(--radius-md);
      transition: background-color var(--transition-fast), border-color var(--transition-fast);
      white-space: nowrap;
    }

    .btn-secondary {
      background-color: var(--color-bg-subtle);
      color: var(--color-text-secondary);
      border: 1px solid var(--color-border-default);
    }

    .btn-secondary:hover {
      background-color: var(--color-bg-muted);
      color: var(--color-text-primary);
    }

    .btn-primary {
      background-color: var(--color-brand);
      color: var(--color-brand-contrast);
      box-shadow: var(--shadow-sm);
    }

    .btn-primary:hover {
      background-color: var(--color-brand-hover);
    }

    .action-icon {
      width: 16px;
      height: 16px;
    }
  `]
})
export class HeaderComponent {
  readonly store = inject(OrganisationStore);
  readonly openCreateModal = output<void>();
}
