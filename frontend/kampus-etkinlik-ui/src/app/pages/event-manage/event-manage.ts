import { Component, inject, OnInit, signal } from '@angular/core'; // Component, inject, OnInit ve signal kullanmak için
import { HttpErrorResponse } from '@angular/common/http'; // Backendden gelen HTTP hatalarını yakalamak için
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'; // Reactive Form ve validation işlemleri için
import { ActivatedRoute, Router } from '@angular/router'; // URL parametresini almak ve sayfa yönlendirmeleri için
import { AuthService } from '../../core/services/auth.service'; // Giriş yapan kullanıcı bilgileri için
import { ClubService } from '../../core/services/club.service'; // Kulüp verilerini backendden almak için
import { EventService } from '../../core/services/event.service'; // Etkinlik oluşturma, güncelleme, getirme ve iptal işlemleri için
import { ClubResponse, CreateEventRequest, EventVisibility, UpdateEventRequest } from '../../core/models/api.models'; // Kullanılan etkinlik ve kulüp modelleri
import { getApiErrorMessage } from '../../core/utils/api-error'; // Backend hatalarını anlaşılır mesaja çevirmek için
import { DatePickerModule } from 'primeng/datepicker'; // primeng datepicker componentini kullanmak için
import * as QRCode from 'qrcode'; // backendden gelen güvenli check-in adresini qr koda çevirmek için

@Component({ // Bu classın Angular componenti olduğunu belirtir
  selector: 'app-event-manage', // Componentin selector adı
  standalone: true, // Componentin NgModule olmadan bağımsız çalışmasını sağlar
  imports: [
    ReactiveFormsModule, // Template içinde Reactive Form kullanılmasını sağlar
    DatePickerModule // primeng datepicker componentini template içinde kullanmamızı sağlar
  ],
  template: `
    <!-- Etkinlik yönetim sayfası -->
    <section class="event-manage-page">

      <!-- Sayfa başlığı -->
      <div class="page-header">
        <h1>{{ isEditMode() ? 'Update Event' : 'Create Event' }}</h1>
        <p>{{ isEditMode() ? 'You can edit the event information.' : 'You can create a new event for your club.' }}</p>
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

      <!-- Başarılı işlem mesajı -->
      @if (successMessage()) {
        <div class="page-message success-message">
          {{ successMessage() }}
        </div>
      }

      <!-- Formu TypeScript tarafındaki form değişkenine bağlar -->
      <form class="event-form" [formGroup]="form" (ngSubmit)="submit()">

        <!-- Form başlığı -->
        <div class="form-header">
          <h2>Event Information</h2>
          <p>Complete the required fields to finish the process.</p>
        </div>

        <!-- Form alanları -->
        <div class="form-content">

          <!-- Sadece oluşturma modunda kulüp seçimi gösterilir -->
          @if (!isEditMode()) {
            <div class="form-field full-width">
              <label for="clubId">Club</label>

              <select id="clubId" formControlName="clubId">
                <option value="">Select a club</option>

                @for (club of myClubs(); track club.id) {
                  <option [value]="club.id">{{ club.name }}</option>
                }
              </select>
            </div>
          }

          <!-- Etkinlik başlığı -->
          <div class="form-field full-width">
            <label for="title">Title</label>

            <input
              id="title"
              type="text"
              formControlName="title"
              placeholder="Enter the event title"
            >
          </div>

          <!-- Etkinlik açıklaması -->
          <div class="form-field full-width">
            <label for="description">Description</label>

            <textarea
              id="description"
              formControlName="description"
              rows="6"
              placeholder="Enter the event description"
            ></textarea>
          </div>

          <!-- Başlangıç tarihi -->
          <div class="form-field">
            <label for="startDate">Start Date</label>

            <!-- tarihi ve saati primeng datepicker üzerinden seçmemizi sağlar -->
            <p-datepicker
              inputId="startDate"
              formControlName="startDate"
              dateFormat="dd/mm/yy"
              [showTime]="true"
              hourFormat="24"
              [showIcon]="true"
              [fluid]="true"
              [minDate]="minimumDate"
            >
            </p-datepicker>
          </div>

          <!-- Konum -->
          <div class="form-field">
            <label for="location">Location</label>

            <input
              id="location"
              type="text"
              formControlName="location"
              placeholder="e.g. Conference Hall"
            >
          </div>

          <!-- Kapasite -->
          <div class="form-field">
            <label for="capacity">Capacity</label>

            <input
              id="capacity"
              type="number"
              min="1"
              formControlName="capacity"
              placeholder="e.g. 100"
            >
          </div>

          <!-- Kategori -->
          <div class="form-field">
            <label for="category">Category</label>

            <input
              id="category"
              type="text"
              formControlName="category"
              placeholder="e.g. Technology"
            >
          </div>

          <!-- Katılım tipi -->
          <div class="form-field full-width">
            <label for="visibility">Participation Type</label>

            <select
              id="visibility"
              formControlName="visibility"
            >
              <option value="Public">Open to Everyone</option>
              <option value="ApprovalRequired">Approval Required</option>
            </select>
          </div>

        </div>

        <!-- Form işlem butonları -->
        <div class="form-actions">

          <button
            class="save-button"
            type="submit"
            [disabled]="form.invalid || saving()"
          >
            {{ saving() ? 'Processing...' : (isEditMode() ? 'Update Event' : 'Create Event') }}
          </button>

          <!-- Sadece güncelleme modunda iptal butonu gösterilir -->
          @if (isEditMode()) {
            <button
              class="cancel-button"
              type="button"
              [disabled]="saving()"
              (click)="cancelEvent()"
            >
              Cancel Event
            </button>
          }

        </div>

      </form>

      <!-- qr kod sadece mevcut bir etkinlik düzenlenirken oluşturulabilir -->
      @if (isEditMode()) {
        <section class="qr-card">

          <div class="qr-header">
            <div>
              <h2>Event Check-In QR</h2>
              <p>Create a temporary QR code for students attending this event.</p>
            </div>
          </div>

          <div class="qr-controls">

            <div class="qr-duration-field">
              <label for="qrDuration">QR Duration</label>

              <select
                id="qrDuration"
                [formControl]="qrDurationControl"
              >
                <option [ngValue]="5">5 minutes</option>
                <option [ngValue]="10">10 minutes</option>
                <option [ngValue]="15">15 minutes</option>
                <option [ngValue]="30">30 minutes</option>
                <option [ngValue]="60">60 minutes</option>
              </select>
            </div>

            <button
              class="qr-button"
              type="button"
              [disabled]="generatingQr()"
              (click)="generateQrCode()"
            >
              {{ generatingQr() ? 'Generating...' : 'Generate QR Code' }}
            </button>

          </div>

          @if (qrErrorMessage()) {
            <div class="qr-message qr-error-message">
              {{ qrErrorMessage() }}
            </div>
          }

          @if (qrImageUrl()) {
            <div class="qr-result">

              <div class="qr-image-box">
                <img
                  [src]="qrImageUrl()"
                  alt="Event check-in QR code"
                >
              </div>

              <div class="qr-info">

                <h3>QR Code Ready</h3>

                <p>
                  Students registered and approved for this event can scan this QR code to check in.
                </p>

                <div class="qr-expiry">
                  Valid until:
                  <strong>{{ formatQrExpiry() }}</strong>
                </div>

                <div class="qr-link">
                  {{ qrCheckInUrl() }}
                </div>

                <p class="qr-warning">
                  Creating a new QR code disables the previous active QR code.
                </p>

              </div>

            </div>
          }

        </section>
      }

    </section>
  `,
  styleUrl: './event-manage.scss' // Componentin tasarım dosyası
})
export class EventManage implements OnInit {
  readonly auth = inject(AuthService); // Giriş yapan kullanıcı bilgilerine erişmek için
  private readonly fb = inject(FormBuilder); // Reactive Form oluşturmak için
  private readonly route = inject(ActivatedRoute); // URL içindeki etkinlik IDsini okumak için
  private readonly router = inject(Router); // Sayfa yönlendirmeleri yapmak için
  private readonly clubService = inject(ClubService); // Kulüp verilerini backendden almak için
  private readonly eventService = inject(EventService); // Etkinlik işlemlerini yapmak için

  private eventId: number | null = null; // Güncellenen veya iptal edilen etkinliğin IDsini tutar

  readonly minimumDate = new Date(); // datepickerda geçmiş bir tarih seçilmesini engellemek için şu anki tarihi tutar

  readonly isEditMode = signal(false); // Sayfanın oluşturma mı güncelleme mi olduğunu tutar
  readonly myClubs = signal<ClubResponse[]>([]); // Managerın yönettiği kulüpleri tutar
  readonly loading = signal(false); // Etkinlik bilgileri yüklenme durumunu tutar
  readonly saving = signal(false); // Oluşturma, güncelleme veya iptal işleminin durumunu tutar
  readonly errorMessage = signal(''); // Hata mesajını tutar
  readonly successMessage = signal(''); // Başarı mesajını tutar

  readonly generatingQr = signal(false);
  // qr kod oluşturma işleminin devam edip etmediğini tutar

  readonly qrImageUrl = signal('');
  // qrcode kütüphanesi tarafından oluşturulan qr görselini tutar

  readonly qrCheckInUrl = signal('');
  // qr kod içerisine yazılan check-in adresini tutar

  readonly qrExpiresAt = signal('');
  // qr kodun geçerliliğinin biteceği zamanı tutar

  readonly qrErrorMessage = signal('');
  // qr oluşturulurken oluşan hata mesajını tutar

  readonly qrDurationControl = this.fb.nonNullable.control(
    10,
    [
      Validators.required,
      Validators.min(1),
      Validators.max(120)
    ]
  );
  // qr kodun kaç dakika geçerli olacağını tutar

  readonly form = this.fb.nonNullable.group({
    clubId: ['', [Validators.required]], // Kulüp seçimini zorunlu yapar
    title: ['', [Validators.required, Validators.maxLength(200)]], // Başlık zorunlu ve maksimum 200 karakter
    description: ['', [Validators.required, Validators.maxLength(3000)]], // Açıklama zorunlu ve maksimum 3000 karakter

    // primeng datepicker date nesnesi kullandığı için tarih alanını date veya null olarak tutar
    startDate: this.fb.control<Date | null>(null, [Validators.required]),

    location: ['', [Validators.required, Validators.maxLength(250)]], // Konum zorunlu ve maksimum 250 karakter
    capacity: [1, [Validators.required, Validators.min(1)]], // Kapasite zorunlu ve minimum 1
    category: ['', [Validators.required, Validators.maxLength(100)]], // Kategori zorunlu ve maksimum 100 karakter
    visibility: ['Public' as EventVisibility, [Validators.required]] // Katılım tipi zorunlu ve varsayılan Public
  });

  ngOnInit(): void {
    this.loadMyClubs(); // Managerın yönettiği kulüpleri getirir

    const idParam = this.route.snapshot.paramMap.get('id'); // URL içindeki id parametresini alır

    if (!idParam) {
      return;
    }

    const id = Number(idParam);

    if (!Number.isInteger(id) || id <= 0) {
      this.errorMessage.set('Invalid event ID.');
      return;
    }

    this.eventId = id;
    this.isEditMode.set(true);
    this.loadEvent(id);
  }

  loadMyClubs(): void {
    this.clubService.getAll().subscribe({
      next: clubs => {
        const user = this.auth.currentUser();

        if (!user) {
          this.myClubs.set([]);
          return;
        }

        this.myClubs.set(
          clubs.filter(club => club.managerUserId === user.userId)
        );
      },
      error: (error: HttpErrorResponse) => {
        this.myClubs.set([]);

        this.errorMessage.set(
          getApiErrorMessage(error, 'Could not load clubs.')
        );
      }
    });
  }

  loadEvent(id: number): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.eventService.getById(id).subscribe({
      next: event => {
        this.form.patchValue({
          clubId: String(event.clubId),
          title: event.title,
          description: event.description,
          startDate: new Date(event.startDate),
          location: event.location,
          capacity: event.capacity,
          category: event.category,
          visibility: event.visibility
        });

        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(
          getApiErrorMessage(error, 'Could not load event information.')
        );

        this.loading.set(false);
      }
    });
  }

  submit(): void {
    if (this.form.invalid || this.saving()) {
      return;
    }

    this.saving.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const value = this.form.getRawValue();

    if (!value.startDate) {
      this.errorMessage.set('Please select a start date.');
      this.saving.set(false);
      return;
    }

    const commonRequest = {
      title: value.title.trim(),
      description: value.description.trim(),

      startDate: value.startDate.toISOString(),

      location: value.location.trim(),
      capacity: Number(value.capacity),
      category: value.category.trim(),
      visibility: value.visibility
    };

    if (this.isEditMode() && this.eventId) {
      const request: UpdateEventRequest = {
        ...commonRequest
      };

      this.updateEvent(this.eventId, request);
      return;
    }

    const request: CreateEventRequest = {
      clubId: Number(value.clubId),
      ...commonRequest
    };

    this.createEvent(request);
  }

  createEvent(request: CreateEventRequest): void {
    this.eventService.create(request).subscribe({
      next: event => {
        this.saving.set(false);

        void this.router.navigate([
          '/events',
          event.id
        ]);
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(
          getApiErrorMessage(error, 'Could not create the event.')
        );

        this.saving.set(false);
      }
    });
  }

  updateEvent(
    id: number,
    request: UpdateEventRequest
  ): void {
    this.eventService.update(id, request).subscribe({
      next: event => {
        this.successMessage.set('Event updated.');

        this.form.patchValue({
          title: event.title,
          description: event.description,
          startDate: new Date(event.startDate),
          location: event.location,
          capacity: event.capacity,
          category: event.category,
          visibility: event.visibility
        });

        this.saving.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(
          getApiErrorMessage(error, 'Could not update the event.')
        );

        this.saving.set(false);
      }
    });
  }

  cancelEvent(): void {
    if (!this.eventId || this.saving()) {
      return;
    }

    const approved = window.confirm(
      'Are you sure you want to cancel the event?'
    );

    if (!approved) {
      return;
    }

    this.saving.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.eventService.cancel(this.eventId).subscribe({
      next: () => {
        this.successMessage.set('Event cancelled.');
        this.saving.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(
          getApiErrorMessage(error, 'Could not cancel the event.')
        );

        this.saving.set(false);
      }
    });
  }

  generateQrCode(): void {
    if (
      !this.eventId ||
      this.generatingQr() ||
      this.qrDurationControl.invalid
    ) {
      return;
    }

    this.generatingQr.set(true);
    this.qrErrorMessage.set('');
    this.qrImageUrl.set('');
    this.qrCheckInUrl.set('');
    this.qrExpiresAt.set('');

    this.eventService.createCheckInSession(
      this.eventId,
      {
        expiresInMinutes: this.qrDurationControl.getRawValue()
      }
    ).subscribe({
      next: async response => {
        try {
          const checkInUrl =
            `${window.location.origin}/check-in?token=${encodeURIComponent(response.token)}`;

          // backendden gelen tokenı öğrencinin açacağı frontend check-in adresine ekler
          const qrImage = await QRCode.toDataURL(
            checkInUrl,
            {
              width: 320,
              margin: 2,
              errorCorrectionLevel: 'M'
            }
          );

          // oluşturulan check-in adresini qrcode kütüphanesi ile görsele çevirir
          this.qrCheckInUrl.set(checkInUrl);
          this.qrExpiresAt.set(response.expiresAt);
          this.qrImageUrl.set(qrImage);
        } catch {
          this.qrErrorMessage.set(
            'QR image could not be created.'
          );
        } finally {
          this.generatingQr.set(false);
        }
      },
      error: (error: HttpErrorResponse) => {
        this.qrErrorMessage.set(
          getApiErrorMessage(
            error,
            'Could not create the QR code.'
          )
        );

        this.generatingQr.set(false);
      }
    });
  }

  formatQrExpiry(): string {
    const expiresAt = this.qrExpiresAt();

    if (!expiresAt) {
      return '';
    }

    return new Date(expiresAt).toLocaleString();
    // backendden gelen utc tarihi kullanıcının yerel saatine çevirerek gösterir
  }
}