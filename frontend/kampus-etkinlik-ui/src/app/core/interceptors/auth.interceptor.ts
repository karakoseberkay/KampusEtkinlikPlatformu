import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { API_BASE_URL } from '../config/api.config';
import { AuthStorageService } from '../services/auth-storage.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const authStorage = inject(AuthStorageService); // localStoragedaki kullanıcı oturumuna erişmemizi sağlar
  const accessToken = authStorage.getAccessToken(); // geçerli oturum varsa JWT tokenı alır
  const isBackendRequest = request.url.startsWith(API_BASE_URL); // isteğin bizim backende gidip gitmediğini kontrol eder

  if (!accessToken || !isBackendRequest) {
    return next(request); 
    // token yoksa veya istek bizim backende gitmiyorsa isteği değiştirmeden devam ettirir(önlem)
  }

  const authorizedRequest = request.clone({
    setHeaders: {Authorization: `Bearer ${accessToken}`}
       // JWT tokenı Authorization headerına ekler
    
  });

  return next(authorizedRequest); // token eklenmiş isteği bir sonraki aşamaya gönderir
};