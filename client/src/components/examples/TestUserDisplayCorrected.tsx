/**
 * Test component to verify the corrected UserDisplay layout
 */
import React from 'react';
import { UserDisplay } from '@/components/layout/UserDisplay';

const TestUserDisplayCorrected: React.FC = () => {
  const privateUser = {
    id: 1,
    nickname: 'testuser',
    first_name: 'John',
    last_name: 'Doe',
    avatar: undefined,
    is_private: true
  };

  const publicUser = {
    id: 2,
    nickname: 'publicuser',
    first_name: 'Jane',
    last_name: 'Smith',
    avatar: undefined,
    is_private: false
  };

  return (
    <div className="p-4 border border-border rounded-lg bg-card">
      <h3 className="text-lg font-semibold mb-4">Corrected UserDisplay Test</h3>
      
      <div className="space-y-4">
        <div>
          <h4 className="font-medium mb-2">Private User (should show Lock icon + "Private")</h4>
          <UserDisplay 
            user={privateUser} 
            showPrivacyBadge={true}
            showNickname={false}
            showFullName={true}
            className="p-2 border border-border rounded"
          />
        </div>
        
        <div>
          <h4 className="font-medium mb-2">Public User (should show Unlock icon + "Public")</h4>
          <UserDisplay 
            user={publicUser} 
            showPrivacyBadge={true}
            showNickname={false}
            showFullName={true}
            className="p-2 border border-border rounded"
          />
        </div>
        
        <div>
          <h4 className="font-medium mb-2">Without Privacy Badge (should show only name)</h4>
          <UserDisplay 
            user={privateUser} 
            showPrivacyBadge={false}
            showNickname={false}
            showFullName={true}
            className="p-2 border border-border rounded"
          />
        </div>
      </div>
      
      <div className="mt-4 p-3 bg-muted rounded text-sm">
        <p><strong>Expected Layout:</strong></p>
        <ul className="list-disc list-inside space-y-1">
          <li><strong>Bold full name</strong> (John Doe, Jane Smith)</li>
          <li><strong>Privacy badge next to name</strong> with Lock/Unlock icon</li>
          <li><strong>No @nickname below</strong> (nickname display removed)</li>
          <li><strong>Single line layout</strong> with name and badge centered</li>
        </ul>
      </div>
    </div>
  );
};

export default TestUserDisplayCorrected;
