import { Component, computed, inject, OnInit, signal } from '@angular/core'; // Component, computed, servis enjeksiyonu, OnInit ve signal yapısını kullanmak için gerekli Angular araçlarını içe aktarır.
import { HttpErrorResponse } from '@angular/common/http'; // Backendden gelen HTTP hatalarını yakalamak için kullanılır.
import { RegistrationService } from '../../core/services/registration.service'; // Giriş yapan kullanıcının kendi etkinlik kayıtlarını backendden almak için kullanılır.
import { RegistrationResponse } from '../../core/models/api.models'; // Backendden gelen kayıt nesnesinin TypeScript tipidir.
import { getApiErrorMessage } from '../../core/utils/api-error'; // Backend hatalarını kullanıcıya gösterilecek anlaşılır mesaja dönüştürür.

@Component({ // Bu classın Angular componenti olduğunu belirtir.
  selector: 'app-my-registrations', // Componentin selector adını belirler.
  standalone: true, // Componentin NgModule kullanmadan bağımsız çalışmasını sağlar.
  template: `
    <!-- Kayıtlarım sayfasının tamamını kapsar -->
    <section class="registrations-page">

      <!-- Sayfanın üst başlık alanıdır -->
      <div class="page-header">
        <div>
          <h1>Kayıtlarım</h1> <!-- Sayfanın ana başlığını gösterir. -->
          <p>Katıldığınız ve başvuru yaptığınız etkinlikleri görüntüleyebilirsiniz.</p> <!-- Sayfanın kısa açıklamasını gösterir. -->
        </div>

        <!-- Öğrencinin kayıtlarını backendden tekrar çekmek için kullanılır -->
        <button class="refresh-button" type="button" [disabled]="loading()" (click)="loadRegistrations()">
          {{ loading() ? 'Yükleniyor...' : 'Kayıtları Yenile' }}
        </button>
      </div>

      <!-- Backend isteği devam ederken ve daha önce veri yoksa gösterilir -->
      @if (loading() && registrations().length === 0) {
        <div class="page-message">
          Kayıtlarınız yükleniyor...
        </div>
      }

      <!-- Backend isteği hata verdiğinde gösterilir -->
      @if (errorMessage()) {
        <div class="page-message error-message">
          {{ errorMessage() }}
        </div>
      }

      <!-- Yükleme tamamlandıysa ve hata yoksa özet istatistikleri gösterir -->
      @if (!loading() && !errorMessage()) {
        <section class="summary-section">

          <!-- Bölüm başlığı -->
          <div class="section-header">
            <h2>Katılım Bilgileri</h2> <!-- Öğrencinin kayıt durumlarının özetlendiği bölümün başlığıdır. -->
            <p>Etkinlik kayıtlarınızın güncel durumlarını gösterir.</p> <!-- Bölümün neyi gösterdiğini açıklar. -->
          </div>

          <!-- Özet kutularını grid şeklinde gösterir -->
          <div class="summary-grid">

            <!-- Öğrencinin toplam kayıt sayısını gösterir -->
            <div class="summary-card">
              <span class="summary-label">Toplam Kayıt</span>
              <strong class="summary-value">{{ totalRegistrationCount() }}</strong>
            </div>

            <!-- Onaylanmış kayıtların sayısını gösterir -->
            <div class="summary-card">
              <span class="summary-label">Onaylanan</span>
              <strong class="summary-value approved-value">{{ approvedCount() }}</strong>
            </div>

            <!-- Onay bekleyen kayıtların sayısını gösterir -->
            <div class="summary-card">
              <span class="summary-label">Bekleyen</span>
              <strong class="summary-value pending-value">{{ pendingCount() }}</strong>
            </div>

            <!-- Reddedilen kayıtların sayısını gösterir -->
            <div class="summary-card">
              <span class="summary-label">Reddedilen</span>
              <strong class="summary-value rejected-value">{{ rejectedCount() }}</strong>
            </div>

          </div>
        </section>
      }

      <!-- Öğrencinin hiç etkinlik kaydı bulunmuyorsa gösterilir -->
      @if (!loading() && registrations().length === 0 && !errorMessage()) {
        <div class="empty-card">
          Henüz etkinlik kaydınız bulunmuyor.
        </div>
      }

      <!-- En az bir kayıt varsa kayıt geçmişi tablosunu gösterir -->
      @if (registrations().length > 0) {
        <section class="history-section">

          <!-- Tablo bölümünün başlığıdır -->
          <div class="section-header">
            <h2>Kayıt Geçmişi</h2> <!-- Kayıt listesinin başlığını gösterir. -->
            <p>Başvuru yaptığınız etkinlikleri ve kayıt durumlarını gösterir.</p> <!-- Tablo hakkında kısa açıklama verir. -->
          </div>

          <!-- Tabloyu kart görünümünde tutar -->
          <div class="table-card">
            <!-- Küçük ekranlarda tablonun yatay kaydırılabilmesini sağlar -->
            <div class="table-wrapper">

              <!-- Öğrencinin etkinlik kayıtlarının gösterildiği tablo -->
              <table class="registrations-table">

                <!-- Tablo kolon başlıkları -->
                <thead>
                  <tr>
                    <th>Etkinlik</th> <!-- Etkinlik başlığının bulunduğu kolondur. -->
                    <th>Kulüp</th> <!-- Etkinliği oluşturan kulübün bulunduğu kolondur. -->
                    <th>Kayıt Tarihi</th> <!-- Öğrencinin etkinliğe ne zaman kayıt olduğunu gösterir. -->
                    <th>Durum</th> <!-- Kaydın onay durumunu gösterir. -->
                  </tr>
                </thead>

                <!-- Backendden gelen kayıtları tabloya basar -->
                <tbody>
                  @for (registration of registrations(); track registration.id) {
                    <tr>

                      <!-- Kayıt olunan etkinliğin başlığını gösterir -->
                      <td class="event-title">
                        {{ registration.eventTitle }}
                      </td>

                      <!-- Etkinliği oluşturan kulübün adını gösterir -->
                      <td>
                        {{ registration.clubName }}
                      </td>

                      <!-- Öğrencinin kayıt tarihini gösterir -->
                      <td>
                        {{ registration.registeredAt }}
                      </td>

                      <!-- Kayıt durumunu kullanıcıya Türkçe ve renkli etiket şeklinde gösterir -->
                      <td>
                        @if (registration.approvalStatus === 'Approved') {
                          <span class="status-badge status-approved">
                            Onaylandı
                          </span>
                        } @else if (registration.approvalStatus === 'Pending') {
                          <span class="status-badge status-pending">
                            Bekliyor
                          </span>
                        } @else if (registration.approvalStatus === 'Rejected') {
                          <span class="status-badge status-rejected">
                            Reddedildi
                          </span>
                        } @else {
                          <span class="status-badge status-default">
                            {{ registration.approvalStatus }}
                          </span>
                        }
                      </td>

                    </tr>
                  }
                </tbody>

              </table>
            </div>
          </div>

        </section>
      }

    </section>
  `,
  styleUrl: './my-registrations.scss' // Bu componentin tasarımını my-registrations.scss dosyasından almasını sağlar.
})
export class MyRegistrations implements OnInit { // Kayıtlarım sayfasının TypeScript classıdır ve OnInit yaşam döngüsünü kullanır.
  private readonly registrationService = inject(RegistrationService); // Öğrencinin kayıt işlemlerine erişmek için RegistrationService'i enjekte eder.

  readonly registrations = signal<RegistrationResponse[]>([]); // Backendden gelen kayıt listesini tutar.
  readonly loading = signal(false); // Kayıtlar yüklenirken işlemin devam edip etmediğini tutar.
  readonly errorMessage = signal(''); // Kullanıcıya gösterilecek hata mesajını tutar.

  readonly totalRegistrationCount = computed(() => this.registrations().length); // Öğrencinin toplam etkinlik kayıt sayısını hesaplar.
  readonly approvedCount = computed(() => this.registrations().filter(registration => registration.approvalStatus === 'Approved').length); // Onaylanmış kayıtların sayısını hesaplar.
  readonly pendingCount = computed(() => this.registrations().filter(registration => registration.approvalStatus === 'Pending').length); // Onay bekleyen kayıtların sayısını hesaplar.
  readonly rejectedCount = computed(() => this.registrations().filter(registration => registration.approvalStatus === 'Rejected').length); // Reddedilen kayıtların sayısını hesaplar.


  ngOnInit(): void { // Sayfa ilk açıldığında otomatik olarak çalışır.
    this.loadRegistrations(); // Giriş yapan öğrencinin kendi kayıtlarını backendden getirir.
  }


  loadRegistrations(): void { // Giriş yapan kullanıcının kendi etkinlik kayıtlarını backendden getirir.
    this.loading.set(true); // Backend isteğinin başladığını belirtir.
    this.errorMessage.set(''); // Önceki hata mesajını temizler.

    this.registrationService.getMine().subscribe({ // RegistrationService içindeki getMine metodunu çağırarak giriş yapan kullanıcının kayıtlarını ister.
      next: registrations => { // Backend isteği başarılı olduğunda çalışır.
        this.registrations.set(registrations); // Backendden gelen kayıt listesini registrations signalına aktarır.
        this.loading.set(false); // Yükleme işleminin tamamlandığını belirtir.
      },
      error: (error: HttpErrorResponse) => { // Backend isteği hata verdiğinde çalışır.
        this.errorMessage.set(
          getApiErrorMessage(error, 'Kayıtlar alınamadı.') // Backend hatasını kullanıcıya gösterilecek anlaşılır mesaja dönüştürür.
        );
        this.loading.set(false); // Hata olsa bile yükleme işlemini sonlandırır.
      }
    });
  }
}