import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

function roleGuard(role: string): boolean | UrlTree { // verilen role göre sayfa erişimini kontrol eder
  const authService = inject(AuthService); // kullanıcının oturum ve rol bilgilerine erişmemizi sağlar
  const router = inject(Router); // kullanıcıyı farklı routelara yönlendirmemizi sağlar

  if (!authService.hasValidSession()) {
    return router.createUrlTree(['/login']); // geçerli oturum yoksa login sayfasına yönlendirir
  }

  if (!authService.hasRole(role)) {
    return router.createUrlTree(['/home']); // kullanıcı gerekli role sahip değilse ana sayfaya yönlendirir
  }

  return true;
}

export const studentGuard: CanActivateFn = () => roleGuard('Student'); // sadece Student rolüne izin verir

export const clubManagerGuard: CanActivateFn = () => roleGuard('ClubManager'); // sadece ClubManager rolüne izin verir

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.hasValidSession()) {
    return router.createUrlTree(['/login']);
  }

  const user = authService.currentUser();

  if (
    !user ||
    !authService.hasRole('ClubManager') ||
    user.email.toLowerCase() !== 'manager@kampus.com'
  ) {
    return router.createUrlTree(['/home']); // sadece manager@kampus.com admin hesabına izin verir
  }

  return true;
};