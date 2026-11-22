import api from './axios';

// Auth Services
export const loginApi = (credentials) => api.post('/auth/login', credentials);
export const forgotPasswordApi = (data) => api.post('/auth/forgot-password', data);
export const resetPasswordApi = (data) => api.post('/auth/reset-password', data);
export const sendOtpApi  = (data) => api.post('/auth/send-otp', data);
export const registerApi = (userData) => api.post('/auth/register', userData);
export const getMeApi = () => api.get('/auth/me');

// Mall Services
export const getMallsApi = () => api.get('/malls');
export const getMyMallsApi = () => api.get('/malls/my');
export const createMallApi = (mallData) => api.post('/malls', mallData);
export const getMallByIdApi = (id) => api.get(`/malls/${id}`);
export const getMallDashboardApi = (id) => api.get(`/malls/${id}/dashboard`);

// Slot Services
export const createSlotsApi = (mallId, slotData) => api.post(`/malls/${mallId}/slots`, slotData);
export const getSlotsApi = (mallId) => api.get(`/malls/${mallId}/slots`);
export const getAvailableSlotsApi = (mallId, vehicleType = '') =>
  api.get(`/malls/${mallId}/available-slots${vehicleType ? `?vehicleType=${vehicleType}` : ''}`);

// Booking Services
export const createBookingApi = (bookingData) => api.post('/bookings', bookingData);
export const getMyBookingsApi = () => api.get('/bookings/my');
export const getBookingByIdApi = (id) => api.get(`/bookings/${id}`);
export const getBookingQRApi = (id) => api.get(`/bookings/${id}/qr`);
export const cancelBookingApi = (id) => api.put(`/bookings/${id}/cancel`);
export const deleteBookingHistoryApi = (id) => api.delete(`/bookings/${id}/history`);
export const createRazorpayOrderApi = (id) => api.post(`/bookings/${id}/razorpay-order`);
export const verifyRazorpayPaymentApi = (id, paymentData) => api.post(`/bookings/${id}/verify-razorpay-payment`, paymentData);

// Guard Services
export const verifyEntryApi = (data) => api.post('/guard/verify-entry', data);
export const verifyExitApi = (data) => api.post('/guard/verify-exit', data);
export const getGuardPaymentsApi = () => api.get('/guard/payments');
export const releasePaidVehicleApi = (id) => api.post(`/guard/bookings/${id}/release`);

// Admin Services
export const getUsersApi = () => api.get('/admin/users');
export const getAllMallsApi = () => api.get('/admin/malls');
export const approveMallApi = (id) => api.put(`/admin/malls/${id}/approve`);
export const rejectMallApi = (id) => api.put(`/admin/malls/${id}/reject`);
export const getAdminDashboardApi = () => api.get('/admin/dashboard');
