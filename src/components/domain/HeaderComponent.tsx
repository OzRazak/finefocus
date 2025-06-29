
import React, { useState, useEffect, useCallback } from 'react';
import { APP_NAME, APP_SUBTITLE } from '@/lib/constants';
import { Settings, LogIn, LogOut, User as UserIcon, UserPlus, Coffee, Share2, Facebook, Twitter, Mail, Copy, MessageCircle, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import EmailPasswordSignInModal from '@/components/auth/EmailPasswordSignInModal';
import EmailPasswordSignUpModal from '@/components/auth/EmailPasswordSignUpModal';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';


interface HeaderComponentProps {
  onOpenSettings: () => void;
}

const HeaderComponent: React.FC<HeaderComponentProps> = React.memo(({ onOpenSettings }) => {
  const { user, loading, signOutUser } = useAuth();
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
  const [appUrl, setAppUrl] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setAppUrl(window.location.origin);
    }
  }, []);

  const openSignInModal = useCallback(() => {
    setIsSignUpModalOpen(false);
    setIsSignInModalOpen(true);
  }, []);

  const openSignUpModal = useCallback(() => {
    setIsSignInModalOpen(false);
    setIsSignUpModalOpen(true);
  }, []);

  const shareText = `Check out ${APP_NAME} (${APP_SUBTITLE}) - your new companion for mastering focus and productivity! Join me here:`;
  const shareSubject = `Invitation to try ${APP_NAME}!`;

  const handleShareToFacebook = useCallback(() => {
    if (!appUrl) return;
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(appUrl)}&quote=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }, [appUrl, shareText]);

  const handleShareToTwitter = useCallback(() => {
    if (!appUrl) return;
    const url = `https://twitter.com/intent/tweet?url=${encodeURIComponent(appUrl)}&text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }, [appUrl, shareText]);

  const handleShareToWhatsApp = useCallback(() => {
    if (!appUrl) return;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + appUrl)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }, [appUrl, shareText]);

  const handleShareByEmail = useCallback(() => {
    if (!appUrl) return;
    const url = `mailto:?subject=${encodeURIComponent(shareSubject)}&body=${encodeURIComponent(shareText + ' ' + appUrl)}`;
    window.location.href = url;
  }, [appUrl, shareText, shareSubject]);

  const handleCopyLink = useCallback(() => {
    if (!appUrl) return;
    navigator.clipboard.writeText(appUrl)
      .then(() => {
        toast({
          title: "Link Copied!",
          description: "You can now share it anywhere.",
        });
      })
      .catch(err => {
        console.error("Failed to copy link:", err);
        toast({
          title: "Copy Failed",
          description: "Could not copy link to clipboard.",
          variant: "destructive",
        });
      });
  }, [appUrl, toast]);


  return (
    <>
      <header className="py-4 px-3 md:py-6 md:px-8 border-b border-border/50 shadow-lg bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3 group" data-testid="app-name-header">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-headline font-bold text-primary group-hover:text-primary/80 transition-colors duration-300">{APP_NAME}</h1>
              <p className="text-xs sm:text-sm md:text-md text-muted-foreground font-body">{APP_SUBTITLE}</p>
            </div>
          </Link>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-foreground" aria-label="Share App" data-testid="share-button-trigger">
                  <Share2 className="h-6 w-6" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover border-border text-popover-foreground">
                <DropdownMenuLabel>Share {APP_NAME}</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border/50" />
                <DropdownMenuItem onClick={handleShareToFacebook} className="cursor-pointer focus:bg-accent/20 focus:text-accent-foreground">
                  <Facebook className="mr-2 h-4 w-4" /> Facebook
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleShareToTwitter} className="cursor-pointer focus:bg-accent/20 focus:text-accent-foreground">
                  <Twitter className="mr-2 h-4 w-4" /> Twitter / X
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleShareToWhatsApp} className="cursor-pointer focus:bg-accent/20 focus:text-accent-foreground">
                  <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleShareByEmail} className="cursor-pointer focus:bg-accent/20 focus:text-accent-foreground">
                  <Mail className="mr-2 h-4 w-4" /> Email
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCopyLink} className="cursor-pointer focus:bg-accent/20 focus:text-accent-foreground">
                  <Copy className="mr-2 h-4 w-4" /> Copy Link
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
             <Button
                variant="ghost"
                size="icon"
                asChild
                className="text-foreground"
                aria-label="Buy Me a Coffee"
              >
                <a href="https://coff.ee/ozrazak" target="_blank" rel="noopener noreferrer">
                  <Coffee className="h-6 w-6" />
                </a>
            </Button>
            <Button variant="ghost" size="icon" onClick={onOpenSettings} aria-label="Open Settings" className="text-foreground" data-testid="settings-button">
              <Settings className="h-6 w-6" />
            </Button>
            {loading ? (
              <Skeleton className="h-9 w-28 bg-muted/50" />
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-9 w-9 border-2 border-primary/50">
                      <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User'} data-ai-hint="user avatar"/>
                      <AvatarFallback className="bg-muted text-muted-foreground">
                        {user.displayName ? user.displayName.charAt(0).toUpperCase() : <UserIcon className="h-5 w-5"/>}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-popover border-border text-popover-foreground" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user.displayName || user.email || 'User'}
                      </p>
                      {user.displayName && user.email && (
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-border/50"/>
                  <DropdownMenuItem onClick={signOutUser} className="cursor-pointer focus:bg-accent/20 focus:text-accent-foreground">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openSignInModal}
                  className="border-primary text-primary hover:bg-primary/10 hover:text-primary-foreground"
                  data-testid="signin-button"
                >
                  <LogIn className="mr-1.5 h-4 w-4" />
                  Sign In
                </Button>
                 <Button
                  variant="default"
                  size="sm"
                  onClick={openSignUpModal}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                  <UserPlus className="mr-1.5 h-4 w-4" />
                  Sign Up
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Actions */}
          <div className="md:hidden flex items-center space-x-2">
            {loading ? (
              <Skeleton className="h-8 w-20 bg-muted/50" />
            ) : !user && (
              <Button
                variant="outline"
                onClick={openSignInModal}
                className="px-3 py-1 h-8 text-xs border-primary text-primary hover:bg-primary/10 hover:text-primary-foreground"
                data-testid="signin-button-mobile"
              >
                Sign Up / In
              </Button>
            )}
             {user && !loading && (
                 <Avatar className="h-8 w-8 border-primary/50">
                    <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User'} data-ai-hint="user avatar"/>
                    <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                    {user.displayName ? user.displayName.charAt(0).toUpperCase() : <UserIcon className="h-4 w-4"/>}
                    </AvatarFallback>
                </Avatar>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-foreground">
                  <Menu className="h-6 w-6" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-popover border-border text-popover-foreground">
                {user && (
                  <>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {user.displayName || user.email || 'User'}
                        </p>
                        {user.displayName && user.email && (
                          <p className="text-xs leading-none text-muted-foreground">
                            {user.email}
                          </p>
                        )}
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-border/50"/>
                  </>
                )}
                <DropdownMenuLabel>Share {APP_NAME}</DropdownMenuLabel>
                <DropdownMenuItem onClick={handleShareToFacebook} className="cursor-pointer focus:bg-accent/20 focus:text-accent-foreground">
                  <Facebook className="mr-2 h-4 w-4" /> Facebook
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleShareToTwitter} className="cursor-pointer focus:bg-accent/20 focus:text-accent-foreground">
                  <Twitter className="mr-2 h-4 w-4" /> Twitter / X
                </DropdownMenuItem>
                 <DropdownMenuItem onClick={handleShareToWhatsApp} className="cursor-pointer focus:bg-accent/20 focus:text-accent-foreground">
                  <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleShareByEmail} className="cursor-pointer focus:bg-accent/20 focus:text-accent-foreground">
                  <Mail className="mr-2 h-4 w-4" /> Email
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCopyLink} className="cursor-pointer focus:bg-accent/20 focus:text-accent-foreground">
                  <Copy className="mr-2 h-4 w-4" /> Copy Link
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border/50"/>
                 <DropdownMenuItem asChild className="cursor-pointer focus:bg-accent/20 focus:text-accent-foreground">
                     <a href="https://coff.ee/ozrazak" target="_blank" rel="noopener noreferrer" className="flex items-center">
                        <Coffee className="mr-2 h-4 w-4" /> Buy Me a Coffee
                     </a>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onOpenSettings} className="cursor-pointer focus:bg-accent/20 focus:text-accent-foreground" data-testid="settings-button-mobile">
                  <Settings className="mr-2 h-4 w-4" /> Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border/50"/>
                {user ? (
                  <DropdownMenuItem onClick={signOutUser} className="cursor-pointer focus:bg-destructive/20 focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                ) : (
                  <>
                    <DropdownMenuItem onClick={openSignInModal} className="cursor-pointer focus:bg-accent/20 focus:text-accent-foreground" data-testid="signin-button-dropdown">
                      <LogIn className="mr-2 h-4 w-4" /> Sign In
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={openSignUpModal} className="cursor-pointer focus:bg-accent/20 focus:text-accent-foreground">
                      <UserPlus className="mr-2 h-4 w-4" /> Sign Up
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <EmailPasswordSignInModal
        isOpen={isSignInModalOpen}
        onClose={() => setIsSignInModalOpen(false)}
        onSwitchToSignUp={openSignUpModal}
      />
      <EmailPasswordSignUpModal
        isOpen={isSignUpModalOpen}
        onClose={() => setIsSignUpModalOpen(false)}
        onSwitchToSignIn={openSignInModal}
      />
    </>
  );
});
HeaderComponent.displayName = 'HeaderComponent'; // For React.memo

export default HeaderComponent;
