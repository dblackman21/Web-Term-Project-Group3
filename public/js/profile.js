// Profile Page JavaScript - Backend Integration

// API Base URL
const API_BASE = '';

// Get auth token from localStorage
function getAuthToken() {
    return localStorage.getItem('authToken');
}

// Check if user is logged in
function isLoggedIn() {
    return !!getAuthToken();
}

// Format date helper
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short' };
    return date.toLocaleDateString('en-US', options);
}

// Format last login (relative time)
function formatLastLogin(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return formatDate(dateString);
}

// Get initials from name
function getInitials(firstname, lastname) {
    const first = firstname ? firstname.charAt(0).toUpperCase() : '';
    const last = lastname ? lastname.charAt(0).toUpperCase() : '';
    return first + last || 'U';
}

// Show loading state
function showLoading() {
    document.getElementById('loading-state').style.display = 'flex';
    document.getElementById('profile-content').style.display = 'none';
    document.getElementById('not-logged-in').style.display = 'none';
}

// Show profile content
function showProfile() {
    document.getElementById('loading-state').style.display = 'none';
    document.getElementById('profile-content').style.display = 'block';
    document.getElementById('not-logged-in').style.display = 'none';
}

// Show not logged in state
function showNotLoggedIn() {
    document.getElementById('loading-state').style.display = 'none';
    document.getElementById('profile-content').style.display = 'none';
    document.getElementById('not-logged-in').style.display = 'flex';
}

// Show notification
function showNotification(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: ${type === 'success' ? '#26de81' : '#ff4757'};
        color: white;
        padding: 16px 24px;
        border-radius: 10px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        animation: slideInRight 0.3s ease-out;
        font-weight: 500;
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Fetch user profile from backend
async function fetchUserProfile() {
    try {
        showLoading();
        
        const token = getAuthToken();
        if (!token) {
            showNotLoggedIn();
            return;
        }

        const response = await fetch(`${API_BASE}/auth/profile`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                // Token invalid or expired
                localStorage.removeItem('authToken');
                showNotLoggedIn();
                return;
            }
            throw new Error('Failed to fetch profile');
        }

        const data = await response.json();
        
        if (data.success && data.user) {
            displayUserProfile(data.user);
            showProfile();
        } else {
            throw new Error('Invalid response from server');
        }

    } catch (error) {
        console.error('Error fetching profile:', error);
        showNotification('Failed to load profile', 'error');
        showNotLoggedIn();
    }
}

// Display user profile data
function displayUserProfile(user) {
    // Avatar initials
    const initials = getInitials(user.firstname, user.lastname);
    document.getElementById('avatar-initials').textContent = initials;

    // Header info
    document.getElementById('user-fullname').textContent = 
        `${user.firstname || ''} ${user.lastname || ''}`.trim() || 'User';
    document.getElementById('user-email').textContent = user.email || 'No email';

    // Stats
    document.getElementById('member-since').textContent = 
        user.createdAt ? formatDate(user.createdAt) : 'Unknown';
    document.getElementById('order-count').textContent = '0'; // Placeholder for future orders feature

    // Account info section
    document.getElementById('display-firstname').textContent = user.firstname || 'N/A';
    document.getElementById('display-lastname').textContent = user.lastname || 'N/A';
    document.getElementById('display-email').textContent = user.email || 'N/A';
    document.getElementById('display-lastlogin').textContent = 
        user.lastLogin ? formatLastLogin(user.lastLogin) : 'Never';

    // Store user data for edit modal
    window.currentUser = user;
}

// Open edit profile modal
function openEditModal() {
    if (!window.currentUser) return;

    document.getElementById('edit-firstname').value = window.currentUser.firstname || '';
    document.getElementById('edit-lastname').value = window.currentUser.lastname || '';
    document.getElementById('edit-email').value = window.currentUser.email || '';

    document.getElementById('edit-modal').classList.add('active');
}

// Close modals
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Handle edit profile form submission
async function handleEditProfile(event) {
    event.preventDefault();

    const formData = {
        firstname: document.getElementById('edit-firstname').value,
        lastname: document.getElementById('edit-lastname').value,
        email: document.getElementById('edit-email').value
    };

    try {
        const token = getAuthToken();
        const response = await fetch(`${API_BASE}/auth/profile`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            throw new Error('Failed to update profile');
        }

        const data = await response.json();

        if (data.success) {
            showNotification('Profile updated successfully!');
            closeModal('edit-modal');
            // Refresh profile data
            await fetchUserProfile();
        } else {
            throw new Error(data.message || 'Update failed');
        }

    } catch (error) {
        console.error('Error updating profile:', error);
        showNotification('Failed to update profile', 'error');
    }
}



// Handle logout
function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('authToken');
        showNotification('Logged out successfully');
        setTimeout(() => {
            window.location.href = './login.html';
        }, 1000);
    }
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in and load profile
    if (isLoggedIn()) {
        fetchUserProfile();
    } else {
        showNotLoggedIn();
    }

    // Edit profile button
    document.getElementById('edit-info-btn')?.addEventListener('click', openEditModal);

    // Logout button
    document.getElementById('logout-btn')?.addEventListener('click', handleLogout);

    // Modal close buttons
    document.querySelectorAll('.modal-close-btn, .btn-cancel').forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal-overlay');
            if (modal) {
                modal.classList.remove('active');
            }
        });
    });

    // Close modal when clicking outside
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
            }
        });
    });

    // Edit profile form submission
    document.getElementById('edit-profile-form')?.addEventListener('submit', handleEditProfile);

    // Change password form submission
    document.getElementById('change-password-form')?.addEventListener('submit', handleChangePassword);
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes slideOutRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100px);
        }
    }
`;
document.head.appendChild(style);
