import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes'; // uygulamadaki route yapılandırmalarına erişmemizi sağlar
import { authInterceptor } from './core/interceptors/auth.interceptor'; // authInterceptora erişmemizi sağlar

// uygulamanın genel ayarlarını ve providerlarını tutar
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(), // tarayıcıda oluşan global hataların angular tarafından yakalanmasını sağlar
    provideRouter(routes), // uygulamadaki routeları angulara tanıtır
    provideHttpClient(
      withInterceptors([authInterceptor]) // backend isteklerinde authInterceptorın çalışmasını ve jwt tokenın isteklere eklenmesini sağlar
    )
  ]
};