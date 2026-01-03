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
import { MatSidenavModule } from '@angular/material/sidenav';

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

/**
 * Activity feed item (backend returns ActivityItemDto[])
 * Flexible so DTO changes won’t break the UI.
 */
type ActivityItemDto = {
  id?: number | string;
  type?: string; // e.g. "NOTE", "EVENT"
  createdAt?: string;
  title?: string;
  body?: string;
  message?: string;
  detail?: string;
  actor?: string;
  [k: string]: any;
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
    MatSidenavModule,
  ],
  styles: [
    `
      .drawerContainer {
        height: 100%;
      }

      .page {
        max-width: 1100px;
        margin: 0 auto;
        padding: 20px 16px 24px;
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

      .surfaceInner {
        padding: 8px;
      }

      .sticky {
        position: sticky;
        top: 12px;
        z-index: 10;
      }

      .stickyShadow {
        box-shadow: 0 10px 28px rgba(0, 0, 0, 0.08);
      }

      .toolbar,
      .createRow {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        align-items: center;
      }

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

      .cardHeaderRow {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
        width: 100%;
      }

      .cardHeaderLeft {
        min-width: 0;
        flex: 1 1 auto;
      }

      .caseTitle {
        margin: 0;
        font-weight: 600;
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
        display: inline-flex;
        align-items: center;
        gap: 4px;
        flex: 0 0 auto;
        margin-top: -4px;
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

      .errorRow {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 6px 8px 10px;
      }

      :host ::ng-deep .noSub .mat-mdc-form-field-subscript-wrapper {
        display: none !important;
      }

      :host ::ng-deep .noSubWhenNoError .mat-mdc-form-field-subscript-wrapper {
        display: none !important;
      }

      :host ::ng-deep .mat-mdc-form-field {
        margin: 0;
      }

      /* ---- Drawer (Activity) ---- */
      .drawerPanel {
        width: min(420px, 92vw);
        padding: 12px;
      }

      .drawerHeader {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 8px;
      }

      .drawerTitle {
        display: flex;
        align-items: center;
        gap: 10px;
        min-width: 0;
      }

      .drawerTitleMain {
        font-weight: 700;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .drawerSub {
        margin-top: 2px;
        font-size: 12px;
        color: color-mix(in srgb, currentColor 60%, transparent);
      }

      .drawerActions {
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }

      .activityList {
        display: grid;
        gap: 10px;
        margin-top: 12px;
      }

      .activityItem {
        display: grid;
        grid-template-columns: 24px 1fr;
        gap: 10px;
        align-items: flex-start;
      }

      .activityIcon {
        width: 24px;
        height: 24px;
        font-size: 20px;
        margin-top: 1px;
        color: color-mix(in srgb, currentColor 60%, transparent);
      }

      .activityTop {
        display: flex;
        flex-wrap: wrap;
        gap: 8px 10px;
        align-items: baseline;
      }

      .activityTypePill {
        display: inline-flex;
        align-items: center;
        padding: 1px 8px;
        border-radius: 999px;
        font-size: 11px;
        line-height: 18px;
        background: color-mix(in srgb, currentColor 10%, transparent);
        color: color-mix(in srgb, currentColor 75%, transparent);
      }

      .activityTime {
        font-size: 12px;
        color: color-mix(in srgb, currentColor 60%, transparent);
      }

      .activityBody {
        margin-top: 4px;
        white-space: pre-wrap;
        word-break: break-word;
      }

      .noteRow {
        display: flex;
        gap: 10px;
        align-items: flex-start;
        flex-wrap: wrap;
        margin-top: 10px;
      }

      .noteActions {
        display: inline-flex;
        gap: 8px;
        align-items: center;
        margin-top: 2px;
      }
    `,
  ],
  template: `
    <mat-drawer-container class="drawerContainer" autosize>
      <!-- Right-side Activity Drawer -->
      <mat-drawer
        position="end"
        mode="over"
        [opened]="drawerOpen()"
        (closedStart)="onDrawerClosed()"
      >
        <div class="drawerPanel" *ngIf="selectedCaseId() as caseId; else noSelection">
          <div class="drawerHeader">
            <div class="drawerTitle">
              <mat-icon>history</mat-icon>
              <div style="min-width:0;">
                <div class="drawerTitleMain">Activity — Case #{{ caseId }}</div>
                <div class="drawerSub" *ngIf="selectedCaseTitle() as t">{{ t }}</div>
              </div>
            </div>

            <div class="drawerActions">
              <button
                mat-stroked-button
                (click)="refreshActivity(caseId)"
                [disabled]="activityLoadingIds().has(caseId)"
              >
                <mat-icon>refresh</mat-icon>
                Refresh
              </button>

              <button mat-icon-button (click)="closeDrawer()" aria-label="Close activity">
                <mat-icon>close</mat-icon>
              </button>
            </div>
          </div>

          <mat-progress-bar
            *ngIf="activityLoadingIds().has(caseId)"
            mode="indeterminate"
          ></mat-progress-bar>

          <!-- Add note -->
          <div class="noteRow">
            <mat-form-field appearance="fill" style="flex: 1 1 320px; min-width: 280px;">
              <mat-label>Add a note</mat-label>
              <textarea
                matInput
                rows="2"
                placeholder="What happened? Why? What’s next?"
                [ngModel]="noteDraft(caseId)"
                (ngModelChange)="setNoteDraft(caseId, $event)"
              ></textarea>
            </mat-form-field>

            <div class="noteActions">
              <button
                class="rowBtn"
                mat-raised-button
                color="primary"
                (click)="addNote(caseId)"
                [disabled]="addingNoteIds().has(caseId) || !noteDraft(caseId).trim()"
              >
                <mat-icon>send</mat-icon>
                {{ addingNoteIds().has(caseId) ? 'Adding...' : 'Add note' }}
              </button>

              <button
                class="rowBtn"
                mat-button
                (click)="setNoteDraft(caseId, '')"
                [disabled]="addingNoteIds().has(caseId) || !noteDraft(caseId)"
              >
                Clear
              </button>
            </div>
          </div>

          <mat-divider style="margin-top: 12px;"></mat-divider>

          <!-- Activity list -->
          <div class="activityList" *ngIf="activityItems(caseId).length > 0; else noActivity">
            <div class="activityItem" *ngFor="let a of activityItems(caseId)">
              <mat-icon class="activityIcon">{{ activityIcon(a) }}</mat-icon>

              <div>
                <div class="activityTop">
                  <span class="activityTypePill">{{ activityTypeLabel(a) }}</span>
                  <span class="activityTime" *ngIf="activityTime(a) as t">{{ t }}</span>
                  <span class="activityTime" *ngIf="activityActor(a) as who">• {{ who }}</span>
                </div>

                <div class="activityBody">
                  {{ activityBody(a) }}
                </div>
              </div>
            </div>
          </div>

          <ng-template #noActivity>
            <div class="muted" style="margin-top: 12px;">
              No activity yet. Add a note to start the timeline.
            </div>
          </ng-template>
        </div>

        <ng-template #noSelection>
          <div class="drawerPanel">
            <div class="muted">Select a case to view activity.</div>
          </div>
        </ng-template>
      </mat-drawer>

      <!-- Main Page Content -->
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

        <!-- Filters -->
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

        <!-- Create -->
        <mat-card class="surface" appearance="raised">
          <div class="surfaceInner">
            <div class="createRow">
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

        <!-- Error -->
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

        <!-- Cards -->
        <div *ngIf="!loading() && !error()" class="cards">
          <mat-card class="caseCard" appearance="raised" *ngFor="let c of cases()">
            <mat-card-content>
              <div class="cardHeaderRow">
                <div class="cardHeaderLeft">
                  <div class="caseTitle">#{{ c.id }} — {{ c.title }}</div>

                  <div class="meta">
                    <span class="badge" [attr.aria-label]="'Status: ' + c.status">
                      <span class="badgeDot" [style.background]="statusColor(c.status)"></span>
                      {{ c.status }}
                    </span>
                    <span>Created: {{ c.createdAt | date : 'medium' }}</span>
                  </div>
                </div>

                <div class="cardActions">
                  <!-- Drawer Activity -->
                  <button
                    mat-icon-button
                    matTooltip="Activity"
                    (click)="openActivityDrawer(c.id)"
                    [disabled]="savingEdit() || creating()"
                    aria-label="Open activity"
                  >
                    <mat-icon>history</mat-icon>
                  </button>

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
              </div>

              <!-- Inline edit panel -->
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

          <!-- Empty state -->
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
    </mat-drawer-container>
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

  // ---- Activity drawer state ----
  readonly drawerOpen = signal(false);
  readonly selectedCaseId = signal<number | null>(null);

  // ---- Activity state (per case) ----
  readonly activityByCase = signal<Record<number, ActivityItemDto[]>>({});
  readonly activityLoadingIds = signal<Set<number>>(new Set());
  readonly noteDraftByCase = signal<Record<number, string>>({});
  readonly addingNoteIds = signal<Set<number>>(new Set());

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

  // ---------- Drawer helpers ----------
  openActivityDrawer(caseId: number) {
    // clicking same case toggles close
    if (this.drawerOpen() && this.selectedCaseId() === caseId) {
      this.closeDrawer();
      return;
    }

    this.selectedCaseId.set(caseId);
    this.drawerOpen.set(true);

    // lazy load activity
    if (!this.activityByCase()[caseId]) {
      this.loadActivity(caseId);
    }
  }

  closeDrawer() {
    this.drawerOpen.set(false);
  }

  onDrawerClosed() {
    // keep selectedCaseId if you want quick re-open; or clear it:
    // this.selectedCaseId.set(null);
  }

  selectedCaseTitle(): string | null {
    const id = this.selectedCaseId();
    if (id == null) return null;
    const c = this.cases().find((x) => x.id === id);
    return c ? c.title : null;
  }

  // ---------- Activity helpers ----------
  refreshActivity(caseId: number) {
    this.loadActivity(caseId, true);
  }

  activityItems(caseId: number): ActivityItemDto[] {
    return this.activityByCase()[caseId] ?? [];
  }

  noteDraft(caseId: number): string {
    return this.noteDraftByCase()[caseId] ?? '';
  }

  setNoteDraft(caseId: number, value: string) {
    this.noteDraftByCase.set({ ...this.noteDraftByCase(), [caseId]: value ?? '' });
  }

  private loadActivity(caseId: number, force = false) {
    if (!force && this.activityByCase()[caseId]) return;

    const loading = new Set(this.activityLoadingIds());
    loading.add(caseId);
    this.activityLoadingIds.set(loading);

    this.api.get<ActivityItemDto[]>(`/cases/${caseId}/activity`).subscribe({
      next: (items) => {
        this.activityByCase.set({
          ...this.activityByCase(),
          [caseId]: Array.isArray(items) ? items : [],
        });

        const after = new Set(this.activityLoadingIds());
        after.delete(caseId);
        this.activityLoadingIds.set(after);
      },
      error: () => {
        const after = new Set(this.activityLoadingIds());
        after.delete(caseId);
        this.activityLoadingIds.set(after);
        this.toast('Failed to load activity');
      },
    });
  }

  addNote(caseId: number) {
    const body = this.noteDraft(caseId).trim();
    if (!body) return;

    const adding = new Set(this.addingNoteIds());
    adding.add(caseId);
    this.addingNoteIds.set(adding);

    this.api.post<void>(`/cases/${caseId}/notes`, { body }).subscribe({
      next: () => {
        const after = new Set(this.addingNoteIds());
        after.delete(caseId);
        this.addingNoteIds.set(after);

        this.setNoteDraft(caseId, '');
        this.toast('Note added');

        // refresh activity so new note appears
        this.loadActivity(caseId, true);
      },
      error: (err) => {
        const after = new Set(this.addingNoteIds());
        after.delete(caseId);
        this.addingNoteIds.set(after);

        const msg = err?.error?.message ?? err?.message ?? 'Failed to add note';
        this.toast(msg);
      },
    });
  }

  activityTypeLabel(a: ActivityItemDto): string {
    const t = String(a?.type ?? '').trim();
    return t ? t : 'ACTIVITY';
  }

  activityIcon(a: ActivityItemDto): string {
    const t = String(a?.type ?? '').toLowerCase();
    if (t.includes('note')) return 'sticky_note_2';
    if (t.includes('status')) return 'autorenew';
    if (t.includes('assign')) return 'person';
    if (t.includes('event')) return 'event';
    return 'bolt';
  }

  activityTime(a: ActivityItemDto): string | null {
    const raw = a?.createdAt ?? a?.['timestamp'] ?? null;
    if (!raw) return null;
    return raw;
  }

  activityActor(a: ActivityItemDto): string | null {
    const who = a?.actor ?? a?.['createdBy'] ?? a?.['user'] ?? null;
    return who ? String(who) : null;
  }

  activityBody(a: ActivityItemDto): string {
    return (
      String(a?.body ?? '').trim() ||
      String(a?.message ?? '').trim() ||
      String(a?.detail ?? '').trim() ||
      String(a?.title ?? '').trim() ||
      '(no details)'
    );
  }

  // ---------- Existing helpers ----------
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

            // if this case is open in drawer, close it
            if (this.selectedCaseId() === id) this.closeDrawer();

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
