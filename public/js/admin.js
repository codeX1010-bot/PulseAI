document.addEventListener('DOMContentLoaded', () => {
    // Basic Auth Check
    const token = localStorage.getItem('auth_token');
    const role = localStorage.getItem('user_role');

    if (!token || role !== 'admin') {
        window.location.href = 'login.html';
        return;
    }

    // Initialize Chart.js
    const ctx = document.getElementById('illnessChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Common Cold', 'Chronic Sinusitis', 'Typhoid', 'Malaria', 'Pneumonia', 'Dengue'],
            datasets: [{
                label: 'Cases This Week',
                data: [65, 42, 30, 25, 20, 15],
                backgroundColor: [
                    '#006666', // Deep Teal
                    '#3399FF', // Medical Blue
                    '#99FFCC', // Mint Green
                    '#004c4c',
                    '#2580df',
                    '#73e6b3'
                ],
                borderWidth: 0,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: '#f1f5f9' }
                },
                x: {
                    grid: { display: false }
                }
            }
        }
    });

    // Populate Mock Server Logs
    const logs = [
        { time: "20:41:02", id: "USR-992", payload: "[headache, fever, chills]", result: "Chronic Sinusitis (89%)", status: "200 OK" },
        { time: "20:38:15", id: "USR-771", payload: "[cough, runny_nose, fatigue]", result: "Common Cold (95%)", status: "200 OK" },
        { time: "20:25:44", id: "USR-342", payload: "[nausea, vomiting, pain]", result: "Gastroenteritis (76%)", status: "200 OK" },
        { time: "20:12:09", id: "USR-115", payload: "[fever]", result: "ERROR: MIN 3 SYMPTOMS", status: "400 FAIL" }
    ];

    const tableBody = document.getElementById('logTable');
    logs.forEach(log => {
        const statusBadge = log.status.includes('200')
            ? '<span class="badge bg-success bg-opacity-10 text-success border border-success">200 OK</span>'
            : '<span class="badge bg-danger bg-opacity-10 text-danger border border-danger">400 FAIL</span>';

        tableBody.innerHTML += `
            <tr>
                <td class="text-muted font-monospace small">${log.time}</td>
                <td class="fw-bold">${log.id}</td>
                <td class="text-secondary small font-monospace">${log.payload}</td>
                <td class="fw-medium">${log.result}</td>
                <td>${statusBadge}</td>
            </tr>
        `;
    });
});

function logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_role');
    window.location.href = 'login.html';
}
