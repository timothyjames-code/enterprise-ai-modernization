import { Injectable, inject, signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiHttpClient } from '../../../core/services/api/http-client.service';

export type CaseDto = {
  id: number;
  title: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  summaryText: string | null;
};

export type PageResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
};

const DEFAULT_PAGE = 0;
const DEFAULT_SIZE = 10;
const DEFAULT_SORT = 'createdAt,desc';
const DEFAULT_STATUS = '';

@Injectable({ providedIn: 'root' })
export class CasesStore {
  private readonly api = inject(ApiHttpClient);
  private readonly snack = inject(MatSnackBar);

  // Data
  readonly cases = signal<CaseDto[]>([]);
  readonly pageData = signal<PageResponse<CaseDto> | null>(null);

  // Query state
  readonly page = signal(DEFAULT_PAGE);
  readonly size = signal(DEFAULT_SIZE);
  readonly sort = signal(DEFAULT_SORT);
  readonly search = signal('');
  readonly statusFilter = signal(DEFAULT_STATUS);

  // UI
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  // --- actions ---
  load() {
    this.loading.set(true);
    this.error.set(null);

    const search = this.search().trim();
    const status = this.statusFilter().trim();

    this.api
      .get<PageResponse<CaseDto>>('/cases', {
        page: this.page(),
        size: this.size(),
        sort: this.sort(),
        ...(search ? { search } : {}),
        ...(status ? { status } : {}),
      })
      .subscribe({
        next: (data) => {
          this.pageData.set(data);
          this.cases.set(data?.content ?? []);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(`Load failed: ${err?.message ?? 'unknown'}`);
          this.loading.set(false);
          this.toast('Failed to load cases');
        },
      });
  }

  /**
   * ✅ Refresh a single row without reloading the list.
   * - Calls GET /cases/{id}
   * - Patches the case in the existing list
   */
  refreshOne(id: number) {
    if (id == null) return;

    this.api.get<CaseDto>(`/cases/${id}`).subscribe({
      next: (fresh) => {
        if (!fresh?.id) return;

        const next = this.cases().map((c) => (c.id === fresh.id ? { ...c, ...fresh } : c));
        this.cases.set(next);
      },
      error: () => {
        // keep quiet; row refresh is a background enhancement
      },
    });
  }

  setPage(p: number) {
    this.page.set(Math.max(0, Number(p) || 0));
  }

  setSize(s: number) {
    this.size.set(Math.max(1, Number(s) || DEFAULT_SIZE));
  }

  setSort(v: string) {
    this.sort.set(v || DEFAULT_SORT);
  }

  setSearch(v: string) {
    this.search.set(v ?? '');
  }

  setStatus(v: string) {
    this.statusFilter.set(v ?? '');
  }

  clearFilters() {
    this.page.set(DEFAULT_PAGE);
    this.size.set(DEFAULT_SIZE);
    this.sort.set(DEFAULT_SORT);
    this.search.set('');
    this.statusFilter.set(DEFAULT_STATUS);
  }

  hasActiveFilters(): boolean {
    return (
      this.page() !== DEFAULT_PAGE ||
      this.size() !== DEFAULT_SIZE ||
      this.sort() !== DEFAULT_SORT ||
      this.search().trim().length > 0 ||
      this.statusFilter().trim().length > 0
    );
  }

  private toast(message: string, action = 'OK', duration = 2500) {
    this.snack.open(message, action, { duration });
  }
}
