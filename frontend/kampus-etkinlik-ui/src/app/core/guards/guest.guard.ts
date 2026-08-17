import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService); // kullanıcının oturum bilgilerine erişmemizi sağlar
  const router = inject(Router); // kullanıcıyı farklı routelara yönlendirmemizi sağlar

  if (!authService.hasValidSession()) {
    return true; // giriş yapılmamışsa login ve register sayfalarına erişmesine izin verir
  }

  return router.createUrlTree(['/home']); // kullanıcı giriş yapmışsa ana sayfaya yönlendirir
};