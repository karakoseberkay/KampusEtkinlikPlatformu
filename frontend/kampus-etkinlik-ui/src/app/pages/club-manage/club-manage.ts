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
  ClubService
} from '../../core/services/club.service';

import {
  CreateClubRequest,
  UpdateClubRequest
} from '../../core/models/api.models';

import {
  getApiErrorMessage
} from '../../core/utils/api-error';


@Component({
  selector: 'app-club-manage',
  standalone: true,

  imports: [
    ReactiveFormsModule
  ],

  template: `
    <h1>
      {{ isEditMode() ? 'Kulüp Güncelle' : 'Kulüp Oluştur' }}
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

      <div>
        <label for="name">
          Kulüp Adı
        </label>

        <input
          id="name"
          type="text"
          formControlName="name"
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
        <label for="logoUrl">
          Logo URL
        </label>

        <input
          id="logoUrl"
          type="text"
          formControlName="logoUrl"
        >
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
          (click)="deleteClub()"
        >
          Kulübü Sil
        </button>

      }

    </form>
  `
})
export class ClubManage
  implements OnInit {

  private readonly fb =
    inject(FormBuilder);

  private readonly route =
    inject(ActivatedRoute);

  private readonly router =
    inject(Router);

  private readonly clubService =
    inject(ClubService);


  private clubId: number | null = null;


  readonly isEditMode =
    signal(false);

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

      name: [
        '',
        [
          Validators.required,
          Validators.maxLength(150)
        ]
      ],

      description: [
        '',
        [
          Validators.maxLength(1000)
        ]
      ],

      logoUrl: [
        '',
        [
          Validators.maxLength(500)
        ]
      ]

    });


  ngOnInit(): void {

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
        'Geçersiz kulüp ID.'
      );

      return;
    }


    this.clubId = id;

    this.isEditMode.set(true);

    this.loadClub(id);
  }


  loadClub(
    id: number
  ): void {

    this.loading.set(true);

    this.errorMessage.set('');


    this.clubService
      .getById(id)
      .subscribe({

        next: club => {

          this.form.patchValue({

            name:
              club.name,

            description:
              club.description ?? '',

            logoUrl:
              club.logoUrl ?? ''

          });


          this.loading.set(false);
        },


        error: (
          error: HttpErrorResponse
        ) => {

          this.errorMessage.set(
            getApiErrorMessage(
              error,
              'Kulüp bilgileri alınamadı.'
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


    const request = {

      name:
        value.name.trim(),

      description:
        value.description.trim()
        || null,

      logoUrl:
        value.logoUrl.trim()
        || null

    };


    if (
      this.isEditMode()
      && this.clubId
    ) {

      this.updateClub(
        this.clubId,
        request
      );

      return;
    }


    this.createClub(request);
  }


  createClub(
    request: CreateClubRequest
  ): void {

    this.clubService
      .create(request)
      .subscribe({

        next: club => {

          this.saving.set(false);

          this.router.navigate([
            '/clubs',
            club.id
          ]);
        },


        error: (
          error: HttpErrorResponse
        ) => {

          this.errorMessage.set(
            getApiErrorMessage(
              error,
              'Kulüp oluşturulamadı.'
            )
          );

          this.saving.set(false);
        }

      });
  }


  updateClub(
    id: number,
    request: UpdateClubRequest
  ): void {

    this.clubService
      .update(
        id,
        request
      )
      .subscribe({

        next: club => {

          this.successMessage.set(
            'Kulüp güncellendi.'
          );


          this.form.patchValue({

            name:
              club.name,

            description:
              club.description ?? '',

            logoUrl:
              club.logoUrl ?? ''

          });


          this.saving.set(false);
        },


        error: (
          error: HttpErrorResponse
        ) => {

          this.errorMessage.set(
            getApiErrorMessage(
              error,
              'Kulüp güncellenemedi.'
            )
          );

          this.saving.set(false);
        }

      });
  }


  deleteClub(): void {

    if (
      !this.clubId
      || this.saving()
    ) {
      return;
    }


    const approved =
      window.confirm(
        'Kulübü silmek istediğinize emin misiniz?'
      );


    if (!approved) {
      return;
    }


    this.saving.set(true);

    this.errorMessage.set('');

    this.successMessage.set('');


    this.clubService
      .delete(this.clubId)
      .subscribe({

        next: () => {

          this.saving.set(false);

          this.router.navigate([
            '/clubs'
          ]);
        },


        error: (
          error: HttpErrorResponse
        ) => {

          this.errorMessage.set(
            getApiErrorMessage(
              error,
              'Kulüp silinemedi.'
            )
          );

          this.saving.set(false);
        }

      });
  }
}