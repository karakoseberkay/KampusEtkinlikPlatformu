import { Routes } from '@angular/router'; // uygulamadaki route tanımlarını yapabilmek için
import { authGuard } from './core/guards/auth.guard'; // giriş yapmış kullanıcı kontrolünü sağlar
import { guestGuard } from './core/guards/guest.guard'; // sadece giriş yapmamış kullanıcıların erişmesini sağlar
import { studentGuard, clubManagerGuard, adminGuard } from './core/guards/role.guard'; // rol bazlı sayfa erişimlerini kontrol eder

// uygulamadaki sayfa yollarını ve bu sayfalara kimlerin erişebileceğini tanımlar
export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full', // sadece url tamamen boşsa bu routeun çalışmasını sağlar
    redirectTo: 'home' // boş urlde kullanıcıyı ana sayfaya yönlendirir
  },
  {
    path: 'login',
    title: 'Log In',
    canActivate: [guestGuard], // giriş yapmış kullanıcı login sayfasına tekrar giremez
    loadComponent: () => import('./pages/login/login').then(module => module.LoginPage) // bütün sayfaları yüklemek yerine sadece logini gerektiğinde yükler lazy loading
  },
  {
    path: 'register',
    title: 'Sign Up',
    canActivate: [guestGuard], // giriş yapmış kullanıcı kayıt sayfasına tekrar giremez
    loadComponent: () => import('./pages/register/register').then(module => module.RegisterPage) // bütün sayfaları yüklemek yerine sadece registerı gerektiğinde yükler lazy loading
  },
  {
    path: 'popular-events',
    title: 'Popular Events',
    loadComponent: () => import('./pages/popular-events/popular-events').then(module => module.PopularEvents)
    // bu routea girildiğinde popular events componentini lazy loading ile yükler
  },
  {
    path: 'home',
    title: 'Home',
    canActivate: [authGuard], // sadece giriş yapmış kullanıcılar erişebilir
    loadComponent: () => import('./pages/home/home').then(module => module.HomePage) // home componentini sadece ihtiyaç olduğunda yükler
  },
  {
    path: 'clubs',
    title: 'Clubs',
    canActivate: [authGuard], // sadece giriş yapmış kullanıcıların kulüpler sayfasına erişmesini sağlar
    loadComponent: () => import('./pages/clubs/clubs').then(module => module.Clubs) // clubs componentini lazy loading ile yükler
  },
  {
    path: 'clubs/:id/stats',
    title: 'Club Statistics',
    canActivate: [clubManagerGuard], // sadece ClubManager rolü erişebilir
    loadComponent: () => import('./pages/club-stats/club-stats').then(module => module.ClubStats)
    // :id kısmı hangi kulübün istatistiklerinin gösterileceğini urlden dinamik olarak alır
  },
  {
    path: 'clubs/:id',
    title: 'Club Details',
    canActivate: [authGuard], // giriş yapmış kullanıcıların kulüp detayına erişmesini sağlar
    loadComponent: () => import('./pages/club-detail/club-detail').then(module => module.ClubDetail)
    // :id ile urlden kulüp idsini alıp aynı component üzerinden farklı kulüplerin detayını gösterebiliriz
  },
  {
    path: 'club-manage', // aynı urlyi kullanarak kulüp oluşturma sayfasını açar
    title: 'Create Club',
    canActivate: [clubManagerGuard], // sadece clubmanager kulüp oluşturma sayfasına girebilir
    loadComponent: () => import('./pages/club-manage/club-manage').then(module => module.ClubManage)
  },
  {
    path: 'club-manage/:id', // id gönderildiğinde aynı component bu sefer güncelleme için kullanılır
    title: 'Update Club',
    canActivate: [clubManagerGuard], // sadece clubmanager kulüp güncelleyebilir
    loadComponent: () => import('./pages/club-manage/club-manage').then(module => module.ClubManage)
  },
  {
    path: 'events', // etkinlik listesini gösterir
    title: 'Events',
    canActivate: [authGuard], // sadece giriş yapmış kullanıcıların etkinlik listesine erişmesini sağlar
    loadComponent: () => import('./pages/events/events').then(module => module.Events)
  },
  {
    path: 'events/:id/registrations', // idsi verilen etkinliğin kayıtlarını gösterir
    title: 'Event Registrations',
    canActivate: [clubManagerGuard], // etkinliğin kayıtlarını sadece ClubManager görüntüleyebilir
    loadComponent: () => import('./pages/event-registrations/event-registrations').then(module => module.EventRegistrations)
  },
  {
    path: 'events/:id', // idsi verilen etkinliğin detayını gösterir
    title: 'Event Details',
    canActivate: [authGuard], // giriş yapmış kullanıcıların etkinlik detayına erişmesini sağlar
    loadComponent: () => import('./pages/event-detail/event-detail').then(module => module.EventDetail)
  },
  {
    path: 'event-manage', // yeni etkinlik oluşturma sayfasını açar
    title: 'Create Event',
    canActivate: [clubManagerGuard], // sadece clubmanager etkinlik oluşturabilir
    loadComponent: () => import('./pages/event-manage/event-manage').then(module => module.EventManage)
  },
  {
    path: 'event-manage/:id', // id gönderildiğinde aynı component etkinlik güncellemek için kullanılır
    title: 'Update Event',
    canActivate: [clubManagerGuard], // sadece clubmanager etkinlik güncelleyebilir
    loadComponent: () => import('./pages/event-manage/event-manage').then(module => module.EventManage)
  },
  {
    path: 'my-registrations',
    title: 'My Registrations',
    canActivate: [studentGuard], // sadece Student rolü kendi kayıtlarını görüntüleyebilir
    // manager urlye elle yazsa bile guard onu içeri almaz
    loadComponent: () => import('./pages/my-registrations/my-registrations').then(module => module.MyRegistrations)
  },
  {
    path: 'user-management',
    title: 'User Management',
    canActivate: [adminGuard], // sadece manager@kampus.com admin hesabı erişebilir
    loadComponent: () => import('./pages/user-management/user-management').then(module => module.UserManagement)
  },
  {
    path: '**', // wildcard route yani yukarıdaki routelardan hiçbirine uymayan bütün adresleri yakalar
    redirectTo: 'home' // tanımlanmamış bir urle gidilirse ana sayfaya yönlendirir
  }
];