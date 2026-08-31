export type EventVisibility = 'Public' | 'ApprovalRequired'; // etkinliğin katılım tiplerini tutar public direkt katılım approvalrequired ise onay gerektirir

export type EventStatus = 'Active' | 'Cancelled'; // etkinliğin aktif veya iptal edilmiş olma durumunu tutar

export type RegistrationApprovalStatus = 'Pending' | 'Approved' | 'Rejected'; // etkinlik kaydının beklemede onaylı veya reddedilmiş olma durumunu tutar


export interface ClubResponse { // backendden dönen kulüp bilgilerini tutar
  id: number; // kulübün benzersiz idsini tutar
  name: string; // kulübün adını tutar
  description: string | null; // kulübün açıklamasını tutar açıklama yoksa null olabilir
  logoUrl: string | null; // kulübün logo adresini tutar logo yoksa null olabilir
  managerUserId: string; // kulübü yöneten kullanıcının idsini tutar
  managerFullName: string; // kulüp yöneticisinin ad soyad bilgisini tutar
  eventCount: number; // kulübün toplam etkinlik sayısını tutar
}


export interface CreateClubRequest { // kulüp oluştururken backende gönderilecek verileri tutar
  name: string; // oluşturulacak kulübün adını gönderir
  description: string | null; // kulüp açıklamasını gönderir açıklama olmayabilir
  logoUrl: string | null; // kulübün logo adresini gönderir logo olmayabilir
}


export interface UpdateClubRequest { // kulüp güncellerken backende gönderilecek verileri tutar
  name: string; // kulübün güncel adını gönderir
  description: string | null; // güncel açıklamayı gönderir
  logoUrl: string | null; // güncel logo adresini gönderir
}


export interface ClubEventStatsResponse { // kulübün etkinlik bazlı istatistiklerini tutar
  eventId: number; // istatistiği gösterilen etkinliğin idsini tutar
  title: string; // etkinliğin başlığını tutar
  startDate: string; // etkinliğin başlangıç tarihini tutar
  status: EventStatus; // etkinliğin aktif veya iptal durumunu tutar
  capacity: number; // etkinliğin toplam kapasitesini tutar
  approvedRegistrationCount: number; // onaylanan kayıt sayısını tutar
  pendingRegistrationCount: number; // bekleyen kayıt sayısını tutar
  rejectedRegistrationCount: number; // reddedilen kayıt sayısını tutar
  registrationRate: number; // etkinliğin kayıt doluluk oranını tutar
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
  overallRegistrationRate: number; // kulübün genel kayıt doluluk oranını tutar
  events: ClubEventStatsResponse[]; // kulübün her etkinliğine ait istatistikleri liste halinde tutar
}


export interface EventResponse { // backendden dönen etkinlik bilgilerini tutar
  id: number; // etkinliğin idsini tutar
  clubId: number; // etkinliği oluşturan kulübün idsini tutar
  clubName: string; // etkinliği oluşturan kulübün adını tutar
  title: string; // etkinliğin başlığını tutar
  description: string; // etkinliğin açıklamasını tutar
  startDate: string; // etkinliğin başlangıç tarihini tutar
  location: string; // etkinliğin yapılacağı yeri tutar
  capacity: number; // etkinliğin maksimum katılımcı sayısını tutar
  category: string; // etkinliğin kategorisini tutar
  visibility: EventVisibility; // etkinliğe direkt mi yoksa onayla mı katılım yapılacağını tutar
  status: EventStatus; // etkinliğin aktif veya iptal durumunu tutar
  createdAt: string; // etkinliğin oluşturulduğu tarihi tutar
}


export interface PopularEventResponse { // backendden dönen popüler etkinlik bilgilerini tutar
  id: number; // etkinliğin idsini tutar
  clubId: number; // etkinliği oluşturan kulübün idsini tutar
  clubName: string; // etkinliği oluşturan kulübün adını tutar
  title: string; // etkinliğin başlığını tutar
  startDate: string; // başlangıç tarihini tutar
  location: string; // etkinlik konumunu tutar
  category: string; // etkinlik kategorisini tutar
  visibility: EventVisibility; // etkinliğin katılım tipini tutar
  capacity: number; // etkinliğin toplam kapasitesini tutar
  approvedRegistrationCount: number; // etkinliğe onaylanmış kayıt sayısını tutar
  remainingCapacity: number; // etkinlikte kalan boş kontenjanı tutar
  registrationRate: number; // etkinliğin doluluk oranını tutar
}


export interface CreateEventRequest { // etkinlik oluştururken backende gönderilecek verileri tutar
  clubId: number; // etkinliği oluşturacak kulübün idsini gönderir
  title: string; // etkinlik başlığını gönderir
  description: string; // etkinlik açıklamasını gönderir
  startDate: string; // etkinliğin başlangıç tarihini gönderir
  location: string; // etkinliğin yapılacağı konumu gönderir
  capacity: number; // etkinliğin kapasitesini gönderir
  category: string; // etkinliğin kategorisini gönderir
  visibility: EventVisibility; // etkinliğin katılım tipini gönderir
}


export interface UpdateEventRequest { // etkinlik güncellerken backende gönderilecek verileri tutar
  title: string; // etkinliğin güncel başlığını gönderir
  description: string; // güncel başlangıç tarihini gönderir
  startDate: string; // güncel başlangıç tarihini gönderir
  location: string; // güncel konumu gönderir
  capacity: number; // güncel kapasiteyi gönderir
  category: string; // güncel kategoriyi gönderir
  visibility: EventVisibility; // güncel katılım tipini gönderir
}


export interface RegistrationResponse { // backendden dönen etkinlik kayıt bilgilerini tutar
  id: number; // kayıt işleminin idsini tutar
  userId: string; // kayıt olan kullanıcının idsini tutar
  userFullName: string; // kayıt olan kullanıcının ad soyad bilgisini tutar
  eventId: number; // kayıt olunan etkinliğin idsini tutar
  eventTitle: string; // kayıt olunan etkinliğin başlığını tutar
  clubName: string; // etkinliği oluşturan kulübün adını tutar
  registeredAt: string; // kullanıcının etkinliğe kayıt olduğu zamanı tutar
  approvalStatus: RegistrationApprovalStatus; // kaydın beklemede onaylı veya reddedilmiş olma durumunu tutar
}


export interface UserResponse { // backendden dönen kullanıcı bilgilerini tutar kullanıcı yönetim ekranı için
  id: string; // kullanıcının identity tarafından oluşturulan idsini tutar
  fullName: string; // kullanıcının ad soyad bilgisini tutar
  email: string; // kullanıcının mail adresini tutar
  department: string | null; // kullanıcının bölüm bilgisini tutar bölüm yoksa null olabilir
  roles: string[]; // kullanıcının sahip olduğu rolleri liste halinde tutar
}


export interface UpdateUserRoleRequest { // kullanıcı rolü değiştirirken backende gönderilecek veriyi tutar
  role: 'Student' | 'ClubManager'; // kullanıcıya atanabilecek rollerden birini gönderir
}


export interface PagedResponse<T> { // sayfalama kullanılan endpointlerden dönen verileri tutar
  items: T[]; // o anki sayfada gösterilecek kayıtları tutar t hangi veri tipi kullanılıyorsa onu temsil eder
  page: number; // şu an hangi sayfada olduğumuzu tutar
  pageSize: number; // bir sayfada kaç kayıt gösterileceğini tutar
  totalCount: number; // filtrelere uyan toplam kayıt sayısını tutar
  totalPages: number; // toplam kaç sayfa olduğunu tutar
}


export interface EventPageQuery { // etkinlikleri ararken filtreleme sıralama ve sayfalama parametrelerini tutar
  search?: string; // arama metnini tutar gönderilmek zorunda olmadığı için optionaldır
  category?: string; // kategori filtresini tutar gönderilmeyebilir
  clubId?: number; // kulüp filtresini tutar gönderilmeyebilir
  dateFrom?: string; // hangi tarihten itibaren etkinlik aranacağını tutar
  dateTo?: string; // hangi tarihe kadar etkinlik aranacağını tutar
  upcomingOnly?: boolean; // sadece yaklaşan etkinliklerin getirileceğini belirtir
  sortField?: string; // etkinliklerin hangi alana göre sıralanacağını tutar
  sortDirection?: 'asc' | 'desc'; // sıralamanın artan veya azalan olacağını tutar
  page?: number; // istenen sayfa numarasını tutar
  pageSize?: number; // bir sayfada kaç etkinlik isteneceğini tutar
}