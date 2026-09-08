import { Component, inject, OnInit, signal } from '@angular/core'; // Component oluşturmak servis inject etmek OnInit ve signal kullanmak için
import { HttpErrorResponse } from '@angular/common/http'; // Backendden gelen HTTP hatalarını yakalamak için
import { RouterLink } from '@angular/router'; // Etkinlik detay sayfasına routerLink ile yönlendirme yapmak için
import { EventService } from '../../core/services/event.service'; // Popüler etkinlikleri backendden almak için
import { PopularEventResponse } from '../../core/models/api.models'; // Backendden gelen popüler etkinlik modelini kullanmak için
import { getApiErrorMessage } from '../../core/utils/api-error'; // Backend hatalarını kullanıcıya gösterilecek anlaşılır mesaja dönüştürmek için
import { formatDateTime } from '../../core/utils/date-time'; // Backendden gelen tarihleri kullanıcıya daha okunabilir formatta göstermek için

@Component({ // Bu classın Angular componenti olduğunu belirtir
  selector: 'app-popular-events', // Componentin selector adını belirler
  standalone: true, // Componentin NgModule kullanmadan bağımsız çalışmasını sağlar
  imports: [RouterLink], // Template içerisinde routerLink kullanabilmemizi sağlar
  template: `
    <!-- Popüler Etkinlikler sayfasının tamamını kapsar -->
    <section class="popular-events-page">
      <div class="page-header">
        <div>
          <h1>Popular Events</h1>
          <p>View the most popular events on campus.</p>
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

      <!-- Popüler etkinlik bulunamazsa gösterilir -->
      @if (!loading() && events().length === 0 && !errorMessage()) {
        <div class="page-message">
          No popular events to display.
        </div>
      }

      <!-- Backendden en az bir popüler etkinlik geldiyse tabloyu gösterir -->
      @if (events().length > 0) {
        <section class="events-section">
          <div class="section-header">
            <h2>Event List</h2>
            <p>Showing {{ events().length }} most popular events.</p>
          </div>

          <div class="table-card">
            <div class="table-wrapper">
              <table class="events-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Event Name</th>
                    <th>Club</th>
                    <th>Category</th>
                    <th>Date</th>
                    <th>Location</th>
                    <th>Approved Registrations</th>
                    <th>Remaining Capacity</th>
                    <th>Registration Rate</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  @for (event of events(); track event.id; let index = $index) {
                    <tr>
                      <td class="ranking-cell">
                        {{ index + 1 }}
                      </td>

                      <td class="event-title">
                        {{ event.title }}
                      </td>

                      <td>
                        {{ event.clubName }}
                      </td>

                      <td>
                        <span class="category-badge">
                          {{ event.category }}
                        </span>
                      </td>

                      <td>
                        {{ formatDateTime(event.startDate) }}
                      </td>

                      <td>
                        {{ event.location }}
                      </td>

                      <td>
                        {{ event.approvedRegistrationCount }}
                      </td>

                      <td>
                        {{ event.remainingCapacity }}
                      </td>

                      <td>
                        <span class="rate-badge">
                          %{{ event.registrationRate }}
                        </span>
                      </td>

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
  styleUrl: './popular-events.scss' // Componentin tasarım dosyasını bağlar
})
export class PopularEvents implements OnInit {
  readonly formatDateTime = formatDateTime; // tarihleri template içinde okunabilir formatta göstermek için ortak fonksiyonu kullanır
  private readonly eventService = inject(EventService); // Backenddeki etkinlik işlemlerine erişmek için EventServicei DI ile alır

  readonly events = signal<PopularEventResponse[]>([]); // Backendden gelen popüler etkinlik listesini tutar
  readonly loading = signal(false); // Popüler etkinlikler yüklenirken işlemin devam edip etmediğini tutar
  readonly errorMessage = signal(''); // Kullanıcıya gösterilecek hata mesajını tutar

  ngOnInit(): void {
    this.loadEvents(); // Sayfa açıldığında popüler etkinlikleri getirir
  }

  loadEvents(): void { // Backendden en popüler 10 etkinliği getirir
    this.loading.set(true);
    this.errorMessage.set('');

    this.eventService.getPopular(10).subscribe({
      next: events => {
        this.events.set(events);
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.events.set([]);
        this.errorMessage.set(getApiErrorMessage(error, 'Could not load popular events.'));
        this.loading.set(false);
      }
    });
  }
}