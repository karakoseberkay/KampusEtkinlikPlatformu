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
  Router,
  RouterLink
} from '@angular/router';

import { finalize } from 'rxjs';

import {
  AuthService
} from '../../core/services/auth.service';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './register.html',
  styleUrl: './register.scss'
})
export class RegisterPage {
  private readonly formBuilder =
    inject(FormBuilder);

  private readonly authService =
    inject(AuthService);

  private readonly router =
    inject(Router);

  readonly loading = signal(false);

  readonly errorMessage =
    signal<string | null>(null);

  readonly form =
    this.formBuilder.nonNullable.group({
      fullName: [
        '',
        [
          Validators.required,
          Validators.maxLength(150)
        ]
      ],
      department: [
        '',
        [
          
          Validators.maxLength(150)
        ]
      ],
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
      .register(this.form.getRawValue())
      .pipe(
        finalize(() => {
          this.loading.set(false);
        })
      )
      .subscribe({
        next: () => {
          void this.router.navigateByUrl(
            '/home'
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

    if (
      typeof error.error?.message
      === 'string'
    ) {
      return error.error.message;
    }

    if (typeof error.error === 'string') {
      return error.error;
    }

    return 'Kayıt oluşturulurken beklenmeyen bir hata oluştu.';
  }
}