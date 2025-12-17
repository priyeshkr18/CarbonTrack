/* ============================================================================
   MODULE 1: PARTICLE NETWORK ENGINE
   Description: Creates the "constellation" background effect that reacts
   to mouse movement.
   ============================================================================ */
class ParticleNetwork {
    constructor() {
        this.canvas = document.getElementById('particle-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.mouse = { x: null, y: null, radius: 150 };
        this.resize();
        
        // Bind events
        window.addEventListener('resize', () => this.resize());
        window.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        window.addEventListener('mouseout', () => this.handleMouseOut());
        
        this.init();
        this.animate();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    handleMouseMove(e) {
        this.mouse.x = e.x;
        this.mouse.y = e.y;
    }

    handleMouseOut() {
        this.mouse.x = undefined;
        this.mouse.y = undefined;
    }

    init() {
        this.particles = [];
        // Density calculation
        const numberOfParticles = (this.canvas.width * this.canvas.height) / 9000;
        
        for (let i = 0; i < numberOfParticles; i++) {
            const size = (Math.random() * 2) + 1;
            const x = (Math.random() * ((this.canvas.width - size * 2) - (size * 2)) + size * 2);
            const y = (Math.random() * ((this.canvas.height - size * 2) - (size * 2)) + size * 2);
            const directionX = (Math.random() * 0.5) - 0.25;
            const directionY = (Math.random() * 0.5) - 0.25;
            const color = Math.random() > 0.5 ? '#10b981' : '#0f766e'; // Brand colors
            
            this.particles.push({x, y, directionX, directionY, size, color});
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];

            // Movement
            p.x += p.directionX;
            p.y += p.directionY;

            // Boundary Checks
            if (p.x > this.canvas.width || p.x < 0) p.directionX = -p.directionX;
            if (p.y > this.canvas.height || p.y < 0) p.directionY = -p.directionY;

            // Interaction: Connect to Mouse
            let dxMouse = this.mouse.x - p.x;
            let dyMouse = this.mouse.y - p.y;
            let distanceMouse = Math.sqrt(dxMouse*dxMouse + dyMouse*dyMouse);
            
            if (distanceMouse < this.mouse.radius) {
                const opacity = 1 - (distanceMouse / this.mouse.radius);
                this.ctx.beginPath();
                this.ctx.strokeStyle = `rgba(16, 185, 129, ${opacity})`;
                this.ctx.lineWidth = 1;
                this.ctx.moveTo(p.x, p.y);
                this.ctx.lineTo(this.mouse.x, this.mouse.y);
                this.ctx.stroke();
            }

            // Draw Particle
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2, false);
            this.ctx.fillStyle = p.color;
            this.ctx.fill();

            // Interaction: Connect to Neighbors
            for (let j = i; j < this.particles.length; j++) {
                const p2 = this.particles[j];
                const dx = p.x - p2.x;
                const dy = p.y - p2.y;
                const distance = (dx * dx) + (dy * dy);

                if (distance < (this.canvas.width/9) * (this.canvas.height/9)) {
                   const opacity = 1 - (distance / 20000);
                   if(opacity > 0) {
                       this.ctx.beginPath();
                       this.ctx.strokeStyle = `rgba(16, 185, 129, ${opacity * 0.1})`;
                       this.ctx.lineWidth = 0.5;
                       this.ctx.moveTo(p.x, p.y);
                       this.ctx.lineTo(p2.x, p2.y);
                       this.ctx.stroke();
                   }
                }
            }
        }
    }
}

/* ============================================================================
   MODULE 2: AUTHENTICATION & VIEW MANAGEMENT
   Description: Handles login transitions and tab switching.
   ============================================================================ */
const Auth = {
    loginForm: document.getElementById('login-form'),
    
    init() {
        this.loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.processLogin();
        });
    },

    processLogin() {
        const btn = this.loginForm.querySelector('button');
        const originalText = btn.innerHTML;
        
        // Simulating API Call
        btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> VERIFYING ID...';
        btn.disabled = true;
        btn.classList.add('opacity-75');

        setTimeout(() => {
            document.getElementById('view-auth').style.display = 'none';
            document.getElementById('app-wrapper').classList.remove('hidden');
            // Initialize other modules upon login
            Calculator.init();
            Community.init();
            Charts.initHistory();
        }, 1200);
    },

    logout() {
        window.location.reload();
    }
};

const UI = {
    switchView(viewId) {
        // Hide all views
        document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));
        
        // Reset Nav Buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active-nav', 'text-white');
            btn.classList.add('text-gray-400');
        });
        
        // Show Target View
        document.getElementById(`view-${viewId}`).classList.remove('hidden');
        
        // Highlight active button (approximate matching)
        const activeBtn = Array.from(document.querySelectorAll('.nav-btn'))
            .find(b => b.innerText.toLowerCase().includes(viewId));
        
        if (activeBtn) {
            activeBtn.classList.add('active-nav', 'text-white');
            activeBtn.classList.remove('text-gray-400');
        }
    },

    toggleSettings() {
        const modal = document.getElementById('settings-modal');
        if (modal.classList.contains('hidden')) {
            modal.classList.remove('hidden');
        } else {
            modal.classList.add('hidden');
        }
    },

    closeModal() {
        document.getElementById('trophy-modal').classList.add('hidden');
    }
};

/* ============================================================================
   MODULE 3: CALCULATOR & AVATAR LOGIC
   Description: Handles inputs, calculation, chart rendering, and the
   Future Kid Avatar state machine.
   ============================================================================ */
const Calculator = {
    inputs: {
        elec: document.getElementById('inp-elec'),
        car: document.getElementById('inp-car'),
        flight: document.getElementById('inp-flight'),
        meat: document.getElementById('inp-meat')
    },
    
    threshold: 4.7, // Global Average (approx)

    init() {
        // Bind input events to update display labels
        Object.keys(this.inputs).forEach(key => {
            this.inputs[key].addEventListener('input', (e) => {
                const units = { 
                    elec: ' kWh', 
                    car: ' km', 
                    flight: ' flights', 
                    meat: ' meals'
                };
                document.getElementById(`disp-${key}`).innerText = e.target.value + units[key];
            });
        });
    },

    process() {
        // 1. Reveal hidden areas
        const kidCard = document.getElementById('kid-card');
        document.getElementById('result-display').classList.remove('hidden');
        document.getElementById('initial-message').classList.add('hidden');
        document.getElementById('chart-container').classList.remove('hidden');
        document.getElementById('chart-container').classList.add('animate-fade-in');

        // 2. Perform Calculation (Mock Formula)
        const valElec = this.inputs.elec.value * 12 * 0.5 / 1000;
        const valCar = this.inputs.car.value * 52 * 0.2 / 1000;
        const valFlight = this.inputs.flight.value * 300 / 1000;
        const valFood = this.inputs.meat.value * 52 * 2.0 / 1000;
        
        const total = parseFloat((valElec + valCar + valFlight + valFood).toFixed(2));
        
        // 3. Update Text
        document.getElementById('result-number').innerText = total;

        // 4. Update Avatar State
        this.updateAvatarState(total);

        // 5. Render Chart
        Charts.renderMain([valElec, valCar, valFlight, valFood]);
    },

    updateAvatarState(total) {
        const kidImg = document.getElementById('future-kid-img');
        const messageBox = document.getElementById('kid-message-box');
        const messageText = document.getElementById('kid-message');
        
        // DiceBear API Configuration
        // Seed 'Felix' maintains consistency of the character's face shape/hair
        const baseUrl = "https://api.dicebear.com/9.x/avataaars/svg?seed=Felix&clothing=collarAndSweater";

        if (total > this.threshold) {
            // === SAD STATE ===
            kidImg.src = `${baseUrl}&mouth=sad&eyebrows=frown&eyes=cry`;
            
            messageBox.className = "p-4 rounded-xl bg-red-900/20 border border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.2)]";
            messageText.innerHTML = `
                <strong class="text-red-400 block mb-1">My future is hurting.</strong>
                "Please reduce your emissions. The heat is rising, and I am scared."
            `;
        } else {
            // === HAPPY STATE ===
            kidImg.src = `${baseUrl}&mouth=smile&eyebrows=raised&eyes=happy`;
            
            messageBox.className = "p-4 rounded-xl bg-emerald-900/20 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]";
            messageText.innerHTML = `
                <strong class="text-emerald-400 block mb-1">Thank you!</strong>
                "You are giving me a greener, safer world to grow up in!"
            `;
            
            this.triggerTrophyModal();
        }
    },

    triggerTrophyModal() {
        const modal = document.getElementById('trophy-modal');
        const iconContainer = document.getElementById('modal-icon-container');
        const title = document.getElementById('modal-title');
        const desc = document.getElementById('modal-desc');

        iconContainer.innerHTML = '<i class="fa-solid fa-trophy text-6xl text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]"></i>';
        title.innerText = "Carbon Champion!";
        desc.innerText = "Your footprint is below the global average. You are actively protecting the future for the next generation. Keep up the amazing work.";

        modal.classList.remove('hidden');
    }
};

/* ============================================================================
   MODULE 4: CHARTS & DATA
   Description: Handles Chart.js rendering.
   ============================================================================ */
const Charts = {
    mainChart: null,
    historyChart: null,

    renderMain(data) {
        const ctx = document.getElementById('footprintChart').getContext('2d');
        if (this.mainChart) this.mainChart.destroy();

        this.mainChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Energy', 'Transport', 'Air', 'Food'],
                datasets: [{
                    data: data,
                    backgroundColor: ['#eab308', '#ef4444', '#3b82f6', '#f97316'],
                    borderWidth: 0,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { 
                    legend: { position: 'right', labels: { color: '#cbd5e1', font: {family: 'Outfit'} } } 
                },
                layout: { padding: 20 },
                animation: { animateScale: true, animateRotate: true }
            }
        });
    },

    initHistory() {
        const ctx = document.getElementById('historyChart').getContext('2d');
        if (this.historyChart) this.historyChart.destroy();

        // Mock History Data
        this.historyChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Carbon Footprint (Tons)',
                    data: [5.2, 4.9, 4.8, 4.5, 4.3, 4.1],
                    borderColor: '#10b981',
                    backgroundColor: (context) => {
                        const ctx = context.chart.ctx;
                        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
                        gradient.addColorStop(0, 'rgba(16, 185, 129, 0.4)');
                        gradient.addColorStop(1, 'rgba(16, 185, 129, 0.0)');
                        return gradient;
                    },
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: '#10b981'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { display: false }, ticks: { color: '#64748b' } },
                    y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b' } }
                }
            }
        });
    }
};

/* ============================================================================
   MODULE 5: COMMUNITY FEED
   ============================================================================ */
const Community = {
    posts: [
        { user: 'Sarah J.', content: 'Just switched to 100% solar! My projected footprint dropped by 2 tons.', time: '2h ago' },
        { user: 'Mike R.', content: 'Bike to work week is going great. Legs are tired but heart is full.', time: '5h ago' }
    ],

    init() {
        this.render();
    },

    addPost() {
        const input = document.getElementById('post-input');
        const txt = input.value.trim();
        
        if(txt) {
            this.posts.unshift({
                user: 'You',
                content: txt,
                time: 'Just now'
            });
            input.value = '';
            this.render();
        }
    },

    render() {
        const container = document.getElementById('feed-stream');
        container.innerHTML = this.posts.map(post => `
            <div class="glass-card p-4 rounded-xl border-l-4 border-slate-700 hover:border-emerald-500 transition-colors cursor-pointer animate-fade-in">
                <p class="text-sm text-gray-200 leading-relaxed">${post.content}</p>
                <div class="flex justify-between items-center mt-3 pt-3 border-t border-white/5">
                    <span class="text-xs font-bold text-emerald-400">${post.user}</span>
                    <span class="text-xs text-gray-500">${post.time}</span>
                </div>
            </div>
        `).join('');
    }
};

// Initialize Application
new ParticleNetwork();
Auth.init();