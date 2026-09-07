import { Component, inject, OnInit, signal } from '@angular/core'; // Component oluşturmak servisleri DI ile almak component açılışını yakalamak ve signal kullanmak için
import { HttpErrorResponse } from '@angular/common/http'; // backendden gelen HTTP hatalarının bilgilerine erişmek için
import { RouterLink } from '@angular/router'; // template içinde routerLink ile sayfa yönlendirmesi yapmak için
import { AuthService } from '../../core/services/auth.service'; // giriş yapan kullanıcı ve rol bilgilerine erişmek için
import { ClubService } from '../../core/services/club.service'; // kulüp verilerini backendden almak için
import { EventService } from '../../core/services/event.service'; // etkinlik ve qr işlemlerini backendle haberleştirmek için
import { ClubResponse, EventResponse } from '../../core/models/api.models'; // kulüp ve etkinlik modellerine erişmek için
import { getApiErrorMessage } from '../../core/utils/api-error'; // backend hatalarını kullanıcıya gösterilecek mesaja çevirmek için
import { PaginatorModule } from 'primeng/paginator'; // primeng sayfalama componentini kullanmak için
import { TableModule } from 'primeng/table'; // primeng tablo ve sorting özelliklerini kullanmak için
import * as QRCode from 'qrcode'; // check-in adresini okutulabilir qr görseline çevirmek için

@Component({ // bu classın Angular componenti olduğunu belirtir
  selector: 'app-events', // componentin HTML tarafında kullanılabilecek selector adını belirler
  standalone: true, // componentin NgModule olmadan bağımsız çalışmasını sağlar
  imports: [RouterLink, PaginatorModule, TableModule], // template içinde kullanılan Angular ve PrimeNG özelliklerini componente dahil eder
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

                <!-- @for clubs signalındaki kulüpleri tek tek optiona çevirir track ise her kulübü idsiyle takip eder -->
                @for (club of clubs(); track club.id) {
                  <option [value]="club.id">{{ club.name }}</option>
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
            <button class="filter-button" type="button" [disabled]="loading()" (click)="applyFilters()">
              Apply Filters
            </button>

            <button class="clear-button" type="button" [disabled]="loading()" (click)="clearFilters()">
              Clear Filters
            </button>
          </div>
        </div>
      </section>

      <!-- Backend isteği devam ederken gösterilir -->
      @if (loading()) {
        <div class="page-message">Events are loading...</div>
      }

      <!-- Backend isteğinde hata oluşursa gösterilir -->
      @if (errorMessage()) {
        <div class="page-message error-message">{{ errorMessage() }}</div>
      }

      <!-- Filtrelere uygun etkinlik bulunamazsa gösterilir -->
      @if (!loading() && events().length === 0 && !errorMessage()) {
        <div class="page-message">No events match the search criteria.</div>
      }

      <!-- Etkinlik varsa listeyi gösterir -->
      @if (events().length > 0) {
        <section class="events-section">
          <div class="list-header">
            <div>
              <h2>Event List</h2>
              <p>{{ totalCount() }} events found.</p>
            </div>
          </div>

          <div class="table-card">
            <div class="table-wrapper">

              <!-- value tabloya etkinlikleri verir customSort ise sıralamayı backend üzerinden bizim yönetmemizi sağlar -->
              <p-table
                [value]="events()"
                [customSort]="true"
                [sortField]="sortField() ?? undefined"
                [sortOrder]="sortDirection() === 'desc' ? -1 : sortDirection() === 'asc' ? 1 : 0"
                (sortFunction)="onSort($event)"
                styleClass="events-table"
                [tableStyle]="{ 'min-width': '1180px' }"
              >
                <!-- #header primeng tablosunun başlık şablonunu oluşturur -->
                <ng-template #header>
                  <tr>
                    <th pSortableColumn="title">
                      Event
                      <p-sort-icon field="title" />
                    </th>

                    <th pSortableColumn="clubName">
                      Club
                      <p-sort-icon field="clubName" />
                    </th>

                    <th pSortableColumn="startDate">
                      Date
                      <p-sort-icon field="startDate" />
                    </th>

                    <th pSortableColumn="location">
                      Location
                      <p-sort-icon field="location" />
                    </th>

                    <th pSortableColumn="capacity">
                      Capacity
                      <p-sort-icon field="capacity" />
                    </th>

                    <th pSortableColumn="category">
                      Category
                      <p-sort-icon field="category" />
                    </th>

                    <th pSortableColumn="visibility">
                      Participation Type
                      <p-sort-icon field="visibility" />
                    </th>

                    <th pSortableColumn="status">
                      Status
                      <p-sort-icon field="status" />
                    </th>

                    <th>Action</th>
                  </tr>
                </ng-template>

                <!-- let-event primengin o an işlediği etkinlik kaydını event değişkenine verir -->
                <ng-template #body let-event>
                  <tr>
                    <td class="event-title">{{ event.title }}</td>
                    <td>{{ event.clubName }}</td>
                    <td>{{ event.startDate }}</td>
                    <td>{{ event.location }}</td>
                    <td>{{ event.capacity }}</td>

                    <td>
                      <span class="category-badge">{{ event.category }}</span>
                    </td>

                    <td>
                      @if (event.visibility === 'Public') {
                        <span>Open to Everyone</span>
                      } @else {
                        <span>Approval Required</span>
                      }
                    </td>

                    <td>
                      @if (event.status === 'Active') {
                        <span class="status-badge status-active">Active</span>
                      } @else {
                        <span class="status-badge status-passive">{{ event.status }}</span>
                      }
                    </td>

                    <td>
                      <div class="table-actions">
                        <a class="detail-link" [routerLink]="['/events', event.id]">
                          Details
                        </a>

                        <!-- ownsEvent true ise giriş yapan clubmanager bu etkinliğin sahibi demektir -->
                        @if (ownsEvent(event)) {
                          <a class="edit-link" [routerLink]="['/event-manage', event.id]">
                            Update
                          </a>

                          <a class="registration-link" [routerLink]="['/events', event.id, 'registrations']">
                            Registrations
                          </a>

                          <button
                            class="check-in-link"
                            type="button"
                            [disabled]="event.status !== 'Active'"
                            (click)="openCheckIn(event)"
                          >
                            Check In
                          </button>
                        }
                      </div>
                    </td>
                  </tr>
                </ng-template>
              </p-table>
            </div>
          </div>

          <!-- primeng paginator backend sayfalamasını kontrol eder -->
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

      <!-- selectedCheckInEvent doluysa qr oluşturma penceresini açar as selectedEvent ile değeri kısa isimle kullanır -->
      @if (selectedCheckInEvent(); as selectedEvent) {
        <div class="check-in-backdrop" (click)="closeCheckIn()">

          <!-- stopPropagation modalın içine basınca tıklamanın arka plana gitmesini ve modalın kapanmasını engeller -->
          <section class="check-in-modal" (click)="$event.stopPropagation()">
            <div class="check-in-modal-header">
              <div>
                <h2>Event Check-In</h2>
                <p>{{ selectedEvent.title }}</p>
              </div>

              <button class="check-in-close" type="button" (click)="closeCheckIn()">×</button>
            </div>

            <div class="check-in-modal-content">
              <div class="qr-controls">
                <div class="qr-duration-field">
                  <label for="qrDuration">QR Duration</label>

                  <!-- + işareti selectten string gelen süre değerini number tipine çevirir -->
                  <select
                    id="qrDuration"
                    [value]="qrDuration()"
                    (change)="qrDuration.set(+$any($event.target).value)"
                  >
                    <option [value]="5">5 minutes</option>
                    <option [value]="10">10 minutes</option>
                    <option [value]="15">15 minutes</option>
                    <option [value]="30">30 minutes</option>
                    <option [value]="60">60 minutes</option>
                  </select>
                </div>

                <button
                  class="generate-qr-button"
                  type="button"
                  [disabled]="generatingQr()"
                  (click)="generateQrCode()"
                >
                  {{ generatingQr() ? 'Generating...' : 'Generate QR Code' }}
                </button>
              </div>

              @if (qrErrorMessage()) {
                <div class="qr-error">{{ qrErrorMessage() }}</div>
              }

              <!-- qr görseli oluşturulduysa kullanıcıya qr ve bilgilerini gösterir -->
              @if (qrImageUrl()) {
                <div class="qr-result">
                  <div class="qr-image-box">
                    <img [src]="qrImageUrl()" alt="Event check-in QR code">
                  </div>

                  <div class="qr-details">
                    <h3>QR Code Ready</h3>
                    <p>Students and Club Managers can scan this QR code to check in.</p>

                    <div class="qr-expiry">
                      Valid until:
                      <strong>{{ formatQrExpiry() }}</strong>
                    </div>

                    <div class="qr-url">{{ qrCheckInUrl() }}</div>

                    <p class="qr-warning">
                      Creating a new QR code disables the previous active QR code.
                    </p>
                  </div>
                </div>
              }
            </div>
          </section>
        </div>
      }
    </section>
  `,
  styleUrl: './events.scss' // componentin tasarım dosyasını bağlar
})
export class Events implements OnInit {
  readonly auth = inject(AuthService); // giriş yapan kullanıcı ve rol bilgilerine erişmemizi sağlar
  private readonly clubService = inject(ClubService); // kulüp verilerini backendden almak için servisi DI ile alır
  private readonly eventService = inject(EventService); // etkinlik ve qr işlemlerini yapmak için servisi DI ile alır

  readonly events = signal<EventResponse[]>([]); // signal değiştiğinde Angular templatei otomatik günceller ve etkinlik listesini tutar
  readonly clubs = signal<ClubResponse[]>([]); // backendden gelen kulüp listesini tutar
  readonly searchText = signal(''); // arama kutusundaki metni tutar
  readonly category = signal(''); // kategori filtresini tutar
  readonly selectedClubId = signal(''); // seçilen kulübün idsini tutar
  readonly dateFrom = signal(''); // başlangıç tarihi filtresini tutar
  readonly dateTo = signal(''); // bitiş tarihi filtresini tutar
  readonly upcomingOnly = signal(false); // sadece yaklaşan etkinlikleri gösterme bilgisini tutar
  readonly sortField = signal<string | null>(null); // sıralama yapılacak alanı tutar başlangıçta sıralama olmadığı için null olabilir
  readonly sortDirection = signal<'asc' | 'desc' | null>(null); // sıralamanın artan azalan veya boş olmasını tutar
  readonly page = signal(1); // bulunulan sayfa numarasını tutar
  readonly pageSize = signal(10); // bir sayfada gösterilecek etkinlik sayısını tutar
  readonly totalCount = signal(0); // filtreye uyan toplam etkinlik sayısını tutar
  readonly totalPages = signal(0); // toplam sayfa sayısını tutar
  readonly loading = signal(false); // backend isteğinin devam edip etmediğini tutar
  readonly errorMessage = signal(''); // kullanıcıya gösterilecek hata mesajını tutar

  readonly selectedCheckInEvent = signal<EventResponse | null>(null); // qr oluşturmak için seçilen etkinliği tutar seçilmemişse null olur
  readonly qrDuration = signal(10); // qr kodun kaç dakika geçerli olacağını tutar varsayılan 10 dakikadır
  readonly generatingQr = signal(false); // qr oluşturma işleminin devam edip etmediğini tutar
  readonly qrImageUrl = signal(''); // qrcode kütüphanesinin oluşturduğu qr görselini tutar
  readonly qrCheckInUrl = signal(''); // qr kodun içine yazılan check-in adresini tutar
  readonly qrExpiresAt = signal(''); // backendden gelen qr geçerlilik bitiş zamanını tutar
  readonly qrErrorMessage = signal(''); // qr oluşturulurken oluşan hata mesajını tutar

  ngOnInit(): void { // component ilk açıldığında Angular tarafından otomatik çalıştırılır
    if (this.auth.hasRole('Student')) {
      this.upcomingOnly.set(true); // Student için varsayılan olarak sadece yaklaşan etkinlikleri gösterir
    }

    this.loadClubs(); // kulüp listesini backendden getirir
    this.loadEvents(); // etkinlik listesini backendden getirir
  }

  ownsEvent(event: EventResponse): boolean { // giriş yapan ClubManagerın etkinliğin sahibi olup olmadığını kontrol eder
    const user = this.auth.currentUser(); // signal içindeki giriş yapan kullanıcı bilgisini alır

    if (!user || !this.auth.hasRole('ClubManager')) {
      return false; // kullanıcı yoksa veya ClubManager değilse yönetim yetkisi vermez
    }

    return this.clubs().some(club => club.id === event.clubId && club.managerUserId === user.userId);
    // some listedeki en az bir kulüp koşula uyuyorsa true döndürür etkinlik managerın kulübüne ait mi kontrol eder
  }

  openCheckIn(event: EventResponse): void {
    if (!this.ownsEvent(event) || event.status !== 'Active') {
      return; // manager etkinliğin sahibi değilse veya etkinlik aktif değilse qr penceresini açmaz
    }

    this.selectedCheckInEvent.set(event); // seçilen etkinliği signal içine kaydedip modalın açılmasını sağlar
    this.qrDuration.set(10); // her yeni açılışta qr süresini 10 dakikaya döndürür
    this.qrImageUrl.set('');
    this.qrCheckInUrl.set('');
    this.qrExpiresAt.set('');
    this.qrErrorMessage.set('');
    // önceki qr penceresinden kalabilecek bilgileri temizler
  }

  closeCheckIn(): void {
    if (this.generatingQr()) {
      return; // qr üretilirken pencerenin kapatılmasını engeller
    }

    this.selectedCheckInEvent.set(null); // null yapıldığı için @if kapanır ve modal ekrandan kalkar
    this.qrImageUrl.set('');
    this.qrCheckInUrl.set('');
    this.qrExpiresAt.set('');
    this.qrErrorMessage.set('');
    // qr penceresine ait eski bilgileri temizler
  }

  generateQrCode(): void {
    const event = this.selectedCheckInEvent(); // qr oluşturulacak etkinliği signal içinden alır

    if (!event || this.generatingQr() || !this.ownsEvent(event)) {
      return; // etkinlik yoksa işlem devam ediyorsa veya manager etkinliğin sahibi değilse işlemi durdurur
    }

    this.generatingQr.set(true); // tekrar butona basılmasını engellemek için qr işlemini başladı olarak işaretler
    this.qrErrorMessage.set('');
    this.qrImageUrl.set('');
    this.qrCheckInUrl.set('');
    this.qrExpiresAt.set('');

    this.eventService.createCheckInSession(event.id, {
      expiresInMinutes: this.qrDuration()
    }).subscribe({
      // subscribe Observable olan backend isteğinin sonucunu dinler
      next: async response => {
        try {
          const checkInUrl = `${window.location.origin}/check-in?token=${encodeURIComponent(response.token)}`;
          // window.location.origin uygulamanın o anki domainini alır encodeURIComponent ise tokenı URLde güvenli kullanılabilecek hale getirir

          const qrImage = await QRCode.toDataURL(checkInUrl, {
            width: 320,
            margin: 2,
            errorCorrectionLevel: 'M'
          });
          // toDataURL check-in linkini qr görseline çevirir width boyutu margin kenar boşluğunu errorCorrectionLevel ise hata düzeltme seviyesini belirler

          this.qrCheckInUrl.set(checkInUrl); // oluşturulan gerçek check-in adresini ekranda göstermek için saklar
          this.qrExpiresAt.set(response.expiresAt); // backendin belirlediği qr bitiş zamanını saklar
          this.qrImageUrl.set(qrImage); // oluşturulan qr görselini signal içine koyunca img etiketi ekranda gösterir
        } catch {
          this.qrErrorMessage.set('QR image could not be created.'); // token alınsa bile qr görseli oluşturulamazsa hata gösterir
        } finally {
          this.generatingQr.set(false); // try başarılı veya hatalı olsa da işlem durumunu kapatır
        }
      },
      error: (error: HttpErrorResponse) => {
        this.qrErrorMessage.set(getApiErrorMessage(error, 'Could not create the QR code.'));
        // backend qr oturumu oluşturamazsa gelen hatayı kullanıcıya uygun mesaja çevirir

        this.generatingQr.set(false); // backend hatasında tekrar qr oluşturulabilmesi için işlem durumunu kapatır
      }
    });
  }

  formatQrExpiry(): string {
    const value = this.qrExpiresAt(); // backendden gelen bitiş zamanını alır

    if (!value) {
      return ''; // bitiş zamanı yoksa boş metin döndürür
    }

    return new Date(value).toLocaleString();
    // backendden gelen tarihi Date nesnesine çevirip kullanıcının yerel tarih saat formatında gösterir
  }

  loadClubs(): void { // bütün kulüpleri backendden getirir
    this.clubService.getAll().subscribe({
      next: clubs => {
        this.clubs.set(clubs); // istek başarılıysa gelen kulüpleri signal içine kaydeder
      },
      error: () => {
        this.clubs.set([]); // kulüp isteği başarısızsa listeyi boşaltır
      }
    });
  }

  loadEvents(): void { // filtre sıralama ve sayfalama bilgilerine göre etkinlikleri getirir
    this.loading.set(true); // backend isteğinin başladığını belirtir
    this.errorMessage.set(''); // önceki hata mesajını temizler

    const clubId = this.selectedClubId() ? Number(this.selectedClubId()) : undefined;
    // selectten string gelen club idsini numbera çevirir seçim yoksa backende filtre göndermemek için undefined yapar

    this.eventService.getPaged({
      search: this.searchText().trim() || undefined, // trim baştaki ve sondaki boşlukları siler boşsa undefined gönderir
      category: this.category().trim() || undefined,
      clubId,
      dateFrom: this.getDateFrom(),
      dateTo: this.getDateTo(),
      upcomingOnly: this.upcomingOnly(),
      sortField: this.sortField() ?? undefined,
      sortDirection: this.sortDirection() ?? undefined,
      page: this.page(),
      pageSize: this.pageSize()
    }).subscribe({
      next: result => {
        this.events.set(result.items); // mevcut sayfadaki etkinlikleri kaydeder
        this.page.set(result.page); // backendin döndürdüğü sayfa numarasını kaydeder
        this.totalCount.set(result.totalCount); // toplam etkinlik sayısını kaydeder
        this.totalPages.set(result.totalPages); // toplam sayfa sayısını kaydeder
        this.loading.set(false); // yükleme işlemini bitirir
      },
      error: (error: HttpErrorResponse) => {
        this.events.set([]);
        this.totalCount.set(0);
        this.totalPages.set(0);
        this.errorMessage.set(getApiErrorMessage(error, 'Could not load events.'));
        this.loading.set(false); // hata olsa bile yükleme durumunu kapatır
      }
    });
  }

  applyFilters(): void {
    this.page.set(1); // filtre değiştiğinde ilk sayfaya döner
    this.loadEvents(); // yeni filtrelerle etkinlikleri tekrar getirir
  }

  clearFilters(): void {
    this.searchText.set('');
    this.category.set('');
    this.selectedClubId.set('');
    this.dateFrom.set('');
    this.dateTo.set('');
    this.upcomingOnly.set(this.auth.hasRole('Student')); // Student ise yaklaşan etkinlik filtresini varsayılan olarak açık bırakır
    this.page.set(1);
    this.loadEvents(); // bütün filtreleri temizleyip etkinlikleri yeniden getirir
  }

  onSort(event: { field?: string; order?: number }): void { // primeng tablo sıralaması değiştiğinde çalışır
    if (!event.field || !event.order) {
      this.sortField.set(null);
      this.sortDirection.set(null);
      this.page.set(1);
      this.loadEvents();
      return; // sıralama kaldırılmışsa backendin varsayılan sıralamasına döner
    }

    this.sortField.set(event.field); // seçilen kolonun adını kaydeder
    this.sortDirection.set(event.order === -1 ? 'desc' : 'asc'); // primeng -1 değerini desc diğer değeri asc olarak çevirir
    this.page.set(1);
    this.loadEvents(); // sıralama bilgilerini backend göndererek listeyi tekrar getirir
  }

  onPageChange(event: { page?: number; first?: number; rows?: number }): void { // primeng paginator sayfa veya pageSize değiştirdiğinde çalışır
    if (this.loading()) {
      return; // önceki backend isteği devam ederken ikinci sayfa isteğini engeller
    }

    const newPageSize = event.rows ?? this.pageSize(); // yeni rows değeri yoksa mevcut pageSize kullanılır
    const newPage = event.page !== undefined ? event.page + 1 : Math.floor((event.first ?? 0) / newPageSize) + 1;
    // primeng sayfayı 0dan backend ise 1den başlattığı için page değerine 1 ekler

    this.pageSize.set(newPageSize);
    this.page.set(newPage);
    this.loadEvents(); // yeni sayfa bilgileriyle backendden etkinlikleri tekrar getirir
  }

  private getDateFrom(): string | undefined { // başlangıç tarihini backendin beklediği ISO tarih formatına çevirir
    const value = this.dateFrom();

    if (!value) {
      return undefined; // tarih seçilmemişse backende filtre göndermez
    }

    return new Date(`${value}T00:00:00`).toISOString(); // seçilen günün başlangıç saatini ISO formatına çevirir
  }

  private getDateTo(): string | undefined { // bitiş tarihini backendin beklediği ISO tarih formatına çevirir
    const value = this.dateTo();

    if (!value) {
      return undefined;
    }

    return new Date(`${value}T23:59:59.999`).toISOString(); // seçilen günün son anını ISO formatına çevirir
  }
}