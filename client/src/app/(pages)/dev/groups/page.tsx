"use client"
import { groupApi } from '@/lib/api/group';
import { useState } from 'react';
import { 
  CreateGroupRequest, UpdateGroupRequest, 
  CreateGroupPostRequest, UpdateGroupPostRequest,
  CreateGroupCommentRequest, UpdateGroupCommentRequest,
  CreateGroupEventRequest, UpdateGroupEventRequest,
  UpdateGroupMemberRequest, RSVPToEventRequest, LeaveGroupRequest
} from '@/lib/types';

type PanelResult = {
  endpoint: string;
  status: 'success' | 'error';
  data?: unknown;
  error?: string;
  timestamp: string;
};

const GroupDebugPanel = () => {
  const [results, setResults] = useState<PanelResult[]>([]);
  const [testGroupId, setTestGroupId] = useState("1");
  const [testPostId, setTestPostId] = useState("1");
  const [testCommentId, setTestCommentId] = useState("1");
  const [testEventId, setTestEventId] = useState("1");
  const [testUserId, setTestUserId] = useState("1");
  const [testRsvpId, setTestRsvpId] = useState("1");

  const addResult = (endpoint: string, status: 'success' | 'error', data?: unknown, error?: string) => {
    const result = {
      endpoint,
      status,
      data,
      error,
      timestamp: new Date().toLocaleTimeString()
    };
    console.log(`${status === 'success' ? '✅' : '❌'} ${endpoint}:`, result);
    setResults(prev => [result, ...prev.slice(0, 14)]);
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

  // --- Sample Data ---
  const testGroupData: CreateGroupRequest = {
    title: "Test Group",
    avatar: "https://images.unsplash.com/photo-1608889825103-eb5ed706fc64?w=400&h=400&fit=crop&crop=center",
    bio: "This is a test group description"
  };

  const testUpdateGroupData: UpdateGroupRequest = {
    title: "Updated Test Group",
    avatar: "https://images.unsplash.com/photo-1608889825103-eb5ed706fc64?w=400&h=400&fit=crop&crop=center",
    bio: "Updated group description"
  };

  const testGroupPostData: CreateGroupPostRequest = {
    group_id: Number(testGroupId),
    title: "Test Post",
    body: "This is a test post"
  };

  const testUpdateGroupPostData: UpdateGroupPostRequest = {
    title: "Updated Post Title",
    body: "Updated post content"
  };

  const testGroupCommentData: CreateGroupCommentRequest = {
    group_post_id: Number(testPostId),
    body: "This is a test comment"
  };

  const testUpdateGroupCommentData: UpdateGroupCommentRequest = {
    body: "Updated comment content"
  };

  const testGroupEventData: CreateGroupEventRequest = {
    group_id: Number(testGroupId),
    title: "Test Event",
    description: "Event description",
    event_date_time: new Date(Date.now() + 7*24*60*60*1000).toISOString()
  };

  const testUpdateGroupEventData: UpdateGroupEventRequest = {
    title: "Updated Event",
    description: "Updated description",
    event_date_time: new Date(Date.now() + 10*24*60*60*1000).toISOString()
  };

  const testUpdateMemberData: UpdateGroupMemberRequest = {
    groupID: Number(testGroupId),
    memberID: Number(testUserId),
    role: 'admin'
  };

  const testRSVPData: RSVPToEventRequest = {
    event_id: Number(testEventId),
    user_id: Number(testUserId),
    status: 'come'
  };

  const testLeaveGroupData: LeaveGroupRequest = {
    group_id: Number(testGroupId),
    user_id: Number(testUserId)
  };

  const testCookies = () => console.log('🍪 Cookies:', document.cookie);

  return (
    <div className="fixed bottom-4 left-4 bg-white border rounded-lg p-4 shadow-lg max-w-4xl z-50 max-h-[1200px] overflow-y-auto">
      <h3 className="font-bold mb-3 text-lg">Groups API Debug Panel</h3>

      {/* Inputs */}
      <div className="mb-4 grid grid-cols-4 gap-2 text-xs">
        {['Group','Post','Comment','Event','User','RSVP'].map((label,i)=>(
          <div key={i}>
            <label className="block font-medium">{label} ID:</label>
            <input 
              type="text" 
              value={{
                Group: testGroupId,
                Post: testPostId,
                Comment: testCommentId,
                Event: testEventId,
                User: testUserId,
                RSVP: testRsvpId
              }[label]} 
              onChange={e=>{
                const v=e.target.value;
                if(label==='Group') setTestGroupId(v)
                else if(label==='Post') setTestPostId(v)
                else if(label==='Comment') setTestCommentId(v)
                else if(label==='Event') setTestEventId(v)
                else if(label==='User') setTestUserId(v)
                else setTestRsvpId(v)
              }} 
              className="border rounded px-2 py-1 w-full"
            />
          </div>
        ))}
      </div>

      {/* Groups */}
      <div className="mb-4">
        <h4 className="font-semibold mb-2 text-sm">Groups</h4>
        <div className="grid grid-cols-5 gap-1">
          <button onClick={()=>testEndpoint('getAllGroups',()=>groupApi.getAllGroups())} className="bg-blue-500 text-white px-2 py-1 rounded text-xs">All</button>
          <button onClick={()=>testEndpoint(`getGroupById`,()=>groupApi.getGroupById(testGroupId))} className="bg-blue-500 text-white px-2 py-1 rounded text-xs">By ID</button>
          <button onClick={()=>testEndpoint('createGroup',()=>groupApi.createGroup(testGroupData))} className="bg-green-500 text-white px-2 py-1 rounded text-xs">Create</button>
          <button onClick={()=>testEndpoint('updateGroup',()=>groupApi.updateGroup(testGroupId,testUpdateGroupData))} className="bg-orange-500 text-white px-2 py-1 rounded text-xs">Update</button>
          <button onClick={()=>testEndpoint('deleteGroup',()=>groupApi.deleteGroup(testGroupId))} className="bg-red-500 text-white px-2 py-1 rounded text-xs">Delete</button>
        </div>
      </div>

      {/* Posts */}
      <div className="mb-4">
        <h4 className="font-semibold mb-2 text-sm">Posts</h4>
        <div className="grid grid-cols-5 gap-1">
          <button onClick={()=>testEndpoint('getGroupPosts',()=>groupApi.getGroupPosts(testGroupId))} className="bg-blue-500 text-white px-2 py-1 rounded text-xs">Group Posts</button>
          <button onClick={()=>testEndpoint('getGroupPostById',()=>groupApi.getGroupPostById(testPostId))} className="bg-blue-500 text-white px-2 py-1 rounded text-xs">By ID</button>
          <button onClick={()=>testEndpoint('createGroupPost',()=>groupApi.createGroupPost(testGroupPostData))} className="bg-green-500 text-white px-2 py-1 rounded text-xs">Create</button>
          <button onClick={()=>testEndpoint('updateGroupPost',()=>groupApi.updateGroupPost(testPostId,testUpdateGroupPostData))} className="bg-orange-500 text-white px-2 py-1 rounded text-xs">Update</button>
          <button onClick={()=>testEndpoint('deleteGroupPost',()=>groupApi.deleteGroupPost(testPostId))} className="bg-red-500 text-white px-2 py-1 rounded text-xs">Delete</button>
        </div>
      </div>

      {/* Comments */}
      <div className="mb-4">
        <h4 className="font-semibold mb-2 text-sm">Comments</h4>
        <div className="grid grid-cols-5 gap-1">
          <button onClick={()=>testEndpoint('getGroupComments',()=>groupApi.getGroupComments(testPostId))} className="bg-blue-500 text-white px-2 py-1 rounded text-xs">Post Comments</button>
          <button onClick={()=>testEndpoint('getGroupCommentById',()=>groupApi.getGroupCommentById(testCommentId))} className="bg-blue-500 text-white px-2 py-1 rounded text-xs">By ID</button>
          <button onClick={()=>testEndpoint('createGroupComment',()=>groupApi.createGroupComment(testGroupCommentData))} className="bg-green-500 text-white px-2 py-1 rounded text-xs">Create</button>
          <button onClick={()=>testEndpoint('updateGroupComment',()=>groupApi.updateGroupComment(testCommentId,testUpdateGroupCommentData))} className="bg-orange-500 text-white px-2 py-1 rounded text-xs">Update</button>
          <button onClick={()=>testEndpoint('deleteGroupComment',()=>groupApi.deleteGroupComment(testCommentId))} className="bg-red-500 text-white px-2 py-1 rounded text-xs">Delete</button>
        </div>
      </div>

      {/* Events */}
      <div className="mb-4">
        <h4 className="font-semibold mb-2 text-sm">Events</h4>
        <div className="grid grid-cols-5 gap-1">
          <button onClick={()=>testEndpoint('getGroupEvents',()=>groupApi.getGroupEvents(testGroupId))} className="bg-blue-500 text-white px-2 py-1 rounded text-xs">Group Events</button>
          <button onClick={()=>testEndpoint('getGroupEventById',()=>groupApi.getGroupEventById(testEventId))} className="bg-blue-500 text-white px-2 py-1 rounded text-xs">By ID</button>
          <button onClick={()=>testEndpoint('createGroupEvent',()=>groupApi.createGroupEvent(testGroupEventData))} className="bg-green-500 text-white px-2 py-1 rounded text-xs">Create</button>
          <button onClick={()=>testEndpoint('updateGroupEvent',()=>groupApi.updateGroupEvent(testEventId,testUpdateGroupEventData))} className="bg-orange-500 text-white px-2 py-1 rounded text-xs">Update</button>
          <button onClick={()=>testEndpoint('deleteGroupEvent',()=>groupApi.deleteGroupEvent(testEventId))} className="bg-red-500 text-white px-2 py-1 rounded text-xs">Delete</button>
        </div>
      </div>

      {/* Join Requests */}
      <div className="mb-4">
        <h4 className="font-semibold mb-2 text-sm">Join Requests</h4>
        <div className="grid grid-cols-4 gap-1 mb-2">
          <button onClick={()=>testEndpoint('requestToJoin',()=>groupApi.joinGroup(testGroupId))} className="bg-green-500 text-white px-2 py-1 rounded text-xs">Request to Join</button>
          <button onClick={()=>testEndpoint('getGroupRequests',()=>groupApi.getGroupRequests(testGroupId))} className="bg-blue-500 text-white px-2 py-1 rounded text-xs">List Requests</button>
          <button onClick={()=>testEndpoint('approveRequest',()=>groupApi.approveGroupRequest(testRsvpId))} className="bg-green-600 text-white px-2 py-1 rounded text-xs">Approve</button>
          <button onClick={()=>testEndpoint('declineRequest',()=>groupApi.declineGroupRequest(testRsvpId))} className="bg-red-600 text-white px-2 py-1 rounded text-xs">Decline</button>
        </div>
        <div className="text-xs text-gray-600 mb-2">
          <p>• <strong>Request to Join:</strong> Creates a pending join request (notifies group owner)</p>
          <p>• <strong>List Requests:</strong> Shows pending requests for group (owner only)</p>
          <p>• <strong>Approve/Decline:</strong> Use Request ID from list results</p>
        </div>
      </div>

      {/* Membership & RSVP */}
      <div className="mb-4">
        <h4 className="font-semibold mb-2 text-sm">Membership & RSVP</h4>
        <div className="grid grid-cols-4 gap-1 mb-2">
          <button onClick={()=>testEndpoint('updateGroupMember',()=>groupApi.updateGroupMember(testUpdateMemberData))} className="bg-orange-500 text-white px-2 py-1 rounded text-xs">Update Member</button>
          <button onClick={()=>testEndpoint('leaveGroup',()=>groupApi.leaveGroup(testLeaveGroupData))} className="bg-red-500 text-white px-2 py-1 rounded text-xs">Leave</button>
          <button onClick={()=>testEndpoint('getEventRSVPs',()=>groupApi.getEventRSVPs(testEventId))} className="bg-blue-500 text-white px-2 py-1 rounded text-xs">Get RSVPs</button>
          <button onClick={()=>testEndpoint('getNotifications',()=>groupApi.getNotifications())} className="bg-purple-500 text-white px-2 py-1 rounded text-xs">Notifications</button>
        </div>
        <div className="grid grid-cols-3 gap-1">
          <button onClick={()=>testEndpoint('rsvpToEvent',()=>groupApi.rsvpToEvent(testRSVPData))} className="bg-green-500 text-white px-2 py-1 rounded text-xs">RSVP</button>
          <button onClick={()=>testEndpoint('updateEventRSVP',()=>groupApi.updateEventRSVP(testRsvpId,'come'))} className="bg-orange-500 text-white px-2 py-1 rounded text-xs">Update RSVP</button>
          <button onClick={()=>testEndpoint('cancelEventRSVP',()=>groupApi.cancelEventRSVP(testRsvpId))} className="bg-red-500 text-white px-2 py-1 rounded text-xs">Cancel RSVP</button>
        </div>
        <div className="text-xs text-gray-600 mt-2">
          <p>• <strong>RSVP:</strong> Use Event ID. Status: &apos;come&apos;, &apos;maybe&apos;, &apos;cant_come&apos;</p>
          <p>• <strong>Update/Cancel RSVP:</strong> Use RSVP ID from getEventRSVPs results</p>
        </div>
      </div>

      {/* Utilities */}
      <div className="mb-4">
        <h4 className="font-semibold mb-2 text-sm">Utilities</h4>
        <div className="flex gap-2">
          <button onClick={testCookies} className="bg-gray-600 text-white px-2 py-1 rounded text-xs">Check Cookies</button>
          <button onClick={()=>setResults([])} className="bg-gray-500 text-white px-2 py-1 rounded text-xs">Clear Results</button>
        </div>
      </div>

      {/* Results */}
      <div className="text-xs max-h-80 overflow-y-auto border-t pt-2">
        <h4 className="font-semibold mb-2">Results:</h4>
        {results.length===0 ? <p className="text-gray-500">No results yet</p> : results.map((r,i)=>(
          <div key={i} className={`mb-2 p-2 rounded ${r.status==='success'?'bg-green-50 border border-green-200':'bg-red-50 border border-red-200'}`}>
            <div className="font-mono">
              <span className={r.status==='success'?'text-green-600':'text-red-600'}>
                {r.status==='success'?'✅':'❌'} {r.endpoint}
              </span>
              <span className="text-gray-500 ml-2">{r.timestamp}</span>
            </div>
            <div className="text-gray-600 mt-1 break-all">
              {r.status==='success'?`Data: ${JSON.stringify(r.data).substring(0,200)}${JSON.stringify(r.data).length>200?'...':''}`:`Error: ${r.error}`}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GroupDebugPanel;