document.addEventListener('DOMContentLoaded', () => {
    const roles = document.querySelectorAll('.role-badge');
    let selectedRole = 'patient'; // default
    let isLoginMode = true; // true = Sign In, false = Sign Up

    const formTitle = document.getElementById('formTitle');
    const formSubtitle = document.getElementById('formSubtitle');
    const loginBtn = document.getElementById('loginBtn');
    const toggleText = document.getElementById('toggleText');
    const toggleModeBtn = document.getElementById('toggleModeBtn');
    const rememberMeContainer = document.getElementById('rememberMeContainer');
    const rememberMeCheckbox = document.getElementById('rememberMe');

    // Auto-fill remembered email
    const rememberedEmail = localStorage.getItem('remembered_email');
    if (rememberedEmail) {
        document.getElementById('email').value = rememberedEmail;
        if (rememberMeCheckbox) rememberMeCheckbox.checked = true;
    }



    // --- Geolocation Helper ---
    async function detectLocation(inputElement, btnElement) {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser.");
            return;
        }

        const originalBtnHtml = btnElement.innerHTML;
        btnElement.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
        btnElement.disabled = true;

        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            try {
                // Using Nominatim (OpenStreetMap) for free reverse geocoding
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`);
                const data = await res.json();

                // Try to get city or town or village
                const city = data.address.city || data.address.town || data.address.village || data.address.suburb || "Unknown City";
                const state = data.address.state || "";
                inputElement.value = state ? `${city}, ${state}` : city;
            } catch (err) {
                console.error(err);
                alert("Failed to resolve city name. Please enter manually.");
            } finally {
                btnElement.innerHTML = originalBtnHtml;
                btnElement.disabled = false;
            }
        }, (err) => {
            console.error(err);
            alert("Location access denied or unavailable.");
            btnElement.innerHTML = originalBtnHtml;
            btnElement.disabled = false;
        });
    }

    // 1. Role Selection Logic
    roles.forEach(role => {
        role.addEventListener('click', () => {
            roles.forEach(r => r.classList.remove('active'));
            role.classList.add('active');
            selectedRole = role.getAttribute('data-role');
        });
    });

    // 2. Toggle Sign In / Sign Up Mode
    toggleModeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        isLoginMode = !isLoginMode;

        const nameField = document.getElementById('nameFieldContainer');
        const localityField = document.getElementById('localityFieldContainer');

        if (isLoginMode) {
            // Switch UI to Sign In
            document.querySelector('.login-right h2').innerText = 'Welcome Back';
            document.querySelector('.login-right p').innerText = 'Please sign in to your account';
            loginBtn.innerHTML = 'SIGN IN <i class="fa-solid fa-arrow-right ms-2 fs-6"></i>';
            if (rememberMeContainer) rememberMeContainer.style.display = 'flex';
            toggleText.innerText = "Don't have an account? ";
            toggleModeBtn.innerText = "Sign Up";

            // Hide Fields
            if (nameField) nameField.style.display = 'none';
            if (localityField) localityField.style.display = 'none';
            const ageGender = document.getElementById('ageGenderContainer');
            if (ageGender) ageGender.style.display = 'none';
        } else {
            // Switch UI to Sign Up
            document.querySelector('.login-right h2').innerText = 'Create Account';
            document.querySelector('.login-right p').innerText = 'Register your credentials';
            loginBtn.innerHTML = 'SIGN UP <i class="fa-solid fa-user-plus ms-2 fs-6"></i>';
            if (rememberMeContainer) rememberMeContainer.style.display = 'none';
            toggleText.innerText = "Already have an account? ";
            toggleModeBtn.innerText = "Sign In";

            // Show Fields
            if (nameField) nameField.style.display = 'block';
            if (localityField) localityField.style.display = 'block';
            const ageGender = document.getElementById('ageGenderContainer');
            if (ageGender) ageGender.style.display = 'block';
        }
    });

    // Handle Detect Location
    const detectBtn = document.getElementById('detectLocationBtn');
    const localityInput = document.getElementById('locality');
    if (detectBtn && localityInput) {
        detectBtn.addEventListener('click', () => detectLocation(localityInput, detectBtn));
    }

    // 3. Form Submission Handling (Live MongoDB API)
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const fullName = document.getElementById('fullName') ? document.getElementById('fullName').value : '';
        const locality = document.getElementById('locality') ? document.getElementById('locality').value : '';
        const age = document.getElementById('age') ? document.getElementById('age').value : '';
        const gender = document.getElementById('gender') ? document.getElementById('gender').value : '';
        const originalBtnText = loginBtn.innerHTML;

        if (!isLoginMode && !fullName.trim()) {
            alert("Please enter your full name for registration.");
            return;
        }
        if (!isLoginMode && (!age || !gender)) {
            alert("Please enter your age and gender for registration.");
            return;
        }

        loginBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-2"></i> Processing...';
        loginBtn.disabled = true;

        const endpoint = isLoginMode ? '/api/login' : '/api/register';
        const payload = {
            email: email,
            password: password,
            role: selectedRole,
            name: fullName,
            locality: locality,
            age: age ? parseInt(age) : null,
            gender: gender
        };

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.error || "Authentication failed.");
                loginBtn.disabled = false;
                loginBtn.innerHTML = originalBtnText;
                return;
            }

            // Success! Create session.
            if (!isLoginMode) {
                alert("Account created successfully! Logging you in...");
            } else {
                // Remember Me
                if (rememberMeCheckbox && rememberMeCheckbox.checked) {
                    localStorage.setItem('remembered_email', email);
                } else {
                    localStorage.removeItem('remembered_email');
                }
            }

            executeLogin(data.role, data.email, data.name || data.email, data.locality || '', data.age || '', data.gender || '');

        } catch (error) {
            alert("Network error. Ensure the Python server is running.");
            console.error(error);
            loginBtn.disabled = false;
            loginBtn.innerHTML = originalBtnText;
        }
    });

    function executeLogin(role, email, name, locality, age, gender) {
        // We still use localStorage just to keep the session alive on the frontend
        localStorage.setItem('auth_token', 'live_mongodb_session_active');
        localStorage.setItem('user_role', role);
        localStorage.setItem('user_email', email); // Crucial for fetching specific history
        localStorage.setItem('user_name', name); // Crucial for Dashboard welcome text
        localStorage.setItem('user_locality', locality); // For specialist location
        localStorage.setItem('user_age', age || '');
        localStorage.setItem('user_gender', gender || '');

        // Redirect based on selected role
        if (role === 'patient') {
            window.location.href = 'index.html';
        } else if (role === 'doctor') {
            window.location.href = 'doctor.html';
        } else if (role === 'admin') {
            window.location.href = 'admin.html';
        }
    }
});
