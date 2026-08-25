import { Component, inject, signal } from '@angular/core'; // Component oluşturmak, servis inject etmek ve signal kullanmak için
import { HttpErrorResponse } from '@angular/common/http'; // Backendden gelen HTTP hatalarını yakalamak için
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'; // Reactive Form ve validation işlemleri için
import { Router, RouterLink } from '@angular/router'; // Sayfa yönlendirmeleri ve routerLink kullanımı için
import { finalize } from 'rxjs'; // İstek başarılı veya hatalı bittiğinde ortak işlem çalıştırmak için
import { AuthService } from '../../core/services/auth.service'; // Kullanıcı kayıt işlemini backend'e göndermek için

@Component({ // Bu classın Angular componenti olduğunu belirtir
  selector: 'app-register-page', // Componentin selector adı
  standalone: true, // Componentin NgModule olmadan bağımsız çalışmasını sağlar
  imports: [ReactiveFormsModule, RouterLink], // Reactive Form ve routerLink kullanımını sağlar
  templateUrl: './register.html', // Componentin HTML dosyası
  styleUrl: './register.scss' // Componentin SCSS dosyası
})
export class RegisterPage {
  private readonly formBuilder = inject(FormBuilder); // Reactive Form oluşturmak için
  private readonly authService = inject(AuthService); // Kayıt işlemini backend'e göndermek için
  private readonly router = inject(Router); // Kayıt sonrası yönlendirme yapmak için

  readonly loading = signal(false); // Kayıt işleminin devam edip etmediğini tutar
  readonly errorMessage = signal<string | null>(null); // Kullanıcıya gösterilecek hata mesajını tutar

  readonly form = this.formBuilder.nonNullable.group({ // Kayıt formunu ve validation kurallarını oluşturur
    fullName: ['', [Validators.required, Validators.maxLength(150)]], // Ad Soyad zorunlu ve maksimum 150 karakter
    department: ['', [Validators.maxLength(150)]], // Bölüm isteğe bağlı ve maksimum 150 karakter
    email: ['', [Validators.required, Validators.email]], // E-posta zorunlu ve geçerli formatta olmalı
    password: ['', [Validators.required, Validators.minLength(8)]] // Şifre zorunlu ve minimum 8 karakter
  });

  submit(): void { // Kullanıcı Kayıt Ol butonuna bastığında çalışır
    if (this.form.invalid) { // Form validation kurallarından geçmiyorsa
      this.form.markAllAsTouched(); // Hatalı alanların validation mesajlarını görünür yapar
      return; // Formun backend'e gönderilmesini engeller
    }

    this.loading.set(true); // Kayıt işlemini başlatır
    this.errorMessage.set(null); // Önceki hata mesajını temizler

    this.authService
      .register(this.form.getRawValue()) // Form bilgilerini AuthService üzerinden backend'e gönderir
      .pipe(
        finalize(() => this.loading.set(false)) // İşlem başarılı veya hatalı bitince loading durumunu kapatır
      )
      .subscribe({
        next: () => { // Kayıt işlemi başarılı olduğunda çalışır
          void this.router.navigateByUrl('/home'); // Kullanıcıyı Ana Sayfaya yönlendirir
        },
        error: (error: HttpErrorResponse) => { // Backend kayıt isteği hata verdiğinde çalışır
          this.errorMessage.set(this.getErrorMessage(error)); // Hatayı kullanıcıya gösterilecek mesaja çevirir
        }
      });
  }

  private getErrorMessage(error: HttpErrorResponse): string { // Backend hatasını kullanıcıya gösterilecek mesaja dönüştürür
    if (error.status === 0) { // Backend sunucusuna bağlantı kurulamadıysa
      return 'Could not connect to the backend. Check the API and CORS settings.'; // Bağlantı hatasını bildirir
    }

    if (typeof error.error?.message === 'string') { // Backend message alanında hata mesajı gönderdiyse
      return error.error.message; // Backendden gelen mesajı gösterir
    }

    if (typeof error.error === 'string') { // Backend doğrudan string hata gönderdiyse
      return error.error; // Gelen string hata mesajını gösterir
    }

    return 'An unexpected error occurred while creating the account.'; // Diğer durumlarda genel hata mesajı gösterir
  }
}