import { Component, inject, OnInit, signal } from '@angular/core'; // Component inject OnInit ve signal kullanmak için
import { HttpErrorResponse } from '@angular/common/http'; // backendden gelen HTTP hatalarını yakalamak için
import { ActivatedRoute } from '@angular/router'; // URL içindeki etkinlik idsini almak için
import { AuthService } from '../../core/services/auth.service'; // kullanıcının rol bilgilerine erişmek için
import { EventService } from '../../core/services/event.service'; // etkinlik detayını backendden almak için
import { RegistrationService } from '../../core/services/registration.service'; // etkinlik kayıtlarını ve check-in yapan kullanıcıları backendden almak için
import { EventResponse, RegistrationResponse } from '../../core/models/api.models'; // etkinlik ve kayıt modellerini kullanmak için
import { getApiErrorMessage } from '../../core/utils/api-error'; // backend hatalarını anlaşılır mesaja çevirmek için
import { formatDateTime } from '../../core/utils/date-time'; // backendden gelen tarihleri kullanıcıya daha okunabilir formatta göstermek için

@Component({ // bu classın Angular componenti olduğunu belirtir
  selector: 'app-event-detail', // componentin selector adı
  standalone: true, // componentin NgModule olmadan bağımsız çalışmasını sağlar
  template: `
    <!-- Etkinlik detay sayfası -->
    <section class="event-detail-page">
      <!-- Sayfa başlığı -->
      <div class="page-header">
        <div>
          <h1>Event Details</h1>
          <p>View detailed information about the event here.</p>
        </div>
      </div>

      <!-- Etkinlik bilgileri yüklenirken gösterilir -->
      @if (loading()) {
        <div class="page-message">
          Event information is loading...
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
              </span>

              <h2>
                {{ eventItem.title }}
              </h2>

              <p>
                {{ eventItem.description }}
              </p>
            </div>

            <!-- Etkinlik durumunu gösterir -->
            @if (eventItem.status === 'Active') {
              <span class="status-badge status-active">
                Active
              </span>
            } @else {
              <span class="status-badge status-passive">
                {{ eventItem.status }}
              </span>
            }
          </div>

          <!-- Etkinliğin temel bilgileri -->
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">Club</span>
              <span class="detail-value">{{ eventItem.clubName }}</span>
            </div>

            <div class="detail-item">
              <span class="detail-label">Date</span>
              <span class="detail-value">{{ formatDateTime(eventItem.startDate) }}</span>
            </div>

            <div class="detail-item">
              <span class="detail-label">Location</span>
              <span class="detail-value">{{ eventItem.location }}</span>
            </div>

            <div class="detail-item">
              <span class="detail-label">Capacity</span>
              <span class="detail-value">{{ eventItem.capacity }} people</span>
            </div>

            <div class="detail-item">
              <span class="detail-label">Participation Type</span>

              @if (eventItem.visibility === 'Public') {
                <span class="detail-value">
                  Open to Everyone
                </span>
              } @else {
                <span class="detail-value">
                  Approval Required
                </span>
              }
            </div>

            <div class="detail-item">
              <span class="detail-label">Created At</span>
              <span class="detail-value">{{ formatDateTime(eventItem.createdAt) }}</span>
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
                {{ registering() ? 'Registering...' : 'Register for Event' }}
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

      <!-- sadece etkinliğin sahibi clubmanager backendden katılımcı verisini alabilirse gösterilir -->
      @if (canViewCheckedInParticipants()) {
        <section class="participants-card">
          <div class="participants-header">
            <div>
              <h2>Checked-In Participants</h2>
              <p>{{ checkedInParticipants().length }} participants checked in.</p>
            </div>
          </div>

          @if (participantsLoading()) {
            <div class="participants-message">
              Participants are loading...
            </div>
          } @else if (checkedInParticipants().length === 0) {
            <div class="participants-message">
              No participants have checked in yet.
            </div>
          } @else {
            <div class="participants-table-wrapper">
              <table class="participants-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Registration Status</th>
                    <th>Registered At</th>
                    <th>Checked In At</th>
                  </tr>
                </thead>

                <tbody>
                  @for (registration of checkedInParticipants(); track registration.id) {
                    <tr>
                      <td class="participant-name">
                        {{ registration.userFullName }}
                      </td>

                      <td>
                        <span class="approval-badge">
                          {{ registration.approvalStatus }}
                        </span>
                      </td>

                      <td>
                        {{ formatDateTime(registration.registeredAt) }}
                      </td>

                      <td>
                        {{ formatDateTime(registration.checkedInAt) }}
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </section>
      }
    </section>
  `,
  styleUrl: './event-detail.scss' // componentin tasarım dosyası
})
export class EventDetail implements OnInit {
  readonly auth = inject(AuthService); // kullanıcının rolünü kontrol etmek için
  private readonly route = inject(ActivatedRoute); // URL içindeki etkinlik idsini okumak için
  private readonly eventService = inject(EventService); // etkinlik detayını backendden almak için
  private readonly registrationService = inject(RegistrationService); // kayıt ve check-in bilgilerini backendden almak için

  readonly event = signal<EventResponse | null>(null); // backendden gelen etkinlik detayını tutar
  readonly loading = signal(false); // etkinlik bilgilerinin yüklenme durumunu tutar
  readonly registering = signal(false); // kayıt işleminin devam edip etmediğini tutar
  readonly errorMessage = signal(''); // hata mesajını tutar
  readonly successMessage = signal(''); // başarılı kayıt mesajını tutar
  readonly checkedInParticipants = signal<RegistrationResponse[]>([]); // qr ile giriş yapmış kullanıcıları tutar
  readonly participantsLoading = signal(false); // katılımcı listesinin yüklenme durumunu tutar
  readonly canViewCheckedInParticipants = signal(false); // backend izin verirse katılımcı tablosunun gösterilmesini sağlar
  readonly formatDateTime = formatDateTime; // tarihleri template içinde okunabilir formatta göstermek için ortak fonksiyonu kullanır

  ngOnInit(): void { // sayfa ilk açıldığında otomatik çalışır
    const id = Number(this.route.snapshot.paramMap.get('id')); // URL içindeki id değerini alıp numbera çevirir

    if (!Number.isInteger(id) || id <= 0) {
      this.errorMessage.set('Invalid event ID.');
      return;
    }

    this.loadEvent(id);
  }

  loadEvent(id: number): void { // verilen idye göre etkinlik detayını getirir
    this.loading.set(true);
    this.errorMessage.set('');

    this.eventService.getById(id).subscribe({
      next: event => {
        this.event.set(event);
        this.loading.set(false);

        if (this.auth.hasRole('ClubManager')) {
          this.loadCheckedInParticipants(event.id);
          // kullanıcı ClubManager ise backendden etkinliğin katılımcı kayıtlarını istemeyi dener
        }
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(getApiErrorMessage(error, 'Could not load the event.'));
        this.loading.set(false);
      }
    });
  }

  register(): void { // giriş yapan kullanıcıyı etkinliğe kaydeder
    const eventItem = this.event();

    if (!eventItem) {
      return;
    }

    this.registering.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.registrationService.register(eventItem.id).subscribe({
      next: registration => {
        this.successMessage.set(`Registration created. Status: ${registration.approvalStatus}`);
        this.registering.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(getApiErrorMessage(error, 'Could not register for the event.'));
        this.registering.set(false);
      }
    });
  }

  private loadCheckedInParticipants(eventId: number): void { // etkinliğe qr ile giriş yapmış kullanıcıları getirir
    this.participantsLoading.set(true);
    this.checkedInParticipants.set([]);

    this.registrationService.getForEvent(eventId).subscribe({
      next: registrations => {
        const checkedIn = registrations.filter(registration => registration.checkedInAt !== null);
        // checkedInAt alanı dolu olan kayıtları filtreleyerek gerçekten qr ile giriş yapanları alır

        this.checkedInParticipants.set(checkedIn);
        this.canViewCheckedInParticipants.set(true);
        this.participantsLoading.set(false);
      },
      error: () => {
        this.checkedInParticipants.set([]);
        this.canViewCheckedInParticipants.set(false);
        this.participantsLoading.set(false);
        // manager etkinliğin sahibi değilse backend erişimi reddeder ve tablo gösterilmez
      }
    });
  }
}