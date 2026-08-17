import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ClubService } from '../../core/services/club.service';
import { EventService } from '../../core/services/event.service';
import {
  ClubResponse,
  CreateEventRequest,
  EventVisibility,
  UpdateEventRequest
} from '../../core/models/api.models';
import { getApiErrorMessage } from '../../core/utils/api-error';

@Component({
  selector: 'app-event-manage',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <h1>{{ isEditMode() ? 'Etkinlik Güncelle' : 'Etkinlik Oluştur' }}</h1>

    @if (loading()) {
      <p>Yükleniyor...</p>
    }

    @if (errorMessage()) {
      <p>{{ errorMessage() }}</p>
    }

    @if (successMessage()) {
      <p>{{ successMessage() }}</p>
    }

    <form [formGroup]="form" (ngSubmit)="submit()"> <!-- etkinlik oluşturma ve güncelleme formunu bağlar -->
      @if (!isEditMode()) {
        <div>
          <label for="clubId">Kulüp</label>
          <select id="clubId" formControlName="clubId">
            <option value="">Kulüp seçin</option>

            @for (club of myClubs(); track club.id) {
              <option [value]="club.id">{{ club.name }}</option>
            }
          </select>
        </div>
      }

      <div>
        <label for="title">Başlık</label>
        <input id="title" type="text" formControlName="title">
      </div>

      <div>
        <label for="description">Açıklama</label>
        <textarea id="description" formControlName="description"></textarea>
      </div>

      <div>
        <label for="startDate">Başlangıç Tarihi</label>
        <input id="startDate" type="datetime-local" formControlName="startDate">
      </div>

      <div>
        <label for="location">Konum</label>
        <input id="location" type="text" formControlName="location">
      </div>

      <div>
        <label for="capacity">Kapasite</label>
        <input id="capacity" type="number" min="1" formControlName="capacity">
      </div>

      <div>
        <label for="category">Kategori</label>
        <input id="category" type="text" formControlName="category">
      </div>

      <div>
        <label for="visibility">Katılım Tipi</label>
        <select id="visibility" formControlName="visibility">
          <option value="Public">Public</option>
          <option value="ApprovalRequired">ApprovalRequired</option>
        </select>
      </div>

      <button type="submit" [disabled]="form.invalid || saving()">
        {{ isEditMode() ? 'Güncelle' : 'Oluştur' }}
      </button>

      @if (isEditMode()) {
        <button type="button" [disabled]="saving()" (click)="cancelEvent()">
          Etkinliği İptal Et
        </button>
      }
    </form>
  `
})
export class EventManage implements OnInit {
  readonly auth = inject(AuthService); // giriş yapan kullanıcı bilgilerine erişmemizi sağlar
  private readonly fb = inject(FormBuilder); // form oluşturmamızı sağlar
  private readonly route = inject(ActivatedRoute); // urldeki etkinlik id bilgisine erişmemizi sağlar
  private readonly router = inject(Router); // kullanıcıyı farklı routelara yönlendirmemizi sağlar
  private readonly clubService = inject(ClubService); // kulüp servisindeki metodlara erişmemizi sağlar
  private readonly eventService = inject(EventService); // etkinlik servisindeki metodlara erişmemizi sağlar

  private eventId: number | null = null; // güncellenen veya iptal edilen etkinliğin idsini tutar

  readonly isEditMode = signal(false); // sayfanın oluşturma mı güncelleme mi olduğunu tutar
  readonly myClubs = signal<ClubResponse[]>([]); // giriş yapan managerın yönettiği kulüpleri tutar
  readonly loading = signal(false); // etkinlik bilgileri yüklenirken işlemin devam edip etmediğini tutar
  readonly saving = signal(false); // oluşturma güncelleme veya iptal işleminin devam edip etmediğini tutar
  readonly errorMessage = signal(''); // kullanıcıya gösterilecek hata mesajını tutar
  readonly successMessage = signal(''); // kullanıcıya gösterilecek başarılı işlem mesajını tutar

  readonly form = this.fb.nonNullable.group({ // etkinlik formunu ve validation kurallarını oluşturur
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

  ngOnInit(): void { // sayfa açıldığında managerın kulüplerini getirir ve id varsa güncelleme moduna geçer
    this.loadMyClubs();

    const idParam = this.route.snapshot.paramMap.get('id');

    if (!idParam) {
      return; // id yoksa yeni etkinlik oluşturma modunda kalır
    }

    const id = Number(idParam);

    if (!Number.isInteger(id) || id <= 0) {
      this.errorMessage.set('Geçersiz etkinlik ID.');
      return;
    }

    this.eventId = id;
    this.isEditMode.set(true);
    this.loadEvent(id);
  }

  loadMyClubs(): void { // giriş yapan managerın yönettiği kulüpleri backendden getirir
    this.clubService.getAll().subscribe({
      next: clubs => {
        const user = this.auth.currentUser();

        if (!user) {
          this.myClubs.set([]);
          return;
        }

        this.myClubs.set(
          clubs.filter(club => club.managerUserId === user.userId)
        ); // sadece giriş yapan managera ait kulüpleri bırakır
      },
      error: (error: HttpErrorResponse) => {
        this.myClubs.set([]);
        this.errorMessage.set(
          getApiErrorMessage(error, 'Kulüpler alınamadı.')
        );
      }
    });
  }

  loadEvent(id: number): void { // güncellenecek etkinliğin mevcut bilgilerini backendden getirir
    this.loading.set(true);
    this.errorMessage.set('');

    this.eventService.getById(id).subscribe({
      next: event => {
        this.form.patchValue({ // backendden gelen etkinlik bilgilerini forma yerleştirir
          clubId: String(event.clubId),
          title: event.title,
          description: event.description,
          startDate: this.toDateTimeLocal(event.startDate),
          location: event.location,
          capacity: event.capacity,
          category: event.category,
          visibility: event.visibility
        });

        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(
          getApiErrorMessage(error, 'Etkinlik bilgileri alınamadı.')
        );
        this.loading.set(false);
      }
    });
  }

  submit(): void { // form gönderildiğinde oluşturma veya güncelleme işlemini başlatır
    if (this.form.invalid || this.saving()) {
      return;
    }

    this.saving.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const value = this.form.getRawValue();

    const commonRequest = {
      title: value.title.trim(),
      description: value.description.trim(),
      startDate: new Date(value.startDate).toISOString(), // formdaki tarihi backendin kullanacağı ISO formatına çevirir
      location: value.location.trim(),
      capacity: Number(value.capacity),
      category: value.category.trim(),
      visibility: value.visibility
    };

    if (this.isEditMode() && this.eventId) {
      const request: UpdateEventRequest = {
        ...commonRequest
      };

      this.updateEvent(this.eventId, request);
      return;
    }

    const request: CreateEventRequest = {
      clubId: Number(value.clubId),
      ...commonRequest
    };

    this.createEvent(request);
  }

  createEvent(request: CreateEventRequest): void { // yeni etkinlik oluşturma isteğini backende gönderir
    this.eventService.create(request).subscribe({
      next: event => {
        this.saving.set(false);
        void this.router.navigate(['/events', event.id]); // oluşturulan etkinliğin detay sayfasına yönlendirir
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(
          getApiErrorMessage(error, 'Etkinlik oluşturulamadı.')
        );
        this.saving.set(false);
      }
    });
  }

  updateEvent(id: number, request: UpdateEventRequest): void { // verilen etkinliğin güncelleme isteğini backende gönderir
    this.eventService.update(id, request).subscribe({
      next: event => {
        this.successMessage.set('Etkinlik güncellendi.');

        this.form.patchValue({
          title: event.title,
          description: event.description,
          startDate: this.toDateTimeLocal(event.startDate),
          location: event.location,
          capacity: event.capacity,
          category: event.category,
          visibility: event.visibility
        });

        this.saving.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(
          getApiErrorMessage(error, 'Etkinlik güncellenemedi.')
        );
        this.saving.set(false);
      }
    });
  }

  cancelEvent(): void { // mevcut etkinliği iptal etme işlemini başlatır
    if (!this.eventId || this.saving()) {
      return;
    }

    const approved = window.confirm(
      'Etkinliği iptal etmek istediğinize emin misiniz?'
    ); // iptal işleminden önce kullanıcıdan onay alır

    if (!approved) {
      return;
    }

    this.saving.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.eventService.cancel(this.eventId).subscribe({
      next: () => {
        this.successMessage.set('Etkinlik iptal edildi.');
        this.saving.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(
          getApiErrorMessage(error, 'Etkinlik iptal edilemedi.')
        );
        this.saving.set(false);
      }
    });
  }

  private toDateTimeLocal(value: string): string { // backendden gelen tarihi datetime-local inputunun kullanacağı formata çevirir
    const date = new Date(value);
    const pad = (number: number) => number.toString().padStart(2, '0');

    return (
      date.getFullYear() +
      '-' +
      pad(date.getMonth() + 1) +
      '-' +
      pad(date.getDate()) +
      'T' +
      pad(date.getHours()) +
      ':' +
      pad(date.getMinutes())
    );
  }
}