import { Component, inject, signal } from '@angular/core'; // Component oluşturmak, servisleri inject etmek ve signal kullanmak için gerekli Angular araçlarını içe aktarır.
import { HttpErrorResponse } from '@angular/common/http'; // Backendden gelen HTTP hatalarını yakalamak için kullanılır.
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'; // Login formunu oluşturmak ve validation kurallarını kullanmak için gerekli yapıları içe aktarır.
import { ActivatedRoute, Router, RouterLink } from '@angular/router'; // URL bilgilerini almak, yönlendirme yapmak ve HTML içinde routerLink kullanmak için gerekli araçları içe aktarır.
import { finalize } from 'rxjs'; // Backend isteği başarılı veya hatalı sonuçlandığında ortak bir işlem çalıştırmamızı sağlar.
import { AuthService } from '../../core/services/auth.service'; // Login isteğini backend'e göndermek için kullandığımız servistir.

@Component({ // Bu classın Angular componenti olduğunu belirtir.
  selector: 'app-login-page', // Componentin selector adını belirler.
  standalone: true, // Componentin herhangi bir NgModule olmadan bağımsız çalışmasını sağlar.
  imports: [ReactiveFormsModule, RouterLink], // HTML içinde Reactive Form ve routerLink kullanabilmemizi sağlar.
  templateUrl: './login.html', // Componentin HTML dosyasını belirtir.
  styleUrl: './login.scss' // Componentin SCSS dosyasını belirtir.
})
export class LoginPage { // Giriş Yap sayfasının TypeScript classıdır.
  private readonly formBuilder = inject(FormBuilder); // Login formunu oluşturmak için FormBuilder servisini enjekte eder.
  private readonly authService = inject(AuthService); // Login isteğini backend'e göndermek için AuthService'i enjekte eder.
  private readonly router = inject(Router); // Login başarılı olduğunda kullanıcıyı başka bir sayfaya yönlendirmek için Router'ı enjekte eder.
  private readonly activatedRoute = inject(ActivatedRoute); // URL içindeki returnUrl gibi query parametrelerine erişmek için kullanılır.

  readonly loading = signal(false); // Login işleminin devam edip etmediğini tutar.
  readonly errorMessage = signal<string | null>(null); // Kullanıcıya gösterilecek login hata mesajını tutar.

  readonly form = this.formBuilder.nonNullable.group({ // Login formunu ve form alanlarının validation kurallarını oluşturur.
    email: ['', [Validators.required, Validators.email]], // E-posta alanını zorunlu yapar ve geçerli e-posta formatında olmasını ister.
    password: ['', [Validators.required, Validators.minLength(8)]] // Şifre alanını zorunlu yapar ve minimum 8 karakter olmasını ister.
  });


  submit(): void { // Kullanıcı Giriş Yap butonuna bastığında çalışır.
    if (this.form.invalid) { // Form validation kurallarından geçmiyorsa kontrol içerisine girer.
      this.form.markAllAsTouched(); // Bütün form alanlarını touched yaparak validation mesajlarının görünmesini sağlar.
      return; // Geçersiz formun backend'e gönderilmesini engeller.
    }

    this.loading.set(true); // Login işleminin başladığını belirtir.
    this.errorMessage.set(null); // Daha önce gösterilmiş hata mesajını temizler.

    this.authService.login(this.form.getRawValue()) // Formdaki e-posta ve şifre bilgisini AuthService üzerinden backend'e gönderir.
      .pipe(
        finalize(() => this.loading.set(false)) // Login başarılı da olsa hatalı da olsa işlem bittiğinde loading durumunu kapatır.
      )
      .subscribe({
        next: () => { // Backend login işlemini başarılı tamamladığında çalışır.
          const requestedReturnUrl = this.activatedRoute.snapshot.queryParamMap.get('returnUrl'); // AuthGuard tarafından URLye eklenmiş returnUrl parametresini alır.
          const returnUrl = requestedReturnUrl?.startsWith('/') ? requestedReturnUrl : '/home'; // Geçerli bir returnUrl varsa onu, yoksa ana sayfayı hedef olarak belirler.
          void this.router.navigateByUrl(returnUrl); // Kullanıcıyı belirlenen sayfaya yönlendirir.
        },
        error: (error: HttpErrorResponse) => { // Backend login isteği hata verdiğinde çalışır.
          this.errorMessage.set(this.getErrorMessage(error)); // HTTP hatasını kullanıcıya gösterilecek anlaşılır mesaja dönüştürür.
        }
      });
  }


  private getErrorMessage(error: HttpErrorResponse): string { // Backendden gelen login hatasını kullanıcıya gösterilecek mesaja dönüştürür.
    if (error.status === 0) { // Backend sunucusuna hiç bağlantı kurulamadıysa çalışır.
      return 'Backend bağlantısı kurulamadı. API ve CORS ayarlarını kontrol et.'; // Kullanıcıya bağlantı hatasını gösterir.
    }

    if (error.status === 401) { // Backend 401 Unauthorized hatası döndürdüyse çalışır.
      return 'E-posta veya şifre hatalı.'; // Kullanıcıya giriş bilgilerinin yanlış olduğunu bildirir.
    }

    if (typeof error.error?.message === 'string') { // Backend hata cevabını message alanı olan bir object şeklinde gönderdiyse çalışır.
      return error.error.message; // Backendden gelen message değerini kullanıcıya gösterir.
    }

    if (typeof error.error === 'string') { // Backend hata cevabını direkt string olarak gönderdiyse çalışır.
      return error.error; // Backendden gelen string hata mesajını kullanıcıya gösterir.
    }

    return 'Giriş yapılırken beklenmeyen bir hata oluştu.'; // Yukarıdaki durumların hiçbirine girmeyen hatalarda genel mesaj gösterir.
  }
}