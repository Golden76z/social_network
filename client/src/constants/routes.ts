export const routes = {
    home: '/',
    about: '/about',
    contact: '/contact',
    // blog: '/blog',
    // blogPost: (slug: string) => `/blog/${slug}`,
    user: {
      profile: '/user/profile',
    },
    api: {
      users: '/api/users',
      posts: '/api/posts',
    }
  } as const
  
  // Helper function to get all valid paths
  export const getValidPaths = (): string[] => {
    const paths: string[] = []
    
    const extractPaths = (obj: any, prefix = '') => {
      Object.values(obj).forEach(value => {
        if (typeof value === 'string') {
          paths.push(value)
        } else if (typeof value === 'object' && value !== null) {
          extractPaths(value, prefix)
        }
      })
    }
    
    extractPaths(routes)
    return paths
  }