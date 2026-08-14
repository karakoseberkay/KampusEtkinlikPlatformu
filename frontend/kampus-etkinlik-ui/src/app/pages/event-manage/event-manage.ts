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
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  ActivatedRoute,
  Router
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
  CreateEventRequest,
  EventVisibility,
  UpdateEventRequest
} from '../../core/models/api.models';

import {
  getApiErrorMessage
} from '../../core/utils/api-error';


@Component({
  selector: 'app-event-manage',
  standalone: true,

  imports: [
    ReactiveFormsModule
  ],

  template: `
    <h1>
      {{ isEditMode() ? 'Etkinlik Güncelle' : 'Etkinlik Oluştur' }}
    </h1>


    @if (loading()) {
      <p>Yükleniyor...</p>
    }


    @if (errorMessage()) {
      <p>{{ errorMessage() }}</p>
    }


    @if (successMessage()) {
      <p>{{ successMessage() }}</p>
    }


    <form
      [formGroup]="form"
      (ngSubmit)="submit()"
    >

      @if (!isEditMode()) {

        <div>
          <label for="clubId">
            Kulüp
          </label>

          <select
            id="clubId"
            formControlName="clubId"
          >

            <option value="">
              Kulüp seçin
            </option>

            @for (
              club of myClubs();
              track club.id
            ) {

              <option [value]="club.id">
                {{ club.name }}
              </option>

            }

          </select>
        </div>

      }


      <div>
        <label for="title">
          Başlık
        </label>

        <input
          id="title"
          type="text"
          formControlName="title"
        >
      </div>


      <div>
        <label for="description">
          Açıklama
        </label>

        <textarea
          id="description"
          formControlName="description"
        ></textarea>
      </div>


      <div>
        <label for="startDate">
          Başlangıç Tarihi
        </label>

        <input
          id="startDate"
          type="datetime-local"
          formControlName="startDate"
        >
      </div>


      <div>
        <label for="location">
          Konum
        </label>

        <input
          id="location"
          type="text"
          formControlName="location"
        >
      </div>


      <div>
        <label for="capacity">
          Kapasite
        </label>

        <input
          id="capacity"
          type="number"
          min="1"
          formControlName="capacity"
        >
      </div>


      <div>
        <label for="category">
          Kategori
        </label>

        <input
          id="category"
          type="text"
          formControlName="category"
        >
      </div>


      <div>
        <label for="visibility">
          Katılım Tipi
        </label>

        <select
          id="visibility"
          formControlName="visibility"
        >
          <option value="Public">
            Public
          </option>

          <option value="ApprovalRequired">
            ApprovalRequired
          </option>
        </select>
      </div>


      <button
        type="submit"
        [disabled]="form.invalid || saving()"
      >
        {{ isEditMode() ? 'Güncelle' : 'Oluştur' }}
      </button>


      @if (isEditMode()) {

        <button
          type="button"
          [disabled]="saving()"
          (click)="cancelEvent()"
        >
          Etkinliği İptal Et
        </button>

      }

    </form>
  `
})
export class EventManage
  implements OnInit {

  readonly auth =
    inject(AuthService);

  private readonly fb =
    inject(FormBuilder);

  private readonly route =
    inject(ActivatedRoute);

  private readonly router =
    inject(Router);

  private readonly clubService =
    inject(ClubService);

  private readonly eventService =
    inject(EventService);


  private eventId: number | null = null;


  readonly isEditMode =
    signal(false);

  readonly myClubs =
    signal<ClubResponse[]>([]);

  readonly loading =
    signal(false);

  readonly saving =
    signal(false);

  readonly errorMessage =
    signal('');

  readonly successMessage =
    signal('');


  readonly form =
    this.fb.nonNullable.group({

      clubId: [
        '',
        [
          Validators.required
        ]
      ],

      title: [
        '',
        [
          Validators.required,
          Validators.maxLength(200)
        ]
      ],

      description: [
        '',
        [
          Validators.required,
          Validators.maxLength(3000)
        ]
      ],

      startDate: [
        '',
        [
          Validators.required
        ]
      ],

      location: [
        '',
        [
          Validators.required,
          Validators.maxLength(250)
        ]
      ],

      capacity: [
        1,
        [
          Validators.required,
          Validators.min(1)
        ]
      ],

      category: [
        '',
        [
          Validators.required,
          Validators.maxLength(100)
        ]
      ],

      visibility: [
        'Public' as EventVisibility,
        [
          Validators.required
        ]
      ]

    });


  ngOnInit(): void {

    this.loadMyClubs();


    const idParam =
      this.route.snapshot.paramMap.get('id');


    if (!idParam) {
      return;
    }


    const id =
      Number(idParam);


    if (
      !Number.isInteger(id)
      || id <= 0
    ) {

      this.errorMessage.set(
        'Geçersiz etkinlik ID.'
      );

      return;
    }


    this.eventId = id;

    this.isEditMode.set(true);

    this.loadEvent(id);
  }


  loadMyClubs(): void {

    this.clubService
      .getAll()
      .subscribe({

        next: clubs => {

          const user =
            this.auth.currentUser();


          if (!user) {

            this.myClubs.set([]);

            return;
          }


          this.myClubs.set(
            clubs.filter(
              club =>
                club.managerUserId
                === user.userId
            )
          );
        },


        error: (
          error: HttpErrorResponse
        ) => {

          this.myClubs.set([]);

          this.errorMessage.set(
            getApiErrorMessage(
              error,
              'Kulüpler alınamadı.'
            )
          );
        }

      });
  }


  loadEvent(
    id: number
  ): void {

    this.loading.set(true);

    this.errorMessage.set('');


    this.eventService
      .getById(id)
      .subscribe({

        next: event => {

          this.form.patchValue({

            clubId:
              String(event.clubId),

            title:
              event.title,

            description:
              event.description,

            startDate:
              this.toDateTimeLocal(
                event.startDate
              ),

            location:
              event.location,

            capacity:
              event.capacity,

            category:
              event.category,

            visibility:
              event.visibility

          });


          this.loading.set(false);
        },


        error: (
          error: HttpErrorResponse
        ) => {

          this.errorMessage.set(
            getApiErrorMessage(
              error,
              'Etkinlik bilgileri alınamadı.'
            )
          );

          this.loading.set(false);
        }

      });
  }


  submit(): void {

    if (
      this.form.invalid
      || this.saving()
    ) {
      return;
    }


    this.saving.set(true);

    this.errorMessage.set('');

    this.successMessage.set('');


    const value =
      this.form.getRawValue();


    const commonRequest = {

      title:
        value.title.trim(),

      description:
        value.description.trim(),

      startDate:
        new Date(
          value.startDate
        ).toISOString(),

      location:
        value.location.trim(),

      capacity:
        Number(value.capacity),

      category:
        value.category.trim(),

      visibility:
        value.visibility

    };


    if (
      this.isEditMode()
      && this.eventId
    ) {

      const request:
        UpdateEventRequest = {
          ...commonRequest
        };


      this.updateEvent(
        this.eventId,
        request
      );

      return;
    }


    const request:
      CreateEventRequest = {

        clubId:
          Number(value.clubId),

        ...commonRequest

      };


    this.createEvent(request);
  }


  createEvent(
    request: CreateEventRequest
  ): void {

    this.eventService
      .create(request)
      .subscribe({

        next: event => {

          this.saving.set(false);

          this.router.navigate([
            '/events',
            event.id
          ]);
        },


        error: (
          error: HttpErrorResponse
        ) => {

          this.errorMessage.set(
            getApiErrorMessage(
              error,
              'Etkinlik oluşturulamadı.'
            )
          );

          this.saving.set(false);
        }

      });
  }


  updateEvent(
    id: number,
    request: UpdateEventRequest
  ): void {

    this.eventService
      .update(
        id,
        request
      )
      .subscribe({

        next: event => {

          this.successMessage.set(
            'Etkinlik güncellendi.'
          );


          this.form.patchValue({

            title:
              event.title,

            description:
              event.description,

            startDate:
              this.toDateTimeLocal(
                event.startDate
              ),

            location:
              event.location,

            capacity:
              event.capacity,

            category:
              event.category,

            visibility:
              event.visibility

          });


          this.saving.set(false);
        },


        error: (
          error: HttpErrorResponse
        ) => {

          this.errorMessage.set(
            getApiErrorMessage(
              error,
              'Etkinlik güncellenemedi.'
            )
          );

          this.saving.set(false);
        }

      });
  }


  cancelEvent(): void {

    if (
      !this.eventId
      || this.saving()
    ) {
      return;
    }


    const approved =
      window.confirm(
        'Etkinliği iptal etmek istediğinize emin misiniz?'
      );


    if (!approved) {
      return;
    }


    this.saving.set(true);

    this.errorMessage.set('');

    this.successMessage.set('');


    this.eventService
      .cancel(this.eventId)
      .subscribe({

        next: () => {

          this.successMessage.set(
            'Etkinlik iptal edildi.'
          );

          this.saving.set(false);
        },


        error: (
          error: HttpErrorResponse
        ) => {

          this.errorMessage.set(
            getApiErrorMessage(
              error,
              'Etkinlik iptal edilemedi.'
            )
          );

          this.saving.set(false);
        }

      });
  }


  private toDateTimeLocal(
    value: string
  ): string {

    const date =
      new Date(value);


    const pad =
      (number: number) =>
        number
          .toString()
          .padStart(2, '0');


    return (
      date.getFullYear()
      + '-'
      + pad(
        date.getMonth() + 1
      )
      + '-'
      + pad(
        date.getDate()
      )
      + 'T'
      + pad(
        date.getHours()
      )
      + ':'
      + pad(
        date.getMinutes()
      )
    );
  }
}