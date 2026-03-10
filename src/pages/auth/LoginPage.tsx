import { FormEvent, useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getUserFacingErrorMessage } from '@/lib/error-messages';
import { getDefaultRouteForRole } from '@/lib/role-routing';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const { currentUser, session, isAuthLoading, signInWithPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectFrom = typeof (location.state as { from?: string } | null)?.from === 'string'
    ? (location.state as { from: string }).from
    : null;

  useEffect(() => {
    if (isAuthLoading || !session || !currentUser) {
      return;
    }

    navigate(redirectFrom ?? getDefaultRouteForRole(currentUser.activeRole), { replace: true });
  }, [currentUser, isAuthLoading, navigate, redirectFrom, session]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Correo y contraseña son requeridos.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await signInWithPassword(email.trim(), password);
    } catch (error) {
      setErrorMessage(getUserFacingErrorMessage(error, 'No se pudo iniciar sesión.'));
    } finally {
      setIsSubmitting(false);
    }
  };



  if (!isAuthLoading && session && currentUser) {
    return <Navigate to={redirectFrom ?? getDefaultRouteForRole(currentUser.activeRole)} replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">
            Insightful Feedback
          </CardTitle>
          <CardDescription>
            Inicia sesión para acceder a tu panel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-1.5">
                <Label htmlFor="email">Correo</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="admin@tu-dominio.com"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="********"
                />
              </div>

              {errorMessage && (
                <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {errorMessage}
                </p>
              )}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Ingresando...
                  </>
                ) : (
                  'Ingresar'
                )}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
