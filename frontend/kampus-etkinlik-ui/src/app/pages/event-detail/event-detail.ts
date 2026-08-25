import { Component, inject, OnInit, signal } from '@angular/core'; // Component, inject, OnInit ve signal kullanmak için
import { HttpErrorResponse } from '@angular/common/http'; // Backendden gelen HTTP hatalarını yakalamak için
import { ActivatedRoute } from '@angular/router'; // URL içindeki etkinlik IDsini almak için
import { AuthService } from '../../core/services/auth.service'; // Kullanıcının rol bilgilerine erişmek için
import { EventService } from '../../core/services/event.service'; // Etkinlik detayını backendden almak için
import { RegistrationService } from '../../core/services/registration.service'; // Etkinliğe kayıt işlemi yapmak için
import { EventResponse } from '../../core/models/api.models'; // Backendden gelen etkinlik modelini kullanmak için
import { getApiErrorMessage } from '../../core/utils/api-error'; // Backend hatalarını anlaşılır mesaja çevirmek için

@Component({ // Bu classın Angular componenti olduğunu belirtir
  selector: 'app-event-detail', // Componentin selector adı
  standalone: true, // Componentin NgModule olmadan bağımsız çalışmasını sağlar
  template: `
    <!-- Etkinlik detay sayfası -->
    <section class="event-detail-page">

      <!-- Sayfa başlığı -->
      <div class="page-header">
        <div>
          <h1>Etkinlik Detayı</h1>
          <p>Etkinliğe ait detaylı bilgileri buradan görüntüleyebilirsiniz.</p>
        </div>
      </div>

      <!-- Etkinlik bilgileri yüklenirken gösterilir -->
      @if (loading()) {
        <div class="page-message">
          Etkinlik bilgileri yükleniyor...
        </div>
      }

      <!-- Hata mesajı -->
      @if (errorMessage()) {
        <div class="page-message error-message">
          {{ errorMessage() }}
        </div>
      }

      <!-- Etkinlik bilgisi geldiyse detay kartını gösterir -->
      @if (event(); as eventItem) {
        <section class="detail-card">

          <!-- Etkinlik başlığı ve açıklaması -->
          <div class="detail-card-header">
            <div>
              <span class="category-badge">
                {{ eventItem.category }}
              </span> <!-- Etkinlik kategorisini gösterir -->

              <h2>
                {{ eventItem.title }}
              </h2> <!-- Etkinlik başlığını gösterir -->

              <p>
                {{ eventItem.description }}
              </p> <!-- Etkinlik açıklamasını gösterir -->
            </div>

            <!-- Etkinlik durumunu gösterir -->
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

          <!-- Etkinliğin temel bilgileri -->
          <div class="detail-grid">

            <!-- Kulüp bilgisi -->
            <div class="detail-item">
              <span class="detail-label">Kulüp</span>
              <span class="detail-value">{{ eventItem.clubName }}</span>
            </div>

            <!-- Tarih bilgisi -->
            <div class="detail-item">
              <span class="detail-label">Tarih</span>
              <span class="detail-value">{{ eventItem.startDate }}</span>
            </div>

            <!-- Konum bilgisi -->
            <div class="detail-item">
              <span class="detail-label">Konum</span>
              <span class="detail-value">{{ eventItem.location }}</span>
            </div>

            <!-- Kapasite bilgisi -->
            <div class="detail-item">
              <span class="detail-label">Kapasite</span>
              <span class="detail-value">{{ eventItem.capacity }} kişi</span>
            </div>

            <!-- Katılım tipi -->
            <div class="detail-item">
              <span class="detail-label">Katılım Tipi</span>

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

            <!-- Oluşturulma tarihi -->
            <div class="detail-item">
              <span class="detail-label">Oluşturulma Tarihi</span>
              <span class="detail-value">{{ eventItem.createdAt }}</span>
            </div>
          </div>

          <!-- Student veya ClubManager etkinliğe kayıt olabilir -->
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

          <!-- Başarılı kayıt mesajı -->
          @if (successMessage()) {
            <div class="success-message">
              {{ successMessage() }}
            </div>
          }
        </section>
      }
    </section>
  `,
  styleUrl: './event-detail.scss' // Componentin tasarım dosyası
})
export class EventDetail implements OnInit {
  readonly auth = inject(AuthService); // Kullanıcının rolünü kontrol etmek için
  private readonly route = inject(ActivatedRoute); // URL içindeki etkinlik IDsini okumak için
  private readonly eventService = inject(EventService); // Etkinlik detayını backendden almak için
  private readonly registrationService = inject(RegistrationService); // Etkinliğe kayıt işlemini yapmak için

  readonly event = signal<EventResponse | null>(null); // Backendden gelen etkinlik detayını tutar
  readonly loading = signal(false); // Etkinlik bilgilerinin yüklenme durumunu tutar
  readonly registering = signal(false); // Kayıt işleminin devam edip etmediğini tutar
  readonly errorMessage = signal(''); // Hata mesajını tutar
  readonly successMessage = signal(''); // Başarılı kayıt mesajını tutar

  ngOnInit(): void { // Sayfa ilk açıldığında otomatik çalışır
    const id = Number(this.route.snapshot.paramMap.get('id')); // URL içindeki id değerini alıp numbera çevirir

    if (!Number.isInteger(id) || id <= 0) { // ID geçerli pozitif tam sayı değilse
      this.errorMessage.set('Geçersiz etkinlik ID.'); // Hata mesajı gösterir
      return; // Backend isteğinin yapılmasını engeller
    }

    this.loadEvent(id); // Etkinlik detayını backendden getirir
  }

  loadEvent(id: number): void { // Verilen IDye göre etkinlik detayını getirir
    this.loading.set(true); // Yükleme işlemini başlatır
    this.errorMessage.set(''); // Önceki hata mesajını temizler

    this.eventService.getById(id).subscribe({ // EventService üzerinden etkinlik detayını ister
      next: event => { // Backend isteği başarılı olduğunda çalışır
        this.event.set(event); // Gelen etkinlik bilgisini signal içerisine kaydeder
        this.loading.set(false); // Yükleme işlemini bitirir
      },
      error: (error: HttpErrorResponse) => { // Backend isteğinde hata oluşursa
        this.errorMessage.set(
          getApiErrorMessage(error, 'Etkinlik alınamadı.') // Hatayı kullanıcıya uygun mesaja çevirir
        );
        this.loading.set(false); // Hata olsa bile yükleme işlemini bitirir
      }
    });
  }

  register(): void { // Giriş yapan kullanıcıyı etkinliğe kaydeder
    const eventItem = this.event(); // Ekrandaki etkinlik bilgisini alır

    if (!eventItem) { // Etkinlik bilgisi henüz yoksa
      return; // Kayıt işlemini engeller
    }

    this.registering.set(true); // Kayıt işlemini başlatır
    this.errorMessage.set(''); // Önceki hata mesajını temizler
    this.successMessage.set(''); // Önceki başarı mesajını temizler

    this.registrationService.register(eventItem.id).subscribe({ // Etkinlik IDsini backenddeki kayıt metoduna gönderir
      next: registration => { // Kayıt işlemi başarılı olduğunda çalışır
        this.successMessage.set(
          `Kayıt oluşturuldu. Durum: ${registration.approvalStatus}` // Backendden gelen kayıt durumunu gösterir
        );
        this.registering.set(false); // Kayıt işlemini bitirir
      },
      error: (error: HttpErrorResponse) => { // Kayıt sırasında hata oluşursa
        this.errorMessage.set(
          getApiErrorMessage(error, 'Etkinliğe kayıt olunamadı.') // Hatayı kullanıcıya uygun mesaja çevirir
        );
        this.registering.set(false); // Hata olsa bile kayıt işlemini bitirir
      }
    });
  }
}