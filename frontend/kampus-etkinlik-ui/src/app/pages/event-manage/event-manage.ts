import { Component, inject, OnInit, signal } from '@angular/core'; // Component, inject, OnInit ve signal kullanmak için
import { HttpErrorResponse } from '@angular/common/http'; // Backendden gelen HTTP hatalarını yakalamak için
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'; // Reactive Form ve validation işlemleri için
import { ActivatedRoute, Router } from '@angular/router'; // URL parametresini almak ve sayfa yönlendirmeleri için
import { AuthService } from '../../core/services/auth.service'; // Giriş yapan kullanıcı bilgileri için
import { ClubService } from '../../core/services/club.service'; // Kulüp verilerini backendden almak için
import { EventService } from '../../core/services/event.service'; // Etkinlik oluşturma, güncelleme, getirme ve iptal işlemleri için
import { ClubResponse, CreateEventRequest, EventVisibility, UpdateEventRequest } from '../../core/models/api.models'; // Kullanılan etkinlik ve kulüp modelleri
import { getApiErrorMessage } from '../../core/utils/api-error'; // Backend hatalarını anlaşılır mesaja çevirmek için

@Component({ // Bu classın Angular componenti olduğunu belirtir
  selector: 'app-event-manage', // Componentin selector adı
  standalone: true, // Componentin NgModule olmadan bağımsız çalışmasını sağlar
  imports: [ReactiveFormsModule], // Template içinde Reactive Form kullanılmasını sağlar
  template: `
    <!-- Etkinlik yönetim sayfası -->
    <section class="event-manage-page">

      <!-- Sayfa başlığı -->
      <div class="page-header">
        <h1>{{ isEditMode() ? 'Update Event' : 'Create Event' }}</h1> <!-- Moda göre başlığı değiştirir -->
        <p>{{ isEditMode() ? 'You can edit the event information.' : 'You can create a new event for your club.' }}</p> <!-- Moda göre açıklamayı değiştirir -->
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
              <select id="clubId" formControlName="clubId"> <!-- Seçilen kulübü clubId alanına bağlar -->
                <option value="">Select a club</option>
                @for (club of myClubs(); track club.id) {
                  <option [value]="club.id">{{ club.name }}</option> <!-- Managerın yönettiği kulüpleri listeler -->
                }
              </select>
            </div>
          }

          <!-- Etkinlik başlığı -->
          <div class="form-field full-width">
            <label for="title">Title</label>
            <input id="title" type="text" formControlName="title" placeholder="Enter the event title"> <!-- Başlığı forma bağlar -->
          </div>

          <!-- Etkinlik açıklaması -->
          <div class="form-field full-width">
            <label for="description">Description</label>
            <textarea id="description" formControlName="description" rows="6" placeholder="Enter the event description"></textarea> <!-- Açıklamayı forma bağlar -->
          </div>

          <!-- Başlangıç tarihi -->
          <div class="form-field">
            <label for="startDate">Start Date</label>
            <input id="startDate" type="datetime-local" formControlName="startDate"> <!-- Tarihi forma bağlar -->
          </div>

          <!-- Konum -->
          <div class="form-field">
            <label for="location">Location</label>
            <input id="location" type="text" formControlName="location" placeholder="e.g. Conference Hall"> <!-- Konumu forma bağlar -->
          </div>

          <!-- Kapasite -->
          <div class="form-field">
            <label for="capacity">Capacity</label>
            <input id="capacity" type="number" min="1" formControlName="capacity" placeholder="e.g. 100"> <!-- Kapasiteyi forma bağlar -->
          </div>

          <!-- Kategori -->
          <div class="form-field">
            <label for="category">Category</label>
            <input id="category" type="text" formControlName="category" placeholder="e.g. Technology"> <!-- Kategoriyi forma bağlar -->
          </div>

          <!-- Katılım tipi -->
          <div class="form-field full-width">
            <label for="visibility">Participation Type</label>
            <select id="visibility" formControlName="visibility"> <!-- Katılım tipini visibility alanına bağlar -->
              <option value="Public">Open to Everyone</option> <!-- Direkt kayıt olunabilir -->
              <option value="ApprovalRequired">Approval Required</option> <!-- Manager onayı gerekir -->
            </select>
          </div>
        </div>

        <!-- Form işlem butonları -->
        <div class="form-actions">
          <button class="save-button" type="submit" [disabled]="form.invalid || saving()"> <!-- Form geçersizse veya işlem devam ediyorsa pasif olur -->
            {{ saving() ? 'Processing...' : (isEditMode() ? 'Update Event' : 'Create Event') }}
          </button>

          <!-- Sadece güncelleme modunda iptal butonu gösterilir -->
          @if (isEditMode()) {
            <button class="cancel-button" type="button" [disabled]="saving()" (click)="cancelEvent()">
              Cancel Event
            </button>
          }
        </div>
      </form>
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

  readonly isEditMode = signal(false); // Sayfanın oluşturma mı güncelleme mi olduğunu tutar
  readonly myClubs = signal<ClubResponse[]>([]); // Managerın yönettiği kulüpleri tutar
  readonly loading = signal(false); // Etkinlik bilgileri yüklenme durumunu tutar
  readonly saving = signal(false); // Oluşturma, güncelleme veya iptal işleminin durumunu tutar
  readonly errorMessage = signal(''); // Hata mesajını tutar
  readonly successMessage = signal(''); // Başarı mesajını tutar

  readonly form = this.fb.nonNullable.group({ // Etkinlik formunu ve validation kurallarını oluşturur
    clubId: ['', [Validators.required]], // Kulüp seçimini zorunlu yapar
    title: ['', [Validators.required, Validators.maxLength(200)]], // Başlık zorunlu ve maksimum 200 karakter
    description: ['', [Validators.required, Validators.maxLength(3000)]], // Açıklama zorunlu ve maksimum 3000 karakter
    startDate: ['', [Validators.required]], // Başlangıç tarihini zorunlu yapar
    location: ['', [Validators.required, Validators.maxLength(250)]], // Konum zorunlu ve maksimum 250 karakter
    capacity: [1, [Validators.required, Validators.min(1)]], // Kapasite zorunlu ve minimum 1
    category: ['', [Validators.required, Validators.maxLength(100)]], // Kategori zorunlu ve maksimum 100 karakter
    visibility: ['Public' as EventVisibility, [Validators.required]] // Katılım tipi zorunlu ve varsayılan Public
  });

  ngOnInit(): void { // Sayfa ilk açıldığında otomatik çalışır
    this.loadMyClubs(); // Managerın yönettiği kulüpleri getirir

    const idParam = this.route.snapshot.paramMap.get('id'); // URL içindeki id parametresini alır

    if (!idParam) { // URLde id yoksa oluşturma modunda kalır
      return; // Metodun devam etmesini engeller
    }

    const id = Number(idParam); // URLden gelen IDyi number tipine çevirir

    if (!Number.isInteger(id) || id <= 0) { // ID geçerli pozitif tam sayı değilse
      this.errorMessage.set('Invalid event ID.'); // Hata mesajı gösterir
      return; // İşlemi durdurur
    }

    this.eventId = id; // Etkinlik IDsini kaydeder
    this.isEditMode.set(true); // Sayfayı güncelleme moduna geçirir
    this.loadEvent(id); // Etkinlik bilgilerini backendden getirir
  }

  loadMyClubs(): void { // Managerın yönettiği kulüpleri backendden getirir
    this.clubService.getAll().subscribe({ // Backendden bütün kulüpleri ister
      next: clubs => { // İstek başarılı olduğunda çalışır
        const user = this.auth.currentUser(); // Giriş yapan kullanıcıyı alır

        if (!user) { // Kullanıcı bilgisi yoksa
          this.myClubs.set([]); // Kulüp listesini boşaltır
          return; // Metodu sonlandırır
        }

        this.myClubs.set(
          clubs.filter(club => club.managerUserId === user.userId) // Sadece kullanıcının yönettiği kulüpleri alır
        );
      },
      error: (error: HttpErrorResponse) => { // Kulüpler alınırken hata oluşursa
        this.myClubs.set([]); // Kulüp listesini boşaltır
        this.errorMessage.set(
          getApiErrorMessage(error, 'Could not load clubs.') // Hatayı kullanıcıya uygun mesaja çevirir
        );
      }
    });
  }

  loadEvent(id: number): void { // Güncellenecek etkinliğin bilgilerini backendden getirir
    this.loading.set(true); // Yükleme işlemini başlatır
    this.errorMessage.set(''); // Önceki hata mesajını temizler

    this.eventService.getById(id).subscribe({ // IDye göre etkinlik detayını ister
      next: event => { // İstek başarılı olduğunda çalışır
        this.form.patchValue({ // Gelen etkinlik bilgilerini forma yerleştirir
          clubId: String(event.clubId), // Kulüp IDsini string olarak forma aktarır
          title: event.title, // Başlığı forma aktarır
          description: event.description, // Açıklamayı forma aktarır
          startDate: this.toDateTimeLocal(event.startDate), // Tarihi datetime-local formatına çevirir
          location: event.location, // Konumu forma aktarır
          capacity: event.capacity, // Kapasiteyi forma aktarır
          category: event.category, // Kategoriyi forma aktarır
          visibility: event.visibility // Katılım tipini forma aktarır
        });
        this.loading.set(false); // Yükleme işlemini bitirir
      },
      error: (error: HttpErrorResponse) => { // Etkinlik bilgileri alınırken hata oluşursa
        this.errorMessage.set(
          getApiErrorMessage(error, 'Could not load event information.') // Hatayı anlaşılır mesaja çevirir
        );
        this.loading.set(false); // Hata olsa bile yüklemeyi bitirir
      }
    });
  }

  submit(): void { // Form gönderildiğinde oluşturma veya güncelleme işlemini başlatır
    if (this.form.invalid || this.saving()) { // Form geçersizse veya işlem devam ediyorsa
      return; // Yeni işlem başlatılmasını engeller
    }

    this.saving.set(true); // Kaydetme işlemini başlatır
    this.errorMessage.set(''); // Önceki hata mesajını temizler
    this.successMessage.set(''); // Önceki başarı mesajını temizler

    const value = this.form.getRawValue(); // Formdaki bütün değerleri alır

    const commonRequest = { // Oluşturma ve güncellemede ortak kullanılacak alanları toplar
      title: value.title.trim(), // Başlığın gereksiz boşluklarını temizler
      description: value.description.trim(), // Açıklamanın gereksiz boşluklarını temizler
      startDate: new Date(value.startDate).toISOString(), // Tarihi backend için ISO formatına çevirir
      location: value.location.trim(), // Konumun gereksiz boşluklarını temizler
      capacity: Number(value.capacity), // Kapasiteyi number tipine çevirir
      category: value.category.trim(), // Kategorinin gereksiz boşluklarını temizler
      visibility: value.visibility // Katılım tipini requeste ekler
    };

    if (this.isEditMode() && this.eventId) { // Güncelleme modundaysa ve etkinlik IDsi varsa
      const request: UpdateEventRequest = {
        ...commonRequest // Ortak alanları güncelleme requestine ekler
      };

      this.updateEvent(this.eventId, request); // Güncelleme metodunu çağırır
      return; // Oluşturma kodunun çalışmasını engeller
    }

    const request: CreateEventRequest = {
      clubId: Number(value.clubId), // Seçilen kulüp IDsini number tipine çevirir
      ...commonRequest // Ortak alanları oluşturma requestine ekler
    };

    this.createEvent(request); // Yeni etkinlik oluşturur
  }

  createEvent(request: CreateEventRequest): void { // Yeni etkinlik oluşturma isteğini backend'e gönderir
    this.eventService.create(request).subscribe({ // EventService üzerinden oluşturma isteği gönderir
      next: event => { // Etkinlik başarıyla oluşturulduğunda çalışır
        this.saving.set(false); // Kaydetme işlemini bitirir
        void this.router.navigate(['/events', event.id]); // Yeni etkinliğin detay sayfasına gider
      },
      error: (error: HttpErrorResponse) => { // Oluşturma sırasında hata oluşursa
        this.errorMessage.set(
          getApiErrorMessage(error, 'Could not create the event.') // Hatayı anlaşılır mesaja çevirir
        );
        this.saving.set(false); // Hata olsa bile kaydetme işlemini bitirir
      }
    });
  }

  updateEvent(id: number, request: UpdateEventRequest): void { // Var olan etkinliği günceller
    this.eventService.update(id, request).subscribe({ // EventService üzerinden güncelleme isteği gönderir
      next: event => { // Güncelleme başarılı olduğunda çalışır
        this.successMessage.set('Event updated.'); // Başarı mesajını gösterir

        this.form.patchValue({ // Backendden dönen güncel bilgileri tekrar forma yerleştirir
          title: event.title, // Güncel başlığı forma aktarır
          description: event.description, // Güncel açıklamayı forma aktarır
          startDate: this.toDateTimeLocal(event.startDate), // Tarihi datetime-local formatına çevirir
          location: event.location, // Güncel konumu forma aktarır
          capacity: event.capacity, // Güncel kapasiteyi forma aktarır
          category: event.category, // Güncel kategoriyi forma aktarır
          visibility: event.visibility // Güncel katılım tipini forma aktarır
        });

        this.saving.set(false); // Güncelleme işlemini bitirir
      },
      error: (error: HttpErrorResponse) => { // Güncelleme sırasında hata oluşursa
        this.errorMessage.set(
          getApiErrorMessage(error, 'Could not update the event.') // Hatayı anlaşılır mesaja çevirir
        );
        this.saving.set(false); // Hata olsa bile kaydetme işlemini bitirir
      }
    });
  }

  cancelEvent(): void { // Mevcut etkinliği iptal eder
    if (!this.eventId || this.saving()) { // Etkinlik IDsi yoksa veya işlem devam ediyorsa
      return; // İptal işlemini başlatmaz
    }

    const approved = window.confirm('Are you sure you want to cancel the event?'); // Kullanıcıdan iptal onayı ister

    if (!approved) { // Kullanıcı onaylamadıysa
      return; // İşlemi iptal eder
    }

    this.saving.set(true); // İptal işlemini başlatır
    this.errorMessage.set(''); // Önceki hata mesajını temizler
    this.successMessage.set(''); // Önceki başarı mesajını temizler

    this.eventService.cancel(this.eventId).subscribe({ // EventService üzerinden iptal isteği gönderir
      next: () => { // İptal işlemi başarılı olduğunda çalışır
        this.successMessage.set('Event cancelled.'); // Başarı mesajını gösterir
        this.saving.set(false); // İptal işlemini bitirir
      },
      error: (error: HttpErrorResponse) => { // İptal sırasında hata oluşursa
        this.errorMessage.set(
          getApiErrorMessage(error, 'Could not cancel the event.') // Hatayı anlaşılır mesaja çevirir
        );
        this.saving.set(false); // Hata olsa bile işlemi bitirir
      }
    });
  }

  private toDateTimeLocal(value: string): string { // Backend tarihini datetime-local input formatına çevirir
    const date = new Date(value); // Tarih stringini Date nesnesine çevirir
    const pad = (number: number) => number.toString().padStart(2, '0'); // Tek haneli değerlerin başına 0 ekler

    return (
      date.getFullYear() + // Yılı ekler
      '-' +
      pad(date.getMonth() + 1) + // Ayı ekler, JavaScript ayları 0dan başlattığı için 1 eklenir
      '-' +
      pad(date.getDate()) + // Günü ekler
      'T' +
      pad(date.getHours()) + // Saati ekler
      ':' +
      pad(date.getMinutes()) // Dakikayı ekler
    );
  }
}