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
  AuthService
} from '../../core/services/auth.service';

import {
  ClubService
} from '../../core/services/club.service';

import {
  EventService
} from '../../core/services/event.service';

import {
  ClubResponse,
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


    @if (auth.hasRole('ClubManager')) {

      <p>
        <a routerLink="/event-manage">
          Yeni Etkinlik Oluştur
        </a>
      </p>

    }


    <h2>Arama ve Filtreleme</h2>


    <div>

      <label for="search">
        Etkinlik Ara
      </label>

      <input
        id="search"
        type="text"
        placeholder="Etkinlik adı..."
        [value]="searchText()"
        (input)="searchText.set(
          $any($event.target).value
        )"
      >

    </div>


    <div>

      <label for="category">
        Kategori
      </label>

      <input
        id="category"
        type="text"
        placeholder="Kategori..."
        [value]="category()"
        (input)="category.set(
          $any($event.target).value
        )"
      >

    </div>


    <div>

      <label for="club">
        Kulüp
      </label>

      <select
        id="club"
        [value]="selectedClubId()"
        (change)="selectedClubId.set(
          $any($event.target).value
        )"
      >

        <option value="">
          Tüm Kulüpler
        </option>


        @for (
          club of clubs();
          track club.id
        ) {

          <option [value]="club.id">
            {{ club.name }}
          </option>

        }

      </select>

    </div>


    <div>

      <label for="dateFrom">
        Başlangıç Tarihi
      </label>

      <input
        id="dateFrom"
        type="date"
        [value]="dateFrom()"
        (change)="dateFrom.set(
          $any($event.target).value
        )"
      >

    </div>


    <div>

      <label for="dateTo">
        Bitiş Tarihi
      </label>

      <input
        id="dateTo"
        type="date"
        [value]="dateTo()"
        (change)="dateTo.set(
          $any($event.target).value
        )"
      >

    </div>


    <div>

      <label>

        <input
          type="checkbox"
          [checked]="upcomingOnly()"
          (change)="upcomingOnly.set(
            $any($event.target).checked
          )"
        >

        Sadece yaklaşan aktif etkinlikler

      </label>

    </div>


    <button
      type="button"
      (click)="applyFilters()"
    >
      Filtrele
    </button>


    <button
      type="button"
      (click)="clearFilters()"
    >
      Filtreleri Temizle
    </button>


    <button
      type="button"
      (click)="loadEvents()"
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
      && events().length === 0
      && !errorMessage()
    ) {

      <p>
        Arama kriterlerine uygun etkinlik bulunamadı.
      </p>

    }


    @if (events().length > 0) {

      <p>
        Toplam etkinlik:
        {{ totalCount() }}
      </p>


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

          @for (
            event of events();
            track event.id
          ) {

            <tr>

              <td>
                {{ event.id }}
              </td>

              <td>
                {{ event.title }}
              </td>

              <td>
                {{ event.clubName }}
              </td>

              <td>
                {{ event.startDate }}
              </td>

              <td>
                {{ event.location }}
              </td>

              <td>
                {{ event.capacity }}
              </td>

              <td>
                {{ event.category }}
              </td>

              <td>
                {{ event.visibility }}
              </td>

              <td>
                {{ event.status }}
              </td>

              <td>

                <a
                  [routerLink]="[
                    '/events',
                    event.id
                  ]"
                >
                  Detay
                </a>


                @if (ownsEvent(event)) {

                  |

                  <a
                    [routerLink]="[
                      '/event-manage',
                      event.id
                    ]"
                  >
                    Güncelle
                  </a>

                  |

                  <a
                    [routerLink]="[
                      '/events',
                      event.id,
                      'registrations'
                    ]"
                  >
                    Kayıtlar
                  </a>

                }

              </td>

            </tr>

          }

        </tbody>

      </table>


      <h2>Sayfalama</h2>


      <p>
        Sayfa:
        {{ page() }}
        /
        {{ totalPages() }}
      </p>


      <button
        type="button"
        [disabled]="page() <= 1 || loading()"
        (click)="previousPage()"
      >
        Önceki
      </button>


      <button
        type="button"
        [disabled]="
          page() >= totalPages()
          || loading()
        "
        (click)="nextPage()"
      >
        Sonraki
      </button>

    }
  `
})
export class Events
  implements OnInit {

  readonly auth =
    inject(AuthService);


  private readonly clubService =
    inject(ClubService);


  private readonly eventService =
    inject(EventService);


  readonly events =
    signal<EventResponse[]>([]);


  readonly clubs =
    signal<ClubResponse[]>([]);


  readonly searchText =
    signal('');


  readonly category =
    signal('');


  readonly selectedClubId =
    signal('');


  readonly dateFrom =
    signal('');


  readonly dateTo =
    signal('');


  readonly upcomingOnly =
    signal(false);


  readonly page =
    signal(1);


  readonly pageSize =
    signal(10);


  readonly totalCount =
    signal(0);


  readonly totalPages =
    signal(0);


  readonly loading =
    signal(false);


  readonly errorMessage =
    signal('');


  ngOnInit(): void {

    if (
      this.auth.hasRole(
        'Student'
      )
    ) {

      this.upcomingOnly.set(true);

    }


    this.loadClubs();

    this.loadEvents();
  }


  ownsEvent(
    event: EventResponse
  ): boolean {

    const user =
      this.auth.currentUser();


    if (
      !user
      ||
      !this.auth.hasRole(
        'ClubManager'
      )
    ) {

      return false;
    }


    return this.clubs().some(
      club =>
        club.id === event.clubId
        &&
        club.managerUserId
          === user.userId
    );
  }


  loadClubs(): void {

    this.clubService
      .getAll()
      .subscribe({

        next: clubs => {

          this.clubs.set(
            clubs
          );

        },


        error: () => {

          this.clubs.set([]);

        }

      });
  }


  loadEvents(): void {

    this.loading.set(true);

    this.errorMessage.set('');


    const clubId =
      this.selectedClubId()
        ? Number(
            this.selectedClubId()
          )
        : undefined;


    this.eventService
      .getPaged({

        search:
          this.searchText()
            .trim()
            || undefined,

        category:
          this.category()
            .trim()
            || undefined,

        clubId,

        dateFrom:
          this.getDateFrom(),

        dateTo:
          this.getDateTo(),

        upcomingOnly:
          this.upcomingOnly(),

        page:
          this.page(),

        pageSize:
          this.pageSize()

      })
      .subscribe({

        next: result => {

          this.events.set(
            result.items
          );

          this.page.set(
            result.page
          );

          this.totalCount.set(
            result.totalCount
          );

          this.totalPages.set(
            result.totalPages
          );

          this.loading.set(false);
        },


        error: (
          error: HttpErrorResponse
        ) => {

          this.events.set([]);

          this.totalCount.set(0);

          this.totalPages.set(0);


          this.errorMessage.set(
            getApiErrorMessage(
              error,
              'Etkinlikler alınamadı.'
            )
          );


          this.loading.set(false);
        }

      });
  }


  applyFilters(): void {

    this.page.set(1);

    this.loadEvents();
  }


  clearFilters(): void {

    this.searchText.set('');

    this.category.set('');

    this.selectedClubId.set('');

    this.dateFrom.set('');

    this.dateTo.set('');


    this.upcomingOnly.set(
      this.auth.hasRole(
        'Student'
      )
    );


    this.page.set(1);

    this.loadEvents();
  }


  previousPage(): void {

    if (
      this.page() <= 1
      ||
      this.loading()
    ) {

      return;
    }


    this.page.update(
      page =>
        page - 1
    );


    this.loadEvents();
  }


  nextPage(): void {

    if (
      this.page()
        >= this.totalPages()
      ||
      this.loading()
    ) {

      return;
    }


    this.page.update(
      page =>
        page + 1
    );


    this.loadEvents();
  }


  private getDateFrom():
    string | undefined {

    const value =
      this.dateFrom();


    if (!value) {

      return undefined;

    }


    return new Date(
      `${value}T00:00:00`
    ).toISOString();
  }


  private getDateTo():
    string | undefined {

    const value =
      this.dateTo();


    if (!value) {

      return undefined;

    }


    return new Date(
      `${value}T23:59:59.999`
    ).toISOString();
  }
}