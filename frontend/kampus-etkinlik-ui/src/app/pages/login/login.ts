import { Component, inject, signal } from '@angular/core'; // component oluşturmak servisleri DI ile almak ve signal kullanmak için
import { HttpErrorResponse } from '@angular/common/http'; // backendden gelen HTTP hata bilgilerine erişmek için
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'; // reactive login formu oluşturmak ve validation kurallarını kullanmak için
import { ActivatedRoute, Router, RouterLink } from '@angular/router'; // URL query parametrelerini okumak yönlendirme yapmak ve template içinde routerLink kullanmak için
import { finalize } from 'rxjs'; // Observable başarılı veya hatalı tamamlansa da ortak bir işlem çalıştırmak için
import { AuthService } from '../../core/services/auth.service'; // login işlemini backendle gerçekleştirmek ve oturum bilgisini yönetmek için

@Component({ // bu classın Angular componenti olduğunu belirtir
  selector: 'app-login-page', // componentin HTML tarafında kullanılabilecek selector adını belirler
  standalone: true, // componentin NgModule olmadan bağımsız çalışmasını sağlar
  imports: [ReactiveFormsModule, RouterLink], // template içinde reactive form ve routerLink kullanmamızı sağlar
  templateUrl: './login.html', // componentin HTML dosyasını bağlar
  styleUrl: './login.scss' // componentin tasarım dosyasını bağlar
})
export class LoginPage {
  private readonly formBuilder = inject(FormBuilder); // login formunu oluşturmak için FormBuilder servisini DI ile alır
  private readonly authService = inject(AuthService); // login isteğini göndermek ve oturum işlemlerini yapmak için AuthServicei DI ile alır
  private readonly router = inject(Router); // başarılı girişten sonra kullanıcıyı başka bir routea yönlendirmek için
  private readonly activatedRoute = inject(ActivatedRoute); // mevcut URLdeki returnUrl gibi query parametrelerini okumak için

  readonly loading = signal(false); // login isteğinin devam edip etmediğini tutar
  readonly errorMessage = signal<string | null>(null); // login hata mesajını tutar hata yoksa null olabilir

  readonly form = this.formBuilder.nonNullable.group({
    // nonNullable form alanlarının null yerine kendi veri tiplerindeki değerlerle çalışmasını sağlar
    email: ['', [Validators.required, Validators.email]], // email alanını zorunlu yapar ve geçerli email formatında olmasını ister
    password: ['', [Validators.required, Validators.minLength(8)]] // password alanını zorunlu yapar ve minimum 8 karakter olmasını ister
  });

  submit(): void { // kullanıcı login formunu gönderdiğinde çalışır
    if (this.form.invalid) {
      this.form.markAllAsTouched(); // bütün alanları touched yaparak validation hata mesajlarının gösterilmesini sağlar
      return; // form geçersizse backende login isteği gönderilmesini engeller
    }

    this.loading.set(true); // login isteğinin başladığını belirtir
    this.errorMessage.set(null); // önceki hata mesajını temizler

    this.authService.login(this.form.getRawValue())
      // getRawValue formdaki email ve password değerlerini nesne halinde alıp AuthService login metoduna gönderir
      .pipe(finalize(() => this.loading.set(false)))
      // pipe Observable üzerinde ek işlemler uygulamamızı sağlar finalize ise istek başarılı veya hatalı bitse de loadingi false yapar
      .subscribe({
        next: () => {
          // backend login işlemini başarılı tamamladığında çalışır
          const requestedReturnUrl = this.activatedRoute.snapshot.queryParamMap.get('returnUrl');
          // authGuard tarafından login URLine eklenen returnUrl değerini mevcut URLden alır

          const returnUrl = requestedReturnUrl?.startsWith('/') ? requestedReturnUrl : '/home';
          // returnUrl varsa ve uygulama içi bir adres gibi / ile başlıyorsa onu kullanır yoksa home sayfasını kullanır

          void this.router.navigateByUrl(returnUrl);
          // navigateByUrl kullanıcıyı returnUrl içindeki tam adrese yönlendirir void ise dönen Promise sonucunu kullanmayacağımızı belirtir
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(this.getErrorMessage(error));
          // backend login hatasını kullanıcıya gösterilecek anlaşılır mesaja çevirir
        }
      });
  }

  private getErrorMessage(error: HttpErrorResponse): string { // backendden gelen login hatasını kullanıcıya gösterilecek mesaja dönüştürür
    if (error.status === 0) {
      return 'Could not connect to the backend. Check the API and CORS settings.';
      // backend sunucusuna hiç bağlantı kurulamadığında gösterilecek mesajı döndürür
    }

    if (error.status === 401) {
      return 'Incorrect email or password.';
      // backend kullanıcı bilgilerini doğrulayamazsa gösterilecek mesajı döndürür
    }

    if (typeof error.error?.message === 'string') {
      return error.error.message;
      // backend hata cevabını message alanı olan bir nesne şeklinde gönderdiyse o mesajı kullanır
    }

    if (typeof error.error === 'string') {
      return error.error;
      // backend hata cevabını direkt string olarak gönderdiyse o değeri kullanır
    }

    return 'An unexpected error occurred while logging in.';
    // yukarıdaki durumlara uymayan hatalarda genel bir mesaj döndürür
  }
}