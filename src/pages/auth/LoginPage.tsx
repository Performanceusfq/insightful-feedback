import { FormEvent, useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Loader2, LogIn } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getUserFacingErrorMessage } from '@/lib/error-messages';
import { getDefaultRouteForRole } from '@/lib/role-routing';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const { currentUser, session, isAuthLoading, signInWithPassword, signInWithMicrosoft } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMicrosoftLoading, setIsMicrosoftLoading] = useState(false);

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

  const handleMicrosoftLogin = async () => {
    setIsMicrosoftLoading(true);
    setErrorMessage(null);
    try {
      await signInWithMicrosoft();
    } catch (error) {
      setErrorMessage(getUserFacingErrorMessage(error, 'Error al conectar con Microsoft.'));
      setIsMicrosoftLoading(false);
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
            <Button
              type="button"
              variant="outline"
              className="w-full flex items-center justify-center gap-2 h-11"
              onClick={handleMicrosoftLogin}
              disabled={isMicrosoftLoading || isSubmitting}
            >
              {isMicrosoftLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <svg width="20" height="20" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
                  <path fill="#f25022" d="M0 0h10v10H0z" />
                  <path fill="#7fba00" d="M11 0h10v10H11z" />
                  <path fill="#00a4ef" d="M0 11h10v10H0z" />
                  <path fill="#ffb900" d="M11 11h10v10H11z" />
                </svg>
              )}
              Profesores (USFQ Microsoft)
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  O ingresa como administrador
                </span>
              </div>
            </div>

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
