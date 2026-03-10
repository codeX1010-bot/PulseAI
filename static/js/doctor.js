const patients = [
    {
        name: "John Doe",
        meta: "Age: 34 | Sex: M | UID: #9928A",
        disease: "Chronic Sinusitis",
        confidence: "89.4% Naive Bayes Confidence",
        symptoms: ["Chills", "Fever", "Muscle Pain", "Headache"]
    },
    {
        name: "Alice Smith",
        meta: "Age: 28 | Sex: F | UID: #7821B",
        disease: "Common Cold",
        confidence: "95.1% Naive Bayes Confidence",
        symptoms: ["Runny Nose", "Cough", "Mild Fever"]
    },
    {
        name: "Robert Johnson",
        meta: "Age: 45 | Sex: M | UID: #3349C",
        disease: "Gastroenteritis",
        confidence: "76.2% Naive Bayes Confidence",
        symptoms: ["Vomiting", "Stomach Pain", "Nausea"]
    }
];

function loadPatient(index) {
    const p = patients[index];

    // Toggle displays
    document.getElementById('empty-state').style.display = 'none';
    const card = document.getElementById('profile-card');
    card.style.display = 'block';

    // Populate data
    document.getElementById('p-name').innerText = p.name;
    document.getElementById('p-meta').innerText = p.meta;
    document.getElementById('p-disease').innerText = p.disease;
    document.getElementById('p-conf').innerText = p.confidence;

    const symList = document.getElementById('p-symptoms');
    symList.innerHTML = '';
    p.symptoms.forEach(s => {
        const li = document.createElement('li');
        li.innerText = s;
        symList.appendChild(li);
    });
}

function saveRecord() {
    alert("Record successfully saved to Live Database!");
    // In a real env, this would send a POST request with the prescription.
    document.getElementById('profile-card').style.display = 'none';
    document.getElementById('empty-state').style.display = 'flex';
}

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('auth_token');
    const role = localStorage.getItem('user_role');

    if (!token || role !== 'doctor') {
        window.location.href = 'login.html';
        return;
    }
});

function logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_role');
    window.location.href = 'login.html';
}
