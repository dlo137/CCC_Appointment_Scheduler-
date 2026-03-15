export enum AppointmentStatus {
  Pending = "pending",
  Confirmed = "confirmed",
  Cancelled = "cancelled",
}

export interface Barber {
  id: string;
  name: string;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Service {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price_cents: number;
  created_at: string;
}

export interface UserProfile {
  id: string; // matches auth.users.id
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Appointment {
  id: string;
  user_id: string;
  barber_id: string;
  service_id: string;
  starts_at: string; // ISO 8601
  ends_at: string;   // ISO 8601
  status: AppointmentStatus;
  notes: string | null;
  created_at: string;
  // joined relations (optional, populated by queries)
  barber?: Barber;
  service?: Service;
  user?: UserProfile;
}
