import { Component, inject, OnInit, signal } from '@angular/core'; // Component, inject, OnInit ve signal kullanmak için
import { HttpErrorResponse } from '@angular/common/http'; // Backendden gelen HTTP hatalarını yakalamak için
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'; // Reactive Form ve validation işlemleri için
import { ActivatedRoute, Router } from '@angular/router'; // URL parametresini almak ve sayfa yönlendirmeleri için
import { ClubService } from '../../core/services/club.service'; // Kulüp oluşturma, güncelleme, silme ve getirme işlemleri için
import { CreateClubRequest, UpdateClubRequest } from '../../core/models/api.models'; // Kulüp oluşturma ve güncelleme modelleri
import { getApiErrorMessage } from '../../core/utils/api-error'; // Backend hatalarını anlaşılır mesaja çevirmek için

@Component({ // Bu classın Angular componenti olduğunu belirtir
  selector: 'app-club-manage', // Componentin selector adı
  standalone: true, // Componentin NgModule olmadan bağımsız çalışmasını sağlar
  imports: [ReactiveFormsModule], // Template içinde Reactive Form kullanılmasını sağlar
  template: `
    <!-- Kulüp oluşturma ve güncelleme sayfası -->
    <section class="club-manage-page">

      <!-- Sayfa başlığı -->
      <div class="page-header">
        <h1>{{ isEditMode() ? 'Kulüp Güncelle' : 'Kulüp Oluştur' }}</h1> <!-- Moda göre başlığı değiştirir -->
        <p>{{ isEditMode() ? 'Kulüp bilgilerini düzenleyebilirsiniz.' : 'Yeni bir öğrenci kulübü oluşturabilirsiniz.' }}</p> <!-- Moda göre açıklamayı değiştirir -->
      </div>

      <!-- Kulüp bilgileri yüklenirken gösterilir -->
      @if (loading()) {
        <div class="page-message">
          Kulüp bilgileri yükleniyor...
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
      <form class="club-form" [formGroup]="form" (ngSubmit)="submit()">

        <!-- Form başlığı -->
        <div class="form-header">
          <h2>Kulüp Bilgileri</h2>
          <p>Kulübün temel bilgilerini aşağıdaki alanlara girin.</p>
        </div>

        <!-- Form alanları -->
        <div class="form-content">

          <!-- Kulüp adı -->
          <div class="form-field">
            <label for="name">Kulüp Adı</label>
            <input id="name" type="text" formControlName="name" placeholder="Kulüp adını girin"> <!-- Kulüp adını name alanına bağlar -->
          </div>

          <!-- Kulüp açıklaması -->
          <div class="form-field">
            <label for="description">Açıklama</label>
            <textarea id="description" formControlName="description" rows="6" placeholder="Kulüp hakkında kısa bir açıklama girin"></textarea> <!-- Açıklamayı description alanına bağlar -->
          </div>

          <!-- Logo URL -->
          <div class="form-field">
            <label for="logoUrl">Logo URL</label>
            <input id="logoUrl" type="text" formControlName="logoUrl" placeholder="https://..."> <!-- Logo bağlantısını logoUrl alanına bağlar -->
          </div>
        </div>

        <!-- Form işlem butonları -->
        <div class="form-actions">
          <button class="save-button" type="submit" [disabled]="form.invalid || saving()"> <!-- Form geçersizse veya işlem devam ediyorsa pasif olur -->
            {{ saving() ? 'İşlem Yapılıyor...' : (isEditMode() ? 'Kulübü Güncelle' : 'Kulüp Oluştur') }}
          </button>

          <!-- Sadece güncelleme modunda silme butonu gösterilir -->
          @if (isEditMode()) {
            <button class="delete-button" type="button" [disabled]="saving()" (click)="deleteClub()">
              Kulübü Sil
            </button>
          }
        </div>
      </form>
    </section>
  `,
  styleUrl: './club-manage.scss' // Componentin tasarım dosyası
})
export class ClubManage implements OnInit {
  private readonly fb = inject(FormBuilder); // Reactive Form oluşturmak için
  private readonly route = inject(ActivatedRoute); // URL içindeki kulüp IDsini almak için
  private readonly router = inject(Router); // Sayfa yönlendirmeleri yapmak için
  private readonly clubService = inject(ClubService); // Kulüp işlemlerini yapmak için

  private clubId: number | null = null; // Güncellenen veya silinen kulübün IDsini tutar

  readonly isEditMode = signal(false); // Sayfanın oluşturma mı güncelleme mi olduğunu tutar
  readonly loading = signal(false); // Kulüp bilgilerinin yüklenme durumunu tutar
  readonly saving = signal(false); // Oluşturma, güncelleme veya silme işleminin durumunu tutar
  readonly errorMessage = signal(''); // Hata mesajını tutar
  readonly successMessage = signal(''); // Başarı mesajını tutar

  readonly form = this.fb.nonNullable.group({ // Kulüp formunu ve validation kurallarını oluşturur
    name: ['', [Validators.required, Validators.maxLength(150)]], // Kulüp adı zorunlu ve maksimum 150 karakter
    description: ['', [Validators.maxLength(1000)]], // Açıklama maksimum 1000 karakter
    logoUrl: ['', [Validators.maxLength(500)]] // Logo URL maksimum 500 karakter
  });

  ngOnInit(): void { // Sayfa ilk açıldığında otomatik çalışır
    const idParam = this.route.snapshot.paramMap.get('id'); // URL içindeki id parametresini alır

    if (!idParam) { // URLde id yoksa oluşturma modunda kalır
      return; // Güncelleme kodlarının çalışmasını engeller
    }

    const id = Number(idParam); // URLden gelen IDyi number tipine çevirir

    if (!Number.isInteger(id) || id <= 0) { // ID geçerli pozitif tam sayı değilse
      this.errorMessage.set('Geçersiz kulüp ID.'); // Hata mesajı gösterir
      return; // Backend isteğini engeller
    }

    this.clubId = id; // Kulüp IDsini kaydeder
    this.isEditMode.set(true); // Sayfayı güncelleme moduna geçirir
    this.loadClub(id); // Kulüp bilgilerini backendden getirir
  }

  loadClub(id: number): void { // Güncellenecek kulübün bilgilerini backendden getirir
    this.loading.set(true); // Yükleme işlemini başlatır
    this.errorMessage.set(''); // Önceki hata mesajını temizler

    this.clubService.getById(id).subscribe({ // IDye göre kulüp detayını ister
      next: club => { // Backend isteği başarılı olduğunda çalışır
        this.form.patchValue({ // Gelen kulüp bilgilerini forma yerleştirir
          name: club.name, // Kulüp adını forma aktarır
          description: club.description ?? '', // Açıklama null ise boş string kullanır
          logoUrl: club.logoUrl ?? '' // Logo URL null ise boş string kullanır
        });

        this.loading.set(false); // Yükleme işlemini bitirir
      },
      error: (error: HttpErrorResponse) => { // Kulüp bilgileri alınırken hata oluşursa
        this.errorMessage.set(
          getApiErrorMessage(error, 'Kulüp bilgileri alınamadı.') // Hatayı kullanıcıya uygun mesaja çevirir
        );
        this.loading.set(false); // Hata olsa bile yükleme işlemini bitirir
      }
    });
  }

  submit(): void { // Form gönderildiğinde oluşturma veya güncelleme işlemini başlatır
    if (this.form.invalid || this.saving()) { // Form geçersizse veya işlem devam ediyorsa
      return; // Yeni backend isteğini engeller
    }

    this.saving.set(true); // Kaydetme işlemini başlatır
    this.errorMessage.set(''); // Önceki hata mesajını temizler
    this.successMessage.set(''); // Önceki başarı mesajını temizler

    const value = this.form.getRawValue(); // Formdaki bütün değerleri alır

    const request = { // Backend'e gönderilecek kulüp verisini oluşturur
      name: value.name.trim(), // Kulüp adındaki gereksiz boşlukları temizler
      description: value.description.trim() || null, // Açıklama boşsa null gönderir
      logoUrl: value.logoUrl.trim() || null // Logo URL boşsa null gönderir
    };

    if (this.isEditMode() && this.clubId) { // Güncelleme modundaysa ve kulüp IDsi varsa
      this.updateClub(this.clubId, request); // Güncelleme metodunu çağırır
      return; // Oluşturma kodunun çalışmasını engeller
    }

    this.createClub(request); // Yeni kulüp oluşturur
  }

  createClub(request: CreateClubRequest): void { // Yeni kulüp oluşturma isteğini backend'e gönderir
    this.clubService.create(request).subscribe({ // ClubService üzerinden oluşturma isteği gönderir
      next: club => { // Kulüp başarıyla oluşturulduğunda çalışır
        this.saving.set(false); // Kaydetme işlemini bitirir
        void this.router.navigate(['/clubs', club.id]); // Oluşturulan kulübün detay sayfasına gider
      },
      error: (error: HttpErrorResponse) => { // Oluşturma sırasında hata oluşursa
        this.errorMessage.set(
          getApiErrorMessage(error, 'Kulüp oluşturulamadı.') // Hatayı kullanıcıya uygun mesaja çevirir
        );
        this.saving.set(false); // Hata olsa bile kaydetme işlemini bitirir
      }
    });
  }

  updateClub(id: number, request: UpdateClubRequest): void { // Mevcut kulübü günceller
    this.clubService.update(id, request).subscribe({ // ClubService üzerinden güncelleme isteği gönderir
      next: club => { // Güncelleme başarılı olduğunda çalışır
        this.successMessage.set('Kulüp güncellendi.'); // Başarı mesajını gösterir

        this.form.patchValue({ // Backendden dönen güncel bilgileri tekrar forma aktarır
          name: club.name, // Güncel kulüp adını forma aktarır
          description: club.description ?? '', // Güncel açıklamayı forma aktarır
          logoUrl: club.logoUrl ?? '' // Güncel logo URL bilgisini forma aktarır
        });

        this.saving.set(false); // Güncelleme işlemini bitirir
      },
      error: (error: HttpErrorResponse) => { // Güncelleme sırasında hata oluşursa
        this.errorMessage.set(
          getApiErrorMessage(error, 'Kulüp güncellenemedi.') // Hatayı kullanıcıya uygun mesaja çevirir
        );
        this.saving.set(false); // Hata olsa bile güncelleme işlemini bitirir
      }
    });
  }

  deleteClub(): void { // Mevcut kulübü siler
    if (!this.clubId || this.saving()) { // Kulüp IDsi yoksa veya işlem devam ediyorsa
      return; // Silme işlemini başlatmaz
    }

    const approved = window.confirm('Kulübü silmek istediğinize emin misiniz?'); // Kullanıcıdan silme onayı ister

    if (!approved) { // Kullanıcı onaylamadıysa
      return; // Silme işlemini durdurur
    }

    this.saving.set(true); // Silme işlemini başlatır
    this.errorMessage.set(''); // Önceki hata mesajını temizler
    this.successMessage.set(''); // Önceki başarı mesajını temizler

    this.clubService.delete(this.clubId).subscribe({ // ClubService üzerinden silme isteği gönderir
      next: () => { // Silme işlemi başarılı olduğunda çalışır
        this.saving.set(false); // Silme işlemini bitirir
        void this.router.navigate(['/clubs']); // Kullanıcıyı kulüpler listesine yönlendirir
      },
      error: (error: HttpErrorResponse) => { // Silme sırasında hata oluşursa
        this.errorMessage.set(
          getApiErrorMessage(error, 'Kulüp silinemedi.') // Hatayı kullanıcıya uygun mesaja çevirir
        );
        this.saving.set(false); // Hata olsa bile silme işlemini bitirir
      }
    });
  }
}