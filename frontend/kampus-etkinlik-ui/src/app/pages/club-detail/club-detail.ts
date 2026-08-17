import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { ClubService } from '../../core/services/club.service';
import { ClubResponse } from '../../core/models/api.models';
import { getApiErrorMessage } from '../../core/utils/api-error';

@Component({
  selector: 'app-club-detail',
  standalone: true,
  template: `
    <h1>Kulüp Detayı</h1>

    @if (loading()) {
      <p>Yükleniyor...</p>
    }

    @if (errorMessage()) {
      <p>{{ errorMessage() }}</p>
    }

    @if (club(); as clubItem) { <!-- backendden gelen kulüp bilgilerini gösterir -->
      <p><strong>ID:</strong> {{ clubItem.id }}</p>
      <p><strong>Kulüp Adı:</strong> {{ clubItem.name }}</p>
      <p><strong>Açıklama:</strong> {{ clubItem.description }}</p>
      <p><strong>Logo URL:</strong> {{ clubItem.logoUrl }}</p>
      <p><strong>Yönetici ID:</strong> {{ clubItem.managerUserId }}</p>
      <p><strong>Yönetici:</strong> {{ clubItem.managerFullName }}</p>
      <p><strong>Etkinlik Sayısı:</strong> {{ clubItem.eventCount }}</p>
    }
  `
})
export class ClubDetail implements OnInit {
  private readonly route = inject(ActivatedRoute); // urldeki kulüp id bilgisine erişmemizi sağlar
  private readonly clubService = inject(ClubService); // kulüp servisindeki metodlara erişmemizi sağlar

  readonly club = signal<ClubResponse | null>(null); // backendden gelen kulüp bilgisini tutar
  readonly loading = signal(false); // kulüp bilgisi yüklenirken işlemin devam edip etmediğini tutar
  readonly errorMessage = signal(''); // kullanıcıya gösterilecek hata mesajını tutar

  ngOnInit(): void { // sayfa açıldığında urldeki idye göre kulüp bilgisini getirir
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!Number.isInteger(id) || id <= 0) {
      this.errorMessage.set('Geçersiz kulüp ID.');
      return;
    }

    this.loadClub(id);
  }

  loadClub(id: number): void { // verilen idye sahip kulübü backendden getirir
    this.loading.set(true);
    this.errorMessage.set('');

    this.clubService.getById(id).subscribe({
      next: club => {
        this.club.set(club);
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(
          getApiErrorMessage(error, 'Kulüp alınamadı.')
        );
        this.loading.set(false);
      }
    });
  }
}