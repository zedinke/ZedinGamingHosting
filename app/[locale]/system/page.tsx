import { Navigation } from '@/components/Navigation';
import { getTranslations } from '@/lib/i18n';
import { Footer } from '@/components/home/Footer';
import { readFileSync } from 'fs';
import { join } from 'path';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { 
  Server, 
  CreditCard, 
  Activity, 
  Zap, 
  Headphones, 
  FileText, 
  Shield, 
  TrendingUp,
  Gamepad2,
  Users,
  Settings,
  BarChart3,
  UserCog,
  LayoutDashboard,
  Code,
  Globe,
  Database,
  Cpu,
  HardDrive
} from 'lucide-react';

export default async function SystemPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const VALID_LOCALES = ['hu', 'en', 'es', 'fr'];
  const validLocale = VALID_LOCALES.includes(locale) ? locale : 'en';
  
  const t = getTranslations(validLocale, 'common');
  
  // Load translations server-side
  let translations = {};
  try {
    const filePath = join(process.cwd(), 'public', 'locales', validLocale, 'common.json');
    const fileContents = readFileSync(filePath, 'utf8');
    translations = JSON.parse(fileContents);
  } catch (error) {
    console.error('Failed to load translations:', error);
  }

  const getNestedValue = (obj: any, path: string) => {
    return path.split('.').reduce((current, key) => current?.[key], obj) || path;
  };

  const t_system = (key: string) => getNestedValue(translations, `system.${key}`);

  return (
    <div className="min-h-screen bg-white">
      <Navigation locale={locale} />
      
      <main>
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-20 md:py-32">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center px-4 py-2 mb-6 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
                <span className="text-sm font-semibold">
                  {t_system('subtitle')}
                </span>
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
                {t_system('title')}
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-3xl mx-auto leading-relaxed">
                {t_system('intro.description')}
              </p>
            </div>
          </div>
        </section>

        {/* Intro Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-8 text-gray-900">
                {t_system('intro.title')}
              </h2>
              <p className="text-lg md:text-xl text-gray-700 text-center leading-relaxed">
                {t_system('intro.description')}
              </p>
            </div>
          </div>
        </section>

        {/* Games Section */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
                {t_system('games.title')}
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                {t_system('games.subtitle')}
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* ARK */}
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-gray-200">
                <div className="flex items-center mb-4">
                  <Gamepad2 className="w-8 h-8 text-blue-600 mr-3" />
                  <h3 className="text-xl font-bold text-gray-900">
                    {t_system('games.ark.title')}
                  </h3>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  {t_system('games.ark.description')}
                </p>
              </div>

              {/* Survival Games */}
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-gray-200">
                <div className="flex items-center mb-4">
                  <Users className="w-8 h-8 text-green-600 mr-3" />
                  <h3 className="text-xl font-bold text-gray-900">
                    {t_system('games.survival.title')}
                  </h3>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  {t_system('games.survival.description')}
                </p>
              </div>

              {/* Minecraft */}
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-gray-200">
                <div className="flex items-center mb-4">
                  <Gamepad2 className="w-8 h-8 text-yellow-600 mr-3" />
                  <h3 className="text-xl font-bold text-gray-900">
                    {t_system('games.minecraft.title')}
                  </h3>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  {t_system('games.minecraft.description')}
                </p>
              </div>

              {/* FPS Games */}
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-gray-200">
                <div className="flex items-center mb-4">
                  <Activity className="w-8 h-8 text-red-600 mr-3" />
                  <h3 className="text-xl font-bold text-gray-900">
                    {t_system('games.fps.title')}
                  </h3>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  {t_system('games.fps.description')}
                </p>
              </div>

              {/* Other Games */}
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-gray-200 md:col-span-2 lg:col-span-1">
                <div className="flex items-center mb-4">
                  <Gamepad2 className="w-8 h-8 text-purple-600 mr-3" />
                  <h3 className="text-xl font-bold text-gray-900">
                    {t_system('games.other.title')}
                  </h3>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  {t_system('games.other.description')}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
                {t_system('features.title')}
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                {t_system('features.subtitle')}
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
              {/* Server Management */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
                <div className="bg-blue-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Server className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">
                  {t_system('features.serverManagement.title')}
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {t_system('features.serverManagement.description')}
                </p>
              </div>

              {/* Billing */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
                <div className="bg-green-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">
                  {t_system('features.billing.title')}
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {t_system('features.billing.description')}
                </p>
              </div>

              {/* Monitoring */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
                <div className="bg-purple-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">
                  {t_system('features.monitoring.title')}
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {t_system('features.monitoring.description')}
                </p>
              </div>

              {/* Automation */}
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
                <div className="bg-yellow-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">
                  {t_system('features.automation.title')}
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {t_system('features.automation.description')}
                </p>
              </div>

              {/* Support */}
              <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
                <div className="bg-pink-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Headphones className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">
                  {t_system('features.support.title')}
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {t_system('features.support.description')}
                </p>
              </div>

              {/* CMS */}
              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
                <div className="bg-indigo-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">
                  {t_system('features.cms.title')}
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {t_system('features.cms.description')}
                </p>
              </div>

              {/* Security */}
              <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
                <div className="bg-red-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">
                  {t_system('features.security.title')}
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {t_system('features.security.description')}
                </p>
              </div>

              {/* Scalability */}
              <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
                <div className="bg-teal-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">
                  {t_system('features.scalability.title')}
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {t_system('features.scalability.description')}
                </p>
              </div>

              {/* User Management */}
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
                <div className="bg-orange-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <UserCog className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">
                  {t_system('features.userManagement.title')}
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {t_system('features.userManagement.description')}
                </p>
              </div>

              {/* Admin Panel */}
              <div className="bg-gradient-to-br from-violet-50 to-violet-100 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
                <div className="bg-violet-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <LayoutDashboard className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">
                  {t_system('features.adminPanel.title')}
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {t_system('features.adminPanel.description')}
                </p>
              </div>

              {/* API */}
              <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
                <div className="bg-cyan-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Code className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">
                  {t_system('features.api.title')}
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {t_system('features.api.description')}
                </p>
              </div>

              {/* Multilanguage */}
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
                <div className="bg-emerald-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Globe className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">
                  {t_system('features.multilanguage.title')}
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {t_system('features.multilanguage.description')}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Technical Details Section */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
                {t_system('technical.title')}
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                {t_system('technical.subtitle')}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {/* Frontend */}
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
                <div className="flex items-center mb-4">
                  <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mr-4">
                    <Code className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {t_system('technical.frontend.title')}
                  </h3>
                </div>
                <p className="text-gray-700 leading-relaxed">
                  {t_system('technical.frontend.description')}
                </p>
              </div>

              {/* Backend */}
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
                <div className="flex items-center mb-4">
                  <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mr-4">
                    <Server className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {t_system('technical.backend.title')}
                  </h3>
                </div>
                <p className="text-gray-700 leading-relaxed">
                  {t_system('technical.backend.description')}
                </p>
              </div>

              {/* Database */}
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
                <div className="flex items-center mb-4">
                  <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mr-4">
                    <Database className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {t_system('technical.database.title')}
                  </h3>
                </div>
                <p className="text-gray-700 leading-relaxed">
                  {t_system('technical.database.description')}
                </p>
              </div>

              {/* Deployment */}
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
                <div className="flex items-center mb-4">
                  <div className="bg-orange-100 w-12 h-12 rounded-lg flex items-center justify-center mr-4">
                    <HardDrive className="w-6 h-6 text-orange-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {t_system('technical.deployment.title')}
                  </h3>
                </div>
                <p className="text-gray-700 leading-relaxed">
                  {t_system('technical.deployment.description')}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
                {t_system('stats.title')}
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-6xl mx-auto">
              <div className="text-center bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 shadow-lg">
                <Cpu className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {t_system('stats.models')}
                </div>
                <div className="text-sm text-gray-600">{t_system('stats.labels.models') || 'Database models'}</div>
              </div>

              <div className="text-center bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 shadow-lg">
                <Code className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {t_system('stats.endpoints')}
                </div>
                <div className="text-sm text-gray-600">{t_system('stats.labels.endpoints') || 'API endpoints'}</div>
              </div>

              <div className="text-center bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 shadow-lg">
                <FileText className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {t_system('stats.components')}
                </div>
                <div className="text-sm text-gray-600">{t_system('stats.labels.components') || 'React components'}</div>
              </div>

              <div className="text-center bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 shadow-lg">
                <LayoutDashboard className="w-12 h-12 text-orange-600 mx-auto mb-4" />
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {t_system('stats.pages')}
                </div>
                <div className="text-sm text-gray-600">{t_system('stats.labels.pages') || 'Pages'}</div>
              </div>

              <div className="text-center bg-gradient-to-br from-pink-50 to-pink-100 rounded-2xl p-6 shadow-lg">
                <Gamepad2 className="w-12 h-12 text-pink-600 mx-auto mb-4" />
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {t_system('stats.games')}
                </div>
                <div className="text-sm text-gray-600">{t_system('stats.labels.games') || 'Supported games'}</div>
              </div>

              <div className="text-center bg-gradient-to-br from-teal-50 to-teal-100 rounded-2xl p-6 shadow-lg">
                <Globe className="w-12 h-12 text-teal-600 mx-auto mb-4" />
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {t_system('stats.languages')}
                </div>
                <div className="text-sm text-gray-600">{t_system('stats.labels.languages') || 'Languages'}</div>
              </div>

              <div className="text-center bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-2xl p-6 shadow-lg">
                <Activity className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {t_system('stats.uptime')}
                </div>
                <div className="text-sm text-gray-600">{t_system('stats.labels.uptime') || 'Average uptime'}</div>
              </div>

              <div className="text-center bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-6 shadow-lg">
                <Headphones className="w-12 h-12 text-red-600 mx-auto mb-4" />
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {t_system('stats.support')}
                </div>
                <div className="text-sm text-gray-600">{t_system('stats.labels.support') || 'Support'}</div>
              </div>
            </div>
          </div>
        </section>

        {/* Why Section */}
        <section className="py-20 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-4xl md:text-5xl font-bold mb-8">
                {t_system('why.title')}
              </h2>
              <p className="text-xl md:text-2xl text-gray-300 leading-relaxed">
                {t_system('why.description')}
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-12 md:p-16 shadow-xl border border-blue-100">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
                {t_system('cta.title')}
              </h2>
              <p className="text-xl text-gray-700 mb-10 max-w-2xl mx-auto">
                {t_system('cta.description')}
              </p>
              <Link href={`/${locale}/register`}>
                <Button size="lg" className="bg-gray-900 text-white hover:bg-gray-800 px-8 py-4 text-lg font-semibold rounded-lg transition-colors">
                  {t_system('cta.button')}
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer locale={locale} />
    </div>
  );
}

