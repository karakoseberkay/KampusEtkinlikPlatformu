import { Component, inject, OnInit, signal } from '@angular/core'; // Component, servis enjeksiyonu, OnInit ve signal yapısını kullanmak için gerekli Angular araçlarını içe aktarır.
import { HttpErrorResponse } from '@angular/common/http'; // Backendden gelen HTTP hatalarını yakalamak için kullanılır.
import { FormsModule } from '@angular/forms'; // Template içerisinde ngModel kullanabilmemizi sağlar.
import { ActivatedRoute } from '@angular/router'; // URL içindeki etkinlik ID değerine erişmek için kullanılır.
import { RegistrationService } from '../../core/services/registration.service'; // Etkinlik kayıtlarını getirmek, onaylamak ve reddetmek için kullanılır.
import { RegistrationApprovalStatus, RegistrationResponse } from '../../core/models/api.models'; // Kayıt durumlarının ve kayıt nesnelerinin TypeScript tiplerini içe aktarır.
import { getApiErrorMessage } from '../../core/utils/api-error'; // Backend hatalarını kullanıcıya gösterilecek anlaşılır mesaja dönüştürür.

@Component({ // Bu classın Angular componenti olduğunu belirtir.
  selector: 'app-event-registrations', // Componentin selector adını belirler.
  standalone: true, // Componentin NgModule kullanmadan bağımsız çalışmasını sağlar.
  imports: [FormsModule], // Template içerisinde ngModel kullanabilmemizi sağlar.
  template: `
    <!-- Etkinlik kayıtları sayfasının tamamını kapsar -->
    <section class="event-registrations-page">

      <!-- Sayfanın üst başlık alanıdır -->
      <div class="page-header">
        <div>
          <h1>Etkinlik Kayıtları</h1> <!-- Sayfanın ana başlığını gösterir. -->
          <p>Etkinliğe yapılan öğrenci kayıtlarını görüntüleyebilir ve yönetebilirsiniz.</p> <!-- Sayfanın kısa açıklamasını gösterir. -->
        </div>

        <!-- Kayıt listesini backendden tekrar çekmek için kullanılır -->
        <button class="refresh-button" type="button" [disabled]="loading()" (click)="loadRegistrations()">
          {{ loading() ? 'Yükleniyor...' : 'Kayıtları Yenile' }}
        </button>
      </div>

      <!-- Filtre alanını kart içerisinde gösterir -->
      <section class="filter-card">
        <div class="filter-header">
          <h2>Kayıt Durumu</h2> <!-- Filtre bölümünün başlığını gösterir. -->
          <p>Kayıtları onay durumlarına göre filtreleyebilirsiniz.</p> <!-- Filtrenin ne işe yaradığını açıklar. -->
        </div>

        <div class="filter-content">
          <div class="form-field">
            <label for="approvalStatus">Durum</label> <!-- Select alanının açıklamasıdır. -->

            <!-- Seçilen kayıt durumunu selectedStatus signalına bağlar -->
            <select
              id="approvalStatus"
              [ngModel]="selectedStatus()"
              (ngModelChange)="changeStatus($event)"
            >
              <option value="">Tümü</option> <!-- Herhangi bir durum filtresi uygulamaz. -->
              <option value="Pending">Bekleyen</option> <!-- Sadece onay bekleyen kayıtları gösterir. -->
              <option value="Approved">Onaylanan</option> <!-- Sadece onaylanmış kayıtları gösterir. -->
              <option value="Rejected">Reddedilen</option> <!-- Sadece reddedilmiş kayıtları gösterir. -->
            </select>
          </div>
        </div>
      </section>

      <!-- Backend isteği devam ederken ve tablo henüz boşsa gösterilir -->
      @if (loading() && registrations().length === 0) {
        <div class="page-message">
          Etkinlik kayıtları yükleniyor...
        </div>
      }

      <!-- Backend isteğinde hata oluşursa gösterilir -->
      @if (errorMessage()) {
        <div class="page-message error-message">
          {{ errorMessage() }}
        </div>
      }

      <!-- Onaylama veya reddetme işlemi başarılı olduğunda gösterilir -->
      @if (successMessage()) {
        <div class="page-message success-message">
          {{ successMessage() }}
        </div>
      }

      <!-- Yükleme tamamlandıysa, hata yoksa ve kayıt bulunamadıysa gösterilir -->
      @if (!loading() && registrations().length === 0 && !errorMessage()) {
        <div class="empty-card">
          Seçilen duruma uygun kayıt bulunamadı.
        </div>
      }

      <!-- En az bir kayıt bulunuyorsa tabloyu gösterir -->
      @if (registrations().length > 0) {
        <section class="registrations-section">

          <!-- Tablo bölümünün başlığını gösterir -->
          <div class="section-header">
            <h2>Kayıt Listesi</h2> <!-- Kayıt listesinin başlığıdır. -->
            <p>Toplam {{ registrations().length }} kayıt görüntüleniyor.</p> <!-- O anda ekranda bulunan kayıt sayısını gösterir. -->
          </div>

          <!-- Tabloyu kart görünümünde tutar -->
          <div class="table-card">
            <!-- Küçük ekranlarda tablonun yatay kaydırılabilmesini sağlar -->
            <div class="table-wrapper">

              <!-- Etkinlik kayıtlarının gösterildiği tablo -->
              <table class="registrations-table">

                <!-- Tablo kolon başlıkları -->
                <thead>
                  <tr>
                    <th>Öğrenci</th> <!-- Kayıt yapan öğrencinin adını gösterir. -->
                    <th>Etkinlik</th> <!-- Kayıt yapılan etkinliğin adını gösterir. -->
                    <th>Kulüp</th> <!-- Etkinliği oluşturan kulübün adını gösterir. -->
                    <th>Kayıt Tarihi</th> <!-- Öğrencinin ne zaman kayıt olduğunu gösterir. -->
                    <th>Durum</th> <!-- Kaydın onay durumunu gösterir. -->
                    <th>İşlem</th> <!-- Onayla ve Reddet butonlarının bulunduğu kolondur. -->
                  </tr>
                </thead>

                <!-- Backendden gelen kayıtları tabloya basar -->
                <tbody>
                  @for (registration of registrations(); track registration.id) {
                    <tr>

                      <!-- Kayıt yapan öğrencinin adını gösterir -->
                      <td class="student-name">
                        {{ registration.userFullName }}
                      </td>

                      <!-- Öğrencinin kayıt olduğu etkinliği gösterir -->
                      <td class="event-title">
                        {{ registration.eventTitle }}
                      </td>

                      <!-- Etkinliği oluşturan kulübün adını gösterir -->
                      <td>
                        {{ registration.clubName }}
                      </td>

                      <!-- Kayıt tarihini gösterir -->
                      <td>
                        {{ registration.registeredAt }}
                      </td>

                      <!-- Kayıt durumunu kullanıcıya Türkçe ve renkli etiket şeklinde gösterir -->
                      <td>
                        @if (registration.approvalStatus === 'Pending') {
                          <span class="status-badge status-pending">
                            Bekliyor
                          </span>
                        } @else if (registration.approvalStatus === 'Approved') {
                          <span class="status-badge status-approved">
                            Onaylandı
                          </span>
                        } @else if (registration.approvalStatus === 'Rejected') {
                          <span class="status-badge status-rejected">
                            Reddedildi
                          </span>
                        } @else {
                          <span class="status-badge status-default">
                            {{ registration.approvalStatus }}
                          </span>
                        }
                      </td>

                      <!-- Kayıtla ilgili yönetim işlemlerini gösterir -->
                      <td>
                        <!-- Sadece Pending durumundaki kayıtlar onaylanabilir veya reddedilebilir -->
                        @if (registration.approvalStatus === 'Pending') {
                          <div class="table-actions">

                            <!-- Öğrenci kaydını onaylamak için kullanılır -->
                            <button
                              class="approve-button"
                              type="button"
                              [disabled]="processingId() !== null"
                              (click)="approve(registration.id)"
                            >
                              {{ processingId() === registration.id ? 'İşleniyor...' : 'Onayla' }}
                            </button>

                            <!-- Öğrenci kaydını reddetmek için kullanılır -->
                            <button
                              class="reject-button"
                              type="button"
                              [disabled]="processingId() !== null"
                              (click)="reject(registration.id)"
                            >
                              Reddet
                            </button>

                          </div>
                        } @else {
                          <!-- Kayıt daha önce sonuçlandırılmışsa tekrar işlem yapılmasını engeller -->
                          <span class="completed-text">
                            İşlem tamamlandı
                          </span>
                        }
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
  styleUrl: './event-registrations.scss' // Bu componentin tasarımını event-registrations.scss dosyasından almasını sağlar.
})
export class EventRegistrations implements OnInit { // Etkinlik kayıt yönetimi sayfasının TypeScript classıdır.
  private readonly route = inject(ActivatedRoute); // URL içindeki etkinlik ID değerini almak için ActivatedRoute'u enjekte eder.
  private readonly registrationService = inject(RegistrationService); // Kayıtları getirmek, onaylamak ve reddetmek için RegistrationService'i enjekte eder.

  private eventId: number | null = null; // Kayıtları görüntülenecek etkinliğin ID değerini tutar.

  readonly registrations = signal<RegistrationResponse[]>([]); // Backendden gelen etkinlik kayıtlarını tutar.
  readonly selectedStatus = signal<RegistrationApprovalStatus | ''>(''); // Kullanıcının seçtiği kayıt durumu filtresini tutar.
  readonly loading = signal(false); // Kayıtlar backendden yüklenirken işlemin devam edip etmediğini tutar.
  readonly processingId = signal<number | null>(null); // Onaylama veya reddetme işlemi yapılan kaydın IDsini tutar.
  readonly errorMessage = signal(''); // Kullanıcıya gösterilecek hata mesajını tutar.
  readonly successMessage = signal(''); // Kullanıcıya gösterilecek başarılı işlem mesajını tutar.


  ngOnInit(): void { // Sayfa ilk açıldığında otomatik olarak çalışır.
    const id = Number(this.route.snapshot.paramMap.get('id')); // URL içindeki etkinlik ID değerini alır ve number tipine çevirir.

    if (!Number.isInteger(id) || id <= 0) { // ID geçerli bir pozitif tam sayı değilse kontrol içerisine girer.
      this.errorMessage.set('Geçersiz etkinlik ID.'); // Kullanıcıya geçersiz etkinlik ID mesajını gösterir.
      return; // Backend isteğinin yapılmasını engeller.
    }

    this.eventId = id; // Geçerli etkinlik IDsini class değişkenine kaydeder.
    this.loadRegistrations(); // Etkinliğe yapılan kayıtları backendden getirir.
  }


  changeStatus(value: RegistrationApprovalStatus | ''): void { // Kullanıcı durum filtresini değiştirdiğinde çalışır.
    this.selectedStatus.set(value); // Select içerisinden gelen yeni değeri selectedStatus signalına aktarır.
    this.loadRegistrations(); // Yeni filtre değerine göre kayıtları backendden tekrar getirir.
  }


  loadRegistrations(clearSuccess = true): void { // Etkinliğin kayıtlarını seçilen durum filtresine göre backendden getirir.
    if (!this.eventId) { // Geçerli bir etkinlik IDsi bulunmuyorsa kontrol içerisine girer.
      return; // Backend isteğinin yapılmasını engeller.
    }

    this.loading.set(true); // Backend isteğinin başladığını belirtir.
    this.errorMessage.set(''); // Önceki hata mesajını temizler.

    if (clearSuccess) { // Metot normal şekilde çağrılmışsa kontrol içerisine girer.
      this.successMessage.set(''); // Daha önce gösterilen başarı mesajını temizler.
    }

    const selected = this.selectedStatus(); // Kullanıcının seçtiği durum filtresini değişkene alır.
    const status: RegistrationApprovalStatus | undefined = selected === '' ? undefined : selected; // Tümü seçildiyse backend'e filtre göndermez, diğer durumlarda seçilen değeri gönderir.

    this.registrationService.getForEvent(this.eventId, status).subscribe({ // Etkinlik IDsi ve varsa durum filtresiyle backendden kayıtları ister.
      next: registrations => { // Backend isteği başarılı olduğunda çalışır.
        this.registrations.set(registrations); // Backendden gelen kayıt listesini registrations signalına aktarır.
        this.loading.set(false); // Yükleme işleminin tamamlandığını belirtir.
      },
      error: (error: HttpErrorResponse) => { // Backend isteği hata verdiğinde çalışır.
        this.errorMessage.set(
          getApiErrorMessage(error, 'Etkinlik kayıtları alınamadı.') // Backend hatasını kullanıcıya gösterilecek anlaşılır mesaja dönüştürür.
        );
        this.loading.set(false); // Hata olsa bile yükleme işlemini sonlandırır.
      }
    });
  }


  approve(registrationId: number): void { // Verilen kayıt talebini onaylamak için kullanılır.
    if (this.processingId() !== null) { // Başka bir kayıt üzerinde işlem devam ediyorsa kontrol içerisine girer.
      return; // Aynı anda ikinci bir onay veya reddetme işlemi yapılmasını engeller.
    }

    this.processingId.set(registrationId); // İşlem yapılan kaydın IDsini processingId signalına kaydeder.
    this.errorMessage.set(''); // Önceki hata mesajını temizler.
    this.successMessage.set(''); // Önceki başarı mesajını temizler.

    this.registrationService.approve(registrationId).subscribe({ // RegistrationService üzerinden kayıt onaylama isteğini backend'e gönderir.
      next: () => { // Backend kayıt onaylama işlemini başarıyla tamamladığında çalışır.
        this.processingId.set(null); // İşlem yapılan kayıt ID bilgisini temizler.
        this.successMessage.set('Kayıt onaylandı.'); // Kullanıcıya başarılı onay mesajını gösterir.
        this.loadRegistrations(false); // Listeyi tekrar getirir ancak başarı mesajının silinmesini engeller.
      },
      error: (error: HttpErrorResponse) => { // Onaylama işlemi sırasında hata oluşursa çalışır.
        this.errorMessage.set(
          getApiErrorMessage(error, 'Kayıt onaylanamadı.') // Backend hatasını kullanıcıya anlaşılır mesaja dönüştürür.
        );
        this.processingId.set(null); // Hata sonrasında işlem yapılan kayıt ID bilgisini temizler.
      }
    });
  }


  reject(registrationId: number): void { // Verilen kayıt talebini reddetmek için kullanılır.
    if (this.processingId() !== null) { // Başka bir kayıt üzerinde işlem devam ediyorsa kontrol içerisine girer.
      return; // Aynı anda ikinci bir işlem yapılmasını engeller.
    }

    this.processingId.set(registrationId); // İşlem yapılan kaydın IDsini processingId signalına kaydeder.
    this.errorMessage.set(''); // Önceki hata mesajını temizler.
    this.successMessage.set(''); // Önceki başarı mesajını temizler.

    this.registrationService.reject(registrationId).subscribe({ // RegistrationService üzerinden kayıt reddetme isteğini backend'e gönderir.
      next: () => { // Backend kayıt reddetme işlemini başarıyla tamamladığında çalışır.
        this.processingId.set(null); // İşlem yapılan kayıt ID bilgisini temizler.
        this.successMessage.set('Kayıt reddedildi.'); // Kullanıcıya başarılı reddetme mesajı gösterir.
        this.loadRegistrations(false); // Listeyi tekrar getirir ancak başarı mesajının silinmesini engeller.
      },
      error: (error: HttpErrorResponse) => { // Reddetme işlemi sırasında hata oluşursa çalışır.
        this.errorMessage.set(
          getApiErrorMessage(error, 'Kayıt reddedilemedi.') // Backend hatasını kullanıcıya gösterilecek anlaşılır mesaja dönüştürür.
        );
        this.processingId.set(null); // Hata sonrasında işlem yapılan kayıt ID bilgisini temizler.
      }
    });
  }
}