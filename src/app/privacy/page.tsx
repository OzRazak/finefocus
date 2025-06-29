
"use client"
import { APP_NAME } from '@/lib/constants';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import PageTransition from '@/components/ui/animations/PageTransition';
import { useEffect } from 'react';

export default function PrivacyPolicyPage() {
    useEffect(() => {
        document.title = `Privacy Policy | ${APP_NAME}`;
        // Meta description for client components is ideally set via server-side rendering or a general one in RootLayout.
        // Example: document.querySelector('meta[name="description"]')?.setAttribute("content", `Read the Privacy Policy for ${APP_NAME}, your AI Powered Pomodoro Timer.`);
    }, [])
  return (
    <PageTransition>
    <main className="container mx-auto px-4 py-12 md:py-16">
      <div className="max-w-3xl mx-auto">
        <Card className="bg-card/80 shadow-xl border-border">
          <CardHeader>
            <CardTitle className="text-3xl md:text-4xl font-headline text-foreground">Privacy Policy for {APP_NAME}</CardTitle>
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
                  The content on this page is for demonstration purposes only and does not constitute a legally binding Privacy Policy.
                  You must consult with a legal professional to draft a policy that accurately reflects your data processing activities and complies with all applicable laws, including POPI (South Africa), GDPR (Europe), and other global regulations. This placeholder applies to {APP_NAME}, an AI Powered Pomodoro Timer.
                </p>
              </div>
            </div>

            <p>Welcome to {APP_NAME}! This placeholder Privacy Policy outlines how we might collect, use, and protect your information for our AI Powered Pomodoro Timer. For a real application, this section would need to be very detailed.</p>

            <h2 className="text-xl font-semibold text-accent">1. Information We Collect (Example)</h2>
            <p>We may collect information such as:</p>
            <ul className="list-disc pl-6">
              <li>Personal Identifiers: Name, email address (if you create an account).</li>
              <li>Usage Data: Pomodoro session settings, task data (including text for AI processing), lifespan calculation inputs.</li>
              <li>Device Information: Browser type, IP address (for analytics and security).</li>
            </ul>

            <h2 className="text-xl font-semibold text-accent">2. How We Use Your Information (Example)</h2>
            <p>Your information might be used to:</p>
            <ul className="list-disc pl-6">
              <li>Provide and improve {APP_NAME}'s AI Pomodoro services.</li>
              <li>Personalize your experience (e.g., saving your settings).</li>
              <li>Process task descriptions with AI to provide sub-task suggestions.</li>
              <li>Communicate with you (e.g., for support).</li>
              <li>Comply with legal obligations (e.g., POPI, GDPR).</li>
            </ul>

            <h2 className="text-xl font-semibold text-accent">3. Data Sharing and Disclosure (Example)</h2>
            <p>We would not sell your personal data. We might share data with third-party service providers (e.g., Firebase for authentication and database, AI model providers for task processing) under strict confidentiality agreements.</p>
            
            <h2 className="text-xl font-semibold text-accent">4. Your Rights (Example - GDPR & POPI)</h2>
            <p>You have rights regarding your personal data, including:</p>
            <ul className="list-disc pl-6">
              <li>The right to access your data.</li>
              <li>The right to rectification (correcting your data).</li>
              <li>The right to erasure (deletion of your data).</li>
              <li>The right to restrict processing.</li>
              <li>The right to data portability.</li>
              <li>The right to object to processing.</li>
              <li>Rights related to automated decision-making and profiling.</li>
              <li>The right to lodge a complaint with a supervisory authority (e.g., the Information Regulator in South Africa, or your local EU DPA).</li>
            </ul>
            <p>To exercise these rights, you would typically contact us via a provided email address.</p>

            <h2 className="text-xl font-semibold text-accent">5. Data Security (Example)</h2>
            <p>We would implement reasonable security measures to protect your data (e.g., encryption, access controls).</p>
            
            <h2 className="text-xl font-semibold text-accent">6. International Data Transfers (Example)</h2>
            <p>If data is transferred outside your country (e.g., South Africa or the EU), we would ensure appropriate safeguards are in place as required by POPI and GDPR.</p>

            <h2 className="text-xl font-semibold text-accent">7. Contact Us (Example)</h2>
            <p>If you have questions about this Privacy Policy for {APP_NAME}, you would contact [Placeholder Email Address or Contact Method].</p>
            
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
