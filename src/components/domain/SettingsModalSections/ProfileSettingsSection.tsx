
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { UserCircle, ImageIcon, Save, Upload, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext'; // For user ID
import { uploadProfileImageAndGetUrl } from '@/lib/firebase/firestoreService';

interface ProfileSettingsSectionProps {
  initialDisplayName: string;
  initialPhotoURL: string;
  onSaveProfile: (updates: { displayName?: string; photoURL?: string }) => Promise<void>;
  isLoading: boolean;
}

const ProfileSettingsSection: React.FC<ProfileSettingsSectionProps> = ({
  initialDisplayName,
  initialPhotoURL,
  onSaveProfile,
  isLoading,
}) => {
  const [editableDisplayName, setEditableDisplayName] = useState(initialDisplayName);
  const [editablePhotoURL, setEditablePhotoURL] = useState(initialPhotoURL);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    setEditableDisplayName(initialDisplayName);
    setEditablePhotoURL(initialPhotoURL);
  }, [initialDisplayName, initialPhotoURL]);

  const handleProfileSave = async () => {
    setIsSavingProfile(true);
    try {
      const updates: { displayName?: string; photoURL?: string } = {};
      if (editableDisplayName !== initialDisplayName) {
        updates.displayName = editableDisplayName.trim() || undefined; // Send undefined if empty to possibly trigger default
      }
      if (editablePhotoURL !== initialPhotoURL) {
        updates.photoURL = editablePhotoURL.trim() || undefined;
      }

      if (Object.keys(updates).length > 0) {
        await onSaveProfile(updates);
        toast({ title: "Profile Updated", description: "Your public profile has been saved." });
      } else {
        toast({ title: "No Changes", description: "Profile details are the same.", variant: "default" });
      }
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast({ title: "Profile Save Error", description: error.message || "Could not save profile changes.", variant: "destructive" });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.uid) {
      if (!user?.uid) toast({ title: "Error", description: "User not found for image upload.", variant: "destructive" });
      return;
    }

    setIsUploadingImage(true);
    try {
      const downloadURL = await uploadProfileImageAndGetUrl(user.uid, file);
      setEditablePhotoURL(downloadURL);
      toast({ title: "Image Uploaded", description: "New profile picture ready. Click 'Save Profile' to apply." });
    } catch (error: any) {
      toast({ title: "Image Upload Failed", description: error.message || "Could not upload image.", variant: "destructive" });
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = ""; // Reset file input
      }
    }
  };

  return (
    <>
      <h3 className="text-lg font-semibold text-accent font-headline">Public Profile</h3>
      <p className="text-sm text-muted-foreground mb-3">This information appears on the Leaderboard.</p>
      <div className="space-y-4">
        <div>
          <Label htmlFor="profileDisplayName" className="text-foreground flex items-center">
            <UserCircle className="mr-2 h-4 w-4" /> Display Name
          </Label>
          <Input
            id="profileDisplayName"
            value={editableDisplayName}
            onChange={(e) => setEditableDisplayName(e.target.value)}
            className="mt-1 bg-input text-foreground"
            placeholder="Your Leaderboard Name"
            disabled={isSavingProfile || isLoading || isUploadingImage}
          />
           <p className="text-xs text-muted-foreground mt-1">This name is visible on the public leaderboard.</p>
        </div>
        
        <div>
          <Label htmlFor="profilePhoto" className="text-foreground flex items-center mb-1">
            <ImageIcon className="mr-2 h-4 w-4" /> Profile Photo
          </Label>
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 border-2 border-muted">
              <AvatarImage src={editablePhotoURL} alt="Current avatar" data-ai-hint="user avatar" />
              <AvatarFallback className="bg-secondary text-secondary-foreground text-2xl">
                {editableDisplayName ? editableDisplayName.charAt(0).toUpperCase() : <UserCircle />}
              </AvatarFallback>
            </Avatar>
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/png, image/jpeg, image/webp" className="hidden" id="profile-photo-input"/>
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isSavingProfile || isLoading || isUploadingImage}
            >
              {isUploadingImage ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Upload className="mr-2 h-4 w-4" />}
              Change Photo
            </Button>
          </div>
           <p className="text-xs text-muted-foreground mt-1">Upload a PNG, JPG, or WEBP image (max 1MB).</p>
        </div>

        <Button 
          onClick={handleProfileSave} 
          disabled={isSavingProfile || isLoading || isUploadingImage} 
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          {(isSavingProfile || isUploadingImage) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Profile
        </Button>
      </div>
    </>
  );
};

export default ProfileSettingsSection;

