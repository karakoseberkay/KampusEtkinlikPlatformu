import { Component, computed, inject, OnInit, signal } from '@angular/core'; // Component, computed, servis enjeksiyonu, OnInit ve signal yapılarını kullanmak için gerekli Angular araçlarını içe aktarır.
import { HttpErrorResponse } from '@angular/common/http'; // Backendden gelen HTTP hatalarını yakalamak için kullanılır.
import { AuthService } from '../../core/services/auth.service'; // Giriş yapan kullanıcının bilgilerine erişmek için kullanılır.
import { UserService } from '../../core/services/user.service'; // Kullanıcı listesini almak ve kullanıcı rolünü değiştirmek için kullanılır.
import { UserResponse } from '../../core/models/api.models'; // Backendden gelen kullanıcı nesnesinin TypeScript tipidir.
import { getApiErrorMessage } from '../../core/utils/api-error'; // Backend hatalarını kullanıcıya gösterilecek anlaşılır mesaja dönüştürür.

@Component({ // Bu classın Angular componenti olduğunu belirtir.
  selector: 'app-user-management', // Componentin selector adını belirler.
  standalone: true, // Componentin herhangi bir NgModule olmadan bağımsız çalışmasını sağlar.
  template: `
    <!-- Kullanıcı Yönetimi sayfasının tamamını kapsar -->
    <section class="user-management-page">

      <!-- Sayfanın üst başlık alanıdır -->
      <div class="page-header">
        <div>
          <h1>Kullanıcı Yönetimi</h1> <!-- Sayfanın ana başlığını gösterir. -->
          <p>Kullanıcıları görüntüleyebilir, filtreleyebilir ve rollerini yönetebilirsiniz.</p> <!-- Sayfanın kısa açıklamasını gösterir. -->
        </div>

        <!-- Kullanıcı listesini backendden tekrar çekmek için kullanılır -->
        <button class="refresh-button" type="button" [disabled]="loading()" (click)="loadUsers()">
          {{ loading() ? 'Yükleniyor...' : 'Kullanıcıları Yenile' }}
        </button>
      </div>

      <!-- Kullanıcı arama ve bölüm filtresini kapsar -->
      <section class="filter-card">
        <div class="filter-header">
          <h2>Arama ve Filtreleme</h2> <!-- Filtre bölümünün başlığını gösterir. -->
          <p>Kullanıcıları isim veya bölümlerine göre filtreleyebilirsiniz.</p> <!-- Filtre bölümünün ne işe yaradığını açıklar. -->
        </div>

        <!-- Filtre alanlarını içerir -->
        <div class="filter-content">

          <!-- Kullanıcı adına göre arama alanıdır -->
          <div class="form-field">
            <label for="search">İsim Ara</label> <!-- Arama inputunun açıklamasıdır. -->
            <input
              id="search"
              type="text"
              placeholder="Kullanıcı adı..."
              [value]="searchText()"
              (input)="searchText.set($any($event.target).value)"
            >
          </div>

          <!-- Kullanıcıları bölüme göre filtrelemek için kullanılır -->
          <div class="form-field">
            <label for="department">Bölüm</label> <!-- Bölüm select alanının açıklamasıdır. -->
            <select
              id="department"
              [value]="selectedDepartment()"
              (change)="selectedDepartment.set($any($event.target).value)"
            >
              <option value="">Tüm Bölümler</option> <!-- Herhangi bir bölüm filtresi uygulanmamasını sağlar. -->

              <!-- Kullanıcılardan oluşturulan benzersiz bölüm listesini select içine ekler -->
              @for (department of departments(); track department) {
                <option [value]="department">{{ department }}</option>
              }
            </select>
          </div>

          <!-- Filtreleri temizleme butonunu içerir -->
          <div class="filter-actions">
            <button class="clear-button" type="button" (click)="clearFilters()">
              Filtreleri Temizle
            </button>
          </div>

        </div>
      </section>

      <!-- Backend isteği devam ederken ve kullanıcı listesi henüz boşsa gösterilir -->
      @if (loading() && users().length === 0) {
        <div class="page-message">
          Kullanıcılar yükleniyor...
        </div>
      }

      <!-- Backend isteğinde hata oluşursa gösterilir -->
      @if (errorMessage()) {
        <div class="page-message error-message">
          {{ errorMessage() }}
        </div>
      }

      <!-- Rol değiştirme işlemi başarılı olduğunda gösterilir -->
      @if (successMessage()) {
        <div class="page-message success-message">
          {{ successMessage() }}
        </div>
      }

      <!-- Backendden hiç kullanıcı gelmediyse gösterilir -->
      @if (!loading() && users().length === 0 && !errorMessage()) {
        <div class="empty-card">
          Kullanıcı bulunamadı.
        </div>
      }

      <!-- Kullanıcılar var ancak seçilen filtreye uygun kullanıcı yoksa gösterilir -->
      @if (!loading() && users().length > 0 && filteredUsers().length === 0) {
        <div class="empty-card">
          Arama kriterlerine uygun kullanıcı bulunamadı.
        </div>
      }

      <!-- Filtre sonucunda gösterilecek en az bir kullanıcı varsa tabloyu gösterir -->
      @if (filteredUsers().length > 0) {
        <section class="users-section">

          <!-- Kullanıcı listesinin üst bilgisidir -->
          <div class="section-header">
            <h2>Kullanıcı Listesi</h2> <!-- Liste bölümünün başlığını gösterir. -->
            <p>Toplam {{ filteredUsers().length }} kullanıcı görüntüleniyor.</p> <!-- Filtre sonucunda ekranda bulunan kullanıcı sayısını gösterir. -->
          </div>

          <!-- Kullanıcı tablosunu kart içerisinde tutar -->
          <div class="table-card">
            <!-- Küçük ekranlarda tablonun yatay kaydırılabilmesini sağlar -->
            <div class="table-wrapper">

              <!-- Kullanıcıların gösterildiği tablo -->
              <table class="users-table">

                <!-- Tablo kolon başlıkları -->
                <thead>
                  <tr>
                    <th>Ad Soyad</th> <!-- Kullanıcının ad ve soyadını gösterir. -->
                    <th>E-posta</th> <!-- Kullanıcının e-posta adresini gösterir. -->
                    <th>Bölüm</th> <!-- Kullanıcının bölümünü gösterir. -->
                    <th>Rol</th> <!-- Kullanıcının sistemdeki rolünü gösterir. -->
                    <th>İşlem</th> <!-- Kullanıcının rolünü değiştirme işlemini içerir. -->
                  </tr>
                </thead>

                <!-- Filtrelenmiş kullanıcı listesini tabloya basar -->
                <tbody>
                  @for (user of filteredUsers(); track user.id) {
                    <tr>

                      <!-- Kullanıcının adını ve soyadını gösterir -->
                      <td class="user-name">
                        {{ user.fullName }}
                      </td>

                      <!-- Kullanıcının e-posta adresini gösterir -->
                      <td>
                        {{ user.email }}
                      </td>

                      <!-- Admin hesabında normal bölüm yerine Yönetim yazar -->
                      <td>
                        @if (user.email.toLowerCase() === 'manager@kampus.com') {
                          <span class="department-admin">Yönetim</span>
                        } @else {
                          {{ user.department || '-' }}
                        }
                      </td>

                      <!-- Kullanıcının rolünü Türkçe ve renkli etiket şeklinde gösterir -->
                      <td>
                        @if (user.email.toLowerCase() === 'manager@kampus.com') {
                          <span class="role-badge role-admin">Admin</span>
                        } @else if (user.roles.includes('ClubManager')) {
                          <span class="role-badge role-manager">Kulüp Yöneticisi</span>
                        } @else {
                          <span class="role-badge role-student">Öğrenci</span>
                        }
                      </td>

                      <!-- Kullanıcı üzerinde yapılabilecek işlemleri gösterir -->
                      <td>

                        <!-- Giriş yapan admin kendi hesabının rolünü değiştiremez -->
                        @if (auth.currentUser()?.userId === user.id) {
                          <span class="own-account">Kendi hesabınız</span>
                        } @else {

                          <!-- Kullanıcı ClubManager ise Student rolüne düşürme butonu gösterilir -->
                          @if (user.roles.includes('ClubManager')) {
                            <button
                              class="role-button student-button"
                              type="button"
                              [disabled]="processingUserId() !== null"
                              (click)="changeRole(user, 'Student')"
                            >
                              {{ processingUserId() === user.id ? 'İşleniyor...' : 'Öğrenci Yap' }}
                            </button>
                          } @else {

                            <!-- Kullanıcı Student ise ClubManager rolüne yükseltme butonu gösterilir -->
                            <button
                              class="role-button manager-button"
                              type="button"
                              [disabled]="processingUserId() !== null"
                              (click)="changeRole(user, 'ClubManager')"
                            >
                              {{ processingUserId() === user.id ? 'İşleniyor...' : 'Kulüp Yöneticisi Yap' }}
                            </button>
                          }

                        }

                      </td>

                    </tr>
                  }
                </tbody>

              </table>
            </div>
          </div>

        </section>
      }

    </section>
  `,
  styleUrl: './user-management.scss' // Bu componentin tasarımını user-management.scss dosyasından almasını sağlar.
})
export class UserManagement implements OnInit { // Kullanıcı Yönetimi sayfasının TypeScript classıdır ve OnInit yaşam döngüsünü kullanır.
  readonly auth = inject(AuthService); // Giriş yapan kullanıcının bilgilerine erişmek için AuthService'i enjekte eder.
  private readonly userService = inject(UserService); // Kullanıcı işlemlerini gerçekleştirmek için UserService'i enjekte eder.

  readonly users = signal<UserResponse[]>([]); // Backendden gelen bütün kullanıcıları tutar.
  readonly searchText = signal(''); // İsim arama alanına yazılan metni tutar.
  readonly selectedDepartment = signal(''); // Seçilen bölüm filtresini tutar.
  readonly loading = signal(false); // Kullanıcılar yüklenirken işlemin devam edip etmediğini tutar.
  readonly processingUserId = signal<string | null>(null); // Rolü değiştirilen kullanıcının ID değerini tutar.
  readonly errorMessage = signal(''); // Kullanıcıya gösterilecek hata mesajını tutar.
  readonly successMessage = signal(''); // Kullanıcıya gösterilecek başarılı işlem mesajını tutar.

  readonly departments = computed(() => { // Backendden gelen kullanıcılara göre bölüm filtre seçeneklerini otomatik oluşturur.
    const departments = this.users() // Kullanıcı listesini alır.
      .map(user => user.department) // Her kullanıcının sadece bölüm bilgisini alır.
      .filter((department): department is string => !!department && department.trim().length > 0); // Boş veya null bölüm bilgilerini listeden çıkarır.

    return [...new Set(departments)] // Aynı bölümün birden fazla kez görünmesini engelleyerek benzersiz bir liste oluşturur.
      .sort((a, b) => a.localeCompare(b, 'tr')); // Bölümleri Türkçe alfabetik sıraya göre sıralar.
  });

  readonly filteredUsers = computed(() => { // İsim ve bölüm filtresine göre ekranda gösterilecek kullanıcıları hesaplar.
    const search = this.searchText().trim().toLocaleLowerCase('tr-TR'); // Arama metnindeki boşlukları temizler ve büyük-küçük harf farkını kaldırır.
    const department = this.selectedDepartment(); // Kullanıcının seçtiği bölüm filtresini alır.

    return this.users().filter(user => { // Bütün kullanıcıları filtre koşullarına göre tek tek kontrol eder.
      const matchesName = !search || user.fullName.toLocaleLowerCase('tr-TR').includes(search); // Arama boşsa herkesi kabul eder, doluysa adı aranan metni içeriyor mu kontrol eder.
      const matchesDepartment = !department || user.department === department; // Bölüm seçilmediyse herkesi kabul eder, seçildiyse kullanıcının bölümüyle karşılaştırır.
      return matchesName && matchesDepartment; // Kullanıcının gösterilmesi için hem isim hem bölüm koşulunun sağlanmasını ister.
    });
  });


  ngOnInit(): void { // Sayfa ilk açıldığında otomatik olarak çalışır.
    this.loadUsers(); // Backendden bütün kullanıcıları getirir.
  }


  clearFilters(): void { // Kullanıcının seçtiği isim ve bölüm filtrelerini temizler.
    this.searchText.set(''); // İsim arama kutusunu temizler.
    this.selectedDepartment.set(''); // Bölüm seçimini Tüm Bölümler durumuna getirir.
  }


  loadUsers(): void { // Backendden bütün kullanıcıları getiren metottur.
    this.loading.set(true); // Backend isteğinin başladığını belirtir.
    this.errorMessage.set(''); // Önceki hata mesajını temizler.
    this.successMessage.set(''); // Önceki başarı mesajını temizler.

    this.userService.getAll().subscribe({ // UserService içindeki getAll metoduyla backendden kullanıcı listesini ister.
      next: users => { // Backend isteği başarılı olduğunda çalışır.
        this.users.set(users); // Backendden gelen kullanıcıları users signalına aktarır.
        this.loading.set(false); // Yükleme işleminin tamamlandığını belirtir.
      },
      error: (error: HttpErrorResponse) => { // Backend isteği hata verdiğinde çalışır.
        this.errorMessage.set(
          getApiErrorMessage(error, 'Kullanıcılar alınamadı.') // Backend hatasını kullanıcıya gösterilecek anlaşılır mesaja dönüştürür.
        );
        this.loading.set(false); // Hata olsa bile yükleme işlemini sonlandırır.
      }
    });
  }


  changeRole(user: UserResponse, role: 'Student' | 'ClubManager'): void { // Seçilen kullanıcının rolünü Student veya ClubManager olarak değiştirir.
    if (this.processingUserId() !== null) { // Başka bir kullanıcı üzerinde rol değiştirme işlemi devam ediyorsa kontrol içerisine girer.
      return; // Aynı anda ikinci bir rol değiştirme isteği gönderilmesini engeller.
    }

    const roleName = role === 'Student' ? 'Öğrenci' : 'Kulüp Yöneticisi'; // Backenddeki İngilizce rol değerini kullanıcıya gösterilecek Türkçe metne dönüştürür.
    const approved = window.confirm(`${user.fullName} kullanıcısının rolü ${roleName} olarak değiştirilsin mi?`); // Rol değiştirilmeden önce adminden onay ister.

    if (!approved) { // Admin onay penceresinde vazgeçerse kontrol içerisine girer.
      return; // Rol değiştirme işlemini iptal eder.
    }

    this.processingUserId.set(user.id); // İşlem yapılan kullanıcının IDsini kaydederek diğer butonları geçici olarak devre dışı bırakır.
    this.errorMessage.set(''); // Önceki hata mesajını temizler.
    this.successMessage.set(''); // Önceki başarı mesajını temizler.

    this.userService.updateRole(user.id, { role }).subscribe({ // Kullanıcının IDsi ve yeni rolünü backend'e gönderir.
      next: updatedUser => { // Rol değiştirme işlemi başarılı olduğunda çalışır.
        this.users.update(users => // Kullanıcı listesinin güncel halini oluşturur.
          users.map(currentUser => // Listedeki bütün kullanıcıları tek tek dolaşır.
            currentUser.id === updatedUser.id ? updatedUser : currentUser // Rolü değişen kullanıcıyı backendden dönen güncel kullanıcıyla değiştirir.
          )
        );

        this.successMessage.set(`${updatedUser.fullName} kullanıcısının rolü ${roleName} olarak değiştirildi.`); // Kullanıcıya başarılı işlem mesajı gösterir.
        this.processingUserId.set(null); // Rol değiştirme işleminin bittiğini belirterek butonları tekrar kullanılabilir yapar.
      },
      error: (error: HttpErrorResponse) => { // Backend rol değiştirme isteği hata verdiğinde çalışır.
        this.errorMessage.set(
          getApiErrorMessage(error, 'Kullanıcı rolü değiştirilemedi.') // Backend hatasını kullanıcıya gösterilecek anlaşılır mesaja dönüştürür.
        );
        this.processingUserId.set(null); // Hata sonrasında butonların tekrar kullanılabilmesini sağlar.
      }
    });
  }
}