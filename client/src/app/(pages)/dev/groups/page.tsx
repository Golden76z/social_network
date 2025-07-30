"use client"
import { apiClient } from '@/lib/api';
import { groupApi } from '@/lib/api/group';
import { useState } from 'react';
import { 
  CreateGroupRequest, 
  UpdateGroupRequest,
  CreateGroupPostRequest,
  UpdateGroupPostRequest,
  CreateGroupCommentRequest,
  UpdateGroupCommentRequest,
  CreateGroupEventRequest,
  UpdateGroupEventRequest,
//   InviteToGroupRequest,
  UpdateGroupMemberRequest,
  RSVPToEventRequest,
  EventRsvp
} from '@/lib/types';

const GroupDebugPanel = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [results, setResults] = useState<any[]>([]);
  
  // Test IDs for various entities
  const [testGroupId, setTestGroupId] = useState<string>("1");
  const [testPostId, setTestPostId] = useState<string>("1");
  const [testCommentId] = useState<string>("1");
  const [testEventId, setTestEventId] = useState<string>("1");
  const [testUserId, setTestUserId] = useState<string>("1");
//   const [testInvitationId, setTestInvitationId] = useState<string>("1");
  const [testRsvpId] = useState<string>("1");

  const addResult = (endpoint: string, status: 'success' | 'error', data?: unknown, error?: string) => {
    const result = {
      endpoint,
      status,
      data,
      error,
      timestamp: new Date().toLocaleTimeString()
    };
    console.log(`${status === 'success' ? '✅' : '❌'} ${endpoint}:`, result);
    setResults(prev => [result, ...prev.slice(0, 14)]); // Keep last 15 results
  };

  const testEndpoint = async (endpoint: string, apiCall: () => Promise<unknown>) => {
    try {
      console.log(`🧪 Testing ${endpoint}...`);
      const data = await apiCall();
      addResult(endpoint, 'success', data);
    } catch (error) {
      addResult(endpoint, 'error', undefined, error instanceof Error ? error.message : 'Unknown error');
    }
  };

  // Test data for creating groups
  const testGroupData: CreateGroupRequest = {
    name: "Test Group",
    description: "This is a test group description",
    isPrivate: false
  };

  const testUpdateGroupData: UpdateGroupRequest = {
    name: "Updated Test Group",
    description: "Updated group description",
    isPrivate: true
  };

  // Test data for group posts
  const testGroupPostData: CreateGroupPostRequest = {
    groupId: testGroupId,
    title: "Test Group Post",
    body: "This is a test group post content"
  };

  const testUpdateGroupPostData: UpdateGroupPostRequest = {
    title: "Updated Group Post Title",
    body: "Updated group post content"
  };

  // Test data for group comments
  const testGroupCommentData: CreateGroupCommentRequest = {
    groupPostId: testPostId,
    body: "This is a test group comment"
  };

  const testUpdateGroupCommentData: UpdateGroupCommentRequest = {
    body: "Updated group comment content"
  };

  // Test data for group events
  const testGroupEventData: CreateGroupEventRequest = {
    groupId: testGroupId,
    title: "Test Group Event",
    description: "This is a test group event",
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
    location: "Test Location"
  };

  const testUpdateGroupEventData: UpdateGroupEventRequest = {
    title: "Updated Group Event",
    description: "Updated event description",
    location: "Updated Location"
  };

  // Test data for invitations and RSVP
//   const testInviteData: InviteToGroupRequest = {
//     groupId: testGroupId,
//     userId: testUserId
//   };

  const testUpdateMemberData: UpdateGroupMemberRequest = {
    groupId: testGroupId,
    memberId: testUserId,
    role: 'admin'
  };

  const testRSVPData: RSVPToEventRequest = {
    eventId: testEventId,
    status: 'going' as EventRsvp
  };

  const testCookies = () => {
    console.log('🍪 Current cookies:', document.cookie);
    console.log('🔍 Has jwt_token:', apiClient.isAuthenticated());
    console.log('👤 User from token:', apiClient.getUserFromToken());
  };

  return (
    <div className="fixed bottom-4 left-4 bg-white border rounded-lg p-4 shadow-lg max-w-4xl z-50 max-h-[600px] overflow-y-auto">
      <h3 className="font-bold mb-3 text-lg">Groups API Debug Panel</h3>
      
      {/* Input controls */}
      <div className="mb-4 space-y-2">
        <div className="grid grid-cols-4 gap-2 text-xs">
          <div>
            <label className="block font-medium">Group ID:</label>
            <input
              type="text"
              value={testGroupId}
              onChange={(e) => setTestGroupId(e.target.value)}
              className="border rounded px-2 py-1 w-full"
            />
          </div>
          <div>
            <label className="block font-medium">Post ID:</label>
            <input
              type="text"
              value={testPostId}
              onChange={(e) => setTestPostId(e.target.value)}
              className="border rounded px-2 py-1 w-full"
            />
          </div>
          <div>
            <label className="block font-medium">Event ID:</label>
            <input
              type="text"
              value={testEventId}
              onChange={(e) => setTestEventId(e.target.value)}
              className="border rounded px-2 py-1 w-full"
            />
          </div>
          <div>
            <label className="block font-medium">User ID:</label>
            <input
              type="text"
              value={testUserId}
              onChange={(e) => setTestUserId(e.target.value)}
              className="border rounded px-2 py-1 w-full"
            />
          </div>
        </div>
      </div>

      {/* Group Management */}
      <div className="mb-4">
        <h4 className="font-semibold mb-2 text-sm">Group Management</h4>
        <div className="grid grid-cols-5 gap-1">
          <button
            onClick={() => testEndpoint('GET /api/group (all)', () => groupApi.getAllGroups())}
            className="bg-blue-500 text-white px-2 py-1 rounded text-xs"
          >
            All Groups
          </button>
          <button
            onClick={() => testEndpoint(`GET /api/group/${testGroupId}`, () => groupApi.getGroupById(testGroupId))}
            className="bg-blue-500 text-white px-2 py-1 rounded text-xs"
          >
            Group by ID
          </button>
          <button
            onClick={() => testEndpoint('POST /api/group', () => groupApi.createGroup(testGroupData))}
            className="bg-green-500 text-white px-2 py-1 rounded text-xs"
          >
            Create Group
          </button>
          <button
            onClick={() => testEndpoint(`PUT /api/group/${testGroupId}`, () => groupApi.updateGroup(testGroupId, testUpdateGroupData))}
            className="bg-orange-500 text-white px-2 py-1 rounded text-xs"
          >
            Update Group
          </button>
          <button
            onClick={() => testEndpoint(`DELETE /api/group/${testGroupId}`, () => groupApi.deleteGroup(testGroupId))}
            className="bg-red-500 text-white px-2 py-1 rounded text-xs"
          >
            Delete Group
          </button>
        </div>
      </div>

      {/* Group Posts */}
      <div className="mb-4">
        <h4 className="font-semibold mb-2 text-sm">Group Posts</h4>
        <div className="grid grid-cols-5 gap-1">
          <button
            onClick={() => testEndpoint(`GET /api/group/post?groupId=${testGroupId}`, () => groupApi.getGroupPosts(testGroupId))}
            className="bg-blue-500 text-white px-2 py-1 rounded text-xs"
          >
            Group Posts
          </button>
          <button
            onClick={() => testEndpoint(`GET /api/group/post/${testPostId}`, () => groupApi.getGroupPostById(testPostId))}
            className="bg-blue-500 text-white px-2 py-1 rounded text-xs"
          >
            Post by ID
          </button>
          <button
            onClick={() => testEndpoint('POST /api/group/post', () => groupApi.createGroupPost(testGroupPostData))}
            className="bg-green-500 text-white px-2 py-1 rounded text-xs"
          >
            Create Post
          </button>
          <button
            onClick={() => testEndpoint(`PUT /api/group/post/${testPostId}`, () => groupApi.updateGroupPost(testPostId, testUpdateGroupPostData))}
            className="bg-orange-500 text-white px-2 py-1 rounded text-xs"
          >
            Update Post
          </button>
          <button
            onClick={() => testEndpoint(`DELETE /api/group/post/${testPostId}`, () => groupApi.deleteGroupPost(testPostId))}
            className="bg-red-500 text-white px-2 py-1 rounded text-xs"
          >
            Delete Post
          </button>
        </div>
      </div>

      {/* Group Comments */}
      <div className="mb-4">
        <h4 className="font-semibold mb-2 text-sm">Group Comments</h4>
        <div className="grid grid-cols-5 gap-1">
          <button
            onClick={() => testEndpoint(`GET /api/group/comment?postId=${testPostId}`, () => groupApi.getGroupComments(testPostId))}
            className="bg-blue-500 text-white px-2 py-1 rounded text-xs"
          >
            Post Comments
          </button>
          <button
            onClick={() => testEndpoint(`GET /api/group/comment/${testCommentId}`, () => groupApi.getGroupCommentById(testCommentId))}
            className="bg-blue-500 text-white px-2 py-1 rounded text-xs"
          >
            Comment by ID
          </button>
          <button
            onClick={() => testEndpoint('POST /api/group/comment', () => groupApi.createGroupComment(testGroupCommentData))}
            className="bg-green-500 text-white px-2 py-1 rounded text-xs"
          >
            Create Comment
          </button>
          <button
            onClick={() => testEndpoint(`PUT /api/group/comment/${testCommentId}`, () => groupApi.updateGroupComment(testCommentId, testUpdateGroupCommentData))}
            className="bg-orange-500 text-white px-2 py-1 rounded text-xs"
          >
            Update Comment
          </button>
          <button
            onClick={() => testEndpoint(`DELETE /api/group/comment/${testCommentId}`, () => groupApi.deleteGroupComment(testCommentId))}
            className="bg-red-500 text-white px-2 py-1 rounded text-xs"
          >
            Delete Comment
          </button>
        </div>
      </div>

      {/* Group Events */}
      <div className="mb-4">
        <h4 className="font-semibold mb-2 text-sm">Group Events</h4>
        <div className="grid grid-cols-5 gap-1">
          <button
            onClick={() => testEndpoint(`GET /api/group/event?groupId=${testGroupId}`, () => groupApi.getGroupEvents(testGroupId))}
            className="bg-blue-500 text-white px-2 py-1 rounded text-xs"
          >
            Group Events
          </button>
          <button
            onClick={() => testEndpoint(`GET /api/group/event/${testEventId}`, () => groupApi.getGroupEventById(testEventId))}
            className="bg-blue-500 text-white px-2 py-1 rounded text-xs"
          >
            Event by ID
          </button>
          <button
            onClick={() => testEndpoint('POST /api/group/event', () => groupApi.createGroupEvent(testGroupEventData))}
            className="bg-green-500 text-white px-2 py-1 rounded text-xs"
          >
            Create Event
          </button>
          <button
            onClick={() => testEndpoint(`PUT /api/group/event/${testEventId}`, () => groupApi.updateGroupEvent(testEventId, testUpdateGroupEventData))}
            className="bg-orange-500 text-white px-2 py-1 rounded text-xs"
          >
            Update Event
          </button>
          <button
            onClick={() => testEndpoint(`DELETE /api/group/event/${testEventId}`, () => groupApi.deleteGroupEvent(testEventId))}
            className="bg-red-500 text-white px-2 py-1 rounded text-xs"
          >
            Delete Event
          </button>
        </div>
      </div>

      {/* Group Membership */}
      <div className="mb-4">
        <h4 className="font-semibold mb-2 text-sm">Group Membership</h4>
        <div className="grid grid-cols-4 gap-1">
          <button
            onClick={() => testEndpoint(`GET /api/group/members?groupId=${testGroupId}`, () => groupApi.getGroupMembers(testGroupId))}
            className="bg-blue-500 text-white px-2 py-1 rounded text-xs"
          >
            Group Members
          </button>
          <button
            onClick={() => testEndpoint(`POST /api/group/member`, () => groupApi.joinGroup(testGroupId))}
            className="bg-green-500 text-white px-2 py-1 rounded text-xs"
          >
            Join Group
          </button>
          <button
            onClick={() => testEndpoint(`PUT /api/group/member`, () => groupApi.updateGroupMember(testUpdateMemberData))}
            className="bg-orange-500 text-white px-2 py-1 rounded text-xs"
          >
            Update Member
          </button>
          <button
            onClick={() => testEndpoint(`DELETE /api/group/member?groupId=${testGroupId}`, () => groupApi.leaveGroup(testGroupId))}
            className="bg-red-500 text-white px-2 py-1 rounded text-xs"
          >
            Leave Group
          </button>
        </div>
      </div>

      {/* Group Invitations */}
      {/* <div className="mb-4">
        <h4 className="font-semibold mb-2 text-sm">Group Invitations</h4>
        <div className="grid grid-cols-4 gap-1">
          <button
            onClick={() => testEndpoint(`GET /api/group/invitation?groupId=${testGroupId}`, () => groupApi.getGroupInvitations(testGroupId))}
            className="bg-blue-500 text-white px-2 py-1 rounded text-xs"
          >
            Get Invitations
          </button>
          <button
            onClick={() => testEndpoint('POST /api/group/invitation', () => groupApi.sendGroupInvitation(testInviteData))}
            className="bg-green-500 text-white px-2 py-1 rounded text-xs"
          >
            Send Invitation
          </button>
          <button
            onClick={() => testEndpoint(`PUT /api/group/invitation/${testInvitationId}`, () => groupApi.updateGroupInvitation(testInvitationId, 'accepted'))}
            className="bg-orange-500 text-white px-2 py-1 rounded text-xs"
          >
            Accept Invitation
          </button>
          <button
            onClick={() => testEndpoint(`DELETE /api/group/invitation/${testInvitationId}`, () => groupApi.cancelGroupInvitation(testInvitationId))}
            className="bg-red-500 text-white px-2 py-1 rounded text-xs"
          >
            Cancel Invitation
          </button>
        </div>
      </div> */}

      {/* Event RSVP */}
      <div className="mb-4">
        <h4 className="font-semibold mb-2 text-sm">Event RSVP</h4>
        <div className="grid grid-cols-4 gap-1">
          <button
            onClick={() => testEndpoint(`GET /api/group/event/rsvp?eventId=${testEventId}`, () => groupApi.getEventRSVPs(testEventId))}
            className="bg-blue-500 text-white px-2 py-1 rounded text-xs"
          >
            Get RSVPs
          </button>
          <button
            onClick={() => testEndpoint('POST /api/group/event/rsvp', () => groupApi.rsvpToEvent(testRSVPData))}
            className="bg-green-500 text-white px-2 py-1 rounded text-xs"
          >
            RSVP Going
          </button>
          <button
            onClick={() => testEndpoint(`PUT /api/group/event/rsvp/${testRsvpId}`, () => groupApi.updateEventRSVP(testRsvpId, 'maybe'))}
            className="bg-orange-500 text-white px-2 py-1 rounded text-xs"
          >
            Update RSVP
          </button>
          <button
            onClick={() => testEndpoint(`DELETE /api/group/event/rsvp/${testRsvpId}`, () => groupApi.cancelEventRSVP(testRsvpId))}
            className="bg-red-500 text-white px-2 py-1 rounded text-xs"
          >
            Cancel RSVP
          </button>
        </div>
      </div>

      {/* Helper Methods */}
      <div className="mb-4">
        <h4 className="font-semibold mb-2 text-sm">Helper Methods</h4>
        <div className="grid grid-cols-3 gap-1">
          <button
            onClick={() => testEndpoint('GET /api/group/user', () => groupApi.getUserGroups())}
            className="bg-purple-500 text-white px-2 py-1 rounded text-xs"
          >
            My Groups
          </button>
          <button
            onClick={() => testEndpoint('GET /api/group?isPrivate=false', () => groupApi.getPublicGroups())}
            className="bg-purple-500 text-white px-2 py-1 rounded text-xs"
          >
            Public Groups
          </button>
          <button
            onClick={() => testEndpoint('GET /api/group/search?search=test', () => groupApi.searchGroups('test'))}
            className="bg-purple-500 text-white px-2 py-1 rounded text-xs"
          >
            Search Groups
          </button>
        </div>
      </div>

      {/* Utility Methods */}
      <div className="mb-4">
        <h4 className="font-semibold mb-2 text-sm">Utilities</h4>
        <div className="flex gap-2">
          <button
            onClick={testCookies}
            className="bg-gray-600 text-white px-2 py-1 rounded text-xs"
          >
            Check Auth
          </button>
          <button
            onClick={() => setResults([])}
            className="bg-gray-500 text-white px-2 py-1 rounded text-xs"
          >
            Clear Results
          </button>
        </div>
      </div>

      {/* Results Display */}
      <div className="text-xs max-h-48 overflow-y-auto border-t pt-2">
        <h4 className="font-semibold mb-2">Results:</h4>
        {results.length === 0 ? (
          <p className="text-gray-500">No results yet. Click a button to test an endpoint.</p>
        ) : (
          results.map((result, index) => (
            <div key={index} className={`mb-2 p-2 rounded ${
              result.status === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              <div className="font-mono">
                <span className={result.status === 'success' ? 'text-green-600' : 'text-red-600'}>
                  {result.status === 'success' ? '✅' : '❌'} {result.endpoint}
                </span>
                <span className="text-gray-500 ml-2">{result.timestamp}</span>
              </div>
              <div className="text-gray-600 mt-1 break-all">
                {result.status === 'success'
                  ? `Data: ${JSON.stringify(result.data, null, 2).substring(0, 200)}${JSON.stringify(result.data).length > 200 ? '...' : ''}`
                  : `Error: ${result.error}`
                }
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default GroupDebugPanel;