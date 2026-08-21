import { Component, inject, OnInit, signal } from '@angular/core'; // Angular componenti, servis enjeksiyonu, OnInit ve signal yapısını kullanmak için gerekli araçları içe aktarır.
import { HttpErrorResponse } from '@angular/common/http'; // Backendden gelen HTTP hatalarını yakalamak için kullanılır.
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'; // Reactive Form oluşturmak ve validation kurallarını kullanmak için gerekli yapıları içe aktarır.
import { ActivatedRoute, Router } from '@angular/router'; // URLdeki etkinlik IDsini almak ve sayfalar arasında yönlendirme yapmak için kullanılır.

import { AuthService } from '../../core/services/auth.service'; // Giriş yapan kullanıcının bilgilerine erişmemizi sağlar.
import { ClubService } from '../../core/services/club.service'; // Kulüp verilerini backendden almak için kullanılır.
import { EventService } from '../../core/services/event.service'; // Etkinlik oluşturma, güncelleme, getirme ve iptal işlemlerini yapar.
import { ClubResponse, CreateEventRequest, EventVisibility, UpdateEventRequest } from '../../core/models/api.models'; // Form ve backend cevaplarında kullanılan TypeScript tiplerini içe aktarır.
import { getApiErrorMessage } from '../../core/utils/api-error'; // Backend hatalarını kullanıcıya gösterilecek anlaşılır mesaja dönüştürür.

@Component({ // Bu classın Angular componenti olduğunu belirtir.
  selector: 'app-event-manage', // Componentin selector adını belirler.
  standalone: true, // Componentin NgModule kullanmadan bağımsız çalışmasını sağlar.
  imports: [ReactiveFormsModule], // Template içinde formGroup ve formControlName kullanabilmemizi sağlar.
  template: `
    <!-- Sayfanın tamamını kapsayan ana alan -->
    <section class="event-manage-page">

      <!-- Sayfa başlığı -->
      <div class="page-header">
        <h1>{{ isEditMode() ? 'Etkinlik Güncelle' : 'Etkinlik Oluştur' }}</h1> <!-- Edit modundaysa Güncelle, değilse Oluştur başlığını gösterir. -->
        <p>{{ isEditMode() ? 'Etkinlik bilgilerini düzenleyebilirsiniz.' : 'Kulübünüz için yeni bir etkinlik oluşturabilirsiniz.' }}</p> <!-- Sayfanın moduna göre açıklama gösterir. -->
      </div>

      <!-- Backend isteği devam ederken gösterilir -->
      @if (loading()) {
        <div class="page-message">
          Etkinlik bilgileri yükleniyor...
        </div>
      }

      <!-- Hata oluştuğunda gösterilir -->
      @if (errorMessage()) {
        <div class="page-message error-message">
          {{ errorMessage() }}
        </div>
      }

      <!-- İşlem başarılı olduğunda gösterilir -->
      @if (successMessage()) {
        <div class="page-message success-message">
          {{ successMessage() }}
        </div>
      }

      <!-- Etkinlik oluşturma ve güncelleme formunu Angular Reactive Form yapısına bağlar -->
      <form class="event-form" [formGroup]="form" (ngSubmit)="submit()">

        <!-- Formun üst açıklama alanıdır -->
        <div class="form-header">
          <h2>Etkinlik Bilgileri</h2> <!-- Form bölümünün başlığını gösterir. -->
          <p>Zorunlu alanları doldurarak işlemi tamamlayabilirsiniz.</p> <!-- Kullanıcıya form hakkında kısa bilgi verir. -->
        </div>

        <!-- Form alanlarının tamamını kapsar -->
        <div class="form-content">

          <!-- Sadece yeni etkinlik oluşturulurken kulüp seçimi gösterilir -->
          @if (!isEditMode()) {
            <div class="form-field full-width">
              <label for="clubId">Kulüp</label> <!-- Kulüp seçim alanının başlığıdır. -->
              <select id="clubId" formControlName="clubId"> <!-- Seçilen kulübü formdaki clubId alanına bağlar. -->
                <option value="">Kulüp seçin</option> <!-- Varsayılan boş seçeneği gösterir. -->
                @for (club of myClubs(); track club.id) {
                  <option [value]="club.id">{{ club.name }}</option> <!-- Giriş yapan managerın yönettiği kulüpleri listeler. -->
                }
              </select>
            </div>
          }

          <!-- Başlık alanı -->
          <div class="form-field full-width">
            <label for="title">Başlık</label> <!-- Etkinlik başlığı inputunun açıklamasıdır. -->
            <input id="title" type="text" formControlName="title" placeholder="Etkinlik başlığını girin"> <!-- Başlık değerini formdaki title alanına bağlar. -->
          </div>

          <!-- Açıklama alanı -->
          <div class="form-field full-width">
            <label for="description">Açıklama</label> <!-- Açıklama alanının başlığıdır. -->
            <textarea id="description" formControlName="description" rows="6" placeholder="Etkinlik açıklamasını girin"></textarea> <!-- Etkinlik açıklamasını formdaki description alanına bağlar. -->
          </div>

          <!-- Tarih alanı -->
          <div class="form-field">
            <label for="startDate">Başlangıç Tarihi</label> <!-- Başlangıç tarihi alanının açıklamasıdır. -->
            <input id="startDate" type="datetime-local" formControlName="startDate"> <!-- Tarihi formdaki startDate alanına bağlar. -->
          </div>

          <!-- Konum alanı -->
          <div class="form-field">
            <label for="location">Konum</label> <!-- Konum inputunun açıklamasıdır. -->
            <input id="location" type="text" formControlName="location" placeholder="Örn: Konferans Salonu"> <!-- Konum değerini formdaki location alanına bağlar. -->
          </div>

          <!-- Kapasite alanı -->
          <div class="form-field">
            <label for="capacity">Kapasite</label> <!-- Kapasite inputunun açıklamasıdır. -->
            <input id="capacity" type="number" min="1" formControlName="capacity" placeholder="Örn: 100"> <!-- Maksimum katılımcı sayısını capacity alanına bağlar. -->
          </div>

          <!-- Kategori alanı -->
          <div class="form-field">
            <label for="category">Kategori</label> <!-- Kategori inputunun açıklamasıdır. -->
            <input id="category" type="text" formControlName="category" placeholder="Örn: Teknoloji"> <!-- Kategori değerini formdaki category alanına bağlar. -->
          </div>

          <!-- Katılım tipi alanı -->
          <div class="form-field full-width">
            <label for="visibility">Katılım Tipi</label> <!-- Katılım tipi seçim alanının başlığıdır. -->
            <select id="visibility" formControlName="visibility"> <!-- Seçilen katılım tipini formdaki visibility alanına bağlar. -->
              <option value="Public">Herkese Açık</option> <!-- Kullanıcının direkt kayıt olabildiği etkinlik tipidir. -->
              <option value="ApprovalRequired">Onay Gerekli</option> <!-- Kayıtların manager tarafından onaylanması gereken etkinlik tipidir. -->
            </select>
          </div>

        </div>

        <!-- Form işlemlerini içerir -->
        <div class="form-actions">
          <!-- Form geçersizse veya işlem devam ediyorsa buton devre dışı kalır -->
          <button class="save-button" type="submit" [disabled]="form.invalid || saving()">
            {{ saving() ? 'İşlem Yapılıyor...' : (isEditMode() ? 'Etkinliği Güncelle' : 'Etkinlik Oluştur') }}
          </button>

          <!-- Sadece güncelleme modunda etkinliği iptal etme butonu gösterilir -->
          @if (isEditMode()) {
            <button class="cancel-button" type="button" [disabled]="saving()" (click)="cancelEvent()">
              Etkinliği İptal Et
            </button>
          }
        </div>

      </form>

    </section>
  `,
  styleUrl: './event-manage.scss' // Bu componentin tasarımını event-manage.scss dosyasından almasını sağlar.
})
export class EventManage implements OnInit { // Etkinlik oluşturma ve güncelleme sayfasının TypeScript classıdır.
  readonly auth = inject(AuthService); // Giriş yapan kullanıcının bilgilerine erişmek için AuthService'i enjekte eder.
  private readonly fb = inject(FormBuilder); // Reactive Form oluşturmak için FormBuilder'ı enjekte eder.
  private readonly route = inject(ActivatedRoute); // URL içindeki etkinlik IDsini okumak için ActivatedRoute'u enjekte eder.
  private readonly router = inject(Router); // İşlem sonrası farklı sayfalara yönlendirme yapmak için Router'ı enjekte eder.
  private readonly clubService = inject(ClubService); // Kulüp verilerini backendden almak için ClubService'i enjekte eder.
  private readonly eventService = inject(EventService); // Etkinlik işlemlerini yapmak için EventService'i enjekte eder.

  private eventId: number | null = null; // Güncellenen veya iptal edilen etkinliğin IDsini tutar.

  readonly isEditMode = signal(false); // Sayfanın oluşturma mı güncelleme mi olduğunu tutar.
  readonly myClubs = signal<ClubResponse[]>([]); // Giriş yapan managerın yönettiği kulüpleri tutar.
  readonly loading = signal(false); // Etkinlik bilgileri yüklenirken işlemin devam edip etmediğini tutar.
  readonly saving = signal(false); // Oluşturma, güncelleme veya iptal işleminin devam edip etmediğini tutar.
  readonly errorMessage = signal(''); // Kullanıcıya gösterilecek hata mesajını tutar.
  readonly successMessage = signal(''); // Kullanıcıya gösterilecek başarılı işlem mesajını tutar.

  readonly form = this.fb.nonNullable.group({ // Etkinlik formunu ve validation kurallarını oluşturur.
    clubId: ['', [Validators.required]], // Kulüp seçimini zorunlu yapar.
    title: ['', [Validators.required, Validators.maxLength(200)]], // Başlığı zorunlu yapar ve maksimum 200 karakter sınırı koyar.
    description: ['', [Validators.required, Validators.maxLength(3000)]], // Açıklamayı zorunlu yapar ve maksimum 3000 karakter sınırı koyar.
    startDate: ['', [Validators.required]], // Başlangıç tarihini zorunlu yapar.
    location: ['', [Validators.required, Validators.maxLength(250)]], // Konumu zorunlu yapar ve maksimum 250 karakter sınırı koyar.
    capacity: [1, [Validators.required, Validators.min(1)]], // Kapasiteyi zorunlu yapar ve minimum 1 olmasını sağlar.
    category: ['', [Validators.required, Validators.maxLength(100)]], // Kategoriyi zorunlu yapar ve maksimum 100 karakter sınırı koyar.
    visibility: ['Public' as EventVisibility, [Validators.required]] // Katılım tipini zorunlu yapar ve varsayılan olarak Public seçer.
  });


  ngOnInit(): void { // Sayfa ilk açıldığında otomatik çalışan metottur.
    this.loadMyClubs(); // Giriş yapan managerın yönettiği kulüpleri backendden getirir.

    const idParam = this.route.snapshot.paramMap.get('id'); // URL içindeki id parametresini alır.

    if (!idParam) { // URLde id yoksa yeni etkinlik oluşturma modunda kalır.
      return; // Metodun devam etmesini engeller.
    }

    const id = Number(idParam); // URLden gelen string ID değerini number tipine çevirir.

    if (!Number.isInteger(id) || id <= 0) { // ID geçerli bir pozitif tam sayı değilse kontrol içerisine girer.
      this.errorMessage.set('Geçersiz etkinlik ID.'); // Kullanıcıya geçersiz etkinlik ID mesajı gösterir.
      return; // İşlemin devam etmesini engeller.
    }

    this.eventId = id; // Güncellenecek etkinliğin IDsini class değişkenine kaydeder.
    this.isEditMode.set(true); // Sayfanın güncelleme modunda olduğunu belirtir.
    this.loadEvent(id); // Etkinliğin mevcut bilgilerini backendden getirir.
  }


  loadMyClubs(): void { // Giriş yapan managerın yönettiği kulüpleri backendden getirir.
    this.clubService.getAll().subscribe({ // Backendden bütün kulüpleri getirir.
      next: clubs => { // Backend isteği başarılı olduğunda çalışır.
        const user = this.auth.currentUser(); // Giriş yapan kullanıcının bilgilerini alır.

        if (!user) { // Kullanıcı bilgisi bulunamazsa kontrol içerisine girer.
          this.myClubs.set([]); // Managerın kulüp listesini boş yapar.
          return; // Metodun devam etmesini engeller.
        }

        this.myClubs.set(
          clubs.filter(club => club.managerUserId === user.userId) // Sadece giriş yapan kullanıcının yönettiği kulüpleri filtreler.
        );
      },
      error: (error: HttpErrorResponse) => { // Kulüpler alınırken hata oluşursa çalışır.
        this.myClubs.set([]); // Kulüp listesini boşaltır.
        this.errorMessage.set(
          getApiErrorMessage(error, 'Kulüpler alınamadı.') // Backend hatasını kullanıcıya anlaşılır mesaja dönüştürür.
        );
      }
    });
  }


  loadEvent(id: number): void { // Güncellenecek etkinliğin mevcut bilgilerini backendden getirir.
    this.loading.set(true); // Yükleme işleminin başladığını belirtir.
    this.errorMessage.set(''); // Önceki hata mesajını temizler.

    this.eventService.getById(id).subscribe({ // Verilen IDye göre etkinlik detayını backendden ister.
      next: event => { // Backend isteği başarılı olduğunda çalışır.
        this.form.patchValue({ // Backendden gelen etkinlik bilgilerini form alanlarına yerleştirir.
          clubId: String(event.clubId), // Kulüp IDsini stringe çevirerek forma yerleştirir.
          title: event.title, // Etkinlik başlığını forma yerleştirir.
          description: event.description, // Etkinlik açıklamasını forma yerleştirir.
          startDate: this.toDateTimeLocal(event.startDate), // Backend tarihini datetime-local inputunun kullanacağı formata çevirir.
          location: event.location, // Etkinlik konumunu forma yerleştirir.
          capacity: event.capacity, // Etkinlik kapasitesini forma yerleştirir.
          category: event.category, // Etkinlik kategorisini forma yerleştirir.
          visibility: event.visibility // Etkinlik katılım tipini forma yerleştirir.
        });
        this.loading.set(false); // Yükleme işleminin tamamlandığını belirtir.
      },
      error: (error: HttpErrorResponse) => { // Etkinlik bilgileri alınırken hata oluşursa çalışır.
        this.errorMessage.set(
          getApiErrorMessage(error, 'Etkinlik bilgileri alınamadı.') // Backend hatasını kullanıcıya anlaşılır mesaja dönüştürür.
        );
        this.loading.set(false); // Hata olsa bile yükleme işlemini sonlandırır.
      }
    });
  }


  submit(): void { // Form gönderildiğinde oluşturma veya güncelleme işlemini başlatır.
    if (this.form.invalid || this.saving()) { // Form geçersizse veya işlem zaten devam ediyorsa kontrol içerisine girer.
      return; // İkinci bir işlem başlatılmasını engeller.
    }

    this.saving.set(true); // Kaydetme işleminin başladığını belirtir.
    this.errorMessage.set(''); // Önceki hata mesajını temizler.
    this.successMessage.set(''); // Önceki başarı mesajını temizler.

    const value = this.form.getRawValue(); // Formdaki bütün alanların güncel değerlerini alır.

    const commonRequest = { // Oluşturma ve güncelleme işlemlerinde ortak kullanılan alanları tek nesnede toplar.
      title: value.title.trim(), // Başlığın başındaki ve sonundaki boşlukları temizler.
      description: value.description.trim(), // Açıklamanın başındaki ve sonundaki boşlukları temizler.
      startDate: new Date(value.startDate).toISOString(), // Formdaki tarihi backendin kullanacağı ISO formatına çevirir.
      location: value.location.trim(), // Konum bilgisindeki gereksiz boşlukları temizler.
      capacity: Number(value.capacity), // Kapasite değerini number tipine çevirir.
      category: value.category.trim(), // Kategori bilgisindeki gereksiz boşlukları temizler.
      visibility: value.visibility // Seçilen katılım tipini requeste ekler.
    };

    if (this.isEditMode() && this.eventId) { // Sayfa güncelleme modundaysa ve geçerli etkinlik IDsi varsa çalışır.
      const request: UpdateEventRequest = {
        ...commonRequest // Ortak alanların tamamını güncelleme requestine kopyalar.
      };

      this.updateEvent(this.eventId, request); // Güncelleme metodunu çağırır.
      return; // Yeni etkinlik oluşturma kodunun çalışmasını engeller.
    }

    const request: CreateEventRequest = {
      clubId: Number(value.clubId), // Seçilen kulüp IDsini number tipine çevirip requeste ekler.
      ...commonRequest // Ortak etkinlik alanlarının tamamını oluşturma requestine ekler.
    };

    this.createEvent(request); // Yeni etkinlik oluşturma metodunu çağırır.
  }


  createEvent(request: CreateEventRequest): void { // Yeni etkinlik oluşturma isteğini backend'e gönderir.
    this.eventService.create(request).subscribe({ // EventService içindeki create metoduyla backend isteği gönderir.
      next: event => { // Etkinlik başarıyla oluşturulduğunda çalışır.
        this.saving.set(false); // Kaydetme işleminin bittiğini belirtir.
        void this.router.navigate(['/events', event.id]); // Kullanıcıyı yeni oluşturulan etkinliğin detay sayfasına yönlendirir.
      },
      error: (error: HttpErrorResponse) => { // Oluşturma işlemi hata verdiğinde çalışır.
        this.errorMessage.set(
          getApiErrorMessage(error, 'Etkinlik oluşturulamadı.') // Backend hatasını kullanıcıya anlaşılır mesaja dönüştürür.
        );
        this.saving.set(false); // Hata olsa bile kaydetme işlemini sonlandırır.
      }
    });
  }


  updateEvent(id: number, request: UpdateEventRequest): void { // Var olan etkinliğin bilgilerini güncellemek için backend'e istek gönderir.
    this.eventService.update(id, request).subscribe({ // EventService içindeki update metodunu çağırır.
      next: event => { // Güncelleme başarılı olduğunda çalışır.
        this.successMessage.set('Etkinlik güncellendi.'); // Kullanıcıya başarılı güncelleme mesajı gösterir.

        this.form.patchValue({ // Backendden dönen güncel etkinlik bilgilerini tekrar forma yerleştirir.
          title: event.title, // Güncel başlığı forma aktarır.
          description: event.description, // Güncel açıklamayı forma aktarır.
          startDate: this.toDateTimeLocal(event.startDate), // Güncel tarihi form inputunun formatına çevirir.
          location: event.location, // Güncel konumu forma aktarır.
          capacity: event.capacity, // Güncel kapasiteyi forma aktarır.
          category: event.category, // Güncel kategoriyi forma aktarır.
          visibility: event.visibility // Güncel katılım tipini forma aktarır.
        });

        this.saving.set(false); // Güncelleme işleminin tamamlandığını belirtir.
      },
      error: (error: HttpErrorResponse) => { // Güncelleme işlemi hata verdiğinde çalışır.
        this.errorMessage.set(
          getApiErrorMessage(error, 'Etkinlik güncellenemedi.') // Backend hatasını kullanıcıya anlaşılır mesaja dönüştürür.
        );
        this.saving.set(false); // Hata olsa bile kaydetme işlemini sonlandırır.
      }
    });
  }


  cancelEvent(): void { // Mevcut etkinliği iptal etmek için kullanılan metottur.
    if (!this.eventId || this.saving()) { // Etkinlik IDsi yoksa veya başka işlem devam ediyorsa kontrol içerisine girer.
      return; // İptal işlemini başlatmaz.
    }

    const approved = window.confirm('Etkinliği iptal etmek istediğinize emin misiniz?'); // Kullanıcıdan iptal işlemi için onay ister.

    if (!approved) { // Kullanıcı onay vermediyse kontrol içerisine girer.
      return; // İptal işlemini durdurur.
    }

    this.saving.set(true); // İptal işleminin başladığını belirtir.
    this.errorMessage.set(''); // Önceki hata mesajını temizler.
    this.successMessage.set(''); // Önceki başarı mesajını temizler.

    this.eventService.cancel(this.eventId).subscribe({ // EventService üzerinden etkinliği iptal etme isteği gönderir.
      next: () => { // İptal işlemi başarılı olduğunda çalışır.
        this.successMessage.set('Etkinlik iptal edildi.'); // Kullanıcıya başarılı iptal mesajı gösterir.
        this.saving.set(false); // İptal işleminin tamamlandığını belirtir.
      },
      error: (error: HttpErrorResponse) => { // İptal işlemi hata verdiğinde çalışır.
        this.errorMessage.set(
          getApiErrorMessage(error, 'Etkinlik iptal edilemedi.') // Backend hatasını kullanıcıya anlaşılır mesaja dönüştürür.
        );
        this.saving.set(false); // Hata olsa bile iptal işlemini sonlandırır.
      }
    });
  }


  private toDateTimeLocal(value: string): string { // Backendden gelen tarihi datetime-local inputunun kullanacağı formata çevirir.
    const date = new Date(value); // Backendden gelen tarih stringini JavaScript Date nesnesine dönüştürür.
    const pad = (number: number) => number.toString().padStart(2, '0'); // Tek haneli tarih değerlerinin başına 0 ekler.

    return (
      date.getFullYear() + // Yıl bilgisini ekler.
      '-' +
      pad(date.getMonth() + 1) + // Ay bilgisini ekler; JavaScript ayları 0dan başlattığı için 1 eklenir.
      '-' +
      pad(date.getDate()) + // Gün bilgisini ekler.
      'T' +
      pad(date.getHours()) + // Saat bilgisini ekler.
      ':' +
      pad(date.getMinutes()) // Dakika bilgisini ekler.
    );
  }
}