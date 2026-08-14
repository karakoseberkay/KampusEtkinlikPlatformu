import {
  Routes
} from '@angular/router';

import {
  authGuard
} from './core/guards/auth.guard';

import {
  guestGuard
} from './core/guards/guest.guard';

import {
  studentGuard,
  clubManagerGuard
} from './core/guards/role.guard';


export const routes: Routes = [

  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'home'
  },


  {
    path: 'login',
    title: 'Giriş Yap',
    canActivate: [
      guestGuard
    ],
    loadComponent: () =>
      import(
        './pages/login/login'
      ).then(
        module =>
          module.LoginPage
      )
  },


  {
    path: 'register',
    title: 'Kayıt Ol',
    canActivate: [
      guestGuard
    ],
    loadComponent: () =>
      import(
        './pages/register/register'
      ).then(
        module =>
          module.RegisterPage
      )
  },


  {
    path: 'popular-events',
    title: 'Popüler Etkinlikler',
    loadComponent: () =>
      import(
        './pages/popular-events/popular-events'
      ).then(
        module =>
          module.PopularEvents
      )
  },


  {
    path: 'home',
    title: 'Ana Sayfa',
    canActivate: [
      authGuard
    ],
    loadComponent: () =>
      import(
        './pages/home/home'
      ).then(
        module =>
          module.HomePage
      )
  },


  {
    path: 'clubs',
    title: 'Kulüpler',
    canActivate: [
      authGuard
    ],
    loadComponent: () =>
      import(
        './pages/clubs/clubs'
      ).then(
        module =>
          module.Clubs
      )
  },


  {
    path: 'clubs/:id/stats',
    title: 'Kulüp İstatistikleri',
    canActivate: [
      clubManagerGuard
    ],
    loadComponent: () =>
      import(
        './pages/club-stats/club-stats'
      ).then(
        module =>
          module.ClubStats
      )
  },


  {
    path: 'clubs/:id',
    title: 'Kulüp Detayı',
    canActivate: [
      authGuard
    ],
    loadComponent: () =>
      import(
        './pages/club-detail/club-detail'
      ).then(
        module =>
          module.ClubDetail
      )
  },


  {
    path: 'club-manage',
    title: 'Kulüp Oluştur',
    canActivate: [
      clubManagerGuard
    ],
    loadComponent: () =>
      import(
        './pages/club-manage/club-manage'
      ).then(
        module =>
          module.ClubManage
      )
  },


  {
    path: 'club-manage/:id',
    title: 'Kulüp Güncelle',
    canActivate: [
      clubManagerGuard
    ],
    loadComponent: () =>
      import(
        './pages/club-manage/club-manage'
      ).then(
        module =>
          module.ClubManage
      )
  },


  {
    path: 'events',
    title: 'Etkinlikler',
    canActivate: [
      authGuard
    ],
    loadComponent: () =>
      import(
        './pages/events/events'
      ).then(
        module =>
          module.Events
      )
  },


  {
    path: 'events/:id/registrations',
    title: 'Etkinlik Kayıtları',
    canActivate: [
      clubManagerGuard
    ],
    loadComponent: () =>
      import(
        './pages/event-registrations/event-registrations'
      ).then(
        module =>
          module.EventRegistrations
      )
  },


  {
    path: 'events/:id',
    title: 'Etkinlik Detayı',
    canActivate: [
      authGuard
    ],
    loadComponent: () =>
      import(
        './pages/event-detail/event-detail'
      ).then(
        module =>
          module.EventDetail
      )
  },


  {
    path: 'event-manage',
    title: 'Etkinlik Oluştur',
    canActivate: [
      clubManagerGuard
    ],
    loadComponent: () =>
      import(
        './pages/event-manage/event-manage'
      ).then(
        module =>
          module.EventManage
      )
  },


  {
    path: 'event-manage/:id',
    title: 'Etkinlik Güncelle',
    canActivate: [
      clubManagerGuard
    ],
    loadComponent: () =>
      import(
        './pages/event-manage/event-manage'
      ).then(
        module =>
          module.EventManage
      )
  },


  {
    path: 'my-registrations',
    title: 'Kayıtlarım',
    canActivate: [
      studentGuard
    ],
    loadComponent: () =>
      import(
        './pages/my-registrations/my-registrations'
      ).then(
        module =>
          module.MyRegistrations
      )
  },

  {
  path: 'user-management',
  canActivate: [
    clubManagerGuard
  ],
  loadComponent: () =>
    import(
      './pages/user-management/user-management'
    )
      .then(
        module =>
          module.UserManagement
      )
},


  {
    path: '**',
    redirectTo: 'home'
  }

];