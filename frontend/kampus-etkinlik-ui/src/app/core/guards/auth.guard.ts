import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const authService = inject(AuthService); // kullanıcının oturum bilgilerine erişmemizi sağlar
  const router = inject(Router); // kullanıcıyı farklı routelara yönlendirmemizi sağlar

  if (authService.hasValidSession()) {
    return true; // geçerli oturum varsa kullanıcının sayfaya erişmesine izin verir
  }

  return router.createUrlTree(//yoksa login sayfasına paslar, ama adresi saklar böylece giriş yaptığı anda o adrese yönlendirir
    ['/login'],
    {
      queryParams: {
        returnUrl: state.url // giriş yaptıktan sonra kullanıcının gitmek istediği sayfaya dönebilmek için url bilgisini taşır
      }
    }
  );
};