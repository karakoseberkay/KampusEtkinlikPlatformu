import {
  inject
} from '@angular/core';

import {
  CanActivateFn,
  Router,
  UrlTree
} from '@angular/router';

import {
  AuthService
} from '../services/auth.service';


function roleGuard(
  role: string
): boolean | UrlTree {

  const authService =
    inject(AuthService);

  const router =
    inject(Router);


  if (
    !authService.hasValidSession()
  ) {
    return router.createUrlTree(
      ['/login']
    );
  }


  if (
    !authService.hasRole(role)
  ) {
    return router.createUrlTree(
      ['/home']
    );
  }


  return true;
}


export const studentGuard:
  CanActivateFn =
  () => roleGuard('Student');


export const clubManagerGuard:
  CanActivateFn =
  () => roleGuard('ClubManager');

  export const adminGuard: CanActivateFn =
  () => {

    const authService =
      inject(AuthService);

    const router =
      inject(Router);


    if (!authService.hasValidSession()) {

      return router.createUrlTree([
        '/login'
      ]);

    }


    const user =
      authService.currentUser();


    if (
      !user
      ||
      !authService.hasRole(
        'ClubManager'
      )
      ||
      user.email.toLowerCase()
        !== 'manager@kampus.com'
    ) {

      return router.createUrlTree([
        '/home'
      ]);

    }


    return true;
  };