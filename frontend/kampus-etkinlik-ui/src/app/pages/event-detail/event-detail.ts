import {
  Component,
  inject,
  OnInit
} from '@angular/core';

import {
  HttpErrorResponse
} from '@angular/common/http';

import {
  ActivatedRoute
} from '@angular/router';

import {
  AuthService
} from '../../core/services/auth.service';

import {
  EventService
} from '../../core/services/event.service';

import {
  RegistrationService
} from '../../core/services/registration.service';

import {
  EventResponse
} from '../../core/models/api.models';

import {
  getApiErrorMessage
} from '../../core/utils/api-error';


@Component({
  selector: 'app-event-detail',
  standalone: true,

  template: `
    <h1>Etkinlik Detayı</h1>

    @if (loading) {
      <p>Yükleniyor...</p>
    }

    @if (errorMessage) {
      <p>{{ errorMessage }}</p>
    }

    @if (event) {

      <p>
        <strong>ID:</strong>
        {{ event.id }}
      </p>

      <p>
        <strong>Başlık:</strong>
        {{ event.title }}
      </p>

      <p>
        <strong>Açıklama:</strong>
        {{ event.description }}
      </p>

      <p>
        <strong>Kulüp:</strong>
        {{ event.clubName }}
      </p>

      <p>
        <strong>Kulüp ID:</strong>
        {{ event.clubId }}
      </p>

      <p>
        <strong>Tarih:</strong>
        {{ event.startDate }}
      </p>

      <p>
        <strong>Konum:</strong>
        {{ event.location }}
      </p>

      <p>
        <strong>Kapasite:</strong>
        {{ event.capacity }}
      </p>

      <p>
        <strong>Kategori:</strong>
        {{ event.category }}
      </p>

      <p>
        <strong>Katılım Tipi:</strong>
        {{ event.visibility }}
      </p>

      <p>
        <strong>Durum:</strong>
        {{ event.status }}
      </p>

      <p>
        <strong>Oluşturulma Tarihi:</strong>
        {{ event.createdAt }}
      </p>


      @if (auth.hasRole('Student')) {

        <button
          type="button"
          [disabled]="registering"
          (click)="register()"
        >
          Kayıt Ol
        </button>

      }


      @if (successMessage) {
        <p>{{ successMessage }}</p>
      }

    }
  `
})
export class EventDetail
  implements OnInit {

  readonly auth =
    inject(AuthService);

  private readonly route =
    inject(ActivatedRoute);

  private readonly eventService =
    inject(EventService);

  private readonly registrationService =
    inject(RegistrationService);


  event: EventResponse | null = null;

  loading = false;

  registering = false;

  errorMessage = '';

  successMessage = '';


  ngOnInit(): void {

    const id =
      Number(
        this.route.snapshot.paramMap.get('id')
      );

    if (!Number.isInteger(id) || id <= 0) {
      this.errorMessage =
        'Geçersiz etkinlik ID.';
      return;
    }

    this.loadEvent(id);
  }


  loadEvent(
    id: number
  ): void {

    this.loading = true;

    this.errorMessage = '';

    this.eventService
      .getById(id)
      .subscribe({

        next: event => {
          this.event = event;
          this.loading = false;
        },

        error: (
          error: HttpErrorResponse
        ) => {

          this.errorMessage =
            getApiErrorMessage(
              error,
              'Etkinlik alınamadı.'
            );

          this.loading = false;
        }

      });
  }


  register(): void {

    if (!this.event) {
      return;
    }

    this.registering = true;

    this.errorMessage = '';

    this.successMessage = '';

    this.registrationService
      .register(this.event.id)
      .subscribe({

        next: registration => {

          this.successMessage =
            `Kayıt oluşturuldu. Durum: ${registration.approvalStatus}`;

          this.registering = false;
        },

        error: (
          error: HttpErrorResponse
        ) => {

          this.errorMessage =
            getApiErrorMessage(
              error,
              'Etkinliğe kayıt olunamadı.'
            );

          this.registering = false;
        }

      });
  }
}