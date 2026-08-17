import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { EventService } from '../../core/services/event.service';
import { PopularEventResponse } from '../../core/models/api.models';
import { getApiErrorMessage } from '../../core/utils/api-error';

@Component({
  selector: 'app-popular-events',
  standalone: true,
  template: `
    <h1>Popüler Etkinlikler</h1>

    @if (loading()) {
      <p>Yükleniyor...</p>
    }

    @if (errorMessage()) {
      <p>{{ errorMessage() }}</p>
    }

    @if (!loading() && events().length === 0 && !errorMessage()) {
      <p>Gösterilecek popüler etkinlik bulunamadı.</p>
    }

    @if (events().length > 0) {
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Etkinlik</th>
            <th>Kulüp</th>
            <th>Tarih</th>
            <th>Konum</th>
            <th>Kategori</th>
            <th>Katılım Tipi</th>
            <th>Kapasite</th>
            <th>Onaylı Kayıt</th>
            <th>Kalan Kontenjan</th>
            <th>Kayıt Oranı</th>
          </tr>
        </thead>

        <tbody>
          @for (event of events(); track event.id) { <!-- popüler etkinlikleri tabloya basar -->
            <tr>
              <td>{{ event.id }}</td>
              <td>{{ event.title }}</td>
              <td>{{ event.clubName }}</td>
              <td>{{ event.startDate }}</td>
              <td>{{ event.location }}</td>
              <td>{{ event.category }}</td>
              <td>{{ event.visibility }}</td>
              <td>{{ event.capacity }}</td>
              <td>{{ event.approvedRegistrationCount }}</td>
              <td>{{ event.remainingCapacity }}</td>
              <td>{{ event.registrationRate }}%</td>
            </tr>
          }
        </tbody>
      </table>
    }
  `
})
export class PopularEvents implements OnInit {
  private readonly eventService = inject(EventService); // etkinlik servisindeki metodlara erişmemizi sağlar

  readonly events = signal<PopularEventResponse[]>([]); // backendden gelen popüler etkinlikleri tutar
  readonly loading = signal(false); // veriler yüklenirken işlemin devam edip etmediğini tutar
  readonly errorMessage = signal(''); // kullanıcıya gösterilecek hata mesajını tutar

  ngOnInit(): void { // sayfa açıldığında popüler etkinlikleri getirir
    this.loadEvents();
  }

  loadEvents(): void { // en popüler 10 etkinliği backendden getirir
    this.loading.set(true);
    this.errorMessage.set('');

    this.eventService.getPopular(10).subscribe({
      next: events => {
        this.events.set(events);
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(
          getApiErrorMessage(error, 'Popüler etkinlikler alınamadı.')
        );
        this.loading.set(false);
      }
    });
  }
}