import {
  Component,
  computed,
  inject,
  OnInit,
  signal
} from '@angular/core';

import {
  HttpErrorResponse
} from '@angular/common/http';

import {
  RegistrationService
} from '../../core/services/registration.service';

import {
  RegistrationResponse
} from '../../core/models/api.models';

import {
  getApiErrorMessage
} from '../../core/utils/api-error';


@Component({
  selector: 'app-my-registrations',
  standalone: true,

  template: `
    <h1>Kayıtlarım</h1>


    <button
      type="button"
      (click)="loadRegistrations()"
    >
      Yenile
    </button>


    @if (loading()) {
      <p>Yükleniyor...</p>
    }


    @if (errorMessage()) {
      <p>{{ errorMessage() }}</p>
    }


    @if (!loading() && !errorMessage()) {

      <h2>Katılım Bilgileri</h2>

      <p>
        <strong>Toplam Kayıt:</strong>
        {{ totalRegistrationCount() }}
      </p>

      <p>
        <strong>Toplam Katılım:</strong>
        {{ approvedCount() }}
      </p>

      <p>
        <strong>Bekleyen:</strong>
        {{ pendingCount() }}
      </p>

      <p>
        <strong>Reddedilen:</strong>
        {{ rejectedCount() }}
      </p>

    }


    @if (
      !loading()
      && registrations().length === 0
      && !errorMessage()
    ) {

      <p>
        Henüz etkinlik kaydınız bulunmuyor.
      </p>

    }


    @if (registrations().length > 0) {

      <h2>Kayıt Geçmişi</h2>


      <table>

        <thead>

          <tr>
            <th>Kayıt ID</th>
            <th>Etkinlik ID</th>
            <th>Etkinlik</th>
            <th>Kulüp</th>
            <th>Kayıt Tarihi</th>
            <th>Durum</th>
          </tr>

        </thead>


        <tbody>

          @for (
            registration of registrations();
            track registration.id
          ) {

            <tr>

              <td>
                {{ registration.id }}
              </td>

              <td>
                {{ registration.eventId }}
              </td>

              <td>
                {{ registration.eventTitle }}
              </td>

              <td>
                {{ registration.clubName }}
              </td>

              <td>
                {{ registration.registeredAt }}
              </td>

              <td>
                {{ registration.approvalStatus }}
              </td>

            </tr>

          }

        </tbody>

      </table>

    }
  `
})
export class MyRegistrations
  implements OnInit {

  private readonly registrationService =
    inject(RegistrationService);


  readonly registrations =
    signal<RegistrationResponse[]>([]);


  readonly loading =
    signal(false);


  readonly errorMessage =
    signal('');


  readonly totalRegistrationCount =
    computed(
      () =>
        this.registrations().length
    );


  readonly approvedCount =
    computed(
      () =>
        this.registrations()
          .filter(
            registration =>
              registration.approvalStatus
                === 'Approved'
          )
          .length
    );


  readonly pendingCount =
    computed(
      () =>
        this.registrations()
          .filter(
            registration =>
              registration.approvalStatus
                === 'Pending'
          )
          .length
    );


  readonly rejectedCount =
    computed(
      () =>
        this.registrations()
          .filter(
            registration =>
              registration.approvalStatus
                === 'Rejected'
          )
          .length
    );


  ngOnInit(): void {

    this.loadRegistrations();
  }


  loadRegistrations(): void {

    this.loading.set(true);

    this.errorMessage.set('');


    this.registrationService
      .getMine()
      .subscribe({

        next: registrations => {

          this.registrations.set(
            registrations
          );

          this.loading.set(false);
        },


        error: (
          error: HttpErrorResponse
        ) => {

          this.errorMessage.set(
            getApiErrorMessage(
              error,
              'Kayıtlar alınamadı.'
            )
          );

          this.loading.set(false);
        }

      });
  }
}