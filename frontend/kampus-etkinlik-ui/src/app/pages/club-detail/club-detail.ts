import { Component, inject, OnInit, signal } from '@angular/core'; // Component, inject, OnInit ve signal kullanmak için
import { HttpErrorResponse } from '@angular/common/http'; // Backendden gelen HTTP hatalarını yakalamak için
import { ActivatedRoute } from '@angular/router'; // URL içindeki kulüp IDsini almak için
import { ClubService } from '../../core/services/club.service'; // Kulüp detayını backendden almak için
import { ClubResponse } from '../../core/models/api.models'; // Backendden gelen kulüp modelini kullanmak için
import { getApiErrorMessage } from '../../core/utils/api-error'; // Backend hatalarını anlaşılır mesaja çevirmek için

@Component({ // Bu classın Angular componenti olduğunu belirtir
  selector: 'app-club-detail', // Componentin selector adı
  standalone: true, // Componentin NgModule olmadan bağımsız çalışmasını sağlar
  template: `
    <!-- Kulüp detay sayfası -->
    <section class="club-detail-page">

      <!-- Sayfa başlığı -->
      <div class="page-header">
        <h1>Club Details</h1>
        <p>View the club's basic information here.</p>
      </div>

      <!-- Kulüp bilgileri yüklenirken gösterilir -->
      @if (loading()) {
        <div class="page-message">
          Club information is loading...
        </div>
      }

      <!-- Hata mesajı -->
      @if (errorMessage()) {
        <div class="page-message error-message">
          {{ errorMessage() }}
        </div>
      }

      <!-- Kulüp bilgisi geldiyse detay kartını gösterir -->
      @if (club(); as clubItem) {
        <section class="detail-card">

          <!-- Kulüp adı ve açıklaması -->
          <div class="detail-card-header">
            <h2>{{ clubItem.name }}</h2> <!-- Kulüp adını gösterir -->
            <p>{{ clubItem.description }}</p> <!-- Kulüp açıklamasını gösterir -->
          </div>

          <!-- Kulübün temel bilgileri -->
          <div class="detail-grid">

            <!-- Kulüp yöneticisi -->
            <div class="detail-item">
              <span class="detail-label">Manager</span>
              <span class="detail-value">{{ clubItem.managerFullName }}</span> <!-- Yönetici adını gösterir -->
            </div>

            <!-- Etkinlik sayısı -->
            <div class="detail-item">
              <span class="detail-label">Event Count</span>
              <span class="detail-value event-count">{{ clubItem.eventCount }}</span> <!-- Toplam etkinlik sayısını gösterir -->
            </div>

            <!-- Logo URL -->
            <div class="detail-item full-width">
              <span class="detail-label">Logo URL</span>
              <span class="detail-value logo-url">{{ clubItem.logoUrl || '-' }}</span> <!-- Logo yoksa tire gösterir -->
            </div>
          </div>
        </section>
      }
    </section>
  `,
  styleUrl: './club-detail.scss' // Componentin tasarım dosyası
})
export class ClubDetail implements OnInit {
  private readonly route = inject(ActivatedRoute); // URL içindeki kulüp IDsini almak için
  private readonly clubService = inject(ClubService); // Kulüp bilgilerini backendden almak için

  readonly club = signal<ClubResponse | null>(null); // Backendden gelen kulüp bilgisini tutar
  readonly loading = signal(false); // Kulüp bilgilerinin yüklenme durumunu tutar
  readonly errorMessage = signal(''); // Kullanıcıya gösterilecek hata mesajını tutar

  ngOnInit(): void { // Sayfa ilk açıldığında otomatik çalışır
    const id = Number(this.route.snapshot.paramMap.get('id')); // URL içindeki id değerini alıp numbera çevirir

    if (!Number.isInteger(id) || id <= 0) { // ID geçerli pozitif tam sayı değilse
      this.errorMessage.set('Invalid club ID.'); // Hata mesajı gösterir
      return; // Backend isteğinin yapılmasını engeller
    }

    this.loadClub(id); // Kulüp detayını backendden getirir
  }

  loadClub(id: number): void { // Verilen IDye göre kulüp detayını getirir
    this.loading.set(true); // Yükleme işlemini başlatır
    this.errorMessage.set(''); // Önceki hata mesajını temizler

    this.clubService.getById(id).subscribe({ // ClubService üzerinden kulüp detayını ister
      next: club => { // Backend isteği başarılı olduğunda çalışır
        this.club.set(club); // Gelen kulüp bilgisini signal içine kaydeder
        this.loading.set(false); // Yükleme işlemini bitirir
      },
      error: (error: HttpErrorResponse) => { // Backend isteğinde hata oluşursa
        this.errorMessage.set(
          getApiErrorMessage(error, 'Could not load the club.') // Hatayı kullanıcıya uygun mesaja çevirir
        );
        this.loading.set(false); // Hata olsa bile yükleme işlemini bitirir
      }
    });
  }
}