import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { RegistrationService } from '../../core/services/registration.service';
import {
  RegistrationApprovalStatus,
  RegistrationResponse
} from '../../core/models/api.models';
import { getApiErrorMessage } from '../../core/utils/api-error';

@Component({
  selector: 'app-event-registrations',
  standalone: true,
  imports: [FormsModule],
  template: `
    <h1>Etkinlik Kayıtları</h1>

    <div>
      <label for="approvalStatus">Durum</label>

      <select
        id="approvalStatus"
        [ngModel]="selectedStatus()"
        (ngModelChange)="changeStatus($event)"
      >
        <option value="">Tümü</option>
        <option value="Pending">Pending</option>
        <option value="Approved">Approved</option>
        <option value="Rejected">Rejected</option>
      </select>
    </div>

    <button type="button" (click)="loadRegistrations()">Yenile</button>

    @if (loading()) {
      <p>Yükleniyor...</p>
    }

    @if (errorMessage()) {
      <p>{{ errorMessage() }}</p>
    }

    @if (successMessage()) {
      <p>{{ successMessage() }}</p>
    }

    @if (!loading() && registrations().length === 0 && !errorMessage()) {
      <p>Kayıt bulunamadı.</p>
    }

    @if (registrations().length > 0) {
      <table>
        <thead>
          <tr>
            <th>Kayıt ID</th>
            <th>Kullanıcı ID</th>
            <th>Öğrenci</th>
            <th>Etkinlik</th>
            <th>Kulüp</th>
            <th>Kayıt Tarihi</th>
            <th>Durum</th>
            <th>İşlem</th>
          </tr>
        </thead>

        <tbody>
          @for (registration of registrations(); track registration.id) { <!-- etkinliğe yapılan kayıtları tabloya basar -->
            <tr>
              <td>{{ registration.id }}</td>
              <td>{{ registration.userId }}</td>
              <td>{{ registration.userFullName }}</td>
              <td>{{ registration.eventTitle }}</td>
              <td>{{ registration.clubName }}</td>
              <td>{{ registration.registeredAt }}</td>
              <td>{{ registration.approvalStatus }}</td>

              <td>
                @if (registration.approvalStatus === 'Pending') { <!-- sadece bekleyen kayıtlar için onayla ve reddet butonlarını gösterir -->
                  <button
                    type="button"
                    [disabled]="processingId() !== null"
                    (click)="approve(registration.id)"
                  >
                    Onayla
                  </button>

                  <button
                    type="button"
                    [disabled]="processingId() !== null"
                    (click)="reject(registration.id)"
                  >
                    Reddet
                  </button>
                }
              </td>
            </tr>
          }
        </tbody>
      </table>
    }
  `
})
export class EventRegistrations implements OnInit {
  private readonly route = inject(ActivatedRoute); // urldeki etkinlik id bilgisine erişmemizi sağlar
  private readonly registrationService = inject(RegistrationService); // etkinlik kayıt işlemlerine erişmemizi sağlar

  private eventId: number | null = null; // kayıtları görüntülenecek etkinliğin idsini tutar

  readonly registrations = signal<RegistrationResponse[]>([]); // backendden gelen kayıtları tutar
  readonly selectedStatus = signal<RegistrationApprovalStatus | ''>(''); // seçilen kayıt durumu filtresini tutar
  readonly loading = signal(false); // kayıtlar yüklenirken işlemin devam edip etmediğini tutar
  readonly processingId = signal<number | null>(null); // işlem yapılan kayıt idsini tutar
  readonly errorMessage = signal(''); // kullanıcıya gösterilecek hata mesajını tutar
  readonly successMessage = signal(''); // kullanıcıya gösterilecek başarılı işlem mesajını tutar

  ngOnInit(): void { // sayfa açıldığında urldeki etkinlik idsine göre kayıtları getirir
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!Number.isInteger(id) || id <= 0) {
      this.errorMessage.set('Geçersiz etkinlik ID.');
      return;
    }

    this.eventId = id;
    this.loadRegistrations();
  }

  changeStatus(value: RegistrationApprovalStatus | ''): void { // kayıt durumu filtresi değiştiğinde kayıtları tekrar getirir
    this.selectedStatus.set(value);
    this.loadRegistrations();
  }

  loadRegistrations(clearSuccess = true): void { // etkinliğin kayıtlarını seçilen durum filtresine göre backendden getirir
    if (!this.eventId) {
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    if (clearSuccess) {
      this.successMessage.set('');
    }

    const selected = this.selectedStatus();

    const status: RegistrationApprovalStatus | undefined =
      selected === '' ? undefined : selected; // tümü seçildiyse backende durum filtresi göndermez

    this.registrationService.getForEvent(this.eventId, status).subscribe({
      next: registrations => {
        this.registrations.set(registrations);
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(
          getApiErrorMessage(error, 'Etkinlik kayıtları alınamadı.')
        );
        this.loading.set(false);
      }
    });
  }

  approve(registrationId: number): void { // verilen kayıt talebini onaylar
    if (this.processingId() !== null) {
      return;
    }

    this.processingId.set(registrationId);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.registrationService.approve(registrationId).subscribe({
      next: () => {
        this.processingId.set(null);
        this.successMessage.set('Kayıt onaylandı.');
        this.loadRegistrations(false); // kayıt listesini günceller ama başarılı mesajını silmez
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(
          getApiErrorMessage(error, 'Kayıt onaylanamadı.')
        );
        this.processingId.set(null);
      }
    });
  }

  reject(registrationId: number): void { // verilen kayıt talebini reddeder
    if (this.processingId() !== null) {
      return;
    }

    this.processingId.set(registrationId);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.registrationService.reject(registrationId).subscribe({
      next: () => {
        this.processingId.set(null);
        this.successMessage.set('Kayıt reddedildi.');
        this.loadRegistrations(false); // kayıt listesini günceller ama başarılı mesajını silmez
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(
          getApiErrorMessage(error, 'Kayıt reddedilemedi.')
        );
        this.processingId.set(null);
      }
    });
  }
}