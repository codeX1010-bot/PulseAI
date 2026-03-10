document.addEventListener('DOMContentLoaded', () => {
    // Basic auth check
    const token = localStorage.getItem('auth_token');
    const role = localStorage.getItem('user_role');

    if (!token || role !== 'patient') {
        window.location.href = '/login.html';
        return;
    }

    // Initialize mock data or fetch from backend
});

function logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_role');
    window.location.href = '/login.html';
}
