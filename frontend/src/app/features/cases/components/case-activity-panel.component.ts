import { Component, Input, inject } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { ActivityItemDto, CaseActivityStore } from '../data/case-activity.store';
import { CaseSummaryStore } from '../data/case-summary.store';

import {
  RejectSummaryDialogComponent,
  RejectSummaryDialogResult,
} from '../../cases/components/reject-summary-dialog.component'; // ✅ adjust path if needed

import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog.component'; // ✅ adjust path if needed

@Component({
  selector: 'app-case-activity-panel',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    FormsModule,

    MatButtonModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatTooltipModule,

    MatCardModule,
    MatCheckboxModule,

    // ✅ needed for MatDialog.open in standalone
    MatDialogModule,
  ],
  styles: [
    `
      .drawerPanel {
        width: min(560px, 96vw);
        padding: 16px;
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

      .rowBtn {
        height: 56px;
        display: inline-flex;
        align-items: center;
        margin: 0;
      }

      .muted {
        color: color-mix(in srgb, currentColor 65%, transparent);
      }

      /* ---- Summary UI ---- */
      .summarySection {
        margin-top: 10px;
        display: grid;
        gap: 10px;
      }

      .summaryCard {
        padding: 12px;
        border-radius: 14px;
      }

      .summaryTitleRow {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
      }

      .summaryText {
        white-space: pre-wrap;
        word-break: break-word;
        line-height: 1.35;
      }

      .summaryActions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        margin-top: 12px;
      }

      .warnBox {
        padding: 10px;
        border-radius: 12px;
        background: color-mix(in srgb, #f59e0b 12%, transparent);
        margin-top: 10px;
      }

      /* ---- Activity UI ---- */
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
        align-items: center;
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

      .preview {
        margin-top: 4px;
        font-size: 13px;
        line-height: 1.35;
        color: color-mix(in srgb, currentColor 85%, transparent);
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .fullBody {
        margin-top: 6px;
        white-space: pre-wrap;
        word-break: break-word;
      }

      /* ✅ NEW: show parsed JSON details for events */
      .eventDetails {
        margin-top: 4px;
        font-size: 12px;
        color: color-mix(in srgb, currentColor 60%, transparent);
      }

      /* ✅ FIX: put actions on their own row so they never clip */
      .noteHeaderActions {
        display: flex;
        justify-content: flex-end;
        gap: 4px;
        margin-top: 4px;
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

      .editArea {
        margin-top: 8px;
      }

      .editActions {
        display: inline-flex;
        gap: 8px;
        align-items: center;
        margin-top: 6px;
      }
    `,
  ],
  template: `
    <div class="drawerPanel" *ngIf="caseId != null; else noSelection">
      <div class="drawerHeader">
        <div class="drawerTitle">
          <mat-icon>history</mat-icon>
          <div style="min-width:0;">
            <div class="drawerTitleMain">Activity — Case #{{ caseId }}</div>
            <div class="drawerSub" *ngIf="caseTitle">{{ caseTitle }}</div>
          </div>
        </div>

        <div class="drawerActions">
          <button
            mat-stroked-button
            (click)="store.refresh(caseId)"
            [disabled]="store.isLoading(caseId)"
          >
            <mat-icon>refresh</mat-icon>
            Refresh
          </button>

          <button mat-icon-button (click)="store.close()" aria-label="Close activity">
            <mat-icon>close</mat-icon>
          </button>
        </div>
      </div>

      <mat-progress-bar *ngIf="store.isLoading(caseId)" mode="indeterminate"></mat-progress-bar>

      <!-- Summary (review-first) -->
      <div class="summarySection">
        <!-- Official summary -->
        <mat-card class="summaryCard">
          <div class="summaryTitleRow">
            <div style="display:flex; align-items:center; gap:8px;">
              <mat-icon>summarize</mat-icon>
              <div style="font-weight:700;">Summary</div>
            </div>

            <button
              mat-stroked-button
              (click)="summary.createDraft(caseId!)"
              [disabled]="summary.isCreating(caseId!)"
            >
              <mat-icon>auto_awesome</mat-icon>
              {{ summary.isCreating(caseId!) ? 'Generating…' : 'Generate draft' }}
            </button>
          </div>

          <div class="drawerSub" style="margin-top:6px;">
            Last updated:
            {{ summary.officialSummaryOverride(caseId!)?.updatedAt ?? caseUpdatedAt ?? '—' }}
          </div>

          <div
            class="muted"
            style="margin-top:10px;"
            *ngIf="!(summary.officialSummaryOverride(caseId!)?.summaryText ?? caseSummaryText)"
          >
            No approved summary yet.
          </div>

          <div
            class="summaryText"
            style="margin-top:10px;"
            *ngIf="summary.officialSummaryOverride(caseId!)?.summaryText ?? caseSummaryText as txt"
          >
            {{ txt }}
          </div>
        </mat-card>

        <!-- Draft review -->
        <mat-card class="summaryCard" *ngIf="summary.draft(caseId!) as d">
          <div class="summaryTitleRow">
            <div style="display:flex; align-items:center; gap:8px;">
              <mat-icon>rate_review</mat-icon>
              <div style="font-weight:700;">Draft review</div>
            </div>

            <button
              mat-button
              (click)="summary.loadDraft(caseId!, d.draftId)"
              [disabled]="summary.isLoading(caseId!)"
            >
              <mat-icon>refresh</mat-icon>
              Refresh draft
            </button>
          </div>

          <mat-progress-bar
            *ngIf="summary.isLoading(caseId!)"
            mode="indeterminate"
          ></mat-progress-bar>

          <div class="warnBox" *ngIf="d.stale">
            <div style="font-weight:700; display:flex; align-items:center; gap:8px;">
              <mat-icon>warning</mat-icon>
              This draft may be stale
            </div>
            <div class="drawerSub" style="margin-top:4px;">
              The case changed after the draft was generated. Regenerate, or acknowledge and accept.
            </div>

            <mat-checkbox
              style="margin-top:8px;"
              [ngModel]="summary.ackStale(caseId!)"
              (ngModelChange)="summary.setAckStale(caseId!, $event)"
            >
              I understand and want to accept anyway
            </mat-checkbox>
          </div>

          <div class="summaryText" style="margin-top:10px;">
            {{ d.contentText }}
          </div>

          <div class="summaryActions">
            <button
              mat-raised-button
              color="primary"
              (click)="summary.acceptDraft(caseId!, d.draftId)"
              [disabled]="
                summary.isAccepting(caseId!, d.draftId) || (d.stale && !summary.ackStale(caseId!))
              "
            >
              <mat-icon>check</mat-icon>
              {{ summary.isAccepting(caseId!, d.draftId) ? 'Accepting…' : 'Accept' }}
            </button>

            <button
              mat-stroked-button
              (click)="summary.createDraft(caseId!)"
              [disabled]="summary.isCreating(caseId!)"
            >
              <mat-icon>autorenew</mat-icon>
              Regenerate
            </button>

            <button
              mat-button
              color="warn"
              (click)="confirmReject(caseId!, d.draftId)"
              [disabled]="summary.isRejecting(caseId!, d.draftId)"
            >
              <mat-icon>close</mat-icon>
              {{ summary.isRejecting(caseId!, d.draftId) ? 'Rejecting…' : 'Reject' }}
            </button>
          </div>
        </mat-card>
      </div>

      <!-- Add note -->
      <div class="noteRow">
        <mat-form-field appearance="fill" style="flex: 1 1 320px; min-width: 280px;">
          <mat-label>Add a note</mat-label>
          <textarea
            matInput
            rows="2"
            placeholder="What happened? Why? What’s next?"
            [ngModel]="store.noteDraft(caseId)"
            (ngModelChange)="store.setNoteDraft(caseId, $event)"
          ></textarea>
        </mat-form-field>

        <div class="noteActions">
          <button
            class="rowBtn"
            mat-raised-button
            color="primary"
            (click)="store.addNote(caseId)"
            [disabled]="store.addingNoteIds().has(caseId) || !store.noteDraft(caseId).trim()"
          >
            <mat-icon>send</mat-icon>
            {{ store.addingNoteIds().has(caseId) ? 'Adding...' : 'Add note' }}
          </button>

          <button
            class="rowBtn"
            mat-button
            (click)="store.setNoteDraft(caseId, '')"
            [disabled]="store.addingNoteIds().has(caseId) || !store.noteDraft(caseId)"
          >
            Clear
          </button>
        </div>
      </div>

      <mat-divider style="margin-top: 12px;"></mat-divider>

      <!-- Activity list -->
      <div class="activityList" *ngIf="items.length > 0; else noActivity">
        <div class="activityItem" *ngFor="let a of items">
          <mat-icon class="activityIcon">{{ store.activityIcon(a) }}</mat-icon>

          <div>
            <!-- meta row -->
            <div class="activityTop">
              <span class="activityTypePill">{{ store.activityTypeLabel(a) }}</span>
              <span class="activityTime" *ngIf="store.activityTime(a) as t">{{ t }}</span>
              <span class="activityTime" *ngIf="store.activityActor(a) as who">• {{ who }}</span>
            </div>

            <!-- ✅ NEW: event details line (parsed from payloadJson) -->
            <div class="eventDetails" *ngIf="eventDetails(a) as details">
              {{ details }}
            </div>

            <!-- ✅ actions row (no clipping) -->
            <div class="noteHeaderActions" *ngIf="store.isNote(a) && a.id != null">
              <button
                mat-icon-button
                matTooltip="Expand"
                (click)="store.toggleNoteExpanded(caseId!, a.id!)"
                [disabled]="
                  store.isNoteSaving(caseId!, a.id!) || store.isNoteDeleting(caseId!, a.id!)
                "
                aria-label="Toggle note"
              >
                <mat-icon>{{
                  store.isNoteExpanded(caseId!, a.id!) ? 'expand_less' : 'expand_more'
                }}</mat-icon>
              </button>

              <button
                mat-icon-button
                matTooltip="Edit"
                (click)="store.startEditNote(caseId!, a)"
                [disabled]="
                  store.isNoteSaving(caseId!, a.id!) || store.isNoteDeleting(caseId!, a.id!)
                "
                aria-label="Edit note"
              >
                <mat-icon>edit</mat-icon>
              </button>

              <button
                mat-icon-button
                color="warn"
                matTooltip="Delete"
                (click)="confirmDelete(caseId!, a.id!)"
                [disabled]="
                  store.isNoteSaving(caseId!, a.id!) || store.isNoteDeleting(caseId!, a.id!)
                "
                aria-label="Delete note"
              >
                <mat-icon>{{
                  store.isNoteDeleting(caseId!, a.id!) ? 'hourglass_top' : 'delete'
                }}</mat-icon>
              </button>
            </div>

            <!-- NOTE preview -->
            <div class="preview" *ngIf="store.isNote(a) && !store.isNoteExpanded(caseId!, a.id!)">
              {{ store.activityBody(a) }}
            </div>

            <!-- Expanded -->
            <div *ngIf="store.isNote(a) && store.isNoteExpanded(caseId!, a.id!)">
              <!-- Edit mode -->
              <div class="editArea" *ngIf="store.isNoteEditing(caseId!, a.id!); else readOnly">
                <mat-form-field appearance="fill" style="width: 100%;">
                  <mat-label>Edit note</mat-label>
                  <textarea
                    matInput
                    rows="4"
                    [ngModel]="store.noteEditDraft(caseId!, a.id!)"
                    (ngModelChange)="store.setNoteEditDraft(caseId!, a.id!, $event)"
                  ></textarea>
                </mat-form-field>

                <div class="editActions">
                  <button
                    class="rowBtn"
                    mat-raised-button
                    color="primary"
                    (click)="store.saveNote(caseId!, a.id!)"
                    [disabled]="
                      store.isNoteSaving(caseId!, a.id!) ||
                      store.isNoteDeleting(caseId!, a.id!) ||
                      !store.noteEditDraft(caseId!, a.id!).trim()
                    "
                  >
                    <mat-icon>save</mat-icon>
                    {{ store.isNoteSaving(caseId!, a.id!) ? 'Saving...' : 'Save' }}
                  </button>

                  <button
                    class="rowBtn"
                    mat-button
                    (click)="store.cancelEditNote(caseId!, a.id!)"
                    [disabled]="
                      store.isNoteSaving(caseId!, a.id!) || store.isNoteDeleting(caseId!, a.id!)
                    "
                  >
                    Cancel
                  </button>
                </div>
              </div>

              <!-- Read-only mode -->
              <ng-template #readOnly>
                <div class="fullBody">{{ store.activityBody(a) }}</div>
              </ng-template>
            </div>

            <!-- Non-note activity -->
            <div class="fullBody" *ngIf="!store.isNote(a)">
              {{ store.activityBody(a) }}
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
  `,
})
export class CaseActivityPanelComponent {
  private readonly dialog = inject(MatDialog);

  @Input() caseId: number | null = null;
  @Input() caseTitle: string | null = null;
  @Input() items: ActivityItemDto[] = [];
  @Input() caseSummaryText: string | null = null;
  @Input() caseUpdatedAt: string | null = null;

  constructor(
    public readonly store: CaseActivityStore,
    public readonly summary: CaseSummaryStore
  ) {}

  // =========================
  // ✅ NEW: Parse event payloadJson and render friendly details
  // =========================

  private parsePayload(payloadJson: string | null): any | null {
    if (!payloadJson) return null;
    try {
      return JSON.parse(payloadJson);
    } catch {
      return null;
    }
  }

  eventDetails(item: ActivityItemDto): string | null {
    if (item.kind !== 'event') return null;

    const p = this.parsePayload(item.payloadJson ?? null);
    if (!p) return null;

    const draftId = p.draftId ?? null;

    switch (item.type) {
      case 'SUMMARY_REJECTED':
        return `Draft #${draftId ?? '?'} • Reason: ${p.reasonCode ?? 'UNKNOWN'}`;

      case 'SUMMARY_ACCEPTED':
        return `Draft #${draftId ?? '?'} • Acknowledge stale: ${p.acknowledgeStale ?? false}`;

      case 'SUMMARY_DRAFT_CREATED':
        return `Draft #${draftId ?? '?'} • Purpose: ${p.purpose ?? 'UNKNOWN'}`;

      case 'SUMMARY_DRAFT_SUPERSEDED':
        return `Draft #${draftId ?? '?'}`;

      case 'SUMMARY_DRAFT_EXPIRED':
        return `Draft #${draftId ?? '?'}`;

      default:
        // Show draftId if present for other summary-related events
        return draftId ? `Draft #${draftId}` : null;
    }
  }

  confirmDelete(caseId: number, noteId: number) {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '360px',
        data: {
          title: 'Delete note',
          message: `Delete this note? This can't be undone.`,
          confirmText: 'Delete',
          cancelText: 'Cancel',
        },
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.store.deleteNote(caseId, noteId);
      });
  }

  confirmReject(caseId: number, draftId: number) {
    this.dialog
      .open(RejectSummaryDialogComponent, {
        width: '520px',
        data: { defaultReasonCode: 'INACCURATE' },
      })
      .afterClosed()
      .subscribe((res: RejectSummaryDialogResult | null) => {
        if (!res) return;
        this.summary.rejectDraft(caseId, draftId, res.reasonCode, res.comment);
      });
  }
}
