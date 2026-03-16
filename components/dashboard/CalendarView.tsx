import { Appointment, AppointmentStatus } from '@/types';

interface Props {
  appointments: Appointment[];
}

const STATUS_BLOCK: Record<AppointmentStatus, string> = {
  [AppointmentStatus.Pending]:   'bg-amber-500/20 border-l-2 border-amber-500 text-amber-300',
  [AppointmentStatus.Confirmed]: 'bg-green-500/20 border-l-2 border-green-500 text-green-300',
  [AppointmentStatus.Cancelled]: 'bg-zinc-800/60 border-l-2 border-zinc-600 text-zinc-500 line-through',
};

// Returns the Monday of the week containing `date`
function weekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
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
  const today = new Date();
  const monday = weekStart(today);
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));

  return (
    <div className="overflow-x-auto -mx-1">
      <div className="min-w-[560px] grid grid-cols-7 gap-px bg-zinc-800 rounded-xl overflow-hidden border border-zinc-800">
        {days.map((day, i) => {
          const isToday  = sameDay(day, today);
          const dayAppts = appointments.filter((a) =>
            sameDay(new Date(a.start_time), day)
          );

          return (
            <div key={i} className="bg-zinc-900 flex flex-col min-h-[180px]">
              {/* column header */}
              <div
                className={`flex flex-col items-center py-2.5 border-b border-zinc-800 ${
                  isToday ? 'bg-brand-500/10' : ''
                }`}
              >
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  {DAY_LABELS[i]}
                </span>
                <span
                  className={`mt-0.5 text-sm font-bold ${
                    isToday ? 'text-brand-400' : 'text-zinc-300'
                  }`}
                >
                  {day.getDate()}
                </span>
              </div>

              {/* appointment blocks */}
              <div className="flex flex-col gap-1 p-1.5 flex-1">
                {dayAppts.length === 0 && (
                  <span className="text-[10px] text-zinc-700 text-center mt-2">—</span>
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
