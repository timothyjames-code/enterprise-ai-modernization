import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'cases' },
  {
    path: 'cases',
    loadComponent: () => import('./features/cases/cases.page').then((m) => m.CasesPage),
  },
  {
    path: 'documents',
    loadComponent: () => import('./features/documents/documents.page').then((m) => m.DocumentsPage),
  },
  {
    path: 'reviews',
    loadComponent: () => import('./features/reviews/reviews.page').then((m) => m.ReviewsPage),
  },
  { path: '**', redirectTo: 'cases' },
];
