import { Component, inject, signal } from '@angular/core';
import { NgFor, NgIf, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiHttpClient } from '../../core/services/api/http-client.service';

type CaseDto = {
  id: number;
  title: string;
  status: string;
  createdAt: string;
};

@Component({
  selector: 'app-cases-page',
  standalone: true,
  imports: [NgIf, NgFor, DatePipe, FormsModule],
  template: `
    <h1>Cases</h1>

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
      <li *ngFor="let c of cases()">
        <strong>#{{ c.id }}</strong> — {{ c.title }}
        <span>({{ c.status }})</span>
        <small> • {{ c.createdAt | date : 'medium' }}</small>

        <button (click)="deleteCase(c.id)" style="margin-left: 8px;">Delete</button>
      </li>
    </ul>

    <p *ngIf="!loading() && !error() && cases().length === 0">No cases found.</p>
  `,
})
export class CasesPage {
  private readonly api = inject(ApiHttpClient);

  readonly cases = signal<CaseDto[]>([]);
  readonly loading = signal(true);
  readonly creating = signal(false);

  // General error message (network/server/etc.)
  readonly error = signal<string | null>(null);

  // Field-level validation errors from backend: { title: "title is required" }
  readonly fieldErrors = signal<Record<string, string>>({});

  readonly newTitle = signal('');
  readonly newStatus = signal<'Open' | 'In Review' | 'Closed'>('Open');

  constructor() {
    this.loadCases();
  }

  onTitleChange(value: string) {
    this.newTitle.set(value);
    // Clear title-specific error as user edits
    if (this.fieldErrors()['title']) {
      const next = { ...this.fieldErrors() };
      delete next['title'];
      this.fieldErrors.set(next);
    }
  }

  private loadCases() {
    this.loading.set(true);
    this.error.set(null);

    // ApiHttpClient base / interceptor should route this to GET /api/cases
    this.api.get<CaseDto[]>('/cases').subscribe({
      next: (data) => {
        this.cases.set(data ?? []);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(`Load failed: ${err?.message ?? 'unknown'}`);
        this.loading.set(false);
      },
    });
  }

  deleteCase(id: number) {
    this.api.delete<void>(`/cases/${id}`).subscribe({
      next: () => this.loadCases(),
      error: (err) => this.error.set(`Delete failed: ${err?.message ?? 'unknown'}`),
    });
  }

  createCase() {
    const title = this.newTitle().trim();
    const status = this.newStatus().trim();
    if (!title) return;

    this.creating.set(true);
    this.error.set(null);
    this.fieldErrors.set({});

    // routes to POST /api/cases
    this.api.post<CaseDto>('/cases', { title, status }).subscribe({
      next: () => {
        this.newTitle.set('');
        this.newStatus.set('Open');
        this.creating.set(false);
        this.loadCases();
      },
      error: (err) => {
        this.creating.set(false);

        // Handle backend validation shape: { message, errors: { field: msg } }
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
}
