import {
  Component,
  inject,
  OnInit,
  signal
} from '@angular/core';

import {
  HttpErrorResponse
} from '@angular/common/http';

import {
  RouterLink
} from '@angular/router';

import {
  ClubService
} from '../../core/services/club.service';

import {
  AuthService
} from '../../core/services/auth.service';

import {
  ClubResponse
} from '../../core/models/api.models';

import {
  getApiErrorMessage
} from '../../core/utils/api-error';


@Component({
  selector: 'app-clubs',
  standalone: true,

  imports: [
    RouterLink
  ],

  template: `
    <h1>Kulüpler</h1>


    @if (auth.hasRole('ClubManager')) {

      <p>
        <a routerLink="/club-manage">
          Yeni Kulüp Oluştur
        </a>
      </p>

    }


    <button
      type="button"
      (click)="loadClubs()"
    >
      Yenile
    </button>


    @if (loading()) {
      <p>Yükleniyor...</p>
    }


    @if (errorMessage()) {
      <p>{{ errorMessage() }}</p>
    }


    @if (
      !loading()
      && clubs().length === 0
      && !errorMessage()
    ) {

      <p>Kulüp bulunamadı.</p>

    }


    @if (clubs().length > 0) {

      <table>

        <thead>

          <tr>
            <th>ID</th>
            <th>Kulüp Adı</th>
            <th>Açıklama</th>
            <th>Logo URL</th>
            <th>Yönetici</th>
            <th>Etkinlik Sayısı</th>
            <th>İşlem</th>
          </tr>

        </thead>


        <tbody>

          @for (
            club of clubs();
            track club.id
          ) {

            <tr>

              <td>
                {{ club.id }}
              </td>

              <td>
                {{ club.name }}
              </td>

              <td>
                {{ club.description }}
              </td>

              <td>
                {{ club.logoUrl }}
              </td>

              <td>
                {{ club.managerFullName }}
              </td>

              <td>
                {{ club.eventCount }}
              </td>

              <td>

                <a
                  [routerLink]="[
                    '/clubs',
                    club.id
                  ]"
                >
                  Detay
                </a>


                @if (ownsClub(club)) {

                  |

                  <a
                    [routerLink]="[
                      '/club-manage',
                      club.id
                    ]"
                  >
                    Güncelle
                  </a>

                  |

                  <a
                    [routerLink]="[
                      '/clubs',
                      club.id,
                      'stats'
                    ]"
                  >
                    İstatistik
                  </a>

                }

              </td>

            </tr>

          }

        </tbody>

      </table>

    }
  `
})
export class Clubs
  implements OnInit {

  readonly auth =
    inject(AuthService);

  private readonly clubService =
    inject(ClubService);


  readonly clubs =
    signal<ClubResponse[]>([]);

  readonly loading =
    signal(false);

  readonly errorMessage =
    signal('');


  ngOnInit(): void {

    this.loadClubs();

  }


  ownsClub(
    club: ClubResponse
  ): boolean {

    const user =
      this.auth.currentUser();


    return !!user
      && this.auth.hasRole(
        'ClubManager'
      )
      && club.managerUserId
        === user.userId;
  }


  loadClubs(): void {

    this.loading.set(true);

    this.errorMessage.set('');


    this.clubService
      .getAll()
      .subscribe({

        next: clubs => {

          this.clubs.set(clubs);

          this.loading.set(false);
        },


        error: (
          error: HttpErrorResponse
        ) => {

          this.errorMessage.set(
            getApiErrorMessage(
              error,
              'Kulüpler alınamadı.'
            )
          );

          this.loading.set(false);
        }

      });
  }
}