import {
  Component,
  inject,
  signal
} from '@angular/core';

import {
  HttpErrorResponse
} from '@angular/common/http';

import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  ActivatedRoute,
  Router,
  RouterLink
} from '@angular/router';

import { finalize } from 'rxjs';

import {
  AuthService
} from '../../core/services/auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class LoginPage {
  private readonly formBuilder =
    inject(FormBuilder);

  private readonly authService =
    inject(AuthService);

  private readonly router =
    inject(Router);

  private readonly activatedRoute =
    inject(ActivatedRoute);

  readonly loading = signal(false);

  readonly errorMessage =
    signal<string | null>(null);

  readonly form =
    this.formBuilder.nonNullable.group({
      email: [
        '',
        [
          Validators.required,
          Validators.email
        ]
      ],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8)
        ]
      ]
    });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    this.authService
      .login(this.form.getRawValue())
      .pipe(
        finalize(() => {
          this.loading.set(false);
        })
      )
      .subscribe({
        next: () => {
          const requestedReturnUrl =
            this.activatedRoute.snapshot
              .queryParamMap
              .get('returnUrl');

          const returnUrl =
            requestedReturnUrl?.startsWith('/')
              ? requestedReturnUrl
              : '/home';

          void this.router.navigateByUrl(
            returnUrl
          );
        },
        error: (
          error: HttpErrorResponse
        ) => {
          this.errorMessage.set(
            this.getErrorMessage(error)
          );
        }
      });
  }

  private getErrorMessage(
    error: HttpErrorResponse
  ): string {
    if (error.status === 0) {
      return 'Backend bağlantısı kurulamadı. API ve CORS ayarlarını kontrol et.';
    }

    if (error.status === 401) {
      return 'E-posta veya şifre hatalı.';
    }

    if (
      typeof error.error?.message
      === 'string'
    ) {
      return error.error.message;
    }

    if (typeof error.error === 'string') {
      return error.error;
    }

    return 'Giriş yapılırken beklenmeyen bir hata oluştu.';
  }
}