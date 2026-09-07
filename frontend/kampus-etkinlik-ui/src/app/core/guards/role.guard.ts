import { inject } from '@angular/core'; // AuthService ve Router gibi servisleri guard içinde DI ile almak için
import { CanActivateFn, Router, UrlTree } from '@angular/router'; // route erişimini kontrol etmek ve yönlendirme URLsi oluşturmak için
import { AuthService } from '../services/auth.service'; // kullanıcının oturum rol ve kullanıcı bilgilerine erişmek için

function roleGuard(role: string): boolean | UrlTree { // verilen role göre sayfa erişimini kontrol eder true veya yönlendirme için UrlTree döndürür
  const authService = inject(AuthService); // kullanıcının oturum ve rol bilgilerine erişmek için servisi DI ile alır
  const router = inject(Router); // kullanıcıyı başka routea yönlendirecek UrlTree oluşturmak için Routerı DI ile alır

  if (!authService.hasValidSession()) {
    return router.createUrlTree(['/login']); // geçerli oturum yoksa kullanıcıyı login sayfasına yönlendirir
  }

  if (!authService.hasRole(role)) {
    return router.createUrlTree(['/home']); // kullanıcı istenen role sahip değilse home sayfasına yönlendirir
  }

  return true; // oturum ve rol kontrolü başarılıysa sayfaya girişe izin verir
}

export const studentGuard: CanActivateFn = () => roleGuard('Student');
// ortak roleGuard fonksiyonuna Student rolünü göndererek sadece Student kullanıcıların erişmesini sağlar

export const clubManagerGuard: CanActivateFn = () => roleGuard('ClubManager');
// ortak roleGuard fonksiyonuna ClubManager rolünü göndererek sadece ClubManager kullanıcıların erişmesini sağlar

export const adminGuard: CanActivateFn = () => { // projedeki admin hesabının user management sayfasına erişimini kontrol eder
  const authService = inject(AuthService); // giriş yapan kullanıcının oturum rol ve kullanıcı bilgilerine erişmek için
  const router = inject(Router); // erişim reddedilirse başka sayfaya yönlendirmek için

  if (!authService.hasValidSession()) {
    return router.createUrlTree(['/login']); // geçerli oturum yoksa kullanıcıyı login sayfasına yönlendirir
  }

  const user = authService.currentUser(); // giriş yapan kullanıcının bilgilerini alır

  if (!user || !authService.hasRole('ClubManager') || user.email.toLowerCase() !== 'manager@kampus.com') {
    return router.createUrlTree(['/home']);
    // kullanıcı yoksa ClubManager değilse veya belirlenen admin mailine sahip değilse admin sayfasına girişini engeller
  }

  return true; // bütün admin kontrolleri başarılıysa sayfaya girişe izin verir
};