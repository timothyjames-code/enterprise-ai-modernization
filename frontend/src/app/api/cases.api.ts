import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type CaseDto = {
  id: number;
  title: string;
  status: string;
  createdAt: string; // ISO
};

@Injectable({ providedIn: 'root' })
export class CasesApi {
  private http = inject(HttpClient);

  list(): Observable<CaseDto[]> {
    return this.http.get<CaseDto[]>('/api/cases');
  }
}
