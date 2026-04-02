import BookingForm from '@/components/BookingForm';

export default function BookPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] overflow-y-auto bg-[#f8fbfd] flex flex-col">
      <div className="flex-1 mx-auto w-full max-w-6xl px-6 py-8 flex flex-col min-h-0" style={{ minHeight: 'calc(100vh - 4rem)' }}>
        <BookingForm />
      </div>
    </div>
  );
}
