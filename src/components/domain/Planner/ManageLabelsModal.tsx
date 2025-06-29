
"use client";

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { TaskLabel } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle, Tag, Trash2, Palette, AlertTriangle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { addPlannerLabel, deletePlannerLabel as deletePlannerLabelFromDb } from '@/lib/firebase/firestoreService';

interface ManageLabelsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | undefined;
  existingLabels: TaskLabel[];
  onLabelsUpdated: () => void;
}

const ManageLabelsModal: React.FC<ManageLabelsModalProps> = ({ isOpen, onClose, userId, existingLabels, onLabelsUpdated }) => {
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('#CCCCCC');
  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null); // Tracks ID of label being deleted via API
  const [labelToDeleteConfirm, setLabelToDeleteConfirm] = useState<TaskLabel | null>(null); // Label for confirmation dialog

  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setNewLabelName('');
      setNewLabelColor('#CCCCCC');
      setLabelToDeleteConfirm(null); // Reset confirmation state when modal opens
    }
  }, [isOpen]);

  const handleAddLabel = async () => {
    if (!userId) {
      toast({ title: "Sign In Required", description: "You must be signed in to add labels.", variant: "destructive" });
      return;
    }
    if (!newLabelName.trim()) {
      toast({ title: "Validation Error", description: "Label name cannot be empty.", variant: "destructive" });
      return;
    }
    if (existingLabels.some(label => label.name.toLowerCase() === newLabelName.trim().toLowerCase())) {
      toast({ title: "Validation Error", description: "A label with this name already exists.", variant: "destructive" });
      return;
    }

    setIsAdding(true);
    try {
      await addPlannerLabel(userId, { name: newLabelName.trim(), color: newLabelColor });
      toast({ title: "Label Added", description: `Label "${newLabelName.trim()}" created.` });
      setNewLabelName('');
      setNewLabelColor('#CCCCCC');
      onLabelsUpdated();
    } catch (error) {
      console.error("Error adding label:", error);
      const errorMessage = error instanceof Error ? error.message : "Could not add label.";
      toast({ title: "Error Adding Label", description: errorMessage, variant: "destructive" });
    } finally {
      setIsAdding(false);
    }
  };

  const performDeleteLabel = async (labelId: string, labelName: string) => {
    if (!userId) {
       toast({ title: "Sign In Required", description: "You must be signed in to delete labels.", variant: "destructive" });
      return;
    }
    
    setIsDeleting(labelId);
    try {
      await deletePlannerLabelFromDb(userId, labelId);
      toast({ title: "Label Deleted", description: `Label "${labelName}" deleted successfully.` });
      onLabelsUpdated();
    } catch (error: any) {
      console.error("Error deleting label:", error);
      const errorMessage = error.message || "An unexpected error occurred while deleting the label.";
      toast({ title: "Error Deleting Label", description: errorMessage, variant: "destructive" });
    } finally {
      setIsDeleting(null);
      setLabelToDeleteConfirm(null); // Close confirmation dialog
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md bg-card text-card-foreground">
        <DialogHeader>
          <DialogTitle className="text-primary font-headline flex items-center"><Tag className="mr-2 h-5 w-5" /> Manage Labels</DialogTitle>
          <DialogDescription>
            Create and delete your task labels here.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-3">
          <div className="space-y-3 p-4 border border-border rounded-lg bg-background/50">
            <h3 className="text-md font-semibold text-foreground">Add New Label</h3>
            <div className="flex items-stretch gap-2">
              <Input
                id="new-label-name"
                value={newLabelName}
                onChange={(e) => setNewLabelName(e.target.value)}
                className="flex-grow bg-input text-input-foreground"
                placeholder="Label name"
                disabled={isAdding || !userId}
                aria-label="New label name"
              />
              <div className="relative w-10 h-10">
                <Input
                  id="new-label-color"
                  type="color"
                  value={newLabelColor}
                  onChange={(e) => setNewLabelColor(e.target.value)}
                  className="absolute inset-0 w-full h-full p-0 border-0 opacity-0 cursor-pointer"
                  disabled={isAdding || !userId}
                  title="Select label color"
                  aria-label="New label color picker"
                />
                <div className="w-full h-full rounded-md border border-input flex items-center justify-center pointer-events-none" style={{ backgroundColor: newLabelColor }}>
                    <Palette className="h-5 w-5 text-white mix-blend-difference" />
                </div>
              </div>
              <Button onClick={handleAddLabel} disabled={isAdding || !newLabelName.trim() || !userId} size="icon" className="bg-primary hover:bg-primary/80 text-primary-foreground h-10 w-10 flex-shrink-0" aria-label="Add new label">
                {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-5 w-5" />}
              </Button>
            </div>
             {!userId && <p className="text-xs text-muted-foreground text-center pt-1">Sign in to add labels.</p>}
          </div>

          <div>
            <h3 className="text-md font-semibold text-foreground mb-2">Existing Labels</h3>
            {existingLabels.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4 border border-dashed border-border rounded-md">No labels created yet.</p>
            ) : (
              <ScrollArea className="max-h-60 border rounded-md bg-background/30">
                <div className="space-y-1 p-2">
                {existingLabels.map(label => (
                  <div key={label.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/30">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-4 w-4 rounded-full inline-block border border-border/50"
                        style={{ backgroundColor: label.color }}
                        title={`Color: ${label.color}`}
                      />
                      <span className="text-sm text-foreground">{label.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setLabelToDeleteConfirm(label)} // Set label for confirmation
                      disabled={isDeleting === label.id || !userId}
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      aria-label={`Delete label ${label.name}`}
                    >
                      {isDeleting === label.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                  </div>
                ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>

        <DialogFooter className="mt-4">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>

      {labelToDeleteConfirm && (
        <AlertDialog open={!!labelToDeleteConfirm} onOpenChange={(open) => !open && setLabelToDeleteConfirm(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-destructive" /> Are you absolutely sure?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the label "<strong>{labelToDeleteConfirm.name}</strong>".
                The label will be removed from all tasks, but the tasks themselves will not be deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setLabelToDeleteConfirm(null)} disabled={isDeleting === labelToDeleteConfirm.id}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => performDeleteLabel(labelToDeleteConfirm.id, labelToDeleteConfirm.name)}
                disabled={isDeleting === labelToDeleteConfirm.id}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting === labelToDeleteConfirm.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Delete Label
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </Dialog>
  );
};

export default ManageLabelsModal;

    