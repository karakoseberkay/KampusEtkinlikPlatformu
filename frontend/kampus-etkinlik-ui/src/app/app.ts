import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service'; // giriş yapan kullanıcı bilgilerine ve rol kontrollerine erişmemizi sağlar

@Component({
  selector: 'app-root',//html etiketi
  standalone: true,//bu componentin eski Angular yapısındaki NgModulea bağlı olmadan kendi başına çalıştığını söylüyor
  imports: [RouterOutlet, RouterLink], // sayfa geçişlerini ve route içeriklerini kullanmamızı sağlar
  templateUrl: './app.html',//Bu componentin HTMLi app.html dosyasında
  styleUrl: './app.scss'
})
export class App {
  readonly auth = inject(AuthService); // AuthServicei bu component içinde kullanmamızı sağlar
}