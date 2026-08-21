import { Component, inject, OnInit, signal } from '@angular/core'; // Angular componenti, servis enjeksiyonu, OnInit ve signal yapısını kullanmak için gerekli araçları içe aktarır.
import { HttpErrorResponse } from '@angular/common/http'; // Backendden gelen HTTP hatalarını yakalamak için kullanılır.
import { ActivatedRoute } from '@angular/router'; // URL içindeki kulüp ID değerini almak için kullanılır.
import { ClubService } from '../../core/services/club.service'; // Kulüp detayını backendden almak için kullanılır.
import { ClubResponse } from '../../core/models/api.models'; // Backendden gelen kulüp nesnesinin TypeScript tipidir.
import { getApiErrorMessage } from '../../core/utils/api-error'; // Backend hatalarını kullanıcıya gösterilecek anlaşılır mesaja dönüştürür.

@Component({ // Bu classın Angular componenti olduğunu belirtir.
  selector: 'app-club-detail', // Componentin selector adını belirler.
  standalone: true, // Componentin NgModule kullanmadan bağımsız çalışmasını sağlar.
  template: `
    <!-- Kulüp detay sayfasının tamamını kapsar -->
    <section class="club-detail-page">

      <!-- Sayfanın üst başlık alanıdır -->
      <div class="page-header">
        <h1>Kulüp Detayı</h1> <!-- Sayfanın ana başlığını gösterir. -->
        <p>Kulübe ait temel bilgileri buradan görüntüleyebilirsiniz.</p> <!-- Sayfanın kısa açıklamasını gösterir. -->
      </div>

      <!-- Backend isteği devam ederken gösterilir -->
      @if (loading()) {
        <div class="page-message">
          Kulüp bilgileri yükleniyor...
        </div>
      }

      <!-- Backend isteğinde hata oluşursa gösterilir -->
      @if (errorMessage()) {
        <div class="page-message error-message">
          {{ errorMessage() }}
        </div>
      }

      <!-- Backendden kulüp bilgisi geldiyse detay kartını gösterir -->
      @if (club(); as clubItem) {
        <section class="detail-card">

          <!-- Kulüp adını ve açıklamasını gösterir -->
          <div class="detail-card-header">
            <h2>{{ clubItem.name }}</h2> <!-- Kulübün adını gösterir. -->
            <p>{{ clubItem.description }}</p> <!-- Kulübün açıklamasını gösterir. -->
          </div>

          <!-- Kulübün temel bilgilerini grid şeklinde gösterir -->
          <div class="detail-grid">

            <!-- Kulüp yöneticisini gösterir -->
            <div class="detail-item">
              <span class="detail-label">Yönetici</span> <!-- Bilginin başlığını gösterir. -->
              <span class="detail-value">{{ clubItem.managerFullName }}</span> <!-- Kulüp yöneticisinin adını gösterir. -->
            </div>

            <!-- Kulübün toplam etkinlik sayısını gösterir -->
            <div class="detail-item">
              <span class="detail-label">Etkinlik Sayısı</span> <!-- Bilginin başlığını gösterir. -->
              <span class="detail-value event-count">{{ clubItem.eventCount }}</span> <!-- Kulübün toplam etkinlik sayısını gösterir. -->
            </div>

            <!-- Kulübün logo URL bilgisini sadece metin olarak gösterir -->
            <div class="detail-item full-width">
              <span class="detail-label">Logo URL</span> <!-- Bilginin başlığını gösterir. -->
              <span class="detail-value logo-url">{{ clubItem.logoUrl || '-' }}</span> <!-- Logo bağlantısı yoksa tire gösterir. -->
            </div>

          </div>

        </section>
      }

    </section>
  `,
  styleUrl: './club-detail.scss' // Bu componentin tasarımını club-detail.scss dosyasından almasını sağlar.
})
export class ClubDetail implements OnInit { // Kulüp detay sayfasının TypeScript classıdır ve OnInit yaşam döngüsünü kullanır.
  private readonly route = inject(ActivatedRoute); // URL içindeki kulüp ID değerine erişmek için ActivatedRoute'u enjekte eder.
  private readonly clubService = inject(ClubService); // Kulüp servisindeki backend metodlarına erişmek için ClubService'i enjekte eder.

  readonly club = signal<ClubResponse | null>(null); // Backendden gelen kulüp bilgisini tutar, başlangıçta veri olmadığı için null değerindedir.
  readonly loading = signal(false); // Kulüp bilgisi yüklenirken işlemin devam edip etmediğini tutar.
  readonly errorMessage = signal(''); // Kullanıcıya gösterilecek hata mesajını tutar.


  ngOnInit(): void { // Sayfa ilk açıldığında otomatik olarak çalışır.
    const id = Number(this.route.snapshot.paramMap.get('id')); // URL içindeki id parametresini alır ve number tipine dönüştürür.

    if (!Number.isInteger(id) || id <= 0) { // ID geçerli bir pozitif tam sayı değilse kontrol içerisine girer.
      this.errorMessage.set('Geçersiz kulüp ID.'); // Kullanıcıya geçersiz kulüp ID mesajı gösterir.
      return; // Backend isteğinin yapılmasını engeller.
    }

    this.loadClub(id); // Geçerli ID değerine göre kulüp detayını backendden getirir.
  }


  loadClub(id: number): void { // Verilen ID değerine sahip kulübü backendden getiren metottur.
    this.loading.set(true); // Backend isteğinin başladığını belirtir.
    this.errorMessage.set(''); // Önceki hata mesajını temizler.

    this.clubService.getById(id).subscribe({ // ClubService içindeki getById metoduyla backend isteği gönderir.
      next: club => { // Backend isteği başarılı olduğunda çalışır.
        this.club.set(club); // Backendden gelen kulüp bilgisini club signalına aktarır.
        this.loading.set(false); // Yükleme işleminin tamamlandığını belirtir.
      },
      error: (error: HttpErrorResponse) => { // Backend isteği hata verdiğinde çalışır.
        this.errorMessage.set(
          getApiErrorMessage(error, 'Kulüp alınamadı.') // Backend hatasını kullanıcıya anlaşılır mesaja dönüştürür.
        );
        this.loading.set(false); // Hata olsa bile yükleme işlemini sonlandırır.
      }
    });
  }
}