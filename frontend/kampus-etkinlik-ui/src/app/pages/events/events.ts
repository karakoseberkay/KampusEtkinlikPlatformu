import { Component, inject, OnInit, signal } from '@angular/core'; // Component oluşturmak, servis enjekte etmek, OnInit ve signal kullanmak için
import { HttpErrorResponse } from '@angular/common/http'; // Backendden gelen HTTP hatalarını yakalamak için
import { RouterLink } from '@angular/router'; // HTML tarafında sayfa yönlendirmeleri yapmak için
import { AuthService } from '../../core/services/auth.service'; // Giriş yapan kullanıcı ve rol bilgilerine erişmek için
import { ClubService } from '../../core/services/club.service'; // Kulüp verilerini backendden almak için
import { EventService } from '../../core/services/event.service'; // Etkinlik verilerini backendden almak için
import { ClubResponse, EventResponse } from '../../core/models/api.models'; // Kulüp ve etkinlik modelleri
import { getApiErrorMessage } from '../../core/utils/api-error'; // Backend hatalarını okunabilir mesaja çevirmek için
import { PaginatorModule } from 'primeng/paginator'; // primeng sayfalama componentini kullanmak için
import { TableModule } from 'primeng/table'; // primeng tablo ve sorting özelliklerini kullanmak için

@Component({ // Bu classın Angular componenti olduğunu belirtir
  selector: 'app-events', // Componentin selector adı
  standalone: true, // Componentin NgModule olmadan bağımsız çalışmasını sağlar
  imports: [RouterLink, PaginatorModule, TableModule], // Template içinde routerLink ve primeng paginator kullanılmasını sağlar
  template: `
    <!-- Etkinlikler sayfasının ana alanı -->
    <section class="events-page">

      <!-- Sayfa başlığı -->
      <div class="page-header">
        <div>
          <h1>Events</h1>
          <p>Browse and filter campus events.</p>
        </div>

        <!-- Sadece ClubManager yeni etkinlik oluşturabilir -->
        @if (auth.hasRole('ClubManager')) {
          <a class="create-button" routerLink="/event-manage">
            + Create New Event
          </a>
        }
      </div>

      <!-- Arama ve filtreleme alanı -->
      <section class="filter-card">
        <div class="filter-card-header">
          <h2>Search and Filter</h2>
          <p>Use the filters to find events more easily.</p>
        </div>

        <div class="filter-content">
          <div class="filter-grid">

            <!-- Etkinlik adına göre arama -->
            <div class="form-field">
              <label for="search">Search Events</label>
              <input
                id="search"
                type="text"
                placeholder="Event name..."
                [value]="searchText()"
                (input)="searchText.set($any($event.target).value)"
              >
            </div>

            <!-- Kategoriye göre filtreleme -->
            <div class="form-field">
              <label for="category">Category</label>
              <input
                id="category"
                type="text"
                placeholder="Category..."
                [value]="category()"
                (input)="category.set($any($event.target).value)"
              >
            </div>

            <!-- Kulübe göre filtreleme -->
            <div class="form-field">
              <label for="club">Club</label>
              <select
                id="club"
                [value]="selectedClubId()"
                (change)="selectedClubId.set($any($event.target).value)"
              >
                <option value="">All Clubs</option>

                <!-- Backendden gelen kulüpleri option olarak oluşturur -->
                @for (club of clubs(); track club.id) {
                  <option [value]="club.id">
                    {{ club.name }}
                  </option>
                }
              </select>
            </div>

            <!-- Başlangıç tarihine göre filtreleme -->
            <div class="form-field">
              <label for="dateFrom">Start Date</label>
              <input
                id="dateFrom"
                type="date"
                [value]="dateFrom()"
                (change)="dateFrom.set($any($event.target).value)"
              >
            </div>

            <!-- Bitiş tarihine göre filtreleme -->
            <div class="form-field">
              <label for="dateTo">End Date</label>
              <input
                id="dateTo"
                type="date"
                [value]="dateTo()"
                (change)="dateTo.set($any($event.target).value)"
              >
            </div>

            <!-- Sadece yaklaşan etkinlikleri gösterme seçeneği -->
            <div class="checkbox-area">
              <label class="checkbox-field">
                <input
                  type="checkbox"
                  [checked]="upcomingOnly()"
                  (change)="upcomingOnly.set($any($event.target).checked)"
                >
                <span>Upcoming active events only</span>
              </label>
            </div>
          </div>

          <!-- Filtreleme işlemleri -->
          <div class="filter-actions">
            <button
              class="filter-button"
              type="button"
              [disabled]="loading()"
              (click)="applyFilters()"
            >
              Apply Filters
            </button>

            <button
              class="clear-button"
              type="button"
              [disabled]="loading()"
              (click)="clearFilters()"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </section>

      <!-- Backend isteği devam ederken gösterilir -->
      @if (loading()) {
        <div class="page-message">
          Events are loading...
        </div>
      }

      <!-- Backend isteğinde hata oluşursa gösterilir -->
      @if (errorMessage()) {
        <div class="page-message error-message">
          {{ errorMessage() }}
        </div>
      }

      <!-- Filtrelere uygun etkinlik bulunamazsa gösterilir -->
      @if (!loading() && events().length === 0 && !errorMessage()) {
        <div class="page-message">
          No events match the search criteria.
        </div>
      }

      <!-- Etkinlik varsa listeyi gösterir -->
      @if (events().length > 0) {
        <section class="events-section">

          <!-- Listenin başlığı ve toplam etkinlik sayısı -->
          <div class="list-header">
            <div>
              <h2>Event List</h2>
              <p>{{ totalCount() }} events found.</p>
            </div>
          </div>

          <!-- Etkinlik tablosu -->
          <div class="table-card">
            <div class="table-wrapper">

              <!-- backendden gelen etkinlikleri primeng tabloya verir -->
              <!-- customSort true olduğu için sıralamayı frontend yerine bizim onSort metodumuz yönetir -->
              <p-table
                [value]="events()"
                [customSort]="true"
                [sortField]="sortField() ?? undefined"
                [sortOrder]="sortDirection() === 'desc' ? -1 : sortDirection() === 'asc' ? 1 : 0"
                (sortFunction)="onSort($event)"
                styleClass="events-table"
                [tableStyle]="{ 'min-width': '1100px' }"
              >

                <!-- primeng tablosunun kolon başlıklarını oluşturur -->
                <ng-template #header>
                  <tr>

                    <!-- etkinlik adına göre sıralama yapılmasını sağlar -->
                    <th pSortableColumn="title">
                      Event
                      <p-sort-icon field="title" />
                    </th>

                    <!-- kulüp adına göre sıralama yapılmasını sağlar -->
                    <th pSortableColumn="clubName">
                      Club
                      <p-sort-icon field="clubName" />
                    </th>

                    <!-- etkinlik tarihine göre sıralama yapılmasını sağlar -->
                    <th pSortableColumn="startDate">
                      Date
                      <p-sort-icon field="startDate" />
                    </th>

                    <!-- etkinlik konumuna göre sıralama yapılmasını sağlar -->
                    <th pSortableColumn="location">
                      Location
                      <p-sort-icon field="location" />
                    </th>

                    <!-- etkinlik kapasitesine göre sıralama yapılmasını sağlar -->
                    <th pSortableColumn="capacity">
                      Capacity
                      <p-sort-icon field="capacity" />
                    </th>

                    <!-- etkinlik kategorisine göre sıralama yapılmasını sağlar -->
                    <th pSortableColumn="category">
                      Category
                      <p-sort-icon field="category" />
                    </th>

                    <!-- etkinliğin katılım tipine göre sıralama yapılmasını sağlar -->
                    <th pSortableColumn="visibility">
                      Participation Type
                      <p-sort-icon field="visibility" />
                    </th>

                    <!-- etkinlik durumuna göre sıralama yapılmasını sağlar -->
                    <th pSortableColumn="status">
                      Status
                      <p-sort-icon field="status" />
                    </th>

                    <th>Action</th>
                  </tr>
                </ng-template>

                <!-- Backendden gelen etkinlikleri tek tek tabloya ekler -->
                <!-- let-event ile primengin o an işlediği etkinliğe erişiriz -->
                <ng-template #body let-event>
                  <tr>
                    <td class="event-title">{{ event.title }}</td> <!-- Etkinlik adı -->
                    <td>{{ event.clubName }}</td> <!-- Etkinliği oluşturan kulüp -->
                    <td>{{ event.startDate }}</td> <!-- Etkinlik tarihi -->
                    <td>{{ event.location }}</td> <!-- Etkinlik konumu -->
                    <td>{{ event.capacity }}</td> <!-- Etkinlik kapasitesi -->

                    <!-- Etkinlik kategorisi -->
                    <td>
                      <span class="category-badge">
                        {{ event.category }}
                      </span>
                    </td>

                    <!-- Etkinliğin katılım tipini kullanıcıya anlaşılır gösterir -->
                    <td>
                      @if (event.visibility === 'Public') {
                        <span>Open to Everyone</span>
                      } @else {
                        <span>Approval Required</span>
                      }
                    </td>

                    <!-- Etkinliğin aktif veya pasif durumunu gösterir -->
                    <td>
                      @if (event.status === 'Active') {
                        <span class="status-badge status-active">
                          Active
                        </span>
                      } @else {
                        <span class="status-badge status-passive">
                          {{ event.status }}
                        </span>
                      }
                    </td>

                    <!-- Etkinlik işlem butonları -->
                    <td>
                      <div class="table-actions">

                        <!-- Etkinlik detay sayfasına gider -->
                        <a
                          class="detail-link"
                          [routerLink]="['/events', event.id]"
                        >
                          Details
                        </a>

                        <!-- ClubManager sadece kendi etkinliğini yönetebilir -->
                        @if (ownsEvent(event)) {
                          <a
                            class="edit-link"
                            [routerLink]="['/event-manage', event.id]"
                          >
                            Update
                          </a>

                          <a
                            class="registration-link"
                            [routerLink]="['/events', event.id, 'registrations']"
                          >
                            Registrations
                          </a>
                        }
                      </div>
                    </td>
                  </tr>
                </ng-template>

              </p-table>
            </div>
          </div>

          <!-- primeng paginator mevcut backend sayfalama sistemini kontrol eder -->
          <!-- first primengte ilk kaydın indexini belirtir -->
          <!-- rows bir sayfada kaç etkinlik gösterileceğini belirtir -->
          <!-- totalRecords backenddeki toplam etkinlik sayısını primenge verir -->
          <!-- onPageChange sayfa veya sayfa boyutu değiştiğinde çalışır -->
          <p-paginator
            [first]="(page() - 1) * pageSize()"
            [rows]="pageSize()"
            [totalRecords]="totalCount()"
            [rowsPerPageOptions]="[5, 10, 20]"
            [showCurrentPageReport]="true"
            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} events"
            (onPageChange)="onPageChange($event)"
          >
          </p-paginator>

        </section>
      }
    </section>
  `,
  styleUrl: './events.scss' // Componentin tasarım dosyası
})
export class Events implements OnInit {
  readonly auth = inject(AuthService); // Kullanıcı ve rol bilgilerine erişmemizi sağlar
  private readonly clubService = inject(ClubService); // Kulüp verilerini backendden almak için
  private readonly eventService = inject(EventService); // Etkinlik verilerini backendden almak için

  readonly events = signal<EventResponse[]>([]); // Backendden gelen etkinlik listesini tutar
  readonly clubs = signal<ClubResponse[]>([]); // Backendden gelen kulüp listesini tutar
  readonly searchText = signal(''); // Arama kutusundaki metni tutar
  readonly category = signal(''); // Kategori filtresini tutar
  readonly selectedClubId = signal(''); // Seçilen kulübün ID değerini tutar
  readonly dateFrom = signal(''); // Başlangıç tarihi filtresini tutar
  readonly dateTo = signal(''); // Bitiş tarihi filtresini tutar
  readonly upcomingOnly = signal(false); // Sadece yaklaşan etkinlikleri gösterme bilgisini tutar
  readonly sortField = signal<string | null>(null); // seçilen sıralama alanını tutar
  readonly sortDirection = signal<'asc' | 'desc' | null>(null); // seçilen sıralama yönünü tutar
  readonly page = signal(1); // Bulunulan sayfa numarasını tutar
  readonly pageSize = signal(10); // Bir sayfada gösterilecek etkinlik sayısını tutar
  readonly totalCount = signal(0); // Filtreye uygun toplam etkinlik sayısını tutar
  readonly totalPages = signal(0); // Toplam sayfa sayısını tutar
  readonly loading = signal(false); // Backend isteğinin devam edip etmediğini tutar
  readonly errorMessage = signal(''); // Kullanıcıya gösterilecek hata mesajını tutar

  ngOnInit(): void { // Component ilk açıldığında otomatik çalışır
    if (this.auth.hasRole('Student')) { // Kullanıcı Student ise kontrol eder
      this.upcomingOnly.set(true); // Student için varsayılan olarak yaklaşan etkinlikleri gösterir
    }

    this.loadClubs(); // Kulüp listesini backendden getirir
    this.loadEvents(); // Etkinlik listesini backendden getirir
  }

  ownsEvent(event: EventResponse): boolean { // ClubManager'ın etkinliği yönetme yetkisini kontrol eder
    const user = this.auth.currentUser(); // Giriş yapan kullanıcıyı alır

    if (!user || !this.auth.hasRole('ClubManager')) { // Kullanıcı yoksa veya ClubManager değilse
      return false; // Yönetim yetkisi vermez
    }

    return this.clubs().some( // Koşula uyan en az bir kulüp var mı kontrol eder
      club =>
        club.id === event.clubId && // Etkinlik bu kulübe mi ait
        club.managerUserId === user.userId // Kulübün yöneticisi giriş yapan kullanıcı mı
    );
  }

  loadClubs(): void { // Bütün kulüpleri backendden getirir
    this.clubService.getAll().subscribe({ // ClubService üzerinden kulüp isteği gönderir
      next: clubs => { // İstek başarılı olduğunda çalışır
        this.clubs.set(clubs); // Gelen kulüpleri signal içerisine kaydeder
      },
      error: () => { // Kulüp isteğinde hata oluşursa çalışır
        this.clubs.set([]); // Kulüp listesini boşaltır
      }
    });
  }

  loadEvents(): void { // Filtrelere ve sayfalama bilgilerine göre etkinlikleri getirir
    this.loading.set(true); // Yükleme işlemini başlatır
    this.errorMessage.set(''); // Önceki hata mesajını temizler

    const clubId = this.selectedClubId() ? Number(this.selectedClubId()): undefined; // Kulüp seçilmiş mi kontrol eder
      // Seçilen kulüp ID'sini number tipine çevirir
       // Kulüp seçilmediyse filtre göndermez

    this.eventService.getPaged({ // EventService üzerinden filtreli etkinlik isteği gönderir
      search: this.searchText().trim() || undefined, // Arama metni boşsa undefined gönderir
      category: this.category().trim() || undefined, // Kategori boşsa undefined gönderir
      clubId, // Seçilen kulüp ID'sini gönderir
      dateFrom: this.getDateFrom(), // Başlangıç tarihini backend formatında gönderir
      dateTo: this.getDateTo(), // Bitiş tarihini backend formatında gönderir
      upcomingOnly: this.upcomingOnly(), // Yaklaşan etkinlik filtresini gönderir
      sortField: this.sortField() ?? undefined, // seçilen sıralama alanını backende gönderir
      sortDirection: this.sortDirection() ?? undefined, // seçilen sıralama yönünü backende gönderir
      page: this.page(), // İstenen sayfa numarasını gönderir
      pageSize: this.pageSize() // Sayfa başına etkinlik sayısını gönderir
    }).subscribe({
      next: result => { // Backend isteği başarılı olduğunda çalışır
        this.events.set(result.items); // Gelen etkinlikleri signal içine kaydeder
        this.page.set(result.page); // Backendden gelen mevcut sayfayı kaydeder
        this.totalCount.set(result.totalCount); // Toplam etkinlik sayısını kaydeder
        this.totalPages.set(result.totalPages); // Toplam sayfa sayısını kaydeder
        this.loading.set(false); // Yükleme işlemini bitirir
      },
      error: (error: HttpErrorResponse) => { // Backend isteğinde hata oluşursa çalışır
        this.events.set([]); // Etkinlik listesini temizler
        this.totalCount.set(0); // Toplam etkinlik sayısını sıfırlar
        this.totalPages.set(0); // Toplam sayfa sayısını sıfırlar
        this.errorMessage.set(
          getApiErrorMessage(error, 'Could not load events.') // Hata mesajını kullanıcıya uygun hale getirir
        );
        this.loading.set(false); // Hata olsa bile yükleme işlemini bitirir
      }
    });
  }

  applyFilters(): void { // Kullanıcının seçtiği filtreleri uygular
    this.page.set(1); // Filtre değiştiğinde ilk sayfaya döner
    this.loadEvents(); // Etkinlikleri yeni filtrelerle tekrar getirir
  }

  clearFilters(): void { // Bütün filtreleri temizler
    this.searchText.set(''); // Arama metnini temizler
    this.category.set(''); // Kategori filtresini temizler
    this.selectedClubId.set(''); // Kulüp filtresini temizler
    this.dateFrom.set(''); // Başlangıç tarihini temizler
    this.dateTo.set(''); // Bitiş tarihini temizler
    this.upcomingOnly.set(this.auth.hasRole('Student')); // Student ise yaklaşan etkinlik filtresi açık kalır
    this.page.set(1); // İlk sayfaya döner
    this.loadEvents(); // Temiz filtrelerle etkinlikleri yeniden getirir
  }

  onSort(event: { field?: string; order?: number }): void { // primeng tablosunda bir kolonun sıralamasına basıldığında çalışır
    if (!event.field || !event.order) { // sıralama kaldırıldıysa kontrol eder
      this.sortField.set(null); // seçili sıralama alanını temizler
      this.sortDirection.set(null); // seçili sıralama yönünü temizler
      this.page.set(1); // sıralama değiştiğinde ilk sayfaya döner
      this.loadEvents(); // backendin varsayılan sıralamasıyla etkinlikleri tekrar getirir
      return;
    }

    this.sortField.set(event.field); // primengden gelen sıralama alanını kaydeder

    this.sortDirection.set(
      event.order === -1 ? 'desc' : 'asc'
    ); // primeng -1 gönderirse desc diğer durumda asc olarak kaydeder

    this.page.set(1); // sıralama değiştiğinde ilk sayfaya döner
    this.loadEvents(); // yeni sıralama bilgileriyle backendden etkinlikleri tekrar getirir
  }

  onPageChange(event: { page?: number; first?: number; rows?: number }): void { // primeng paginator değiştiğinde çalışır
    if (this.loading()) { // backend isteği devam ediyorsa yeni sayfa isteği göndermesini engeller
      return;
    }

    const newPageSize = event.rows ?? this.pageSize(); // primengden gelen yeni sayfa boyutunu alır

    const newPage =
      event.page !== undefined
        ? event.page + 1
        : Math.floor((event.first ?? 0) / newPageSize) + 1;
    // primeng sayfaları 0dan başlattığı için backendin kullandığı 1 tabanlı sayfa numarasına çevirir

    this.pageSize.set(newPageSize); // seçilen yeni sayfa boyutunu kaydeder
    this.page.set(newPage); // kullanıcının geçtiği sayfa numarasını kaydeder

    this.loadEvents(); // yeni page ve pagesize değerleriyle backendden sadece gerekli etkinlikleri getirir
  }

  private getDateFrom(): string | undefined { // Başlangıç tarihini backendin beklediği ISO formatına çevirir
    const value = this.dateFrom(); // Kullanıcının seçtiği tarihi alır

    if (!value) { // Tarih seçilmemişse
      return undefined; // Backend'e tarih filtresi göndermez
    }

    return new Date(`${value}T00:00:00`).toISOString(); // Günün başlangıcını ISO formatına çevirir
  }

  private getDateTo(): string | undefined { // Bitiş tarihini backendin beklediği ISO formatına çevirir
    const value = this.dateTo(); // Kullanıcının seçtiği tarihi alır

    if (!value) { // Tarih seçilmemişse
      return undefined; // Backend'e tarih filtresi göndermez
    }

    return new Date(`${value}T23:59:59.999`).toISOString(); // Günün son anını ISO formatına çevirir
  }
}