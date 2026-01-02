import { Component, inject, signal } from '@angular/core';
import { NgFor, NgIf, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiHttpClient } from '../../core/services/api/http-client.service';

// Angular Material
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';

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
const DEFAULT_STATUS = '';

@Component({
  selector: 'app-cases-page',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    DatePipe,
    FormsModule,

    // Material
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDialogModule,
    MatSnackBarModule,
    MatCardModule,
    MatIconModule,
    MatDividerModule,
    MatTooltipModule,
    MatProgressBarModule,
  ],
  styles: [
    `
      .page {
        max-width: 1100px;
        margin: 0 auto;
        padding: 20px 16px 48px;
      }

      .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        margin-bottom: 12px;
      }

      .title {
        margin: 0;
        font-size: 28px;
        line-height: 1.2;
        letter-spacing: -0.2px;
      }

      .subtitle {
        margin-top: 4px;
        color: color-mix(in srgb, currentColor 65%, transparent);
      }

      .surface {
        border-radius: 16px;
        margin-top: 12px;
      }

      /* ✅ Tighten overall surface padding */
      .surfaceInner {
        padding: 8px;
      }

      /* ✅ Sticky filters */
      .sticky {
        position: sticky;
        top: 12px;
        z-index: 10;
      }

      /* Only applied when scrolled */
      .stickyShadow {
        box-shadow: 0 10px 28px rgba(0, 0, 0, 0.08);
      }

      /* ✅ Make rows clean + aligned */
      .toolbar,
      .createRow {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        align-items: center;
      }

      /* ✅ Buttons match filled field height and sit cleanly */
      .rowBtn {
        height: 56px;
        display: inline-flex;
        align-items: center;
        margin: 0;
      }

      .cards {
        display: grid;
        gap: 12px;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        margin-top: 14px;
      }

      .caseCard {
        border-radius: 16px;
      }

      .caseTitle {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .meta {
        display: flex;
        flex-wrap: wrap;
        gap: 8px 12px;
        align-items: center;
        margin-top: 6px;
        color: color-mix(in srgb, currentColor 65%, transparent);
        font-size: 12px;
      }

      .badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 2px 10px;
        border-radius: 999px;
        font-size: 12px;
        line-height: 20px;
        background: color-mix(in srgb, currentColor 10%, transparent);
      }

      .badgeDot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        display: inline-block;
      }

      .cardActions {
        display: flex;
        justify-content: flex-end;
        gap: 4px;
        margin-left: auto;
        margin-top: 2px;
      }

      .editRow {
        display: flex;
        gap: 12px;
        align-items: center;
        flex-wrap: wrap;
        margin-top: 12px;
      }

      .muted {
        color: color-mix(in srgb, currentColor 65%, transparent);
      }

      .danger {
        color: #b00020;
      }

      .loadingBar {
        margin-top: 8px;
      }

      .empty {
        display: flex;
        gap: 12px;
        align-items: center;
        padding: 8px;
      }

      .emptyIcon {
        width: 44px;
        height: 44px;
        font-size: 44px;
        color: color-mix(in srgb, currentColor 45%, transparent);
      }

      .emptyTitle {
        font-weight: 600;
      }

      /* Error card */
      .errorRow {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 6px 8px 10px;
      }

      /* ✅ Remove subscript space for fields where we do NOT need errors/hints */
      :host ::ng-deep .noSub .mat-mdc-form-field-subscript-wrapper {
        display: none !important;
      }

      /* ✅ Remove subscript space ONLY when there is no error (keeps alignment clean) */
      :host ::ng-deep .noSubWhenNoError .mat-mdc-form-field-subscript-wrapper {
        display: none !important;
      }

      /* Optional: tighten vertical rhythm inside cards */
      :host ::ng-deep .mat-mdc-form-field {
        margin: 0;
      }
    `,
  ],
  template: `
    <div class="page">
      <div class="header">
        <div>
          <h1 class="title">Cases</h1>
          <div class="subtitle" *ngIf="pageData() as p">
            Page {{ p.number + 1 }} / {{ p.totalPages || 1 }} • {{ p.totalElements }} total
          </div>
        </div>
      </div>

      <mat-progress-bar
        *ngIf="loading()"
        class="loadingBar"
        mode="indeterminate"
      ></mat-progress-bar>

      <!-- ✅ Filters surface -->
      <mat-card class="surface sticky" [class.stickyShadow]="filtersStuck()" appearance="raised">
        <div class="surfaceInner">
          <div class="toolbar">
            <mat-form-field class="noSub" appearance="fill" style="min-width: 260px;">
              <mat-label>Search</mat-label>
              <input
                matInput
                placeholder="Search by title..."
                [ngModel]="search()"
                (ngModelChange)="onSearchChange($event)"
              />
            </mat-form-field>

            <mat-form-field class="noSub" appearance="fill" style="min-width: 180px;">
              <mat-label>Status</mat-label>
              <mat-select [ngModel]="statusFilter()" (ngModelChange)="onStatusChange($event)">
                <mat-option value="">All statuses</mat-option>
                <mat-option value="Open">Open</mat-option>
                <mat-option value="In Review">In Review</mat-option>
                <mat-option value="Closed">Closed</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field class="noSub" appearance="fill" style="min-width: 180px;">
              <mat-label>Sort</mat-label>
              <mat-select [ngModel]="sort()" (ngModelChange)="onSortChange($event)">
                <mat-option value="createdAt,desc">Newest</mat-option>
                <mat-option value="createdAt,asc">Oldest</mat-option>
                <mat-option value="title,asc">Title A–Z</mat-option>
                <mat-option value="title,desc">Title Z–A</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field class="noSub" appearance="fill" style="width: 120px;">
              <mat-label>Size</mat-label>
              <mat-select [ngModel]="size()" (ngModelChange)="onSizeChange($event)">
                <mat-option [value]="5">5</mat-option>
                <mat-option [value]="10">10</mat-option>
                <mat-option [value]="20">20</mat-option>
              </mat-select>
            </mat-form-field>

            <button
              class="rowBtn"
              mat-stroked-button
              (click)="prevPage()"
              [disabled]="loading() || pageData()?.first"
            >
              Prev
            </button>
            <button
              class="rowBtn"
              mat-stroked-button
              (click)="nextPage()"
              [disabled]="loading() || pageData()?.last"
            >
              Next
            </button>

            <button
              *ngIf="hasActiveFilters()"
              class="rowBtn"
              mat-button
              (click)="clearFilters()"
              [disabled]="loading()"
            >
              <mat-icon>close</mat-icon>
              Clear
            </button>
          </div>
        </div>
      </mat-card>

      <!-- ✅ Create surface -->
      <mat-card class="surface" appearance="raised">
        <div class="surfaceInner">
          <div class="createRow">
            <!-- ✅ Hide subscript ONLY when no error so title + status align -->
            <mat-form-field
              [class.noSubWhenNoError]="!fieldErrors()['title']"
              appearance="fill"
              style="min-width: 320px; flex: 1 1 320px;"
            >
              <mat-label>Case title</mat-label>
              <input
                matInput
                placeholder="Enter a title..."
                [ngModel]="newTitle()"
                (ngModelChange)="onTitleChange($event)"
              />
              <mat-error *ngIf="fieldErrors()['title']">
                {{ fieldErrors()['title'] }}
              </mat-error>
            </mat-form-field>

            <mat-form-field class="noSub" appearance="fill" style="min-width: 180px;">
              <mat-label>Status</mat-label>
              <mat-select [ngModel]="newStatus()" (ngModelChange)="newStatus.set($event)">
                <mat-option value="Open">Open</mat-option>
                <mat-option value="In Review">In Review</mat-option>
                <mat-option value="Closed">Closed</mat-option>
              </mat-select>
            </mat-form-field>

            <button
              class="rowBtn"
              mat-raised-button
              color="primary"
              (click)="createCase()"
              [disabled]="creating() || !newTitle().trim()"
            >
              <mat-icon>add</mat-icon>
              {{ creating() ? 'Adding...' : 'Add case' }}
            </button>
          </div>
        </div>
      </mat-card>

      <!-- ✅ Inline error surface with retry -->
      <mat-card *ngIf="error() as e" class="surface" appearance="raised">
        <div class="errorRow">
          <div class="danger">
            <strong>Something went wrong.</strong>
            <div class="muted" style="margin-top: 2px;">{{ e }}</div>
          </div>

          <button class="rowBtn" mat-stroked-button (click)="loadCases()" [disabled]="loading()">
            <mat-icon>refresh</mat-icon>
            Retry
          </button>
        </div>
      </mat-card>

      <!-- ✅ Card List -->
      <div *ngIf="!loading() && !error()" class="cards">
        <mat-card class="caseCard" appearance="raised" *ngFor="let c of cases()">
          <mat-card-header>
            <mat-card-title class="caseTitle">#{{ c.id }} — {{ c.title }}</mat-card-title>

            <mat-card-subtitle class="meta">
              <span class="badge" [attr.aria-label]="'Status: ' + c.status">
                <span class="badgeDot" [style.background]="statusColor(c.status)"></span>
                {{ c.status }}
              </span>
              <span>Created: {{ c.createdAt | date : 'medium' }}</span>
            </mat-card-subtitle>

            <div class="cardActions">
              <button
                mat-icon-button
                matTooltip="Edit"
                (click)="startEdit(c)"
                [disabled]="editingId() === c.id || savingEdit() || creating()"
                aria-label="Edit case"
              >
                <mat-icon>edit</mat-icon>
              </button>

              <button
                mat-icon-button
                color="warn"
                matTooltip="Delete"
                (click)="deleteCase(c.id)"
                [disabled]="deletingIds().has(c.id) || savingEdit() || creating()"
                aria-label="Delete case"
              >
                <mat-icon>delete</mat-icon>
              </button>
            </div>
          </mat-card-header>

          <mat-card-content>
            <div *ngIf="editingId() === c.id" class="editRow">
              <mat-form-field appearance="fill" style="min-width: 280px; flex: 1 1 280px;">
                <mat-label>Title</mat-label>
                <input matInput [ngModel]="editTitle()" (ngModelChange)="editTitle.set($event)" />
              </mat-form-field>

              <mat-form-field class="noSub" appearance="fill" style="min-width: 180px;">
                <mat-label>Status</mat-label>
                <mat-select [ngModel]="editStatus()" (ngModelChange)="editStatus.set($event)">
                  <mat-option value="Open">Open</mat-option>
                  <mat-option value="In Review">In Review</mat-option>
                  <mat-option value="Closed">Closed</mat-option>
                </mat-select>
              </mat-form-field>

              <button
                mat-raised-button
                color="primary"
                (click)="saveEdit()"
                [disabled]="savingEdit() || !editTitle().trim()"
              >
                {{ savingEdit() ? 'Saving...' : 'Save' }}
              </button>

              <button mat-button (click)="cancelEdit()" [disabled]="savingEdit()">Cancel</button>

              <span *ngIf="editError()" class="danger">
                {{ editError() }}
              </span>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- ✅ Empty state -->
        <mat-card
          *ngIf="cases().length === 0"
          appearance="raised"
          class="surface"
          style="grid-column: 1 / -1;"
        >
          <div class="empty">
            <mat-icon class="emptyIcon">inbox</mat-icon>
            <div>
              <div class="emptyTitle">No cases found</div>
              <div class="muted">Try clearing filters or create a new case.</div>
            </div>
          </div>
        </mat-card>
      </div>
    </div>
  `,
})
export class CasesPage {
  private readonly api = inject(ApiHttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
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
  private searchDebounce?: number;

  private syncingFromUrl = false;

  // Sticky shadow only when page is scrolled
  readonly filtersStuck = signal(false);

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
    window.addEventListener(
      'scroll',
      () => {
        this.filtersStuck.set(window.scrollY > 8);
      },
      { passive: true }
    );

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

      this.cancelEdit();

      this.syncingFromUrl = false;

      this.loadCases();
    });
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

  clearFilters() {
    this.page.set(DEFAULT_PAGE);
    this.size.set(DEFAULT_SIZE);
    this.sort.set(DEFAULT_SORT);
    this.search.set('');
    this.statusFilter.set(DEFAULT_STATUS);
    this.cancelEdit();
    this.pushStateToUrl();
  }

  statusColor(status: string): string {
    switch ((status ?? '').toLowerCase()) {
      case 'open':
        return '#2e7d32';
      case 'in review':
        return '#ed6c02';
      case 'closed':
        return '#6d6d6d';
      default:
        return '#6d6d6d';
    }
  }

  private toast(message: string, action = 'OK', duration = 2500) {
    this.snack.open(message, action, { duration });
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

  loadCases() {
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
        this.toast('Case created');
        this.loadCases();
      },
      error: (err) => {
        this.creating.set(false);

        const apiErrors = err?.error?.errors;
        if (apiErrors && typeof apiErrors === 'object') {
          this.fieldErrors.set(apiErrors);
          this.error.set(err?.error?.message ?? 'Validation failed');
          this.toast(err?.error?.message ?? 'Validation failed');
          return;
        }

        this.error.set(`Create failed: ${err?.message ?? 'unknown'}`);
        this.toast('Create failed');
      },
    });
  }

  deleteCase(id: number) {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '360px',
        data: {
          title: 'Delete case',
          message: `Delete case #${id}? This can't be undone.`,
          confirmText: 'Delete',
          cancelText: 'Cancel',
        },
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (!confirmed) return;

        const next = new Set(this.deletingIds());
        next.add(id);
        this.deletingIds.set(next);

        this.api.delete<void>(`/cases/${id}`).subscribe({
          next: () => {
            const after = new Set(this.deletingIds());
            after.delete(id);
            this.deletingIds.set(after);
            this.toast('Case deleted');
            this.loadCases();
          },
          error: (err) => {
            const after = new Set(this.deletingIds());
            after.delete(id);
            this.deletingIds.set(after);
            this.error.set(`Delete failed: ${err?.message ?? 'unknown'}`);
            this.toast('Delete failed');
          },
        });
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
        this.toast('Case updated');
        this.cancelEdit();
        this.loadCases();
      },
      error: (err) => {
        this.savingEdit.set(false);
        const msg = err?.error?.message ?? err?.message ?? 'Update failed';
        this.editError.set(msg);
        this.toast('Update failed');
      },
    });
  }
}
