import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss'
})
export class RegisterPage {
  private readonly formBuilder = inject(FormBuilder); // form oluşturmamızı sağlar
  private readonly authService = inject(AuthService); // kayıt işlemini yapmamızı sağlar
  private readonly router = inject(Router); // kullanıcıyı farklı routelara yönlendirmemizi sağlar

  readonly loading = signal(false); // kayıt işleminin devam edip etmediğini tutar
  readonly errorMessage = signal<string | null>(null); // kullanıcıya gösterilecek hata mesajını tutar

  readonly form = this.formBuilder.nonNullable.group({ // kayıt formunu ve validation kurallarını oluşturur
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

  submit(): void { // form gönderildiğinde kayıt işlemini başlatır
    if (this.form.invalid) {
      this.form.markAllAsTouched(); // form hatalıysa tüm alanların validationlarını gösterir
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    this.authService
      .register(this.form.getRawValue()) // form verilerini AuthService üzerinden backende gönderir
      .pipe(
        finalize(() => this.loading.set(false)) // işlem başarılı veya hatalı bittiğinde loadingi kapatır
      )
      .subscribe({
        next: () => {
          void this.router.navigateByUrl('/home'); // kayıt başarılıysa kullanıcıyı ana sayfaya yönlendirir
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(this.getErrorMessage(error));
        }
      });
  }

  private getErrorMessage(error: HttpErrorResponse): string { // backendden gelen kayıt hatasını kullanıcı mesajına çevirir
    if (error.status === 0) {
      return 'Backend bağlantısı kurulamadı. API ve CORS ayarlarını kontrol et.';
    }

    if (typeof error.error?.message === 'string') {
      return error.error.message;
    }

    if (typeof error.error === 'string') {
      return error.error;
    }

    return 'Kayıt oluşturulurken beklenmeyen bir hata oluştu.';
  }
}