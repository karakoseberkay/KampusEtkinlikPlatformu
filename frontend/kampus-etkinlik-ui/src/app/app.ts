import {
  Component,
  inject
} from '@angular/core';

import {
  RouterLink,
  RouterOutlet
} from '@angular/router';

import {
  AuthService
} from './core/services/auth.service';


@Component({
  selector: 'app-root',
  standalone: true,

  imports: [
    RouterOutlet,
    RouterLink
  ],

  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {

  readonly auth =
    inject(AuthService);

}