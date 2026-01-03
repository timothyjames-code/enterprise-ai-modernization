import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-cases-toolbar',
  standalone: true,
  imports: [
    NgIf,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
  ],
  styles: [
    `
      .toolbar {
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

      :host ::ng-deep .noSub .mat-mdc-form-field-subscript-wrapper {
        display: none !important;
      }
    `,
  ],
  template: `
    <div class="toolbar">
      <mat-form-field class="noSub" appearance="fill" style="min-width: 260px;">
        <mat-label>Search</mat-label>
        <input
          matInput
          placeholder="Search by title..."
          [ngModel]="search"
          (ngModelChange)="searchChange.emit($event)"
        />
      </mat-form-field>

      <mat-form-field class="noSub" appearance="fill" style="min-width: 180px;">
        <mat-label>Status</mat-label>
        <mat-select [ngModel]="status" (ngModelChange)="statusChange.emit($event)">
          <mat-option value="">All statuses</mat-option>
          <mat-option value="Open">Open</mat-option>
          <mat-option value="In Review">In Review</mat-option>
          <mat-option value="Closed">Closed</mat-option>
        </mat-select>
      </mat-form-field>

      <mat-form-field class="noSub" appearance="fill" style="min-width: 180px;">
        <mat-label>Sort</mat-label>
        <mat-select [ngModel]="sort" (ngModelChange)="sortChange.emit($event)">
          <mat-option value="createdAt,desc">Newest</mat-option>
          <mat-option value="createdAt,asc">Oldest</mat-option>
          <mat-option value="title,asc">Title A–Z</mat-option>
          <mat-option value="title,desc">Title Z–A</mat-option>
        </mat-select>
      </mat-form-field>

      <mat-form-field class="noSub" appearance="fill" style="width: 120px;">
        <mat-label>Size</mat-label>
        <mat-select [ngModel]="size" (ngModelChange)="sizeChange.emit($event)">
          <mat-option [value]="5">5</mat-option>
          <mat-option [value]="10">10</mat-option>
          <mat-option [value]="20">20</mat-option>
        </mat-select>
      </mat-form-field>

      <button class="rowBtn" mat-stroked-button (click)="prev.emit()" [disabled]="loading || first">
        Prev
      </button>
      <button class="rowBtn" mat-stroked-button (click)="next.emit()" [disabled]="loading || last">
        Next
      </button>

      <button
        *ngIf="hasActiveFilters"
        class="rowBtn"
        mat-button
        (click)="clear.emit()"
        [disabled]="loading"
      >
        <mat-icon>close</mat-icon>
        Clear
      </button>
    </div>
  `,
})
export class CasesToolbarComponent {
  @Input() loading = false;

  @Input() search = '';
  @Input() status = '';
  @Input() sort = 'createdAt,desc';
  @Input() size = 10;

  @Input() first = true;
  @Input() last = false;

  @Input() hasActiveFilters = false;

  @Output() searchChange = new EventEmitter<string>();
  @Output() statusChange = new EventEmitter<string>();
  @Output() sortChange = new EventEmitter<string>();
  @Output() sizeChange = new EventEmitter<number>();

  @Output() prev = new EventEmitter<void>();
  @Output() next = new EventEmitter<void>();
  @Output() clear = new EventEmitter<void>();
}
