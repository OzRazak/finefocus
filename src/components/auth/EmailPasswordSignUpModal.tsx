
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
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, KeyRound, User, LogIn } from 'lucide-react';
import Link from 'next/link';

const signUpSchema = z.object({
  displayName: z.string().min(1, { message: "Display name is required." }).optional(),
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  confirmPassword: z.string(),
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: "You must accept the Terms of Service and Privacy Policy." }),
  }),
  marketingOptIn: z.boolean().optional().default(false),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match.",
  path: ["confirmPassword"],
});

type SignUpFormValues = z.infer<typeof signUpSchema>;

interface EmailPasswordSignUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToSignIn: () => void;
}

const EmailPasswordSignUpModal: React.FC<EmailPasswordSignUpModalProps> = ({ isOpen, onClose, onSwitchToSignIn }) => {
  const { signUpWithEmailPassword, signInWithGoogle, signInWithMicrosoft } = useAuth();
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
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      displayName: '',
      email: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
      marketingOptIn: false,
    }
  });

  const onSubmit: SubmitHandler<SignUpFormValues> = async (data) => {
    setIsLoading(true);
    setFirebaseError(null);
    try {
      await signUpWithEmailPassword(data.email, data.password, data.displayName, data.marketingOptIn);
      toast({
        title: "Account Created Successfully",
        description: "Welcome! You are now signed in.",
      });
      resetFormAndClose();
    } catch (error: any) {
      handleAuthError(error, "Sign Up Failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
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
      handleAuthError(error, "Google Sign Up Failed");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleMicrosoftSignUp = async () => {
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
      handleAuthError(error, "Microsoft Sign Up Failed");
    } finally {
      setIsMicrosoftLoading(false);
    }
  };

  const handleAuthError = (error: any, title: string) => {
    let errorMessage = "An unexpected error occurred. Please try again.";
     if (error.code) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            errorMessage = "This email address is already in use.";
            break;
          case 'auth/invalid-email':
            errorMessage = "The email address is not valid.";
            break;
          case 'auth/weak-password':
            errorMessage = "The password is too weak (minimum 6 characters).";
            break;
          case 'auth/popup-closed-by-user':
            errorMessage = "Sign-Up cancelled.";
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
          <DialogTitle className="text-primary font-headline">Create an Account</DialogTitle>
          <DialogDescription>
            Join to save your progress and settings.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
           <Button
            variant="outline"
            onClick={handleGoogleSignUp}
            disabled={anyProviderLoading}
            className="w-full border-input hover:bg-accent/10"
          >
            {isGoogleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
            Sign Up with Google
          </Button>

          <Button
            variant="outline"
            onClick={handleMicrosoftSignUp}
            disabled={anyProviderLoading}
            className="w-full border-input hover:bg-accent/10"
          >
            {isMicrosoftLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
            Sign Up with Microsoft
          </Button>

          <p className="text-xs text-muted-foreground text-center px-1">
            By signing up with Google or Microsoft, you agree to our <Link href="/terms" target="_blank" className="underline hover:text-primary">Terms of Service</Link> and <Link href="/privacy" target="_blank" className="underline hover:text-primary">Privacy Policy</Link>.
          </p>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or sign up with email
              </span>
            </div>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {firebaseError && <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-md mb-3">{firebaseError}</p>}
            
            <div className="space-y-1">
              <Label htmlFor="displayName-signup" className="text-foreground">Display Name (Optional)</Label>
              <div className="relative">
                  <User className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                      id="displayName-signup"
                      type="text"
                      {...register("displayName")}
                      placeholder="Your Name"
                      className="bg-input text-input-foreground pl-8"
                      disabled={anyProviderLoading}
                  />
              </div>
              {errors.displayName && <p className="text-xs text-destructive pt-1">{errors.displayName.message}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="email-signup" className="text-foreground">Email</Label>
              <div className="relative">
                  <Mail className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                      id="email-signup"
                      type="email"
                      {...register("email")}
                      placeholder="you@example.com"
                      className="bg-input text-input-foreground pl-8"
                      disabled={anyProviderLoading}
                  />
              </div>
              {errors.email && <p className="text-xs text-destructive pt-1">{errors.email.message}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="password-signup" className="text-foreground">Password</Label>
              <div className="relative">
                  <KeyRound className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                      id="password-signup"
                      type="password"
                      {...register("password")}
                      placeholder="Minimum 6 characters"
                      className="bg-input text-input-foreground pl-8"
                      disabled={anyProviderLoading}
                  />
              </div>
              {errors.password && <p className="text-xs text-destructive pt-1">{errors.password.message}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="confirmPassword-signup" className="text-foreground">Confirm Password</Label>
              <div className="relative">
                  <KeyRound className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                      id="confirmPassword-signup"
                      type="password"
                      {...register("confirmPassword")}
                      placeholder="Re-enter your password"
                      className="bg-input text-input-foreground pl-8"
                      disabled={anyProviderLoading}
                  />
              </div>
              {errors.confirmPassword && <p className="text-xs text-destructive pt-1">{errors.confirmPassword.message}</p>}
            </div>

            <div className="items-start flex space-x-3 pt-2">
              <Checkbox id="acceptTerms-signup" {...register("acceptTerms")} disabled={anyProviderLoading} className="mt-0.5"/>
              <div className="grid gap-1.5 leading-relaxed">
                <Label htmlFor="acceptTerms-signup" className="text-sm font-normal peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground">
                  I agree to the <Link href="/terms" target="_blank" className="underline text-primary hover:text-primary/80">Terms of Service</Link> and <Link href="/privacy" target="_blank" className="underline text-primary hover:text-primary/80">Privacy Policy</Link>.
                </Label>
                {errors.acceptTerms && <p className="text-xs text-destructive pt-1">{errors.acceptTerms.message}</p>}
              </div>
            </div>

            <div className="items-start flex space-x-3 pt-2">
              <Checkbox id="marketingOptIn-signup" {...register("marketingOptIn")} disabled={anyProviderLoading} className="mt-0.5"/>
              <div className="grid gap-1.5 leading-relaxed">
                <Label htmlFor="marketingOptIn-signup" className="text-sm font-normal peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground">
                  Receive occasional updates, news, and special offers via email. You can unsubscribe at any time.
                </Label>
                 {errors.marketingOptIn && <p className="text-xs text-destructive pt-1">{errors.marketingOptIn.message}</p>}
              </div>
            </div>


            <DialogFooter className="flex flex-col sm:flex-row sm:justify-between items-center gap-2 pt-4">
              <Button type="button" variant="link" onClick={onSwitchToSignIn} className="p-0 h-auto text-sm text-accent hover:text-accent/80" disabled={anyProviderLoading}>
                Already have an account? Sign In
              </Button>
              <div className="flex gap-2">
                  <DialogClose asChild>
                  <Button type="button" variant="outline" disabled={anyProviderLoading}>
                      Cancel
                  </Button>
                  </DialogClose>
                  <Button type="submit" disabled={anyProviderLoading} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Sign Up
                  </Button>
              </div>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmailPasswordSignUpModal;

