import { Component, inject } from '@angular/core'; // Angular componenti oluşturmak ve servis inject etmek için gerekli araçları içe aktarır.
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router'; // Sayfa yönlendirmeleri, aktif link kontrolü ve route içeriğini göstermek için kullanılır.
import { AuthService } from './core/services/auth.service'; // Giriş yapan kullanıcının bilgilerine ve rol kontrollerine erişmek için kullanılır.

@Component({ // Bu classın Angular componenti olduğunu belirtir.
  selector: 'app-root', // Uygulamanın ana componentinin HTML selector adını belirler.
  standalone: true, // Componentin NgModule kullanmadan bağımsız çalışmasını sağlar.
  imports: [RouterOutlet, RouterLink, RouterLinkActive], // Template içinde router-outlet, routerLink ve routerLinkActive kullanılmasını sağlar.
  templateUrl: './app.html', // Componentin HTML dosyasını belirtir.
  styleUrl: './app.scss' // Componentin SCSS dosyasını belirtir.
})
export class App { // Uygulamanın en üst seviyedeki ana component classıdır.
  readonly auth = inject(AuthService); // Kullanıcı giriş durumu ve rol kontrolleri için AuthService'i enjekte eder.
}