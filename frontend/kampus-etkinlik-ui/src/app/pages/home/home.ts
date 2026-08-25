import { Component, inject } from '@angular/core'; // Angular componenti oluşturmak ve servis inject etmek için gerekli araçları içe aktarır.
import { RouterLink } from '@angular/router'; // Ana Sayfadaki kartlardan diğer sayfalara yönlendirme yapabilmek için kullanılır.
import { AuthService } from '../../core/services/auth.service'; // Giriş yapan kullanıcının bilgilerine ve rollerine erişmek için kullanılır.

@Component({ // Bu classın Angular componenti olduğunu belirtir.
  selector: 'app-home', // Componentin selector adını belirler.
  standalone: true, // Componentin NgModule kullanmadan bağımsız çalışmasını sağlar.
  imports: [RouterLink], // Template içerisinde routerLink kullanılmasını sağlar.
  template: `
    <!-- Ana Sayfanın tamamını kapsar -->
    <section class="home-page">
      <!-- Sayfanın üst başlık alanıdır -->
      <div class="page-header">
        <h1>Home</h1> <!-- Sayfanın ana başlığı -->
        <!-- Giriş yapan kullanıcı varsa ismiyle hoş geldin mesajı gösterir -->
        @if (auth.currentUser(); as user) {
          <p>Welcome, {{ user.fullName }}</p>
        }
      </div>

      <!-- Giriş yapan kullanıcının temel hesap bilgilerini gösterir -->
      @if (auth.currentUser(); as user) {
        <section class="user-card">
          <!-- Kullanıcı bilgileri kartının başlığıdır -->
          <div class="card-header">
            <h2>User Information</h2>
            <p>Basic information about your account.</p>
          </div>

          <!-- Kullanıcı bilgilerini üç kolon halinde gösterir -->
          <div class="user-information">
            <!-- Kullanıcının adını ve soyadını gösterir -->
            <div class="information-item">
              <span class="information-label">Full Name</span>
              <span class="information-value">{{ user.fullName }}</span>
            </div>

            <!-- Kullanıcının e-posta adresini gösterir -->
            <div class="information-item">
              <span class="information-label">Email</span>
              <span class="information-value">{{ user.email }}</span>
            </div>

            <!-- Kullanıcının sistemde sahip olduğu rolleri gösterir -->
            <div class="information-item">
              <span class="information-label">Role</span>
              <span class="information-value role-badge">{{ user.roles.join(', ') }}</span>
            </div>
          </div>
        </section>
      }

      <!-- Bütün giriş yapmış kullanıcıların kullanabileceği genel işlemleri gösterir -->
      <section class="home-section">
        <div class="section-header">
          <h2>General Actions</h2>
          <p>Quickly access the main pages of the platform.</p>
        </div>

        <!-- Genel işlem kartlarını grid şeklinde gösterir -->
        <div class="action-grid">
          <!-- Popüler Etkinlikler sayfasına yönlendirir -->
          <a class="action-card" routerLink="/popular-events">
            <div class="action-card__top">
              <span class="action-number">01</span>
              <h3>Popular Events</h3>
            </div>
            <p>View the most popular events on campus.</p>
            <span class="action-link">View Events</span>
          </a>

          <!-- Etkinlikler sayfasına yönlendirir -->
          <a class="action-card" routerLink="/events">
            <div class="action-card__top">
              <span class="action-number">02</span>
              <h3>Events</h3>
            </div>
            <p>Browse all events and view their details.</p>
            <span class="action-link">Go to Events</span>
          </a>

          <!-- Kulüpler sayfasına yönlendirir -->
          <a class="action-card" routerLink="/clubs">
            <div class="action-card__top">
              <span class="action-number">03</span>
              <h3>Clubs</h3>
            </div>
            <p>View student clubs on campus.</p>
            <span class="action-link">View Clubs</span>
          </a>
        </div>
      </section>

      <!-- Sadece Student rolündeki kullanıcılara öğrenci işlemlerini gösterir -->
      @if (auth.hasRole('Student')) {
        <section class="home-section">
          <div class="section-header">
            <h2>Student Actions</h2>
            <p>Manage your event registrations here.</p>
          </div>

          <!-- Öğrenciye özel işlem kartlarını gösterir -->
          <div class="action-grid action-grid--small">
            <!-- Etkinlik listesine giderek yeni kayıt yapılmasını sağlar -->
            <a class="action-card" routerLink="/events">
              <div class="action-card__top">
                <span class="action-number">04</span>
                <h3>Register for Event</h3>
              </div>
              <p>Select the event you want to attend and register.</p>
              <span class="action-link">Select Event</span>
            </a>

            <!-- Öğrencinin kendi kayıtlarını görüntülemesini sağlar -->
            <a class="action-card" routerLink="/my-registrations">
              <div class="action-card__top">
                <span class="action-number">05</span>
                <h3>My Registrations</h3>
              </div>
              <p>View your previous event registrations.</p>
              <span class="action-link">View My Registrations</span>
            </a>
          </div>
        </section>
      }

      <!-- Sadece ClubManager rolündeki kullanıcılara yönetici işlemlerini gösterir -->
      @if (auth.hasRole('ClubManager')) {
        <section class="home-section">
          <div class="section-header">
            <h2>Club Manager Actions</h2>
            <p>Access your club and event management tools.</p>
          </div>

          <!-- Kulüp yöneticisine özel işlem kartlarını gösterir -->
          <div class="action-grid">
            <!-- Yeni kulüp oluşturma sayfasına yönlendirir -->
            <a class="action-card" routerLink="/club-manage">
              <div class="action-card__top">
                <span class="action-number">06</span>
                <h3>Create New Club</h3>
              </div>
              <p>Create a new student club.</p>
              <span class="action-link">Create Club</span>
            </a>

            <!-- Kulüpler listesinden yöneticinin kendi kulüplerine ulaşmasını sağlar -->
            <a class="action-card" routerLink="/clubs">
              <div class="action-card__top">
                <span class="action-number">07</span>
                <h3>Manage My Clubs</h3>
              </div>
              <p>View and manage the clubs you manage.</p>
              <span class="action-link">Go to Clubs</span>
            </a>

            <!-- Yeni etkinlik oluşturma sayfasına yönlendirir -->
            <a class="action-card" routerLink="/event-manage">
              <div class="action-card__top">
                <span class="action-number">08</span>
                <h3>Create New Event</h3>
              </div>
              <p>Create a new event for your club.</p>
              <span class="action-link">Create Event</span>
            </a>

            <!-- Etkinlik listesinden yöneticinin etkinliklerini yönetmesini sağlar -->
            <a class="action-card" routerLink="/events">
              <div class="action-card__top">
                <span class="action-number">09</span>
                <h3>Manage My Events</h3>
              </div>
              <p>View, update, and manage registrations for your events.</p>
              <span class="action-link">Go to Events</span>
            </a>
          </div>
        </section>
      }
    </section>
  `,
  styleUrl: './home.scss' // Ana Sayfanın tasarımını home.scss dosyasından almasını sağlar.
})
export class HomePage { // Ana Sayfa componentinin TypeScript classıdır.
  readonly auth = inject(AuthService); // Giriş yapan kullanıcının bilgilerini ve rollerini kullanabilmek için AuthService'i enjekte eder.
}