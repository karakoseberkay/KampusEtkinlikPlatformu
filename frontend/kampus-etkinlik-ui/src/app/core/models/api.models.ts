export type EventVisibility =
  | 'Public'
  | 'ApprovalRequired';

export type EventStatus =
  | 'Active'
  | 'Cancelled';

export type RegistrationApprovalStatus =
  | 'Pending'
  | 'Approved'
  | 'Rejected';


export interface ClubResponse {
  id: number;
  name: string;
  description: string | null;
  logoUrl: string | null;
  managerUserId: string;
  managerFullName: string;
  eventCount: number;
}


export interface CreateClubRequest {
  name: string;
  description: string | null;
  logoUrl: string | null;
}


export interface UpdateClubRequest {
  name: string;
  description: string | null;
  logoUrl: string | null;
}


export interface ClubEventStatsResponse {
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


export interface ClubStatsResponse {
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


export interface EventResponse {
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


export interface PopularEventResponse {
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


export interface CreateEventRequest {
  clubId: number;
  title: string;
  description: string;
  startDate: string;
  location: string;
  capacity: number;
  category: string;
  visibility: EventVisibility;
}


export interface UpdateEventRequest {
  title: string;
  description: string;
  startDate: string;
  location: string;
  capacity: number;
  category: string;
  visibility: EventVisibility;
}


export interface RegistrationResponse {
  id: number;
  userId: string;
  userFullName: string;
  eventId: number;
  eventTitle: string;
  clubName: string;
  registeredAt: string;
  approvalStatus: RegistrationApprovalStatus;
}

export interface UserResponse {
  id: string;
  fullName: string;
  email: string;
  department: string | null;
  roles: string[];
}

export interface UpdateUserRoleRequest {
  role: 'Student' | 'ClubManager';
}

export interface PagedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface EventPageQuery {
  search?: string;
  category?: string;
  clubId?: number;
  dateFrom?: string;
  dateTo?: string;
  upcomingOnly?: boolean;
  page?: number;
  pageSize?: number;
}