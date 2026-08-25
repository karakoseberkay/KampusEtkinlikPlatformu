import { Component, inject, OnInit, signal } from '@angular/core'; // Component, inject, OnInit ve signal kullanmak için
import { HttpErrorResponse } from '@angular/common/http'; // Backendden gelen HTTP hatalarını yakalamak için
import { RouterLink } from '@angular/router'; // Template içinde routerLink kullanmak için
import { ClubService } from '../../core/services/club.service'; // Kulüp verilerini backendden almak için
import { AuthService } from '../../core/services/auth.service'; // Kullanıcının rol ve bilgilerine erişmek için
import { ClubResponse } from '../../core/models/api.models'; // Backendden gelen kulüp modelini kullanmak için
import { getApiErrorMessage } from '../../core/utils/api-error'; // Backend hatalarını anlaşılır mesaja çevirmek için

@Component({ // Bu classın Angular componenti olduğunu belirtir
  selector: 'app-clubs', // Componentin selector adı
  standalone: true, // Componentin NgModule olmadan bağımsız çalışmasını sağlar
  imports: [RouterLink], // Template içinde routerLink kullanılmasını sağlar
  template: `
    <!-- Kulüpler sayfası -->
    <section class="clubs-page">

      <!-- Sayfa başlığı -->
      <div class="page-header">
        <div>
          <h1>Kulüpler</h1>
          <p>Kampüste bulunan öğrenci kulüplerini görüntüleyebilirsiniz.</p>
        </div>

        <!-- Sadece ClubManager yeni kulüp oluşturabilir -->
        @if (auth.hasRole('ClubManager')) {
          <a class="create-button" routerLink="/club-manage">
            + Yeni Kulüp Oluştur
          </a>
        }
      </div>

      <!-- Kulüpler yüklenirken gösterilir -->
      @if (loading()) {
        <div class="page-message">
          Kulüpler yükleniyor...
        </div>
      }

      <!-- Hata mesajı -->
      @if (errorMessage()) {
        <div class="page-message error-message">
          {{ errorMessage() }}
        </div>
      }

      <!-- Kulüp bulunamadığında gösterilir -->
      @if (!loading() && clubs().length === 0 && !errorMessage()) {
        <div class="page-message">
          Kulüp bulunamadı.
        </div>
      }

      <!-- Kulüp listesi -->
      @if (clubs().length > 0) {
        <section class="clubs-section">

          <!-- Liste başlığı -->
          <div class="list-header">
            <h2>Kulüp Listesi</h2>
            <p>Toplam {{ clubs().length }} kulüp görüntüleniyor.</p>
          </div>

          <!-- Kulüp tablosu -->
          <div class="table-card">
            <div class="table-wrapper">
              <table class="clubs-table">
                <thead>
                  <tr>
                    <th>Kulüp Adı</th>
                    <th>Açıklama</th>
                    <th>Logo URL</th>
                    <th>Yönetici</th>
                    <th>Etkinlik Sayısı</th>
                    <th>İşlem</th>
                  </tr>
                </thead>

                <tbody>
                  <!-- Backendden gelen kulüpleri tabloya ekler -->
                  @for (club of clubs(); track club.id) {
                    <tr>
                      <td class="club-name">
                        {{ club.name }}
                      </td> <!-- Kulüp adını gösterir -->

                      <td class="description-cell">
                        {{ club.description }}
                      </td> <!-- Kulüp açıklamasını gösterir -->

                      <td class="logo-url">
                        {{ club.logoUrl || '-' }}
                      </td> <!-- Logo URL bilgisini metin olarak gösterir -->

                      <td>
                        {{ club.managerFullName }}
                      </td> <!-- Kulüp yöneticisinin adını gösterir -->

                      <td>
                        <span class="event-count">
                          {{ club.eventCount }}
                        </span>
                      </td> <!-- Kulübün etkinlik sayısını gösterir -->

                      <!-- Kulüp işlem butonları -->
                      <td>
                        <div class="table-actions">

                          <!-- Kulüp detay sayfasına gider -->
                          <a class="detail-link" [routerLink]="['/clubs', club.id]">
                            Detay
                          </a>

                          <!-- ClubManager sadece kendi kulübünü yönetebilir -->
                          @if (ownsClub(club)) {
                            <a class="edit-link" [routerLink]="['/club-manage', club.id]">
                              Güncelle
                            </a>

                            <a class="stats-link" [routerLink]="['/clubs', club.id, 'stats']">
                              İstatistik
                            </a>
                          }
                        </div>
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
  styleUrl: './clubs.scss' // Componentin tasarım dosyası
})
export class Clubs implements OnInit {
  readonly auth = inject(AuthService); // Kullanıcının rol ve bilgilerine erişmek için
  private readonly clubService = inject(ClubService); // Kulüp verilerini backendden almak için

  readonly clubs = signal<ClubResponse[]>([]); // Backendden gelen kulüp listesini tutar
  readonly loading = signal(false); // Kulüplerin yüklenme durumunu tutar
  readonly errorMessage = signal(''); // Kullanıcıya gösterilecek hata mesajını tutar

  ngOnInit(): void { // Sayfa ilk açıldığında otomatik çalışır
    this.loadClubs(); // Backendden kulüp listesini getirir
  }

  ownsClub(club: ClubResponse): boolean { // Kullanıcının kulübün yöneticisi olup olmadığını kontrol eder
    const user = this.auth.currentUser(); // Giriş yapan kullanıcının bilgilerini alır

    return (
      !!user && // Kullanıcı bilgisinin var olup olmadığını kontrol eder
      this.auth.hasRole('ClubManager') && // Kullanıcının ClubManager rolüne sahip olup olmadığını kontrol eder
      club.managerUserId === user.userId // Kulübün yöneticisi giriş yapan kullanıcı mı kontrol eder
    );
  }

  loadClubs(): void { // Backendden bütün kulüpleri getirir
    this.loading.set(true); // Yükleme işlemini başlatır
    this.errorMessage.set(''); // Önceki hata mesajını temizler

    this.clubService.getAll().subscribe({ // ClubService üzerinden kulüp listesini ister
      next: clubs => { // Backend isteği başarılı olduğunda çalışır
        this.clubs.set(clubs); // Gelen kulüpleri signal içine kaydeder
        this.loading.set(false); // Yükleme işlemini bitirir
      },
      error: (error: HttpErrorResponse) => { // Backend isteğinde hata oluşursa
        this.clubs.set([]); // Kulüp listesini boşaltır
        this.errorMessage.set(
          getApiErrorMessage(error, 'Kulüpler alınamadı.') // Hatayı kullanıcıya uygun mesaja çevirir
        );
        this.loading.set(false); // Hata olsa bile yükleme işlemini bitirir
      }
    });
  }
}