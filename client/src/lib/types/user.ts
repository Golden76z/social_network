export interface User {
    id: number;
    nickname: string;
    first_name: string;
    last_name: string;
    email: string;
    date_of_birth: string;
    avatar?: string;
    bio?: string;
    is_private: boolean;
    created_at: string;
    followers: number;
    followed: number;
  }
  
  export interface UserProfile extends User {
    isFollowing?: boolean;
  }
  
  export interface CreateUserRequest {
    nickname: string;
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    date_of_birth: string;
    avatar?: string;
    bio?: string;
    is_private?: boolean;
  }
  
  export interface UpdateUserRequest {
    nickname?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    date_of_birth?: string;
    avatar?: string;
    bio?: string;
    is_private?: boolean;
  }
  
  export interface UserSearchResult {
    users: User[];
    totalCount: number;
    hasMore: boolean;
  }
  
  // Helper type for display purposes
  export interface UserDisplayInfo {
    id: number;
    nickname: string;
    fullName: string;
    first_name?: string;
    last_name?: string;
    avatar?: string;
    is_private?: boolean;
  }