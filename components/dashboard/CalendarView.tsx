import { Appointment, AppointmentStatus } from '@/types';

interface Props {
  appointments: Appointment[];
}

const STATUS_BLOCK: Record<AppointmentStatus, string> = {
  [AppointmentStatus.Pending]:   'bg-amber-50 border-l-2 border-amber-400 text-amber-700',
  [AppointmentStatus.Confirmed]: 'bg-green-50 border-l-2 border-green-500 text-green-700',
  [AppointmentStatus.Cancelled]: 'bg-gray-100 border-l-2 border-gray-300 text-gray-400 line-through',
};

function weekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth()    === b.getMonth()    &&
    a.getDate()     === b.getDate()
  );
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function CalendarView({ appointments }: Props) {
  const today  = new Date();
  const monday = weekStart(today);
  const days   = Array.from({ length: 7 }, (_, i) => addDays(monday, i));

  return (
    <div className="overflow-x-auto -mx-1">
      <div className="min-w-[560px] grid grid-cols-7 gap-px bg-gray-200 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
        {days.map((day, i) => {
          const isToday  = sameDay(day, today);
          const dayAppts = appointments.filter((a) =>
            sameDay(new Date(a.start_time), day),
          );

          return (
            <div key={i} className="bg-white flex flex-col min-h-[180px]">
              {/* column header */}
              <div
                className={`flex flex-col items-center py-2.5 border-b border-gray-100 ${
                  isToday ? 'bg-ocean-50' : ''
                }`}
              >
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  {DAY_LABELS[i]}
                </span>
                <span
                  className={`mt-0.5 text-sm font-bold ${
                    isToday ? 'text-ocean-600' : 'text-gray-700'
                  }`}
                >
                  {day.getDate()}
                </span>
              </div>

              {/* appointment blocks */}
              <div className="flex flex-col gap-1 p-1.5 flex-1">
                {dayAppts.length === 0 && (
                  <span className="text-[10px] text-gray-300 text-center mt-2">—</span>
                )}
                {dayAppts.map((appt) => (
                  <div
                    key={appt.id}
                    className={`rounded px-1.5 py-1 text-[10px] leading-tight ${
                      STATUS_BLOCK[appt.status]
                    }`}
                  >
                    <p className="font-semibold truncate">
                      {appt.customer?.full_name ?? 'Customer'}
                    </p>
                    <p className="opacity-80 truncate">{appt.service?.name}</p>
                    <p className="opacity-70 mt-0.5">{formatTime(appt.start_time)}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
