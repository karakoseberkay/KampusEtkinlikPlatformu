import { bootstrapApplication } from '@angular/platform-browser'; // angular uygulamasını başlatmamızı sağlar
import { appConfig } from './app/app.config'; // uygulamanın genel ayarlarına erişmemizi sağlar
import { App } from './app/app'; // uygulamanın ana componentine erişmemizi sağlar

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
 // App componentini appConfig ayarlarıyla beraber başlatır
   // uygulama başlarken hata oluşursa consolea yazdırır