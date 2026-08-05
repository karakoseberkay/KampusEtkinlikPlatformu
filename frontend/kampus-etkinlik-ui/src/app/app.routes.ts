import { Routes } from '@angular/router';

import {
  authGuard
} from './core/guards/auth.guard';

import {
  guestGuard
} from './core/guards/guest.guard';

export const routes: Routes = [
  {
    path: 'login',
    title: 'Giriş Yap | KampüsEtkinlik',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./pages/login/login')
        .then(module => module.LoginPage)
  },
  {
    path: 'register',
    title: 'Kayıt Ol | KampüsEtkinlik',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./pages/register/register')
        .then(module => module.RegisterPage)
  },
  {
    path: 'home',
    title: 'Ana Sayfa | KampüsEtkinlik',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/home/home')
        .then(module => module.HomePage)
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'home'
  },
  {
    path: '**',
    redirectTo: 'home'
  }
];