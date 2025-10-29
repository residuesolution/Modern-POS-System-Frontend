export const apiConfig = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
  endpoints: {
    auth: {
      LOGIN: '/api/auth/login',
      REGISTER: '/api/auth/register',
      LOGOUT: '/api/auth/logout',
      REFRESH: '/api/auth/refresh',
      FORGOT_PASSWORD: '/api/auth/forgot-password',
      RESET_PASSWORD: '/api/auth/reset-password',
      WEBAUTHN_REGISTER: '/api/auth/webauthn/register',
      WEBAUTHN_LOGIN: '/api/auth/webauthn/login',
      WEBAUTHN_REGISTER_OPTIONS: '/api/auth/webauthn/register/options',
      WEBAUTHN_REGISTER_VERIFY: '/api/auth/webauthn/register/verify',
      WEBAUTHN_LOGIN_OPTIONS: '/api/auth/webauthn/login/options',
      WEBAUTHN_LOGIN_VERIFY: '/api/auth/webauthn/login/verify',

       // FaceID endpoints
          FACEID_REGISTER: '/api/auth/faceid/register',
          FACEID_LOGIN: '/api/auth/faceid/login',
          FACEID_GET: '/api/auth/faceid/', 
          FACEID_UPDATE: '/api/auth/faceid/update',
          FACEID_DELETE: '/api/auth/faceid/' 
    },
    admin: {
      HARDWARE_STATUS: '/api/admin/hardware-status',
      SYSTEM_CONFIG: '/api/admin/system-config',
      PRODUCT: '/api/admin/product',
    },
    
  },
  timeout: 10000,
  maxRetries: 3,
};