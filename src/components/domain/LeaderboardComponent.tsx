
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { getLeaderboardData } from '@/lib/firebase/firestoreService';
import type { LeaderboardItem } from '@/lib/types'; 
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Award, Medal, User as UserIcon, TrendingUp, LogIn, RefreshCw, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import EmailPasswordSignInModal from '@/components/auth/EmailPasswordSignInModal';
import EmailPasswordSignUpModal from '@/components/auth/EmailPasswordSignUpModal';
import { useToast } from '@/hooks/use-toast';


const LeaderboardComponent: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, loading: isLoadingAuth, userSettings } = useAuth();
  const { toast } = useToast();

  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);

  const openSignInModal = () => {
    setIsSignUpModalOpen(false);
    setIsSignInModalOpen(true);
  };

  const openSignUpModal = () => {
    setIsSignInModalOpen(false);
    setIsSignUpModalOpen(true);
  };


  const fetchLeaderboard = useCallback(async () => {
    setIsLoadingData(true);
    setError(null);
    try {
      const data = await getLeaderboardData(25); 
      setLeaderboard(data.map((entry, index) => ({ ...entry, rank: index + 1 })));
    } catch (err: any) {
      console.error("Error fetching leaderboard:", err);
      let userFriendlyError = "Failed to load leaderboard. Please try again later or check your internet connection.";
      // Check for common permission denied errors more robustly
      if (err.code === 'permission-denied' || 
          err.code === 'PERMISSION_DENIED' ||
          err.message?.toLowerCase().includes('permission denied') ||
          err.message?.toLowerCase().includes('insufficient permissions') ||
          err.message?.toLowerCase().includes('missing or insufficient permissions')) {
        userFriendlyError = "Failed to load leaderboard due to a permission issue. This might be a configuration problem with database access rules. Please contact support if this persists.";
      } else if (err.message?.toLowerCase().includes('missing index')) {
        userFriendlyError = "Leaderboard data is currently unavailable due to a database configuration issue (missing index). Please try again later.";
      }
      setError(userFriendlyError);
      toast({ title: "Leaderboard Error", description: userFriendlyError, variant: "destructive", duration: 10000 });
    } finally {
      setIsLoadingData(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!isLoadingAuth) {
        if (user) {
            fetchLeaderboard();
        } else {
            setIsLoadingData(false);
            setLeaderboard([]);
            setError(null); // Clear error if user logs out
        }
    }
  }, [user, isLoadingAuth, fetchLeaderboard, userSettings?.goldCoins, userSettings?.silverCoins]); 


  if (isLoadingAuth) { // Only show global loading for auth, specific loading for data
    return (
      <Card className="shadow-xl bg-card/80 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-2xl font-headline text-primary flex items-center">
            <TrendingUp className="mr-3 h-7 w-7" /> Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2 text-muted-foreground">Loading user...</p>
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <>
        <Card className="shadow-xl bg-card/80 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-2xl font-headline text-primary flex items-center">
              <TrendingUp className="mr-3 h-7 w-7" /> Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center py-10">
            <p className="text-muted-foreground text-lg mb-6">Please sign in to view the leaderboard and see your rank!</p>
            <Button onClick={openSignInModal} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <LogIn className="mr-2 h-5 w-5" /> Sign In to View
            </Button>
          </CardContent>
        </Card>
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
  }
  
  if (isLoadingData) {
     return (
      <Card className="shadow-xl bg-card/80 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-2xl font-headline text-primary flex items-center">
            <TrendingUp className="mr-3 h-7 w-7" /> Leaderboard
          </CardTitle>
          <CardDescription className="text-muted-foreground">See who's mastering their focus!</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-2">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[150px]" />
                  <Skeleton className="h-3 w-[100px]" />
                </div>
                <Skeleton className="h-4 w-[50px] ml-auto" />
                <Skeleton className="h-4 w-[50px]" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }


  if (error) {
    return (
      <Card className="shadow-xl bg-card/80 backdrop-blur-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl font-headline text-destructive flex items-center">
            <AlertTriangle className="mr-2 h-6 w-6" /> Error Loading Leaderboard
          </CardTitle>
           <Button onClick={fetchLeaderboard} variant="outline" size="icon" aria-label="Refresh Leaderboard" disabled={isLoadingData}>
            <RefreshCw className={`h-4 w-4 ${isLoadingData ? 'animate-spin' : ''}`} />
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-destructive-foreground">{error}</p>
          <p className="text-xs text-muted-foreground mt-2">This could be due to a temporary network issue or a database configuration problem. If it persists, please contact support.</p>
        </CardContent>
      </Card>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <Card className="shadow-xl bg-card/80 backdrop-blur-md">
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle className="text-2xl font-headline text-primary flex items-center">
                    <TrendingUp className="mr-3 h-7 w-7" /> Leaderboard
                </CardTitle>
                <CardDescription className="text-muted-foreground">See who's mastering their focus!</CardDescription>
            </div>
            <Button onClick={fetchLeaderboard} variant="outline" size="icon" aria-label="Refresh Leaderboard" disabled={isLoadingData}>
                <RefreshCw className={`h-4 w-4 ${isLoadingData ? 'animate-spin' : ''}`} />
            </Button>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            The leaderboard is currently empty, or no users have earned enough gold coins yet. Complete some Pomodoro sessions to get on the board!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="shadow-xl bg-card/80 backdrop-blur-md border-primary/20">
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle className="text-2xl font-headline text-primary flex items-center">
                    <TrendingUp className="mr-3 h-7 w-7" /> Leaderboard
                </CardTitle>
                <CardDescription className="text-muted-foreground">Top performers based on Gold Coins. Keep focusing!</CardDescription>
            </div>
            <Button onClick={fetchLeaderboard} variant="outline" size="icon" aria-label="Refresh Leaderboard" disabled={isLoadingData}>
                <RefreshCw className={`h-4 w-4 ${isLoadingData ? 'animate-spin' : ''}`} />
            </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">Rank</TableHead>
                <TableHead>User</TableHead>
                <TableHead className="text-right w-[100px]">
                  <div className="flex items-center justify-end gap-1">
                    <Award className="h-4 w-4 text-yellow-500" /> Gold
                  </div>
                </TableHead>
                <TableHead className="text-right w-[100px]">
                  <div className="flex items-center justify-end gap-1">
                    <Medal className="h-4 w-4 text-gray-400" /> Silver
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaderboard.map((entry) => ( 
                <TableRow key={entry.id} className={entry.id === user?.uid ? "bg-primary/10" : ""}>
                  <TableCell className="font-medium">{entry.rank}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={entry.photoURL || undefined} alt={entry.displayName || 'User'} data-ai-hint="user avatar" />
                        <AvatarFallback>
                          {entry.displayName ? entry.displayName.charAt(0).toUpperCase() : <UserIcon className="h-5 w-5" />}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium truncate max-w-[150px] sm:max-w-xs">
                        {entry.displayName || `User ${entry.id.substring(0,6)}...`}
                        {entry.id === user?.uid && " (You)"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-semibold text-yellow-600">{entry.goldCoins}</TableCell>
                  <TableCell className="text-right font-semibold text-gray-500">{entry.silverCoins}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
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
};

export default LeaderboardComponent;
