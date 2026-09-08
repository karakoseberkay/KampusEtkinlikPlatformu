import { Component, computed, inject, OnInit, signal } from '@angular/core'; // Component computed servis enjeksiyonu OnInit ve signal kullanmak için
import { HttpErrorResponse } from '@angular/common/http'; // Backendden gelen HTTP hatalarını yakalamak için
import { RegistrationService } from '../../core/services/registration.service'; // Giriş yapan kullanıcının kendi etkinlik kayıtlarını backendden almak için
import { RegistrationResponse } from '../../core/models/api.models'; // Backendden gelen kayıt modelini kullanmak için
import { getApiErrorMessage } from '../../core/utils/api-error'; // Backend hatalarını kullanıcıya gösterilecek anlaşılır mesaja dönüştürmek için
import { formatDateTime } from '../../core/utils/date-time'; // Backendden gelen tarihleri kullanıcıya daha okunabilir formatta göstermek için

@Component({ // Bu classın Angular componenti olduğunu belirtir
  selector: 'app-my-registrations', // Componentin selector adını belirler
  standalone: true, // Componentin NgModule kullanmadan bağımsız çalışmasını sağlar
  template: `
    <!-- Kayıtlarım sayfasının tamamını kapsar -->
    <section class="registrations-page">
      <!-- Sayfanın üst başlık alanıdır -->
      <div class="page-header">
        <div>
          <h1>My Registrations</h1>
          <p>View the events you have joined or applied for.</p>
        </div>

        <!-- Öğrencinin kayıtlarını backendden tekrar çekmek için kullanılır -->
        <button class="refresh-button" type="button" [disabled]="loading()" (click)="loadRegistrations()">
          {{ loading() ? 'Loading...' : 'Refresh Registrations' }}
        </button>
      </div>

      <!-- Backend isteği devam ederken ve daha önce veri yoksa gösterilir -->
      @if (loading() && registrations().length === 0) {
        <div class="page-message">
          Your registrations are loading...
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
          <div class="section-header">
            <h2>Participation Summary</h2>
            <p>Shows the current status of your event registrations.</p>
          </div>

          <!-- Özet kutularını grid şeklinde gösterir -->
          <div class="summary-grid">
            <div class="summary-card">
              <span class="summary-label">Total Registrations</span>
              <strong class="summary-value">{{ totalRegistrationCount() }}</strong>
            </div>

            <div class="summary-card">
              <span class="summary-label">Approved</span>
              <strong class="summary-value approved-value">{{ approvedCount() }}</strong>
            </div>

            <div class="summary-card">
              <span class="summary-label">Pending</span>
              <strong class="summary-value pending-value">{{ pendingCount() }}</strong>
            </div>

            <div class="summary-card">
              <span class="summary-label">Rejected</span>
              <strong class="summary-value rejected-value">{{ rejectedCount() }}</strong>
            </div>
          </div>
        </section>
      }

      <!-- Öğrencinin hiç etkinlik kaydı bulunmuyorsa gösterilir -->
      @if (!loading() && registrations().length === 0 && !errorMessage()) {
        <div class="empty-card">
          No event registrations yet.
        </div>
      }

      <!-- En az bir kayıt varsa kayıt geçmişi tablosunu gösterir -->
      @if (registrations().length > 0) {
        <section class="history-section">
          <div class="section-header">
            <h2>Registration History</h2>
            <p>Shows the events you applied for and their registration status.</p>
          </div>

          <div class="table-card">
            <div class="table-wrapper">
              <table class="registrations-table">
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Club</th>
                    <th>Registration Date</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  @for (registration of registrations(); track registration.id) {
                    <tr>
                      <td class="event-title">
                        {{ registration.eventTitle }}
                      </td>

                      <td>
                        {{ registration.clubName }}
                      </td>

                      <td>
                        {{ formatDateTime(registration.registeredAt) }}
                      </td>

                      <td>
                        @if (registration.approvalStatus === 'Approved') {
                          <span class="status-badge status-approved">
                            Approved
                          </span>
                        } @else if (registration.approvalStatus === 'Pending') {
                          <span class="status-badge status-pending">
                            Pending
                          </span>
                        } @else if (registration.approvalStatus === 'Rejected') {
                          <span class="status-badge status-rejected">
                            Rejected
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
  styleUrl: './my-registrations.scss' // Componentin tasarım dosyasını bağlar
})
export class MyRegistrations implements OnInit {
  readonly formatDateTime = formatDateTime; // tarihleri template içinde okunabilir formatta göstermek için ortak fonksiyonu kullanır
  private readonly registrationService = inject(RegistrationService); // Öğrencinin kayıt işlemlerine erişmek için RegistrationServicei DI ile alır

  readonly registrations = signal<RegistrationResponse[]>([]); // Backendden gelen kayıt listesini tutar
  readonly loading = signal(false); // Kayıtlar yüklenirken işlemin devam edip etmediğini tutar
  readonly errorMessage = signal(''); // Kullanıcıya gösterilecek hata mesajını tutar

  readonly totalRegistrationCount = computed(() => this.registrations().length); // Öğrencinin toplam etkinlik kayıt sayısını hesaplar
  readonly approvedCount = computed(() => this.registrations().filter(registration => registration.approvalStatus === 'Approved').length); // Onaylanmış kayıtların sayısını hesaplar
  readonly pendingCount = computed(() => this.registrations().filter(registration => registration.approvalStatus === 'Pending').length); // Onay bekleyen kayıtların sayısını hesaplar
  readonly rejectedCount = computed(() => this.registrations().filter(registration => registration.approvalStatus === 'Rejected').length); // Reddedilen kayıtların sayısını hesaplar

  ngOnInit(): void {
    this.loadRegistrations(); // Sayfa açıldığında kullanıcının kayıtlarını backendden getirir
  }

  loadRegistrations(): void { // Giriş yapan kullanıcının kendi etkinlik kayıtlarını backendden getirir
    this.loading.set(true);
    this.errorMessage.set('');

    this.registrationService.getMine().subscribe({
      next: registrations => {
        this.registrations.set(registrations);
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(getApiErrorMessage(error, 'Could not load registrations.'));
        this.loading.set(false);
      }
    });
  }
}