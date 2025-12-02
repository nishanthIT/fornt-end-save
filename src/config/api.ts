// API Configuration - Centralized URL management
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  
  // Admin endpoints
  ADMIN: {
    CUSTOMERS: '/admin/customers',
    CUSTOMER_SUBSCRIPTION: (customerId: number) => `/admin/customers/${customerId}/subscription`,
    PROCESS_EXPIRED_TRIALS: '/admin/process-expired-trials',
  },
  
  // Auth endpoints
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },
  
  // Shop endpoints
  SHOP: {
    GET_ALL: '/getAllshop',
    GET_BY_ID: (shopId: string) => `/getshopbyid/${shopId}`,
    ADD: '/addShop',
    EDIT: (shopId: string) => `/editshop/${shopId}`,
    GET_PRODUCTS: (shopId: string) => `/getshopProduct/${shopId}`,
    UPDATE_PRODUCT_PRICE: (shopId: string) => `/updateProductPrice/${shopId}`,
  },
  
  // Product endpoints
  PRODUCT: {
    ADD: '/addproduct',
    EDIT: (productId: string) => `/editproduct/${productId}`,
    FILTER: '/filterProducts',
    ADD_TO_SHOP: '/addProductAtShop',
    ADD_EXISTING_TO_SHOP: '/addProductAtShopifExistAtProduct',
  },
  
  // Employee endpoints
  EMPLOYEE: {
    GET_ALL: '/getallemploy',
    ADD: '/addEmployee',
    UPDATE: (employeeId: string) => `/updateEmployee/${employeeId}`,
    DELETE: (employeeId: string) => `/deleteEmployee/${employeeId}`,
  },

  // Promotion endpoints
  PROMOTION: {
    GET_ALL: '/promotions',
    GET_BY_ID: (id: string) => `/promotions/${id}`,
    ADD: '/promotions',
    UPDATE: (id: string) => `/promotions/${id}`,
    DELETE: (id: string) => `/promotions/${id}`,
  },
};

// Helper function to get full URL
export const getApiUrl = (endpoint: string) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Helper function for admin endpoints
export const getAdminUrl = (endpoint: string) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Helper function for auth endpoints
export const getAuthUrl = (endpoint: string) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};