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
        <h1>Ana Sayfa</h1> <!-- Sayfanın ana başlığı -->
        <!-- Giriş yapan kullanıcı varsa ismiyle hoş geldin mesajı gösterir -->
        @if (auth.currentUser(); as user) {
          <p>Hoş geldin, {{ user.fullName }}</p>
        }
      </div>

      <!-- Giriş yapan kullanıcının temel hesap bilgilerini gösterir -->
      @if (auth.currentUser(); as user) {
        <section class="user-card">
          <!-- Kullanıcı bilgileri kartının başlığıdır -->
          <div class="card-header">
            <h2>Kullanıcı Bilgileri</h2>
            <p>Hesabınıza ait temel bilgiler.</p>
          </div>

          <!-- Kullanıcı bilgilerini üç kolon halinde gösterir -->
          <div class="user-information">
            <!-- Kullanıcının adını ve soyadını gösterir -->
            <div class="information-item">
              <span class="information-label">Ad Soyad</span>
              <span class="information-value">{{ user.fullName }}</span>
            </div>

            <!-- Kullanıcının e-posta adresini gösterir -->
            <div class="information-item">
              <span class="information-label">E-posta</span>
              <span class="information-value">{{ user.email }}</span>
            </div>

            <!-- Kullanıcının sistemde sahip olduğu rolleri gösterir -->
            <div class="information-item">
              <span class="information-label">Rol</span>
              <span class="information-value role-badge">{{ user.roles.join(', ') }}</span>
            </div>
          </div>
        </section>
      }

      <!-- Bütün giriş yapmış kullanıcıların kullanabileceği genel işlemleri gösterir -->
      <section class="home-section">
        <div class="section-header">
          <h2>Genel İşlemler</h2>
          <p>Platformdaki temel sayfalara hızlıca ulaşabilirsiniz.</p>
        </div>

        <!-- Genel işlem kartlarını grid şeklinde gösterir -->
        <div class="action-grid">
          <!-- Popüler Etkinlikler sayfasına yönlendirir -->
          <a class="action-card" routerLink="/popular-events">
            <div class="action-card__top">
              <span class="action-number">01</span>
              <h3>Popüler Etkinlikler</h3>
            </div>
            <p>Kampüste en çok ilgi gören etkinlikleri görüntüleyin.</p>
            <span class="action-link">Etkinlikleri Gör</span>
          </a>

          <!-- Etkinlikler sayfasına yönlendirir -->
          <a class="action-card" routerLink="/events">
            <div class="action-card__top">
              <span class="action-number">02</span>
              <h3>Etkinlikler</h3>
            </div>
            <p>Tüm etkinlikleri inceleyin ve detaylarına ulaşın.</p>
            <span class="action-link">Etkinliklere Git</span>
          </a>

          <!-- Kulüpler sayfasına yönlendirir -->
          <a class="action-card" routerLink="/clubs">
            <div class="action-card__top">
              <span class="action-number">03</span>
              <h3>Kulüpler</h3>
            </div>
            <p>Kampüste bulunan öğrenci kulüplerini görüntüleyin.</p>
            <span class="action-link">Kulüpleri Gör</span>
          </a>
        </div>
      </section>

      <!-- Sadece Student rolündeki kullanıcılara öğrenci işlemlerini gösterir -->
      @if (auth.hasRole('Student')) {
        <section class="home-section">
          <div class="section-header">
            <h2>Öğrenci İşlemleri</h2>
            <p>Etkinlik kayıtlarınızı buradan yönetebilirsiniz.</p>
          </div>

          <!-- Öğrenciye özel işlem kartlarını gösterir -->
          <div class="action-grid action-grid--small">
            <!-- Etkinlik listesine giderek yeni kayıt yapılmasını sağlar -->
            <a class="action-card" routerLink="/events">
              <div class="action-card__top">
                <span class="action-number">04</span>
                <h3>Etkinliğe Kayıt Ol</h3>
              </div>
              <p>Katılmak istediğiniz etkinliği seçerek kayıt oluşturun.</p>
              <span class="action-link">Etkinlik Seç</span>
            </a>

            <!-- Öğrencinin kendi kayıtlarını görüntülemesini sağlar -->
            <a class="action-card" routerLink="/my-registrations">
              <div class="action-card__top">
                <span class="action-number">05</span>
                <h3>Kayıtlarım</h3>
              </div>
              <p>Daha önce yaptığınız etkinlik kayıtlarını görüntüleyin.</p>
              <span class="action-link">Kayıtlarımı Gör</span>
            </a>
          </div>
        </section>
      }

      <!-- Sadece ClubManager rolündeki kullanıcılara yönetici işlemlerini gösterir -->
      @if (auth.hasRole('ClubManager')) {
        <section class="home-section">
          <div class="section-header">
            <h2>Kulüp Yöneticisi İşlemleri</h2>
            <p>Kulüp ve etkinlik yönetim işlemlerinize ulaşabilirsiniz.</p>
          </div>

          <!-- Kulüp yöneticisine özel işlem kartlarını gösterir -->
          <div class="action-grid">
            <!-- Yeni kulüp oluşturma sayfasına yönlendirir -->
            <a class="action-card" routerLink="/club-manage">
              <div class="action-card__top">
                <span class="action-number">06</span>
                <h3>Yeni Kulüp Oluştur</h3>
              </div>
              <p>Yeni bir öğrenci kulübü oluşturun.</p>
              <span class="action-link">Kulüp Oluştur</span>
            </a>

            <!-- Kulüpler listesinden yöneticinin kendi kulüplerine ulaşmasını sağlar -->
            <a class="action-card" routerLink="/clubs">
              <div class="action-card__top">
                <span class="action-number">07</span>
                <h3>Kulüplerimi Yönet</h3>
              </div>
              <p>Yöneticisi olduğunuz kulüpleri görüntüleyin ve yönetin.</p>
              <span class="action-link">Kulüplere Git</span>
            </a>

            <!-- Yeni etkinlik oluşturma sayfasına yönlendirir -->
            <a class="action-card" routerLink="/event-manage">
              <div class="action-card__top">
                <span class="action-number">08</span>
                <h3>Yeni Etkinlik Oluştur</h3>
              </div>
              <p>Kulübünüz adına yeni bir etkinlik oluşturun.</p>
              <span class="action-link">Etkinlik Oluştur</span>
            </a>

            <!-- Etkinlik listesinden yöneticinin etkinliklerini yönetmesini sağlar -->
            <a class="action-card" routerLink="/events">
              <div class="action-card__top">
                <span class="action-number">09</span>
                <h3>Etkinliklerimi Yönet</h3>
              </div>
              <p>Etkinliklerinizi görüntüleyin, güncelleyin ve kayıtlarını yönetin.</p>
              <span class="action-link">Etkinliklere Git</span>
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