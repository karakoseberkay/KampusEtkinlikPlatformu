import { Routes } from '@angular/router'; // uygulamadaki URL yollarını ve hangi componentin açılacağını tanımlamak için
import { authGuard } from './core/guards/auth.guard'; // kullanıcının giriş yapmış olup olmadığını kontrol etmek için
import { guestGuard } from './core/guards/guest.guard'; // sadece giriş yapmamış kullanıcıların erişmesini sağlamak için
import { studentGuard, clubManagerGuard, adminGuard } from './core/guards/role.guard'; // rol bazlı sayfa erişimlerini kontrol etmek için

export const routes: Routes = [ // uygulamadaki bütün sayfa yollarını ve erişim kurallarını tutar
  {
    path: '',
    pathMatch: 'full', // URL tamamen boş olduğunda bu routeun çalışmasını sağlar
    redirectTo: 'home' // boş URL ile girildiğinde kullanıcıyı home sayfasına yönlendirir
  },
  {
    path: 'login',
    title: 'Log In', // tarayıcı sekmesinde gösterilecek sayfa başlığını belirler
    canActivate: [guestGuard], // sadece giriş yapmamış kullanıcıların login sayfasına erişmesini sağlar
    loadComponent: () => import('./pages/login/login').then(module => module.LoginPage)
    // lazy loading ile LoginPage componentini sadece bu sayfaya girildiğinde yükler
  },
  {
    path: 'register',
    title: 'Sign Up',
    canActivate: [guestGuard], // giriş yapmış kullanıcıların register sayfasına tekrar girmesini engeller
    loadComponent: () => import('./pages/register/register').then(module => module.RegisterPage)
    // RegisterPage componentini ihtiyaç olduğunda yükler
  },
  {
    path: 'popular-events',
    title: 'Popular Events',
    loadComponent: () => import('./pages/popular-events/popular-events').then(module => module.PopularEvents)
    // bu route açıldığında PopularEvents componentini lazy loading ile yükler
  },
  {
    path: 'home',
    title: 'Home',
    canActivate: [authGuard], // sadece giriş yapmış kullanıcıların home sayfasına erişmesini sağlar
    loadComponent: () => import('./pages/home/home').then(module => module.HomePage)
  },
  {
    path: 'clubs',
    title: 'Clubs',
    canActivate: [authGuard], // sadece giriş yapmış kullanıcıların kulüpler sayfasına erişmesini sağlar
    loadComponent: () => import('./pages/clubs/clubs').then(module => module.Clubs)
  },
  {
    path: 'clubs/:id/stats',
    title: 'Club Statistics',
    canActivate: [clubManagerGuard], // sadece ClubManager rolündeki kullanıcıların erişmesini sağlar
    loadComponent: () => import('./pages/club-stats/club-stats').then(module => module.ClubStats)
    // :id URLden hangi kulübün istatistiklerinin istendiğini dinamik olarak alır
  },
  {
    path: 'clubs/:id',
    title: 'Club Details',
    canActivate: [authGuard], // giriş yapmış kullanıcıların kulüp detayına erişmesini sağlar
    loadComponent: () => import('./pages/club-detail/club-detail').then(module => module.ClubDetail)
    // aynı component :id değerine göre farklı kulüplerin detayını gösterebilir
  },
  {
    path: 'club-manage',
    title: 'Create Club',
    canActivate: [clubManagerGuard], // sadece ClubManager kulüp oluşturma sayfasına girebilir
    loadComponent: () => import('./pages/club-manage/club-manage').then(module => module.ClubManage)
  },
  {
    path: 'club-manage/:id',
    title: 'Update Club',
    canActivate: [clubManagerGuard], // sadece ClubManager kulüp güncelleme sayfasına girebilir
    loadComponent: () => import('./pages/club-manage/club-manage').then(module => module.ClubManage)
    // id varsa aynı ClubManage componenti oluşturma yerine güncelleme için kullanılır
  },
  {
    path: 'events',
    title: 'Events',
    canActivate: [authGuard], // sadece giriş yapmış kullanıcıların etkinlik listesine erişmesini sağlar
    loadComponent: () => import('./pages/events/events').then(module => module.Events)
  },
  {
    path: 'events/:id/registrations',
    title: 'Event Registrations',
    canActivate: [clubManagerGuard], // etkinliğin kayıtlarını sadece ClubManager görüntüleyebilir
    loadComponent: () => import('./pages/event-registrations/event-registrations').then(module => module.EventRegistrations)
  },
  {
    path: 'events/:id',
    title: 'Event Details',
    canActivate: [authGuard], // giriş yapmış kullanıcıların etkinlik detayına erişmesini sağlar
    loadComponent: () => import('./pages/event-detail/event-detail').then(module => module.EventDetail)
  },
  {
    path: 'event-manage',
    title: 'Create Event',
    canActivate: [clubManagerGuard], // sadece ClubManager etkinlik oluşturabilir
    loadComponent: () => import('./pages/event-manage/event-manage').then(module => module.EventManage)
  },
  {
    path: 'event-manage/:id',
    title: 'Update Event',
    canActivate: [clubManagerGuard], // sadece ClubManager etkinlik güncelleyebilir
    loadComponent: () => import('./pages/event-manage/event-manage').then(module => module.EventManage)
    // id varsa aynı EventManage componenti etkinlik güncelleme için kullanılır
  },
  {
    path: 'my-registrations',
    title: 'My Registrations',
    canActivate: [studentGuard], // sadece Student rolündeki kullanıcıların kendi kayıtlarını görüntülemesini sağlar
    loadComponent: () => import('./pages/my-registrations/my-registrations').then(module => module.MyRegistrations)
  },
  {
    path: 'check-in',
    title: 'Event Check-In',
    canActivate: [authGuard], // giriş yapmış kullanıcıların qr check-in sayfasını açmasını sağlar
    loadComponent: () => import('./pages/check-in/check-in').then(module => module.CheckIn)
    // qr okutulduğunda /check-in?token=... adresi CheckIn componentini açar
  },
  {
    path: 'user-management',
    title: 'User Management',
    canActivate: [adminGuard], // sadece admin yetkisine sahip kullanıcının erişmesini sağlar
    loadComponent: () => import('./pages/user-management/user-management').then(module => module.UserManagement)
  },
  {
    path: '**', // yukarıdaki hiçbir route ile eşleşmeyen bütün URLleri yakalayan wildcard routedur
    redirectTo: 'home' // geçersiz bir URL girildiğinde kullanıcıyı home sayfasına yönlendirir
  }
];