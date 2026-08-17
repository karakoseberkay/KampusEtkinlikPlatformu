export type EventVisibility = 'Public' | 'ApprovalRequired'; // etkinliğin katılım tiplerini tutar
export type EventStatus = 'Active' | 'Cancelled'; // etkinliğin durumlarını tutar
export type RegistrationApprovalStatus = 'Pending' | 'Approved' | 'Rejected'; // etkinlik kayıt durumlarını tutar

export interface ClubResponse { // backendden dönen kulüp bilgilerini tutar
  id: number;
  name: string;
  description: string | null;
  logoUrl: string | null;
  managerUserId: string;
  managerFullName: string;
  eventCount: number;
}

export interface CreateClubRequest { // kulüp oluştururken backende gönderilecek verileri tutar
  name: string;
  description: string | null;
  logoUrl: string | null;
}

export interface UpdateClubRequest { // kulüp güncellerken backende gönderilecek verileri tutar
  name: string;
  description: string | null;
  logoUrl: string | null;
}

export interface ClubEventStatsResponse { // kulübün etkinlik bazlı istatistiklerini tutar
  eventId: number;
  title: string;
  startDate: string;
  status: EventStatus;
  capacity: number;
  approvedRegistrationCount: number;
  pendingRegistrationCount: number;
  rejectedRegistrationCount: number;
  registrationRate: number;
}

export interface ClubStatsResponse { // backendden dönen genel kulüp istatistiklerini tutar
  clubId: number;
  clubName: string;
  totalEventCount: number;
  activeEventCount: number;
  cancelledEventCount: number;
  totalApprovedRegistrationCount: number;
  totalPendingRegistrationCount: number;
  totalRejectedRegistrationCount: number;
  overallRegistrationRate: number;
  events: ClubEventStatsResponse[];
}

export interface EventResponse { // backendden dönen etkinlik bilgilerini tutar
  id: number;
  clubId: number;
  clubName: string;
  title: string;
  description: string;
  startDate: string;
  location: string;
  capacity: number;
  category: string;
  visibility: EventVisibility;
  status: EventStatus;
  createdAt: string;
}

export interface PopularEventResponse { // backendden dönen popüler etkinlik bilgilerini tutar
  id: number;
  clubId: number;
  clubName: string;
  title: string;
  startDate: string;
  location: string;
  category: string;
  visibility: EventVisibility;
  capacity: number;
  approvedRegistrationCount: number;
  remainingCapacity: number;
  registrationRate: number;
}

export interface CreateEventRequest { // etkinlik oluştururken backende gönderilecek verileri tutar
  clubId: number;
  title: string;
  description: string;
  startDate: string;
  location: string;
  capacity: number;
  category: string;
  visibility: EventVisibility;
}

export interface UpdateEventRequest { // etkinlik güncellerken backende gönderilecek verileri tutar
  title: string;
  description: string;
  startDate: string;
  location: string;
  capacity: number;
  category: string;
  visibility: EventVisibility;
}

export interface RegistrationResponse { // backendden dönen etkinlik kayıt bilgilerini tutar
  id: number;
  userId: string;
  userFullName: string;
  eventId: number;
  eventTitle: string;
  clubName: string;
  registeredAt: string;
  approvalStatus: RegistrationApprovalStatus;
}

export interface UserResponse { // backendden dönen kullanıcı bilgilerini tutar(kullanıcı yönetim ekranı için)
  id: string;
  fullName: string;
  email: string;
  department: string | null;
  roles: string[];
}

export interface UpdateUserRoleRequest { // kullanıcı rolü değiştirirken backende gönderilecek veriyi tutar
  role: 'Student' | 'ClubManager';
}

export interface PagedResponse<T> { // sayfalama kullanılan endpointlerden dönen verileri tutar
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface EventPageQuery { // etkinlikleri ararken filtreleme ve sayfalama parametrelerini tutar
  search?: string;
  category?: string;
  clubId?: number;
  dateFrom?: string;
  dateTo?: string;
  upcomingOnly?: boolean;
  page?: number;
  pageSize?: number;
}