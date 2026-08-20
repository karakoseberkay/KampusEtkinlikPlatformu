import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { EventService } from '../../core/services/event.service';
import { RegistrationService } from '../../core/services/registration.service';
import { EventResponse } from '../../core/models/api.models';
import { getApiErrorMessage } from '../../core/utils/api-error';

@Component({
  selector: 'app-event-detail',
  standalone: true,
  template: `
    <h1>Etkinlik Detayı</h1>

    @if (loading()) {
      <p>Yükleniyor...</p>
    }

    @if (errorMessage()) {
      <p>{{ errorMessage() }}</p>
    }

    @if (event(); as eventItem) { <!-- backendden gelen etkinlik bilgilerini gösterir -->
      <p><strong>ID:</strong> {{ eventItem.id }}</p>
      <p><strong>Başlık:</strong> {{ eventItem.title }}</p>
      <p><strong>Açıklama:</strong> {{ eventItem.description }}</p>
      <p><strong>Kulüp:</strong> {{ eventItem.clubName }}</p>
      <p><strong>Kulüp ID:</strong> {{ eventItem.clubId }}</p>
      <p><strong>Tarih:</strong> {{ eventItem.startDate }}</p>
      <p><strong>Konum:</strong> {{ eventItem.location }}</p>
      <p><strong>Kapasite:</strong> {{ eventItem.capacity }}</p>
      <p><strong>Kategori:</strong> {{ eventItem.category }}</p>
      <p><strong>Katılım Tipi:</strong> {{ eventItem.visibility }}</p>
      <p><strong>Durum:</strong> {{ eventItem.status }}</p>
      <p><strong>Oluşturulma Tarihi:</strong> {{ eventItem.createdAt }}</p>

      @if (auth.hasRole('Student') || auth.hasRole('ClubManager')) { <!-- sadece Student rolündeki kullanıcıya kayıt ol butonunu gösterir -->
        <button
          type="button"
          [disabled]="registering()"
          (click)="register()"
        >
          Kayıt Ol
        </button>
      }

      @if (successMessage()) {
        <p>{{ successMessage() }}</p>
      }
    }
  `
})
export class EventDetail implements OnInit {
  readonly auth = inject(AuthService); // giriş yapan kullanıcının rol bilgilerine erişmemizi sağlar
  private readonly route = inject(ActivatedRoute); // urldeki etkinlik id bilgisine erişmemizi sağlar
  private readonly eventService = inject(EventService); // etkinlik servisindeki metodlara erişmemizi sağlar
  private readonly registrationService = inject(RegistrationService); // etkinlik kayıt işlemlerine erişmemizi sağlar

  readonly event = signal<EventResponse | null>(null); // backendden gelen etkinlik bilgisini tutar
  readonly loading = signal(false); // etkinlik bilgisi yüklenirken işlemin devam edip etmediğini tutar
  readonly registering = signal(false); // kayıt işleminin devam edip etmediğini tutar
  readonly errorMessage = signal(''); // kullanıcıya gösterilecek hata mesajını tutar
  readonly successMessage = signal(''); // kullanıcıya gösterilecek başarılı işlem mesajını tutar

  ngOnInit(): void { // sayfa açıldığında urldeki idye göre etkinliği getirir
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!Number.isInteger(id) || id <= 0) {
      this.errorMessage.set('Geçersiz etkinlik ID.');
      return;
    }

    this.loadEvent(id);
  }

  loadEvent(id: number): void { // verilen idye sahip etkinliği backendden getirir
    this.loading.set(true);
    this.errorMessage.set('');

    this.eventService.getById(id).subscribe({
      next: event => {
        this.event.set(event);
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(
          getApiErrorMessage(error, 'Etkinlik alınamadı.')
        );
        this.loading.set(false);
      }
    });
  }

  register(): void { // giriş yapan öğrenciyi görüntülenen etkinliğe kaydeder
    const eventItem = this.event();

    if (!eventItem) {
      return;
    }

    this.registering.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.registrationService.register(eventItem.id).subscribe({
      next: registration => {
        this.successMessage.set(
          `Kayıt oluşturuldu. Durum: ${registration.approvalStatus}`
        );
        this.registering.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(
          getApiErrorMessage(error, 'Etkinliğe kayıt olunamadı.')
        );
        this.registering.set(false);
      }
    });
  }
}