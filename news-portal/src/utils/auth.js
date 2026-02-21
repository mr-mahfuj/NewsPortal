// Authentication helper utilities

export const authService = {
  // Store token
  setToken: (token) => {
    localStorage.setItem('token', token);
  },

  // Get token
  getToken: () => {
    return localStorage.getItem('token');
  },

  // Remove token
  removeToken: () => {
    localStorage.removeItem('token');
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  // Store user info
  setUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user));
  },

  // Get user info
  getUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  // Remove user info
  removeUser: () => {
    localStorage.removeItem('user');
  },

  // Logout
  logout: () => {
    authService.removeToken();
    authService.removeUser();
  }
};

export default authService;
