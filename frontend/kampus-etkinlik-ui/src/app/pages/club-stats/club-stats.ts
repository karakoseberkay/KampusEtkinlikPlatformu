import { Component, inject, OnInit, signal } from '@angular/core'; // Component inject OnInit ve signal kullanmak için
import { HttpErrorResponse } from '@angular/common/http'; // Backendden gelen HTTP hatalarını yakalamak için
import { ActivatedRoute } from '@angular/router'; // URL içindeki kulüp IDsini almak için
import { ClubService } from '../../core/services/club.service'; // Kulüp istatistiklerini backendden almak için
import { ClubStatsResponse } from '../../core/models/api.models'; // Backendden gelen kulüp istatistik modelini kullanmak için
import { getApiErrorMessage } from '../../core/utils/api-error'; // Backend hatalarını anlaşılır mesaja çevirmek için
import { formatDateTime } from '../../core/utils/date-time'; // Backendden gelen tarihleri kullanıcıya daha okunabilir formatta göstermek için

@Component({ // Bu classın Angular componenti olduğunu belirtir
  selector: 'app-club-stats', // Componentin selector adı
  standalone: true, // Componentin NgModule olmadan bağımsız çalışmasını sağlar
  template: `
    <!-- Kulüp istatistikleri sayfası -->
    <section class="club-stats-page">
      <!-- Sayfa başlığı -->
      <div class="page-header">
        <div>
          <h1>Club Statistics</h1>
          <p>View the club's event and participation statistics.</p>
        </div>

        <!-- İstatistikleri yeniden yükler -->
        <button class="refresh-button" type="button" [disabled]="loading()" (click)="loadStats()">
          {{ loading() ? 'Loading...' : 'Refresh Data' }}
        </button>
      </div>

      <!-- İstatistikler yüklenirken gösterilir -->
      @if (loading() && !stats()) {
        <div class="page-message">
          Club statistics are loading...
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
          </div>
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

                        <td>
                          {{ event.capacity }}
                        </td>

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
  styleUrl: './club-stats.scss' // Componentin tasarım dosyası
})
export class ClubStats implements OnInit {
  readonly formatDateTime = formatDateTime; // tarihleri template içinde okunabilir formatta göstermek için ortak fonksiyonu kullanır
  private readonly route = inject(ActivatedRoute); // URL içindeki kulüp IDsini almak için
  private readonly clubService = inject(ClubService); // Kulüp istatistiklerini backendden almak için

  private clubId: number | null = null; // İstatistikleri gösterilecek kulübün IDsini tutar

  readonly stats = signal<ClubStatsResponse | null>(null); // Backendden gelen kulüp istatistiklerini tutar
  readonly loading = signal(false); // İstatistiklerin yüklenme durumunu tutar
  readonly errorMessage = signal(''); // Kullanıcıya gösterilecek hata mesajını tutar

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!Number.isInteger(id) || id <= 0) {
      this.errorMessage.set('Invalid club ID.');
      return;
    }

    this.clubId = id;
    this.loadStats();
  }

  loadStats(): void { // Kulübün güncel istatistiklerini backendden getirir
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

  getChartHeight(eventCount: number): number { // Etkinlik sayısına göre SVG yüksekliğini hesaplar
    return Math.max(80, eventCount * 50);
  }

  getBarY(index: number): number { // Her grafik çubuğunun dikey konumunu hesaplar
    return index * 50 + 10;
  }

  getTextY(index: number): number { // Etkinlik adı ve yüzde yazısının dikey konumunu hesaplar
    return index * 50 + 26;
  }

  getBarWidth(registrationRate: number): number { // Kayıt oranına göre çubuk genişliğini hesaplar
    const rate = Math.max(0, Math.min(registrationRate, 100));
    return rate * 3;
  }

  getBarTextX(registrationRate: number): number { // Yüzde yazısının yatay konumunu hesaplar
    return 360 + this.getBarWidth(registrationRate);
  }
}