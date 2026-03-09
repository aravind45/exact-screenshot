import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { isSameDay, format, compareAsc, startOfDay } from 'date-fns';
import { Calendar as CalendarIcon, Clock, User, ArrowRight } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

type ConsultationBooking = {
  id: string;
  status: string;
  startTime: string;
  endTime?: string;
  advisorName: string;
  serviceName: string;
};

const normalizeStatus = (status?: string): string => {
  if (status === 'REQUESTED') return 'PENDING';
  return status || 'PENDING';
};

const normalizeBookings = (payload: unknown): ConsultationBooking[] => {
  if (!Array.isArray(payload)) return [];

  return payload
    .map((entry: any) => ({
      id: String(entry?.id || ''),
      status: normalizeStatus(entry?.status),
      startTime: String(entry?.startTime || entry?.sessionDate || ''),
      endTime: entry?.endTime ? String(entry.endTime) : undefined,
      advisorName: String(entry?.advisor?.user?.fullName || 'Advisor'),
      serviceName: String(entry?.ratePlan?.serviceName || 'Consultation'),
    }))
    .filter((entry) => Boolean(entry.id && entry.startTime))
    .sort((a, b) => compareAsc(new Date(a.startTime), new Date(b.startTime)));
};

const statusBadgeVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  if (status === 'CONFIRMED' || status === 'COMPLETED') return 'default';
  if (status === 'CANCELLED' || status === 'REFUNDED') return 'destructive';
  if (status === 'PENDING') return 'secondary';
  return 'outline';
};

export default function ConsultationCalendar() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = React.useState<Date>(startOfDay(new Date()));

  const { data: bookingsPayload, isLoading } = useQuery({
    queryKey: ['my-bookings-calendar'],
    queryFn: () => api.marketplace.getMyMarketplaceBookings(),
  });

  const rawBookings = Array.isArray(bookingsPayload)
    ? bookingsPayload
    : Array.isArray((bookingsPayload as any)?.bookings)
      ? (bookingsPayload as any).bookings
      : Array.isArray((bookingsPayload as any)?.data)
        ? (bookingsPayload as any).data
        : [];

  const bookings = React.useMemo(() => normalizeBookings(rawBookings), [rawBookings]);

  const dayKeys = React.useMemo(
    () => new Set(bookings.map((entry) => format(new Date(entry.startTime), 'yyyy-MM-dd'))),
    [bookings]
  );

  const selectedDayBookings = React.useMemo(
    () => bookings.filter((entry) => isSameDay(new Date(entry.startTime), selectedDate)),
    [bookings, selectedDate]
  );

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-[#F8FAFC]">
        <Sidebar />
        <div className="flex-1 md:ml-64 p-8">
          <div className="space-y-4 max-w-6xl mx-auto">
            <Skeleton className="h-10 w-72" />
            <Skeleton className="h-[520px] w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar />
      <div className="flex-1 md:ml-64 p-6 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900">Consultation Calendar</h1>
              <p className="text-slate-500 mt-1">See all advisor consultations by date and time.</p>
            </div>
            <Button variant="outline" onClick={() => navigate('/my-bookings')}>
              My Bookings
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
            <Card className="rounded-xl border-slate-200 h-fit">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-indigo-600" />
                  Pick a date
                </CardTitle>
                <CardDescription>Highlighted days have consultations.</CardDescription>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(value) => value && setSelectedDate(startOfDay(value))}
                  modifiers={{
                    hasConsultation: (date) => dayKeys.has(format(date, 'yyyy-MM-dd')),
                  }}
                  modifiersClassNames={{
                    hasConsultation: 'bg-indigo-100 text-indigo-700 font-semibold',
                  }}
                  className="w-full"
                />
              </CardContent>
            </Card>

            <Card className="rounded-xl border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg">
                  {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                </CardTitle>
                <CardDescription>
                  {selectedDayBookings.length} consultation{selectedDayBookings.length !== 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedDayBookings.length === 0 ? (
                  <div className="py-14 text-center text-slate-500">
                    <CalendarIcon className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                    <p>No consultations on this date.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedDayBookings.map((booking) => (
                      <div key={booking.id} className={cn('border rounded-lg p-4 bg-white', booking.status === 'CONFIRMED' && 'border-indigo-200 bg-indigo-50/30')}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-2 min-w-0">
                            <div className="flex items-center gap-2 text-sm text-slate-700">
                              <Clock className="w-4 h-4 text-slate-400" />
                              <span className="font-semibold">{format(new Date(booking.startTime), 'h:mm a')}</span>
                              <span className="text-slate-400">-</span>
                              <span>{booking.endTime ? format(new Date(booking.endTime), 'h:mm a') : 'TBD'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-700">
                              <User className="w-4 h-4 text-slate-400" />
                              <span>{booking.advisorName}</span>
                            </div>
                            <div className="text-sm text-slate-500">{booking.serviceName}</div>
                          </div>
                          <Badge variant={statusBadgeVariant(booking.status)}>{booking.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
