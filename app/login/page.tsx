import { redirect } from 'next/navigation';

export default function LoginRedirectPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  // Alapértelmezett locale: hu
  const locale = 'hu';
  
  // Query paraméterek megtartása
  const queryString = new URLSearchParams();
  Object.entries(searchParams).forEach(([key, value]) => {
    if (value) {
      if (Array.isArray(value)) {
        value.forEach((v) => queryString.append(key, v));
      } else {
        queryString.set(key, value);
      }
    }
  });
  
  const query = queryString.toString();
  const redirectUrl = `/${locale}/login${query ? `?${query}` : ''}`;
  
  redirect(redirectUrl);
}

