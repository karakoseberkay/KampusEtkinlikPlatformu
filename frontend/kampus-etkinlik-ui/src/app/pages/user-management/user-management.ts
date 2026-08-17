import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { UserResponse } from '../../core/models/api.models';
import { getApiErrorMessage } from '../../core/utils/api-error';

@Component({
  selector: 'app-user-management',
  standalone: true,
  template: `
    <h1>Kullanıcı Yönetimi</h1>

    <div>
      <label for="search">İsim Ara</label>
      <input
        id="search"
        type="text"
        placeholder="Kullanıcı adı..."
        [value]="searchText()"
        (input)="searchText.set($any($event.target).value)"
      >
    </div>

    <div>
      <label for="department">Bölüm</label>
      <select
        id="department"
        [value]="selectedDepartment()"
        (change)="selectedDepartment.set($any($event.target).value)"
      >
        <option value="">Tüm Bölümler</option>

        @for (department of departments(); track department) {
          <option [value]="department">{{ department }}</option>
        }
      </select>
    </div>

    <button type="button" (click)="clearFilters()">Filtreleri Temizle</button>
    <button type="button" (click)="loadUsers()">Yenile</button>

    @if (loading()) {
      <p>Yükleniyor...</p>
    }

    @if (errorMessage()) {
      <p>{{ errorMessage() }}</p>
    }

    @if (successMessage()) {
      <p>{{ successMessage() }}</p>
    }

    @if (!loading() && users().length === 0 && !errorMessage()) {
      <p>Kullanıcı bulunamadı.</p>
    }

    @if (!loading() && users().length > 0 && filteredUsers().length === 0) {
      <p>Arama kriterlerine uygun kullanıcı bulunamadı.</p>
    }

    @if (filteredUsers().length > 0) {
      <p>Gösterilen kullanıcı sayısı: {{ filteredUsers().length }}</p>

      <table>
        <thead>
          <tr>
            <th>Ad Soyad</th>
            <th>E-posta</th>
            <th>Bölüm</th>
            <th>Rol</th>
            <th>İşlem</th>
          </tr>
        </thead>

        <tbody>
          @for (user of filteredUsers(); track user.id) { <!-- filtreye uygun kullanıcıları tabloya basar -->
            <tr>
              <td>{{ user.fullName }}</td>
              <td>{{ user.email }}</td>

              <td>
                @if (user.email.toLowerCase() === 'manager@kampus.com') {
                  Yönetim
                } @else {
                  {{ user.department }}
                }
              </td>

              <td>
                @if (user.email.toLowerCase() === 'manager@kampus.com') {
                  Admin
                } @else {
                  {{ user.roles.join(', ') }}
                }
              </td>

              <td>
                @if (auth.currentUser()?.userId === user.id) {
                  Kendi hesabınız
                } @else {
                  @if (user.roles.includes('ClubManager')) {
                    <button
                      type="button"
                      [disabled]="processingUserId() !== null"
                      (click)="changeRole(user, 'Student')"
                    >
                      Student Yap
                    </button>
                  } @else {
                    <button
                      type="button"
                      [disabled]="processingUserId() !== null"
                      (click)="changeRole(user, 'ClubManager')"
                    >
                      ClubManager Yap
                    </button>
                  }
                }
              </td>
            </tr>
          }
        </tbody>
      </table>
    }
  `
})
export class UserManagement implements OnInit {
  readonly auth = inject(AuthService); // giriş yapan kullanıcı bilgilerine erişmemizi sağlar
  private readonly userService = inject(UserService); // kullanıcı servisindeki metodlara erişmemizi sağlar

  readonly users = signal<UserResponse[]>([]); // backendden gelen kullanıcıları tutar
  readonly searchText = signal(''); // isim aramasında kullanılan metni tutar
  readonly selectedDepartment = signal(''); // seçilen bölüm filtresini tutar
  readonly loading = signal(false); // kullanıcılar yüklenirken işlemin devam edip etmediğini tutar
  readonly processingUserId = signal<string | null>(null); // rolü değiştirilen kullanıcının idsini tutar
  readonly errorMessage = signal(''); // kullanıcıya gösterilecek hata mesajını tutar
  readonly successMessage = signal(''); // kullanıcıya gösterilecek başarılı işlem mesajını tutar

  readonly departments = computed(() => { // kullanıcıların mevcut bölümlerinden filtre seçeneklerini oluşturur
    const departments = this.users()
      .map(user => user.department)
      .filter(
        (department): department is string =>
          !!department && department.trim().length > 0
      );

    return [...new Set(departments)]
      .sort((a, b) => a.localeCompare(b, 'tr')); // aynı bölümleri tekilleştirip alfabetik sıralar
  });

  readonly filteredUsers = computed(() => { // isim ve bölüm filtresine göre gösterilecek kullanıcıları hesaplar
    const search = this.searchText()
      .trim()
      .toLocaleLowerCase('tr-TR');

    const department = this.selectedDepartment();

    return this.users().filter(user => {
      const matchesName =
        !search ||
        user.fullName.toLocaleLowerCase('tr-TR').includes(search);

      const matchesDepartment =
        !department ||
        user.department === department;

      return matchesName && matchesDepartment;
    });
  });

  ngOnInit(): void { // sayfa açıldığında kullanıcıları getirir
    this.loadUsers();
  }

  clearFilters(): void { // isim ve bölüm filtrelerini temizler
    this.searchText.set('');
    this.selectedDepartment.set('');
  }

  loadUsers(): void { // tüm kullanıcıları backendden getirir
    this.loading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.userService.getAll().subscribe({
      next: users => {
        this.users.set(users);
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(
          getApiErrorMessage(error, 'Kullanıcılar alınamadı.')
        );
        this.loading.set(false);
      }
    });
  }

  changeRole(user: UserResponse, role: 'Student' | 'ClubManager'): void { // seçilen kullanıcının rolünü değiştirir
    if (this.processingUserId() !== null) {
      return;
    }

    const approved = window.confirm(
      `${user.fullName} kullanıcısının rolü ${role} olarak değiştirilsin mi?`
    ); // rol değiştirmeden önce adminden onay alır

    if (!approved) {
      return;
    }

    this.processingUserId.set(user.id);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.userService.updateRole(user.id, { role }).subscribe({
      next: updatedUser => {
        this.users.update(users =>
          users.map(currentUser =>
            currentUser.id === updatedUser.id
              ? updatedUser
              : currentUser
          )
        ); // rolü değişen kullanıcıyı listedeki güncel haliyle değiştirir

        this.successMessage.set(
          `${updatedUser.fullName} kullanıcısının rolü ${role} olarak değiştirildi.`
        );

        this.processingUserId.set(null);
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(
          getApiErrorMessage(error, 'Kullanıcı rolü değiştirilemedi.')
        );
        this.processingUserId.set(null);
      }
    });
  }
}