/**
 * Test component to verify UserDisplay changes are working
 */
import React from 'react';
import { UserDisplay } from '@/components/layout/UserDisplay';

const TestUserDisplay: React.FC = () => {
  const testUser = {
    id: 1,
    nickname: 'testuser',
    first_name: 'Test',
    last_name: 'User',
    avatar: undefined,
    is_private: true
  };

  return (
    <div className="p-4 border border-border rounded-lg bg-card">
      <h3 className="text-lg font-semibold mb-4">UserDisplay Test</h3>
      
      <div className="space-y-4">
        <div>
          <h4 className="font-medium mb-2">With Privacy Badge (Private User)</h4>
          <UserDisplay 
            user={testUser} 
            showPrivacyBadge={true}
            showNickname={true}
            showFullName={true}
          />
        </div>
        
        <div>
          <h4 className="font-medium mb-2">Public User</h4>
          <UserDisplay 
            user={{...testUser, is_private: false}} 
            showPrivacyBadge={true}
            showNickname={true}
            showFullName={true}
          />
        </div>
        
        <div>
          <h4 className="font-medium mb-2">Without Privacy Badge</h4>
          <UserDisplay 
            user={testUser} 
            showPrivacyBadge={false}
            showNickname={true}
            showFullName={true}
          />
        </div>
      </div>
      
      <div className="mt-4 p-3 bg-muted rounded text-sm">
        <p><strong>Expected Changes:</strong></p>
        <ul className="list-disc list-inside space-y-1">
          <li>Nickname should be larger (text-base instead of text-sm)</li>
          <li>Privacy badge should show 🔒 Private or 🌐 Public</li>
          <li>Badge should be color-coded (orange for private, green for public)</li>
        </ul>
      </div>
    </div>
  );
};

export default TestUserDisplay;
