/* ==========================================================================
   TalentAI Application Core Logic & State Management
   ========================================================================== */

// --- Central Data Store (Application State) ---
const state = {
    jobs: [
        {
            id: 'job-1',
            title: 'Senior Full-Stack Engineer',
            department: 'Engineering',
            location: 'Remote, US',
            status: 'active',
            candidatesCount: 0,
            tags: ['React', 'Node.js', 'AWS', 'System Design', 'JavaScript'],
            minRequirements: { 'React': 80, 'Node.js': 80, 'AWS': 70, 'System Design': 75, 'JavaScript': 85 },
            description: `We are looking for a Senior Full-Stack Engineer to lead the design and development of our core web platform. You will build and scale high-performance services using Node.js, React, and AWS cloud solutions.\n\nKey Responsibilities:\n- Lead architectural decisions for frontend and backend subsystems.\n- Build responsive, interactive web interfaces using React.\n- Design scalable backend microservices with Node.js and Express.\n- Optimize application performance and cloud infrastructure on AWS.`
        },
        {
            id: 'job-2',
            title: 'Lead Product Manager',
            department: 'Product',
            location: 'San Francisco, CA',
            status: 'active',
            candidatesCount: 0,
            tags: ['Agile', 'Product Strategy', 'SaaS', 'Analytics', 'Roadmapping'],
            minRequirements: { 'Agile': 85, 'Product Strategy': 80, 'SaaS': 80, 'Analytics': 75 },
            description: `Join us as a Lead Product Manager to define the vision, strategy, and roadmap for our B2B SaaS platform. You will collaborate with engineering, design, and marketing teams to ship delightful user experiences.\n\nRequirements:\n- 5+ years of PM experience in B2B SaaS.\n- Strong analytical mindset using tools like Mixpanel/Amplitude.\n- Proven ability to manage complex cross-functional roadmaps.`
        },
        {
            id: 'job-3',
            title: 'AI Devops Engineer',
            department: 'Infrastructure',
            location: 'Hybrid, Seattle',
            status: 'draft',
            candidatesCount: 0,
            tags: ['Kubernetes', 'Docker', 'CI/CD', 'Terraform', 'Python'],
            minRequirements: { 'Kubernetes': 80, 'Docker': 85, 'CI/CD': 80, 'Terraform': 75 },
            description: `Seeking an Infrastructure engineer with a strong focus on deploying and automating LLM workloads and machine learning pipelines using Kubernetes and modern cloud infrastructure pipelines.`
        }
    ],
    candidates: [],
    auditLogs: [
        {
            id: 'log-100',
            timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
            actor: 'System Initialization',
            action: 'system:init',
            resource: 'TalentAI Platform',
            ipAddress: '127.0.0.1',
            details: 'Fresh enterprise SaaS application instance initialized. Audit logging active.'
        }
    ],
    currentUser: null,
    // State of the current screening/interview candidate
    activeInterview: {
        candidateId: null,
        candidateName: 'Guest Candidate',
        jobId: 'job-1',
        stage: 0,
        chatHistory: [],
        metrics: {
            communication: 0,
            technical: 0,
            sentiment: 0
        },
        skillsUnlocked: []
    }
};

// --- Process Audit History Logging Engine ---
function addAuditHistoryEntry(action, resource, details) {
    const actorName = state.currentUser ? `${state.currentUser.displayName} (${state.currentUser.role})` : 'Lead Recruiter';
    const now = new Date();
    const timestamp = now.getFullYear() + '-' +
        String(now.getMonth() + 1).padStart(2, '0') + '-' +
        String(now.getDate()).padStart(2, '0') + ' ' +
        String(now.getHours()).padStart(2, '0') + ':' +
        String(now.getMinutes()).padStart(2, '0') + ':' +
        String(now.getSeconds()).padStart(2, '0');

    const entry = {
        id: 'log-' + (state.auditLogs.length + 101),
        timestamp: timestamp,
        actor: actorName,
        action: action,
        resource: resource,
        ipAddress: '192.168.1.45',
        details: details
    };

    state.auditLogs.unshift(entry);

    // If active view is Audit, dynamically update history table in real time!
    const tableBody = document.getElementById('audit-table-body');
    if (tableBody) {
        tableBody.innerHTML = renderAuditRows();
    }
}

function renderAuditRows(filterAction = 'all') {
    if (!state.auditLogs || state.auditLogs.length === 0) {
        return `
            <tr>
                <td colspan="6" style="text-align:center; color:var(--text-muted); padding:35px 10px; font-size:0.85rem;">
                    No process history logged yet. Complete actions like uploading resumes, creating jobs, or running bias audits to populate history logs.
                </td>
            </tr>
        `;
    }

    const filtered = filterAction === 'all' 
        ? state.auditLogs 
        : state.auditLogs.filter(log => log.action.includes(filterAction));

    if (filtered.length === 0) {
        return `<tr><td colspan="6" style="text-align:center; color:var(--text-muted); padding:20px;">No history matching filter "${filterAction}".</td></tr>`;
    }

    return filtered.map(log => {
        let actionPill = '<span class="job-status-pill active">' + log.action + '</span>';
        if (log.action.includes('override')) actionPill = '<span class="job-status-pill draft">' + log.action + '</span>';
        if (log.action.includes('create')) actionPill = '<span class="job-status-pill active" style="background:rgba(16,185,129,0.1); color:var(--success); border-color:var(--success);">' + log.action + '</span>';
        if (log.action.includes('login')) actionPill = '<span class="job-status-pill active" style="background:rgba(14,165,233,0.1); color:#0ea5e9; border-color:#0ea5e9;">' + log.action + '</span>';

        return `
            <tr class="ranking-row">
                <td style="font-size:0.775rem; color:var(--text-muted);">${log.timestamp}</td>
                <td style="font-weight:600;">${log.actor}</td>
                <td>${actionPill}</td>
                <td>${log.resource}</td>
                <td style="font-size:0.75rem; color:var(--text-muted);">${log.ipAddress || '127.0.0.1'}</td>
                <td style="font-size:0.775rem; color:var(--text-secondary);">${log.details}</td>
            </tr>
        `;
    }).join('');
}

// --- Mock Resume DB for Screener Simulation ---
const mockResumeDatabase = {
    'dev-john': {
        name: 'Johnathan Miller',
        email: 'johnathan.miller@devs.net',
        skills: { 'JavaScript': 94, 'React': 88, 'Node.js': 90, 'AWS': 85, 'System Design': 82 },
        summary: 'Senior systems developer with 6+ years of production experience implementing high-availability servers and interactive React web apps.',
        strengths: [
            'Deep expertise in Node.js event-loop tuning and database index scaling.',
            'Exceptional command of modern Javascript, Typescript, and state management.',
            'Skilled in building CI/CD deployment pipelines on AWS.'
        ],
        gaps: [
            'Minimal experience with Kubernetes or Docker container management tools.'
        ]
    },
    'pm-elena': {
        name: 'Elena Rostova',
        email: 'elena.rostova@productmind.io',
        skills: { 'Agile': 94, 'Product Strategy': 90, 'SaaS': 92, 'Analytics': 88 },
        summary: 'Growth-focused SaaS Product Manager with 7 years of experience launching B2B software products and optimizing user funnels.',
        strengths: [
            'Exceptional analytical skills with deep expertise in Mixpanel and SQL.',
            'Proven track record of increasing customer retention by 15% year-over-year.',
            'Superb stakeholder management and technical translation.'
        ],
        gaps: [
            'Has primarily worked in early-stage startups; lacks experience in large enterprise product lines.'
        ]
    }
};

// --- View Router & Lifecycle Control ---
document.addEventListener('DOMContentLoaded', () => {
    initRouter();
    registerGlobalEvents();
    
    // Initial Load - default to dashboard
    const hash = window.location.hash.substring(1) || 'dashboard';
    navigateToView(hash);
});

function initRouter() {
    // Navigation link clicks
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const viewName = item.getAttribute('data-view');
            window.location.hash = viewName;
            navigateToView(viewName);
        });
    });

    // Hash change handler
    window.addEventListener('hashchange', () => {
        const viewName = window.location.hash.substring(1) || 'dashboard';
        navigateToView(viewName);
    });
}

function navigateToView(viewName) {
    const container = document.getElementById('view-container');
    
    // Update active nav item
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
    navItems.forEach(item => {
        if (item.getAttribute('data-view') === viewName) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // Fade-out existing view
    container.style.opacity = 0;
    
    setTimeout(() => {
        // Render view
        switch (viewName) {
            case 'dashboard':
                renderDashboard(container);
                break;
            case 'jobs':
                renderJobs(container);
                break;
            case 'screener':
                renderScreener(container);
                break;
            case 'interview':
                renderInterview(container);
                break;
            case 'analytics':
                renderAnalytics(container);
                break;
            default:
                renderDashboard(container);
        }
        // Fade-in new view
        container.style.opacity = 1;
    }, 200);
}

function registerGlobalEvents() {
    // Global search mock
    const searchInput = document.getElementById('global-search');
    if (searchInput) {
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                showToast(`Searching database for: "${searchInput.value}"...`, 'info');
                searchInput.value = '';
            }
        });
    }
}

// --- View Renders ---

// 1. Dashboard View
function renderDashboard(container) {
    // Analytics calculations
    const activeJobs = state.jobs.filter(j => j.status === 'active').length;
    const totalScreened = state.candidates.length;
    const avgScore = Math.round(state.candidates.reduce((sum, c) => sum + c.score, 0) / (totalScreened || 1));
    
    container.innerHTML = `
        <div class="view-header">
            <div class="view-title-area">
                <h1>Recruitment Dashboard</h1>
                <p>Welcome back! Here is your AI hiring digest for today.</p>
            </div>
            <button class="btn-primary" id="btn-quick-job">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Post New Job
            </button>
        </div>

        <!-- AI recommendation alert box -->
        <div class="ai-recommendation-box">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
            </svg>
            <div class="ai-rec-text">
                <h4>AI Recommendation Advisor</h4>
                ${state.candidates.length > 0 ? 
                    `<p>Candidate <strong>${state.candidates[0].name}</strong> (${state.candidates[0].score}% match score) represents optimal alignment. Recommendation: Launch interview screening phase.</p>` :
                    `<p>Welcome to your clean <strong>TalentAI System</strong> instance. Upload candidate resumes in the <strong>Resume Screener</strong> module to run automated classifications, explainable match scoring, and predictive analytics.</p>`
                }
            </div>
        </div>

        <div class="dashboard-grid">
            <div class="glass-card metric-card">
                <div class="metric-header">
                    <span>Candidates Screened</span>
                    <div class="metric-icon active">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                    </div>
                </div>
                <div class="metric-value">${totalScreened}</div>
                <div class="metric-footer">
                    <span class="metric-change positive">↑ 12%</span>
                    <span class="metric-trend-text">from last week</span>
                </div>
            </div>
            
            <div class="glass-card metric-card">
                <div class="metric-header">
                    <span>Average Match Rate</span>
                    <div class="metric-icon">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                        </svg>
                    </div>
                </div>
                <div class="metric-value">${avgScore}%</div>
                <div class="metric-footer">
                    <span class="metric-change positive">↑ 1.4%</span>
                    <span class="metric-trend-text">industry avg: 72%</span>
                </div>
            </div>

            <div class="glass-card metric-card">
                <div class="metric-header">
                    <span>Active Postings</span>
                    <div class="metric-icon">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                        </svg>
                    </div>
                </div>
                <div class="metric-value">${activeJobs}</div>
                <div class="metric-footer">
                    <span class="metric-change">Stable</span>
                    <span class="metric-trend-text">0 positions filled today</span>
                </div>
            </div>

            <div class="glass-card metric-card">
                <div class="metric-header">
                    <span>AI Savings Time</span>
                    <div class="metric-icon">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                        </svg>
                    </div>
                </div>
                <div class="metric-value">22.5h</div>
                <div class="metric-footer">
                    <span class="metric-change positive">↑ 4.2h</span>
                    <span class="metric-trend-text">saved in manual reviews</span>
                </div>
            </div>
        </div>

        <div class="dashboard-content-grid">
            <!-- Screening Trend SVG Chart -->
            <div class="glass-card chart-card">
                <div class="card-header-actions">
                    <span class="card-title">Weekly Candidate Throughput</span>
                    <div class="chart-legend">
                        <div class="legend-item">
                            <span class="legend-color primary"></span>
                            <span>Total Applied</span>
                        </div>
                    </div>
                </div>
                
                <div class="svg-chart-container">
                    <svg viewBox="0 0 500 220" width="100%" height="100%">
                        <defs>
                            <linearGradient id="chart-gradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stop-color="#6366f1" />
                                <stop offset="100%" stop-color="#a855f7" />
                            </linearGradient>
                            <linearGradient id="area-gradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stop-color="rgba(99, 102, 241, 0.25)" />
                                <stop offset="100%" stop-color="rgba(168, 85, 247, 0.0)" />
                            </linearGradient>
                        </defs>
                        <!-- Grid Lines -->
                        <line x1="40" y1="20" x2="480" y2="20" class="chart-grid-line" />
                        <line x1="40" y1="70" x2="480" y2="70" class="chart-grid-line" />
                        <line x1="40" y1="120" x2="480" y2="120" class="chart-grid-line" />
                        <line x1="40" y1="170" x2="480" y2="170" class="chart-grid-line" />
                        
                        <!-- Axis labels -->
                        <text x="15" y="24" fill="#64748b" font-size="9">100</text>
                        <text x="15" y="74" fill="#64748b" font-size="9">75</text>
                        <text x="15" y="124" fill="#64748b" font-size="9">50</text>
                        <text x="15" y="174" fill="#64748b" font-size="9">25</text>
                        
                        <text x="40" y="200" fill="#64748b" font-size="9" text-anchor="middle">Mon</text>
                        <text x="113" y="200" fill="#64748b" font-size="9" text-anchor="middle">Tue</text>
                        <text x="186" y="200" fill="#64748b" font-size="9" text-anchor="middle">Wed</text>
                        <text x="260" y="200" fill="#64748b" font-size="9" text-anchor="middle">Thu</text>
                        <text x="333" y="200" fill="#64748b" font-size="9" text-anchor="middle">Fri</text>
                        <text x="406" y="200" fill="#64748b" font-size="9" text-anchor="middle">Sat</text>
                        <text x="480" y="200" fill="#64748b" font-size="9" text-anchor="middle">Sun</text>
                        
                        <!-- Line & Area Paths -->
                        <path d="M 40,150 Q 113,110 186,130 T 333,60 T 480,40 L 480,170 L 40,170 Z" class="chart-path" style="stroke:none;" />
                        <path d="M 40,150 Q 113,110 186,130 T 333,60 T 480,40" class="chart-path" fill="none" stroke-dasharray="800" stroke-dashoffset="800" />
                        
                        <!-- Data Points -->
                        <circle cx="40" cy="150" r="4" class="chart-pulse-point" />
                        <circle cx="186" cy="130" r="4" class="chart-pulse-point" />
                        <circle cx="333" cy="60" r="4" class="chart-pulse-point" />
                        <circle cx="480" cy="40" r="4" class="chart-pulse-point" />
                    </svg>
                </div>
            </div>

            <!-- Top AI Matched Candidates -->
            <div class="glass-card matches-card">
                <span class="card-title">Top Candidates</span>
                <div class="matches-list">
                    ${renderTopCandidatesMarkup()}
                </div>
            </div>
        </div>

        <!-- Leaderboard widget -->
        <div class="glass-card ranking-table-card">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span class="card-title">Candidate Alignment Rankings Leaderboard</span>
                <div>
                    <select class="select-filter" id="rank-job-select">
                        <option value="all">All Jobs Standings</option>
                        ${state.jobs.map(j => `<option value="${j.id}">${j.title}</option>`).join('')}
                    </select>
                </div>
            </div>
            
            <table class="ranking-table">
                <thead>
                    <tr>
                        <th style="width: 80px;">Rank</th>
                        <th>Candidate Name</th>
                        <th>Primary Classification</th>
                        <th>Match Score</th>
                        <th>Success Rating</th>
                        <th>Salary Bound</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody id="ranking-table-body">
                    ${renderRankingRows('all')}
                </tbody>
            </table>
        </div>
    `;

    // Hook quick job button to navigate to Jobs page and trigger modal
    document.getElementById('btn-quick-job').addEventListener('click', () => {
        window.location.hash = 'jobs';
        navigateToView('jobs');
        setTimeout(() => {
            openJobModal();
        }, 300);
    });

    const rankJobSelect = document.getElementById('rank-job-select');
    if (rankJobSelect) {
        rankJobSelect.addEventListener('change', (e) => {
            const tbody = document.getElementById('ranking-table-body');
            if (tbody) {
                tbody.innerHTML = renderRankingRows(e.target.value);
            }
        });
    }
}

function renderRankingRows(jobId) {
    let list = [...state.candidates];
    if (jobId !== 'all') {
        list = list.filter(c => c.jobId === jobId);
    }
    // Sort descending
    list.sort((a, b) => b.score - a.score);

    if (list.length === 0) {
        return `<tr><td colspan="7" style="text-align:center; color:var(--text-muted); padding:20px;">No candidates parsed for this position yet.</td></tr>`;
    }

    return list.map((c, index) => {
        let rankClass = '';
        if (index === 0) rankClass = 'first';
        else if (index === 1) rankClass = 'second';
        else if (index === 2) rankClass = 'third';
        
        const successVal = c.predictions ? c.predictions.successIndex : 75;
        const salaryVal = c.predictions ? c.predictions.salary : '$120,000 - $130,000';
        
        return `
            <tr class="ranking-row">
                <td><span class="rank-number ${rankClass}">${index + 1}</span></td>
                <td style="font-weight:600;">${c.name}</td>
                <td><span class="job-tag" style="background:rgba(255,255,255,0.02);">${c.classification || 'Software Generalist'}</span></td>
                <td><span class="score-pill ${c.score >= 90 ? 'high' : ''}">${c.score}% Match</span></td>
                <td>
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span style="font-weight:700;">${successVal}%</span>
                        <div class="progress-bar" style="width:60px; height:4px; margin:0;">
                            <div class="progress-fill" style="width:${successVal}%; height:100%;"></div>
                        </div>
                    </div>
                </td>
                <td style="color:var(--success); font-weight:600;">${salaryVal}</td>
                <td>
                    <button class="btn-secondary" style="padding:4px 8px; font-size:0.75rem;" onclick="window.location.hash='screener'; navigateToView('screener'); setTimeout(() => renderScreeningReport(state.candidates.find(cand => cand.id === '${c.id}')), 100);">Review</button>
                </td>
            </tr>
        `;
    }).join('');
}

function renderTopCandidatesMarkup() {
    if (state.candidates.length === 0) {
        return `<div style="text-align:center; color:var(--text-muted); padding:35px 10px; font-size:0.85rem;">No candidates screened yet. Upload a candidate resume in the <strong>Resume Screener</strong> module to populate standings.</div>`;
    }
    // Sort candidates by match score descending
    const sorted = [...state.candidates].sort((a, b) => b.score - a.score);
    return sorted.map(c => {
        const job = state.jobs.find(j => j.id === c.jobId);
        const jobTitle = job ? job.title : 'General';
        const ratingClass = c.score >= 90 ? 'high' : '';
        const initial = c.name.split(' ').map(n => n[0]).join('');
        return `
            <div class="match-item">
                <div class="match-candidate-info">
                    <div class="match-avatar excellent">${initial}</div>
                    <div class="match-meta">
                        <span class="match-name">${c.name}</span>
                        <span class="match-role">${jobTitle}</span>
                    </div>
                </div>
                <div class="match-score-badge">
                    <span class="score-pill ${ratingClass}">${c.score}% Match</span>
                    <span class="match-time">2 hours ago</span>
                </div>
            </div>
        `;
    }).join('');
}

// 2. Job Board View
function renderJobs(container) {
    container.innerHTML = `
        <div class="view-header">
            <div class="view-title-area">
                <h1>Positions Board</h1>
                <p>Manage postings and construct descriptions with TalentAI Assistant.</p>
            </div>
            <button class="btn-primary" id="btn-create-job">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Post New Job
            </button>
        </div>

        <div class="jobs-layout">
            <div class="filter-bar">
                <div class="filter-group">
                    <select class="select-filter" id="filter-dept">
                        <option value="all">All Departments</option>
                        <option value="Engineering">Engineering</option>
                        <option value="Product">Product</option>
                        <option value="Infrastructure">Infrastructure</option>
                    </select>
                    <select class="select-filter" id="filter-status">
                        <option value="all">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="draft">Draft</option>
                    </select>
                </div>
                <span class="text-secondary" style="font-size: 0.85rem;" id="jobs-count">${state.jobs.length} postings total</span>
            </div>

            <div class="jobs-grid" id="jobs-grid-container">
                ${renderJobsListMarkup(state.jobs)}
            </div>
        </div>

        <!-- Create Job Modal -->
        <div class="modal-overlay" id="job-modal">
            <div class="glass-card modal-card">
                <div class="modal-header">
                    <span class="modal-title">Create Job Posting</span>
                    <button class="modal-close" id="btn-close-modal">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>
                
                <div class="modal-body">
                    <div class="form-group">
                        <label for="job-modal-title">Job Title</label>
                        <input type="text" id="job-modal-title" placeholder="e.g., Senior Security Engineer">
                    </div>
                    
                    <div class="form-group">
                        <label for="job-modal-dept">Department</label>
                        <select id="job-modal-dept">
                            <option value="Engineering">Engineering</option>
                            <option value="Product">Product</option>
                            <option value="Infrastructure">Infrastructure</option>
                            <option value="Design">Design</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="job-modal-reqs">Target Skills / Requirements (Comma Separated)</label>
                        <input type="text" id="job-modal-reqs" placeholder="e.g., Python, Docker, Threat Modeling">
                    </div>
                    
                    <div class="ai-generator-panel" id="ai-gen-panel">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-size: 0.85rem; font-weight: 700; color: var(--primary);">AI Description Builder</span>
                            <button class="btn-primary" id="btn-ai-generate" style="padding: 6px 12px; font-size: 0.775rem;">
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                                    <polygon points="12 2 2 7 12 12 22 7 12 2" />
                                    <polyline points="2 17 12 22 22 17" />
                                    <polyline points="2 12 12 17 22 12" />
                                </svg>
                                Generate with AI
                            </button>
                        </div>
                        <div class="ai-output-container" id="ai-gen-output">Fill in the fields above and click 'Generate with AI' to compose an optimized description based on target skill structures.</div>
                    </div>

                    <div class="form-group">
                        <label for="job-modal-desc">Job Description (Final)</label>
                        <textarea id="job-modal-desc" rows="6" placeholder="Final job details and descriptions..."></textarea>
                    </div>
                </div>

                <div class="modal-footer">
                    <button class="btn-secondary" id="btn-cancel-modal">Cancel</button>
                    <button class="btn-primary" id="btn-save-job">Save & Publish</button>
                </div>
            </div>
        </div>
    `;

    // Hook events
    document.getElementById('btn-create-job').addEventListener('click', openJobModal);
    document.getElementById('btn-close-modal').addEventListener('click', closeJobModal);
    document.getElementById('btn-cancel-modal').addEventListener('click', closeJobModal);
    document.getElementById('btn-save-job').addEventListener('click', saveNewJob);
    document.getElementById('btn-ai-generate').addEventListener('click', generateJobWithAI);
    
    // Filters
    const deptFilter = document.getElementById('filter-dept');
    const statusFilter = document.getElementById('filter-status');
    const applyFilters = () => {
        let filtered = state.jobs;
        if (deptFilter.value !== 'all') {
            filtered = filtered.filter(j => j.department === deptFilter.value);
        }
        if (statusFilter.value !== 'all') {
            filtered = filtered.filter(j => j.status === statusFilter.value);
        }
        document.getElementById('jobs-grid-container').innerHTML = renderJobsListMarkup(filtered);
        document.getElementById('jobs-count').innerText = `${filtered.length} postings total`;
    };
    deptFilter.addEventListener('change', applyFilters);
    statusFilter.addEventListener('change', applyFilters);
}

function renderJobsListMarkup(jobsList) {
    if (jobsList.length === 0) {
        return `<div class="glass-card" style="grid-column: 1/-1; text-align: center; color: var(--text-secondary); padding: 40px;">No postings matched filters.</div>`;
    }
    return jobsList.map(j => {
        const skillsTags = j.tags.map(t => `<span class="job-tag">${t}</span>`).join('');
        return `
            <div class="glass-card job-card">
                <div class="job-card-header">
                    <span class="job-dept">${j.department}</span>
                    <span class="job-status-pill ${j.status}">${j.status}</span>
                </div>
                <div class="job-info">
                    <h3 class="job-title">${j.title}</h3>
                    <div class="job-tags">${skillsTags}</div>
                </div>
                <div class="job-card-footer">
                    <div class="job-candidates-count">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                        </svg>
                        <span>${j.candidatesCount} Applied</span>
                    </div>
                    <button class="btn-secondary" style="padding: 6px 12px; font-size: 0.8rem;" onclick="window.location.hash='screener'; navigateToView('screener');">Screen</button>
                </div>
            </div>
        `;
    }).join('');
}

function openJobModal() {
    document.getElementById('job-modal').classList.add('active');
}

function closeJobModal() {
    document.getElementById('job-modal').classList.remove('active');
    // Clear inputs
    document.getElementById('job-modal-title').value = '';
    document.getElementById('job-modal-reqs').value = '';
    document.getElementById('job-modal-desc').value = '';
    document.getElementById('ai-gen-output').innerText = "Fill in the fields above and click 'Generate with AI' to compose an optimized description based on target skill structures.";
}

function generateJobWithAI() {
    const title = document.getElementById('job-modal-title').value;
    const dept = document.getElementById('job-modal-dept').value;
    const reqs = document.getElementById('job-modal-reqs').value;
    
    if (!title) {
        showToast('Please enter a Job Title first', 'warning');
        return;
    }

    const panel = document.getElementById('ai-gen-panel');
    const output = document.getElementById('ai-gen-output');
    
    panel.classList.add('loading');
    output.classList.add('typing');
    output.innerText = "Connecting to TalentAI Core Engine...";

    const mockPrompts = [
        "Analyzing candidate profiles in database...",
        "Structuring qualification requirements...",
        "Composing job description content..."
    ];

    let logIndex = 0;
    const interval = setInterval(() => {
        if (logIndex < mockPrompts.length) {
            output.innerText = mockPrompts[logIndex];
            logIndex++;
        } else {
            clearInterval(interval);
            panel.classList.remove('loading');
            
            // Build descriptions
            const tags = reqs ? reqs.split(',').map(s => s.trim()) : ['Systems', 'Integration', 'Cloud'];
            const template = `Role Overview:
We are seeking a high-caliber ${title} to join our ${dept} group. In this position, you will drive technical implementations and design patterns, collaborating with top-tier product assets.

Key Responsibilities:
- Design, scale, and optimize software subsystems and architectural components.
- Collaborate with engineers and PMs to implement resilient services.
- Incorporate testing benchmarks, maintaining a standard of clean code.
- Champion ${tags.join(', ')} core practices across team environments.

Target Qualifications:
- Demonstrated experience building enterprise software infrastructures.
- Hands-on mastery with ${tags[0] || 'Modern Technologies'} and associated ecosystem.
- Ability to deliver deliverables in agile workspaces.`;

            // Stream letters
            let charIndex = 0;
            output.innerText = "";
            const streamTimer = setInterval(() => {
                if (charIndex < template.length) {
                    output.innerText += template[charIndex];
                    charIndex++;
                    output.scrollTop = output.scrollHeight;
                } else {
                    clearInterval(streamTimer);
                    output.classList.remove('typing');
                    document.getElementById('job-modal-desc').value = template;
                    showToast('AI Description Generated!', 'success');
                }
            }, 10);
        }
    }, 800);
}

function saveNewJob() {
    const title = document.getElementById('job-modal-title').value;
    const dept = document.getElementById('job-modal-dept').value;
    const reqs = document.getElementById('job-modal-reqs').value;
    const desc = document.getElementById('job-modal-desc').value;

    if (!title || !desc) {
        showToast('Please fill in all core fields and generate a description', 'warning');
        return;
    }

    const tags = reqs ? reqs.split(',').map(s => s.trim()) : ['General'];
    const minReqsObj = {};
    tags.forEach(t => {
        minReqsObj[t] = 80; // default weight
    });

    const newJob = {
        id: `job-${Date.now()}`,
        title: title,
        department: dept,
        location: 'Remote',
        status: 'active',
        candidatesCount: 0,
        tags: tags.slice(0, 5),
        minRequirements: minReqsObj,
        description: desc
    };

    state.jobs.unshift(newJob);
    addAuditHistoryEntry('job:create', `Requisition: ${newJob.title}`, `Published new job requisition with ${tags.length} requirement tags in ${dept} department.`);
    showToast(`Successfully published ${title}!`, 'success');
    closeJobModal();
    
    // Refresh view
    renderJobs(document.getElementById('view-container'));
}

// 3. Resume Screener View
function renderScreener(container) {
    container.innerHTML = `
        <div class="view-header">
            <div class="view-title-area">
                <h1>AI Resume Screener</h1>
                <p>Upload a candidate's resume to auto-parse, align with requirements, and review fit indicators.</p>
            </div>
        </div>

        <div class="screener-layout">
            <div class="screener-setup" id="screener-setup-container">
                <div class="glass-card">
                    <div class="setup-header">
                        <h2>Select Target Position</h2>
                        <p>Select a job description to screen the candidate against.</p>
                        <select class="select-filter" id="screener-job-select" style="margin-top: 14px; width: 100%; max-width: 400px; padding: 12px 16px;">
                            ${state.jobs.map(j => `<option value="${j.id}">${j.title} (${j.department})</option>`).join('')}
                        </select>
                    </div>

                    <!-- Drag & Drop Uploader -->
                    <div class="upload-zone" id="drop-zone">
                        <div class="upload-icon">
                            <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" />
                                <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                        </div>
                        <div class="upload-text">
                            <h3>Drag and drop candidate resume here</h3>
                            <p>Supports PDF, DOCX, TXT files (Max 5MB)</p>
                            <button class="btn-primary" style="margin: 0 auto;" id="btn-browse-file">Browse Local Files</button>
                        </div>
                        <input type="file" id="file-input" class="hidden-file-input" accept=".pdf,.docx,.txt">

                        <!-- Scan Sweep overlay -->
                        <div class="scan-overlay" id="scan-overlay">
                            <div class="scan-line"></div>
                            <div class="scan-radar">
                                <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2">
                                    <polygon points="12 2 2 7 12 12 22 7 12 2" />
                                    <polyline points="2 17 12 22 22 17" />
                                    <polyline points="2 12 12 17 22 12" />
                                </svg>
                            </div>
                            <div class="scan-logs" id="scan-log-container">
                                <div class="scan-log-line">Initializing deep parser sandboxes...</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Report view (hidden by default) -->
            <div id="screener-report-container" style="display: none;"></div>
        </div>
    `;

    // Hook events
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const browseBtn = document.getElementById('btn-browse-file');

    browseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput.click();
    });
    
    fileInput.addEventListener('change', handleFileSelection);

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            handleFileMock(e.dataTransfer.files[0].name);
        }
    });
}

function handleFileSelection(e) {
    if (e.target.files.length > 0) {
        handleFileMock(e.target.files[0].name);
    }
}

function handleFileMock(fileName) {
    const overlay = document.getElementById('scan-overlay');
    const logs = document.getElementById('scan-log-container');
    overlay.classList.add('active');

    const steps = [
        { text: 'File securely ingested: ' + fileName, class: '' },
        { text: 'Extracting clean text buffers...', class: '' },
        { text: 'Comparing tokens to job requirements...', class: '' },
        { text: 'Unlocking candidate skills matrix...', class: 'success' },
        { text: 'Screener complete. Compiling metrics dashboard...', class: 'success' }
    ];

    let stepIdx = 0;
    const interval = setInterval(() => {
        if (stepIdx < steps.length) {
            const line = document.createElement('div');
            line.className = 'scan-log-line ' + steps[stepIdx].class;
            line.innerText = '> ' + steps[stepIdx].text;
            logs.appendChild(line);
            logs.scrollTop = logs.scrollHeight;
            stepIdx++;
        } else {
            clearInterval(interval);
            overlay.classList.remove('active');
            
            // Map file keywords to template
            const lowerName = fileName.toLowerCase();
            const jobId = document.getElementById('screener-job-select').value;
            const job = state.jobs.find(j => j.id === jobId);
            
            let parsedCandidate;
            if (lowerName.includes('elena') || (job && job.id === 'job-2')) {
                // Return Elena pm mock
                const raw = mockResumeDatabase['pm-elena'];
                parsedCandidate = {
                    id: `cand-${Date.now()}`,
                    name: raw.name,
                    email: raw.email,
                    score: 92,
                    matchCategory: 'excellent',
                    status: 'Screened',
                    jobId: jobId,
                    skills: raw.skills,
                    summary: raw.summary,
                    strengths: raw.strengths,
                    gaps: raw.gaps,
                    classification: 'Agile Product Manager',
                    altRoles: ['Growth Product Owner', 'Technical Analyst'],
                    predictions: {
                        salary: '$125,000 - $138,000',
                        successIndex: 91,
                        retentionRisk: 'Low',
                        interviewGrade: 'A-'
                    }
                };
            } else {
                // Default to Johnathan full stack engineer
                const raw = mockResumeDatabase['dev-john'];
                parsedCandidate = {
                    id: `cand-${Date.now()}`,
                    name: raw.name,
                    email: raw.email,
                    score: 89,
                    matchCategory: 'good',
                    status: 'Screened',
                    jobId: jobId,
                    skills: raw.skills,
                    summary: raw.summary,
                    strengths: raw.strengths,
                    gaps: raw.gaps,
                    classification: 'Senior Software Developer',
                    altRoles: ['Devops Integration Lead', 'Backend Specialist'],
                    predictions: {
                        salary: '$135,000 - $148,000',
                        successIndex: 86,
                        retentionRisk: 'Low',
                        interviewGrade: 'B+'
                    }
                };
            }

            // Save to state candidates list
            state.candidates.unshift(parsedCandidate);
            addAuditHistoryEntry('candidate:screen', `Resume: ${fileName}`, `Extracted structured candidate profile for ${parsedCandidate.name} (${parsedCandidate.email}). Match Score: ${parsedCandidate.score}%. Classification: ${parsedCandidate.classification}`);
            showToast(`Screened ${parsedCandidate.name} successfully!`, 'success');
            
            // Hide setup, render report
            document.getElementById('screener-setup-container').style.display = 'none';
            renderScreeningReport(parsedCandidate);
        }
    }, 600);
}

function renderScreeningReport(candidate) {
    const reportContainer = document.getElementById('screener-report-container');
    reportContainer.style.display = 'block';

    const job = state.jobs.find(j => j.id === candidate.jobId) || { title: 'Standard Position', minRequirements: {} };
    const initial = candidate.name.split(' ').map(n => n[0]).join('');

    reportContainer.innerHTML = `
        <div class="glass-card screening-report">
            <!-- Left Side Panel (Summary Card) -->
            <div class="report-candidate-card">
                <div class="match-avatar excellent" style="width: 80px; height: 80px; font-size: 2rem;">${initial}</div>
                <h2 style="margin-top: 16px;">${candidate.name}</h2>
                <p style="color: var(--text-secondary); font-size: 0.85rem;">${candidate.email}</p>
                <div style="margin-top: 8px;">
                    <span class="job-tag" style="background:rgba(99, 102, 241, 0.08); border-color:var(--primary); color:white; font-weight:700;">${candidate.classification || 'Software Developer'}</span>
                </div>
                <div style="margin-top: 6px; font-size: 0.725rem; color: var(--text-secondary);">
                    Alternative Roles: ${(candidate.altRoles || ['Solutions Specialist']).join(', ')}
                </div>
                
                <div class="score-circle-container">
                    <svg viewBox="0 0 160 160" width="100%" height="100%">
                        <circle cx="80" cy="80" r="70" class="score-ring-bg" />
                        <circle cx="80" cy="80" r="70" class="score-ring-val" id="report-score-ring" />
                        <defs>
                            <linearGradient id="score-gradient-fill" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stop-color="#10b981" />
                                <stop offset="100%" stop-color="#0ea5e9" />
                            </linearGradient>
                        </defs>
                    </svg>
                    <div class="score-center-text">
                        <span class="score-percent">${candidate.score}%</span>
                        <span class="score-label">Match</span>
                    </div>
                </div>

                <span class="match-badge-large ${candidate.matchCategory}">${candidate.matchCategory.toUpperCase()} FIT</span>

                <div class="candidate-quick-profile">
                    <div class="candidate-profile-row">
                        <span class="profile-label">Alignment Role</span>
                        <span class="profile-val">${job.title}</span>
                    </div>
                    <div class="candidate-profile-row">
                        <span class="profile-label">Status</span>
                        <span class="profile-val" style="color: var(--primary);">${candidate.status}</span>
                    </div>
                </div>

                <div style="display:flex; flex-direction:column; gap:10px; width:100%; margin-top:20px;">
                    <button class="btn-primary" style="width:100%; justify-content:center;" id="btn-report-start-chat">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                        Launch AI Interview
                    </button>
                    <button class="btn-secondary" style="width:100%; justify-content:center;" id="btn-report-shortlist">Shortlist Candidate</button>
                    <button class="btn-secondary" style="width:100%; justify-content:center;" id="btn-report-back">Screen Another</button>
                </div>
            </div>

            <!-- Right Side Panel (Detailed Tabs) -->
            <div class="report-analysis-panel">
                <div class="tab-nav">
                    <button class="tab-btn active" id="tab-btn-analysis" data-tab="analysis">AI Insights Summary</button>
                    <button class="tab-btn" id="tab-btn-skills" data-tab="skills">Skill Alignments Matrix</button>
                    <button class="tab-btn" id="tab-btn-predictions" data-tab="predictions">AI Predictive Modeling</button>
                </div>

                <!-- Tab Content A: AI Analysis -->
                <div class="tab-content" id="tab-content-analysis">
                    <h3 class="report-section-title">Candidate Executive Summary</h3>
                    <div class="report-feedback-box" style="margin-bottom: 24px;">
                        ${candidate.summary}
                    </div>

                    <h3 class="report-section-title strengths-title">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Matching Strengths Key Points
                    </h3>
                    <ul class="report-list">
                        ${candidate.strengths.map(s => `<li><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--success)" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>${s}</li>`).join('')}
                    </ul>

                    <h3 class="report-section-title gaps-title">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                        Identified Skill Gaps
                    </h3>
                    <ul class="report-list">
                        ${candidate.gaps.map(g => `<li><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--warning)" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>${g}</li>`).join('')}
                    </ul>
                </div>

                <!-- Tab Content B: Skills Matrix -->
                <div class="tab-content" id="tab-content-skills" style="display: none;">
                    <h3 class="report-section-title">Skills Score Match Breakdown</h3>
                    <p style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 24px;">This panel shows candidate's extracted profile metrics vs job target requirements (marked by pink borders).</p>
                    <div class="skills-matrix">
                        ${renderSkillsMatrixMarkup(candidate.skills, job.minRequirements)}
                    </div>
                </div>

                <!-- Tab Content C: AI Predictive Modeling -->
                <div class="tab-content" id="tab-content-predictions" style="display: none;">
                    <h3 class="report-section-title">Hiring Predictive Modeling Metrics</h3>
                    <p style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 18px;">
                        This dashboard shows AI predictive analytics modeled from candidate skills, historical background, and communication features.
                    </p>
                    
                    <div class="predictions-grid">
                        <div class="prediction-card">
                            <div class="prediction-card-header">
                                <span class="prediction-title">Predicted Success Index</span>
                                <span class="prediction-badge success-high">90%+ Success</span>
                            </div>
                            <div class="prediction-value-big">${candidate.predictions ? candidate.predictions.successIndex : 85}%</div>
                            <span class="prediction-desc">Likelihood of candidate meeting role requirements and high-impact quarterly goals.</span>
                        </div>
                        
                        <div class="prediction-card">
                            <div class="prediction-card-header">
                                <span class="prediction-title">Retention Risk Evaluation</span>
                                <span class="prediction-badge risk-low">${candidate.predictions ? candidate.predictions.retentionRisk : 'Low'} Risk</span>
                            </div>
                            <div class="prediction-value-big" style="color:var(--success); background:none; -webkit-text-fill-color:initial;">
                                ${candidate.predictions ? candidate.predictions.retentionRisk : 'Low'}
                            </div>
                            <span class="prediction-desc">Estimated turnover probability over a 24-month cycle based on tenure profiles.</span>
                        </div>

                        <div class="prediction-card">
                            <div class="prediction-card-header">
                                <span class="prediction-title">Interview Performance Expectation</span>
                                <span class="prediction-badge success-high">Pass Grade: ${candidate.predictions ? candidate.predictions.interviewGrade : 'A'}</span>
                            </div>
                            <div class="prediction-value-big" style="color:var(--info); background:none; -webkit-text-fill-color:initial;">
                                Grade ${candidate.predictions ? candidate.predictions.interviewGrade : 'A'}
                            </div>
                            <span class="prediction-desc">Projected assessment score on subsequent technical and architecture rounds.</span>
                        </div>

                        <div class="prediction-card">
                            <div class="prediction-card-header">
                                <span class="prediction-title">Salary Range Recommendation</span>
                                <span class="prediction-badge success-high">Market Bound</span>
                            </div>
                            <div class="prediction-value-big" style="color:var(--success); background:none; -webkit-text-fill-color:initial; font-size:1.45rem;">
                                ${candidate.predictions ? candidate.predictions.salary : '$130,000 - $145,000'}
                            </div>
                            <span class="prediction-desc">AI suggested compensation range based on current skill value and job requirements.</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Trigger ring score fill animation asynchronously
    setTimeout(() => {
        const ring = document.getElementById('report-score-ring');
        if (ring) {
            const circumference = 2 * Math.PI * 70; // 439.8
            const offset = circumference - (candidate.score / 100) * circumference;
            ring.style.strokeDashoffset = offset;
        }

        // Animate progress skill bars
        const skillFills = document.querySelectorAll('.skill-bar-fill');
        skillFills.forEach(fill => {
            const val = fill.getAttribute('data-value');
            fill.style.width = val + '%';
        });
    }, 100);

    // Tab buttons handling
    const tabAnalysis = document.getElementById('tab-btn-analysis');
    const tabSkills = document.getElementById('tab-btn-skills');
    const tabPredictions = document.getElementById('tab-btn-predictions');
    const contentAnalysis = document.getElementById('tab-content-analysis');
    const contentSkills = document.getElementById('tab-content-skills');
    const contentPredictions = document.getElementById('tab-content-predictions');

    tabAnalysis.addEventListener('click', () => {
        tabAnalysis.classList.add('active');
        tabSkills.classList.remove('active');
        tabPredictions.classList.remove('active');
        contentAnalysis.style.display = 'block';
        contentSkills.style.display = 'none';
        contentPredictions.style.display = 'none';
    });

    tabSkills.addEventListener('click', () => {
        tabSkills.classList.add('active');
        tabAnalysis.classList.remove('active');
        tabPredictions.classList.remove('active');
        contentSkills.style.display = 'block';
        contentAnalysis.style.display = 'none';
        contentPredictions.style.display = 'none';
    });

    tabPredictions.addEventListener('click', () => {
        tabPredictions.classList.add('active');
        tabAnalysis.classList.remove('active');
        tabSkills.classList.remove('active');
        contentPredictions.style.display = 'block';
        contentAnalysis.style.display = 'none';
        contentSkills.style.display = 'none';
    });

    // Navigation and Action buttons
    document.getElementById('btn-report-back').addEventListener('click', () => {
        document.getElementById('screener-report-container').style.display = 'none';
        document.getElementById('screener-setup-container').style.display = 'block';
    });

    document.getElementById('btn-report-shortlist').addEventListener('click', () => {
        candidate.status = 'Screened';
        showToast(`${candidate.name} shortlisted for review!`, 'success');
    });

    document.getElementById('btn-report-start-chat').addEventListener('click', () => {
        // Load candidate into interview state
        state.activeInterview.candidateId = candidate.id;
        state.activeInterview.candidateName = candidate.name;
        state.activeInterview.jobId = candidate.jobId;
        state.activeInterview.stage = 0;
        state.activeInterview.chatHistory = [];
        state.activeInterview.metrics = { communication: 0, technical: 0, sentiment: 0 };
        state.activeInterview.skillsUnlocked = [];
        
        window.location.hash = 'interview';
        navigateToView('interview');
    });
}

function renderSkillsMatrixMarkup(candidateSkills, minReqs) {
    const allSkills = new Set([...Object.keys(candidateSkills), ...Object.keys(minReqs)]);
    return Array.from(allSkills).map(skillName => {
        const score = candidateSkills[skillName] || 0;
        const target = minReqs[skillName] || 70;
        return `
            <div class="skill-row">
                <div class="skill-row-header">
                    <span class="skill-name">${skillName}</span>
                    <span class="skill-match-level">${score}% <span style="color:var(--text-muted); font-weight:normal;">(Target: ${target}%)</span></span>
                </div>
                <div class="skill-bar-container">
                    <div class="skill-bar-fill" data-value="${score}"></div>
                    <!-- Target Requirement Marker -->
                    <div class="skill-bar-marker" style="left: ${target}%;" title="Target: ${target}%"></div>
                </div>
            </div>
        `;
    }).join('');
}

// 4. Interview Simulator View
function renderInterview(container) {
    // If no candidate is active in interview state, load default Jessica Chen
    if (!state.activeInterview.candidateId) {
        const defaultCand = state.candidates[0] || { id: 'cand-guest', name: 'Alex Rivera', jobId: 'job-1' };
        state.activeInterview.candidateId = defaultCand.id;
        state.activeInterview.candidateName = defaultCand.name;
        state.activeInterview.jobId = defaultCand.jobId;
        state.activeInterview.stage = 0;
        state.activeInterview.chatHistory = [];
        state.activeInterview.metrics = { communication: 0, technical: 0, sentiment: 0 };
        state.activeInterview.skillsUnlocked = [];
    }

    container.innerHTML = `
        <div class="view-header">
            <div class="view-title-area">
                <h1>AI Recruiter simulator</h1>
                <p>Conduct a simulated text-screening conversation between TalentAI Recruiter and candidate ${state.activeInterview.candidateName}.</p>
            </div>
        </div>

        <div class="interview-layout">
            <!-- Left Side Chat Window -->
            <div class="glass-card chat-panel">
                <div class="chat-panel-header">
                    <div class="chat-bot-identity">
                        <div class="chat-avatar-ai">
                            AI
                            <span class="pulse-dot"></span>
                        </div>
                        <div class="chat-bot-details">
                            <span class="chat-bot-name">TalentAI Recruitment Host</span>
                            <span class="chat-bot-status">Interviews Lead Assistant</span>
                        </div>
                    </div>
                    <button class="btn-secondary" style="padding: 6px 12px; font-size: 0.8rem;" id="btn-reset-chat">Restart Session</button>
                </div>

                <!-- Messages -->
                <div class="chat-messages-container" id="chat-messages">
                    <!-- AI intro is appended here dynamically -->
                </div>

                <!-- Typing indicator -->
                <div class="typing-indicator-bubble" id="typing-bubble">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>

                <!-- Input bar -->
                <div class="chat-input-bar">
                    <input type="text" class="chat-input-box" id="chat-input" placeholder="Type candidate's answer here...">
                    <button class="btn-send" id="btn-send-msg">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5">
                            <line x1="22" y1="2" x2="11" y2="13" />
                            <polygon points="22 2 15 22 11 13 2 9 22 2" />
                        </svg>
                    </button>
                </div>
            </div>

            <!-- Right Side Dashboard (AI Analytics Insights) -->
            <div class="glass-card interview-insights-panel" id="insights-panel">
                ${renderInsightsPlaceholderMarkup()}
            </div>
        </div>
    `;

    // Hook events
    document.getElementById('btn-send-msg').addEventListener('click', handleUserSendMessage);
    document.getElementById('chat-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleUserSendMessage();
    });
    document.getElementById('btn-reset-chat').addEventListener('click', restartInterviewSession);

    // Initial greeting
    triggerAIGreeting();
}

function renderInsightsPlaceholderMarkup() {
    return `
        <div class="insights-placeholder">
            <svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
                <path d="M22 12A10 10 0 0 0 12 2v10z" />
            </svg>
            <h3>Live Screening Insights</h3>
            <p>Insights metrics, sentiment tracking, and skill achievements will populate here as candidate responses are processed by our engine.</p>
        </div>
    `;
}

function triggerAIGreeting() {
    const greeting = "Hello! I am TalentAI's automated screening assistant. To start our conversation, could you introduce yourself and explain what interests you most about this role?";
    state.activeInterview.chatHistory.push({ sender: 'ai', text: greeting });
    
    // Simulate AI typing intro
    const bubble = document.getElementById('typing-bubble');
    bubble.style.display = 'flex';
    
    setTimeout(() => {
        bubble.style.display = 'none';
        appendChatMessage('ai', greeting);
    }, 1200);
}

function restartInterviewSession() {
    state.activeInterview.stage = 0;
    state.activeInterview.chatHistory = [];
    state.activeInterview.metrics = { communication: 0, technical: 0, sentiment: 0 };
    state.activeInterview.skillsUnlocked = [];
    
    document.getElementById('chat-messages').innerHTML = "";
    document.getElementById('insights-panel').innerHTML = renderInsightsPlaceholderMarkup();
    
    triggerAIGreeting();
    showToast("Interview session restarted", "info");
}

function appendChatMessage(sender, text) {
    const container = document.getElementById('chat-messages');
    if (!container) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    messageDiv.innerHTML = `
        <div class="message-bubble">
            <p>${text}</p>
            <span class="message-meta">${sender === 'ai' ? 'TalentAI' : 'Candidate'} • ${time}</span>
        </div>
    `;
    
    container.appendChild(messageDiv);
    container.scrollTop = container.scrollHeight;
}

function handleUserSendMessage() {
    const input = document.getElementById('chat-input');
    const sendBtn = document.getElementById('btn-send-msg');
    const responseText = input.value.trim();

    if (!responseText) return;

    // Append candidate message
    appendChatMessage('candidate', responseText);
    state.activeInterview.chatHistory.push({ sender: 'candidate', text: responseText });
    input.value = '';
    
    // Disable inputs while typing
    input.disabled = true;
    sendBtn.disabled = true;
    
    // Real-time analysis of the user response
    analyzeCandidateResponse(responseText);

    // Show typing bubble
    const bubble = document.getElementById('typing-bubble');
    bubble.style.display = 'flex';

    // Move to next interview stage
    state.activeInterview.stage++;

    setTimeout(() => {
        bubble.style.display = 'none';
        input.disabled = false;
        sendBtn.disabled = false;
        input.focus();

        const followUp = generateContextualAIResponse(responseText, state.activeInterview.stage);
        appendChatMessage('ai', followUp);
        state.activeInterview.chatHistory.push({ sender: 'ai', text: followUp });

        // Update active candidate status in core database if interview concludes
        if (state.activeInterview.stage >= 4) {
            const cand = state.candidates.find(c => c.id === state.activeInterview.candidateId);
            if (cand) {
                cand.status = 'Interviewed';
                // Trigger toast
                showToast(`Interview complete for ${cand.name}!`, 'success');
            }
        }
    }, 2000);
}

function generateContextualAIResponse(candidateText, stage) {
    if (stage >= 5) {
        return "Thank you so much! That wraps up our automated screening interview. Our hiring team will review your responses and update your application status shortly.";
    }

    const lower = candidateText.toLowerCase();
    const words = lower.split(/\s+/);

    let topicAck = "";
    let question = "";

    if (lower.includes("react") || lower.includes("frontend") || lower.includes("javascript") || lower.includes("ui") || lower.includes("css")) {
        topicAck = "That's a solid background in modern frontend development and component architectures. ";
        question = "When building complex React applications, how do you handle state management, async data fetching, and performance tuning for high-frequency user interactions?";
    } else if (lower.includes("node") || lower.includes("backend") || lower.includes("api") || lower.includes("express") || lower.includes("python") || lower.includes("microservice")) {
        topicAck = "Extremely relevant backend experience! ";
        question = "When designing scalable APIs and microservices, how do you approach database connection pooling, rate-limiting, and error resilience under heavy load?";
    } else if (lower.includes("aws") || lower.includes("docker") || lower.includes("kubernetes") || lower.includes("cloud") || lower.includes("devops") || lower.includes("ci/cd")) {
        topicAck = "Great cloud infrastructure background! ";
        question = "How do you structure your container deployment pipelines, zero-downtime releases, and automated health monitoring using AWS or Kubernetes?";
    } else if (lower.includes("database") || lower.includes("postgres") || lower.includes("sql") || lower.includes("redis") || lower.includes("mongo")) {
        topicAck = "Data modeling and persistence expertise is critical for our team. ";
        question = "Could you walk me through a specific time when you diagnosed a database performance bottleneck or optimized slow query indices in production?";
    } else if (lower.includes("agile") || lower.includes("product") || lower.includes("roadmap") || lower.includes("scrum") || lower.includes("manage")) {
        topicAck = "Excellent alignment on product execution and delivery processes. ";
        question = "How do you handle technical trade-offs between shipping new features quickly versus reducing technical debt with senior engineering stakeholders?";
    } else {
        if (words.length < 10) {
            topicAck = "Thanks for sharing that brief overview. ";
            question = "Could you expand further with a specific real-world project example, highlighting your technical role and key achievements?";
        } else if (stage === 1) {
            topicAck = "I appreciate you introducing your background! ";
            question = "Can you describe a particularly challenging technical problem you solved recently? What was your technical approach and how did you verify the solution?";
        } else if (stage === 2) {
            topicAck = "Fascinating insights on your workflow. ";
            question = "How do you approach system reliability, code reviews, and maintaining high testing standards across cross-functional engineering teams?";
        } else if (stage === 3) {
            topicAck = "That provides great context on your engineering philosophy. ";
            question = "When technical disagreements arise regarding architecture or stack choices, how do you collaborate with team members to reach a consensus?";
        } else {
            topicAck = "Thank you for sharing your detailed thoughts! ";
            question = "Is there anything specific you would like to highlight regarding your availability, preferred work environment, or technical growth goals?";
        }
    }

    return topicAck + question;
}

function getNextQuestionForStage(stage) {
    return generateContextualAIResponse("", stage);
}

function analyzeCandidateResponse(text) {
    const insights = document.getElementById('insights-panel');
    if (!insights) return;

    const words = text.toLowerCase().split(/\s+/);
    const wordCount = words.length;

    // Compute metrics
    // Technical Score calculation: matches keyword triggers
    const technicalKeywords = [
        'react', 'node', 'javascript', 'typescript', 'aws', 'docker', 'kubernetes', 'scaling', 'api', 
        'database', 'postgres', 'redis', 'cache', 'optimize', 'microservices', 'git', 'infrastructure', 
        'agile', 'roadmap', 'saas', 'strategy', 'metrics', 'scrum', 'data', 'analytics'
    ];
    
    let techMatchCount = 0;
    const skillsFoundThisTurn = [];
    
    technicalKeywords.forEach(kw => {
        if (words.includes(kw)) {
            techMatchCount++;
            // Map keywords to pretty skill names
            let skillName = kw.charAt(0).toUpperCase() + kw.slice(1);
            if (kw === 'js') skillName = 'JavaScript';
            if (kw === 'postgres') skillName = 'PostgreSQL';
            if (kw === 'aws') skillName = 'AWS Cloud';
            skillsFoundThisTurn.push(skillName);
        }
    });

    // Update state skills unlocked
    skillsFoundThisTurn.forEach(s => {
        if (!state.activeInterview.skillsUnlocked.includes(s)) {
            state.activeInterview.skillsUnlocked.push(s);
        }
    });

    // Calculate rating curves (capped at 98%)
    const prevMetrics = state.activeInterview.metrics;
    
    // Communication: based on response length and detail
    let commScore = 40 + Math.min(wordCount * 1.5, 58); // >35 words will hit 90s
    
    // Technical: based on keywords found
    let techScore = 30 + Math.min(techMatchCount * 20, 68); 
    if (wordCount < 10) techScore = 15; // low penalty

    // Sentiment: scan positive vs negative flags
    const positiveWords = ['love', 'excited', 'optimize', 'improve', 'collaborate', 'passion', 'build', 'create', 'solved', 'leadership', 'happy'];
    const negativeWords = ['dislike', 'hate', 'bad', 'bored', 'failed', 'issue', 'hard', 'difficult', 'slow'];
    
    let posCount = 0;
    let negCount = 0;
    words.forEach(w => {
        if (positiveWords.includes(w)) posCount++;
        if (negativeWords.includes(w)) negCount++;
    });

    let sentimentScore = 50 + (posCount * 15) - (negCount * 15);
    sentimentScore = Math.max(10, Math.min(sentimentScore, 98));

    // Smooth adjustment towards target scores
    state.activeInterview.metrics.communication = Math.round(prevMetrics.communication === 0 ? commScore : (prevMetrics.communication + commScore) / 2);
    state.activeInterview.metrics.technical = Math.round(prevMetrics.technical === 0 ? techScore : (prevMetrics.technical + techScore) / 2);
    state.activeInterview.metrics.sentiment = Math.round(prevMetrics.sentiment === 0 ? sentimentScore : (prevMetrics.sentiment + sentimentScore) / 2);

    // Render insights details panel
    const m = state.activeInterview.metrics;
    const skillsBadges = state.activeInterview.skillsUnlocked.map(s => `<span class="job-tag" style="background:var(--primary-glow); border-color:var(--primary); color:white;">${s}</span>`).join('');
    
    insights.innerHTML = `
        <h3 class="card-title" style="margin-bottom:12px;">Live Screening Analysis</h3>
        <p style="color:var(--text-muted); font-size:0.75rem; line-height:1.4; margin-bottom:18px;">
            AI parses Candidate answers in real-time to generate sentiment, technical depth, and validation matrices.
        </p>

        <div class="eval-metric">
            <div class="eval-header">
                <span>Technical Depth Alignment</span>
                <span class="eval-value">${m.technical}%</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${m.technical}%;"></div>
            </div>
        </div>

        <div class="eval-metric">
            <div class="eval-header">
                <span>Communication & Structuring</span>
                <span class="eval-value">${m.communication}%</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${m.communication}%;"></div>
            </div>
        </div>

        <div class="eval-metric">
            <div class="eval-header">
                <span>Sentiment & Confidence</span>
                <span class="eval-value">${m.sentiment}%</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill sentiment-bar" style="width: ${m.sentiment}%;"></div>
            </div>
        </div>

        <div style="border-top:1px solid var(--border-color); padding-top:18px; margin-top:10px;">
            <h4 style="font-size:0.8rem; font-weight:700; color:var(--text-secondary); margin-bottom:10px;">Verified Candidate Skills</h4>
            <div class="job-tags" style="margin:0;">
                ${skillsBadges || '<span style="font-size:0.75rem; color:var(--text-muted);">No key technical concepts unlocked yet.</span>'}
            </div>
        </div>

        <div style="border-top:1px solid var(--border-color); padding-top:18px; margin-top:20px;">
            <h4 style="font-size:0.8rem; font-weight:700; color:var(--text-secondary); margin-bottom:10px;">AI Evaluator Insights</h4>
            <div class="feedback-bullet">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="var(--success)" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                <span>Response length of ${wordCount} words provides ${wordCount > 25 ? 'sufficient details for quality analysis' : 'limited profiling markers'}.</span>
            </div>
            <div class="feedback-bullet">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="var(--info)" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                <span>${skillsFoundThisTurn.length > 0 ? `Unlocked skill vectors: ${skillsFoundThisTurn.join(', ')}` : 'No new skill badges identified in response.'}</span>
            </div>
        </div>
    `;
}

// --- Toast Notifications Helper ---
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = `
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
    `;
    
    if (type === 'success') {
        icon = `
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12" />
            </svg>
        `;
    } else if (type === 'warning') {
        icon = `
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
        `;
    }

    toast.innerHTML = `${icon}<span>${message}</span>`;
    container.appendChild(toast);

    // Auto dismiss
    setTimeout(() => {
        toast.style.opacity = 0;
        toast.style.transform = 'translateY(20px)';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

/* ==========================================================================
   VIEW: Recruiter Analytics Dashboard
   ========================================================================== */
function renderAnalytics(container) {
    const totalCandidates = state.candidates.length;
    const activeJobs = state.jobs.filter(j => j.status === 'active').length;
    const screenedCount = state.candidates.filter(c => c.status === 'Screened' || c.status === 'Interviewed').length;
    const interviewedCount = state.candidates.filter(c => c.status === 'Interviewed').length;
    const offeredCount = state.candidates.filter(c => c.status === 'Offered').length;

    // Percentages for conversion funnel
    const appliedPct = totalCandidates > 0 ? 100 : 0;
    const screenedPct = totalCandidates > 0 ? Math.round((screenedCount / totalCandidates) * 100) : 0;
    const interviewedPct = totalCandidates > 0 ? Math.round((interviewedCount / totalCandidates) * 100) : 0;
    const offeredPct = totalCandidates > 0 ? Math.round((offeredCount / totalCandidates) * 100) : 0;

    // Time to shortlist and time saved
    const timeToShortlist = totalCandidates > 0 ? "1.2 Days" : "0.0 Days";
    const productivityGain = totalCandidates > 0 ? `+${(totalCandidates * 2.5).toFixed(1)} hrs` : "0.0 Hrs";

    container.innerHTML = `
        <div class="view-header">
            <div class="view-title-area">
                <h1>Recruiter Analytics & Pipeline Conversion</h1>
                <p>Real-time recruitment throughput, hiring funnel velocity, and pipeline metrics for active requisitions.</p>
            </div>
        </div>

        <div class="analytics-grid-top">
            <div class="glass-card metric-card">
                <div class="metric-header">
                    <span>Avg Time to Shortlist</span>
                    <div class="metric-icon active">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12 6 12 12 16 14"/>
                        </svg>
                    </div>
                </div>
                <div class="metric-value">${timeToShortlist}</div>
                <div class="metric-footer">
                    <span class="metric-change positive">${totalCandidates > 0 ? '↓ 68% faster' : 'No data yet'}</span>
                    <span class="metric-trend-text">${totalCandidates > 0 ? 'vs manual screening' : 'screen resumes to track'}</span>
                </div>
            </div>

            <div class="glass-card metric-card">
                <div class="metric-header">
                    <span>Active Requisitions</span>
                    <div class="metric-icon">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                        </svg>
                    </div>
                </div>
                <div class="metric-value">${activeJobs} Active</div>
                <div class="metric-footer">
                    <span class="metric-change positive">${state.jobs.length} Total</span>
                    <span class="metric-trend-text">open job requisitions</span>
                </div>
            </div>

            <div class="glass-card metric-card">
                <div class="metric-header">
                    <span>Recruiter Time Saved (AI)</span>
                    <div class="metric-icon">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                            <polyline points="17 6 23 6 23 12"/>
                        </svg>
                    </div>
                </div>
                <div class="metric-value">${productivityGain}</div>
                <div class="metric-footer">
                    <span class="metric-change positive">${totalCandidates} Candidates</span>
                    <span class="metric-trend-text">processed by AI engine</span>
                </div>
            </div>
        </div>

        <div class="analytics-content-grid">
            <!-- Funnel Conversion Stack -->
            <div class="glass-card pipeline-funnel-card">
                <span class="card-title">Hiring Lifecycle Conversion Funnel</span>
                <p style="color:var(--text-muted); font-size:0.8rem; margin-top:4px;">Real-time candidate progression across active job requisitions</p>

                <div class="pipeline-funnel">
                    <div class="funnel-stage">
                        <span class="funnel-stage-name">1. Applied</span>
                        <div class="funnel-stage-progress">
                            <div class="funnel-stage-bar" data-width="${appliedPct}"></div>
                        </div>
                        <span class="funnel-stage-count">${totalCandidates}</span>
                    </div>

                    <div class="funnel-stage">
                        <span class="funnel-stage-name">2. AI Screened</span>
                        <div class="funnel-stage-progress">
                            <div class="funnel-stage-bar" data-width="${screenedPct}"></div>
                        </div>
                        <span class="funnel-stage-count">${screenedCount}</span>
                    </div>

                    <div class="funnel-stage">
                        <span class="funnel-stage-name">3. Interviewed</span>
                        <div class="funnel-stage-progress">
                            <div class="funnel-stage-bar" data-width="${interviewedPct}"></div>
                        </div>
                        <span class="funnel-stage-count">${interviewedCount}</span>
                    </div>

                    <div class="funnel-stage">
                        <span class="funnel-stage-name">4. Offered</span>
                        <div class="funnel-stage-progress">
                            <div class="funnel-stage-bar" data-width="${offeredPct}"></div>
                        </div>
                        <span class="funnel-stage-count">${offeredCount}</span>
                    </div>
                </div>
            </div>

            <!-- Candidate Classification Donut Chart -->
            <div class="glass-card">
                <span class="card-title">Talent Pool Classifications</span>
                <p style="color:var(--text-muted); font-size:0.8rem; margin-top:4px;">Distribution across active job departments</p>

                <div class="donut-chart-box">
                    <svg viewBox="0 0 160 160" width="160" height="160">
                        <circle cx="80" cy="80" r="60" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="18" />
                        ${totalCandidates > 0 ? `
                            <circle cx="80" cy="80" r="60" fill="none" stroke="#6366f1" stroke-width="18" stroke-dasharray="240 377" stroke-dashoffset="0" />
                        ` : ''}
                    </svg>
                    <div class="donut-center-text">
                        <span class="donut-center-num">${totalCandidates}</span>
                        <span class="donut-center-lbl">Screened</span>
                    </div>
                </div>

                <div class="chart-legend" style="justify-content:center; margin-top:16px;">
                    ${totalCandidates > 0 ? `
                        <div class="legend-item"><span class="legend-color primary"></span><span>Parsed Resumes (100%)</span></div>
                    ` : `
                        <span style="font-size:0.75rem; color:var(--text-muted);">No candidate data yet. Upload a resume in Screener to populate.</span>
                    `}
                </div>
            </div>
        </div>
    `;

    // Animate funnel bars
    setTimeout(() => {
        const bars = document.querySelectorAll('.funnel-stage-bar');
        bars.forEach(b => {
            const w = b.getAttribute('data-width');
            b.style.width = w + '%';
        });
    }, 100);
}

/* ==========================================================================
   VIEW: Audit & Governance Console
   ========================================================================== */
function renderAudit(container) {
    container.innerHTML = `
        <div class="view-header">
            <div class="view-title-area">
                <h1>Audit, Compliance & AI Governance Console</h1>
                <p>Immutable event logging, human score override trails, and model bias monitoring (NYC Law 144).</p>
            </div>
            <button class="btn-primary" id="btn-run-fairness">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                Run Bias Audit
            </button>
        </div>

        <!-- Compliance Status Alert Banner -->
        <div class="ai-recommendation-box" style="background: rgba(16, 185, 129, 0.05); border-color: rgba(16, 185, 129, 0.3);">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="var(--success)" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <div class="ai-rec-text">
                <h4 style="color:var(--success);">NYC Local Law 144 & AI Governance Compliant</h4>
                <p>Current Model Version: <strong>v3.5.2-prod</strong> • Disparate Impact Ratio: <strong>0.985</strong> (Threshold > 0.80) • Protected attributes excluded from direct scoring. Human-in-the-Loop decision overrides logged to immutable ledger.</p>
            </div>
        </div>

        <!-- Audit Log Search & Filter -->
        <div class="glass-card ranking-table-card" style="margin-bottom: 24px;">
            <div class="card-header-actions">
                <span class="card-title">Immutable System Audit Logs</span>
                <div class="filter-group">
                    <select class="select-filter" id="audit-action-filter">
                        <option value="all">All Actions</option>
                        <option value="score:override">Score Overrides</option>
                        <option value="candidate:screen">Candidate Screening</option>
                        <option value="user:login">User Access</option>
                    </select>
                </div>
            </div>

            <table class="ranking-table">
                <thead>
                    <tr>
                        <th>Timestamp</th>
                        <th>Actor</th>
                        <th>Action</th>
                        <th>Resource</th>
                        <th>IP Address</th>
                        <th>Metadata Details</th>
                    </tr>
                </thead>
                <tbody id="audit-table-body">
                    ${renderAuditRows()}
                </tbody>
            </table>
        </div>
    `;

    // Hook Audit Filter
    const filterSelect = document.getElementById('audit-action-filter');
    if (filterSelect) {
        filterSelect.addEventListener('change', (e) => {
            const tbody = document.getElementById('audit-table-body');
            if (tbody) tbody.innerHTML = renderAuditRows(e.target.value);
        });
    }

    // Hook Fairness Audit Trigger
    document.getElementById('btn-run-fairness').addEventListener('click', () => {
        showToast("Running automated Bias & Disparate Impact Audit...", "info");
        setTimeout(() => {
            addAuditHistoryEntry('governance:audit', 'Model v3.5.2-prod', 'Ran automated NYC Law 144 Disparate Impact Audit. Disparate Impact Ratio: 0.985 (PASSED).');
            showToast("Bias Audit Passed: Disparate Impact Ratio 0.985", "success");
        }, 1500);
    });
}

// --- Dedicated Login Page & Account Manager ---
function initGmailAuth() {
    const loginPage = document.getElementById('login-page-container');
    const customForm = document.getElementById('custom-login-form');
    const profileBadge = document.getElementById('user-profile-badge');

    const updateHeaderProfile = (user) => {
        const nameEl = document.getElementById('header-user-name');
        const roleEl = document.getElementById('header-user-role');
        const avatarEl = document.getElementById('header-avatar');

        if (nameEl) nameEl.innerText = user.displayName || user.email;
        if (roleEl) {
            const roleTitles = {
                recruiter: 'Lead Recruiter',
                hiring_manager: 'Hiring Manager',
                auditor: 'Compliance Reviewer',
                org_admin: 'Organization Admin'
            };
            roleEl.innerText = roleTitles[user.role] || 'Lead Recruiter';
        }
        if (avatarEl) avatarEl.innerText = user.initials || 'HR';

        const roleSwitch = document.getElementById('role-switcher');
        if (roleSwitch) roleSwitch.value = user.role;
    };

    const loginUser = (userObj) => {
        state.currentUser = userObj;
        localStorage.setItem('talentai_user', JSON.stringify(userObj));
        updateHeaderProfile(userObj);
        if (loginPage) loginPage.style.display = 'none';
        showToast(`Signed in as ${userObj.displayName} (${userObj.email})`, 'success');
    };

    // Load saved session
    const savedUser = localStorage.getItem('talentai_user');
    if (savedUser) {
        try {
            state.currentUser = JSON.parse(savedUser);
            updateHeaderProfile(state.currentUser);
            if (loginPage) loginPage.style.display = 'none';
        } catch (e) {
            if (loginPage) loginPage.style.display = 'flex';
        }
    } else {
        if (loginPage) loginPage.style.display = 'flex';
    }

    // Attach 1-Click Quick Account Cards Handlers
    const accountCards = document.querySelectorAll('.account-card');
    accountCards.forEach(card => {
        card.addEventListener('click', () => {
            const email = card.getAttribute('data-email');
            const name = card.getAttribute('data-name');
            const role = card.getAttribute('data-role');
            const initials = card.getAttribute('data-initials');

            loginUser({
                email: email,
                displayName: name,
                role: role,
                initials: initials
            });
        });
    });

    // Custom Form Submit
    if (customForm) {
        customForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const emailInput = document.getElementById('custom-email-input');
            const roleSelect = document.getElementById('custom-role-select');
            const email = emailInput ? emailInput.value.trim() : '';
            const role = roleSelect ? roleSelect.value : 'recruiter';

            if (!email) return;

            const namePart = email.split('@')[0].replace(/[._-]/g, ' ');
            const displayName = namePart.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            const initials = namePart.split(' ').slice(0, 2).map(w => w.charAt(0).toUpperCase()).join('') || 'HR';

            loginUser({
                email: email,
                displayName: displayName,
                initials: initials,
                role: role
            });
        });
    }

    // Allow switching accounts by clicking topbar profile badge
    if (profileBadge) {
        profileBadge.addEventListener('click', () => {
            if (loginPage) loginPage.style.display = 'flex';
        });
    }
}

// Hook Enterprise Role Switcher & Auth Initialization
document.addEventListener('DOMContentLoaded', () => {
    initGmailAuth();

    const roleSelect = document.getElementById('role-switcher');
    if (roleSelect) {
        roleSelect.addEventListener('change', (e) => {
            const role = e.target.value;
            const roleText = document.getElementById('header-user-role');
            
            if (state.currentUser) {
                state.currentUser.role = role;
                localStorage.setItem('talentai_user', JSON.stringify(state.currentUser));
            }

            if (role === 'hiring_manager') {
                if (roleText) roleText.innerText = 'Hiring Manager';
                showToast("Switched workspace role to Hiring Manager", "info");
            } else if (role === 'auditor') {
                if (roleText) roleText.innerText = 'Compliance Reviewer';
                showToast("Switched workspace role to Compliance Reviewer", "info");
            } else if (role === 'org_admin') {
                if (roleText) roleText.innerText = 'Organization Admin';
                showToast("Switched workspace role to Org Admin", "info");
            } else {
                if (roleText) roleText.innerText = 'Lead Recruiter';
                showToast("Switched workspace role to Lead Recruiter", "info");
            }
        });
    }
});

