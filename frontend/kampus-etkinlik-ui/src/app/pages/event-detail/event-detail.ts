import { Component, inject, OnInit, signal } from '@angular/core'; // Angular componenti, servis enjeksiyonu, OnInit ve signal yapısını kullanmak için gerekli araçları içe aktarır.
import { HttpErrorResponse } from '@angular/common/http'; // Backendden gelen HTTP hatalarını yakalamak için kullanılır.
import { ActivatedRoute } from '@angular/router'; // URL içindeki etkinlik ID değerini almak için kullanılır.

import { AuthService } from '../../core/services/auth.service'; // Giriş yapan kullanıcının rol bilgilerine erişmemizi sağlar.
import { EventService } from '../../core/services/event.service'; // Etkinlik detayını backendden almak için kullanılır.
import { RegistrationService } from '../../core/services/registration.service'; // Kullanıcıyı etkinliğe kaydetmek için kullanılır.
import { EventResponse } from '../../core/models/api.models'; // Backendden gelen etkinlik nesnesinin TypeScript tipidir.
import { getApiErrorMessage } from '../../core/utils/api-error'; // Backend hatalarını kullanıcıya gösterilecek anlaşılır mesaja dönüştürür.

@Component({ // Bu classın Angular componenti olduğunu belirtir.
  selector: 'app-event-detail', // Componentin selector adını belirler.
  standalone: true, // Componentin NgModule kullanmadan bağımsız çalışmasını sağlar.
  template: `
    <!-- Etkinlik detay sayfasının tamamını kapsar -->
    <section class="event-detail-page">

      <!-- Sayfanın üst başlık alanı -->
      <div class="page-header">
        <div>
          <h1>Etkinlik Detayı</h1> <!-- Sayfanın ana başlığıdır. -->
          <p>Etkinliğe ait detaylı bilgileri buradan görüntüleyebilirsiniz.</p> <!-- Sayfanın kısa açıklamasıdır. -->
        </div>
      </div>

      <!-- Backend isteği devam ederken gösterilir -->
      @if (loading()) {
        <div class="page-message">
          Etkinlik bilgileri yükleniyor...
        </div>
      }

      <!-- Backend isteğinde hata oluşursa gösterilir -->
      @if (errorMessage()) {
        <div class="page-message error-message">
          {{ errorMessage() }}
        </div>
      }

      <!-- Backendden etkinlik başarıyla geldiyse detay kartını gösterir -->
      @if (event(); as eventItem) {
        <section class="detail-card">

          <!-- Etkinliğin başlık kısmını gösterir -->
          <div class="detail-card-header">
            <div>
              <span class="category-badge">
                {{ eventItem.category }}
              </span> <!-- Etkinliğin kategorisini turuncu etiket olarak gösterir. -->

              <h2>
                {{ eventItem.title }}
              </h2> <!-- Etkinliğin başlığını gösterir. -->

              <p>
                {{ eventItem.description }}
              </p> <!-- Etkinlik açıklamasını gösterir. -->
            </div>

            <!-- Etkinliğin durumunu gösterir -->
            @if (eventItem.status === 'Active') {
              <span class="status-badge status-active">
                Aktif
              </span>
            } @else {
              <span class="status-badge status-passive">
                {{ eventItem.status }}
              </span>
            }
          </div>

          <!-- Etkinlikle ilgili temel bilgileri grid şeklinde gösterir -->
          <div class="detail-grid">

            <!-- Kulüp bilgisi -->
            <div class="detail-item">
              <span class="detail-label">
                Kulüp
              </span>
              <span class="detail-value">
                {{ eventItem.clubName }}
              </span>
            </div>

            <!-- Tarih bilgisi -->
            <div class="detail-item">
              <span class="detail-label">
                Tarih
              </span>
              <span class="detail-value">
                {{ eventItem.startDate }}
              </span>
            </div>

            <!-- Konum bilgisi -->
            <div class="detail-item">
              <span class="detail-label">
                Konum
              </span>
              <span class="detail-value">
                {{ eventItem.location }}
              </span>
            </div>

            <!-- Kapasite bilgisi -->
            <div class="detail-item">
              <span class="detail-label">
                Kapasite
              </span>
              <span class="detail-value">
                {{ eventItem.capacity }} kişi
              </span>
            </div>

            <!-- Katılım tipini kullanıcıya Türkçe olarak gösterir -->
            <div class="detail-item">
              <span class="detail-label">
                Katılım Tipi
              </span>

              @if (eventItem.visibility === 'Public') {
                <span class="detail-value">
                  Herkese Açık
                </span>
              } @else {
                <span class="detail-value">
                  Onay Gerekli
                </span>
              }
            </div>

            <!-- Etkinliğin oluşturulma tarihini gösterir -->
            <div class="detail-item">
              <span class="detail-label">
                Oluşturulma Tarihi
              </span>
              <span class="detail-value">
                {{ eventItem.createdAt }}
              </span>
            </div>

          </div>

          <!-- Student veya ClubManager kullanıcıların kayıt olabilmesini sağlar -->
          @if (auth.hasRole('Student') || auth.hasRole('ClubManager')) {
            <div class="detail-actions">
              <button
                class="register-button"
                type="button"
                [disabled]="registering()"
                (click)="register()"
              >
                {{ registering() ? 'Kayıt Yapılıyor...' : 'Etkinliğe Kayıt Ol' }}
              </button>
            </div>
          }

          <!-- Kayıt işlemi başarılı olduğunda gösterilir -->
          @if (successMessage()) {
            <div class="success-message">
              {{ successMessage() }}
            </div>
          }

        </section>
      }

    </section>
  `,
  styleUrl: './event-detail.scss' // Bu componentin tasarımını event-detail.scss dosyasından almasını sağlar.
})
export class EventDetail implements OnInit { // Etkinlik detay sayfasının TypeScript classıdır ve OnInit kullanır.
  readonly auth = inject(AuthService); // Giriş yapan kullanıcının rolünü kontrol etmek için AuthService'i enjekte eder.
  private readonly route = inject(ActivatedRoute); // URL içindeki etkinlik ID değerini okumak için ActivatedRoute'u enjekte eder.
  private readonly eventService = inject(EventService); // Etkinlik detayını backendden çekmek için EventService'i enjekte eder.
  private readonly registrationService = inject(RegistrationService); // Etkinlik kayıt işlemini yapmak için RegistrationService'i enjekte eder.

  readonly event = signal<EventResponse | null>(null); // Backendden gelen etkinlik detayını tutar.
  readonly loading = signal(false); // Etkinlik detayının yüklenip yüklenmediğini tutar.
  readonly registering = signal(false); // Etkinliğe kayıt işleminin devam edip etmediğini tutar.
  readonly errorMessage = signal(''); // Kullanıcıya gösterilecek hata mesajını tutar.
  readonly successMessage = signal(''); // Kayıt işlemi başarılı olduğunda gösterilecek mesajı tutar.


  ngOnInit(): void { // Sayfa ilk açıldığında otomatik olarak çalışır.
    const id = Number(this.route.snapshot.paramMap.get('id')); // URL içindeki id parametresini alır ve number tipine dönüştürür.

    if (!Number.isInteger(id) || id <= 0) { // ID geçerli bir pozitif tam sayı değilse kontrol içerisine girer.
      this.errorMessage.set('Geçersiz etkinlik ID.'); // Kullanıcıya geçersiz ID mesajını gösterir.
      return; // Metodun devam etmesini engeller.
    }

    this.loadEvent(id); // URLden alınan IDye göre etkinlik detayını backendden getirir.
  }


  loadEvent(id: number): void { // Verilen etkinlik ID değerine göre backendden etkinlik detayını getirir.
    this.loading.set(true); // Veri yükleme işleminin başladığını belirtir.
    this.errorMessage.set(''); // Daha önce gösterilmiş hata mesajını temizler.

    this.eventService.getById(id).subscribe({ // EventService içindeki getById metoduyla backend isteği gönderir.
      next: event => { // Backend isteği başarılı olduğunda çalışır.
        this.event.set(event); // Backendden gelen etkinlik bilgisini event signalına aktarır.
        this.loading.set(false); // Yükleme işleminin tamamlandığını belirtir.
      },
      error: (error: HttpErrorResponse) => { // Backend isteği hata verdiğinde çalışır.
        this.errorMessage.set( // Kullanıcıya gösterilecek hata mesajını belirler.
          getApiErrorMessage(error, 'Etkinlik alınamadı.') // Backend hatasını daha anlaşılır bir mesaja dönüştürür.
        );
        this.loading.set(false); // Hata olsa bile yükleme işlemini sonlandırır.
      }
    });
  }


  register(): void { // Giriş yapan kullanıcıyı görüntülenen etkinliğe kaydeder.
    const eventItem = this.event(); // Ekranda bulunan etkinlik bilgisini eventItem değişkenine alır.

    if (!eventItem) { // Etkinlik bilgisi henüz yüklenmemişse kontrol içerisine girer.
      return; // Kayıt işleminin yapılmasını engeller.
    }

    this.registering.set(true); // Kayıt işleminin başladığını belirtir.
    this.errorMessage.set(''); // Önceki hata mesajını temizler.
    this.successMessage.set(''); // Önceki başarı mesajını temizler.

    this.registrationService.register(eventItem.id).subscribe({ // Etkinlik ID değerini backenddeki kayıt metoduna gönderir.
      next: registration => { // Kayıt işlemi başarılı olduğunda çalışır.
        this.successMessage.set( // Kullanıcıya başarılı kayıt mesajı gösterir.
          `Kayıt oluşturuldu. Durum: ${registration.approvalStatus}` // Backendden gelen kayıt durumunu mesaj içinde gösterir.
        );
        this.registering.set(false); // Kayıt işleminin tamamlandığını belirtir.
      },
      error: (error: HttpErrorResponse) => { // Kayıt işlemi sırasında backend hata döndürürse çalışır.
        this.errorMessage.set( // Kullanıcıya hata mesajını gösterir.
          getApiErrorMessage(error, 'Etkinliğe kayıt olunamadı.') // Backend hatasını kullanıcı dostu mesaja dönüştürür.
        );
        this.registering.set(false); // Hata olsa bile kayıt işleminin bittiğini belirtir.
      }
    });
  }
}