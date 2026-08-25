import { Component, inject, OnInit, signal } from '@angular/core'; // Component, inject, OnInit ve signal kullanmak için
import { HttpErrorResponse } from '@angular/common/http'; // Backendden gelen HTTP hatalarını yakalamak için
import { ActivatedRoute } from '@angular/router'; // URL içindeki kulüp IDsini almak için
import { ClubService } from '../../core/services/club.service'; // Kulüp istatistiklerini backendden almak için
import { ClubStatsResponse } from '../../core/models/api.models'; // Backendden gelen kulüp istatistik modelini kullanmak için
import { getApiErrorMessage } from '../../core/utils/api-error'; // Backend hatalarını anlaşılır mesaja çevirmek için

@Component({ // Bu classın Angular componenti olduğunu belirtir
  selector: 'app-club-stats', // Componentin selector adı
  standalone: true, // Componentin NgModule olmadan bağımsız çalışmasını sağlar
  template: `
    <!-- Kulüp istatistikleri sayfası -->
    <section class="club-stats-page">

      <!-- Sayfa başlığı -->
      <div class="page-header">
        <div>
          <h1>Kulüp İstatistikleri</h1>
          <p>Kulübün etkinlik ve katılım istatistiklerini görüntüleyebilirsiniz.</p>
        </div>

        <!-- İstatistikleri yeniden yükler -->
        <button class="refresh-button" type="button" [disabled]="loading()" (click)="loadStats()">
          {{ loading() ? 'Yükleniyor...' : 'Verileri Yenile' }}
        </button>
      </div>

      <!-- İstatistikler yüklenirken gösterilir -->
      @if (loading() && !stats()) {
        <div class="page-message">
          Kulüp istatistikleri yükleniyor...
        </div>
      }

      <!-- Hata mesajı -->
      @if (errorMessage()) {
        <div class="page-message error-message">
          {{ errorMessage() }}
        </div>
      }

      <!-- İstatistik bilgileri geldiyse içeriği gösterir -->
      @if (stats(); as statsItem) {

        <!-- Kulüp özeti -->
        <section class="club-summary">
          <span class="summary-label">Kulüp</span> <!-- Bilginin kulüp adı olduğunu belirtir -->
          <h2>{{ statsItem.clubName }}</h2> <!-- Kulüp adını gösterir -->
          <p>Kulübün genel etkinlik ve kayıt durumuna ait özet bilgiler.</p>
        </section>

        <!-- Genel istatistikler -->
        <section class="stats-section">
          <div class="section-header">
            <h2>Genel Bilgiler</h2>
            <p>Kulübün toplam etkinlik ve kayıt sayılarını gösterir.</p>
          </div>

          <div class="stats-grid">
            <!-- Toplam etkinlik -->
            <div class="stat-card">
              <span class="stat-label">Toplam Etkinlik</span>
              <strong class="stat-value">{{ statsItem.totalEventCount }}</strong>
            </div>

            <!-- Aktif etkinlik -->
            <div class="stat-card">
              <span class="stat-label">Aktif Etkinlik</span>
              <strong class="stat-value status-green">{{ statsItem.activeEventCount }}</strong>
            </div>

            <!-- İptal edilen etkinlik -->
            <div class="stat-card">
              <span class="stat-label">İptal Edilen</span>
              <strong class="stat-value status-red">{{ statsItem.cancelledEventCount }}</strong>
            </div>

            <!-- Onaylı kayıt -->
            <div class="stat-card">
              <span class="stat-label">Onaylı Kayıt</span>
              <strong class="stat-value">{{ statsItem.totalApprovedRegistrationCount }}</strong>
            </div>

            <!-- Bekleyen kayıt -->
            <div class="stat-card">
              <span class="stat-label">Bekleyen Kayıt</span>
              <strong class="stat-value status-orange">{{ statsItem.totalPendingRegistrationCount }}</strong>
            </div>

            <!-- Reddedilen kayıt -->
            <div class="stat-card">
              <span class="stat-label">Reddedilen Kayıt</span>
              <strong class="stat-value status-red">{{ statsItem.totalRejectedRegistrationCount }}</strong>
            </div>

            <!-- Genel kayıt oranı -->
            <div class="stat-card rate-card">
              <span class="stat-label">Genel Kayıt Oranı</span>
              <strong class="stat-value status-orange">%{{ statsItem.overallRegistrationRate }}</strong>
            </div>
          </div>
        </section>

        <!-- Etkinlik kayıt oranları grafiği -->
        <section class="chart-section">
          <div class="section-header">
            <h2>Etkinlik Kayıt Oranları</h2>
            <p>Her etkinliğin kapasitesine göre kayıt oranını gösterir.</p>
          </div>

          <!-- Etkinlik yoksa grafik yerine mesaj gösterir -->
          @if (statsItem.events.length === 0) {
            <div class="empty-card">
              Grafik için etkinlik bulunmuyor.
            </div>
          } @else {
            <div class="chart-card">
              <div class="chart-wrapper">

                <!-- Etkinlik sayısına göre yüksekliği değişen SVG grafik -->
                <svg class="registration-chart" width="750" [attr.height]="getChartHeight(statsItem.events.length)">

                  <!-- Etkinlikleri tek tek grafiğe çizer -->
                  @for (event of statsItem.events; track event.eventId; let index = $index) {

                    <!-- Etkinlik başlığı -->
                    <text class="chart-title" x="0" [attr.y]="getTextY(index)">
                      {{ event.title }}
                    </text>

                    <!-- Grafiğin sabit arka plan çubuğu -->
                    <rect
                      class="chart-background"
                      x="350"
                      [attr.y]="getBarY(index)"
                      width="300"
                      height="20"
                      rx="3"
                    ></rect>

                    <!-- Kayıt oranına göre genişliği değişen çubuk -->
                    <rect
                      class="chart-bar"
                      x="350"
                      [attr.y]="getBarY(index)"
                      [attr.width]="getBarWidth(event.registrationRate)"
                      height="20"
                      rx="3"
                    ></rect>

                    <!-- Kayıt oranını yüzde olarak gösterir -->
                    <text
                      class="chart-rate"
                      [attr.x]="getBarTextX(event.registrationRate)"
                      [attr.y]="getTextY(index)"
                    >
                      %{{ event.registrationRate }}
                    </text>
                  }
                </svg>
              </div>
            </div>
          }
        </section>

        <!-- Etkinlik bazlı istatistikler -->
        <section class="events-section">
          <div class="section-header">
            <h2>Etkinlik İstatistikleri</h2>
            <p>Her etkinliğin kapasite ve kayıt durumlarını ayrı ayrı gösterir.</p>
          </div>

          <!-- Kulübün etkinliği yoksa gösterilir -->
          @if (statsItem.events.length === 0) {
            <div class="empty-card">
              Bu kulübe ait etkinlik bulunmuyor.
            </div>
          } @else {

            <!-- Etkinlik istatistikleri tablosu -->
            <div class="table-card">
              <div class="table-wrapper">
                <table class="stats-table">
                  <thead>
                    <tr>
                      <th>Etkinlik</th>
                      <th>Tarih</th>
                      <th>Durum</th>
                      <th>Kapasite</th>
                      <th>Onaylı</th>
                      <th>Bekleyen</th>
                      <th>Reddedilen</th>
                      <th>Kayıt Oranı</th>
                    </tr>
                  </thead>

                  <tbody>
                    <!-- Etkinlik istatistiklerini tabloya ekler -->
                    @for (event of statsItem.events; track event.eventId) {
                      <tr>
                        <td class="event-title">
                          {{ event.title }}
                        </td> <!-- Etkinlik başlığını gösterir -->

                        <td>
                          {{ event.startDate }}
                        </td> <!-- Etkinlik tarihini gösterir -->

                        <!-- Etkinlik durumunu Türkçe gösterir -->
                        <td>
                          @if (event.status === 'Active') {
                            <span class="status-badge status-active">Aktif</span>
                          } @else if (event.status === 'Cancelled') {
                            <span class="status-badge status-cancelled">İptal Edildi</span>
                          } @else {
                            <span class="status-badge status-default">{{ event.status }}</span>
                          }
                        </td>

                        <td>
                          {{ event.capacity }}
                        </td> <!-- Etkinlik kapasitesi -->

                        <td>
                          <span class="count-approved">{{ event.approvedRegistrationCount }}</span>
                        </td> <!-- Onaylı kayıt sayısı -->

                        <td>
                          <span class="count-pending">{{ event.pendingRegistrationCount }}</span>
                        </td> <!-- Bekleyen kayıt sayısı -->

                        <td>
                          <span class="count-rejected">{{ event.rejectedRegistrationCount }}</span>
                        </td> <!-- Reddedilen kayıt sayısı -->

                        <td>
                          <span class="rate-badge">%{{ event.registrationRate }}</span>
                        </td> <!-- Etkinlik kayıt oranı -->
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          }
        </section>
      }
    </section>
  `,
  styleUrl: './club-stats.scss' // Componentin tasarım dosyası
})
export class ClubStats implements OnInit {
  private readonly route = inject(ActivatedRoute); // URL içindeki kulüp IDsini almak için
  private readonly clubService = inject(ClubService); // Kulüp istatistiklerini backendden almak için

  private clubId: number | null = null; // İstatistikleri gösterilecek kulübün IDsini tutar

  readonly stats = signal<ClubStatsResponse | null>(null); // Backendden gelen kulüp istatistiklerini tutar
  readonly loading = signal(false); // İstatistiklerin yüklenme durumunu tutar
  readonly errorMessage = signal(''); // Kullanıcıya gösterilecek hata mesajını tutar

  ngOnInit(): void { // Sayfa ilk açıldığında otomatik çalışır
    const id = Number(this.route.snapshot.paramMap.get('id')); // URL içindeki kulüp IDsini alıp numbera çevirir

    if (!Number.isInteger(id) || id <= 0) { // ID geçerli pozitif tam sayı değilse
      this.errorMessage.set('Geçersiz kulüp ID.'); // Hata mesajı gösterir
      return; // Backend isteğinin yapılmasını engeller
    }

    this.clubId = id; // Geçerli kulüp IDsini kaydeder
    this.loadStats(); // Kulüp istatistiklerini backendden getirir
  }

  loadStats(): void { // Kulübün güncel istatistiklerini backendden getirir
    if (!this.clubId) { // Geçerli kulüp IDsi yoksa
      return; // Backend isteğini engeller
    }

    this.loading.set(true); // Yükleme işlemini başlatır
    this.errorMessage.set(''); // Önceki hata mesajını temizler

    this.clubService.getStats(this.clubId).subscribe({ // ClubService üzerinden istatistik isteği gönderir
      next: stats => { // Backend isteği başarılı olduğunda çalışır
        this.stats.set(stats); // Gelen istatistikleri signal içerisine kaydeder
        this.loading.set(false); // Yükleme işlemini bitirir
      },
      error: (error: HttpErrorResponse) => { // Backend isteğinde hata oluşursa
        this.errorMessage.set(
          getApiErrorMessage(error, 'Kulüp istatistikleri alınamadı.') // Hatayı kullanıcıya uygun mesaja çevirir
        );
        this.loading.set(false); // Hata olsa bile yükleme işlemini bitirir
      }
    });
  }

  getChartHeight(eventCount: number): number { // Etkinlik sayısına göre SVG yüksekliğini hesaplar
    return Math.max(80, eventCount * 50); // Minimum 80px, her etkinlik için 50px alan bırakır
  }

  getBarY(index: number): number { // Her grafik çubuğunun dikey konumunu hesaplar
    return index * 50 + 10; // Her çubuğu öncekinin 50px altına yerleştirir
  }

  getTextY(index: number): number { // Etkinlik adı ve yüzde yazısının dikey konumunu hesaplar
    return index * 50 + 26; // Yazıyı çubuğun ortasına yakın yerleştirir
  }

  getBarWidth(registrationRate: number): number { // Kayıt oranına göre çubuk genişliğini hesaplar
    const rate = Math.max(0, Math.min(registrationRate, 100)); // Oranı 0 ile 100 arasında tutar
    return rate * 3; // %100 değerini 300px genişliğe dönüştürür
  }

  getBarTextX(registrationRate: number): number { // Yüzde yazısının yatay konumunu hesaplar
    return 360 + this.getBarWidth(registrationRate); // Yazıyı çubuğun hemen sağına yerleştirir
  }
}