import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { AppComponent } from './app/app';
import { routes } from './app/app.routes';
import { apiBaseUrlInterceptor } from './app/core/interceptors/api-base-url.interceptor';

bootstrapApplication(AppComponent, {
  providers: [provideRouter(routes), provideHttpClient(withInterceptors([apiBaseUrlInterceptor]))],
}).catch((err) => console.error(err));
