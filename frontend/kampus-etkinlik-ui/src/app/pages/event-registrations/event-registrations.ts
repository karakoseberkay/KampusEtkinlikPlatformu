import { Component, inject, OnInit, signal } from '@angular/core'; // Component inject OnInit ve signal kullanmak için
import { HttpErrorResponse } from '@angular/common/http'; // Backendden gelen HTTP hatalarını yakalamak için
import { FormsModule } from '@angular/forms'; // Template içinde ngModel kullanmak için
import { ActivatedRoute } from '@angular/router'; // URL içindeki etkinlik ID değerini almak için
import { RegistrationService } from '../../core/services/registration.service'; // Kayıtları getirmek onaylamak ve reddetmek için
import { RegistrationApprovalStatus, RegistrationResponse } from '../../core/models/api.models'; // Kayıt durumları ve kayıt modelleri
import { getApiErrorMessage } from '../../core/utils/api-error'; // Backend hatalarını anlaşılır mesaja çevirmek için
import { formatDateTime } from '../../core/utils/date-time'; // Backendden gelen tarihleri kullanıcıya daha okunabilir formatta göstermek için

@Component({ // Bu classın Angular componenti olduğunu belirtir
  selector: 'app-event-registrations', // Componentin selector adı
  standalone: true, // Componentin NgModule olmadan bağımsız çalışmasını sağlar
  imports: [FormsModule], // Template içinde ngModel kullanılmasını sağlar
  template: `
    <!-- Etkinlik kayıtları sayfası -->
    <section class="event-registrations-page">
      <!-- Sayfa başlığı -->
      <div class="page-header">
        <div>
          <h1>Event Registrations</h1>
          <p>View and manage student registrations for this event.</p>
        </div>

        <!-- Kayıt listesini yeniden yükler -->
        <button class="refresh-button" type="button" [disabled]="loading()" (click)="loadRegistrations()">
          {{ loading() ? 'Loading...' : 'Refresh Registrations' }}
        </button>
      </div>

      <!-- Kayıt durumu filtresi -->
      <section class="filter-card">
        <div class="filter-header">
          <h2>Registration Status</h2>
          <p>Filter registrations by approval status.</p>
        </div>

        <div class="filter-content">
          <div class="form-field">
            <label for="approvalStatus">Status</label>

            <!-- Seçilen durumu selectedStatus signalına bağlar ve değiştiğinde changeStatus çalışır -->
            <select
              id="approvalStatus"
              [ngModel]="selectedStatus()"
              (ngModelChange)="changeStatus($event)"
            >
              <option value="">All</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>
      </section>

      <!-- Kayıtlar yüklenirken gösterilir -->
      @if (loading() && registrations().length === 0) {
        <div class="page-message">
          Event registrations are loading...
        </div>
      }

      <!-- Hata mesajı -->
      @if (errorMessage()) {
        <div class="page-message error-message">
          {{ errorMessage() }}
        </div>
      }

      <!-- Başarılı işlem mesajı -->
      @if (successMessage()) {
        <div class="page-message success-message">
          {{ successMessage() }}
        </div>
      }

      <!-- Kayıt bulunamadığında gösterilir -->
      @if (!loading() && registrations().length === 0 && !errorMessage()) {
        <div class="empty-card">
          No registrations found for the selected status.
        </div>
      }

      <!-- Kayıt listesi -->
      @if (registrations().length > 0) {
        <section class="registrations-section">
          <!-- Liste başlığı -->
          <div class="section-header">
            <h2>Registration List</h2>
            <p>Showing {{ registrations().length }} registrations.</p>
          </div>

          <!-- Kayıt tablosu -->
          <div class="table-card">
            <div class="table-wrapper">
              <table class="registrations-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Event</th>
                    <th>Club</th>
                    <th>Registration Date</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  <!-- Backendden gelen kayıtları tabloya ekler -->
                  @for (registration of registrations(); track registration.id) {
                    <tr>
                      <td class="student-name">{{ registration.userFullName }}</td> <!-- Öğrencinin adı -->
                      <td class="event-title">{{ registration.eventTitle }}</td> <!-- Etkinlik adı -->
                      <td>{{ registration.clubName }}</td> <!-- Kulüp adı -->
                      <td>{{ formatDateTime(registration.registeredAt) }}</td> <!-- Kayıt tarihini okunabilir formatta gösterir -->

                      <!-- Kayıt durumunu gösterir -->
                      <td>
                        @if (registration.approvalStatus === 'Pending') {
                          <span class="status-badge status-pending">
                            Pending
                          </span>
                        } @else if (registration.approvalStatus === 'Approved') {
                          <span class="status-badge status-approved">
                            Approved
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

                      <!-- Kayıt yönetim işlemleri -->
                      <td>
                        @if (registration.approvalStatus === 'Pending') {
                          <div class="table-actions">
                            <!-- Kaydı onaylar -->
                            <button
                              class="approve-button"
                              type="button"
                              [disabled]="processingId() !== null"
                              (click)="approve(registration.id)"
                            >
                              {{ processingId() === registration.id ? 'Processing...' : 'Approve' }}
                            </button>

                            <!-- Kaydı reddeder -->
                            <button
                              class="reject-button"
                              type="button"
                              [disabled]="processingId() !== null"
                              (click)="reject(registration.id)"
                            >
                              Reject
                            </button>
                          </div>
                        } @else {
                          <span class="completed-text">
                            Completed
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
  styleUrl: './event-registrations.scss' // Componentin tasarım dosyası
})
export class EventRegistrations implements OnInit {
  readonly formatDateTime = formatDateTime; // tarihleri template içinde okunabilir formatta göstermek için ortak fonksiyonu kullanır
  private readonly route = inject(ActivatedRoute); // URL içindeki etkinlik IDsine erişmek için
  private readonly registrationService = inject(RegistrationService); // Kayıt işlemlerini yapmak için

  private eventId: number | null = null; // Kayıtları gösterilecek etkinliğin IDsini tutar

  readonly registrations = signal<RegistrationResponse[]>([]); // Backendden gelen kayıt listesini tutar
  readonly selectedStatus = signal<RegistrationApprovalStatus | ''>(''); // Seçilen durum filtresini tutar
  readonly loading = signal(false); // Kayıtların yüklenme durumunu tutar
  readonly processingId = signal<number | null>(null); // İşlem yapılan kaydın IDsini tutar
  readonly errorMessage = signal(''); // Hata mesajını tutar
  readonly successMessage = signal(''); // Başarı mesajını tutar

  ngOnInit(): void { // Sayfa ilk açıldığında otomatik çalışır
    const id = Number(this.route.snapshot.paramMap.get('id')); // URL içindeki etkinlik IDsini alıp numbera çevirir

    if (!Number.isInteger(id) || id <= 0) {
      this.errorMessage.set('Invalid event ID.');
      return;
    }

    this.eventId = id;
    this.loadRegistrations();
  }

  changeStatus(value: RegistrationApprovalStatus | ''): void { // Durum filtresi değiştiğinde çalışır
    this.selectedStatus.set(value);
    this.loadRegistrations();
  }

  loadRegistrations(clearSuccess = true): void { // Etkinlik kayıtlarını seçilen filtreye göre getirir
    if (!this.eventId) {
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    if (clearSuccess) {
      this.successMessage.set('');
    }

    const selected = this.selectedStatus();
    const status: RegistrationApprovalStatus | undefined = selected === '' ? undefined : selected;

    this.registrationService.getForEvent(this.eventId, status).subscribe({
      next: registrations => {
        this.registrations.set(registrations);
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(getApiErrorMessage(error, 'Could not load event registrations.'));
        this.loading.set(false);
      }
    });
  }

  approve(registrationId: number): void { // Verilen kaydı onaylar
    if (this.processingId() !== null) {
      return;
    }

    this.processingId.set(registrationId);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.registrationService.approve(registrationId).subscribe({
      next: () => {
        this.processingId.set(null);
        this.successMessage.set('Registration approved.');
        this.loadRegistrations(false);
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(getApiErrorMessage(error, 'Could not approve the registration.'));
        this.processingId.set(null);
      }
    });
  }

  reject(registrationId: number): void { // Verilen kaydı reddeder
    if (this.processingId() !== null) {
      return;
    }

    this.processingId.set(registrationId);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.registrationService.reject(registrationId).subscribe({
      next: () => {
        this.processingId.set(null);
        this.successMessage.set('Registration rejected.');
        this.loadRegistrations(false);
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(getApiErrorMessage(error, 'Could not reject the registration.'));
        this.processingId.set(null);
      }
    });
  }
}