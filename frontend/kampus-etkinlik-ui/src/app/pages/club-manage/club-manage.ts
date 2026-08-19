import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ClubService } from '../../core/services/club.service';
import { CreateClubRequest, UpdateClubRequest } from '../../core/models/api.models';
import { getApiErrorMessage } from '../../core/utils/api-error';

@Component({
  selector: 'app-club-manage',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <h1>{{ isEditMode() ? 'Kulüp Güncelle' : 'Kulüp Oluştur' }}</h1>//editmode=true kulübü güncelle - false kulüp oluştur

    @if (loading()) {
      <p>Yükleniyor...</p>
    }

    @if (errorMessage()) {
      <p>{{ errorMessage() }}</p>
    }

    @if (successMessage()) {
      <p>{{ successMessage() }}</p>
    }

    <form [formGroup]="form" (ngSubmit)="submit()"> <!-- kulüp oluşturma ve güncelleme formunu bağlar -->
      <div>
        <label for="name">Kulüp Adı</label>
        <input id="name" type="text" formControlName="name">
      </div>

      <div>
        <label for="description">Açıklama</label>
        <textarea id="description" formControlName="description"></textarea>
      </div>

      <div>
        <label for="logoUrl">Logo URL</label>
        <input id="logoUrl" type="text" formControlName="logoUrl">
      </div>

      <button type="submit" [disabled]="form.invalid || saving()">
        {{ isEditMode() ? 'Güncelle' : 'Oluştur' }}
      </button>

      @if (isEditMode()) {
        <button type="button" [disabled]="saving()" (click)="deleteClub()">Kulübü Sil</button>
      }
    </form>
  `
})
export class ClubManage implements OnInit {
  private readonly fb = inject(FormBuilder); // form oluşturmamızı sağlar
  private readonly route = inject(ActivatedRoute); // urldeki kulüp id bilgisine erişmemizi sağlar
  private readonly router = inject(Router); // kullanıcıyı farklı routelara yönlendirmemizi sağlar
  private readonly clubService = inject(ClubService); // kulüp servisindeki metodlara erişmemizi sağlar

  private clubId: number | null = null; // güncellenen veya silinen kulübün idsini tutar

  readonly isEditMode = signal(false); // sayfanın oluşturma mı güncelleme mi olduğunu tutar
  readonly loading = signal(false); // kulüp bilgileri yüklenirken işlemin devam edip etmediğini tutar
  readonly saving = signal(false); // oluşturma güncelleme veya silme işleminin devam edip etmediğini tutar
  readonly errorMessage = signal(''); // kullanıcıya gösterilecek hata mesajını tutar
  readonly successMessage = signal(''); // kullanıcıya gösterilecek başarılı işlem mesajını tutar

  readonly form = this.fb.nonNullable.group({ // kulüp formunu ve validation kurallarını oluşturur
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

  ngOnInit(): void { // urlde id varsa sayfayı güncelleme modunda açar
    const idParam = this.route.snapshot.paramMap.get('id');

    if (!idParam) {
      return; // id yoksa yeni kulüp oluşturma modunda kalır
    }

    const id = Number(idParam);

    if (!Number.isInteger(id) || id <= 0) {
      this.errorMessage.set('Geçersiz kulüp ID.');
      return;
    }

    this.clubId = id;
    this.isEditMode.set(true);
    this.loadClub(id);
  }

  loadClub(id: number): void { // güncellenecek kulübün mevcut bilgilerini backendden getirir
    this.loading.set(true);
    this.errorMessage.set('');

    this.clubService.getById(id).subscribe({
      next: club => {
        this.form.patchValue({ // backendden gelen kulüp bilgilerini forma yerleştirir
          name: club.name,
          description: club.description ?? '',
          logoUrl: club.logoUrl ?? ''
        });

        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(
          getApiErrorMessage(error, 'Kulüp bilgileri alınamadı.')
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

    const request = {
      name: value.name.trim(),
      description: value.description.trim() || null,
      logoUrl: value.logoUrl.trim() || null
    };

    if (this.isEditMode() && this.clubId) {
      this.updateClub(this.clubId, request); // güncelleme modundaysa mevcut kulübü günceller
      return;
    }

    this.createClub(request); // oluşturma modundaysa yeni kulüp oluşturur
  }

  createClub(request: CreateClubRequest): void { // yeni kulüp oluşturma isteğini backende gönderir
    this.clubService.create(request).subscribe({
      next: club => {
        this.saving.set(false);
        void this.router.navigate(['/clubs', club.id]); // oluşturulan kulübün detay sayfasına yönlendirir
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(
          getApiErrorMessage(error, 'Kulüp oluşturulamadı.')
        );
        this.saving.set(false);
      }
    });
  }

  updateClub(id: number, request: UpdateClubRequest): void { // verilen kulübün güncelleme isteğini backende gönderir
    this.clubService.update(id, request).subscribe({
      next: club => {
        this.successMessage.set('Kulüp güncellendi.');

        this.form.patchValue({//mevcut bilgileri yerleştirme
          name: club.name,
          description: club.description ?? '',
          logoUrl: club.logoUrl ?? ''
        });

        this.saving.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(
          getApiErrorMessage(error, 'Kulüp güncellenemedi.')
        );
        this.saving.set(false);
      }
    });
  }

  deleteClub(): void { // mevcut kulübü silme işlemini başlatır
    if (!this.clubId || this.saving()) {
      return;
    }

    const approved = window.confirm('Kulübü silmek istediğinize emin misiniz?'); // silme işleminden önce kullanıcıdan onay alır

    if (!approved) {
      return;
    }

    this.saving.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.clubService.delete(this.clubId).subscribe({
      next: () => {
        this.saving.set(false);
        void this.router.navigate(['/clubs']); // silme başarılıysa kulüpler sayfasına yönlendirir
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(
          getApiErrorMessage(error, 'Kulüp silinemedi.')
        );
        this.saving.set(false);
      }
    });
  }
}