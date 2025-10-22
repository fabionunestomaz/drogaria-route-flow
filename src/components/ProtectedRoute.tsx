import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRole?: 'admin' | 'driver' | 'customer';
}

export function ProtectedRoute({ children, requireRole }: ProtectedRouteProps) {
  const { user, roles, loading } = useAuth();
  const [checkingDriver, setCheckingDriver] = useState(false);
  const [driverApproved, setDriverApproved] = useState<boolean | null>(null);

  // Check driver approval status when requireRole is 'driver'
  useEffect(() => {
    const checkDriverApproval = async () => {
      if (requireRole === 'driver' && user && !loading) {
        setCheckingDriver(true);
        try {
          const { data, error } = await supabase
            .from('drivers')
            .select('approved')
            .eq('user_id', user.id)
            .single();

          if (error) {
            console.error('Error checking driver approval:', error);
            setDriverApproved(false);
          } else {
            setDriverApproved(data?.approved ?? false);
          }
        } catch (error) {
          console.error('Error checking driver approval:', error);
          setDriverApproved(false);
        } finally {
          setCheckingDriver(false);
        }
      }
    };

    checkDriverApproval();
  }, [requireRole, user, loading]);

  if (loading || checkingDriver) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (requireRole) {
    const hasRequiredRole = 
      (requireRole === 'admin' && roles.isAdmin) ||
      (requireRole === 'driver' && roles.isDriver) ||
      (requireRole === 'customer' && roles.isCustomer);

    if (!hasRequiredRole) {
      return <Navigate to="/" replace />;
    }

    // Check if driver is approved
    if (requireRole === 'driver' && driverApproved === false) {
      return <Navigate to="/driver-pending" replace />;
    }
  }

  return <>{children}</>;
}
