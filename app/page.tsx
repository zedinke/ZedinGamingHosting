import { redirect } from 'next/navigation';

export default function RootPage() {
  // Átirányítás az alapértelmezett locale-re
  redirect('/hu');
}

