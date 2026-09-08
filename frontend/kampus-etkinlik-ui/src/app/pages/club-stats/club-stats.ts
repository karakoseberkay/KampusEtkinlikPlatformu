import { Component, computed, inject, OnInit, signal } from '@angular/core'; // Component computed inject OnInit ve signal kullanmak için
import { HttpErrorResponse } from '@angular/common/http'; // backendden gelen HTTP hatalarını yakalamak için
import { ActivatedRoute } from '@angular/router'; // URL içindeki kulüp idsini almak için
import { ChartModule } from 'primeng/chart'; // PrimeNG pie grafik componentini kullanmak için
import type { ChartData, ChartOptions } from 'chart.js'; // pie grafik veri ve ayarlarının tiplerini belirlemek için
import { ClubService } from '../../core/services/club.service'; // kulüp istatistiklerini backendden almak için
import { ClubStatsResponse } from '../../core/models/api.models'; // backendden gelen kulüp istatistik modelini kullanmak için
import { getApiErrorMessage } from '../../core/utils/api-error'; // backend hatalarını anlaşılır mesaja çevirmek için
import { formatDateTime } from '../../core/utils/date-time'; // backendden gelen tarihleri kullanıcıya okunabilir formatta göstermek için

@Component({ // bu classın Angular componenti olduğunu belirtir
  selector: 'app-club-stats', // componentin selector adı
  standalone: true, // componentin NgModule olmadan bağımsız çalışmasını sağlar
  imports: [ChartModule], // template içerisinde PrimeNG p-chart kullanmamızı sağlar
  template: `
    <!-- Kulüp istatistikleri sayfası -->
    <section class="club-stats-page">
      <div class="page-header">
        <div>
          <h1>Club Statistics</h1>
          <p>View the club's event and participation statistics.</p>
        </div>

        <button class="refresh-button" type="button" [disabled]="loading()" (click)="loadStats()">
          {{ loading() ? 'Loading...' : 'Refresh Data' }}
        </button>
      </div>

      @if (loading() && !stats()) {
        <div class="page-message">
          Club statistics are loading...
        </div>
      }

      @if (errorMessage()) {
        <div class="page-message error-message">
          {{ errorMessage() }}
        </div>
      }

      @if (stats(); as statsItem) {
        <section class="club-summary">
          <span class="summary-label">Club</span>
          <h2>{{ statsItem.clubName }}</h2>
          <p>Summary of the club's overall event and registration status.</p>
        </section>

        <!-- Genel istatistikler -->
        <section class="stats-section">
          <div class="section-header">
            <h2>Overview</h2>
            <p>Shows the club's total event and registration counts.</p>
          </div>

          <div class="stats-grid">
            <div class="stat-card">
              <span class="stat-label">Total Events</span>
              <strong class="stat-value">{{ statsItem.totalEventCount }}</strong>
            </div>

            <div class="stat-card">
              <span class="stat-label">Active Events</span>
              <strong class="stat-value status-green">{{ statsItem.activeEventCount }}</strong>
            </div>

            <div class="stat-card">
              <span class="stat-label">Cancelled</span>
              <strong class="stat-value status-red">{{ statsItem.cancelledEventCount }}</strong>
            </div>

            <div class="stat-card">
              <span class="stat-label">Approved Registrations</span>
              <strong class="stat-value">{{ statsItem.totalApprovedRegistrationCount }}</strong>
            </div>

            <div class="stat-card">
              <span class="stat-label">Pending Registrations</span>
              <strong class="stat-value status-orange">{{ statsItem.totalPendingRegistrationCount }}</strong>
            </div>

            <div class="stat-card">
              <span class="stat-label">Rejected Registrations</span>
              <strong class="stat-value status-red">{{ statsItem.totalRejectedRegistrationCount }}</strong>
            </div>

            <div class="stat-card rate-card">
              <span class="stat-label">Overall Registration Rate</span>
              <strong class="stat-value status-orange">%{{ statsItem.overallRegistrationRate }}</strong>
            </div>

            <div class="stat-card attendance-rate-card">
              <span class="stat-label">Overall Attendance Rate</span>
              <strong class="stat-value status-green">%{{ statsItem.overallAttendanceRate }}</strong>
            </div>
          </div>
        </section>

        <!-- qr check-in verilerine göre gerçek katılım grafiği -->
        <section class="attendance-section">
          <div class="section-header">
            <h2>Actual Attendance</h2>
            <p>Shows how many approved registrations actually attended the club's started events.</p>
          </div>

          @if (statsItem.totalAttendanceEligibleRegistrationCount === 0) {
            <div class="empty-card">
              There is not enough completed event attendance data yet.
            </div>
          } @else {
            <div class="attendance-grid">
              <div class="attendance-chart-card">
                <div class="attendance-chart">
                  <p-chart
                    type="pie"
                    [data]="attendanceChartData()"
                    [options]="attendanceChartOptions"
                  ></p-chart>
                </div>
              </div>

              <div class="attendance-summary-card">
                <div class="attendance-summary-item">
                  <span>Approved Registrations</span>
                  <strong>{{ statsItem.totalAttendanceEligibleRegistrationCount }}</strong>
                </div>

                <div class="attendance-summary-item">
                  <span>Checked In</span>
                  <strong class="attendance-success">{{ statsItem.totalCheckedInRegistrationCount }}</strong>
                </div>

                <div class="attendance-summary-item">
                  <span>Did Not Check In</span>
                  <strong class="attendance-missed">{{ statsItem.totalAbsentRegistrationCount }}</strong>
                </div>

                <div class="attendance-summary-item">
                  <span>Attendance Rate</span>
                  <strong class="attendance-success">%{{ statsItem.overallAttendanceRate }}</strong>
                </div>
              </div>
            </div>
          }
        </section>

        <!-- Etkinlik kayıt oranları grafiği -->
        <section class="chart-section">
          <div class="section-header">
            <h2>Event Registration Rates</h2>
            <p>Shows each event's registration rate based on its capacity.</p>
          </div>

          @if (statsItem.events.length === 0) {
            <div class="empty-card">
              No events available for the chart.
            </div>
          } @else {
            <div class="chart-card">
              <div class="chart-wrapper">
                <svg class="registration-chart" width="750" [attr.height]="getChartHeight(statsItem.events.length)">
                  @for (event of statsItem.events; track event.eventId; let index = $index) {
                    <text class="chart-title" x="0" [attr.y]="getTextY(index)">
                      {{ event.title }}
                    </text>

                    <rect
                      class="chart-background"
                      x="350"
                      [attr.y]="getBarY(index)"
                      width="300"
                      height="20"
                      rx="3"
                    ></rect>

                    <rect
                      class="chart-bar"
                      x="350"
                      [attr.y]="getBarY(index)"
                      [attr.width]="getBarWidth(event.registrationRate)"
                      height="20"
                      rx="3"
                    ></rect>

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
            <h2>Event Statistics</h2>
            <p>Shows each event's capacity and registration status separately.</p>
          </div>

          @if (statsItem.events.length === 0) {
            <div class="empty-card">
              No events found for this club.
            </div>
          } @else {
            <div class="table-card">
              <div class="table-wrapper">
                <table class="stats-table">
                  <thead>
                    <tr>
                      <th>Event</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Capacity</th>
                      <th>Approved</th>
                      <th>Pending</th>
                      <th>Rejected</th>
                      <th>Registration Rate</th>
                    </tr>
                  </thead>

                  <tbody>
                    @for (event of statsItem.events; track event.eventId) {
                      <tr>
                        <td class="event-title">
                          {{ event.title }}
                        </td>

                        <td>
                          {{ formatDateTime(event.startDate) }}
                        </td>

                        <td>
                          @if (event.status === 'Active') {
                            <span class="status-badge status-active">Active</span>
                          } @else if (event.status === 'Cancelled') {
                            <span class="status-badge status-cancelled">Cancelled</span>
                          } @else {
                            <span class="status-badge status-default">{{ event.status }}</span>
                          }
                        </td>

                        <td>{{ event.capacity }}</td>

                        <td>
                          <span class="count-approved">{{ event.approvedRegistrationCount }}</span>
                        </td>

                        <td>
                          <span class="count-pending">{{ event.pendingRegistrationCount }}</span>
                        </td>

                        <td>
                          <span class="count-rejected">{{ event.rejectedRegistrationCount }}</span>
                        </td>

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
  styleUrl: './club-stats.scss' // componentin tasarım dosyası
})
export class ClubStats implements OnInit {
  private readonly route = inject(ActivatedRoute); // URL içindeki kulüp idsini almak için
  private readonly clubService = inject(ClubService); // kulüp istatistiklerini backendden almak için

  private clubId: number | null = null; // istatistikleri gösterilecek kulübün idsini tutar

  readonly stats = signal<ClubStatsResponse | null>(null); // backendden gelen kulüp istatistiklerini tutar
  readonly loading = signal(false); // istatistiklerin yüklenme durumunu tutar
  readonly errorMessage = signal(''); // kullanıcıya gösterilecek hata mesajını tutar
  readonly formatDateTime = formatDateTime; // tarihleri template içinde okunabilir formatta göstermek için ortak fonksiyonu kullanır

  readonly attendanceChartData = computed<ChartData<'pie'>>(() => {
    const statsItem = this.stats();

    if (!statsItem) {
      return {
        labels: [],
        datasets: [
          {
            data: []
          }
        ]
      };
    }

    return {
      labels: ['Checked In', 'Did Not Check In'],
      datasets: [
        {
          data: [
            statsItem.totalCheckedInRegistrationCount,
            statsItem.totalAbsentRegistrationCount
          ],
          backgroundColor: ['#15803d', '#dbe3ec'],
          hoverBackgroundColor: ['#166534', '#cbd5e1'],
          borderWidth: 0
        }
      ]
    };
    // backendden gelen check-in sayılarını PrimeNG pie grafiğinin kullanacağı ChartData yapısına çevirir
  });

  readonly attendanceChartOptions: ChartOptions<'pie'> = {
    responsive: true, // grafiğin bulunduğu alana göre boyutunun otomatik değişmesini sağlar
    maintainAspectRatio: false, // grafiğin kapsayıcı yüksekliğini kullanabilmesini sağlar
    plugins: {
      legend: {
        position: 'bottom', // pie grafik açıklamalarını grafiğin altında gösterir
        labels: {
          usePointStyle: true, // legend işaretlerini daha sade yuvarlak şekilde gösterir
          padding: 20 // legend elemanları arasında boşluk bırakır
        }
      },
      tooltip: {
        enabled: true // grafikte dilimin üzerine gelindiğinde değer bilgisinin gösterilmesini sağlar
      }
    }
  };

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id')); // URL içindeki kulüp idsini alıp numbera çevirir

    if (!Number.isInteger(id) || id <= 0) {
      this.errorMessage.set('Invalid club ID.');
      return;
    }

    this.clubId = id;
    this.loadStats();
  }

  loadStats(): void { // kulübün güncel istatistiklerini backendden getirir
    if (!this.clubId) {
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    this.clubService.getStats(this.clubId).subscribe({
      next: stats => {
        this.stats.set(stats);
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(getApiErrorMessage(error, 'Could not load club statistics.'));
        this.loading.set(false);
      }
    });
  }

  getChartHeight(eventCount: number): number { // etkinlik sayısına göre SVG yüksekliğini hesaplar
    return Math.max(80, eventCount * 50);
  }

  getBarY(index: number): number { // her grafik çubuğunun dikey konumunu hesaplar
    return index * 50 + 10;
  }

  getTextY(index: number): number { // etkinlik adı ve yüzde yazısının dikey konumunu hesaplar
    return index * 50 + 26;
  }

  getBarWidth(registrationRate: number): number { // kayıt oranına göre çubuk genişliğini hesaplar
    const rate = Math.max(0, Math.min(registrationRate, 100));
    return rate * 3;
  }

  getBarTextX(registrationRate: number): number { // yüzde yazısının yatay konumunu hesaplar
    return 360 + this.getBarWidth(registrationRate);
  }
}