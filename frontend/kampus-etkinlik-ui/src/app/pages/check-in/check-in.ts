import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { EventService } from '../../core/services/event.service';
import { getApiErrorMessage } from '../../core/utils/api-error';

@Component({
  selector: 'app-check-in',
  standalone: true,
  imports: [],
  template: `
    <section class="check-in-page">

      <div class="check-in-card">

        <div class="check-in-icon">
          ✓
        </div>

        <h1>Event Check-In</h1>

        @if (checkingIn()) {
          <p class="check-in-description">
            Your QR code is being verified...
          </p>

          <div class="loading-message">
            Checking your registration
          </div>
        }

        @if (successMessage()) {
          <div class="result-message success-result">
            <strong>Check-In Successful</strong>
            <span>{{ successMessage() }}</span>

            @if (checkedInAt()) {
              <small>{{ formatCheckedInAt() }}</small>
            }
          </div>
        }

        @if (errorMessage()) {
          <div class="result-message error-result">
            <strong>Check-In Failed</strong>
            <span>{{ errorMessage() }}</span>
          </div>
        }

        @if (!checkingIn()) {
          <button
            class="home-button"
            type="button"
            (click)="goHome()"
          >
            Go to Home
          </button>
        }

      </div>

    </section>
  `,
  styleUrl: './check-in.scss'
})
export class CheckIn implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly eventService = inject(EventService);

  readonly checkingIn = signal(false);
  // qr kontrol işleminin devam edip etmediğini tutar

  readonly successMessage = signal('');
  // başarılı check-in mesajını tutar

  readonly errorMessage = signal('');
  // başarısız check-in mesajını tutar

  readonly checkedInAt = signal('');
  // başarılı check-in zamanını tutar

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    // qr kod adresindeki token query parametresini alır

    if (!token || !token.trim()) {
      this.errorMessage.set('QR code token was not found.');
      return;
    }

    this.performCheckIn(token);
  }

  private performCheckIn(token: string): void {
    if (this.checkingIn()) {
      return;
    }

    this.checkingIn.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.eventService.checkIn({
      token
    }).subscribe({
      next: response => {
        this.successMessage.set(response.message);
        this.checkedInAt.set(response.checkedInAt);
        this.checkingIn.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(
          getApiErrorMessage(
            error,
            'Check-in could not be completed.'
          )
        );

        this.checkingIn.set(false);
      }
    });
  }

  formatCheckedInAt(): string {
    const checkedInAt = this.checkedInAt();

    if (!checkedInAt) {
      return '';
    }

    return new Date(checkedInAt).toLocaleString();
    // backendden gelen utc check-in zamanını kullanıcının yerel saatine çevirir
  }

  goHome(): void {
    void this.router.navigate(['/home']);
  }
}