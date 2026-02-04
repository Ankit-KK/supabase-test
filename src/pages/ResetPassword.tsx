import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Lock, CheckCircle2, XCircle, ArrowLeft, Clock, AlertTriangle } from 'lucide-react';

type TokenStatus = 'validating' | 'valid' | 'expired' | 'used' | 'invalid';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenStatus, setTokenStatus] = useState<TokenStatus>('validating');
  const [tokenMessage, setTokenMessage] = useState<string>('');
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });

  // Validate token on mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setTokenStatus('invalid');
        setTokenMessage('Invalid reset link. No token provided.');
        return;
      }

      try {
        const { data, error: fnError } = await supabase.functions.invoke('validate-reset-token', {
          body: { token }
        });

        if (fnError) {
          console.error('Token validation error:', fnError);
          setTokenStatus('invalid');
          setTokenMessage('Failed to validate reset link. Please try again.');
          return;
        }

        setTokenStatus(data.status as TokenStatus);
        if (data.message) {
          setTokenMessage(data.message);
        }
      } catch (err) {
        console.error('Token validation error:', err);
        setTokenStatus('invalid');
        setTokenMessage('Failed to validate reset link. Please try again.');
      }
    };

    validateToken();
  }, [token]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      setError('Invalid reset link. Please request a new one.');
      return;
    }

    if (!formData.password || !formData.confirmPassword) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('reset-password', {
        body: {
          token,
          newPassword: formData.password
        }
      });

      // Extract the actual error message from the response
      let errorMessage: string | null = null;

      if (data?.error) {
        // Error returned in response body (most common case for non-2xx responses)
        errorMessage = data.error;
      } else if (fnError) {
        // Try to parse error context for the actual message
        try {
          const errorContext = (fnError as any).context;
          if (errorContext?.body) {
            const parsed = JSON.parse(errorContext.body);
            errorMessage = parsed.error || fnError.message;
          } else {
            errorMessage = fnError.message || 'Failed to reset password. Please try again.';
          }
        } catch {
          errorMessage = fnError.message || 'Failed to reset password. Please try again.';
        }
      }

      if (errorMessage) {
        setError(errorMessage);
        toast({
          title: "Reset Failed",
          description: errorMessage,
          variant: "destructive",
        });
      } else {
        setSuccess(true);
        toast({
          title: "Password Reset!",
          description: "Your password has been reset successfully.",
        });
      }
    } catch (err) {
      const errorMessage = 'Connection error. Please try again.';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const goToLogin = () => {
    navigate('/auth?redirect=/dashboard');
  };

  const goToForgotPassword = () => {
    navigate('/reset-password-request');
  };

  // Success state
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-md bg-card/95 backdrop-blur-sm border-primary/20 shadow-2xl">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Password Reset Complete!</h2>
            <p className="text-muted-foreground mb-6">
              Your password has been successfully reset. You can now log in with your new password.
            </p>
            <Button onClick={goToLogin} className="w-full">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Validating state
  if (tokenStatus === 'validating') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-md bg-card/95 backdrop-blur-sm border-primary/20 shadow-2xl">
          <CardContent className="pt-8 pb-8 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Validating Reset Link</h2>
            <p className="text-muted-foreground">Please wait while we verify your reset link...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Invalid/Expired/Used token states
  if (tokenStatus !== 'valid') {
    const getStatusIcon = () => {
      switch (tokenStatus) {
        case 'expired':
          return <Clock className="h-8 w-8 text-amber-500" />;
        case 'used':
          return <CheckCircle2 className="h-8 w-8 text-muted-foreground" />;
        default:
          return <AlertTriangle className="h-8 w-8 text-destructive" />;
      }
    };

    const getStatusTitle = () => {
      switch (tokenStatus) {
        case 'expired':
          return 'Reset Link Expired';
        case 'used':
          return 'Reset Link Already Used';
        default:
          return 'Invalid Reset Link';
      }
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <div className="w-full max-w-md">
          <Button
            variant="ghost"
            onClick={() => navigate('/auth')}
            className="mb-6 hover:bg-muted/50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Login
          </Button>

          <Card className="bg-card/95 backdrop-blur-sm border-primary/20 shadow-2xl">
            <CardContent className="pt-8 pb-8 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                {getStatusIcon()}
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">{getStatusTitle()}</h2>
              <p className="text-muted-foreground mb-6">
                {tokenMessage || 'This reset link is no longer valid.'}
              </p>
              <div className="space-y-3">
                <Button onClick={goToForgotPassword} className="w-full">
                  Request New Reset Link
                </Button>
                <Button onClick={goToLogin} variant="outline" className="w-full">
                  Go to Login
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Valid token - show password reset form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-32 h-32 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
      </div>

      <div className="w-full max-w-md">
        <Button
          variant="ghost"
          onClick={() => navigate('/auth')}
          className="mb-6 hover:bg-muted/50"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Login
        </Button>

        <Card className="bg-card/95 backdrop-blur-sm border-primary/20 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/20 to-primary/20 opacity-50 blur-xl"></div>

          <CardHeader className="text-center relative z-10">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              Reset Your Password
            </CardTitle>
            <p className="text-muted-foreground text-sm">
              Enter your new password below
            </p>
          </CardHeader>

          <CardContent className="relative z-10">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center space-x-2">
                  <Lock className="h-4 w-4" />
                  <span>New Password</span>
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="border-primary/30 focus:border-primary focus:ring-primary/20"
                  required
                  minLength={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="flex items-center space-x-2">
                  <Lock className="h-4 w-4" />
                  <span>Confirm New Password</span>
                </Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="border-primary/30 focus:border-primary focus:ring-primary/20"
                  required
                  minLength={6}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  'Reset Password'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;
