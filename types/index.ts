export enum AppointmentStatus {
  Pending = "pending",
  Confirmed = "confirmed",
  Cancelled = "cancelled",
}

export interface Barber {
  id: string;          // barbers.id
  profile_id: string;
  name: string;        // profiles.full_name (via join)
  bio: string | null;
  avatar_url: string | null;
  /** { monday: ["09:00","17:00"], tuesday: null, ... } — null key means day off */
  available_hours: Record<string, [string, string] | null | undefined>;
  active: boolean;
}

export interface Service {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number; // mapped from DB duration_min
  price: number;            // numeric from DB (e.g. 35.00)
  active: boolean;
}

export type UserRole = 'customer' | 'barber' | 'admin';

export interface UserProfile {
  id: string; // matches auth.users.id
  full_name: string | null;
  role: UserRole;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface TimeSlot {
  startTime: string;          // ISO 8601
  endTime: string;            // ISO 8601
  label: string;              // e.g. "9:00 AM"
  assignedBarberId?: string;  // set when "any barber" mode resolves to a specific barber
}

export interface Appointment {
  id: string;
  customer_id: string | null;
  guest_name: string | null;
  guest_phone: string | null;
  guest_email: string | null;
  barber_id: string;
  service_id: string;
  start_time: string;  // ISO 8601
  end_time: string;    // ISO 8601
  status: AppointmentStatus;
  notes: string | null;
  created_at: string;
  // joined relations (optional, populated by queries)
  barber?: Barber;
  service?: Service;
  customer?: {
    id: string;
    full_name: string | null;
    phone: string | null;
  };
}
