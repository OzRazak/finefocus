
"use client";

import React, { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, KeyRound, LogIn } from 'lucide-react'; // LogIn can be a generic icon

const signInSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

type SignInFormValues = z.infer<typeof signInSchema>;

interface EmailPasswordSignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToSignUp: () => void;
}

const EmailPasswordSignInModal: React.FC<EmailPasswordSignInModalProps> = ({ isOpen, onClose, onSwitchToSignUp }) => {
  const { signInWithEmailPassword, signInWithGoogle, signInWithMicrosoft } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isMicrosoftLoading, setIsMicrosoftLoading] = useState(false); // New state for Microsoft
  const [firebaseError, setFirebaseError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
  });

  const onSubmit: SubmitHandler<SignInFormValues> = async (data) => {
    setIsLoading(true);
    setFirebaseError(null);
    try {
      await signInWithEmailPassword(data.email, data.password);
      toast({
        title: "Signed In Successfully",
        description: "Welcome back!",
      });
      resetFormAndClose();
    } catch (error: any) {
      handleAuthError(error, "Sign In Failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setFirebaseError(null);
    try {
      await signInWithGoogle();
      toast({
        title: "Signed In Successfully",
        description: "Welcome with Google!",
      });
      resetFormAndClose();
    } catch (error: any) {
      handleAuthError(error, "Google Sign In Failed");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleMicrosoftSignIn = async () => {
    setIsMicrosoftLoading(true);
    setFirebaseError(null);
    try {
      await signInWithMicrosoft();
      toast({
        title: "Signed In Successfully",
        description: "Welcome with Microsoft!",
      });
      resetFormAndClose();
    } catch (error: any) {
      handleAuthError(error, "Microsoft Sign In Failed");
    } finally {
      setIsMicrosoftLoading(false);
    }
  };
  
  const handleAuthError = (error: any, title: string) => {
    let errorMessage = "An unexpected error occurred. Please try again.";
    if (error.code) {
      switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          errorMessage = "Invalid email or password.";
          break;
        case 'auth/invalid-email':
          errorMessage = "The email address is not valid.";
          break;
        case 'auth/popup-closed-by-user':
          errorMessage = "Sign-In cancelled.";
          break;
        case 'auth/account-exists-with-different-credential':
          errorMessage = "An account already exists with the same email address but different sign-in credentials. Try signing in with the original method.";
          break;
        default:
          errorMessage = error.message || errorMessage;
      }
    }
    setFirebaseError(errorMessage);
    toast({
      title: title,
      description: errorMessage,
      variant: "destructive",
    });
  };

  const resetFormAndClose = () => {
    reset();
    setFirebaseError(null);
    onClose();
  };

  const handleModalOpenChange = (open: boolean) => {
    if (!open) {
      resetFormAndClose();
    }
  };

  const anyProviderLoading = isLoading || isGoogleLoading || isMicrosoftLoading;

  return (
    <Dialog open={isOpen} onOpenChange={handleModalOpenChange}>
      <DialogContent className="sm:max-w-md bg-card text-card-foreground">
        <DialogHeader>
          <DialogTitle className="text-primary font-headline">Sign In</DialogTitle>
          <DialogDescription>
            Access your account to continue.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <Button 
            variant="outline" 
            onClick={handleGoogleSignIn} 
            disabled={anyProviderLoading}
            className="w-full border-input hover:bg-accent/10"
          >
            {isGoogleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />} 
            Sign In with Google
          </Button>

          <Button 
            variant="outline" 
            onClick={handleMicrosoftSignIn} 
            disabled={anyProviderLoading}
            className="w-full border-input hover:bg-accent/10"
          >
            {isMicrosoftLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />} 
            Sign In with Microsoft
          </Button>

          <div className="relative my-3">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or continue with email
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {firebaseError && <p className="text-sm text-destructive bg-destructive/10 p-2 rounded-md">{firebaseError}</p>}
            <div className="space-y-1">
              <Label htmlFor="email-signin" className="text-foreground">Email</Label>
              <div className="relative">
                <Mail className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email-signin"
                  type="email"
                  {...register("email")}
                  placeholder="you@example.com"
                  className="bg-input text-input-foreground pl-8"
                  disabled={anyProviderLoading}
                />
              </div>
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="password-signin" className="text-foreground">Password</Label>
               <div className="relative">
                <KeyRound className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password-signin"
                  type="password"
                  {...register("password")}
                  placeholder="••••••••"
                  className="bg-input text-input-foreground pl-8"
                  disabled={anyProviderLoading}
                />
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
            <DialogFooter className="flex flex-col sm:flex-row sm:justify-between items-center gap-2 pt-2">
              <Button type="button" variant="link" onClick={onSwitchToSignUp} className="p-0 h-auto text-sm text-accent"  disabled={anyProviderLoading}>
                Don't have an account? Sign Up
              </Button>
              <div className="flex gap-2">
                <DialogClose asChild>
                  <Button type="button" variant="outline"  disabled={anyProviderLoading}>
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit" disabled={anyProviderLoading} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Sign In
                </Button>
              </div>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmailPasswordSignInModal;

