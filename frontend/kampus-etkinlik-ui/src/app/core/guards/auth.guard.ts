import { inject } from '@angular/core'; // AuthService ve Router gibi servisleri DI ile almak için
import { CanActivateFn, Router } from '@angular/router'; // route açılmadan önce erişim kontrolü yapmak ve yönlendirme oluşturmak için
import { AuthService } from '../services/auth.service'; // kullanıcının oturum bilgilerine erişmek için

export const authGuard: CanActivateFn = (_route, state) => {
  // CanActivateFn bunun bir route guard fonksiyonu olduğunu belirtir
  // _route gidilmek istenen route hakkında bilgi taşır burada kullanılmadığı için başına _ koyulmuştur
  // state yapılmak istenen yönlendirme ve hedef URL hakkında bilgi taşır

  const authService = inject(AuthService); // kullanıcının geçerli oturumu olup olmadığını kontrol etmek için servisi DI ile alır
  const router = inject(Router); // kullanıcıyı başka routea yönlendirecek UrlTree oluşturmak için Routerı DI ile alır

  if (authService.hasValidSession()) {
    return true; // geçerli oturum varsa kullanıcının istediği sayfaya girmesine izin verir
  }

  return router.createUrlTree(['/login'], {
    queryParams: {
      returnUrl: state.url
    }
  });
  // geçerli oturum yoksa kullanıcıyı login sayfasına gönderir ve gitmek istediği tam adresi returnUrl içinde saklar
};