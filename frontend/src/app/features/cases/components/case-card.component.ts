import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgIf, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';

export type CaseDto = {
  id: number;
  title: string;
  status: string;
  createdAt: string;
};

@Component({
  selector: 'app-case-card',
  standalone: true,
  imports: [
    NgIf,
    DatePipe,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
  ],
  styles: [
    `
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

      .danger {
        color: #b00020;
      }

      :host ::ng-deep .noSub .mat-mdc-form-field-subscript-wrapper {
        display: none !important;
      }
    `,
  ],
  template: `
    <mat-card class="caseCard" appearance="raised">
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
            <button
              mat-icon-button
              matTooltip="Activity"
              (click)="activity.emit(c)"
              [disabled]="savingEdit || creating"
              aria-label="Open activity"
            >
              <mat-icon>history</mat-icon>
            </button>

            <button
              mat-icon-button
              matTooltip="Edit"
              (click)="startEdit.emit(c)"
              [disabled]="isEditing || savingEdit || creating"
              aria-label="Edit case"
            >
              <mat-icon>edit</mat-icon>
            </button>

            <button
              mat-icon-button
              color="warn"
              matTooltip="Delete"
              (click)="delete.emit(c)"
              [disabled]="deleting || savingEdit || creating"
              aria-label="Delete case"
            >
              <mat-icon>delete</mat-icon>
            </button>
          </div>
        </div>

        <!-- Inline edit -->
        <div *ngIf="isEditing" class="editRow">
          <mat-form-field appearance="fill" style="min-width: 280px; flex: 1 1 280px;">
            <mat-label>Title</mat-label>
            <input matInput [ngModel]="editTitle" (ngModelChange)="editTitleChange.emit($event)" />
          </mat-form-field>

          <mat-form-field class="noSub" appearance="fill" style="min-width: 180px;">
            <mat-label>Status</mat-label>
            <mat-select [ngModel]="editStatus" (ngModelChange)="editStatusChange.emit($event)">
              <mat-option value="Open">Open</mat-option>
              <mat-option value="In Review">In Review</mat-option>
              <mat-option value="Closed">Closed</mat-option>
            </mat-select>
          </mat-form-field>

          <button
            mat-raised-button
            color="primary"
            (click)="save.emit()"
            [disabled]="savingEdit || !editTitle.trim()"
          >
            {{ savingEdit ? 'Saving...' : 'Save' }}
          </button>

          <button mat-button (click)="cancel.emit()" [disabled]="savingEdit">Cancel</button>

          <span *ngIf="editError" class="danger">{{ editError }}</span>
        </div>
      </mat-card-content>
    </mat-card>
  `,
})
export class CaseCardComponent {
  @Input({ required: true }) c!: CaseDto;

  @Input() creating = false;
  @Input() savingEdit = false;

  @Input() isEditing = false;
  @Input() editTitle = '';
  @Input() editStatus: 'Open' | 'In Review' | 'Closed' = 'Open';
  @Input() editError: string | null = null;

  @Input() deleting = false;

  @Output() activity = new EventEmitter<CaseDto>();
  @Output() startEdit = new EventEmitter<CaseDto>();
  @Output() delete = new EventEmitter<CaseDto>();

  @Output() editTitleChange = new EventEmitter<string>();
  @Output() editStatusChange = new EventEmitter<'Open' | 'In Review' | 'Closed'>();

  @Output() save = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

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
}
