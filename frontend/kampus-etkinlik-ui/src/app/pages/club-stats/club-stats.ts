import { Component, inject, OnInit, signal } from '@angular/core'; // Angular componenti, servis enjeksiyonu, OnInit ve signal yapısını kullanmak için gerekli araçları içe aktarır.
import { HttpErrorResponse } from '@angular/common/http'; // Backendden gelen HTTP hatalarını yakalamak için kullanılır.
import { ActivatedRoute } from '@angular/router'; // URL içindeki kulüp ID değerine erişmek için kullanılır.
import { ClubService } from '../../core/services/club.service'; // Kulüp istatistiklerini backendden almak için kullanılır.
import { ClubStatsResponse } from '../../core/models/api.models'; // Backendden gelen kulüp istatistiklerinin TypeScript tipidir.
import { getApiErrorMessage } from '../../core/utils/api-error'; // Backend hatalarını kullanıcıya gösterilecek anlaşılır mesaja dönüştürür.

@Component({ // Bu classın Angular componenti olduğunu belirtir.
  selector: 'app-club-stats', // Componentin selector adını belirler.
  standalone: true, // Componentin herhangi bir NgModule olmadan bağımsız çalışmasını sağlar.
  template: `
    <!-- Kulüp istatistikleri sayfasının tamamını kapsar -->
    <section class="club-stats-page">

      <!-- Sayfanın üst başlık alanıdır -->
      <div class="page-header">
        <div>
          <h1>Kulüp İstatistikleri</h1> <!-- Sayfanın ana başlığını gösterir. -->
          <p>Kulübün etkinlik ve katılım istatistiklerini görüntüleyebilirsiniz.</p> <!-- Sayfanın kısa açıklamasını gösterir. -->
        </div>

        <!-- İstatistikleri backendden tekrar çekmek için kullanılır -->
        <button class="refresh-button" type="button" [disabled]="loading()" (click)="loadStats()">
          {{ loading() ? 'Yükleniyor...' : 'Verileri Yenile' }}
        </button>
      </div>

      <!-- Backend isteği devam ederken gösterilir -->
      @if (loading() && !stats()) {
        <div class="page-message">
          Kulüp istatistikleri yükleniyor...
        </div>
      }

      <!-- Backend isteğinde hata oluşursa gösterilir -->
      @if (errorMessage()) {
        <div class="page-message error-message">
          {{ errorMessage() }}
        </div>
      }

      <!-- Backendden istatistik bilgileri başarıyla geldiyse içerikleri gösterir -->
      @if (stats(); as statsItem) {

        <!-- Kulübün adını gösteren üst bilgi kartıdır -->
        <section class="club-summary">
          <span class="summary-label">Kulüp</span> <!-- Bilginin kulüp adı olduğunu belirtir. -->
          <h2>{{ statsItem.clubName }}</h2> <!-- İstatistikleri görüntülenen kulübün adını gösterir. -->
          <p>Kulübün genel etkinlik ve kayıt durumuna ait özet bilgiler.</p> <!-- Bölümün açıklamasını gösterir. -->
        </section>

        <!-- Genel istatistik kartlarının bulunduğu bölüm -->
        <section class="stats-section">
          <div class="section-header">
            <h2>Genel Bilgiler</h2> <!-- Genel istatistik bölümünün başlığını gösterir. -->
            <p>Kulübün toplam etkinlik ve kayıt sayılarını gösterir.</p> <!-- Bölümün kısa açıklamasını gösterir. -->
          </div>

          <!-- İstatistik kartlarını grid şeklinde düzenler -->
          <div class="stats-grid">

            <!-- Toplam etkinlik sayısını gösterir -->
            <div class="stat-card">
              <span class="stat-label">Toplam Etkinlik</span>
              <strong class="stat-value">{{ statsItem.totalEventCount }}</strong>
            </div>

            <!-- Aktif etkinlik sayısını gösterir -->
            <div class="stat-card">
              <span class="stat-label">Aktif Etkinlik</span>
              <strong class="stat-value status-green">{{ statsItem.activeEventCount }}</strong>
            </div>

            <!-- İptal edilmiş etkinlik sayısını gösterir -->
            <div class="stat-card">
              <span class="stat-label">İptal Edilen</span>
              <strong class="stat-value status-red">{{ statsItem.cancelledEventCount }}</strong>
            </div>

            <!-- Toplam onaylı kayıt sayısını gösterir -->
            <div class="stat-card">
              <span class="stat-label">Onaylı Kayıt</span>
              <strong class="stat-value">{{ statsItem.totalApprovedRegistrationCount }}</strong>
            </div>

            <!-- Toplam bekleyen kayıt sayısını gösterir -->
            <div class="stat-card">
              <span class="stat-label">Bekleyen Kayıt</span>
              <strong class="stat-value status-orange">{{ statsItem.totalPendingRegistrationCount }}</strong>
            </div>

            <!-- Toplam reddedilen kayıt sayısını gösterir -->
            <div class="stat-card">
              <span class="stat-label">Reddedilen Kayıt</span>
              <strong class="stat-value status-red">{{ statsItem.totalRejectedRegistrationCount }}</strong>
            </div>

            <!-- Kulübün genel kayıt oranını yüzde olarak gösterir -->
            <div class="stat-card rate-card">
              <span class="stat-label">Genel Kayıt Oranı</span>
              <strong class="stat-value status-orange">%{{ statsItem.overallRegistrationRate }}</strong>
            </div>

          </div>
        </section>

        <!-- Etkinliklerin kayıt oranlarını grafik şeklinde gösteren bölüm -->
        <section class="chart-section">
          <div class="section-header">
            <h2>Etkinlik Kayıt Oranları</h2> <!-- Grafik bölümünün başlığını gösterir. -->
            <p>Her etkinliğin kapasitesine göre kayıt oranını gösterir.</p> <!-- Grafiğin neyi gösterdiğini açıklar. -->
          </div>

          <!-- Kulübün hiç etkinliği yoksa grafik yerine mesaj gösterilir -->
          @if (statsItem.events.length === 0) {
            <div class="empty-card">
              Grafik için etkinlik bulunmuyor.
            </div>
          } @else {
            <!-- SVG grafiğinin taşmasını engelleyen kapsayıcıdır -->
            <div class="chart-card">
              <div class="chart-wrapper">

                <!-- Etkinlik sayısına göre yüksekliği otomatik hesaplanan SVG grafiğidir -->
                <svg class="registration-chart" width="750" [attr.height]="getChartHeight(statsItem.events.length)">

                  <!-- Kulübün bütün etkinliklerini tek tek grafiğe çizer -->
                  @for (event of statsItem.events; track event.eventId; let index = $index) {

                    <!-- Etkinlik başlığını grafiğin sol tarafında gösterir -->
                    <text class="chart-title" x="0" [attr.y]="getTextY(index)">
                      {{ event.title }}
                    </text>

                    <!-- Kayıt oranının arka planını oluşturan sabit çubuktur -->
                    <rect class="chart-background" x="350" [attr.y]="getBarY(index)" width="300" height="20" rx="3"></rect>

                    <!-- Etkinliğin kayıt oranına göre genişliği değişen turuncu çubuktur -->
                    <rect class="chart-bar" x="350" [attr.y]="getBarY(index)" [attr.width]="getBarWidth(event.registrationRate)" height="20" rx="3"></rect>

                    <!-- Kayıt oranını çubuğun sağ tarafında yüzde olarak gösterir -->
                    <text class="chart-rate" [attr.x]="getBarTextX(event.registrationRate)" [attr.y]="getTextY(index)">
                      %{{ event.registrationRate }}
                    </text>

                  }

                </svg>
              </div>
            </div>
          }
        </section>

        <!-- Etkinlik bazlı detaylı istatistiklerin bulunduğu bölüm -->
        <section class="events-section">
          <div class="section-header">
            <h2>Etkinlik İstatistikleri</h2> <!-- Tablo bölümünün başlığını gösterir. -->
            <p>Her etkinliğin kapasite ve kayıt durumlarını ayrı ayrı gösterir.</p> <!-- Tablo hakkında kısa açıklama verir. -->
          </div>

          <!-- Kulübün etkinliği yoksa tablo yerine mesaj gösterilir -->
          @if (statsItem.events.length === 0) {
            <div class="empty-card">
              Bu kulübe ait etkinlik bulunmuyor.
            </div>
          } @else {

            <!-- Tabloyu kart görünümünde tutar -->
            <div class="table-card">
              <!-- Küçük ekranlarda tablonun yatay kaydırılmasını sağlar -->
              <div class="table-wrapper">

                <!-- Etkinlik istatistiklerinin gösterildiği tablo -->
                <table class="stats-table">

                  <!-- Tablo kolon başlıklarını gösterir -->
                  <thead>
                    <tr>
                      <th>Etkinlik</th> <!-- Etkinlik başlığının bulunduğu kolondur. -->
                      <th>Tarih</th> <!-- Etkinlik tarihinin bulunduğu kolondur. -->
                      <th>Durum</th> <!-- Etkinliğin aktif veya iptal durumunu gösterir. -->
                      <th>Kapasite</th> <!-- Etkinliğin toplam kapasitesini gösterir. -->
                      <th>Onaylı</th> <!-- Onaylanan kayıt sayısını gösterir. -->
                      <th>Bekleyen</th> <!-- Onay bekleyen kayıt sayısını gösterir. -->
                      <th>Reddedilen</th> <!-- Reddedilen kayıt sayısını gösterir. -->
                      <th>Kayıt Oranı</th> <!-- Etkinliğin kayıt oranını yüzde olarak gösterir. -->
                    </tr>
                  </thead>

                  <!-- Backendden gelen etkinlik istatistiklerini tabloya basar -->
                  <tbody>
                    @for (event of statsItem.events; track event.eventId) {
                      <tr>

                        <!-- Etkinlik başlığını gösterir -->
                        <td class="event-title">
                          {{ event.title }}
                        </td>

                        <!-- Etkinliğin başlangıç tarihini gösterir -->
                        <td>
                          {{ event.startDate }}
                        </td>

                        <!-- Etkinliğin durumunu kullanıcıya daha anlaşılır şekilde gösterir -->
                        <td>
                          @if (event.status === 'Active') {
                            <span class="status-badge status-active">Aktif</span>
                          } @else if (event.status === 'Cancelled') {
                            <span class="status-badge status-cancelled">İptal Edildi</span>
                          } @else {
                            <span class="status-badge status-default">{{ event.status }}</span>
                          }
                        </td>

                        <!-- Etkinlik kapasitesini gösterir -->
                        <td>
                          {{ event.capacity }}
                        </td>

                        <!-- Onaylanan kayıt sayısını gösterir -->
                        <td>
                          <span class="count-approved">{{ event.approvedRegistrationCount }}</span>
                        </td>

                        <!-- Bekleyen kayıt sayısını gösterir -->
                        <td>
                          <span class="count-pending">{{ event.pendingRegistrationCount }}</span>
                        </td>

                        <!-- Reddedilen kayıt sayısını gösterir -->
                        <td>
                          <span class="count-rejected">{{ event.rejectedRegistrationCount }}</span>
                        </td>

                        <!-- Etkinliğin kayıt oranını turuncu etiket içerisinde gösterir -->
                        <td>
                          <span class="rate-badge">%{{ event.registrationRate }}</span>
                        </td>

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
  styleUrl: './club-stats.scss' // Bu componentin tasarımını club-stats.scss dosyasından almasını sağlar.
})
export class ClubStats implements OnInit { // Kulüp istatistikleri sayfasının TypeScript classıdır ve OnInit yaşam döngüsünü kullanır.
  private readonly route = inject(ActivatedRoute); // URL içindeki kulüp ID bilgisine erişmek için ActivatedRoute'u enjekte eder.
  private readonly clubService = inject(ClubService); // Kulüp istatistiklerini backendden almak için ClubService'i enjekte eder.

  private clubId: number | null = null; // İstatistikleri gösterilecek kulübün ID değerini class içerisinde saklar.
  readonly stats = signal<ClubStatsResponse | null>(null); // Backendden gelen kulüp istatistiklerini tutar.
  readonly loading = signal(false); // İstatistikler yüklenirken işlemin devam edip etmediğini tutar.
  readonly errorMessage = signal(''); // Kullanıcıya gösterilecek hata mesajını tutar.


  ngOnInit(): void { // Sayfa ilk açıldığında otomatik olarak çalışır.
    const id = Number(this.route.snapshot.paramMap.get('id')); // URL içindeki kulüp ID değerini alır ve number tipine dönüştürür.

    if (!Number.isInteger(id) || id <= 0) { // ID geçerli bir pozitif tam sayı değilse kontrol içerisine girer.
      this.errorMessage.set('Geçersiz kulüp ID.'); // Kullanıcıya geçersiz kulüp ID mesajı gösterir.
      return; // Backend isteğinin yapılmasını engeller.
    }

    this.clubId = id; // URLden alınan geçerli kulüp IDsini class değişkenine kaydeder.
    this.loadStats(); // Kulübün istatistiklerini backendden getirir.
  }


  loadStats(): void { // Kulübün güncel istatistiklerini backendden getiren metottur.
    if (!this.clubId) { // Geçerli bir kulüp IDsi bulunmuyorsa kontrol içerisine girer.
      return; // Backend isteğinin gönderilmesini engeller.
    }

    this.loading.set(true); // Backend isteğinin başladığını belirtir.
    this.errorMessage.set(''); // Daha önce oluşmuş hata mesajını temizler.

    this.clubService.getStats(this.clubId).subscribe({ // ClubService içindeki getStats metoduyla backend isteği gönderir.
      next: stats => { // Backend isteği başarılı olduğunda çalışır.
        this.stats.set(stats); // Backendden gelen istatistikleri stats signalına aktarır.
        this.loading.set(false); // Yükleme işleminin tamamlandığını belirtir.
      },
      error: (error: HttpErrorResponse) => { // Backend isteği hata verdiğinde çalışır.
        this.errorMessage.set(
          getApiErrorMessage(error, 'Kulüp istatistikleri alınamadı.') // Backend hatasını kullanıcıya gösterilecek anlaşılır mesaja dönüştürür.
        );
        this.loading.set(false); // Hata olsa bile yükleme işlemini sonlandırır.
      }
    });
  }


  getChartHeight(eventCount: number): number { // Etkinlik sayısına göre SVG grafiğinin toplam yüksekliğini hesaplar.
    return Math.max(80, eventCount * 50); // Grafik yüksekliğini minimum 80px yapar ve her etkinlik için 50px alan bırakır.
  }


  getBarY(index: number): number { // Grafikteki her turuncu çubuğun dikey konumunu hesaplar.
    return index * 50 + 10; // Etkinlik sırasına göre her çubuğu bir öncekinin 50px altına yerleştirir.
  }


  getTextY(index: number): number { // Grafik üzerindeki etkinlik adı ve yüzde yazısının dikey konumunu hesaplar.
    return index * 50 + 26; // Yazıyı ilgili çubuğun dikey ortasına yakın konumlandırır.
  }


  getBarWidth(registrationRate: number): number { // Kayıt oranına göre turuncu grafik çubuğunun genişliğini hesaplar.
    const rate = Math.max(0, Math.min(registrationRate, 100)); // Kayıt oranının 0 ile 100 arasında kalmasını sağlar.
    return rate * 3; // Yüzde 100 değerini maksimum 300px genişliğe dönüştürür.
  }


  getBarTextX(registrationRate: number): number { // Yüzde yazısının grafikte nerede başlayacağını hesaplar.
    return 360 + this.getBarWidth(registrationRate); // Yüzde yazısını turuncu çubuğun hemen sağ tarafına yerleştirir.
  }
}