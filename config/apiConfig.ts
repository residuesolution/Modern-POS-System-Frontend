export const apiConfig = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'https://your-backend-api',
  endpoints: {
    auth: {
      LOGIN: '/auth/login',
      REGISTER: '/auth/register',
      LOGOUT: '/auth/logout',
      REFRESH: '/auth/refresh',
    },    
  },
  timeout: 10000, // timeout for API requests
  maxRetries: 3, // retry logic
}