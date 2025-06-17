import { Suspense } from 'react';

import { Caveat, Inter } from 'next/font/google';

import { AxiomWebVitals } from 'next-axiom';
import { PublicEnvScript } from 'next-runtime-env';

import { FeatureFlagProvider } from '@documenso/lib/client-only/providers/feature-flag';
import { I18nClientProvider } from '@documenso/lib/client-only/providers/i18n.client';
import { setupI18nSSR } from '@documenso/lib/client-only/providers/i18n.server';
import { NEXT_PUBLIC_MARKETING_URL } from '@documenso/lib/constants/app';
import { getAllAnonymousFlags } from '@documenso/lib/universal/get-feature-flag';
import { TrpcProvider } from '@documenso/trpc/react';
import { cn } from '@documenso/ui/lib/utils';
import { Toaster } from '@documenso/ui/primitives/toaster';

import { ThemeProvider } from '~/providers/next-theme';
import { PlausibleProvider } from '~/providers/plausible';
import { PostHogPageview } from '~/providers/posthog';

import './globals.css';

const fontInter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const fontCaveat = Caveat({ subsets: ['latin'], variable: '--font-signature' });

export function generateMetadata() {
  return {
    title: {
      template: '%s - טופס מקוון',
      default: 'TM - טופס מקוון',
    },
    description:
      'מערכת שליחת טפסים להחתמה דיגיטלית המובילה בישראל. גם אתם רוצים לשלוח טופס לחתימה בקלות , חייגו ל- 052-5518255 המרת כל טופס word ו - PDF לטופס מקוון , שליחת מסמכים וטפסים מקוונים לחתימה דיגיטלית באון ליין.',
    keywords:
      'ט,T,ADOBEטופס,מקוון,קומ,form,DOCU, iforms,v DOC,COMSIGN,PDF,חתימה,דיגיטלי,TM,SIGN,word,2SIGN,חתימה ירוקה,טופס דיגיטלי, Online,טופס מקוון,מסמך,file,document',
    authors: { name: 'TM - Tofes Mekovan' },
    robots: 'index, follow',
    metadataBase: new URL(process.env.NEXT_PUBLIC_WEBAPP_URL ?? 'http://localhost:3000'),
    openGraph: {
      title: 'טופס מקוון',
      description:
        'מערכת שליחת טפסים להחתמה דיגיטלית המובילה בישראל. גם אתם רוצים לשלוח טופס לחתימה בקלות , חייגו ל- 052-5518255 המרת כל טופס word ו - PDF לטופס מקוון , שליחת מסמכים וטפסים מקוונים לחתימה דיגיטלית באון ליין.',
      type: 'website',
      url: process.env.NEXT_PUBLIC_WEBAPP_URL ?? 'http://localhost:3000',
      images: [
        {
          url: process.env.NEXT_PUBLIC_WEBAPP_URL + '/static/logo_icon3.jpg',
          width: 1200,
          height: 630,
          alt: 'TM - Tofes Mekovan Logo',
        },
      ],
    },
    twitter: {
      site: '@tofes-mekovan',
      card: 'summary_large_image',
      description:
        'מערכת שליחת טפסים להחתמה דיגיטלית המובילה בישראל. גם אתם רוצים לשלוח טופס לחתימה בקלות , חייגו ל- 052-5518255 המרת כל טופס word ו - PDF לטופס מקוון , שליחת מסמכים וטפסים מקוונים לחתימה דיגיטלית באון ליין.',
    },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const flags = await getAllAnonymousFlags();

  const { lang, locales, i18n } = await setupI18nSSR();

  return (
    <html
      lang={lang}
      className={cn(fontInter.variable, fontCaveat.variable)}
      suppressHydrationWarning
    >
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="google" content="notranslate" />
        <PublicEnvScript />
      </head>

      <AxiomWebVitals />

      <Suspense>
        <PostHogPageview />
      </Suspense>

      <body>
        <FeatureFlagProvider initialFlags={flags}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <PlausibleProvider>
              <TrpcProvider>
                <I18nClientProvider
                  initialLocaleData={{ lang, locales }}
                  initialMessages={i18n.messages}
                >
                  {children}
                </I18nClientProvider>
              </TrpcProvider>
            </PlausibleProvider>
          </ThemeProvider>
        </FeatureFlagProvider>

        <Toaster />
      </body>
    </html>
  );
}
