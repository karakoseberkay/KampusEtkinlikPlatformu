import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { getApiErrorMessage } from '../../core/utils/api-error';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  template: `
    <h1>Ana Sayfa</h1>

    @if (auth.currentUser(); as user) { <!-- giriş yapan kullanıcının bilgilerini gösterir -->
      <p><strong>Kullanıcı:</strong> {{ user.fullName }}</p>
      <p><strong>E-posta:</strong> {{ user.email }}</p>
      <p><strong>Kullanıcı ID:</strong> {{ user.userId }}</p>
      <p><strong>Roller:</strong> {{ user.roles.join(', ') }}</p>
      <p><strong>Token Bitiş:</strong> {{ user.expiresAtUtc }}</p>
    }

    <button
      type="button"
      [disabled]="refreshing()"
      (click)="refreshCurrentUser()"
    >
      Kullanıcı Bilgilerimi Yenile
    </button>

    @if (successMessage()) {
      <p>{{ successMessage() }}</p>
    }

    @if (errorMessage()) {
      <p>{{ errorMessage() }}</p>
    }

    <h2>Genel İşlemler</h2>
    <p><a routerLink="/popular-events">Popüler Etkinlikler</a></p>
    <p><a routerLink="/events">Etkinlikler</a></p>
    <p><a routerLink="/clubs">Kulüpler</a></p>

    @if (auth.hasRole('Student')) { <!-- Student rolündeki kullanıcıya özel işlemleri gösterir -->
      <h2>Öğrenci İşlemleri</h2>
      <p><a routerLink="/events">Etkinliğe Kayıt Ol</a></p>
      <p><a routerLink="/my-registrations">Kayıtlarım</a></p>
    }

    @if (auth.hasRole('ClubManager')) { <!-- ClubManager rolündeki kullanıcıya özel işlemleri gösterir -->
      <h2>Kulüp Yöneticisi İşlemleri</h2>
      <p><a routerLink="/club-manage">Yeni Kulüp Oluştur</a></p>
      <p><a routerLink="/clubs">Kulüplerimi Yönet</a></p>
      <p><a routerLink="/event-manage">Yeni Etkinlik Oluştur</a></p>
      <p><a routerLink="/events">Etkinliklerimi Yönet</a></p>
    }
  `
})
export class HomePage {
  readonly auth = inject(AuthService); // giriş yapan kullanıcının bilgilerine ve rollerine erişmemizi sağlar

  readonly refreshing = signal(false); // kullanıcı bilgileri yenilenirken işlemin devam edip etmediğini tutar
  readonly errorMessage = signal(''); // kullanıcıya gösterilecek hata mesajını tutar
  readonly successMessage = signal(''); // kullanıcıya gösterilecek başarılı işlem mesajını tutar

  refreshCurrentUser(): void { // kullanıcının güncel bilgilerini backendden tekrar getirir
    if (this.refreshing()) {
      return;
    }

    this.refreshing.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.auth.getMe().subscribe({
      next: () => {
        this.successMessage.set('Kullanıcı bilgileri yenilendi.');
        this.refreshing.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(
          getApiErrorMessage(error, 'Kullanıcı bilgileri alınamadı.')
        );
        this.refreshing.set(false);
      }
    });
  }
}