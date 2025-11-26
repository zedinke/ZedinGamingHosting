import { notFound } from 'next/navigation';
import { Providers } from '../providers';

const locales = ['hu', 'en'];

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  // Ellenőrizzük, hogy a locale érvényes-e (pl. favicon.ico ne legyen locale)
  // Statikus fájlok kizárása: favicon.ico, robots.txt, sitemap.xml, stb.
  const staticFileExtensions = ['.ico', '.txt', '.xml', '.json', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.css', '.js'];
  const isStaticFile = staticFileExtensions.some(ext => locale.toLowerCase().endsWith(ext));
  
  if (!locales.includes(locale) || isStaticFile) {
    notFound();
  }

  return (
    <html lang={locale}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

