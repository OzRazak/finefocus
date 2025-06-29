
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/contexts/AuthContext';
import { APP_NAME, APP_SUBTITLE } from '@/lib/constants';
import BackgroundManager from '@/components/domain/BackgroundManager';
import FooterComponent from '@/components/domain/FooterComponent';
import { ThemeProvider } from 'next-themes';
import PageWrapper from '@/components/ui/animations/PageWrapper';
import PwaInstallNudge from '@/components/domain/PwaInstallNudge';

const newMetaDescription = `Master focus with ${APP_NAME}, your AI Powered Pomodoro Timer. Smart task breakdown & effective time management for deep work. Boost productivity today!`;
const siteBaseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://auxofocus.netlify.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteBaseUrl),
  title: {
    default: `${APP_NAME} - AI Powered Pomodoro Timer for Enhanced Productivity`,
    template: `%s | ${APP_NAME}`,
  },
  description: newMetaDescription,
  manifest: '/manifest.json',
  applicationName: APP_NAME,
  appleWebApp: {
    capable: true,
    title: APP_NAME,
    statusBarStyle: 'default',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    shortcut: '/icons/favicon.ico',
    apple: '/icons/apple-touch-icon-180x180.png',
    icon: [
        { url: '/icons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
        { url: '/icons/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
  },
  openGraph: {
    type: 'website',
    url: siteBaseUrl,
    title: `${APP_NAME} - AI Powered Pomodoro Timer`,
    description: newMetaDescription,
    siteName: APP_NAME,
    images: [
      {
        url: `${siteBaseUrl}/og-image.png`, // Ensure this is an absolute URL
        width: 1200,
        height: 630,
        alt: `${APP_NAME} - AI Powered Pomodoro Timer`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${APP_NAME} - AI Powered Pomodoro Timer`,
    description: newMetaDescription,
    images: [`${siteBaseUrl}/og-image.png`], // Ensure this is an absolute URL
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": APP_NAME,
  "applicationCategory": "ProductivityApplication",
  "operatingSystem": "Web",
  "url": siteBaseUrl,
  "description": `${APP_NAME} is an AI Powered Pomodoro Timer designed to help you master focus, manage tasks intelligently, and boost productivity through effective time management.`,
  "featureList": [
    "AI Task Breakdown",
    "Customizable Pomodoro Timer",
    "Lifespan Visualizer",
    "Productivity Statistics",
    "Gamified Focus (Leaderboards)",
    "Personalized Settings",
    "Focus Music Integration"
  ],
  "offers": {
    "@type": "Offer",
    "price": "0.00",
    "priceCurrency": "USD"
  },
  "keywords": "AI pomodoro timer, smart pomodoro, productivity app, focus timer, task management AI, time management AI"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#000000" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Literata:ital,opsz,wght@0,7..72,200..900;1,7..72,200..900&family=Montserrat:wght@300;400;500;600;700;800&family=Courier+Prime:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className="font-body antialiased min-h-screen flex flex-col text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <AuthProvider>
            <BackgroundManager>
              <div className="flex flex-col flex-grow">
                <PageWrapper>{children}</PageWrapper>
              </div>
              <PwaInstallNudge />
              <FooterComponent />
            </BackgroundManager>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
