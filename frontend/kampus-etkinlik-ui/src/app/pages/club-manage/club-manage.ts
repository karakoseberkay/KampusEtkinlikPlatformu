import { Component, inject, OnInit, signal } from '@angular/core'; // Angular componenti, servis enjeksiyonu, OnInit ve signal yapısını kullanmak için gerekli araçları içe aktarır.
import { HttpErrorResponse } from '@angular/common/http'; // Backendden gelen HTTP hatalarını yakalamak için kullanılır.
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'; // Reactive Form oluşturmak ve validation kuralları kullanmak için gerekli yapıları içe aktarır.
import { ActivatedRoute, Router } from '@angular/router'; // URL içindeki kulüp ID değerini almak ve sayfalar arasında yönlendirme yapmak için kullanılır.
import { ClubService } from '../../core/services/club.service'; // Kulüp oluşturma, güncelleme, silme ve detay getirme işlemlerini yapar.
import { CreateClubRequest, UpdateClubRequest } from '../../core/models/api.models'; // Backend'e gönderilecek oluşturma ve güncelleme verilerinin TypeScript tipleridir.
import { getApiErrorMessage } from '../../core/utils/api-error'; // Backend hatalarını kullanıcıya gösterilecek anlaşılır mesaja dönüştürür.

@Component({ // Bu classın Angular componenti olduğunu belirtir.
  selector: 'app-club-manage', // Componentin selector adını belirler.
  standalone: true, // Componentin NgModule olmadan bağımsız çalışmasını sağlar.
  imports: [ReactiveFormsModule], // Template içinde formGroup ve formControlName kullanabilmemizi sağlar.
  template: `
    <!-- Kulüp oluşturma ve güncelleme sayfasının tamamını kapsar -->
    <section class="club-manage-page">

      <!-- Sayfanın başlık alanıdır -->
      <div class="page-header">
        <h1>{{ isEditMode() ? 'Kulüp Güncelle' : 'Kulüp Oluştur' }}</h1> <!-- Edit modundaysa Güncelle, değilse Oluştur başlığını gösterir. -->
        <p>{{ isEditMode() ? 'Kulüp bilgilerini düzenleyebilirsiniz.' : 'Yeni bir öğrenci kulübü oluşturabilirsiniz.' }}</p> <!-- Sayfanın moduna göre açıklama gösterir. -->
      </div>

      <!-- Backend isteği devam ederken gösterilir -->
      @if (loading()) {
        <div class="page-message">
          Kulüp bilgileri yükleniyor...
        </div>
      }

      <!-- Backend isteği sırasında hata oluşursa gösterilir -->
      @if (errorMessage()) {
        <div class="page-message error-message">
          {{ errorMessage() }}
        </div>
      }

      <!-- Oluşturma veya güncelleme işlemi başarılı olduğunda gösterilir -->
      @if (successMessage()) {
        <div class="page-message success-message">
          {{ successMessage() }}
        </div>
      }

      <!-- Kulüp oluşturma ve güncelleme formunu Reactive Form yapısına bağlar -->
      <form class="club-form" [formGroup]="form" (ngSubmit)="submit()">

        <!-- Formun üst başlık alanıdır -->
        <div class="form-header">
          <h2>Kulüp Bilgileri</h2> <!-- Form bölümünün başlığını gösterir. -->
          <p>Kulübün temel bilgilerini aşağıdaki alanlara girin.</p> <!-- Kullanıcıya form hakkında kısa bilgi verir. -->
        </div>

        <!-- Form alanlarının tamamını kapsar -->
        <div class="form-content">

          <!-- Kulüp adı alanıdır -->
          <div class="form-field">
            <label for="name">Kulüp Adı</label> <!-- Kulüp adı inputunun açıklamasıdır. -->
            <input id="name" type="text" formControlName="name" placeholder="Kulüp adını girin"> <!-- Kulüp adını formdaki name alanına bağlar. -->
          </div>

          <!-- Kulüp açıklaması alanıdır -->
          <div class="form-field">
            <label for="description">Açıklama</label> <!-- Açıklama alanının başlığıdır. -->
            <textarea id="description" formControlName="description" rows="6" placeholder="Kulüp hakkında kısa bir açıklama girin"></textarea> <!-- Kulüp açıklamasını formdaki description alanına bağlar. -->
          </div>

          <!-- Logo URL alanıdır -->
          <div class="form-field">
            <label for="logoUrl">Logo URL</label> <!-- Logo bağlantısı inputunun açıklamasıdır. -->
            <input id="logoUrl" type="text" formControlName="logoUrl" placeholder="https://..."> <!-- Logo bağlantısını formdaki logoUrl alanına bağlar. -->
          </div>

        </div>

        <!-- Formun işlem butonlarını içerir -->
        <div class="form-actions">

          <!-- Form geçersizse veya kayıt işlemi devam ediyorsa buton kullanılamaz -->
          <button class="save-button" type="submit" [disabled]="form.invalid || saving()">
            {{ saving() ? 'İşlem Yapılıyor...' : (isEditMode() ? 'Kulübü Güncelle' : 'Kulüp Oluştur') }}
          </button>

          <!-- Sadece güncelleme modunda kulübü silme butonu gösterilir -->
          @if (isEditMode()) {
            <button class="delete-button" type="button" [disabled]="saving()" (click)="deleteClub()">
              Kulübü Sil
            </button>
          }

        </div>

      </form>

    </section>
  `,
  styleUrl: './club-manage.scss' // Bu componentin tasarımını club-manage.scss dosyasından almasını sağlar.
})
export class ClubManage implements OnInit { // Kulüp oluşturma ve güncelleme sayfasının TypeScript classıdır.
  private readonly fb = inject(FormBuilder); // Reactive Form oluşturmak için FormBuilder'ı enjekte eder.
  private readonly route = inject(ActivatedRoute); // URL içindeki kulüp ID değerine erişmek için ActivatedRoute'u enjekte eder.
  private readonly router = inject(Router); // İşlem sonrası başka sayfalara yönlendirme yapmak için Router'ı enjekte eder.
  private readonly clubService = inject(ClubService); // Kulüp işlemlerini gerçekleştirmek için ClubService'i enjekte eder.

  private clubId: number | null = null; // Güncellenen veya silinen kulübün ID değerini tutar.

  readonly isEditMode = signal(false); // Sayfanın oluşturma mı güncelleme mi olduğunu tutar.
  readonly loading = signal(false); // Kulüp bilgileri backendden yüklenirken işlemin devam edip etmediğini tutar.
  readonly saving = signal(false); // Oluşturma, güncelleme veya silme işleminin devam edip etmediğini tutar.
  readonly errorMessage = signal(''); // Kullanıcıya gösterilecek hata mesajını tutar.
  readonly successMessage = signal(''); // Kullanıcıya gösterilecek başarılı işlem mesajını tutar.

  readonly form = this.fb.nonNullable.group({ // Kulüp formunu ve validation kurallarını oluşturur.
    name: ['', [Validators.required, Validators.maxLength(150)]], // Kulüp adını zorunlu yapar ve maksimum 150 karakter sınırı koyar.
    description: ['', [Validators.maxLength(1000)]], // Açıklama alanına maksimum 1000 karakter sınırı koyar.
    logoUrl: ['', [Validators.maxLength(500)]] // Logo URL alanına maksimum 500 karakter sınırı koyar.
  });


  ngOnInit(): void { // Sayfa ilk açıldığında otomatik olarak çalışır.
    const idParam = this.route.snapshot.paramMap.get('id'); // URL içindeki id parametresini alır.

    if (!idParam) { // URL içinde id yoksa yeni kulüp oluşturma modunda kalır.
      return; // Güncelleme işlemlerinin çalışmasını engeller.
    }

    const id = Number(idParam); // URLden gelen string ID değerini number tipine çevirir.

    if (!Number.isInteger(id) || id <= 0) { // ID geçerli bir pozitif tam sayı değilse kontrol içerisine girer.
      this.errorMessage.set('Geçersiz kulüp ID.'); // Kullanıcıya geçersiz kulüp ID mesajı gösterir.
      return; // Backend isteğinin yapılmasını engeller.
    }

    this.clubId = id; // Güncellenecek kulübün IDsini class değişkenine kaydeder.
    this.isEditMode.set(true); // Sayfanın güncelleme modunda olduğunu belirtir.
    this.loadClub(id); // Kulübün mevcut bilgilerini backendden getirir.
  }


  loadClub(id: number): void { // Güncellenecek kulübün mevcut bilgilerini backendden getirir.
    this.loading.set(true); // Yükleme işleminin başladığını belirtir.
    this.errorMessage.set(''); // Önceki hata mesajını temizler.

    this.clubService.getById(id).subscribe({ // ClubService içindeki getById metoduyla backend isteği gönderir.
      next: club => { // Backend isteği başarılı olduğunda çalışır.
        this.form.patchValue({ // Backendden gelen kulüp bilgilerini form alanlarına yerleştirir.
          name: club.name, // Kulübün adını name alanına aktarır.
          description: club.description ?? '', // Açıklama null ise boş string kullanır.
          logoUrl: club.logoUrl ?? '' // Logo URL null ise boş string kullanır.
        });

        this.loading.set(false); // Kulüp bilgilerinin yüklenme işlemini tamamlar.
      },
      error: (error: HttpErrorResponse) => { // Backend isteği hata verdiğinde çalışır.
        this.errorMessage.set(
          getApiErrorMessage(error, 'Kulüp bilgileri alınamadı.') // Backend hatasını kullanıcıya anlaşılır mesaja dönüştürür.
        );
        this.loading.set(false); // Hata olsa bile yükleme işlemini sonlandırır.
      }
    });
  }


  submit(): void { // Form gönderildiğinde oluşturma veya güncelleme işlemini başlatır.
    if (this.form.invalid || this.saving()) { // Form geçersizse veya işlem zaten devam ediyorsa kontrol içerisine girer.
      return; // Yeni bir backend isteği gönderilmesini engeller.
    }

    this.saving.set(true); // Kaydetme işleminin başladığını belirtir.
    this.errorMessage.set(''); // Önceki hata mesajını temizler.
    this.successMessage.set(''); // Önceki başarı mesajını temizler.

    const value = this.form.getRawValue(); // Formdaki bütün alanların güncel değerlerini alır.

    const request = { // Backend'e gönderilecek ortak kulüp verisini oluşturur.
      name: value.name.trim(), // Kulüp adının başındaki ve sonundaki gereksiz boşlukları kaldırır.
      description: value.description.trim() || null, // Açıklama boşsa null, doluysa temizlenmiş metni gönderir.
      logoUrl: value.logoUrl.trim() || null // Logo URL boşsa null, doluysa temizlenmiş URLyi gönderir.
    };

    if (this.isEditMode() && this.clubId) { // Sayfa güncelleme modundaysa ve geçerli kulüp IDsi varsa çalışır.
      this.updateClub(this.clubId, request); // Mevcut kulübü güncelleme metodunu çağırır.
      return; // Yeni kulüp oluşturma kodunun çalışmasını engeller.
    }

    this.createClub(request); // Sayfa oluşturma modundaysa yeni kulüp oluşturma metodunu çağırır.
  }


  createClub(request: CreateClubRequest): void { // Yeni kulüp oluşturma isteğini backend'e gönderir.
    this.clubService.create(request).subscribe({ // ClubService içindeki create metodunu çağırır.
      next: club => { // Kulüp başarıyla oluşturulduğunda çalışır.
        this.saving.set(false); // Kaydetme işleminin tamamlandığını belirtir.
        void this.router.navigate(['/clubs', club.id]); // Kullanıcıyı oluşturulan kulübün detay sayfasına yönlendirir.
      },
      error: (error: HttpErrorResponse) => { // Oluşturma işlemi hata verdiğinde çalışır.
        this.errorMessage.set(
          getApiErrorMessage(error, 'Kulüp oluşturulamadı.') // Backend hatasını kullanıcıya anlaşılır mesaja dönüştürür.
        );
        this.saving.set(false); // Hata olsa bile kaydetme işlemini sonlandırır.
      }
    });
  }


  updateClub(id: number, request: UpdateClubRequest): void { // Mevcut kulübü güncellemek için backend'e istek gönderir.
    this.clubService.update(id, request).subscribe({ // ClubService içindeki update metodunu çağırır.
      next: club => { // Güncelleme başarılı olduğunda çalışır.
        this.successMessage.set('Kulüp güncellendi.'); // Kullanıcıya başarılı güncelleme mesajı gösterir.

        this.form.patchValue({ // Backendden dönen güncel kulüp bilgilerini tekrar forma aktarır.
          name: club.name, // Güncel kulüp adını forma yerleştirir.
          description: club.description ?? '', // Güncel açıklamayı forma yerleştirir.
          logoUrl: club.logoUrl ?? '' // Güncel logo URL bilgisini forma yerleştirir.
        });

        this.saving.set(false); // Güncelleme işleminin tamamlandığını belirtir.
      },
      error: (error: HttpErrorResponse) => { // Güncelleme işlemi hata verdiğinde çalışır.
        this.errorMessage.set(
          getApiErrorMessage(error, 'Kulüp güncellenemedi.') // Backend hatasını kullanıcıya anlaşılır mesaja dönüştürür.
        );
        this.saving.set(false); // Hata olsa bile güncelleme işlemini sonlandırır.
      }
    });
  }


  deleteClub(): void { // Mevcut kulübü silme işlemini başlatır.
    if (!this.clubId || this.saving()) { // Kulüp IDsi yoksa veya başka bir işlem devam ediyorsa kontrol içerisine girer.
      return; // Silme işlemini başlatmaz.
    }

    const approved = window.confirm('Kulübü silmek istediğinize emin misiniz?'); // Kulübü silmeden önce kullanıcıdan onay ister.

    if (!approved) { // Kullanıcı silme işlemine onay vermediyse kontrol içerisine girer.
      return; // Silme işlemini iptal eder.
    }

    this.saving.set(true); // Silme işleminin başladığını belirtir.
    this.errorMessage.set(''); // Önceki hata mesajını temizler.
    this.successMessage.set(''); // Önceki başarı mesajını temizler.

    this.clubService.delete(this.clubId).subscribe({ // ClubService içindeki delete metoduyla backend'e silme isteği gönderir.
      next: () => { // Silme işlemi başarılı olduğunda çalışır.
        this.saving.set(false); // Silme işleminin tamamlandığını belirtir.
        void this.router.navigate(['/clubs']); // Kullanıcıyı tekrar kulüpler listesine yönlendirir.
      },
      error: (error: HttpErrorResponse) => { // Silme işlemi hata verdiğinde çalışır.
        this.errorMessage.set(
          getApiErrorMessage(error, 'Kulüp silinemedi.') // Backend hatasını kullanıcıya anlaşılır mesaja dönüştürür.
        );
        this.saving.set(false); // Hata olsa bile silme işlemini sonlandırır.
      }
    });
  }
}