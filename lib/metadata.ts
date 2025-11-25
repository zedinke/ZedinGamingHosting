import { Metadata } from 'next';

export function generateMetadata({
  title,
  description,
  locale = 'hu',
}: {
  title: string;
  description?: string;
  locale?: string;
}): Metadata {
  const siteName = 'ZedinGamingHosting';
  const defaultDescription =
    locale === 'hu'
      ? 'Teljes körű gaming szerver hosting platform'
      : 'Complete gaming server hosting platform';

  return {
    title: `${title} | ${siteName}`,
    description: description || defaultDescription,
    openGraph: {
      title: `${title} | ${siteName}`,
      description: description || defaultDescription,
      type: 'website',
      locale: locale === 'hu' ? 'hu_HU' : 'en_US',
      siteName,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | ${siteName}`,
      description: description || defaultDescription,
    },
  };
}

