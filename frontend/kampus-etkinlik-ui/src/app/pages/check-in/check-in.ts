import { Component, inject, OnInit, signal } from '@angular/core'; // component oluşturmak servisleri DI ile almak açılış anını yakalamak ve signal kullanmak için
import { HttpErrorResponse } from '@angular/common/http'; // backendden gelen HTTP hata bilgilerine erişmek için
import { ActivatedRoute, Router } from '@angular/router'; // mevcut URLdeki parametreleri okumak ve başka sayfaya yönlendirmek için
import { EventService } from '../../core/services/event.service'; // qr tokenını backende göndererek check-in işlemini yapmak için
import { getApiErrorMessage } from '../../core/utils/api-error'; // backend hatalarını kullanıcıya gösterilecek mesaja çevirmek için

@Component({
  selector: 'app-check-in', // componentin HTML tarafında kullanılabilecek selector adını belirler
  standalone: true, // componentin NgModule olmadan bağımsız çalışmasını sağlar
  imports: [], // bu component templateinde ekstra Angular veya PrimeNG modülü kullanılmadığı için boş bırakılır
  template: `
    <section class="check-in-page">
      <div class="check-in-card">
        <div class="check-in-icon">✓</div>

        <h1>Event Check-In</h1>

        <!-- check-in isteği devam ederken yükleniyor bilgisini gösterir -->
        @if (checkingIn()) {
          <p class="check-in-description">
            Your QR code is being verified...
          </p>

          <div class="loading-message">
            Checking your registration
          </div>
        }

        <!-- backend check-in işlemini başarılı tamamladıysa sonucu gösterir -->
        @if (successMessage()) {
          <div class="result-message success-result">
            <strong>Check-In Successful</strong>
            <span>{{ successMessage() }}</span>

            @if (checkedInAt()) {
              <small>{{ formatCheckedInAt() }}</small>
            }
          </div>
        }

        <!-- backend check-in işlemini reddederse hata mesajını gösterir -->
        @if (errorMessage()) {
          <div class="result-message error-result">
            <strong>Check-In Failed</strong>
            <span>{{ errorMessage() }}</span>
          </div>
        }

        <!-- işlem bittikten sonra ana sayfaya dönme butonunu gösterir -->
        @if (!checkingIn()) {
          <button class="home-button" type="button" (click)="goHome()">
            Go to Home
          </button>
        }
      </div>
    </section>
  `,
  styleUrl: './check-in.scss' // componentin tasarım dosyasını bağlar
})
export class CheckIn implements OnInit {
  private readonly route = inject(ActivatedRoute); // açılan check-in URLindeki query parametrelerini okumamızı sağlar
  private readonly router = inject(Router); // kullanıcıyı başka sayfalara yönlendirmemizi sağlar
  private readonly eventService = inject(EventService); // tokenı backende gönderip check-in isteği yapmak için servisi DI ile alır

  readonly checkingIn = signal(false); // check-in isteğinin devam edip etmediğini tutar
  readonly successMessage = signal(''); // başarılı check-in mesajını tutar
  readonly errorMessage = signal(''); // başarısız check-in mesajını tutar
  readonly checkedInAt = signal(''); // başarılı check-in zamanını tutar

  ngOnInit(): void { // component açıldığında Angular tarafından otomatik çalıştırılır
    const token = this.route.snapshot.queryParamMap.get('token');
    // snapshot mevcut URLnin o anki halini alır queryParamMap ise ?token= değerine ulaşmamızı sağlar

    if (!token || !token.trim()) {
      this.errorMessage.set('QR code token was not found.');
      return; // URLde token yoksa backende istek göndermeden işlemi durdurur
    }

    this.performCheckIn(token); // URLden alınan token ile check-in işlemini başlatır
  }

  private performCheckIn(token: string): void { // sadece bu component içinde kullanılan asıl check-in işlemini yapar
    if (this.checkingIn()) {
      return; // devam eden bir istek varsa ikinci kez check-in isteği gönderilmesini engeller
    }

    this.checkingIn.set(true); // backend isteğinin başladığını belirtir
    this.errorMessage.set('');
    this.successMessage.set(''); // önceki mesajları temizler

    this.eventService.checkIn({ token }).subscribe({
      // EventServicedeki Observable HTTP isteğini subscribe ile dinler
      next: response => {
        this.successMessage.set(response.message); // backendden gelen başarı mesajını ekrana göstermek için saklar
        this.checkedInAt.set(response.checkedInAt); // backendin kaydettiği check-in zamanını saklar
        this.checkingIn.set(false); // işlem başarılı olduğunda yükleniyor durumunu kapatır
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(getApiErrorMessage(error, 'Check-in could not be completed.'));
        // backend hatasını kullanıcıya gösterilecek anlaşılır mesaja çevirir

        this.checkingIn.set(false); // hata durumunda da yükleniyor durumunu kapatır
      }
    });
  }

  formatCheckedInAt(): string {
    const checkedInAt = this.checkedInAt(); // signal içinde tutulan check-in zamanını alır

    if (!checkedInAt) {
      return ''; // check-in zamanı yoksa boş metin döndürür
    }

    return new Date(checkedInAt).toLocaleString();
    // backendden gelen UTC zamanı Date nesnesine çevirip kullanıcının yerel tarih ve saat formatında gösterir
  }

  goHome(): void {
    void this.router.navigate(['/home']);
    // Router ile kullanıcıyı home sayfasına yönlendirir void ise Promise sonucunu kullanmayacağımızı belirtir
  }
}