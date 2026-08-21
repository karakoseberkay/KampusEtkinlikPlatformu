import { Component, inject, OnInit, signal } from '@angular/core'; // Angular componenti, servis enjeksiyonu, OnInit ve signal yapısını kullanmak için gerekli araçları içe aktarır.
import { HttpErrorResponse } from '@angular/common/http'; // Backendden gelen HTTP hatalarını yakalamak için kullanılır.
import { RouterLink } from '@angular/router'; // Template içinde routerLink ile sayfa geçişi yapabilmemizi sağlar.
import { ClubService } from '../../core/services/club.service'; // Kulüp verilerini backendden almak için kullanılır.
import { AuthService } from '../../core/services/auth.service'; // Giriş yapan kullanıcının rol ve kullanıcı bilgilerine erişmemizi sağlar.
import { ClubResponse } from '../../core/models/api.models'; // Backendden gelen kulüp nesnesinin TypeScript tipidir.
import { getApiErrorMessage } from '../../core/utils/api-error'; // Backend hatalarını kullanıcıya gösterilecek anlaşılır mesaja dönüştürür.

@Component({ // Bu classın Angular componenti olduğunu belirtir.
  selector: 'app-clubs', // Componentin selector adını belirler.
  standalone: true, // Componentin NgModule kullanmadan bağımsız çalışmasını sağlar.
  imports: [RouterLink], // Template içerisinde routerLink kullanabilmemizi sağlar.
  template: `
    <!-- Kulüpler sayfasının tamamını kapsar -->
    <section class="clubs-page">

      <!-- Sayfanın üst başlık alanıdır -->
      <div class="page-header">
        <div>
          <h1>Kulüpler</h1> <!-- Sayfanın ana başlığını gösterir. -->
          <p>Kampüste bulunan öğrenci kulüplerini görüntüleyebilirsiniz.</p> <!-- Sayfanın kısa açıklamasını gösterir. -->
        </div>

        <!-- Sadece ClubManager rolündeki kullanıcıya yeni kulüp oluşturma butonu gösterilir -->
        @if (auth.hasRole('ClubManager')) {
          <a class="create-button" routerLink="/club-manage">
            + Yeni Kulüp Oluştur
          </a>
        }
      </div>

      <!-- Backend isteği devam ederken kullanıcıya yükleme mesajı gösterilir -->
      @if (loading()) {
        <div class="page-message">
          Kulüpler yükleniyor...
        </div>
      }

      <!-- Backend isteği hata verdiğinde hata mesajı gösterilir -->
      @if (errorMessage()) {
        <div class="page-message error-message">
          {{ errorMessage() }}
        </div>
      }

      <!-- Yükleme tamamlandıysa, hata yoksa ve kulüp bulunamadıysa gösterilir -->
      @if (!loading() && clubs().length === 0 && !errorMessage()) {
        <div class="page-message">
          Kulüp bulunamadı.
        </div>
      }

      <!-- Kulüp listesinde en az bir kayıt varsa tabloyu gösterir -->
      @if (clubs().length > 0) {
        <section class="clubs-section">

          <!-- Tablo üstündeki açıklama alanıdır -->
          <div class="list-header">
            <h2>Kulüp Listesi</h2> <!-- Liste bölümünün başlığını gösterir. -->
            <p>Toplam {{ clubs().length }} kulüp görüntüleniyor.</p> <!-- Ekrandaki toplam kulüp sayısını gösterir. -->
          </div>

          <!-- Tabloyu kart görünümünde tutar -->
          <div class="table-card">
            <!-- Küçük ekranlarda tablonun yatay kaydırılmasını sağlar -->
            <div class="table-wrapper">

              <!-- Kulüp verilerinin gösterildiği tablo -->
              <table class="clubs-table">

                <!-- Tablo başlıkları -->
                <thead>
                  <tr>
                    <th>Kulüp Adı</th> <!-- Kulüp adının bulunduğu kolondur. -->
                    <th>Açıklama</th> <!-- Kulüp açıklamasının bulunduğu kolondur. -->
                    <th>Logo URL</th> <!-- Kulübün logo bağlantısını metin olarak gösterir. -->
                    <th>Yönetici</th> <!-- Kulüp yöneticisinin adını gösterir. -->
                    <th>Etkinlik Sayısı</th> <!-- Kulübün oluşturduğu etkinlik sayısını gösterir. -->
                    <th>İşlem</th> <!-- Detay ve yönetim işlemlerinin bulunduğu kolondur. -->
                  </tr>
                </thead>

                <!-- Backendden gelen kulüplerin gösterildiği tablo gövdesi -->
                <tbody>

                  <!-- clubs dizisindeki bütün kulüpleri tek tek dolaşır -->
                  @for (club of clubs(); track club.id) {
                    <tr>

                      <!-- Kulüp adını sadece metin olarak gösterir, yanında görsel bulunmaz -->
                      <td class="club-name">
                        {{ club.name }}
                      </td>

                      <!-- Kulübün açıklamasını gösterir -->
                      <td class="description-cell">
                        {{ club.description }}
                      </td>

                      <!-- Logo URL bilgisini görsele çevirmeden metin olarak gösterir -->
                      <td class="logo-url">
                        {{ club.logoUrl || '-' }}
                      </td>

                      <!-- Kulüp yöneticisinin adını gösterir -->
                      <td>
                        {{ club.managerFullName }}
                      </td>

                      <!-- Kulübün toplam etkinlik sayısını gösterir -->
                      <td>
                        <span class="event-count">
                          {{ club.eventCount }}
                        </span>
                      </td>

                      <!-- Kulüple ilgili işlem butonlarını gösterir -->
                      <td>
                        <div class="table-actions">

                          <!-- Kulübün detay sayfasına yönlendirir -->
                          <a class="detail-link" [routerLink]="['/clubs', club.id]">
                            Detay
                          </a>

                          <!-- Giriş yapan ClubManager bu kulübün yöneticisiyse çalışır -->
                          @if (ownsClub(club)) {

                            <!-- Kulübün güncelleme sayfasına yönlendirir -->
                            <a class="edit-link" [routerLink]="['/club-manage', club.id]">
                              Güncelle
                            </a>

                            <!-- Kulübün istatistik sayfasına yönlendirir -->
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
  styleUrl: './clubs.scss' // Bu componentin tasarımını clubs.scss dosyasından almasını sağlar.
})
export class Clubs implements OnInit { // Kulüpler sayfasının TypeScript classıdır ve OnInit yaşam döngüsünü kullanır.
  readonly auth = inject(AuthService); // Giriş yapan kullanıcının rol ve kullanıcı bilgilerine erişmek için AuthService'i enjekte eder.
  private readonly clubService = inject(ClubService); // Kulüp verilerini backendden çekmek için ClubService'i enjekte eder.

  readonly clubs = signal<ClubResponse[]>([]); // Backendden gelen kulüp listesini tutar.
  readonly loading = signal(false); // Kulüpler yüklenirken işlemin devam edip etmediğini tutar.
  readonly errorMessage = signal(''); // Kullanıcıya gösterilecek hata mesajını tutar.


  ngOnInit(): void { // Sayfa ilk açıldığında otomatik olarak çalışır.
    this.loadClubs(); // Backendden bütün kulüpleri getirir.
  }


  ownsClub(club: ClubResponse): boolean { // Giriş yapan kullanıcının verilen kulübün yöneticisi olup olmadığını kontrol eder.
    const user = this.auth.currentUser(); // Giriş yapan kullanıcının bilgilerini user değişkenine alır.

    return (
      !!user && // Kullanıcı bilgisinin mevcut olup olmadığını kontrol eder.
      this.auth.hasRole('ClubManager') && // Giriş yapan kullanıcının ClubManager rolüne sahip olup olmadığını kontrol eder.
      club.managerUserId === user.userId // Kulübün yönetici IDsi ile giriş yapan kullanıcının IDsinin aynı olup olmadığını kontrol eder.
    );
  }


  loadClubs(): void { // Backendden bütün kulüpleri getiren metottur.
    this.loading.set(true); // Backend isteğinin başladığını belirtir.
    this.errorMessage.set(''); // Önceki hata mesajını temizler.

    this.clubService.getAll().subscribe({ // ClubService içindeki getAll metodunu çağırır ve backend cevabını dinler.
      next: clubs => { // Backend isteği başarılı olduğunda çalışır.
        this.clubs.set(clubs); // Backendden gelen kulüp listesini clubs signalına aktarır.
        this.loading.set(false); // Yükleme işleminin tamamlandığını belirtir.
      },
      error: (error: HttpErrorResponse) => { // Backend isteği hata verdiğinde çalışır.
        this.clubs.set([]); // Hata durumunda kulüp listesini boşaltır.
        this.errorMessage.set(
          getApiErrorMessage(error, 'Kulüpler alınamadı.') // Backend hatasını kullanıcıya anlaşılır mesaja dönüştürür.
        );
        this.loading.set(false); // Hata olsa bile yükleme işlemini sonlandırır.
      }
    });
  }
}