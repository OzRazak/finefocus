
"use client";

import React, { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Send, MessageSquareHeart } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';


const feedbackSchema = z.object({
  name: z.string().optional(),
  email: z.string().email({ message: "Please enter a valid email." }).optional().or(z.literal('')),
  subject: z.enum(["bug", "feature", "question", "general"], { required_error: "Please select a subject." }),
  message: z.string().min(10, { message: "Message must be at least 10 characters long." }).max(5000, { message: "Message must be less than 5000 characters." }),
});

type FeedbackFormValues = z.infer<typeof feedbackSchema>;

export default function FeedbackPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClient, setIsClient] = useState(false);


  const {
    register,
    handleSubmit,
    setValue,
    reset,
    control,
    formState: { errors },
  } = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      name: '',
      email: '',
      subject: undefined, // Explicitly undefined for Select placeholder
      message: '',
    },
  });

  useEffect(() => {
    document.title = `Support & Feedback | ${APP_NAME}`;
    // Meta description for client components is ideally set via server-side rendering or a general one in RootLayout.
    // Example: document.querySelector('meta[name="description"]')?.setAttribute("content", `Submit feedback or get support for ${APP_NAME}, your AI Powered Pomodoro Timer.`);
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (user) {
      if (user.displayName) setValue('name', user.displayName);
      if (user.email) setValue('email', user.email);
    }
  }, [user, setValue]);

  const onSubmit: SubmitHandler<FeedbackFormValues> = async (data) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorResult = await response.json();
        throw new Error(errorResult.error || 'Failed to submit feedback.');
      }

      toast({
        title: "Feedback Submitted!",
        description: "Thank you for your valuable input. We'll review it shortly.",
        variant: "default",
      });
      reset(); // Reset form after successful submission
      // If user was logged in, repopulate their details
      if (user) {
        if (user.displayName) setValue('name', user.displayName);
        if (user.email) setValue('email', user.email);
      }

    } catch (error: any) {
      toast({
        title: "Submission Error",
        description: error.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!isClient) {
    return (
        <div className="flex flex-col min-h-screen bg-background">
            <main className="flex-grow container mx-auto px-4 py-8 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-16 w-16 text-primary animate-spin mx-auto mb-4" />
                    <p className="text-xl text-foreground font-headline">Initializing Feedback Form...</p>
                </div>
            </main>
        </div>
    );
  }


  return (
    <main className="container mx-auto px-4 py-12 md:py-16">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-xl bg-card/80 backdrop-blur-md border-primary/30">
          <CardHeader className="text-center">
            <MessageSquareHeart className="mx-auto h-12 w-12 text-accent mb-3" />
            <CardTitle className="text-3xl font-headline text-foreground">Support & Feedback</CardTitle>
            <CardDescription className="text-muted-foreground">
              We value your input! Whether it's a bug report, a feature idea, a question, or general feedback for {APP_NAME}, please let us know.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="name" className="text-foreground">Name (Optional)</Label>
                  <Input
                    id="name"
                    {...register('name')}
                    className="bg-input text-input-foreground"
                    placeholder="Your Name"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="email" className="text-foreground">Email (Optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    className="bg-input text-input-foreground"
                    placeholder="your@email.com"
                    disabled={isSubmitting}
                  />
                  {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="subject" className="text-foreground">Subject</Label>
                <Select
                  disabled={isSubmitting}
                  onValueChange={(value: "bug" | "feature" | "question" | "general") => setValue('subject', value, { shouldValidate: true })}
                  value={control._formValues.subject} 
                >
                  <SelectTrigger id="subject" className="bg-input text-input-foreground">
                    <SelectValue placeholder="Select a subject..." />
                  </SelectTrigger>
                  <SelectContent className="bg-popover text-popover-foreground">
                    <SelectItem value="bug">Bug Report</SelectItem>
                    <SelectItem value="feature">Feature Request</SelectItem>
                    <SelectItem value="question">Question</SelectItem>
                    <SelectItem value="general">General Feedback</SelectItem>
                  </SelectContent>
                </Select>
                {errors.subject && <p className="text-xs text-destructive">{errors.subject.message}</p>}
              </div>

              <div className="space-y-1">
                <Label htmlFor="message" className="text-foreground">Message</Label>
                <Textarea
                  id="message"
                  {...register('message')}
                  className="bg-input text-input-foreground min-h-[120px]"
                  placeholder="Describe your feedback in detail..."
                  rows={5}
                  disabled={isSubmitting}
                />
                {errors.message && <p className="text-xs text-destructive">{errors.message.message}</p>}
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Send className="mr-2 h-5 w-5" />
                )}
                Submit Feedback
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
