import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard'; // giriş yapmış kullanıcı kontrolünü sağlar
import { guestGuard } from './core/guards/guest.guard'; // sadece giriş yapmamış kullanıcıların erişmesini sağlar
import { studentGuard, clubManagerGuard, adminGuard } from './core/guards/role.guard'; // rol bazlı sayfa erişimlerini kontrol eder

// uygulamadaki sayfa yollarını ve bu sayfalara kimlerin erişebileceğini tanımlar
export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'home' // boş urlde kullanıcıyı ana sayfaya yönlendirir
  },
  {
    path: 'login',
    title: 'Giriş Yap',
    canActivate: [guestGuard], // giriş yapmış kullanıcı login sayfasına tekrar giremez
    loadComponent: () =>
      import('./pages/login/login').then(module => module.LoginPage)//bütün sayfaları yüklemek yerine sadece logini yükler (lazy loading)
  },
  {
    path: 'register',
    title: 'Kayıt Ol',
    canActivate: [guestGuard], // giriş yapmış kullanıcı kayıt sayfasına tekrar giremez
    loadComponent: () =>
      import('./pages/register/register').then(module => module.RegisterPage)//bütün sayfaları yüklemek yerine sadece registerı yükler (lazy loading)
  },
  {
    path: 'popular-events',
    title: 'Popüler Etkinlikler',
    loadComponent: () =>
      import('./pages/popular-events/popular-events').then(module => module.PopularEvents)
    //bütün sayfaları yüklemek yerine sadece populereventsi yükler (lazy loading)
  },
  {
    path: 'home',
    title: 'Ana Sayfa',
    canActivate: [authGuard], // sadece giriş yapmış kullanıcılar erişebilir
    loadComponent: () =>
      import('./pages/home/home').then(module => module.HomePage)
  },
  {
    path: 'clubs',
    title: 'Kulüpler',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/clubs/clubs').then(module => module.Clubs)
  },
  {
    path: 'clubs/:id/stats',
    title: 'Kulüp İstatistikleri',
    canActivate: [clubManagerGuard], // sadece ClubManager rolü erişebilir
    loadComponent: () =>
      import('./pages/club-stats/club-stats').then(module => module.ClubStats)
  },
  {
    path: 'clubs/:id',
    title: 'Kulüp Detayı',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/club-detail/club-detail').then(module => module.ClubDetail)
  },
  {
    path: 'club-manage',//aynı urlyi kullanarak hem kulübü oluşturup hemde int göndererek güncelleme yapılabiliyor
    title: 'Kulüp Oluştur',
    canActivate: [clubManagerGuard],
    loadComponent: () =>
      import('./pages/club-manage/club-manage').then(module => module.ClubManage)
  },
  {
    path: 'club-manage/:id',
    title: 'Kulüp Güncelle',
    canActivate: [clubManagerGuard],
    loadComponent: () =>
      import('./pages/club-manage/club-manage').then(module => module.ClubManage)
  },
  {
    path: 'events', //liste
    title: 'Etkinlikler',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/events/events').then(module => module.Events)
  },
  {
    path: 'events/:id/registrations',//eventin kaydı
    title: 'Etkinlik Kayıtları',
    canActivate: [clubManagerGuard], // etkinliğin kayıtlarını sadece ClubManager görüntüleyebilir
    loadComponent: () =>
      import('./pages/event-registrations/event-registrations').then(module => module.EventRegistrations)
  },
  {
    path: 'events/:id',//detay
    title: 'Etkinlik Detayı',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/event-detail/event-detail').then(module => module.EventDetail)
  },
  {
    path: 'event-manage',//oluşturma
    title: 'Etkinlik Oluştur',
    canActivate: [clubManagerGuard],
    loadComponent: () =>
      import('./pages/event-manage/event-manage').then(module => module.EventManage)
  },
  {
    path: 'event-manage/:id',//güncelleme
    title: 'Etkinlik Güncelle',
    canActivate: [clubManagerGuard],
    loadComponent: () =>
      import('./pages/event-manage/event-manage').then(module => module.EventManage)
  },
  {
    path: 'my-registrations',
    title: 'Kayıtlarım',
    canActivate: [studentGuard], // sadece Student rolü kendi kayıtlarını görüntüleyebilir
    //manager urlye elle yazsa bile guard onu içeri almaz
    loadComponent: () =>
      import('./pages/my-registrations/my-registrations').then(module => module.MyRegistrations)
  },
  {
    path: 'user-management',
    title: 'Kullanıcı Yönetimi',
    canActivate: [adminGuard], // sadece manager@kampus.com admin hesabı erişebilir
    loadComponent: () =>
      import('./pages/user-management/user-management').then(module => module.UserManagement)
  },
  {
    path: '**',
    redirectTo: 'home' // tanımlanmamış bir urle gidilirse ana sayfaya yönlendirir
  }
];