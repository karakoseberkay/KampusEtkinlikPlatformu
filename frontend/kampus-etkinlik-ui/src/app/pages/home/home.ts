import {
  Component,
  inject,
  signal
} from '@angular/core';

import {
  HttpErrorResponse
} from '@angular/common/http';

import { finalize } from 'rxjs';

import {
  AuthService
} from '../../core/services/auth.service';

@Component({
  selector: 'app-home-page',
  standalone: true,
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class HomePage {
  readonly authService =
    inject(AuthService);

  readonly testingToken =
    signal(false);

  readonly successMessage =
    signal<string | null>(null);

  readonly errorMessage =
    signal<string | null>(null);

  testProtectedEndpoint(): void {
    this.testingToken.set(true);
    this.successMessage.set(null);
    this.errorMessage.set(null);

    this.authService
      .getMe()
      .pipe(
        finalize(() => {
          this.testingToken.set(false);
        })
      )
      .subscribe({
        next: response => {
          this.successMessage.set(
            `JWT doğrulandı. Kullanıcı: ${response.fullName}`
          );
        },
        error: (
          error: HttpErrorResponse
        ) => {
          this.errorMessage.set(
            `JWT testi başarısız: ${error.status}`
          );
        }
      });
  }

  logout(): void {
    this.authService.logout();
  }
}