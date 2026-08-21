import { Component, inject, signal } from '@angular/core'; // Angular componenti oluşturmak, servisleri inject etmek ve signal kullanmak için gerekli araçları içe aktarır.
import { HttpErrorResponse } from '@angular/common/http'; // Backendden gelen HTTP hatalarını yakalamak için kullanılır.
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'; // Kayıt formunu oluşturmak ve validation kurallarını kullanmak için gerekli yapıları içe aktarır.
import { Router, RouterLink } from '@angular/router'; // Kayıt sonrası yönlendirme yapmak ve template içerisinde routerLink kullanmak için gerekli araçları içe aktarır.
import { finalize } from 'rxjs'; // Backend isteği başarılı veya hatalı bittiğinde ortak bir işlem çalıştırmamızı sağlar.
import { AuthService } from '../../core/services/auth.service'; // Kullanıcı kayıt işlemini backend'e göndermek için kullanılır.

@Component({ // Bu classın Angular componenti olduğunu belirtir.
  selector: 'app-register-page', // Componentin selector adını belirler.
  standalone: true, // Componentin NgModule olmadan bağımsız çalışmasını sağlar.
  imports: [ReactiveFormsModule, RouterLink], // Template içerisinde Reactive Form ve routerLink kullanabilmemizi sağlar.
  templateUrl: './register.html', // Componentin HTML dosyasını belirtir.
  styleUrl: './register.scss' // Componentin SCSS dosyasını belirtir.
})
export class RegisterPage { // Kayıt Ol sayfasının TypeScript classıdır.
  private readonly formBuilder = inject(FormBuilder); // Reactive Form oluşturmak için FormBuilder servisini enjekte eder.
  private readonly authService = inject(AuthService); // Kullanıcı kayıt isteğini backend'e göndermek için AuthService'i enjekte eder.
  private readonly router = inject(Router); // Kayıt başarılı olduğunda kullanıcıyı başka sayfaya yönlendirmek için Router'ı enjekte eder.

  readonly loading = signal(false); // Kayıt işleminin devam edip etmediğini tutar.
  readonly errorMessage = signal<string | null>(null); // Kullanıcıya gösterilecek kayıt hata mesajını tutar.

  readonly form = this.formBuilder.nonNullable.group({ // Kayıt formunu ve form alanlarının validation kurallarını oluşturur.
    fullName: ['', [Validators.required, Validators.maxLength(150)]], // Ad Soyad alanını zorunlu yapar ve maksimum 150 karakter olmasını sağlar.
    department: ['', [Validators.maxLength(150)]], // Bölüm alanını isteğe bağlı bırakır ancak maksimum 150 karakter sınırı koyar.
    email: ['', [Validators.required, Validators.email]], // E-posta alanını zorunlu yapar ve geçerli e-posta formatında olmasını ister.
    password: ['', [Validators.required, Validators.minLength(8)]] // Şifre alanını zorunlu yapar ve minimum 8 karakter olmasını ister.
  });


  submit(): void { // Kullanıcı Kayıt Ol butonuna bastığında çalışır.
    if (this.form.invalid) { // Form validation kurallarından geçmiyorsa kontrol içerisine girer.
      this.form.markAllAsTouched(); // Bütün form alanlarını touched yaparak validation mesajlarının görünmesini sağlar.
      return; // Geçersiz formun backend'e gönderilmesini engeller.
    }

    this.loading.set(true); // Kayıt işleminin başladığını belirtir.
    this.errorMessage.set(null); // Daha önce gösterilmiş hata mesajını temizler.

    this.authService
      .register(this.form.getRawValue()) // Formdaki Ad Soyad, Bölüm, E-posta ve Şifre bilgilerini AuthService üzerinden backend'e gönderir.
      .pipe(
        finalize(() => this.loading.set(false)) // İşlem başarılı veya hatalı sonuçlansa da sonunda loading durumunu kapatır.
      )
      .subscribe({
        next: () => { // Backend kayıt işlemini başarılı tamamladığında çalışır.
          void this.router.navigateByUrl('/home'); // Kullanıcıyı kayıt işleminden sonra Ana Sayfa ekranına yönlendirir.
        },
        error: (error: HttpErrorResponse) => { // Backend kayıt isteği hata verdiğinde çalışır.
          this.errorMessage.set(this.getErrorMessage(error)); // Backend hatasını kullanıcıya gösterilecek anlaşılır mesaja dönüştürür.
        }
      });
  }


  private getErrorMessage(error: HttpErrorResponse): string { // Backendden gelen kayıt hatasını kullanıcıya gösterilecek metne dönüştürür.
    if (error.status === 0) { // Backend sunucusuna bağlantı kurulamadıysa çalışır.
      return 'Backend bağlantısı kurulamadı. API ve CORS ayarlarını kontrol et.'; // Kullanıcıya bağlantı problemini bildirir.
    }

    if (typeof error.error?.message === 'string') { // Backend hata cevabında message alanı varsa çalışır.
      return error.error.message; // Backendden gelen message değerini kullanıcıya gösterir.
    }

    if (typeof error.error === 'string') { // Backend hata cevabını doğrudan string olarak gönderdiyse çalışır.
      return error.error; // Backendden gelen string hata mesajını kullanıcıya gösterir.
    }

    return 'Kayıt oluşturulurken beklenmeyen bir hata oluştu.'; // Tanımlanmamış hata durumlarında genel mesaj gösterir.
  }
}