import { getTranslations } from '@/lib/i18n';
import { requireAdmin } from '@/lib/auth-helpers';
import Link from 'next/link';

export default async function AdminCMSPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  await requireAdmin(locale);
  const t = getTranslations(locale, 'common');

  const cmsSections = [
    {
      title: 'Oldalak',
      description: 'Statikus oldalak kezelése',
      href: `/${locale}/admin/cms/pages`,
      icon: '📄',
      color: 'bg-blue-500',
    },
    {
      title: 'Blog Bejegyzések',
      description: 'Hírek és blog cikkek kezelése',
      href: `/${locale}/admin/cms/blog`,
      icon: '📝',
      color: 'bg-green-500',
    },
    {
      title: 'FAQ',
      description: 'Gyakran ismételt kérdések kezelése',
      href: `/${locale}/admin/cms/faq`,
      icon: '❓',
      color: 'bg-yellow-500',
    },
    {
      title: 'Árazási Csomagok',
      description: 'Árazási terv kezelése',
      href: `/${locale}/admin/cms/pricing`,
      icon: '💰',
      color: 'bg-purple-500',
    },
    {
      title: 'Testimonials',
      description: 'Vélemények kezelése',
      href: `/${locale}/admin/cms/testimonials`,
      icon: '⭐',
      color: 'bg-pink-500',
    },
    {
      title: 'Csapat Tagok',
      description: 'Team member profilok kezelése',
      href: `/${locale}/admin/cms/team`,
      icon: '👥',
      color: 'bg-indigo-500',
    },
    {
      title: 'Kezdőoldal Szekciók',
      description: 'Homepage szekciók szerkesztése',
      href: `/${locale}/admin/cms/homepage`,
      icon: '🏠',
      color: 'bg-teal-500',
    },
    {
      title: 'Slideshow',
      description: 'Kezdőoldal slideshow kezelése',
      href: `/${locale}/admin/cms/slideshow`,
      icon: '🖼️',
      color: 'bg-cyan-500',
    },
    {
      title: 'Játékok',
      description: 'Játékok és kategóriák kezelése',
      href: `/${locale}/admin/cms/games`,
      icon: '🎮',
      color: 'bg-orange-500',
    },
    {
      title: 'Játék Csomagok',
      description: 'Játékokhoz tartozó csomagok kezelése',
      href: `/${locale}/admin/cms/game-packages`,
      icon: '📦',
      color: 'bg-emerald-500',
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">CMS Kezelés</h1>
        <p className="text-gray-700">Tartalomkezelő rendszer</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cmsSections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all"
          >
            <div className="flex items-start gap-4">
              <div className={`${section.color} text-white p-3 rounded-lg text-2xl`}>
                {section.icon}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 mb-2">{section.title}</h2>
                <p className="text-gray-700 text-sm">{section.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

