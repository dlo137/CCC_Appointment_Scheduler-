import ProtectedRoute from '@/components/ProtectedRoute';
import AdminContent from './AdminContent';

export default function AdminPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <AdminContent />
    </ProtectedRoute>
  );
}
