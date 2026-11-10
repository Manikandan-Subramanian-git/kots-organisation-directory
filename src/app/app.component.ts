import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { SearchFilterComponent } from './components/search-filter/search-filter.component';
import { OrgTableComponent } from './components/org-table/org-table.component';
import { OrgCreateDialogComponent } from './components/org-create-dialog/org-create-dialog.component';
import { OrganisationStore } from './core/store/organisation.store';
import { TranslatePipe } from './core/i18n/translate.pipe';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    HeaderComponent,
    SearchFilterComponent,
    OrgTableComponent,
    OrgCreateDialogComponent,
    TranslatePipe
  ],
  template: `
    <div class="app-layout">
      <!-- App Header -->
      <app-header (openCreateModal)="openCreateModal()" />

      <!-- Main Content Container -->
      <main class="main-content">
        <div class="content-wrapper">
          <!-- Success Notification Toast -->
          @if (successToast()) {
            <div class="toast-success" role="status" aria-live="polite">
              <svg class="toast-icon" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              <span>{{ successToast() }}</span>
              <button
                type="button"
                class="toast-close"
                (click)="successToast.set(null)"
                aria-label="Close notification"
              >
                ✕
              </button>
            </div>
          }

          <!-- Search & Filter Controls (FR2) -->
          <app-search-filter />

          <!-- Organisations Table (FR1, FR4, Conflict 1, Conflict 2) -->
          <app-org-table />
        </div>
      </main>

      <!-- Create Organisation Modal (FR3) -->
      @if (showCreateModal()) {
        <app-org-create-dialog
          (closeModal)="closeCreateModal()"
          (created)="onOrgCreated()"
        />
      }
    </div>
  `,
  styles: [`
    .app-layout {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background-color: var(--color-bg-canvas);
    }

    .main-content {
      flex: 1;
      padding: var(--space-6) var(--space-6) var(--space-12);
    }

    .content-wrapper {
      max-width: 1400px;
      margin: 0 auto;
    }

    .toast-success {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-3) var(--space-4);
      background-color: var(--color-success-bg);
      color: var(--color-success-fg);
      border: 1px solid var(--color-success-border);
      border-radius: var(--radius-md);
      margin-bottom: var(--space-4);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      box-shadow: var(--shadow-sm);
      animation: toast-slide 0.25s ease-out;
    }

    @keyframes toast-slide {
      from { opacity: 0; transform: translateY(-8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .toast-icon {
      width: 20px;
      height: 20px;
      flex-shrink: 0;
    }

    .toast-close {
      margin-left: auto;
      color: var(--color-success-fg);
      font-size: var(--font-size-xs);
      opacity: 0.7;
      padding: var(--space-1);
    }

    .toast-close:hover {
      opacity: 1;
    }
  `]
})
export class AppComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(OrganisationStore);

  readonly showCreateModal = signal<boolean>(false);
  readonly successToast = signal<string | null>(null);

  ngOnInit(): void {
    // Sync initial state from URL query parameters (FR2)
    this.route.queryParams.subscribe((params) => {
      this.store.initFromQueryParams(params);
    });

    // Conflict 1: Begin progressive loading
    this.store.loadInitial();
  }

  openCreateModal(): void {
    this.showCreateModal.set(true);
  }

  closeCreateModal(): void {
    this.showCreateModal.set(false);
  }

  onOrgCreated(): void {
    this.successToast.set('Organisation successfully created and added to directory.');
    setTimeout(() => {
      this.successToast.set(null);
    }, 4500);
  }
}
