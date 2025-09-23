/**
 * Example component demonstrating the enhanced UserDisplay with privacy badge
 */
import React from 'react';
import { UserDisplay } from '@/components/layout/UserDisplay';
import { User } from '@/lib/types/user';

const UserDisplayExample: React.FC = () => {
  // Example users with different privacy settings
  const publicUser: User = {
    id: 1,
    nickname: 'johndoe',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
    date_of_birth: '1990-01-01',
    avatar: undefined,
    bio: 'Public user example',
    is_private: false,
    created_at: '2023-01-01T00:00:00Z',
    followers: 100,
    followed: 50,
  };

  const privateUser: User = {
    id: 2,
    nickname: 'janedoe',
    first_name: 'Jane',
    last_name: 'Doe',
    email: 'jane@example.com',
    date_of_birth: '1992-05-15',
    avatar: undefined,
    bio: 'Private user example',
    is_private: true,
    created_at: '2023-01-01T00:00:00Z',
    followers: 25,
    followed: 10,
  };

  return (
    <div className="p-6 space-y-6 bg-background">
      <h2 className="text-2xl font-bold text-foreground mb-4">
        Enhanced UserDisplay Examples
      </h2>
      
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Default Variant (with privacy badge)</h3>
          <div className="space-y-2">
            <UserDisplay 
              user={publicUser} 
              showPrivacyBadge={true}
              className="p-3 border border-border rounded-lg"
            />
            <UserDisplay 
              user={privateUser} 
              showPrivacyBadge={true}
              className="p-3 border border-border rounded-lg"
            />
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Compact Variant (with privacy badge)</h3>
          <div className="space-y-2">
            <UserDisplay 
              user={publicUser} 
              variant="compact"
              showPrivacyBadge={true}
              className="p-3 border border-border rounded-lg"
            />
            <UserDisplay 
              user={privateUser} 
              variant="compact"
              showPrivacyBadge={true}
              className="p-3 border border-border rounded-lg"
            />
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Detailed Variant (with privacy badge)</h3>
          <div className="space-y-2">
            <UserDisplay 
              user={publicUser} 
              variant="detailed"
              showPrivacyBadge={true}
              className="p-3 border border-border rounded-lg"
            />
            <UserDisplay 
              user={privateUser} 
              variant="detailed"
              showPrivacyBadge={true}
              className="p-3 border border-border rounded-lg"
            />
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Without Privacy Badge (original behavior)</h3>
          <div className="space-y-2">
            <UserDisplay 
              user={publicUser} 
              showPrivacyBadge={false}
              className="p-3 border border-border rounded-lg"
            />
            <UserDisplay 
              user={privateUser} 
              showPrivacyBadge={false}
              className="p-3 border border-border rounded-lg"
            />
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-muted rounded-lg">
        <h4 className="font-semibold text-foreground mb-2">Changes Made:</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• <strong>Full name is now bold:</strong> Changed from <code>font-medium</code> to <code>font-bold</code></li>
          <li>• <strong>Privacy badge replaces @nickname:</strong> Shows Lock/Unlock icon with "Private"/"Public" text</li>
          <li>• <strong>Badge matches profile design:</strong> Same styling as used in profile page</li>
          <li>• <strong>Badge is centered with name:</strong> Positioned next to the full name</li>
          <li>• <strong>Reusable component:</strong> Created <code>PrivacyBadge</code> component for consistency</li>
        </ul>
      </div>
    </div>
  );
};

export default UserDisplayExample;
