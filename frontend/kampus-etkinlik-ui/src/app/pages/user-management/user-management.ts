import { Component, computed, inject, OnInit, signal } from '@angular/core'; // Component, computed, inject, OnInit ve signal yapılarını kullanmak için
import { HttpErrorResponse } from '@angular/common/http'; // Backendden gelen HTTP hatalarını yakalamak için
import { AuthService } from '../../core/services/auth.service'; // Giriş yapan kullanıcının bilgilerine erişmek için
import { UserService } from '../../core/services/user.service'; // Kullanıcıları almak ve rollerini değiştirmek için
import { UserResponse } from '../../core/models/api.models'; // Backendden gelen kullanıcı modelini kullanmak için
import { getApiErrorMessage } from '../../core/utils/api-error'; // Backend hatalarını anlaşılır mesaja çevirmek için

@Component({ // Bu classın Angular componenti olduğunu belirtir
  selector: 'app-user-management', // Componentin selector adı
  standalone: true, // Componentin NgModule olmadan bağımsız çalışmasını sağlar
  template: `
    <!-- Kullanıcı Yönetimi sayfası -->
    <section class="user-management-page">

      <!-- Sayfa başlığı -->
      <div class="page-header">
        <div>
          <h1>User Management</h1>
          <p>View, filter, and manage user roles.</p>
        </div>

        <!-- Kullanıcı listesini yeniden yükler -->
        <button class="refresh-button" type="button" [disabled]="loading()" (click)="loadUsers()">
          {{ loading() ? 'Loading...' : 'Refresh Users' }}
        </button>
      </div>

      <!-- Arama ve filtreleme alanı -->
      <section class="filter-card">
        <div class="filter-header">
          <h2>Search and Filter</h2>
          <p>Filter users by name or department.</p>
        </div>

        <div class="filter-content">

          <!-- Kullanıcı adına göre arama -->
          <div class="form-field">
            <label for="search">Search by Name</label>
            <input
              id="search"
              type="text"
              placeholder="User name..."
              [value]="searchText()"
              (input)="searchText.set($any($event.target).value)"
            >
          </div>

          <!-- Bölüme göre filtreleme -->
          <div class="form-field">
            <label for="department">Department</label>
            <select
              id="department"
              [value]="selectedDepartment()"
              (change)="selectedDepartment.set($any($event.target).value)"
            >
              <option value="">All Departments</option>

              <!-- Benzersiz bölüm listesini select içine ekler -->
              @for (department of departments(); track department) {
                <option [value]="department">{{ department }}</option>
              }
            </select>
          </div>

          <!-- Filtreleri temizler -->
          <div class="filter-actions">
            <button class="clear-button" type="button" (click)="clearFilters()">
              Clear Filters
            </button>
          </div>
        </div>
      </section>

      <!-- Kullanıcılar yüklenirken gösterilir -->
      @if (loading() && users().length === 0) {
        <div class="page-message">
          Users are loading...
        </div>
      }

      <!-- Hata mesajı -->
      @if (errorMessage()) {
        <div class="page-message error-message">
          {{ errorMessage() }}
        </div>
      }

      <!-- Başarılı işlem mesajı -->
      @if (successMessage()) {
        <div class="page-message success-message">
          {{ successMessage() }}
        </div>
      }

      <!-- Backendden hiç kullanıcı gelmediyse gösterilir -->
      @if (!loading() && users().length === 0 && !errorMessage()) {
        <div class="empty-card">
          No users found.
        </div>
      }

      <!-- Filtre sonucunda kullanıcı bulunamazsa gösterilir -->
      @if (!loading() && users().length > 0 && filteredUsers().length === 0) {
        <div class="empty-card">
          No users match the search criteria.
        </div>
      }

      <!-- Kullanıcı listesi -->
      @if (filteredUsers().length > 0) {
        <section class="users-section">

          <!-- Liste başlığı -->
          <div class="section-header">
            <h2>User List</h2>
            <p>Showing {{ filteredUsers().length }} users.</p>
          </div>

          <!-- Kullanıcı tablosu -->
          <div class="table-card">
            <div class="table-wrapper">
              <table class="users-table">
                <thead>
                  <tr>
                    <th>Full Name</th>
                    <th>Email</th>
                    <th>Department</th>
                    <th>Role</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  <!-- Filtrelenmiş kullanıcıları tek tek tabloya ekler -->
                  @for (user of filteredUsers(); track user.id) {
                    <tr>
                      <td class="user-name">{{ user.fullName }}</td> <!-- Kullanıcının adı ve soyadı -->
                      <td>{{ user.email }}</td> <!-- Kullanıcının e-posta adresi -->

                      <!-- Admin hesabında bölüm yerine Yönetim gösterilir -->
                      <td>
                        @if (user.email.toLowerCase() === 'manager@kampus.com') {
                          <span class="department-admin">Management</span>
                        } @else {
                          {{ user.department || '-' }}
                        }
                      </td>

                      <!-- Kullanıcının rolünü Türkçe gösterir -->
                      <td>
                        @if (user.email.toLowerCase() === 'manager@kampus.com') {
                          <span class="role-badge role-admin">Admin</span>
                        } @else if (user.roles.includes('ClubManager')) {
                          <span class="role-badge role-manager">Club Manager</span>
                        } @else {
                          <span class="role-badge role-student">Student</span>
                        }
                      </td>

                      <!-- Rol değiştirme işlemleri -->
                      <td>

                        <!-- Admin kendi hesabının rolünü değiştiremez -->
                        @if (auth.currentUser()?.userId === user.id) {
                          <span class="own-account">Your account</span>
                        } @else {

                          <!-- ClubManager kullanıcısını Student yapar -->
                          @if (user.roles.includes('ClubManager')) {
                            <button
                              class="role-button student-button"
                              type="button"
                              [disabled]="processingUserId() !== null"
                              (click)="changeRole(user, 'Student')"
                            >
                              {{ processingUserId() === user.id ? 'Processing...' : 'Make Student' }}
                            </button>
                          } @else {

                            <!-- Student kullanıcısını ClubManager yapar -->
                            <button
                              class="role-button manager-button"
                              type="button"
                              [disabled]="processingUserId() !== null"
                              (click)="changeRole(user, 'ClubManager')"
                            >
                              {{ processingUserId() === user.id ? 'Processing...' : 'Make Club Manager' }}
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
  styleUrl: './user-management.scss' // Componentin tasarım dosyası
})
export class UserManagement implements OnInit {
  readonly auth = inject(AuthService); // Giriş yapan kullanıcının bilgilerine erişmek için
  private readonly userService = inject(UserService); // Kullanıcı işlemlerini gerçekleştirmek için

  readonly users = signal<UserResponse[]>([]); // Backendden gelen kullanıcı listesini tutar
  readonly searchText = signal(''); // İsim arama alanındaki metni tutar
  readonly selectedDepartment = signal(''); // Seçilen bölüm filtresini tutar
  readonly loading = signal(false); // Kullanıcıların yüklenme durumunu tutar
  readonly processingUserId = signal<string | null>(null); // Rolü değiştirilen kullanıcının IDsini tutar
  readonly errorMessage = signal(''); // Kullanıcıya gösterilecek hata mesajını tutar
  readonly successMessage = signal(''); // Kullanıcıya gösterilecek başarı mesajını tutar

  readonly departments = computed(() => { // Kullanıcılara göre benzersiz bölüm listesini oluşturur
    const departments = this.users() // Kullanıcı listesini alır
      .map(user => user.department) // Her kullanıcının bölüm bilgisini alır
      .filter((department): department is string => !!department && department.trim().length > 0); // Boş bölüm bilgilerini çıkarır

    return [...new Set(departments)] // Aynı bölümlerin tekrar etmesini engeller
      .sort((a, b) => a.localeCompare(b, 'tr')); // Bölümleri Türkçe alfabetik sıralar
  });

  readonly filteredUsers = computed(() => { // İsim ve bölüm filtresine göre kullanıcı listesini hesaplar
    const search = this.searchText().trim().toLocaleLowerCase('tr-TR'); // Arama metnini temizler ve küçük harfe çevirir
    const department = this.selectedDepartment(); // Seçilen bölüm filtresini alır

    return this.users().filter(user => { // Kullanıcıları filtre koşullarına göre kontrol eder
      const matchesName = !search || user.fullName.toLocaleLowerCase('tr-TR').includes(search); // İsim filtresinin eşleşip eşleşmediğini kontrol eder
      const matchesDepartment = !department || user.department === department; // Bölüm filtresinin eşleşip eşleşmediğini kontrol eder
      return matchesName && matchesDepartment; // İki koşul da uygunsa kullanıcıyı listede gösterir
    });
  });

  ngOnInit(): void { // Sayfa ilk açıldığında otomatik çalışır
    this.loadUsers(); // Backendden kullanıcı listesini getirir
  }

  clearFilters(): void { // İsim ve bölüm filtrelerini temizler
    this.searchText.set(''); // İsim arama alanını temizler
    this.selectedDepartment.set(''); // Bölüm filtresini temizler
  }

  loadUsers(): void { // Backendden bütün kullanıcıları getirir
    this.loading.set(true); // Yükleme işlemini başlatır
    this.errorMessage.set(''); // Önceki hata mesajını temizler
    this.successMessage.set(''); // Önceki başarı mesajını temizler

    this.userService.getAll().subscribe({ // UserService üzerinden kullanıcı listesini ister
      next: users => { // Backend isteği başarılı olduğunda çalışır
        this.users.set(users); // Gelen kullanıcıları signal içerisine kaydeder
        this.loading.set(false); // Yükleme işlemini bitirir
      },
      error: (error: HttpErrorResponse) => { // Backend isteğinde hata oluşursa çalışır
        this.errorMessage.set(
          getApiErrorMessage(error, 'Could not load users.') // Backend hatasını kullanıcıya uygun mesaja çevirir
        );
        this.loading.set(false); // Hata olsa bile yükleme işlemini bitirir
      }
    });
  }

  changeRole(user: UserResponse, role: 'Student' | 'ClubManager'): void { // Kullanıcının rolünü değiştirir
    if (this.processingUserId() !== null) { // Başka bir rol değiştirme işlemi devam ediyorsa
      return; // Yeni işlem başlatılmasını engeller
    }

    const roleName = role === 'Student' ? 'Student' : 'Club Manager'; // Rol adını kullanıcıya Türkçe göstermek için
    const approved = window.confirm(`Change ${user.fullName}'s role to ${roleName}?`); // Admin kullanıcıdan onay ister

    if (!approved) { // Admin işlemi onaylamadıysa
      return; // Rol değiştirmeyi iptal eder
    }

    this.processingUserId.set(user.id); // İşlem yapılan kullanıcının IDsini kaydeder
    this.errorMessage.set(''); // Önceki hata mesajını temizler
    this.successMessage.set(''); // Önceki başarı mesajını temizler

    this.userService.updateRole(user.id, { role }).subscribe({ // Kullanıcı IDsi ve yeni rolü backend'e gönderir
      next: updatedUser => { // Rol değiştirme başarılı olduğunda çalışır
        this.users.update(users => // Kullanıcı listesini günceller
          users.map(currentUser => // Listedeki kullanıcıları tek tek dolaşır
            currentUser.id === updatedUser.id ? updatedUser : currentUser // Değişen kullanıcıyı güncel verisiyle değiştirir
          )
        );

        this.successMessage.set(`${updatedUser.fullName}'s role was changed to ${roleName}.`); // Başarı mesajını gösterir
        this.processingUserId.set(null); // Rol değiştirme işlemini bitirir
      },
      error: (error: HttpErrorResponse) => { // Rol değiştirme isteğinde hata oluşursa çalışır
        this.errorMessage.set(
          getApiErrorMessage(error, 'Could not change the user role.') // Backend hatasını anlaşılır mesaja çevirir
        );
        this.processingUserId.set(null); // Hata sonrası butonları tekrar aktif eder
      }
    });
  }
}