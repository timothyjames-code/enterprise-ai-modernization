import { Component, inject, signal } from '@angular/core';
import { NgFor, NgIf, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiHttpClient } from '../../core/services/api/http-client.service';

// ✅ Material modules for the toolbar
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';

type CaseDto = {
  id: number;
  title: string;
  status: string;
  createdAt: string;
};

type PageResponse<T> = {
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
const DEFAULT_STATUS = ''; // '' = All

@Component({
  selector: 'app-cases-page',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    DatePipe,
    FormsModule,

    // ✅ Material
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  template: `
    <h1>Cases</h1>

    <!-- ✅ Material toolbar -->
    <div style="display:flex; gap:12px; align-items:center; flex-wrap:wrap; margin: 12px 0;">
      <mat-form-field appearance="outline" style="min-width: 260px;">
        <mat-label>Search</mat-label>
        <input
          matInput
          placeholder="Search by title..."
          [ngModel]="search()"
          (ngModelChange)="onSearchChange($event)"
        />
      </mat-form-field>

      <mat-form-field appearance="outline" style="min-width: 180px;">
        <mat-label>Status</mat-label>
        <mat-select [ngModel]="statusFilter()" (ngModelChange)="onStatusChange($event)">
          <mat-option [value]="''">All statuses</mat-option>
          <mat-option value="Open">Open</mat-option>
          <mat-option value="In Review">In Review</mat-option>
          <mat-option value="Closed">Closed</mat-option>
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline" style="min-width: 180px;">
        <mat-label>Sort</mat-label>
        <mat-select [ngModel]="sort()" (ngModelChange)="onSortChange($event)">
          <mat-option value="createdAt,desc">Newest</mat-option>
          <mat-option value="createdAt,asc">Oldest</mat-option>
          <mat-option value="title,asc">Title A–Z</mat-option>
          <mat-option value="title,desc">Title Z–A</mat-option>
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline" style="width: 120px;">
        <mat-label>Size</mat-label>
        <mat-select [ngModel]="size()" (ngModelChange)="onSizeChange($event)">
          <mat-option [value]="5">5</mat-option>
          <mat-option [value]="10">10</mat-option>
          <mat-option [value]="20">20</mat-option>
        </mat-select>
      </mat-form-field>

      <button mat-stroked-button (click)="prevPage()" [disabled]="loading() || pageData()?.first">
        Prev
      </button>
      <button mat-stroked-button (click)="nextPage()" [disabled]="loading() || pageData()?.last">
        Next
      </button>

      <span *ngIf="pageData() as p" style="color:#555;">
        Page {{ p.number + 1 }} / {{ p.totalPages || 1 }} • {{ p.totalElements }} total
      </span>
    </div>

    <!-- Create form (left as plain HTML for now) -->
    <div style="margin: 12px 0; display:flex; gap:8px; align-items:flex-start;">
      <div style="display:flex; flex-direction:column; gap:4px;">
        <input
          placeholder="Case title"
          [ngModel]="newTitle()"
          (ngModelChange)="onTitleChange($event)"
          style="min-width: 280px;"
        />
        <small *ngIf="fieldErrors()['title']" style="color:red">
          {{ fieldErrors()['title'] }}
        </small>
      </div>

      <select [ngModel]="newStatus()" (ngModelChange)="newStatus.set($event)">
        <option value="Open">Open</option>
        <option value="In Review">In Review</option>
        <option value="Closed">Closed</option>
      </select>

      <button (click)="createCase()" [disabled]="creating() || !newTitle().trim()">
        {{ creating() ? 'Adding...' : 'Add' }}
      </button>
    </div>

    <p *ngIf="loading()">Loading...</p>
    <p *ngIf="error() as e" style="color:red">{{ e }}</p>

    <ul *ngIf="!loading() && !error()">
      <li *ngFor="let c of cases()" style="margin: 8px 0;">
        <ng-container *ngIf="editingId() !== c.id; else editRow">
          <strong>#{{ c.id }}</strong> — {{ c.title }}
          <span>({{ c.status }})</span>
          <small> • {{ c.createdAt | date : 'medium' }}</small>

          <button (click)="startEdit(c)" style="margin-left: 8px;">Edit</button>

          <button
            (click)="deleteCase(c.id)"
            [disabled]="deletingIds().has(c.id)"
            style="margin-left: 8px;"
          >
            {{ deletingIds().has(c.id) ? 'Deleting...' : 'Delete' }}
          </button>
        </ng-container>

        <ng-template #editRow>
          <strong>#{{ c.id }}</strong>

          <input
            [ngModel]="editTitle()"
            (ngModelChange)="editTitle.set($event)"
            style="margin-left: 8px; min-width: 260px;"
          />

          <select
            [ngModel]="editStatus()"
            (ngModelChange)="editStatus.set($event)"
            style="margin-left: 8px;"
          >
            <option value="Open">Open</option>
            <option value="In Review">In Review</option>
            <option value="Closed">Closed</option>
          </select>

          <button
            (click)="saveEdit()"
            [disabled]="savingEdit() || !editTitle().trim()"
            style="margin-left: 8px;"
          >
            {{ savingEdit() ? 'Saving...' : 'Save' }}
          </button>

          <button (click)="cancelEdit()" [disabled]="savingEdit()" style="margin-left: 8px;">
            Cancel
          </button>

          <small *ngIf="editError()" style="color:red; margin-left: 8px;">
            {{ editError() }}
          </small>
        </ng-template>
      </li>
    </ul>

    <p *ngIf="!loading() && !error() && cases().length === 0">No cases found.</p>
  `,
})
export class CasesPage {
  private readonly api = inject(ApiHttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  // Data
  readonly cases = signal<CaseDto[]>([]);
  readonly pageData = signal<PageResponse<CaseDto> | null>(null);

  // Query state
  readonly page = signal(DEFAULT_PAGE);
  readonly size = signal(DEFAULT_SIZE);
  readonly sort = signal(DEFAULT_SORT);
  readonly search = signal('');
  readonly statusFilter = signal(DEFAULT_STATUS);
  private searchDebounce?: number;

  private syncingFromUrl = false;

  // UI state
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly deletingIds = signal<Set<number>>(new Set());

  // Create
  readonly creating = signal(false);
  readonly fieldErrors = signal<Record<string, string>>({});
  readonly newTitle = signal('');
  readonly newStatus = signal<'Open' | 'In Review' | 'Closed'>('Open');

  // Edit
  readonly editingId = signal<number | null>(null);
  readonly editTitle = signal('');
  readonly editStatus = signal<'Open' | 'In Review' | 'Closed'>('Open');
  readonly savingEdit = signal(false);
  readonly editError = signal<string | null>(null);

  constructor() {
    // URL -> state
    this.route.queryParamMap.subscribe((q) => {
      this.syncingFromUrl = true;

      const page = this.toInt(q.get('page'), DEFAULT_PAGE);
      const size = this.toInt(q.get('size'), DEFAULT_SIZE);
      const sort = q.get('sort') ?? DEFAULT_SORT;
      const search = q.get('search') ?? '';
      const status = q.get('status') ?? DEFAULT_STATUS;

      this.page.set(page);
      this.size.set(size);
      this.sort.set(sort);
      this.search.set(search);
      this.statusFilter.set(status);

      // cancel edit on navigation/query changes
      this.cancelEdit();

      this.syncingFromUrl = false;

      this.loadCases();
    });
  }

  private toInt(value: string | null, fallback: number) {
    if (value == null) return fallback;
    const n = Number(value);
    return Number.isFinite(n) && n >= 0 ? n : fallback;
  }

  private pushStateToUrl(replace = false) {
    if (this.syncingFromUrl) return;

    const search = this.search().trim();
    const status = this.statusFilter().trim();
    const page = this.page();
    const size = this.size();
    const sort = this.sort();

    // clean URL: omit defaults
    const queryParams: Record<string, any> = {
      page: page !== DEFAULT_PAGE ? page : null,
      size: size !== DEFAULT_SIZE ? size : null,
      sort: sort !== DEFAULT_SORT ? sort : null,
      search: search ? search : null,
      status: status ? status : null,
    };

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
      replaceUrl: replace,
    });
  }

  onSearchChange(value: string) {
    this.search.set(value);

    window.clearTimeout(this.searchDebounce);
    this.searchDebounce = window.setTimeout(() => {
      this.page.set(DEFAULT_PAGE);
      this.pushStateToUrl();
    }, 300);
  }

  onStatusChange(value: string) {
    this.statusFilter.set(value ?? '');
    this.page.set(DEFAULT_PAGE);
    this.pushStateToUrl();
  }

  onSortChange(value: string) {
    this.sort.set(value);
    this.page.set(DEFAULT_PAGE);
    this.pushStateToUrl();
  }

  onSizeChange(value: number) {
    this.size.set(Number(value));
    this.page.set(DEFAULT_PAGE);
    this.pushStateToUrl();
  }

  prevPage() {
    if (this.page() <= 0) return;
    this.page.update((p) => p - 1);
    this.pushStateToUrl();
  }

  nextPage() {
    const p = this.pageData();
    if (!p || p.last) return;
    this.page.update((x) => x + 1);
    this.pushStateToUrl();
  }

  onTitleChange(value: string) {
    this.newTitle.set(value);
    if (this.fieldErrors()['title']) {
      const next = { ...this.fieldErrors() };
      delete next['title'];
      this.fieldErrors.set(next);
    }
  }

  private loadCases() {
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
        },
      });
  }

  createCase() {
    const title = this.newTitle().trim();
    const status = this.newStatus().trim();
    if (!title) return;

    this.creating.set(true);
    this.error.set(null);
    this.fieldErrors.set({});

    this.api.post<CaseDto>('/cases', { title, status }).subscribe({
      next: () => {
        this.newTitle.set('');
        this.newStatus.set('Open');
        this.creating.set(false);
        this.loadCases();
      },
      error: (err) => {
        this.creating.set(false);

        const apiErrors = err?.error?.errors;
        if (apiErrors && typeof apiErrors === 'object') {
          this.fieldErrors.set(apiErrors);
          this.error.set(err?.error?.message ?? 'Validation failed');
          return;
        }

        this.error.set(`Create failed: ${err?.message ?? 'unknown'}`);
      },
    });
  }

  deleteCase(id: number) {
    const ok = window.confirm(`Delete case #${id}? This can't be undone.`);
    if (!ok) return;

    const next = new Set(this.deletingIds());
    next.add(id);
    this.deletingIds.set(next);

    this.api.delete<void>(`/cases/${id}`).subscribe({
      next: () => {
        const after = new Set(this.deletingIds());
        after.delete(id);
        this.deletingIds.set(after);
        this.loadCases();
      },
      error: (err) => {
        const after = new Set(this.deletingIds());
        after.delete(id);
        this.deletingIds.set(after);
        this.error.set(`Delete failed: ${err?.message ?? 'unknown'}`);
      },
    });
  }

  startEdit(c: CaseDto) {
    this.editingId.set(c.id);
    this.editTitle.set(c.title);
    this.editStatus.set(c.status as any);
    this.editError.set(null);
  }

  cancelEdit() {
    this.editingId.set(null);
    this.editTitle.set('');
    this.editStatus.set('Open');
    this.editError.set(null);
  }

  saveEdit() {
    const id = this.editingId();
    if (id == null) return;

    const title = this.editTitle().trim();
    const status = this.editStatus().trim();
    if (!title) return;

    this.savingEdit.set(true);
    this.editError.set(null);

    this.api.put<CaseDto>(`/cases/${id}`, { title, status }).subscribe({
      next: () => {
        this.savingEdit.set(false);
        this.cancelEdit();
        this.loadCases();
      },
      error: (err) => {
        this.savingEdit.set(false);
        const msg = err?.error?.message ?? err?.message ?? 'Update failed';
        this.editError.set(msg);
      },
    });
  }
}
