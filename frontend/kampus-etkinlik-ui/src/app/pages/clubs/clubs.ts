import { Component, inject, OnInit, signal } from '@angular/core'; // Component, inject, OnInit ve signal kullanmak için
import { HttpErrorResponse } from '@angular/common/http'; // Backendden gelen HTTP hatalarını yakalamak için
import { RouterLink } from '@angular/router'; // Template içinde routerLink kullanmak için
import { ClubService } from '../../core/services/club.service'; // Kulüp verilerini backendden almak için
import { AuthService } from '../../core/services/auth.service'; // Kullanıcının rol ve bilgilerine erişmek için
import { ClubResponse } from '../../core/models/api.models'; // Backendden gelen kulüp modelini kullanmak için
import { getApiErrorMessage } from '../../core/utils/api-error'; // Backend hatalarını anlaşılır mesaja çevirmek için
import { TableModule } from 'primeng/table'; // primeng tablo sorting ve pagination özelliklerini kullanmak için

@Component({ // Bu classın Angular componenti olduğunu belirtir
  selector: 'app-clubs', // Componentin selector adı
  standalone: true, // Componentin NgModule olmadan bağımsız çalışmasını sağlar
  imports: [RouterLink, TableModule], // Template içinde routerLink ve primeng tablo kullanılmasını sağlar
  template: `
    <!-- Kulüpler sayfası -->
    <section class="clubs-page">

      <!-- Sayfa başlığı -->
      <div class="page-header">
        <div>
          <h1>Clubs</h1>
          <p>View student clubs on campus.</p>
        </div>

        <!-- Sadece ClubManager yeni kulüp oluşturabilir -->
        @if (auth.hasRole('ClubManager')) {
          <a class="create-button" routerLink="/club-manage">
            + Create New Club
          </a>
        }
      </div>

      <!-- Kulüpler yüklenirken gösterilir -->
      @if (loading()) {
        <div class="page-message">
          Clubs are loading...
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
          No clubs found.
        </div>
      }

      <!-- Kulüp listesi -->
      @if (clubs().length > 0) {
        <section class="clubs-section">

          <!-- Liste başlığı -->
          <div class="list-header">
            <h2>Club List</h2>
            <p>Showing {{ clubs().length }} clubs.</p>
          </div>

          <!-- Kulüp tablosu -->
          <div class="table-card">
            <div class="table-wrapper">

              <!-- backendden gelen bütün kulüpleri primeng tabloya verir -->
              <!-- paginator true olduğu için gelen kulüpleri frontend tarafında sayfalara böler -->
              <p-table
                [value]="clubs()"
                [paginator]="true"
                [rows]="5"
                [rowsPerPageOptions]="[5, 10, 20]"
                [showCurrentPageReport]="true"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} clubs"
                [tableStyle]="{ 'min-width': '900px' }"
                styleClass="clubs-table"
              >

                <!-- primeng tablosunun kolon başlıklarını oluşturur -->
                <ng-template #header>
                  <tr>

                    <!-- kulüp adına göre sıralama yapılmasını sağlar -->
                    <th pSortableColumn="name">
                      Club Name
                      <p-sort-icon field="name" />
                    </th>

                    <th>Description</th>

                    <th>Logo URL</th>

                    <!-- kulüp yöneticisinin adına göre sıralama yapılmasını sağlar -->
                    <th pSortableColumn="managerFullName">
                      Manager
                      <p-sort-icon field="managerFullName" />
                    </th>

                    <!-- kulübün etkinlik sayısına göre sıralama yapılmasını sağlar -->
                    <th pSortableColumn="eventCount">
                      Event Count
                      <p-sort-icon field="eventCount" />
                    </th>

                    <th>Action</th>
                  </tr>
                </ng-template>

                <!-- Backendden gelen kulüpleri tabloya ekler -->
                <!-- let-club ile primengin o an işlediği kulübe erişiriz -->
                <ng-template #body let-club>
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
                          Details
                        </a>

                        <!-- ClubManager sadece kendi kulübünü yönetebilir -->
                        @if (ownsClub(club)) {
                          <a class="edit-link" [routerLink]="['/club-manage', club.id]">
                            Update
                          </a>

                          <a class="stats-link" [routerLink]="['/clubs', club.id, 'stats']">
                            Statistics
                          </a>
                        }
                      </div>
                    </td>
                  </tr>
                </ng-template>

              </p-table>
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
          getApiErrorMessage(error, 'Could not load clubs.') // Hatayı kullanıcıya uygun mesaja çevirir
        );
        this.loading.set(false); // Hata olsa bile yükleme işlemini bitirir
      }
    });
  }
}