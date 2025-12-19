import { Component, inject } from '@angular/core';
import { ApiHttpClient } from '../../core/services/api/http-client.service';

@Component({
  selector: 'app-cases-page',
  standalone: true,
  template: `
    <h1>Cases</h1>
    <p>API status: {{ status }}</p>
  `,
})
export class CasesPage {
  private readonly api = inject(ApiHttpClient);

  status = 'Not called yet';

  constructor() {
    this.status = 'Calling /health...';

    this.api.get<{ ok: boolean }>('/health').subscribe({
      next: (res) => (this.status = res.ok ? 'OK' : 'Not OK'),
      error: () => (this.status = 'Backend not running (expected)'),
    });
  }
}
