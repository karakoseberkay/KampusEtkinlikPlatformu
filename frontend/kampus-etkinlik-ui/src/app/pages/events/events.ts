import {
  Component,
  inject,
  OnInit
} from '@angular/core';

import {
  HttpErrorResponse
} from '@angular/common/http';

import {
  RouterLink
} from '@angular/router';

import {
  EventService
} from '../../core/services/event.service';

import {
  EventResponse
} from '../../core/models/api.models';

import {
  getApiErrorMessage
} from '../../core/utils/api-error';


@Component({
  selector: 'app-events',
  standalone: true,

  imports: [
    RouterLink
  ],

  template: `
    <h1>Etkinlikler</h1>

    <button
      type="button"
      (click)="loadEvents()"
    >
      Yenile
    </button>

    @if (loading) {
      <p>Yükleniyor...</p>
    }

    @if (errorMessage) {
      <p>{{ errorMessage }}</p>
    }

    @if (!loading && events.length === 0) {
      <p>Etkinlik bulunamadı.</p>
    }

    @if (events.length > 0) {

      <table>

        <thead>
          <tr>
            <th>ID</th>
            <th>Başlık</th>
            <th>Kulüp</th>
            <th>Tarih</th>
            <th>Konum</th>
            <th>Kapasite</th>
            <th>Kategori</th>
            <th>Katılım Tipi</th>
            <th>Durum</th>
            <th>İşlem</th>
          </tr>
        </thead>

        <tbody>

          @for (event of events; track event.id) {

            <tr>
              <td>{{ event.id }}</td>
              <td>{{ event.title }}</td>
              <td>{{ event.clubName }}</td>
              <td>{{ event.startDate }}</td>
              <td>{{ event.location }}</td>
              <td>{{ event.capacity }}</td>
              <td>{{ event.category }}</td>
              <td>{{ event.visibility }}</td>
              <td>{{ event.status }}</td>

              <td>
                <a
                  [routerLink]="[
                    '/events',
                    event.id
                  ]"
                >
                  Detay
                </a>
              </td>
            </tr>

          }

        </tbody>

      </table>

    }
  `
})
export class Events implements OnInit {

  private readonly eventService =
    inject(EventService);

  events: EventResponse[] = [];

  loading = false;

  errorMessage = '';


  ngOnInit(): void {
    this.loadEvents();
  }


  loadEvents(): void {

    this.loading = true;
    this.errorMessage = '';

    this.eventService
      .getAll()
      .subscribe({

        next: events => {
          this.events = events;
          this.loading = false;
        },

        error: (error: HttpErrorResponse) => {

          this.errorMessage =
            getApiErrorMessage(
              error,
              'Etkinlikler alınamadı.'
            );

          this.loading = false;
        }

      });
  }
}