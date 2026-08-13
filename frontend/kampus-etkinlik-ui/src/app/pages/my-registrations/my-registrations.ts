import {
  Component,
  inject,
  OnInit
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

    @if (loading) {
      <p>Yükleniyor...</p>
    }

    @if (errorMessage) {
      <p>{{ errorMessage }}</p>
    }

    @if (!loading && registrations.length === 0) {
      <p>Henüz etkinlik kaydınız bulunmuyor.</p>
    }

    @if (registrations.length > 0) {

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
            registration of registrations;
            track registration.id
          ) {

            <tr>
              <td>{{ registration.id }}</td>

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


  registrations: RegistrationResponse[] = [];

  loading = false;

  errorMessage = '';


  ngOnInit(): void {
    this.loadRegistrations();
  }


  loadRegistrations(): void {

    this.loading = true;

    this.errorMessage = '';

    this.registrationService
      .getMine()
      .subscribe({

        next: registrations => {

          this.registrations =
            registrations;

          this.loading = false;
        },

        error: (
          error: HttpErrorResponse
        ) => {

          this.errorMessage =
            getApiErrorMessage(
              error,
              'Kayıtlar alınamadı.'
            );

          this.loading = false;
        }

      });
  }
}