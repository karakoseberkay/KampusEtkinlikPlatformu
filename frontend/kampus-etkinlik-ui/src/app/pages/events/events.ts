import { Component, inject, OnInit, signal } from '@angular/core'; // Component oluşturmak, servis enjekte etmek, OnInit kullanmak ve signal tanımlamak için gerekli Angular araçlarını içe aktarır.
import { HttpErrorResponse } from '@angular/common/http'; // Backendden gelen HTTP hatalarını yakalamak için kullanılır.
import { RouterLink } from '@angular/router'; // HTML tarafında routerLink ile sayfa geçişi yapmamızı sağlar.

import { AuthService } from '../../core/services/auth.service'; // Giriş yapan kullanıcının bilgilerine ve rollerine erişmemizi sağlar.
import { ClubService } from '../../core/services/club.service'; // Kulüp verilerini backendden çekmek için kullanılan servistir.
import { EventService } from '../../core/services/event.service'; // Etkinlik verilerini backendden çekmek için kullanılan servistir.

import { ClubResponse, EventResponse } from '../../core/models/api.models'; // Backendden dönen kulüp ve etkinlik verilerinin TypeScript tiplerini içe aktarır.

import { getApiErrorMessage } from '../../core/utils/api-error'; // Backend hatalarını kullanıcıya gösterilecek okunabilir mesaja dönüştürür.


@Component({ // Bu classın bir Angular componenti olduğunu belirtir.

  selector: 'app-events', // Componentin HTML selector adını belirler.

  standalone: true, // Componentin NgModule olmadan bağımsız çalıştığını belirtir.

  imports: [
    RouterLink // Template içinde routerLink kullanabilmek için component içerisine eklenir.
  ],

  template: `
    <!-- Etkinlikler sayfasının tamamını kapsayan ana alan -->
    <section class="events-page">


      <!-- ==================================================
           SAYFA BAŞLIĞI
           ================================================== -->

      <!-- Sayfanın başlık ve açıklama bölümünü oluşturur -->
      <div class="page-header">

        <!-- Başlık ve açıklamayı bir arada tutar -->
        <div>

          <!-- Sayfanın ana başlığı -->
          <h1>
            Etkinlikler
          </h1>

          <!-- Kullanıcıya sayfanın amacını açıklar -->
          <p>
            Kampüsteki etkinlikleri inceleyebilir ve filtreleyebilirsiniz.
          </p>

        </div>


        <!-- Sadece ClubManager rolündeki kullanıcılarda çalışır -->
        @if (auth.hasRole('ClubManager')) {

          <!-- Yeni etkinlik oluşturma sayfasına yönlendirir -->
          <a
            class="create-button"
            routerLink="/event-manage"
          >
            + Yeni Etkinlik Oluştur
          </a>

        }

      </div>


      <!-- ==================================================
           ARAMA VE FİLTRELEME
           ================================================== -->

      <!-- Filtreleme alanlarını tek bir kart içerisinde tutar -->
      <section class="filter-card">

        <!-- Filtre kartının başlık kısmıdır -->
        <div class="filter-card-header">

          <!-- Filtreleme bölümünün başlığı -->
          <h2>
            Arama ve Filtreleme
          </h2>

          <!-- Filtreleme bölümüyle ilgili kısa açıklama -->
          <p>
            Aradığınız etkinlikleri daha kolay bulmak için filtreleri kullanabilirsiniz.
          </p>

        </div>


        <!-- Filtre alanlarının bulunduğu ana içerik -->
        <div class="filter-content">

          <!-- Filtre inputlarını grid düzeninde tutar -->
          <div class="filter-grid">


            <!-- ==================================================
                 ETKİNLİK ARAMA
                 ================================================== -->

            <!-- Etkinlik adına göre arama alanı -->
            <div class="form-field">

              <!-- Inputun açıklamasını gösterir -->
              <label for="search">
                Etkinlik Ara
              </label>

              <!-- Kullanıcının yazdığı etkinlik adını searchText signalına aktarır -->
              <input
                id="search"
                type="text"
                placeholder="Etkinlik adı..."
                [value]="searchText()"
                (input)="searchText.set($any($event.target).value)"//inputa yazılan değeri alıp searchtext signaline koyuyor
              >

            </div>


            <!-- ==================================================
                 KATEGORİ
                 ================================================== -->

            <!-- Kategoriye göre filtreleme alanı -->
            <div class="form-field">

              <!-- Kategori inputunun açıklamasıdır -->
              <label for="category">
                Kategori
              </label>

              <!-- Kullanıcının yazdığı kategoriyi category signalına aktarır -->
              <input
                id="category"
                type="text"
                placeholder="Kategori..."
                [value]="category()"
                (input)="category.set($any($event.target).value)"
              >

            </div>


            <!-- ==================================================
                 KULÜP
                 ================================================== -->

            <!-- Etkinlikleri kulübe göre filtrelemek için kullanılır -->
            <div class="form-field">

              <!-- Kulüp seçim alanının açıklamasıdır -->
              <label for="club">
                Kulüp
              </label>

              <!-- Seçilen kulübün ID değerini selectedClubId signalına aktarır -->
              <select
                id="club"
                [value]="selectedClubId()"
                (change)="selectedClubId.set($any($event.target).value)"
              >

                <!-- Herhangi bir kulüp seçilmediğinde bütün kulüpler gösterilir -->
                <option value="">
                  Tüm Kulüpler
                </option>

                <!-- Backendden gelen bütün kulüpleri select içerisine option olarak ekler -->
                @for (club of clubs(); track club.id) {

                  <!-- Optionun value kısmında kulüp IDsi, görünen kısmında kulüp adı bulunur -->
                  <option [value]="club.id">
                    {{ club.name }}
                  </option>

                }

              </select>

            </div>


            <!-- ==================================================
                 BAŞLANGIÇ TARİHİ
                 ================================================== -->

            <!-- Başlangıç tarihine göre filtreleme alanı -->
            <div class="form-field">

              <!-- Başlangıç tarihi inputunun açıklamasıdır -->
              <label for="dateFrom">
                Başlangıç Tarihi
              </label>

              <!-- Seçilen tarihi dateFrom signalına aktarır -->
              <input
                id="dateFrom"
                type="date"
                [value]="dateFrom()"
                (change)="dateFrom.set($any($event.target).value)"
              >

            </div>


            <!-- ==================================================
                 BİTİŞ TARİHİ
                 ================================================== -->

            <!-- Bitiş tarihine göre filtreleme alanı -->
            <div class="form-field">

              <!-- Bitiş tarihi inputunun açıklamasıdır -->
              <label for="dateTo">
                Bitiş Tarihi
              </label>

              <!-- Seçilen tarihi dateTo signalına aktarır -->
              <input
                id="dateTo"
                type="date"
                [value]="dateTo()"
                (change)="dateTo.set($any($event.target).value)"
              >

            </div>


            <!-- ==================================================
                 YAKLAŞAN ETKİNLİKLER
                 ================================================== -->

            <!-- Checkbox alanını düzenlemek için kullanılır -->
            <div class="checkbox-area">

              <!-- Checkbox ve yazısını birlikte tıklanabilir hale getirir -->
              <label class="checkbox-field">

                <!-- Açık olduğunda sadece yaklaşan aktif etkinlikleri getirir -->
                <input
                  type="checkbox"
                  [checked]="upcomingOnly()"
                  (change)="upcomingOnly.set($any($event.target).checked)"
                >

                <!-- Checkboxın kullanıcıya görünen açıklamasıdır -->
                <span>
                  Sadece yaklaşan aktif etkinlikler
                </span>

              </label>

            </div>

          </div>


          <!-- ==================================================
               FİLTRE BUTONLARI
               ================================================== -->

          <!-- Filtre işlemlerinin butonlarını yan yana tutar -->
          <div class="filter-actions">

            <!-- Seçilen filtreleri uygular -->
            <button
              class="filter-button"
              type="button"
              [disabled]="loading()"
              (click)="applyFilters()"
            >
              Filtrele
            </button>


            <!-- Bütün filtre alanlarını temizler -->
            <button
              class="clear-button"
              type="button"
              [disabled]="loading()"
              (click)="clearFilters()"
            >
              Filtreleri Temizle
            </button>

          </div>

        </div>

      </section>


      <!-- ==================================================
           YÜKLENİYOR MESAJI
           ================================================== -->

      <!-- Backend isteği devam ediyorsa gösterilir -->
      @if (loading()) {

        <!-- Kullanıcıya verilerin yüklenmekte olduğunu bildirir -->
        <div class="page-message">
          Etkinlikler yükleniyor...
        </div>

      }


      <!-- ==================================================
           HATA MESAJI
           ================================================== -->

      <!-- Backend isteği sırasında hata oluştuysa çalışır -->
      @if (errorMessage()) {

        <!-- Backendden gelen hata mesajını kullanıcıya gösterir -->
        <div class="page-message error-message">
          {{ errorMessage() }}
        </div>

      }


      <!-- ==================================================
           ETKİNLİK BULUNAMADI
           ================================================== -->

      <!-- Yükleme bittiyse, hata yoksa ve liste boşsa çalışır -->
      @if (
        !loading() &&
        events().length === 0 &&
        !errorMessage()
      ) {

        <!-- Arama sonucunda etkinlik bulunmadığını bildirir -->
        <div class="page-message">
          Arama kriterlerine uygun etkinlik bulunamadı.
        </div>

      }


      <!-- ==================================================
           ETKİNLİK LİSTESİ
           ================================================== -->

      <!-- events dizisinde en az bir etkinlik varsa tabloyu gösterir -->
      @if (events().length > 0) {

        <!-- Etkinlik listesinin tamamını kapsar -->
        <section class="events-section">

          <!-- Tablo üzerindeki başlık alanıdır -->
          <div class="list-header">

            <!-- Başlık ve toplam etkinlik sayısını bir arada tutar -->
            <div>

              <!-- Listenin başlığı -->
              <h2>
                Etkinlik Listesi
              </h2>

              <!-- Backendden gelen toplam etkinlik sayısını gösterir -->
              <p>
                Toplam {{ totalCount() }} etkinlik bulundu.
              </p>

            </div>

          </div>


          <!-- Tabloyu beyaz kart içerisinde tutar -->
          <div class="table-card">

            <!-- Küçük ekranlarda tablonun yatay kaydırılabilmesini sağlar -->
            <div class="table-wrapper">

              <!-- Etkinlik tablosu -->
              <table class="events-table">

                <!-- Tablo kolonlarının başlık bölümü -->
                <thead>

                  <!-- Tablo başlık satırı -->
                  <tr>

                    <!-- Etkinlik adının bulunduğu kolon -->
                    <th>
                      Etkinlik
                    </th>

                    <!-- Kulüp adının bulunduğu kolon -->
                    <th>
                      Kulüp
                    </th>

                    <!-- Etkinlik tarihinin bulunduğu kolon -->
                    <th>
                      Tarih
                    </th>

                    <!-- Etkinlik konumunun bulunduğu kolon -->
                    <th>
                      Konum
                    </th>

                    <!-- Etkinlik kapasitesinin bulunduğu kolon -->
                    <th>
                      Kapasite
                    </th>

                    <!-- Etkinlik kategorisinin bulunduğu kolon -->
                    <th>
                      Kategori
                    </th>

                    <!-- Etkinliğin katılım tipinin bulunduğu kolon -->
                    <th>
                      Katılım Tipi
                    </th>

                    <!-- Etkinliğin aktif veya pasif durumunun bulunduğu kolon -->
                    <th>
                      Durum
                    </th>

                    <!-- Detay ve yönetim butonlarının bulunduğu kolon -->
                    <th>
                      İşlem
                    </th>

                  </tr>

                </thead>


                <!-- Backendden gelen etkinliklerin gösterildiği tablo gövdesi -->
                <tbody>

                  <!-- events dizisindeki bütün etkinlikleri tek tek dolaşır -->
                  @for (event of events(); track event.id) {

                    <!-- Her etkinlik için yeni bir tablo satırı oluşturur -->
                    <tr>

                      <!-- Etkinliğin başlığını gösterir -->
                      <td class="event-title">
                        {{ event.title }}
                      </td>


                      <!-- Etkinliği oluşturan kulübün adını gösterir -->
                      <td>
                        {{ event.clubName }}
                      </td>


                      <!-- Etkinliğin başlangıç tarihini gösterir -->
                      <td>
                        {{ event.startDate }}
                      </td>


                      <!-- Etkinliğin gerçekleşeceği yeri gösterir -->
                      <td>
                        {{ event.location }}
                      </td>


                      <!-- Etkinliğin maksimum kapasitesini gösterir -->
                      <td>
                        {{ event.capacity }}
                      </td>


                      <!-- Etkinliğin kategorisini turuncu etiket içerisinde gösterir -->
                      <td>

                        <!-- Kategori görsel etiketi -->
                        <span class="category-badge">
                          {{ event.category }}
                        </span>

                      </td>


                      <!-- Etkinliğin katılım türünü kullanıcıya anlaşılır şekilde gösterir -->
                      <td>

                        <!-- Backendden Public gelirse herkese açık yazar -->
                        @if (event.visibility === 'Public') {

                          <!-- Kullanıcıya Türkçe açıklama gösterir -->
                          <span>
                            Herkese Açık
                          </span>

                        } @else {

                          <!-- Public değilse onay gerektiğini gösterir -->
                          <span>
                            Onay Gerekli
                          </span>

                        }

                      </td>


                      <!-- Etkinliğin durumunu gösterir -->
                      <td>

                        <!-- Etkinlik aktifse yeşil Aktif etiketi gösterir -->
                        @if (event.status === 'Active') {

                          <!-- Aktif etkinlik etiketi -->
                          <span class="status-badge status-active">
                            Aktif
                          </span>

                        } @else {

                          <!-- Etkinlik aktif değilse backendden gelen durumu gösterir -->
                          <span class="status-badge status-passive">
                            {{ event.status }}
                          </span>

                        }

                      </td>


                      <!-- Etkinlikle ilgili işlem butonlarını gösterir -->
                      <td>

                        <!-- İşlem butonlarını yan yana tutar -->
                        <div class="table-actions">

                          <!-- Etkinliğin detay sayfasına gider -->
                          <a
                            class="detail-link"
                            [routerLink]="['/events', event.id]"
                          >
                            Detay
                          </a>


                          <!-- Giriş yapan ClubManager bu etkinliğin kulübünün yöneticisiyse çalışır -->
                          @if (ownsEvent(event)) {

                            <!-- Etkinlik güncelleme sayfasına gider -->
                            <a
                              class="edit-link"
                              [routerLink]="['/event-manage', event.id]"
                            >
                              Güncelle
                            </a>


                            <!-- Etkinliğe yapılan kayıtların yönetildiği sayfaya gider -->
                            <a
                              class="registration-link"
                              [routerLink]="[
                                '/events',
                                event.id,
                                'registrations'
                              ]"
                            >
                              Kayıtlar
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


          <!-- ==================================================
               SAYFALAMA
               ================================================== -->

          <!-- Önceki ve sonraki sayfa butonlarını kapsar -->
          <div class="pagination">

            <!-- Bir önceki sayfaya geçer -->
            <button
              class="pagination-button"
              type="button"
              [disabled]="page() <= 1 || loading()"
              (click)="previousPage()"
            >
              Önceki
            </button>


            <!-- Aktif ve toplam sayfa sayısını gösterir -->
            <span class="page-number">

              Sayfa

              <!-- Bulunduğumuz sayfayı gösterir -->
              <strong>
                {{ page() }}
              </strong>

              /

              <!-- Toplam sayfa sayısını gösterir -->
              <strong>
                {{ totalPages() }}
              </strong>

            </span>


            <!-- Bir sonraki sayfaya geçer -->
            <button
              class="pagination-button pagination-button-primary"
              type="button"
              [disabled]="page() >= totalPages() || loading()"
              (click)="nextPage()"
            >
              Sonraki
            </button>

          </div>

        </section>

      }

    </section>
  `,

  styleUrl: './events.scss' // Bu componentin tasarımını events.scss dosyasından almasını sağlar.
})


export class Events implements OnInit { // Etkinlikler componentinin TypeScript classını oluşturur ve OnInit yaşam döngüsünü kullanır.

  readonly auth = inject(AuthService); // Giriş yapan kullanıcının bilgilerine ve rolüne erişmek için AuthService'i enjekte eder.

  private readonly clubService = inject(ClubService); // Kulüp verilerini backendden almak için ClubService'i enjekte eder.

  private readonly eventService = inject(EventService); // Etkinlik verilerini backendden almak için EventService'i enjekte eder.


  readonly events = signal<EventResponse[]>([]); // Backendden gelen etkinlik listesini tutar.

  readonly clubs = signal<ClubResponse[]>([]); // Backendden gelen kulüp listesini tutar.

  readonly searchText = signal(''); // Etkinlik arama kutusuna yazılan metni tutar.

  readonly category = signal(''); // Kullanıcının girdiği kategori filtresini tutar.

  readonly selectedClubId = signal(''); // Seçilen kulübün ID değerini tutar.

  readonly dateFrom = signal(''); // Başlangıç tarihi filtresini tutar.

  readonly dateTo = signal(''); // Bitiş tarihi filtresini tutar.

  readonly upcomingOnly = signal(false); // Sadece yaklaşan etkinliklerin gösterilip gösterilmeyeceğini tutar.

  readonly page = signal(1); // Kullanıcının bulunduğu mevcut sayfa numarasını tutar.

  readonly pageSize = signal(10); // Bir sayfada maksimum 10 etkinlik gösterileceğini belirtir.

  readonly totalCount = signal(0); // Backendde filtreye uygun toplam kaç etkinlik olduğunu tutar.

  readonly totalPages = signal(0); // Toplam kaç sayfa olduğunu tutar.

  readonly loading = signal(false); // Backend isteğinin devam edip etmediğini tutar.

  readonly errorMessage = signal(''); // Kullanıcıya gösterilecek hata mesajını tutar.


  ngOnInit(): void { // Component ekrana ilk yüklendiğinde otomatik çalışan metottur.

    if (this.auth.hasRole('Student')) { // Giriş yapan kullanıcı Student rolündeyse kontrol içerisine girer.

      this.upcomingOnly.set(true); // Student için varsayılan olarak sadece yaklaşan aktif etkinlikleri seçer.

    }


    this.loadClubs(); // Kulüp filtresi ve yetki kontrolü için kulüp listesini backendden getirir.

    this.loadEvents(); // Sayfa ilk açıldığında etkinlik listesini backendden getirir.

  }


  ownsEvent(event: EventResponse): boolean { // ClubManager'ın verilen etkinliği yönetme yetkisi olup olmadığını kontrol eder.

    const user = this.auth.currentUser(); // Giriş yapan kullanıcının bilgilerini user değişkenine alır.


    if (!user || !this.auth.hasRole('ClubManager')) { // Kullanıcı giriş yapmamışsa veya ClubManager değilse kontrol içerisine girer.

      return false; // Yönetim yetkisi olmadığını belirtir.

    }


    return this.clubs().some( // Kulüp dizisinde koşulu sağlayan en az bir kulüp olup olmadığını kontrol eder.

      club => // Dizideki her kulübü tek tek kontrol eder.

        club.id === event.clubId && // Kulübün IDsi etkinliğin bağlı olduğu kulüp IDsiyle aynı mı kontrol eder.

        club.managerUserId === user.userId // Kulübün yöneticisi giriş yapan kullanıcı mı kontrol eder.

    );

  }


  loadClubs(): void { // Backendden bütün kulüpleri getiren metottur.

    this.clubService.getAll().subscribe({ // ClubService içindeki getAll metodunu çağırır ve sonucu dinler.

      next: clubs => { // Backend isteği başarılı olursa çalışır.

        this.clubs.set(clubs); // Backendden gelen kulüp listesini clubs signalına aktarır.

      },

      error: () => { // Kulüp isteğinde hata oluşursa çalışır.

        this.clubs.set([]); // Kulüp listesini boş dizi yapar.

      }

    });

  }


  loadEvents(): void { // Filtrelere ve sayfalama bilgilerine göre etkinlikleri backendden getirir.

    this.loading.set(true); // Backend isteğinin başladığını belirtir.

    this.errorMessage.set(''); // Önceki hata mesajını temizler.


    const clubId = this.selectedClubId() // Kullanıcının bir kulüp seçip seçmediğini kontrol eder.

      ? Number(this.selectedClubId()) // Kulüp seçilmişse string değeri number tipine çevirir.

      : undefined; // Kulüp seçilmemişse backend filtresine undefined gönderir.


    this.eventService.getPaged({ // EventService üzerinden filtreli ve sayfalı etkinlik isteği gönderir.

      search: this.searchText().trim() || undefined, // Arama metnini gönderir; boşsa undefined gönderir.

      category: this.category().trim() || undefined, // Kategori değerini gönderir; boşsa undefined gönderir.

      clubId, // Yukarıda hazırlanan kulüp ID filtresini gönderir.

      dateFrom: this.getDateFrom(), // Başlangıç tarihini backend formatına çevirerek gönderir.

      dateTo: this.getDateTo(), // Bitiş tarihini backend formatına çevirerek gönderir.

      upcomingOnly: this.upcomingOnly(), // Sadece yaklaşan etkinliklerin istenip istenmediğini gönderir.

      page: this.page(), // Backendden hangi sayfanın istendiğini gönderir.

      pageSize: this.pageSize() // Bir sayfada kaç etkinlik istendiğini gönderir.

    }).subscribe({ // Backendden gelecek cevabı dinlemeye başlar.

      next: result => { // Backend isteği başarılı olduğunda çalışır.

        this.events.set(result.items); // Backendden gelen etkinlikleri events signalına aktarır.

        this.page.set(result.page); // Backendin döndürdüğü mevcut sayfa numarasını kaydeder.

        this.totalCount.set(result.totalCount); // Toplam etkinlik sayısını kaydeder.

        this.totalPages.set(result.totalPages); // Toplam sayfa sayısını kaydeder.

        this.loading.set(false); // Backend isteğinin tamamlandığını belirtir.

      },

      error: (error: HttpErrorResponse) => { // Backend isteği hata verdiğinde çalışır.

        this.events.set([]); // Etkinlik listesini temizler.

        this.totalCount.set(0); // Toplam etkinlik sayısını sıfırlar.

        this.totalPages.set(0); // Toplam sayfa sayısını sıfırlar.

        this.errorMessage.set( // Kullanıcıya gösterilecek hata mesajını belirler.

          getApiErrorMessage( // HTTP hatasını kullanıcıya uygun metne dönüştürür.

            error, // Backendden gelen hata nesnesini gönderir.

            'Etkinlikler alınamadı.' // Özel hata mesajı bulunamazsa gösterilecek varsayılan mesajdır.

          )

        );

        this.loading.set(false); // Hata olsa bile yükleme işleminin bittiğini belirtir.

      }

    });

  }


  applyFilters(): void { // Kullanıcının seçtiği filtreleri uygulayan metottur.

    this.page.set(1); // Yeni filtre uygulandığında ilk sayfaya döner.

    this.loadEvents(); // Yeni filtrelerle etkinlikleri backendden tekrar getirir.

  }


  clearFilters(): void { // Kullanıcının seçtiği bütün filtreleri temizler.

    this.searchText.set(''); // Arama metnini temizler.

    this.category.set(''); // Kategori filtresini temizler.

    this.selectedClubId.set(''); // Kulüp seçimini temizler.

    this.dateFrom.set(''); // Başlangıç tarihini temizler.

    this.dateTo.set(''); // Bitiş tarihini temizler.

    this.upcomingOnly.set(this.auth.hasRole('Student')); // Student ise yaklaşan etkinlik filtresini açık, değilse kapalı yapar.

    this.page.set(1); // İlk sayfaya döner.

    this.loadEvents(); // Temizlenmiş filtrelerle etkinlikleri yeniden getirir.

  }


  previousPage(): void { // Kullanıcıyı bir önceki sayfaya götüren metottur.

    if (this.page() <= 1 || this.loading()) { // İlk sayfadaysak veya veri yükleniyorsa geçiş yapılmasını engeller.

      return; // Metottan çıkar.

    }


    this.page.update(page => page - 1); // Mevcut sayfa numarasını bir azaltır.

    this.loadEvents(); // Yeni sayfanın etkinliklerini backendden getirir.

  }


  nextPage(): void { // Kullanıcıyı bir sonraki sayfaya götüren metottur.

    if (this.page() >= this.totalPages() || this.loading()) { // Son sayfadaysak veya veri yükleniyorsa ilerlemeyi engeller.

      return; // Metottan çıkar.

    }


    this.page.update(page => page + 1); // Mevcut sayfa numarasını bir artırır.

    this.loadEvents(); // Yeni sayfanın etkinliklerini backendden getirir.

  }


  private getDateFrom(): string | undefined { // Başlangıç tarihini backendin beklediği ISO formatına dönüştürür.

    const value = this.dateFrom(); // Kullanıcının seçtiği başlangıç tarihini alır.


    if (!value) { // Kullanıcı herhangi bir tarih seçmemişse çalışır.

      return undefined; // Backend filtresine tarih gönderilmemesini sağlar.

    }


    return new Date(`${value}T00:00:00`).toISOString(); // Seçilen günün başlangıcını UTC ISO tarih formatına dönüştürür.

  }


  private getDateTo(): string | undefined { // Bitiş tarihini backendin beklediği ISO formatına dönüştürür.

    const value = this.dateTo(); // Kullanıcının seçtiği bitiş tarihini alır.


    if (!value) { // Bitiş tarihi seçilmemişse çalışır.

      return undefined; // Backend filtresine bitiş tarihi gönderilmemesini sağlar.

    }


    return new Date(`${value}T23:59:59.999`).toISOString(); // Seçilen günün son anını UTC ISO tarih formatına dönüştürür.

  }

}