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
  if (!locales.includes(locale)) {
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

