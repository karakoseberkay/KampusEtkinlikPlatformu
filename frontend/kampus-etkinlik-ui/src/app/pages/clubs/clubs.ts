import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { ClubService } from '../../core/services/club.service';
import { AuthService } from '../../core/services/auth.service';
import { ClubResponse } from '../../core/models/api.models';
import { getApiErrorMessage } from '../../core/utils/api-error';

@Component({
  selector: 'app-clubs',
  standalone: true,
  imports: [RouterLink],
  template: `
    <h1>Kulüpler</h1>

    @if (auth.hasRole('ClubManager')) {
      <p>
        <a routerLink="/club-manage">Yeni Kulüp Oluştur</a>
      </p>
    }

    <button type="button" (click)="loadClubs()">Yenile</button>

    @if (loading()) {
      <p>Yükleniyor...</p>
    }

    @if (errorMessage()) {
      <p>{{ errorMessage() }}</p>
    }

    @if (!loading() && clubs().length === 0 && !errorMessage()) {
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
          @for (club of clubs(); track club.id) { <!-- kulüpleri tabloya basar -->
            <tr>
              <td>{{ club.id }}</td>
              <td>{{ club.name }}</td>
              <td>{{ club.description }}</td>
              <td>{{ club.logoUrl }}</td>
              <td>{{ club.managerFullName }}</td>
              <td>{{ club.eventCount }}</td>
              <td>
                <a [routerLink]="['/clubs', club.id]">Detay</a>

                @if (ownsClub(club)) { <!-- giriş yapan manager bu kulübün yöneticisiyse yönetim işlemlerini gösterir -->
                  |
                  <a [routerLink]="['/club-manage', club.id]">Güncelle</a>
                  |
                  <a [routerLink]="['/clubs', club.id, 'stats']">İstatistik</a>
                }
              </td>
            </tr>
          }
        </tbody>
      </table>
    }
  `
})
export class Clubs implements OnInit {
  readonly auth = inject(AuthService); // giriş yapan kullanıcının rol ve kullanıcı bilgilerine erişmemizi sağlar
  private readonly clubService = inject(ClubService); // kulüp servisindeki metodlara erişmemizi sağlar

  readonly clubs = signal<ClubResponse[]>([]); // backendden gelen kulüpleri tutar
  readonly loading = signal(false); // kulüpler yüklenirken işlemin devam edip etmediğini tutar
  readonly errorMessage = signal(''); // kullanıcıya gösterilecek hata mesajını tutar

  ngOnInit(): void { // sayfa açıldığında kulüpleri getirir
    this.loadClubs();
  }

  ownsClub(club: ClubResponse): boolean { // giriş yapan kullanıcının verilen kulübün yöneticisi olup olmadığını kontrol eder
    const user = this.auth.currentUser();

    return !!user &&
      this.auth.hasRole('ClubManager') &&
      club.managerUserId === user.userId;
  }

  loadClubs(): void { // tüm kulüpleri backendden getirir
    this.loading.set(true);
    this.errorMessage.set('');

    this.clubService.getAll().subscribe({
      next: clubs => {
        this.clubs.set(clubs);
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(
          getApiErrorMessage(error, 'Kulüpler alınamadı.')
        );
        this.loading.set(false);
      }
    });
  }
}