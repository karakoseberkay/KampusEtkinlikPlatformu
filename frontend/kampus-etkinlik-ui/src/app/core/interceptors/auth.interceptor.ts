import { inject } from '@angular/core';

import {
  HttpInterceptorFn
} from '@angular/common/http';

import {
  API_BASE_URL
} from '../config/api.config';

import {
  AuthStorageService
} from '../services/auth-storage.service';

export const authInterceptor: HttpInterceptorFn =
  (request, next) => {
    const authStorage =
      inject(AuthStorageService);

    const accessToken =
      authStorage.getAccessToken();

    const isBackendRequest =
      request.url.startsWith(API_BASE_URL);

    if (!accessToken || !isBackendRequest) {
      return next(request);
    }

    const authorizedRequest =
      request.clone({
        setHeaders: {
          Authorization:
            `Bearer ${accessToken}`
        }
      });

    return next(authorizedRequest);
  };