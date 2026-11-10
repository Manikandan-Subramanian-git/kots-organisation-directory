import { Injectable, computed, inject, signal } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Organisation } from '../models/organisation.model';
import { OrganisationAdapter } from '../adapters/organisation.adapter';
import { OrganisationApiService, ApiError } from '../services/organisation-api.service';
import { TranslationService } from '../i18n/translation.service';

export type SortField = 'name' | 'createdAt';
export type SortDirection = 'asc' | 'desc';

@Injectable({
  providedIn: 'root'
})
export class OrganisationStore {
  private readonly apiService = inject(OrganisationApiService);
  private readonly translationService = inject(TranslationService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // --- Core State Signals ---
  readonly organisations = signal<Organisation[]>([]);
  readonly isLoadingInitial = signal<boolean>(false);
  readonly isStreaming = signal<boolean>(false);
  readonly streamProgress = signal<{ loaded: number; total: number }>({ loaded: 0, total: 137 });
  readonly error = signal<string | null>(null);
  readonly rateLimitNotice = signal<string | null>(null);

  // --- Filter & Sorting Signals (FR2) ---
  readonly searchQuery = signal<string>('');
  readonly statusFilter = signal<string>('all');
  readonly sortBy = signal<SortField>('name');
  readonly sortDirection = signal<SortDirection>('asc');

  // --- View Density / A11y Presentation Mode (Conflict 2) ---
  readonly isCompactMode = signal<boolean>(false);

  // --- Computed Signals ---
  readonly totalLoaded = computed(() => this.organisations().length);
  readonly activeCount = computed(
    () => this.organisations().filter((o) => o.status === 'active').length
  );
  readonly isAllLoaded = computed(
    () => this.streamProgress().loaded >= this.streamProgress().total && this.totalLoaded() > 0
  );

  /**
   * Filtered and sorted organisations displayed in the directory table.
   * Runs client-side for sub-millisecond response time once data chunks stream in.
   */
  readonly filteredOrganisations = computed(() => {
    const list = this.organisations();
    const query = this.searchQuery().trim().toLowerCase();
    const status = this.statusFilter();
    const sort = this.sortBy();
    const dir = this.sortDirection();

    // 1. Search filter (FR2)
    let filtered = list;
    if (query) {
      filtered = filtered.filter((org) => {
        const matchesName = org.name.toLowerCase().includes(query);
        const matchesDisplay = org.displayName.toLowerCase().includes(query);
        const matchesOwner = org.ownerEmail.toLowerCase().includes(query);
        return matchesName || matchesDisplay || matchesOwner;
      });
    }

    // 2. Status filter (FR2)
    if (status !== 'all') {
      if (status === 'unknown') {
        filtered = filtered.filter((org) => org.status === 'unknown' || org.hasStatusTypo);
      } else {
        filtered = filtered.filter((org) => org.status === status && !org.hasStatusTypo);
      }
    }

    // 3. Sorting (FR1)
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;
      if (sort === 'name') {
        // Natural internationalized comparison handling Arabic & emojis
        comparison = a.displayName.localeCompare(b.displayName, undefined, {
          numeric: true,
          sensitivity: 'base'
        });
      } else if (sort === 'createdAt') {
        const timeA = a.createdAt?.getTime() ?? 0;
        const timeB = b.createdAt?.getTime() ?? 0;
        comparison = timeA - timeB;
      }
      return dir === 'asc' ? comparison : -comparison;
    });

    return sorted;
  });

  /**
   * Conflict 1 Resolution: Progressive transparent batching.
   * Loads Page 1 immediately for sub-second first paint, then queues subsequent pages
   * while respecting the 5 req/min rate limit, assembling all 137 records into one view.
   */
  async loadInitial(): Promise<void> {
    this.isLoadingInitial.set(true);
    this.error.set(null);
    this.rateLimitNotice.set(null);
    this.organisations.set([]);

    try {
      // Fetch Page 1 (25 records)
      const res = await this.apiService.getOrganisations(1, 25);
      const fallbackUnnamed = this.translationService.t('table.unnamedOrg');
      const normalized = OrganisationAdapter.fromRawList(res.data, fallbackUnnamed);

      this.organisations.set(normalized);
      this.streamProgress.set({ loaded: normalized.length, total: res.total });
      this.isLoadingInitial.set(false);

      // Trigger background streamer for remaining pages (2 to totalPages)
      this.startBackgroundStreamer(2, res.totalPages, res.total);
    } catch (err: unknown) {
      this.isLoadingInitial.set(false);
      const message = err instanceof Error ? err.message : this.translationService.t('states.errorDescription');
      this.error.set(message);
    }
  }

  /**
   * Background queue worker that streams subsequent pages into the directory.
   * Gracefully handles 429 rate limit backoff and transient 500 errors.
   */
  private async startBackgroundStreamer(
    startPage: number,
    totalPages: number,
    totalRecords: number
  ): Promise<void> {
    this.isStreaming.set(true);
    const fallbackUnnamed = this.translationService.t('table.unnamedOrg');

    for (let page = startPage; page <= totalPages; page++) {
      let success = false;
      let attempts = 0;

      while (!success && attempts < 3) {
        attempts++;
        try {
          const res = await this.apiService.getOrganisations(page, 25);
          const rawCountSoFar = this.organisations().length;
          const normalizedBatch = res.data.map((item, idx) =>
            OrganisationAdapter.fromRaw(item, rawCountSoFar + idx, fallbackUnnamed)
          );

          this.organisations.update((existing) => [...existing, ...normalizedBatch]);
          this.streamProgress.set({ loaded: this.organisations().length, total: totalRecords });
          this.rateLimitNotice.set(null);
          success = true;
        } catch (err: unknown) {
          if (err instanceof ApiError && err.statusCode === 429) {
            // Rate limit reached (5 req/min): show informative message and wait 12s
            this.rateLimitNotice.set(
              this.translationService.t('streaming.rateLimitNotice')
            );
            await new Promise((resolve) => setTimeout(resolve, 12500));
          } else {
            // Transient 500 error: wait 1s and retry
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }
      }
    }

    this.isStreaming.set(false);
    this.rateLimitNotice.set(null);
  }

  /**
   * Synchronizes search and filter signals from URL query parameters.
   */
  initFromQueryParams(params: Record<string, string | undefined>): void {
    if (params['search']) {
      this.searchQuery.set(params['search']);
    }
    if (params['status'] && ['all', 'active', 'inactive', 'suspended', 'unknown'].includes(params['status'])) {
      this.statusFilter.set(params['status']);
    }
    if (params['sortBy'] && ['name', 'createdAt'].includes(params['sortBy'])) {
      this.sortBy.set(params['sortBy'] as SortField);
    }
    if (params['sortDir'] && ['asc', 'desc'].includes(params['sortDir'])) {
      this.sortDirection.set(params['sortDir'] as SortDirection);
    }
  }

  /**
   * Updates URL query parameters without reloading the page.
   */
  updateUrlParams(): void {
    const qp: Record<string, string | null> = {};
    const query = this.searchQuery().trim();
    const status = this.statusFilter();
    const sort = this.sortBy();
    const dir = this.sortDirection();

    qp['search'] = query ? query : null;
    qp['status'] = status !== 'all' ? status : null;
    qp['sortBy'] = sort !== 'name' ? sort : null;
    qp['sortDir'] = dir !== 'asc' ? dir : null;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: qp,
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }

  setSearchQuery(q: string): void {
    this.searchQuery.set(q);
    this.updateUrlParams();
  }

  setStatusFilter(status: string): void {
    this.statusFilter.set(status);
    this.updateUrlParams();
  }

  toggleSort(field: SortField): void {
    if (this.sortBy() === field) {
      this.sortDirection.update((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sortBy.set(field);
      this.sortDirection.set('asc');
    }
    this.updateUrlParams();
  }

  toggleDensity(): void {
    this.isCompactMode.update((v) => !v);
  }

  resetFilters(): void {
    this.searchQuery.set('');
    this.statusFilter.set('all');
    this.sortBy.set('name');
    this.sortDirection.set('asc');
    this.updateUrlParams();
  }

  /**
   * FR3: Adds a newly created organisation into the store.
   */
  async addOrganisation(payload: {
    name: string;
    status: string;
    ownerEmail: string;
    memberCount?: number | null;
  }): Promise<void> {
    const raw = await this.apiService.createOrganisation(payload);
    const fallbackUnnamed = this.translationService.t('table.unnamedOrg');
    const newOrg = OrganisationAdapter.fromRaw(raw, 0, fallbackUnnamed);

    // Prepend to current list
    this.organisations.update((list) => [newOrg, ...list]);
    this.streamProgress.update((p) => ({ loaded: p.loaded + 1, total: p.total + 1 }));
  }
}
