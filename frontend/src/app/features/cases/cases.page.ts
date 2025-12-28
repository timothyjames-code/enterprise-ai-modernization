import { Component, inject, signal } from '@angular/core';
import { NgFor, NgIf, DatePipe } from '@angular/common';
import { ApiHttpClient } from '../../core/services/api/http-client.service';

type CaseDto = {
  id: number;
  title: string;
  status: string;
  createdAt: string; // ISO string from backend
};

@Component({
  selector: 'app-cases-page',
  standalone: true,
  imports: [NgIf, NgFor, DatePipe],
  template: `
    <h1>Cases</h1>

    <p *ngIf="loading()">Loading cases...</p>
    <p *ngIf="error() as e" style="color: red;">{{ e }}</p>

    <ul *ngIf="!loading() && !error()">
      <li *ngFor="let c of cases()">
        <strong>#{{ c.id }}</strong>
        — {{ c.title }}
        <span>({{ c.status }})</span>
        <small *ngIf="c.createdAt"> • {{ c.createdAt | date : 'medium' }}</small>
      </li>
    </ul>

    <p *ngIf="!loading() && !error() && cases().length === 0">No cases found.</p>
  `,
})
export class CasesPage {
  private readonly api = inject(ApiHttpClient);

  readonly cases = signal<CaseDto[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  constructor() {
    this.api.get<CaseDto[]>('/cases').subscribe({
      next: (data) => {
        this.cases.set(data ?? []);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.message ?? 'Failed to load cases');
        this.loading.set(false);
      },
    });
  }
}
