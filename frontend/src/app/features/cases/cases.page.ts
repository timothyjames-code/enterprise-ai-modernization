import { Component, inject } from '@angular/core';
import { ApiHttpClient } from '../../core/services/api/http-client.service';
import { timeout, take } from 'rxjs';

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

    this.api
      .get<{ ok: boolean }>('/health')
      .pipe(take(1), timeout(2000))
      .subscribe({
        next: (res) => (this.status = res.ok ? 'OK' : 'Not OK'),
        error: (err) => {
          const msg =
            err?.name === 'TimeoutError'
              ? 'Timed out (request not completing)'
              : 'Backend not running (expected)';
          this.status = msg;
          console.error('Health check failed:', err);
        },
      });
  }
}
