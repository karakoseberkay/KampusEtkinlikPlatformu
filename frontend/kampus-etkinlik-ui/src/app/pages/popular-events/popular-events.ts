import { Component, inject, OnInit, signal } from '@angular/core'; // Component oluşturmak, servis inject etmek, OnInit kullanmak ve signal tanımlamak için gerekli Angular araçlarını içe aktarır.
import { HttpErrorResponse } from '@angular/common/http'; // Backendden gelen HTTP hatalarını yakalamak için kullanılır.
import { RouterLink } from '@angular/router'; // Etkinlik detay sayfasına routerLink ile yönlendirme yapabilmemizi sağlar.
import { EventService } from '../../core/services/event.service'; // Popüler etkinlikleri backendden almak için kullanılan servistir.
import { PopularEventResponse } from '../../core/models/api.models'; // Backendden gelen popüler etkinlik nesnesinin TypeScript tipidir.
import { getApiErrorMessage } from '../../core/utils/api-error'; // Backend hatalarını kullanıcıya gösterilecek anlaşılır mesaja dönüştürür.

@Component({ // Bu classın Angular componenti olduğunu belirtir.
  selector: 'app-popular-events', // Componentin selector adını belirler.
  standalone: true, // Componentin NgModule kullanmadan bağımsız çalışmasını sağlar.
  imports: [RouterLink], // Template içerisinde routerLink kullanabilmemizi sağlar.
  template: `
    <!-- Popüler Etkinlikler sayfasının tamamını kapsar -->
    <section class="popular-events-page">
      <!-- Sayfanın üst başlık alanıdır -->
      <div class="page-header">
        <div>
          <h1>Popular Events</h1> <!-- Sayfanın ana başlığını gösterir. -->
          <p>View the most popular events on campus.</p> <!-- Sayfanın kısa açıklamasını gösterir. -->
        </div>

        <!-- Popüler etkinlikleri backendden tekrar çekmek için kullanılır -->
        <button class="refresh-button" type="button" [disabled]="loading()" (click)="loadEvents()">
          {{ loading() ? 'Loading...' : 'Refresh' }}
        </button>
      </div>

      <!-- Backend isteği devam ederken ve henüz etkinlik yoksa gösterilir -->
      @if (loading() && events().length === 0) {
        <div class="page-message">
          Popular events are loading...
        </div>
      }

      <!-- Backend isteğinde hata oluşursa gösterilir -->
      @if (errorMessage()) {
        <div class="page-message error-message">
          {{ errorMessage() }}
        </div>
      }

      <!-- Yükleme tamamlandıysa ve herhangi bir popüler etkinlik bulunamadıysa gösterilir -->
      @if (!loading() && events().length === 0 && !errorMessage()) {
        <div class="page-message">
          No popular events to display.
        </div>
      }

      <!-- Backendden en az bir popüler etkinlik geldiyse tabloyu gösterir -->
      @if (events().length > 0) {
        <section class="events-section">
          <!-- Tablo bölümünün üst bilgisidir -->
          <div class="section-header">
            <h2>Event List</h2> <!-- Popüler etkinlik listesinin başlığını gösterir. -->
            <p>Showing {{ events().length }} most popular events.</p> <!-- Backendden gelen etkinlik sayısını gösterir. -->
          </div>

          <!-- Tabloyu beyaz kart içerisinde tutar -->
          <div class="table-card">
            <!-- Küçük ekranlarda tablonun yatay kaydırılabilmesini sağlar -->
            <div class="table-wrapper">
              <!-- Popüler etkinliklerin gösterildiği tablo -->
              <table class="events-table">
                <!-- Tablo kolon başlıklarını gösterir -->
                <thead>
                  <tr>
                    <th>#</th> <!-- Etkinliğin popülerlik listesindeki sırasını gösterir. -->
                    <th>Event Name</th> <!-- Etkinliğin başlığını gösterir. -->
                    <th>Club</th> <!-- Etkinliği oluşturan kulübü gösterir. -->
                    <th>Category</th> <!-- Etkinliğin kategorisini gösterir. -->
                    <th>Date</th> <!-- Etkinliğin başlangıç tarihini gösterir. -->
                    <th>Location</th> <!-- Etkinliğin yapılacağı konumu gösterir. -->
                    <th>Approved Registrations</th> <!-- Etkinliğe onaylanmış kayıt sayısını gösterir. -->
                    <th>Remaining Capacity</th> <!-- Etkinlikte kalan boş kontenjanı gösterir. -->
                    <th>Registration Rate</th> <!-- Etkinliğin kapasitesine göre kayıt oranını gösterir. -->
                    <th>Action</th> <!-- Etkinlik detayına gitmek için kullanılan alanı gösterir. -->
                  </tr>
                </thead>

                <!-- Backendden gelen popüler etkinlikleri tabloya basar -->
                <tbody>
                  @for (event of events(); track event.id; let index = $index) {<!--$index kaçıncı elemanda olduğunu verir-->
                    <tr>
                      <!-- Etkinliğin listedeki sırasını gösterir -->
                      <td class="ranking-cell">
                        {{ index + 1 }}
                      </td>

                      <!-- Etkinliğin başlığını gösterir -->
                      <td class="event-title">
                        {{ event.title }}
                      </td>

                      <!-- Etkinliği oluşturan kulübün adını gösterir -->
                      <td>
                        {{ event.clubName }}
                      </td>

                      <!-- Etkinliğin kategorisini turuncu etiket içerisinde gösterir -->
                      <td>
                        <span class="category-badge">
                          {{ event.category }}
                        </span>
                      </td>

                      <!-- Etkinliğin başlangıç tarihini gösterir -->
                      <td>
                        {{ event.startDate }}
                      </td>

                      <!-- Etkinliğin yapılacağı konumu gösterir -->
                      <td>
                        {{ event.location }}
                      </td>

                      <!-- Etkinliğin onaylanmış kayıt sayısını gösterir -->
                      <td>
                        {{ event.approvedRegistrationCount }}
                      </td>

                      <!-- Etkinlikte kalan kontenjanı gösterir -->
                      <td>
                        {{ event.remainingCapacity }}
                      </td>

                      <!-- Etkinliğin kayıt oranını yüzde olarak gösterir -->
                      <td>
                        <span class="rate-badge">
                          %{{ event.registrationRate }}
                        </span>
                      </td>

                      <!-- Kullanıcıyı ilgili etkinliğin detay sayfasına yönlendirir -->
                      <td>
                        <a class="detail-link" [routerLink]="['/events', event.id]">
                          Details
                        </a>
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
  styleUrl: './popular-events.scss' // Componentin tasarımını popular-events.scss dosyasından almasını sağlar.
})
export class PopularEvents implements OnInit { // Popüler Etkinlikler sayfasının TypeScript classıdır ve OnInit yaşam döngüsünü kullanır.
  private readonly eventService = inject(EventService); // Etkinlik servisindeki backend metodlarına erişebilmek için EventService'i enjekte eder.

  readonly events = signal<PopularEventResponse[]>([]); // Backendden gelen popüler etkinlik listesini tutar.
  readonly loading = signal(false); // Popüler etkinlikler yüklenirken işlemin devam edip etmediğini tutar.
  readonly errorMessage = signal(''); // Kullanıcıya gösterilecek hata mesajını tutar.

  ngOnInit(): void { // Sayfa ilk açıldığında Angular tarafından otomatik olarak çalıştırılır.
    this.loadEvents(); // Sayfa açılır açılmaz popüler etkinlikleri backendden getirir.
  }

  loadEvents(): void { // Backendden en popüler 10 etkinliği getiren metottur.
    this.loading.set(true); // Backend isteğinin başladığını belirtir.
    this.errorMessage.set(''); // Önceki hata mesajını temizler.

    this.eventService.getPopular(10).subscribe({ // EventService içindeki getPopular metodunu çağırır ve backendden en popüler 10 etkinliği ister.
      next: events => { // Backend isteği başarılı olduğunda çalışır.
        this.events.set(events); // Backendden gelen etkinlikleri events signalına aktarır.
        this.loading.set(false); // Yükleme işleminin tamamlandığını belirtir.
      },
      error: (error: HttpErrorResponse) => { // Backend isteği hata verdiğinde çalışır.
        this.events.set([]); // Hata durumunda eski etkinlik listesini temizler.
        this.errorMessage.set(
          getApiErrorMessage(error, 'Could not load popular events.') // Backend hatasını kullanıcıya gösterilecek anlaşılır mesaja dönüştürür.
        );
        this.loading.set(false); // Hata olsa bile yükleme işlemini sonlandırır.
      }
    });
  }
}