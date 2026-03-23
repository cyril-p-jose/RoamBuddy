// --- Application State ---
let currentState = {
    screen: 'landing',
    wizardStep: 1,
    user: null,
    tripData: {
        destination: '',
        days: 3,
        type: 'Local',
        travelers: 'Solo',
        budget: 'Medium',
        food: 'Both',
        accommodation: 'Hotel',
        transport: 'Car',
        departureTime: '08:00'
    },
    itinerary: [],
    currentDayView: 1
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    updateUI();
});

// --- Navigation ---
function showScreen(screenId) {
    currentState.screen = screenId;
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(`${screenId}-screen`).classList.add('active');
    window.scrollTo(0, 0);
}

function startWizard() {
    currentState.wizardStep = 1;
    showScreen('wizard');
    renderWizardStep();
}

// --- Wizard Logic ---
const totalSteps = 9;

function renderWizardStep() {
    const container = document.getElementById('wizard-steps');
    const step = currentState.wizardStep;
    
    // Update progress
    document.getElementById('step-counter').innerText = `Step ${step} of ${totalSteps}`;
    document.getElementById('percent-label').innerText = `${Math.round((step/totalSteps)*100)}%`;
    document.getElementById('progress-fill').style.width = `${(step/totalSteps)*100}%`;
    document.getElementById('prev-btn').style.display = step === 1 ? 'none' : 'block';
    document.getElementById('next-btn').innerHTML = step === totalSteps ? 'Generate Plan' : 'Continue <i data-lucide="arrow-right"></i>';

    let html = '<div class="wizard-step-ui animate-in">';
    
    switch(step) {
        case 1:
            html += `<h2>Where to?</h2>
                    <input type="text" id="dest-input" placeholder="e.g. Munnar, Kerala" value="${currentState.tripData.destination}" oninput="updateTripData('destination', this.value)">`;
            break;
        case 2:
            html += `<h2>How many days?</h2>
                    <div class="counter-ui">
                        <button onclick="changeDays(-1)">-</button>
                        <span id="days-val">${currentState.tripData.days}</span>
                        <button onclick="changeDays(1)">+</button>
                    </div>`;
            break;
        case 3:
            html += `<h2>Trip Type</h2>
                    ${renderOptions('type', ['Local', 'Interstate', 'International'])}`;
            break;
        case 4:
            html += `<h2>Who's Traveling?</h2>
                    ${renderOptions('travelers', ['Solo', 'Couple', 'Family', 'Group'])}`;
            break;
        case 5:
            html += `<h2>Budget</h2>
                    ${renderOptions('budget', ['Economy', 'Standard', 'Luxury'])}`;
            break;
        case 6:
            html += `<h2>Food Preferences</h2>
                    ${renderOptions('food', ['Veg', 'Non-Veg', 'Both', 'Vegan'])}`;
            break;
        case 7:
            html += `<h2>Accommodation</h2>
                    ${renderOptions('accommodation', ['Hotel', 'Hostel', 'Resort', 'Homestay'])}`;
            break;
        case 8:
            html += `<h2>Transport</h2>
                    ${renderOptions('transport', ['Car', 'Train', 'Bus', 'Flight'])}`;
            break;
        case 9:
            html += `<h2>Departure Time</h2>
                    <input type="time" class="time-input-lg" value="${currentState.tripData.departureTime}" onchange="updateTripData('departureTime', this.value)">`;
            break;
        default:
            html += `<h2>Setting Preferences...</h2><p class="text-muted">Personalizing your ${currentState.tripData.destination} experience.</p>`;
    }
    
    html += '</div>';
    container.innerHTML = html;
    lucide.createIcons();
}

function renderOptions(key, options) {
    return options.map(opt => `
        <button class="option-btn ${currentState.tripData[key] === opt ? 'selected' : ''}" onclick="updateTripData('${key}', '${opt}'); nextStep()">
            ${opt}
        </button>
    `).join('');
}

function updateTripData(key, val) {
    currentState.tripData[key] = val;
}

function changeDays(delta) {
    currentState.tripData.days = Math.max(1, currentState.tripData.days + delta);
    document.getElementById('days-val').innerText = currentState.tripData.days;
}

function nextStep() {
    if (currentState.wizardStep === 1 && !currentState.tripData.destination) return alert("Please enter a destination");
    
    if (currentState.wizardStep < totalSteps) {
        currentState.wizardStep++;
        renderWizardStep();
    } else {
        generateItinerary();
    }
}

function prevStep() {
    if (currentState.wizardStep > 1) {
        currentState.wizardStep--;
        renderWizardStep();
    }
}

// --- Itinerary Engine ---
function generateItinerary() {
    const data = currentState.tripData;
    let plan = [];
    let id = 1;

    for (let d = 1; d <= data.days; d++) {
        const isFirst = d === 1;
        const isLast = d === data.days;

        if (isFirst) {
            plan.push({ id: id++, day: d, time: data.departureTime, activity: `Travel via ${data.transport}`, location: 'Terminal/Station', completed: false });
            plan.push({ id: id++, day: d, time: '12:30 PM', activity: 'Hotel Check-in', location: data.accommodation, completed: false });
        } else {
            plan.push({ id: id++, day: d, time: '09:00 AM', activity: 'Breakfast', location: 'Hotel Cafe', completed: false });
        }

        plan.push({ id: id++, day: d, time: '02:00 PM', activity: 'Main Exploration', location: `${data.destination} Center`, completed: false });
        plan.push({ id: id++, day: d, time: '07:00 PM', activity: isLast ? 'Departure Prep' : 'Dinner & Nightwalk', location: 'Local Area', completed: false });
    }

    currentState.itinerary = plan;
    renderDashboard();
    showScreen('dashboard');
}

function renderDashboard() {
    const data = currentState.tripData;
    document.getElementById('dash-dest-title').innerText = `${data.destination} Trip`;
    document.getElementById('dash-meta').innerText = `${data.days} Days • ${data.travelers} • ${data.transport}`;
    
    // Render Day Tabs
    const tabContainer = document.getElementById('day-tabs');
    tabContainer.innerHTML = Array.from({length: data.days}, (_, i) => i+1).map(d => `
        <button class="day-tab ${currentState.currentDayView === d ? 'active' : ''}" onclick="setDayView(${d})">Day ${d}</button>
    `).join('');

    // Render Itinerary List
    const list = document.getElementById('itinerary-list');
    const filtered = currentState.itinerary.filter(i => i.day === currentState.currentDayView);
    
    list.innerHTML = filtered.map(item => `
        <div class="itinerary-item ${item.completed ? 'completed' : ''}">
            <div class="time-badge ${item.shifted ? 'shifted' : ''}">${item.time}</div>
            <div style="flex-grow:1">
                <strong>${item.activity}</strong>
                <p class="text-muted" style="font-size:0.8rem">${item.location}</p>
            </div>
            <button class="btn-primary" style="padding:0.5rem" onclick="toggleTask(${item.id})">
                ${item.completed ? '✓' : 'O'}
            </button>
        </div>
    `).join('');

    // Render Summary
    document.getElementById('summary-details').innerHTML = `
        <li>Budget: ${data.budget}</li>
        <li>Stay: ${data.accommodation}</li>
        <li>Food: ${data.food}</li>
    `;

    const next = currentState.itinerary.find(i => !i.completed);
    document.getElementById('next-stop-text').innerText = next ? next.activity : "Trip Completed!";
}

function setDayView(day) {
    currentState.currentDayView = day;
    renderDashboard();
}

function toggleTask(id) {
    const item = currentState.itinerary.find(i => i.id === id);
    if (item) item.completed = !item.completed;
    renderDashboard();
}

function handleDelay() {
    currentState.itinerary = currentState.itinerary.map(item => {
        if (item.day === currentState.currentDayView && !item.completed) {
            return { ...item, shifted: true, time: "Shifted +1h" };
        }
        return item;
    });
    renderDashboard();
}

// --- Utilities ---
function toggleModal(id) {
    document.getElementById(id).classList.toggle('active');
    // Reset auth mode when opening
    if (id === 'auth-modal') {
        currentState.authMode = 'login';
        updateAuthUI();
    }
}

function toggleAuthMode() {
    currentState.authMode = currentState.authMode === 'login' ? 'signup' : 'login';
    updateAuthUI();
}

function updateAuthUI() {
    const isLogin = currentState.authMode === 'login';
    document.getElementById('auth-title').innerText = isLogin ? 'Welcome Back' : 'Create Account';
    document.getElementById('auth-submit-btn').innerText = isLogin ? 'Login' : 'Sign Up';
    document.getElementById('auth-footer-text').innerHTML = isLogin 
        ? "Don't have an account? <strong>Sign up</strong>" 
        : "Already have an account? <strong>Login</strong>";
    
    const nameInput = document.getElementById('auth-name');
    if (isLogin) {
        nameInput.style.display = 'none';
        nameInput.removeAttribute('required');
    } else {
        nameInput.style.display = 'block';
        nameInput.setAttribute('required', 'true');
    }
}

function handleAuth(e) {
    e.preventDefault();
    const email = document.getElementById('auth-email').value;
    const name = document.getElementById('auth-name').value;
    
    if (currentState.authMode === 'signup') {
        currentState.user = { name: name || email.split('@')[0] };
    } else {
        currentState.user = { name: email.split('@')[0] };
    }
    
    document.getElementById('auth-section').innerHTML = `<span class="text-muted" style="font-weight:600;">Hi, ${currentState.user.name}</span>`;
    toggleModal('auth-modal');
}
