export type EventVisibility = 'Public' | 'ApprovalRequired'; // etkinliğin alabileceği katılım tiplerini sınırlandırır Public direkt katılım ApprovalRequired ise onay gerektirir

export type EventStatus = 'Active' | 'Cancelled'; // etkinliğin sadece aktif veya iptal durumlarından birini almasını sağlar

export type RegistrationApprovalStatus = 'Pending' | 'Approved' | 'Rejected'; // etkinlik kaydının beklemede onaylı veya reddedilmiş durumlarından birini almasını sağlar

export interface ClubResponse { // backendden dönen kulüp bilgilerini tutar
  id: number; // kulübün benzersiz idsini tutar
  name: string; // kulübün adını tutar
  description: string | null; // kulübün açıklamasını tutar açıklama yoksa null olabilir
  logoUrl: string | null; // kulübün logo adresini tutar logo yoksa null olabilir
  managerUserId: string; // kulübü yöneten kullanıcının Identity idsini tutar
  managerFullName: string; // kulüp yöneticisinin ad soyad bilgisini tutar
  eventCount: number; // kulübün toplam etkinlik sayısını tutar
}

export interface CreateClubRequest { // kulüp oluştururken backende gönderilecek verileri tutar
  name: string; // oluşturulacak kulübün adını gönderir
  description: string | null; // kulüp açıklamasını gönderir açıklama olmayabilir
  logoUrl: string | null; // kulüp logo adresini gönderir logo olmayabilir
}

export interface UpdateClubRequest { // kulüp güncellerken backende gönderilecek verileri tutar
  name: string; // kulübün güncel adını gönderir
  description: string | null; // kulübün güncel açıklamasını gönderir
  logoUrl: string | null; // kulübün güncel logo adresini gönderir
}

export interface ClubEventStatsResponse { // kulübün etkinlik bazlı istatistiklerini tutar
  eventId: number; // istatistiği gösterilen etkinliğin idsini tutar
  title: string; // etkinliğin başlığını tutar
  startDate: string; // etkinliğin başlangıç tarihini tutar
  status: EventStatus; // etkinliğin aktif veya iptal durumunu tutar
  capacity: number; // etkinliğin maksimum kapasitesini tutar
  approvedRegistrationCount: number; // etkinliğin onaylanmış kayıt sayısını tutar
  pendingRegistrationCount: number; // etkinliğin bekleyen kayıt sayısını tutar
  rejectedRegistrationCount: number; // etkinliğin reddedilmiş kayıt sayısını tutar
  registrationRate: number; // etkinliğin kapasitesine göre kayıt doluluk oranını tutar
}

export interface ClubStatsResponse { // backendden dönen genel kulüp istatistiklerini tutar
  clubId: number; // kulübün idsini tutar
  clubName: string; // kulübün adını tutar
  totalEventCount: number; // kulübün toplam etkinlik sayısını tutar
  activeEventCount: number; // aktif etkinlik sayısını tutar
  cancelledEventCount: number; // iptal edilmiş etkinlik sayısını tutar
  totalApprovedRegistrationCount: number; // bütün etkinliklerdeki toplam onaylı kayıt sayısını tutar
  totalPendingRegistrationCount: number; // bütün etkinliklerdeki toplam bekleyen kayıt sayısını tutar
  totalRejectedRegistrationCount: number; // bütün etkinliklerdeki toplam reddedilen kayıt sayısını tutar
  overallRegistrationRate: number; // kulübün bütün etkinliklerinin genel kayıt doluluk oranını tutar
  totalAttendanceEligibleRegistrationCount: number; // başlamış ve iptal edilmemiş etkinliklerdeki toplam onaylı kayıt sayısını tutar
  totalCheckedInRegistrationCount: number; // qr ile gerçekten check-in yapan toplam kayıt sayısını tutar
  totalAbsentRegistrationCount: number; // onaylı kaydı olup qr ile check-in yapmayan toplam kayıt sayısını tutar
  overallAttendanceRate: number; // gerçekten katılanların değerlendirilen kayıtlar içindeki yüzdesini tutar
  events: ClubEventStatsResponse[]; // kulübün her etkinliğine ait istatistikleri liste halinde tutar
}

export interface EventResponse { // backendden dönen etkinlik bilgilerini tutar
  id: number; // etkinliğin benzersiz idsini tutar
  clubId: number; // etkinliği oluşturan kulübün idsini tutar
  clubName: string; // etkinliği oluşturan kulübün adını tutar
  title: string; // etkinliğin başlığını tutar
  description: string; // etkinliğin açıklamasını tutar
  startDate: string; // etkinliğin başlangıç tarihini tutar
  location: string; // etkinliğin yapılacağı konumu tutar
  capacity: number; // etkinliğin maksimum katılımcı sayısını tutar
  category: string; // etkinliğin kategorisini tutar
  visibility: EventVisibility; // etkinliğe direkt mi yoksa onayla mı katılım yapılacağını tutar
  status: EventStatus; // etkinliğin aktif veya iptal durumunu tutar
  createdAt: string; // etkinliğin oluşturulduğu zamanı tutar
}

export interface PopularEventResponse { // backendden dönen popüler etkinlik bilgilerini tutar
  id: number; // etkinliğin idsini tutar
  clubId: number; // etkinliği oluşturan kulübün idsini tutar
  clubName: string; // etkinliği oluşturan kulübün adını tutar
  title: string; // etkinliğin başlığını tutar
  startDate: string; // etkinliğin başlangıç tarihini tutar
  location: string; // etkinliğin yapılacağı konumu tutar
  category: string; // etkinliğin kategorisini tutar
  visibility: EventVisibility; // etkinliğin katılım tipini tutar
  capacity: number; // etkinliğin toplam kapasitesini tutar
  approvedRegistrationCount: number; // etkinliğe onaylanmış kayıt sayısını tutar
  remainingCapacity: number; // etkinlikte kalan boş kontenjan sayısını tutar
  registrationRate: number; // etkinliğin kapasitesine göre doluluk oranını tutar
}

export interface CreateEventRequest { // etkinlik oluştururken backende gönderilecek verileri tutar
  clubId: number; // etkinliği oluşturacak kulübün idsini gönderir
  title: string; // etkinliğin başlığını gönderir
  description: string; // etkinliğin açıklamasını gönderir
  startDate: string; // etkinliğin başlangıç tarihini gönderir
  location: string; // etkinliğin yapılacağı konumu gönderir
  capacity: number; // etkinliğin maksimum kapasitesini gönderir
  category: string; // etkinliğin kategorisini gönderir
  visibility: EventVisibility; // etkinliğin katılım tipini gönderir
}

export interface UpdateEventRequest { // etkinlik güncellerken backende gönderilecek verileri tutar
  title: string; // etkinliğin güncel başlığını gönderir
  description: string; // etkinliğin güncel açıklamasını gönderir
  startDate: string; // etkinliğin güncel başlangıç tarihini gönderir
  location: string; // etkinliğin güncel konumunu gönderir
  capacity: number; // etkinliğin güncel kapasitesini gönderir
  category: string; // etkinliğin güncel kategorisini gönderir
  visibility: EventVisibility; // etkinliğin güncel katılım tipini gönderir
}

export interface RegistrationResponse { // backendden dönen etkinlik kayıt bilgilerini tutar
  id: number; // kayıt işleminin benzersiz idsini tutar
  userId: string; // etkinliğe kayıt olan kullanıcının Identity idsini tutar
  userFullName: string; // etkinliğe kayıt olan kullanıcının ad soyad bilgisini tutar
  eventId: number; // kayıt olunan etkinliğin idsini tutar
  eventTitle: string; // kayıt olunan etkinliğin başlığını tutar
  clubName: string; // etkinliğin bağlı olduğu kulübün adını tutar
  registeredAt: string; // kullanıcının etkinliğe kayıt olduğu zamanı tutar
  approvalStatus: RegistrationApprovalStatus; // kaydın Pending Approved veya Rejected durumunu tutar
  checkedInAt: string | null; // kullanıcı qr ile giriş yaptıysa check-in zamanını tutar giriş yapmadıysa null olur
}

export interface UserResponse { // backendden dönen kullanıcı bilgilerini kullanıcı yönetim ekranı için tutar
  id: string; // kullanıcının Identity tarafından oluşturulan idsini tutar
  fullName: string; // kullanıcının ad soyad bilgisini tutar
  email: string; // kullanıcının email adresini tutar
  department: string | null; // kullanıcının bölüm bilgisini tutar bölüm yoksa null olabilir
  roles: string[]; // kullanıcının sahip olduğu rolleri liste halinde tutar
}

export interface UpdateUserRoleRequest { // kullanıcı rolü değiştirirken backende gönderilecek veriyi tutar
  role: 'Student' | 'ClubManager'; // kullanıcıya atanabilecek Student veya ClubManager rollerinden birini gönderir
}

export interface PagedResponse<T> { // sayfalama kullanılan endpointlerden dönen verileri tutar T hangi veri tipinin sayfalanacağını temsil eder
  items: T[]; // mevcut sayfadaki kayıtları liste halinde tutar
  page: number; // şu anki sayfa numarasını tutar
  pageSize: number; // bir sayfada kaç kayıt gösterileceğini tutar
  totalCount: number; // filtrelere uyan toplam kayıt sayısını tutar
  totalPages: number; // toplam sayfa sayısını tutar
}

export interface EventPageQuery { // etkinlik filtreleme sıralama ve sayfalama parametrelerini tutar
  search?: string; // etkinlik arama metnini tutar gönderilmesi zorunlu değildir
  category?: string; // kategori filtresini tutar gönderilmesi zorunlu değildir
  clubId?: number; // kulüp filtresini tutar gönderilmesi zorunlu değildir
  dateFrom?: string; // etkinliklerin hangi tarihten itibaren getirileceğini tutar
  dateTo?: string; // etkinliklerin hangi tarihe kadar getirileceğini tutar
  upcomingOnly?: boolean; // sadece yaklaşan etkinliklerin getirileceğini belirtir
  sortField?: string; // etkinliklerin hangi alana göre sıralanacağını tutar
  sortDirection?: 'asc' | 'desc'; // sıralamanın artan veya azalan olacağını tutar
  page?: number; // istenen sayfa numarasını tutar
  pageSize?: number; // bir sayfada kaç etkinlik gösterileceğini tutar
}

export interface CreateCheckInSessionRequest { // qr kod oluştururken backende gönderilecek süre bilgisini tutar
  expiresInMinutes: number; // qr kodun kaç dakika geçerli olacağını backende gönderir
}

export interface CheckInSessionResponse { // backendden oluşturulan qr oturum bilgilerini tutar
  eventId: number; // oluşturulan qr kodun ait olduğu etkinliğin idsini tutar
  token: string; // frontendin qr kod içine koyacağı geçici gerçek tokenı tutar
  expiresAt: string; // qr kodun geçerliliğinin biteceği zamanı tutar
}

export interface CheckInRequest { // kullanıcı qr kod üzerinden check-in yaparken backende gönderilecek veriyi tutar
  token: string; // qr koddan alınan geçici tokenı backende gönderir
}

export interface CheckInResponse { // başarılı check-in işleminden backenden dönen bilgileri tutar
  registrationId: number; // check-in yapılan kayıt işleminin idsini tutar
  eventId: number; // kullanıcının giriş yaptığı etkinliğin idsini tutar
  checkedInAt: string; // kullanıcının qr ile etkinliğe giriş yaptığı zamanı tutar
  message: string; // backendden gelen başarılı check-in mesajını tutar
}