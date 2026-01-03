import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

export type RejectSummaryDialogResult = {
  reasonCode: string;
  comment: string;
};

export type RejectSummaryDialogData = {
  defaultReasonCode?: string;
};

@Component({
  selector: 'app-reject-summary-dialog',
  standalone: true,
  imports: [
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>Reject draft</h2>

    <div mat-dialog-content style="display:grid; gap:12px;">
      <mat-form-field appearance="outline">
        <mat-label>Reason</mat-label>
        <mat-select [(ngModel)]="reasonCode">
          <mat-option value="INACCURATE">Inaccurate</mat-option>
          <mat-option value="INCOMPLETE">Incomplete</mat-option>
          <mat-option value="TOO_LONG">Too long</mat-option>
          <mat-option value="TOO_SHORT">Too short</mat-option>
          <mat-option value="OTHER">Other</mat-option>
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Comment (optional)</mat-label>
        <textarea
          matInput
          rows="4"
          [(ngModel)]="comment"
          placeholder="What should be changed?"
        ></textarea>
      </mat-form-field>
    </div>

    <div mat-dialog-actions align="end">
      <button mat-button (click)="cancel()">Cancel</button>
      <button mat-flat-button color="warn" (click)="submit()" [disabled]="!reasonCode">
        Reject
      </button>
    </div>
  `,
})
export class RejectSummaryDialogComponent {
  private readonly ref = inject(MatDialogRef<RejectSummaryDialogComponent>);
  private readonly data = inject<RejectSummaryDialogData>(MAT_DIALOG_DATA, { optional: true });

  reasonCode = this.data?.defaultReasonCode ?? 'INACCURATE';
  comment = '';

  cancel() {
    this.ref.close(null);
  }

  submit() {
    this.ref.close({
      reasonCode: String(this.reasonCode || '')
        .trim()
        .toUpperCase(),
      comment: String(this.comment || '').trim(),
    } satisfies RejectSummaryDialogResult);
  }
}
