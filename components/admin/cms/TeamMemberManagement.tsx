'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Mail, Twitter, Linkedin, Github } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string | null;
  avatar: string | null;
  email: string | null;
  socialLinks: any;
  isActive: boolean;
  order: number;
}

interface TeamMemberManagementProps {
  teamMembers: TeamMember[];
  locale: string;
}

export function TeamMemberManagement({
  teamMembers,
  locale,
}: TeamMemberManagementProps) {
  const getSocialIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'twitter':
      case 'x':
        return <Twitter className="w-4 h-4" />;
      case 'linkedin':
        return <Linkedin className="w-4 h-4" />;
      case 'github':
        return <Github className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Team Members grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teamMembers.map((member) => (
          <Card key={member.id} className={!member.isActive ? 'opacity-60' : ''} hover>
            <div className="text-center mb-4">
              {member.avatar ? (
                <img
                  src={member.avatar}
                  alt={member.name}
                  className="w-24 h-24 rounded-full object-cover mx-auto mb-4"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-3xl mx-auto mb-4">
                  {member.name.charAt(0).toUpperCase()}
                </div>
              )}
              <h3 className="font-semibold text-xl mb-1">{member.name}</h3>
              <p className="text-primary-600 font-medium mb-2">{member.role}</p>
              {member.bio && (
                <p className="text-gray-600 text-sm line-clamp-3 mb-4">{member.bio}</p>
              )}
            </div>

            {/* Social links */}
            {member.socialLinks && typeof member.socialLinks === 'object' && (
              <div className="flex justify-center gap-3 mb-4">
                {Object.entries(member.socialLinks).map(([platform, url]: [string, any]) => (
                  <a
                    key={platform}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-primary-600 transition-colors"
                  >
                    {getSocialIcon(platform)}
                  </a>
                ))}
              </div>
            )}

            {/* Email */}
            {member.email && (
              <div className="flex items-center justify-center gap-2 mb-4 text-sm text-gray-600">
                <Mail className="w-4 h-4" />
                <a href={`mailto:${member.email}`} className="hover:text-primary-600">
                  {member.email}
                </a>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-2">
                <Badge variant={member.isActive ? 'success' : 'default'} size="sm">
                  {member.isActive ? 'Aktív' : 'Inaktív'}
                </Badge>
                <span className="text-xs text-gray-500">#{member.order}</span>
              </div>
              <Link
                href={`/${locale}/admin/cms/team/${member.id}`}
                className="text-primary-600 hover:underline text-sm"
              >
                Szerkesztés
              </Link>
            </div>
          </Card>
        ))}
      </div>

      {teamMembers.length === 0 && (
        <Card className="text-center py-12">
          <p className="text-gray-600">Még nincs csapat tag</p>
        </Card>
      )}
    </div>
  );
}

