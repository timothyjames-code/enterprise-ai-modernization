import { Component, Input } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ActivityItemDto, CaseActivityStore } from '../data/case-activity.store';

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
  ],
  styles: [
    `
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

      .rowBtn {
        height: 56px;
        display: inline-flex;
        align-items: center;
        margin: 0;
      }

      .muted {
        color: color-mix(in srgb, currentColor 65%, transparent);
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

      .noteHeaderActions {
        margin-left: auto;
        display: inline-flex;
        align-items: center;
        gap: 4px;
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
            <div class="activityTop">
              <span class="activityTypePill">{{ store.activityTypeLabel(a) }}</span>
              <span class="activityTime" *ngIf="store.activityTime(a) as t">{{ t }}</span>
              <span class="activityTime" *ngIf="store.activityActor(a) as who">• {{ who }}</span>

              <!-- NOTE actions -->
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
            </div>

            <!-- Preview -->
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
  @Input() caseId: number | null = null;
  @Input() caseTitle: string | null = null;
  @Input() items: ActivityItemDto[] = [];

  constructor(public readonly store: CaseActivityStore) {}

  confirmDelete(caseId: number, noteId: number) {
    const ok = window.confirm('Delete this note? This cannot be undone.');
    if (!ok) return;
    this.store.deleteNote(caseId, noteId);
  }
}
