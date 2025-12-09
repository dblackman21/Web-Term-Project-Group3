/**
 * Logout user (client-side)
 */
function logout() {

  // Delete token  
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  
  // Redirect to login page
  window.location.href = '/pages/login.html';
}

/**
 * Check if user is logged in
 */
function isLoggedIn() {
  const token = localStorage.getItem('authToken');
  return token !== null;
}

/**
 * Get current user from localStorage
 */
function getCurrentUser() {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
}

/**
 * Get auth token
 */
function getAuthToken() {
  return localStorage.getItem('authToken');
}
