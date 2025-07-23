export const routes = {
  // Public routes
  home: '/',
  ws: '/ws',
  
  // Auth routes
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
  },
  
  // User routes
  user: {
    profile: '/api/user/profile',
    notifications: '/api/user/notifications',
    follow: '/api/user/follow',
    follower: '/api/user/follower',
    following: '/api/user/following',
  },
  
  // Post routes
  post: '/api/post',
  
  // Comment routes
  comment: '/api/comment',
  
  // Reaction routes
  reaction: '/api/reaction',
  
  // Group routes
  group: {
    base: '/api/group',
    post: '/api/group/post',
    comment: '/api/group/comment',
    event: '/api/group/event',
    member: '/api/group/member',
    members: '/api/group/members',
    eventRsvp: '/api/group/event/rsvp',
  },
  
  // Chat routes
  chat: {
    conversations: '/api/chat/conversations',
    messages: '/api/chat/messages',
    message: '/api/chat/message',
  },
} as const

// Helper function to get all valid paths
export const getValidPaths = (): string[] => {
  const paths: string[] = []
  const extractPaths = (obj: string | Record<string, unknown>) => {
    if (typeof obj === 'string') {
      paths.push(obj)
    } else if (typeof obj === 'object' && obj !== null) {
      Object.values(obj).forEach(value => {
        extractPaths(value as string | Record<string, unknown>)
      })
    }
  }
  extractPaths(routes as Record<string, unknown>)
  return paths
}

// Helper function to get routes by category
export const getRoutesByCategory = () => {
  return {
    public: [routes.home, routes.ws],
    auth: Object.values(routes.auth),
    user: Object.values(routes.user),
    content: [routes.post, routes.comment, routes.reaction],
    group: Object.values(routes.group),
    chat: Object.values(routes.chat),
  }
}

// Helper function to check if a path is valid
export const isValidPath = (path: string): boolean => {
  return getValidPaths().includes(path)
}

// Export individual route groups for easier access
export const authRoutes = routes.auth
export const userRoutes = routes.user
export const groupRoutes = routes.group
export const chatRoutes = routes.chat