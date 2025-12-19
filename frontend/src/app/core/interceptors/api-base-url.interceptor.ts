import { HttpInterceptorFn } from '@angular/common/http';
import { APP_CONFIG } from '../config/app-config';

export const apiBaseUrlInterceptor: HttpInterceptorFn = (req, next) => {
  // Only rewrite relative URLs
  if (req.url.startsWith('http://') || req.url.startsWith('https://')) {
    return next(req);
  }

  const normalized = req.url.startsWith('/') ? req.url : `/${req.url}`;
  const updated = req.clone({ url: `${APP_CONFIG.apiBaseUrl}${normalized}` });

  return next(updated);
};
