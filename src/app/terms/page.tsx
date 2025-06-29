
"use client"
import { APP_NAME } from '@/lib/constants';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { FileText, ShieldAlert } from 'lucide-react';
import PageTransition from '@/components/ui/animations/PageTransition';
import { useEffect } from 'react';


export default function TermsOfServicePage() {
    useEffect(() => {
        document.title = `Terms of Service | ${APP_NAME}`;
        // Meta description for client components is ideally set via server-side rendering or a general one in RootLayout.
        // Example: document.querySelector('meta[name="description"]')?.setAttribute("content", `Review the Terms of Service for using ${APP_NAME}, your AI Powered Pomodoro Timer.`);
    }, [])
  return (
    <PageTransition>
    <main className="container mx-auto px-4 py-12 md:py-16">
      <div className="max-w-3xl mx-auto">
        <Card className="bg-card/80 shadow-xl border-border">
          <CardHeader>
            <CardTitle className="text-3xl md:text-4xl font-headline text-foreground">Terms of Service for {APP_NAME}</CardTitle>
            <CardDescription className="text-muted-foreground">
              Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 text-foreground/90 prose prose-sm sm:prose-base dark:prose-invert max-w-none">
            <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-md text-destructive flex items-start">
              <ShieldAlert className="h-6 w-6 mr-3 mt-1 shrink-0" />
              <div>
                <h3 className="font-semibold text-destructive">Important Notice: Placeholder Content</h3>
                <p className="text-sm">
                  The content on this page is for demonstration purposes only and does not constitute legally binding Terms of Service for {APP_NAME}, an AI Powered Pomodoro Timer.
                  You must consult with a legal professional to draft terms that are suitable for your application and business, considering aspects like user conduct, AI usage, intellectual property, disclaimers, and liability.
                </p>
              </div>
            </div>

            <p>Welcome to {APP_NAME}! These placeholder Terms of Service ("Terms") govern your use of our AI Powered Pomodoro Timer application and services. By using {APP_NAME}, you agree to these Terms.</p>

            <h2 className="text-xl font-semibold text-accent">1. Acceptance of Terms (Example)</h2>
            <p>By creating an account or using {APP_NAME}, you confirm that you have read, understood, and agree to be bound by these Terms. If you do not agree, do not use the service.</p>

            <h2 className="text-xl font-semibold text-accent">2. Use of Service (Example)</h2>
            <ul className="list-disc pl-6">
              <li>You must be at least [e.g., 13 or 16, depending on regulations like COPPA/GDPR] years old to use {APP_NAME}.</li>
              <li>You are responsible for maintaining the confidentiality of your account.</li>
              <li>You agree not to use the service for any illegal or unauthorized purpose.</li>
              <li>You understand that AI-generated content (like task breakdowns) is for suggestion purposes and should be reviewed for accuracy.</li>
            </ul>

            <h2 className="text-xl font-semibold text-accent">3. User Content (Example)</h2>
            <p>If users can create content (e.g., task names, descriptions for AI processing), this section would describe ownership, rights you take, and prohibited content. You retain ownership of your task descriptions, but grant us a license to use them to provide the AI features.</p>
            
            <h2 className="text-xl font-semibold text-accent">4. Intellectual Property (Example)</h2>
            <p>{APP_NAME} and its original content (excluding user-provided data), features (including the AI models as configured for this service), and functionality are owned by [Your Name/Company Name] and are protected by international copyright, trademark, and other intellectual property laws.</p>

            <h2 className="text-xl font-semibold text-accent">5. Disclaimers and Limitation of Liability (Example)</h2>
            <p>{APP_NAME} is provided "as is" without any warranties. AI-generated suggestions may not always be perfect. We are not liable for any damages arising from your use of the service. This section needs careful legal review.</p>

            <h2 className="text-xl font-semibold text-accent">6. Termination (Example)</h2>
            <p>We may terminate or suspend your account at our discretion, without prior notice, for conduct that violates these Terms or is harmful to other users or us.</p>
            
            <h2 className="text-xl font-semibold text-accent">7. Governing Law (Example)</h2>
            <p>These Terms shall be governed by the laws of South Africa, without regard to its conflict of law provisions. You would also need to consider how to handle international users and disputes.</p>
            
            <h2 className="text-xl font-semibold text-accent">8. Changes to Terms (Example)</h2>
            <p>We reserve the right to modify these Terms at any time. We will provide notice of material changes. Your continued use of {APP_NAME} after changes constitutes acceptance.</p>

            <h2 className="text-xl font-semibold text-accent">9. Contact Us (Example)</h2>
            <p>If you have questions about these Terms for {APP_NAME}, you would contact [Placeholder Email Address or Contact Method].</p>
            
            <div className="text-center mt-8">
              <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Link href="/">Back to {APP_NAME}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
    </PageTransition>
  );
}
