document.addEventListener("DOMContentLoaded", async () => {
    // ── Identity ──
    const userEmail = localStorage.getItem('user_email') || 'patient@demo.com';
    const userName = localStorage.getItem('user_name') || userEmail;

    const userNameElement = document.getElementById('user-welcome');
    if (userNameElement) {
        userNameElement.innerText = `${userName}`;
    }

    // ── Theme Toggle ──
    const themeToggleBtn = document.getElementById('theme-toggle');
    const currentTheme = localStorage.getItem('pulse_theme') || 'dark';

    // Apply saved theme
    if (currentTheme === 'light') {
        document.body.setAttribute('data-theme', 'light');
        if (themeToggleBtn) themeToggleBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            if (document.body.hasAttribute('data-theme')) {
                document.body.removeAttribute('data-theme');
                localStorage.setItem('pulse_theme', 'dark');
                themeToggleBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
            } else {
                document.body.setAttribute('data-theme', 'light');
                localStorage.setItem('pulse_theme', 'light');
                themeToggleBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
            }
        });
    }

    // ── Tab Switching Logic ──
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');

            // Remove active from all buttons and panes
            tabBtns.forEach(b => b.classList.remove('active'));
            tabPanes.forEach(p => p.classList.remove('active'));

            // Add active to clicked button and corresponding pane
            btn.classList.add('active');
            const targetPane = document.getElementById(targetId);
            if (targetPane) {
                targetPane.classList.add('active');

                // Triggers reflow to restart CSS animation (for fade-in)
                void targetPane.offsetWidth;
            }
        });
    });

    // ── Geolocation Helper ──
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
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`);
                const data = await res.json();
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

    // ── State ──
    let currentSymptoms = [];
    let qaHistory = [];
    let questionCount = 0;
    const MAX_QUESTIONS = 3;

    const chatContainer = document.getElementById('chat-container');
    const symptomText = document.getElementById('symptom-text');
    const startBtn = document.getElementById('start-btn');
    const resetBtn = document.getElementById('reset-btn');
    const resultBox = document.getElementById('result-box');

    // ── Chat Helpers ──
    function appendMessage(sender, text, isAi = false) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `chat-message ${isAi ? 'ai-message' : 'user-message'} p-3 mb-3`;

        const icon = isAi ? 'fa-stethoscope' : 'fa-user';
        const label = isAi ? 'AI Physician' : 'You';

        msgDiv.innerHTML = `
            <strong><i class="fa-solid ${icon}"></i> ${label}:</strong>
            <p class="mb-0 mt-2">${text}</p>
        `;
        chatContainer.appendChild(msgDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    // ── History Loader with Expandable Detail ──
    async function loadUserHistory() {
        try {
            const listGroup = document.getElementById('history-container');
            if (!listGroup) return;
            listGroup.innerHTML = '<div class="text-center p-3" style="font-size:0.82rem;"><i class="fa-solid fa-spinner fa-spin" style="color:var(--text-muted);"></i></div>';

            const response = await fetch(`/api/history/${userEmail}`);
            if (!response.ok) throw new Error('Failed to fetch history');
            const data = await response.json();
            listGroup.innerHTML = '';

            if (!data.history || data.history.length === 0) {
                listGroup.innerHTML = `
                    <div class="text-center py-4" style="color: var(--text-muted); font-size: 0.82rem;">
                        <i class="fa-regular fa-folder-open mb-2 fs-5 d-block" style="opacity:0.4;"></i>
                        No consultations yet
                    </div>`;
                return;
            }

            data.history.forEach((record, index) => {
                const symSnippet = (record.symptoms || []).slice(0, 3).map(s => s.replace(/_/g, ' ')).join(', ') + ((record.symptoms || []).length > 3 ? '...' : '');
                const confidence = record.confidence || 'N/A';
                const disease = record.topDisease || 'Unknown';

                const item = document.createElement('div');
                item.className = 'history-item';
                item.innerHTML = `
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <div class="history-date"><i class="fa-regular fa-calendar"></i> ${record.date}</div>
                            <div class="history-diagnosis">${disease}</div>
                            <div class="history-confidence">${confidence}% confidence</div>
                        </div>
                        <i class="fa-solid fa-chevron-down" style="color:var(--text-muted); font-size:0.7rem; margin-top:4px; transition: transform 0.3s;"></i>
                    </div>
                    <div class="text-muted small mt-1"><i class="fa-solid fa-notes-medical" style="margin-right:4px;"></i>${symSnippet}</div>
                    <div class="history-detail" id="detail-${index}" style="display:none;">
                        <div class="history-detail-label">Symptoms Detected</div>
                        <div class="history-detail-value">${(record.symptoms || []).map(s => s.replace(/_/g, ' ')).join(', ')}</div>
                        <div class="history-detail-label">Precautions</div>
                        <div class="history-detail-value" id="precaution-detail-${index}">
                            ${record.precautions
                        ? record.precautions.map(p => `<div class="precaution-item"><i class="fa-solid fa-triangle-exclamation"></i> ${p}</div>`).join('')
                        : '<span style="color:var(--text-muted); font-size:0.78rem;">No precautions recorded</span>'
                    }
                        </div>
                    ${record.latitude && record.longitude
                        ? `<div class="history-detail-label" style="margin-top:4px;">Consultation Location</div>
                           <a href="https://www.google.com/maps?q=${record.latitude},${record.longitude}" target="_blank"
                              style="display:inline-flex;align-items:center;gap:6px;font-size:0.78rem;color:var(--accent);text-decoration:none;padding:6px 10px;background:var(--accent-muted);border-radius:8px;margin-top:4px;">
                              <i class="fa-solid fa-location-dot"></i> View on Map
                           </a>`
                        : ''
                    }
                    </div>
                `;

                // Toggle expand
                item.addEventListener('click', () => {
                    const detail = document.getElementById(`detail-${index}`);
                    const chevron = item.querySelector('.fa-chevron-down');
                    if (detail.style.display === 'none') {
                        detail.style.display = 'block';
                        if (chevron) chevron.style.transform = 'rotate(180deg)';
                    } else {
                        detail.style.display = 'none';
                        if (chevron) chevron.style.transform = 'rotate(0deg)';
                    }
                });

                listGroup.appendChild(item);
            });
        } catch (error) {
            console.error(error);
        }
    }

    // ── Consultation Flow ──
    startBtn.addEventListener('click', async () => {
        const text = symptomText.value.trim();
        if (!text) {
            alert("Please describe your symptoms first.");
            return;
        }

        startBtn.disabled = true;
        startBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Analyzing...';

        if (questionCount === 0) {
            appendMessage('You', text);
            symptomText.value = '';
            symptomText.placeholder = 'Type your answer here...';

            try {
                const response = await fetch('/api/consultation/start', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: text })
                });
                const data = await response.json();
                if (data.error) throw new Error(data.error);

                currentSymptoms = data.symptoms;
                appendMessage('AI Physician', `I've identified these symptoms: <strong>${currentSymptoms.join(', ')}</strong>. Let me ask a few follow-up questions for accuracy.`, true);
                await getNextQuestion();
            } catch (err) {
                alert(err.message);
                resetConsultation();
            }
        } else {
            appendMessage('You', text);
            qaHistory.push({ question: lastQuestion, answer: text });
            symptomText.value = '';

            if (questionCount < MAX_QUESTIONS) {
                await getNextQuestion();
            } else {
                await finishConsultation();
            }
        }

        startBtn.disabled = false;
        startBtn.innerHTML = questionCount < MAX_QUESTIONS
            ? '<i class="fa-solid fa-arrow-up"></i> Send Answer'
            : '<i class="fa-solid fa-file-medical"></i> Get Final Report';
    });

    let lastQuestion = "";
    async function getNextQuestion() {
        try {
            const response = await fetch('/api/consultation/question', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ symptoms: currentSymptoms, qa_history: qaHistory })
            });
            const data = await response.json();
            lastQuestion = data.question;
            appendMessage('AI Physician', lastQuestion, true);
            questionCount++;
        } catch (err) {
            console.error(err);
        }
    }

    async function finishConsultation() {
        appendMessage('AI Physician', "Thank you. Generating your diagnostic report...", true);
        startBtn.style.display = 'none';
        resetBtn.style.display = 'block';

        // Capture GPS for report
        let userLat = null, userLng = null;
        try {
            const pos = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
            });
            userLat = pos.coords.latitude;
            userLng = pos.coords.longitude;
        } catch (e) { /* location denied, proceed without */ }

        try {
            const response = await fetch('/api/consultation/finish', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    symptoms: currentSymptoms,
                    qa_history: qaHistory,
                    email: userEmail,
                    latitude: userLat,
                    longitude: userLng
                })
            });
            const data = await response.json();
            if (data.error) throw new Error(data.error);

            // Show Results
            resultBox.style.display = 'flex';
            const diseaseName = document.getElementById('disease-name');
            const top = data.predictions[0];
            diseaseName.innerHTML = `${top.disease} <span style="color:var(--accent); font-weight:600;">(${top.confidence}%)</span><br><small style="font-size:0.82rem; color:var(--text-secondary); font-weight:400;">${top.advice}</small>`;

            // Show precautions
            const precautionsBox = document.getElementById('precautions-box');
            const precautionsList = document.getElementById('precautions-list');
            if (top.precautions && top.precautions.length > 0 && precautionsBox && precautionsList) {
                precautionsBox.style.display = 'block';
                precautionsList.innerHTML = top.precautions.map(p =>
                    `<div class="precaution-item"><i class="fa-solid fa-triangle-exclamation"></i> ${p}</div>`
                ).join('');
            }

            // Specialist Locator
            const locateBtn = document.getElementById('locate-specialist-btn');
            if (locateBtn && top.specialist) {
                locateBtn.style.display = 'block';
                locateBtn.innerHTML = `<i class="fa-solid fa-location-crosshairs"></i> Find ${top.specialist} Near Me`;
                locateBtn.onclick = () => {
                    locateBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Detecting location...`;
                    locateBtn.disabled = true;

                    if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(
                            (position) => {
                                const { latitude, longitude } = position.coords;
                                const query = encodeURIComponent(`${top.specialist} near me`);
                                window.open(`https://www.google.com/maps/search/${query}/@${latitude},${longitude},14z`, '_blank');
                                locateBtn.innerHTML = `<i class="fa-solid fa-location-crosshairs"></i> Find ${top.specialist} Near Me`;
                                locateBtn.disabled = false;
                            },
                            () => {
                                const locality = localStorage.getItem('user_locality') || 'nearby';
                                const query = encodeURIComponent(`${top.specialist} medical services in ${locality}`);
                                window.open(`https://www.google.com/maps/search/${query}`, '_blank');
                                locateBtn.innerHTML = `<i class="fa-solid fa-location-crosshairs"></i> Find ${top.specialist} Near Me`;
                                locateBtn.disabled = false;
                            },
                            { timeout: 8000 }
                        );
                    } else {
                        const locality = localStorage.getItem('user_locality') || 'nearby';
                        const query = encodeURIComponent(`${top.specialist} medical services in ${locality}`);
                        window.open(`https://www.google.com/maps/search/${query}`, '_blank');
                        locateBtn.innerHTML = `<i class="fa-solid fa-location-crosshairs"></i> Find ${top.specialist} Near Me`;
                        locateBtn.disabled = false;
                    }
                };
            }

            appendMessage('AI Physician', `Diagnostic report complete. Primary assessment: <strong>${top.disease}</strong>. I recommend consulting a <strong>${top.specialist}</strong> for professional evaluation.`, true);

            loadUserHistory();
            resultBox.scrollIntoView({ behavior: 'smooth' });

        } catch (err) {
            alert(err.message);
        }
    }

    function resetConsultation() {
        currentSymptoms = [];
        qaHistory = [];
        questionCount = 0;
        lastQuestion = "";

        chatContainer.innerHTML = `
            <div class="chat-message ai-message p-3 mb-3">
              <strong><i class="fa-solid fa-stethoscope"></i> AI Physician:</strong>
              <p class="mb-0 mt-2">Hello. I'm your AI health assistant. Please describe how you're feeling today — be as specific as possible about symptoms, duration, and severity.</p>
            </div>
        `;

        symptomText.value = '';
        symptomText.placeholder = "e.g., I've had a sharp pain in my lower right abdomen for the past 2 days...";
        startBtn.style.display = 'block';
        startBtn.disabled = false;
        startBtn.innerHTML = '<i class="fa-solid fa-arrow-up"></i> Begin Consultation';
        resetBtn.style.display = 'none';
        resultBox.style.display = 'none';

        // Hide precautions
        const pb = document.getElementById('precautions-box');
        if (pb) pb.style.display = 'none';
    }

    resetBtn.addEventListener('click', resetConsultation);

    // ── Profile Modal ──
    const profileModalEl = document.getElementById('profileModal');
    if (profileModalEl) {
        const profileModal = new bootstrap.Modal(profileModalEl);
        document.getElementById('openProfileBtn').addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                const response = await fetch(`/api/user/profile/${userEmail}`);
                const data = await response.json();
                if (response.ok) {
                    document.getElementById('profileEmail').value = data.email;
                    document.getElementById('profileName').value = data.name;
                    document.getElementById('profileLocality').value = data.locality || '';
                    document.getElementById('profileAge').value = data.age || '';
                    document.getElementById('profileGender').value = data.gender || '';
                    profileModal.show();
                }
            } catch (err) { console.error(err); }
        });

        const detectProfileBtn = document.getElementById('detectProfileLocalityBtn');
        const profileLocalityInput = document.getElementById('profileLocality');
        if (detectProfileBtn && profileLocalityInput) {
            detectProfileBtn.addEventListener('click', () => detectLocation(profileLocalityInput, detectProfileBtn));
        }

        document.getElementById('saveProfileBtn').addEventListener('click', async () => {
            const newName = document.getElementById('profileName').value.trim();
            const newLocality = document.getElementById('profileLocality').value.trim();
            const newAge = document.getElementById('profileAge').value;
            const newGender = document.getElementById('profileGender').value;
            if (!newName) return;
            try {
                const response = await fetch('/api/user/profile', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: userEmail, name: newName, locality: newLocality, age: newAge ? parseInt(newAge) : null, gender: newGender })
                });
                if (response.ok) {
                    const data = await response.json();
                    localStorage.setItem('user_name', data.name);
                    localStorage.setItem('user_locality', data.locality);
                    if (userNameElement) userNameElement.innerText = `${data.name}`;
                    profileModal.hide();
                }
            } catch (err) { console.error(err); }
        });
    }

    loadUserHistory();
});
