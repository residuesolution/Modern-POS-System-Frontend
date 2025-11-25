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
    product: {
      LIST: '/api/product',
      SEARCH: '/api/product/search',
      BARCODE: '/api/product/barcode/', // append encoded barcode
    },
    orders: {
      LIST: '/api/orders',
      GET: '/api/orders/', // append id
      ADD: '/api/orders/add',
      PRINT: '/api/orders/print/', // append id
      EMAIL: '/api/orders/email/', // append id
      SMS: '/api/orders/sms/', // append id
      HOLD: '/api/orders/hold/', // append id
      VOID: '/api/orders/void/', // append id
      DISCOUNT: '/api/orders/discount/', // append id (POST body { percent | amount })
      RECEIPT_PDF: '/api/orders/receipt/', // (optional)
      SEARCH: '/api/orders/search'
    },
    payments: {
      PROCESS: '/api/payments/process',
      LIST: '/api/payments',
      GET: '/api/payments/', // append id
    },
    customers: {
      LIST: '/api/customers',
      GET: '/api/customers/', // append id
      SEARCH: '/api/customers/search',
    },
    supplier: {
      SUPPLIER_ORDER: '/api/supplier-order'
    }
  },
  timeout: 10000,
  maxRetries: 3,
};