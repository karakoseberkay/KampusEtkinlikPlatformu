import { Routes } from '@angular/router';
import { PopularEvents } from './pages/popular-events/popular-events';
import { LoginPage } from './pages/login/login';
import { RegisterPage } from './pages/register/register';
import { HomePage } from './pages/home/home';

import { Clubs } from './pages/clubs/clubs';
import { ClubDetail } from './pages/club-detail/club-detail';
import { ClubManage } from './pages/club-manage/club-manage';
import { ClubStats } from './pages/club-stats/club-stats';

import { Events } from './pages/events/events';
import { EventDetail } from './pages/event-detail/event-detail';
import { EventManage } from './pages/event-manage/event-manage';

import { MyRegistrations } from './pages/my-registrations/my-registrations';
import { EventRegistrations } from './pages/event-registrations/event-registrations';

import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

import {
  studentGuard,
  clubManagerGuard
} from './core/guards/role.guard';


export const routes: Routes = [
{
  path: 'popular-events',
  component: PopularEvents
},
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'home'
  },

  {
    path: 'login',
    component: LoginPage,
    canActivate: [guestGuard]
  },

  {
    path: 'register',
    component: RegisterPage,
    canActivate: [guestGuard]
  },

  {
    path: 'home',
    component: HomePage,
    canActivate: [authGuard]
  },

  {
    path: 'clubs',
    component: Clubs,
    canActivate: [authGuard]
  },

  {
    path: 'clubs/:id',
    component: ClubDetail,
    canActivate: [authGuard]
  },

  {
    path: 'club-manage',
    component: ClubManage,
    canActivate: [clubManagerGuard]
  },

  {
    path: 'club-manage/:id',
    component: ClubManage,
    canActivate: [clubManagerGuard]
  },

  {
    path: 'clubs/:id/stats',
    component: ClubStats,
    canActivate: [clubManagerGuard]
  },

  {
    path: 'events',
    component: Events,
    canActivate: [authGuard]
  },

  {
    path: 'events/:id',
    component: EventDetail,
    canActivate: [authGuard]
  },

  {
    path: 'event-manage',
    component: EventManage,
    canActivate: [clubManagerGuard]
  },

  {
    path: 'event-manage/:id',
    component: EventManage,
    canActivate: [clubManagerGuard]
  },

  {
    path: 'my-registrations',
    component: MyRegistrations,
    canActivate: [studentGuard]
  },

  {
    path: 'events/:id/registrations',
    component: EventRegistrations,
    canActivate: [clubManagerGuard]
  },

  {
    path: '**',
    redirectTo: 'home'
  }
];