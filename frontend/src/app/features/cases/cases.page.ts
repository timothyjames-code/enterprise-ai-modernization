import { Component, inject, signal } from '@angular/core';
import { ApiHttpClient } from '../../core/services/api/http-client.service';

@Component({
  selector: 'app-cases-page',
  standalone: true,
  template: `
    <h1>Cases</h1>
    <p>API status: {{ status() }}</p>
  `,
})
export class CasesPage {
  private readonly api = inject(ApiHttpClient);

  readonly status = signal('Not called yet');

  constructor() {
    this.status.set('Calling /health...');

    this.api.get<{ ok: boolean }>('/health').subscribe({
      next: (res) => {
        console.log('Health response:', res);
        this.status.set(res?.ok ? 'OK' : 'Not OK');
      },
      error: (err) => {
        console.error('Health error:', err);
        this.status.set(`Error: ${err?.message ?? 'unknown'}`);
      },
    });
  }
}
