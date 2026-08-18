import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class LoginPage {
  private readonly formBuilder = inject(FormBuilder); // form oluşturmamızı sağlar
  private readonly authService = inject(AuthService); // login isteğini backende göndermeyi sağlar
  private readonly router = inject(Router); // login başarılı olunca kullanıcıyı farklı routelara yönlendirmemizi sağlar
  private readonly activatedRoute = inject(ActivatedRoute); // mevcut routeun parametrelerine erişmemizi sağlar

  readonly loading = signal(false); // giriş işleminin devam edip etmediğini tutar
  readonly errorMessage = signal<string | null>(null); // kullanıcıya gösterilecek hata mesajını tutar

  readonly form = this.formBuilder.nonNullable.group({ // login formunu ve validation kurallarını oluşturur
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

  submit(): void { // form gönderildiğinde login işlemini başlatır
    if (this.form.invalid) {
      this.form.markAllAsTouched(); // form hatalıysa tüm alanların validationlarını gösterir
      return;
    }

    this.loading.set(true);//loading başlıyor
    this.errorMessage.set(null);//hata temizleniyor

    this.authService
      .login(this.form.getRawValue()) // form verilerini AuthService üzerinden backende gönderir
      .pipe(
        finalize(() => this.loading.set(false)) // işlem başarılı veya hatalı bittiğinde loadingi kapatır
      )
      .subscribe({
        next: () => {
          const requestedReturnUrl = this.activatedRoute.snapshot.queryParamMap.get('returnUrl'); // authGuarddan gelen dönüş urlini alır

          const returnUrl = requestedReturnUrl?.startsWith('/') ? requestedReturnUrl : '/home';
            
            

          void this.router.navigateByUrl(returnUrl); // kullanıcıyı gitmek istediği sayfaya veya ana sayfaya yönlendirir
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(this.getErrorMessage(error));
        }
      });
  }

  private getErrorMessage(error: HttpErrorResponse): string { // backendden gelen login hatasını kullanıcı mesajına çevirir
    if (error.status === 0) {
      return 'Backend bağlantısı kurulamadı. API ve CORS ayarlarını kontrol et.';
    }

    if (error.status === 401) {
      return 'E-posta veya şifre hatalı.';
    }

    if (typeof error.error?.message === 'string') {//object
      return error.error.message;
    }

    if (typeof error.error === 'string') {//string
      return error.error;
    }

    return 'Giriş yapılırken beklenmeyen bir hata oluştu.';
  }
}