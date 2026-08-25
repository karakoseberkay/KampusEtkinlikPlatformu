import { Component, inject, OnInit, signal } from '@angular/core'; // Component, inject, OnInit ve signal kullanmak için
import { HttpErrorResponse } from '@angular/common/http'; // Backendden gelen HTTP hatalarını yakalamak için
import { FormsModule } from '@angular/forms'; // Template içinde ngModel kullanmak için
import { ActivatedRoute } from '@angular/router'; // URL içindeki etkinlik ID değerini almak için
import { RegistrationService } from '../../core/services/registration.service'; // Kayıtları getirmek, onaylamak ve reddetmek için
import { RegistrationApprovalStatus, RegistrationResponse } from '../../core/models/api.models'; // Kayıt durumları ve kayıt modelleri
import { getApiErrorMessage } from '../../core/utils/api-error'; // Backend hatalarını anlaşılır mesaja çevirmek için

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

            <!-- Seçilen durumu selectedStatus signalına bağlar -->
            <select
              id="approvalStatus"
              [ngModel]="selectedStatus()"
              (ngModelChange)="changeStatus($event)"//Select'in seçili değeri değiştiği anda çalışır
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
                      <td>{{ registration.registeredAt }}</td> <!-- Kayıt tarihi -->

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

    if (!Number.isInteger(id) || id <= 0) { // ID geçerli pozitif tam sayı değilse
      this.errorMessage.set('Invalid event ID.'); // Kullanıcıya hata mesajı gösterir
      return; // Backend isteğinin yapılmasını engeller
    }

    this.eventId = id; // Geçerli etkinlik IDsini kaydeder
    this.loadRegistrations(); // Etkinlik kayıtlarını backendden getirir
  }

  changeStatus(value: RegistrationApprovalStatus | ''): void { // Durum filtresi değiştiğinde çalışır
    this.selectedStatus.set(value); // Yeni filtre değerini kaydeder
    this.loadRegistrations(); // Yeni filtreye göre kayıtları tekrar getirir
  }

  loadRegistrations(clearSuccess = true): void { // Etkinlik kayıtlarını seçilen filtreye göre getirir
    if (!this.eventId) { // Geçerli etkinlik IDsi yoksa
      return; // Backend isteğini engeller
    }

    this.loading.set(true); // Yükleme işlemini başlatır
    this.errorMessage.set(''); // Önceki hata mesajını temizler

    if (clearSuccess) { // Normal yükleme işlemiyse
      this.successMessage.set(''); // Önceki başarı mesajını temizler
    }

    const selected = this.selectedStatus(); // Seçilen durum filtresini alır
    const status: RegistrationApprovalStatus | undefined = selected === '' ? undefined : selected; // Tümü seçiliyse filtre göndermez

    this.registrationService.getForEvent(this.eventId, status).subscribe({ // Etkinlik IDsi ve durum filtresiyle backend'e istek gönderir
      next: registrations => { // İstek başarılı olduğunda çalışır
        this.registrations.set(registrations); // Gelen kayıtları signal içine kaydeder
        this.loading.set(false); // Yükleme işlemini bitirir
      },
      error: (error: HttpErrorResponse) => { // Backend isteğinde hata oluşursa çalışır
        this.errorMessage.set(
          getApiErrorMessage(error, 'Could not load event registrations.') // Hatayı kullanıcıya uygun mesaja çevirir
        );
        this.loading.set(false); // Hata olsa bile yükleme işlemini bitirir
      }
    });
  }

  approve(registrationId: number): void { // Verilen kaydı onaylar
    if (this.processingId() !== null) { // Başka bir işlem devam ediyorsa
      return; // Yeni işlem başlatılmasını engeller
    }

    this.processingId.set(registrationId); // İşlem yapılan kaydın IDsini kaydeder
    this.errorMessage.set(''); // Önceki hata mesajını temizler
    this.successMessage.set(''); // Önceki başarı mesajını temizler

    this.registrationService.approve(registrationId).subscribe({ // Kayıt onaylama isteğini backend'e gönderir
      next: () => { // Onaylama işlemi başarılı olduğunda çalışır
        this.processingId.set(null); // İşlem yapılan kayıt ID bilgisini temizler
        this.successMessage.set('Registration approved.'); // Başarı mesajını gösterir
        this.loadRegistrations(false); // Listeyi tekrar getirir ve başarı mesajını korur
      },
      error: (error: HttpErrorResponse) => { // Onaylama sırasında hata oluşursa çalışır
        this.errorMessage.set(
          getApiErrorMessage(error, 'Could not approve the registration.') // Hatayı kullanıcıya uygun mesaja çevirir
        );
        this.processingId.set(null); // İşlem yapılan kayıt ID bilgisini temizler
      }
    });
  }

  reject(registrationId: number): void { // Verilen kaydı reddeder
    if (this.processingId() !== null) { // Başka bir işlem devam ediyorsa
      return; // Yeni işlem başlatılmasını engeller
    }

    this.processingId.set(registrationId); // İşlem yapılan kaydın IDsini kaydeder
    this.errorMessage.set(''); // Önceki hata mesajını temizler
    this.successMessage.set(''); // Önceki başarı mesajını temizler

    this.registrationService.reject(registrationId).subscribe({ // Kayıt reddetme isteğini backend'e gönderir
      next: () => { // Reddetme işlemi başarılı olduğunda çalışır
        this.processingId.set(null); // İşlem yapılan kayıt ID bilgisini temizler
        this.successMessage.set('Registration rejected.'); // Başarı mesajını gösterir
        this.loadRegistrations(false); // Listeyi tekrar getirir ve başarı mesajını korur
      },
      error: (error: HttpErrorResponse) => { // Reddetme sırasında hata oluşursa çalışır
        this.errorMessage.set(
          getApiErrorMessage(error, 'Could not reject the registration.') // Hatayı kullanıcıya uygun mesaja çevirir
        );
        this.processingId.set(null); // İşlem yapılan kayıt ID bilgisini temizler
      }
    });
  }
}