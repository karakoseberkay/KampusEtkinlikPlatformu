import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { routes } from './app.routes'; // uygulamadaki route yapılandırmalarına erişmemizi sağlar
import { authInterceptor } from './core/interceptors/auth.interceptor'; // authInterceptora erişmemizi sağlar
import { PRIMEUI_LICENSE } from './core/config/primeui-licence.local';

// uygulamanın genel ayarlarını ve providerlarını tutar
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(), // tarayıcıda oluşan global hataların angular tarafından yakalanmasını sağlar
    provideRouter(routes), // uygulamadaki routeları angulara tanıtır
    provideHttpClient(
      withInterceptors([authInterceptor]) // backend isteklerinde authInterceptorın çalışmasını ve jwt tokenın isteklere eklenmesini sağlar
    ),
    providePrimeNG({
  theme: {
    preset: Aura
  },
  license: PRIMEUI_LICENSE
}) // primeng componentlerini uygulamaya tanıtır ve aura temasını kullanmasını sağlar
  ]
};