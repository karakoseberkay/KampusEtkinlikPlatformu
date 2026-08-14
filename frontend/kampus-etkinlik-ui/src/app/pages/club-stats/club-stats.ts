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
  ActivatedRoute
} from '@angular/router';

import {
  ClubService
} from '../../core/services/club.service';

import {
  ClubStatsResponse
} from '../../core/models/api.models';

import {
  getApiErrorMessage
} from '../../core/utils/api-error';


@Component({
  selector: 'app-club-stats',
  standalone: true,

  template: `
    <h1>Kulüp İstatistikleri</h1>


    <button
      type="button"
      (click)="loadStats()"
    >
      Yenile
    </button>


    @if (loading()) {
      <p>Yükleniyor...</p>
    }


    @if (errorMessage()) {
      <p>{{ errorMessage() }}</p>
    }


    @if (stats(); as statsItem) {

      <h2>Genel Bilgiler</h2>


      <p>
        <strong>Kulüp ID:</strong>
        {{ statsItem.clubId }}
      </p>

      <p>
        <strong>Kulüp Adı:</strong>
        {{ statsItem.clubName }}
      </p>

      <p>
        <strong>Toplam Etkinlik:</strong>
        {{ statsItem.totalEventCount }}
      </p>

      <p>
        <strong>Aktif Etkinlik:</strong>
        {{ statsItem.activeEventCount }}
      </p>

      <p>
        <strong>İptal Edilmiş Etkinlik:</strong>
        {{ statsItem.cancelledEventCount }}
      </p>

      <p>
        <strong>Toplam Onaylı Kayıt:</strong>
        {{ statsItem.totalApprovedRegistrationCount }}
      </p>

      <p>
        <strong>Toplam Bekleyen Kayıt:</strong>
        {{ statsItem.totalPendingRegistrationCount }}
      </p>

      <p>
        <strong>Toplam Reddedilen Kayıt:</strong>
        {{ statsItem.totalRejectedRegistrationCount }}
      </p>

      <p>
        <strong>Genel Kayıt Oranı:</strong>
        {{ statsItem.overallRegistrationRate }}%
      </p>


      <h2>Etkinlik Kayıt Oranı Grafiği</h2>


      @if (statsItem.events.length === 0) {

        <p>
          Grafik için etkinlik bulunmuyor.
        </p>

      } @else {

        <svg
          width="750"
          [attr.height]="getChartHeight(
            statsItem.events.length
          )"
        >

          @for (
            event of statsItem.events;
            track event.eventId;
            let index = $index
          ) {

            <text
              x="0"
              [attr.y]="getTextY(index)"
            >
              {{ event.title }}
            </text>


            <rect
              x="200"
              [attr.y]="getBarY(index)"
              [attr.width]="getBarWidth(
                event.registrationRate
              )"
              height="20"
            ></rect>


            <text
              [attr.x]="
                getBarTextX(
                  event.registrationRate
                )
              "
              [attr.y]="getTextY(index)"
            >
              {{ event.registrationRate }}%
            </text>

          }

        </svg>

      }


      <h2>Etkinlik İstatistikleri</h2>


      @if (statsItem.events.length === 0) {

        <p>
          Bu kulübe ait etkinlik bulunmuyor.
        </p>

      } @else {

        <table>

          <thead>

            <tr>
              <th>Event ID</th>
              <th>Başlık</th>
              <th>Tarih</th>
              <th>Durum</th>
              <th>Kapasite</th>
              <th>Onaylı</th>
              <th>Bekleyen</th>
              <th>Reddedilen</th>
              <th>Kayıt Oranı</th>
            </tr>

          </thead>


          <tbody>

            @for (
              event of statsItem.events;
              track event.eventId
            ) {

              <tr>

                <td>
                  {{ event.eventId }}
                </td>

                <td>
                  {{ event.title }}
                </td>

                <td>
                  {{ event.startDate }}
                </td>

                <td>
                  {{ event.status }}
                </td>

                <td>
                  {{ event.capacity }}
                </td>

                <td>
                  {{ event.approvedRegistrationCount }}
                </td>

                <td>
                  {{ event.pendingRegistrationCount }}
                </td>

                <td>
                  {{ event.rejectedRegistrationCount }}
                </td>

                <td>
                  {{ event.registrationRate }}%
                </td>

              </tr>

            }

          </tbody>

        </table>

      }

    }
  `
})
export class ClubStats
  implements OnInit {

  private readonly route =
    inject(ActivatedRoute);

  private readonly clubService =
    inject(ClubService);


  private clubId: number | null = null;


  readonly stats =
    signal<ClubStatsResponse | null>(null);


  readonly loading =
    signal(false);


  readonly errorMessage =
    signal('');


  ngOnInit(): void {

    const id =
      Number(
        this.route.snapshot.paramMap.get('id')
      );


    if (
      !Number.isInteger(id)
      ||
      id <= 0
    ) {

      this.errorMessage.set(
        'Geçersiz kulüp ID.'
      );

      return;
    }


    this.clubId = id;

    this.loadStats();
  }


  loadStats(): void {

    if (!this.clubId) {
      return;
    }


    this.loading.set(true);

    this.errorMessage.set('');


    this.clubService
      .getStats(this.clubId)
      .subscribe({

        next: stats => {

          this.stats.set(stats);

          this.loading.set(false);
        },


        error: (
          error: HttpErrorResponse
        ) => {

          this.errorMessage.set(
            getApiErrorMessage(
              error,
              'Kulüp istatistikleri alınamadı.'
            )
          );

          this.loading.set(false);
        }

      });
  }


  getChartHeight(
    eventCount: number
  ): number {

    return Math.max(
      80,
      eventCount * 50
    );
  }


  getBarY(
    index: number
  ): number {

    return index * 50 + 10;
  }


  getTextY(
    index: number
  ): number {

    return index * 50 + 26;
  }


  getBarWidth(
    registrationRate: number
  ): number {

    const rate =
      Math.max(
        0,
        Math.min(
          registrationRate,
          100
        )
      );


    return rate * 4;
  }


  getBarTextX(
    registrationRate: number
  ): number {

    return (
      210
      +
      this.getBarWidth(
        registrationRate
      )
    );
  }
}