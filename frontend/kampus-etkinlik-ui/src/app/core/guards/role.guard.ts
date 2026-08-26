import { inject } from '@angular/core'; // servisleri guard içinde kullanabilmek için
import { CanActivateFn, Router, UrlTree } from '@angular/router'; // guard tipi yönlendirme ve url oluşturma işlemleri için
import { AuthService } from '../services/auth.service'; // kullanıcının oturum ve rol bilgilerine erişmek için

function roleGuard(role: string): boolean | UrlTree { // verilen role göre sayfa erişimini kontrol eder ya true döner ya da başka sayfaya yönlendirir
  const authService = inject(AuthService); // kullanıcının oturum ve rol bilgilerine erişmemizi sağlar
  const router = inject(Router); // kullanıcıyı farklı routelara yönlendirmemizi sağlar

  if (!authService.hasValidSession()) { // kullanıcının geçerli oturumu yoksa
    return router.createUrlTree(['/login']); // login sayfasına yönlendirir
  }

  if (!authService.hasRole(role)) { // kullanıcı gerekli role sahip değilse
    return router.createUrlTree(['/home']); // ana sayfaya yönlendirir
  }

  return true; // bütün kontroller geçildiyse sayfaya girişe izin verir
}

export const studentGuard: CanActivateFn = () => roleGuard('Student'); // sadece Student rolüne izin verir

export const clubManagerGuard: CanActivateFn = () => roleGuard('ClubManager'); // sadece ClubManager rolüne izin verir

export const adminGuard: CanActivateFn = () => { // sadece projedeki admin hesabının erişebilmesini kontrol eder
  const authService = inject(AuthService); // mevcut kullanıcının oturum ve kullanıcı bilgilerine erişmek için
  const router = inject(Router); // gerektiğinde kullanıcıyı başka sayfaya yönlendirmek için

  if (!authService.hasValidSession()) { // geçerli oturum yoksa
    return router.createUrlTree(['/login']); // login sayfasına yönlendirir
  }

  const user = authService.currentUser(); // giriş yapan kullanıcının bilgilerini alır

  if (!user || !authService.hasRole('ClubManager') || user.email.toLowerCase() !== 'manager@kampus.com') { // kullanıcı yoksa clubmanager değilse veya admin mailine sahip değilse
    return router.createUrlTree(['/home']); // kullanıcının admin sayfasına girmesini engelleyip ana sayfaya gönderir
  }

  return true; // bütün admin kontrolleri geçildiyse sayfaya girişe izin verir
};