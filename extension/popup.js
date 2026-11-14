/**
 * GitGry Chrome Extension - Main Popup Controller
 */

const API_BASE = 'https://gitgry.onrender.com/api';
const CRON_SECRET = 'gitgry_cron_secret_2026';
const WEB_APP_URL = 'https://gitgryclient.vercel.app';

// Local State
let state = {
  token: null,
  user: null,
  repositories: [],
  selectedRepoIds: [],
  minTasks: 5,
  maxTasks: 12,
  executionTime: '09:00',
  daysOfWeek: [1, 2, 3, 4, 5, 6, 0], // All days default
  activeScheduleId: null,
};

// DOM Elements
const elements = {
  headerStatus: document.getElementById('header-status'),
  headerStatusText: document.getElementById('header-status-text'),
  stepper: document.getElementById('stepper'),
  alertBanner: document.getElementById('alert-banner'),

  // Panels
  stepAuth: document.getElementById('step-auth'),
  stepRepos: document.getElementById('step-repos'),
  stepCommits: document.getElementById('step-commits'),
  stepTiming: document.getElementById('step-timing'),
  stepDashboard: document.getElementById('step-dashboard'),

  // Step 1
  btnOAuth: document.getElementById('btn-oauth'),
  btnTokenAuth: document.getElementById('btn-token-auth'),
  patInput: document.getElementById('pat-input'),

  // Step 2
  repoSearch: document.getElementById('repo-search'),
  repoListContainer: document.getElementById('repo-list-container'),
  btnReposBack: document.getElementById('btn-repos-back'),
  btnReposNext: document.getElementById('btn-repos-next'),
  selectedRepoCount: document.getElementById('selected-repo-count'),

  // Step 3
  minSlider: document.getElementById('min-slider'),
  maxSlider: document.getElementById('max-slider'),
  minCommitsVal: document.getElementById('min-commits-val'),
  maxCommitsVal: document.getElementById('max-commits-val'),
  btnCommitsBack: document.getElementById('btn-commits-back'),
  btnCommitsNext: document.getElementById('btn-commits-next'),

  // Step 4
  timePicker: document.getElementById('time-picker'),
  dayPills: document.querySelectorAll('.day-pill'),
  btnTimingBack: document.getElementById('btn-timing-back'),
  btnSaveAll: document.getElementById('btn-save-all'),

  // Step 5 (Dashboard)
  dashboardConnectedAs: document.getElementById('dashboard-connected-as'),
  summaryTime: document.getElementById('summary-time'),
  summaryCommits: document.getElementById('summary-commits'),
  summaryRepos: document.getElementById('summary-repos'),
  btnRunNow: document.getElementById('btn-run-now'),
  btnReconfigure: document.getElementById('btn-reconfigure'),
  btnOpenWeb: document.getElementById('btn-open-web'),
  btnLogout: document.getElementById('btn-logout'),
};

/**
 * Storage helpers
 */
const storage = {
  get: (keys) => new Promise((resolve) => chrome.storage.local.get(keys, resolve)),
  set: (items) => new Promise((resolve) => chrome.storage.local.set(items, resolve)),
  remove: (keys) => new Promise((resolve) => chrome.storage.local.remove(keys, resolve)),
};

/**
 * Displays user alerts
 */
function showAlert(message, type = 'error') {
  elements.alertBanner.className = `alert-banner ${type}`;
  elements.alertBanner.textContent = message;
  elements.alertBanner.classList.remove('hidden');
  setTimeout(() => {
    elements.alertBanner.classList.add('hidden');
  }, 4500);
}

/**
 * Switch active wizard step
 */
function setStep(stepIndex) {
  const panels = [
    elements.stepAuth,
    elements.stepRepos,
    elements.stepCommits,
    elements.stepTiming,
    elements.stepDashboard,
  ];

  panels.forEach((p, idx) => {
    if (idx + 1 === stepIndex) {
      p.classList.add('active');
    } else {
      p.classList.remove('active');
    }
  });

  // Update Stepper circles
  if (stepIndex <= 4) {
    elements.stepper.style.display = 'flex';
    document.querySelectorAll('.step-item').forEach((item) => {
      const stepNum = parseInt(item.getAttribute('data-step'), 10);
      item.classList.remove('active', 'completed');
      if (stepNum === stepIndex) item.classList.add('active');
      else if (stepNum < stepIndex) item.classList.add('completed');
    });
  } else {
    // Hide wizard stepper on active dashboard view
    elements.stepper.style.display = 'none';
  }
}

/**
 * API Fetch wrapper with Auth header
 */
async function fetchApi(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (state.token) {
    headers['Authorization'] = `Bearer ${state.token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || data.error || `HTTP error ${res.status}`);
  }
  return data;
}

/**
 * Initialize application state on popup open
 */
async function init() {
  const saved = await storage.get(['gitgry_token', 'gitgry_user']);
  if (saved.gitgry_token) {
    state.token = saved.gitgry_token;
    state.user = saved.gitgry_user;

    try {
      // Validate current session with cloud
      const authRes = await fetchApi('/auth/me');
      if (authRes.success && authRes.data?.user) {
        state.user = authRes.data.user;
        await storage.set({ gitgry_user: state.user });

        // Check if an active schedule already exists
        const schedRes = await fetchApi('/schedules');
        const activeSched = schedRes.data?.find((s) => s.enabled);

        if (activeSched) {
          state.activeScheduleId = activeSched._id;
          state.executionTime = activeSched.executionTime || '09:00';
          state.selectedRepoIds = activeSched.repositoryIds || [];

          // Fetch automation config for commit targets
          try {
            const cfgRes = await fetchApi('/automation/config');
            if (cfgRes.data) {
              state.minTasks = cfgRes.data.minimumTasks || 5;
              state.maxTasks = cfgRes.data.maximumTasks || 12;
            }
          } catch (_) {}

          renderDashboard();
          setStep(5);
          return;
        }

        // If logged in but no schedule, advance to Step 2
        await loadRepositories();
        setStep(2);
        return;
      }
    } catch (err) {
      // Token expired or invalid
      await storage.remove(['gitgry_token', 'gitgry_user']);
      state.token = null;
      state.user = null;
    }
  }

  // Not authenticated
  setStep(1);
}

/**
 * Render Dashboard view (Step 5)
 */
function renderDashboard() {
  elements.headerStatus.innerHTML = '<span class="status-dot active"></span><span>Active</span>';
  elements.dashboardConnectedAs.textContent = `@${state.user?.username || 'user'}`;
  elements.summaryTime.textContent = `${state.executionTime} (IST)`;
  elements.summaryCommits.textContent = `${state.minTasks} to ${state.maxTasks} commits / day`;
  elements.summaryRepos.textContent = `${state.selectedRepoIds.length} repository selected`;
}

/**
 * Step 1: Authentication Handlers
 */
elements.btnOAuth.addEventListener('click', () => {
  const authUrl = `${API_BASE}/auth/github?from=extension`;
  chrome.tabs.create({ url: authUrl }, (tab) => {
    // Listen for tab URL updates to capture token hash
    const listener = (tabId, changeInfo) => {
      if (tabId === tab.id && changeInfo.url && changeInfo.url.includes('/api/auth/extension-success#token=')) {
        chrome.tabs.onUpdated.removeListener(listener);
        const hash = changeInfo.url.split('#token=')[1];
        if (hash) {
          handleAuthSuccess(hash);
          setTimeout(() => {
            chrome.tabs.remove(tabId);
          }, 1200);
        }
      }
    };
    chrome.tabs.onUpdated.addListener(listener);
  });
});

elements.btnTokenAuth.addEventListener('click', async () => {
  const token = elements.patInput.value.trim();
  if (!token) {
    showAlert('Please enter a GitHub Personal Access Token.');
    return;
  }

  elements.btnTokenAuth.disabled = true;
  elements.btnTokenAuth.textContent = 'Verifying with GitHub...';

  try {
    const res = await fetchApi('/auth/token', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });

    if (res.success && res.token) {
      await handleAuthSuccess(res.token, res.user);
    } else {
      showAlert(res.message || 'Authentication failed');
    }
  } catch (err) {
    showAlert(err.message || 'Token verification failed');
  } finally {
    elements.btnTokenAuth.disabled = false;
    elements.btnTokenAuth.textContent = 'Connect with Token';
  }
});

async function handleAuthSuccess(token, user = null) {
  state.token = token;
  if (!user) {
    const authRes = await fetchApi('/auth/me');
    user = authRes.data?.user;
  }
  state.user = user;
  await storage.set({ gitgry_token: token, gitgry_user: user });

  showAlert('Connected to GitHub successfully!', 'success');
  await loadRepositories();
  setStep(2);
}

/**
 * Step 2: Repositories Handlers
 */
async function loadRepositories() {
  elements.repoListContainer.innerHTML = '<div class="loading-state">Loading repositories...</div>';

  try {
    const res = await fetchApi('/repositories');
    state.repositories = res.data || [];

    // Pre-select enabled repos or first repo by default
    const preSelected = state.repositories.filter((r) => r.enabled).map((r) => r._id);
    state.selectedRepoIds = preSelected.length > 0 ? preSelected : (state.repositories[0] ? [state.repositories[0]._id] : []);

    renderRepoList();
  } catch (err) {
    elements.repoListContainer.innerHTML = `<div class="empty-state">Failed to load repositories: ${err.message}</div>`;
  }
}

function renderRepoList(filterText = '') {
  const filtered = state.repositories.filter((r) =>
    r.fullName.toLowerCase().includes(filterText.toLowerCase())
  );

  if (filtered.length === 0) {
    elements.repoListContainer.innerHTML = '<div class="empty-state">No matching repositories found.</div>';
    updateRepoSelectionCount();
    return;
  }

  elements.repoListContainer.innerHTML = '';
  filtered.forEach((repo) => {
    const item = document.createElement('label');
    item.className = 'repo-item';

    const isChecked = state.selectedRepoIds.includes(repo._id);

    item.innerHTML = `
      <input type="checkbox" value="${repo._id}" ${isChecked ? 'checked' : ''} />
      <div class="repo-info">
        <span class="repo-name">${repo.fullName}</span>
        <span class="repo-meta">${repo.isPrivate ? 'Private' : 'Public'} • ${repo.defaultBranch || 'main'}</span>
      </div>
    `;

    const checkbox = item.querySelector('input');
    checkbox.addEventListener('change', (e) => {
      if (e.target.checked) {
        if (!state.selectedRepoIds.includes(repo._id)) state.selectedRepoIds.push(repo._id);
      } else {
        state.selectedRepoIds = state.selectedRepoIds.filter((id) => id !== repo._id);
      }
      updateRepoSelectionCount();
    });

    elements.repoListContainer.appendChild(item);
  });

  updateRepoSelectionCount();
}

function updateRepoSelectionCount() {
  const count = state.selectedRepoIds.length;
  elements.selectedRepoCount.textContent = `Next: Commits (${count} selected)`;
  elements.btnReposNext.disabled = count === 0;
}

elements.repoSearch.addEventListener('input', (e) => {
  renderRepoList(e.target.value);
});

elements.btnReposBack.addEventListener('click', () => setStep(1));
elements.btnReposNext.addEventListener('click', () => setStep(3));

/**
 * Step 3: Commits Target Handlers
 */
elements.minSlider.addEventListener('input', (e) => {
  const val = parseInt(e.target.value, 10);
  state.minTasks = val;
  elements.minCommitsVal.textContent = val;
  if (state.maxTasks < val) {
    state.maxTasks = val;
    elements.maxSlider.value = val;
    elements.maxCommitsVal.textContent = val;
  }
});

elements.maxSlider.addEventListener('input', (e) => {
  const val = parseInt(e.target.value, 10);
  state.maxTasks = val;
  elements.maxCommitsVal.textContent = val;
  if (state.minTasks > val) {
    state.minTasks = val;
    elements.minSlider.value = val;
    elements.minCommitsVal.textContent = val;
  }
});

elements.btnCommitsBack.addEventListener('click', () => setStep(2));
elements.btnCommitsNext.addEventListener('click', () => setStep(4));

/**
 * Step 4: Timing & Schedule Handlers
 */
elements.dayPills.forEach((pill) => {
  pill.addEventListener('click', () => {
    const day = parseInt(pill.getAttribute('data-day'), 10);
    pill.classList.toggle('active');

    if (pill.classList.contains('active')) {
      if (!state.daysOfWeek.includes(day)) state.daysOfWeek.push(day);
    } else {
      state.daysOfWeek = state.daysOfWeek.filter((d) => d !== day);
    }
  });
});

elements.timePicker.addEventListener('change', (e) => {
  state.executionTime = e.target.value;
});

elements.btnTimingBack.addEventListener('click', () => setStep(3));

elements.btnSaveAll.addEventListener('click', async () => {
  if (state.daysOfWeek.length === 0) {
    showAlert('Please select at least one active day.');
    return;
  }

  elements.btnSaveAll.disabled = true;
  elements.btnSaveAll.textContent = 'Saving to Cloud...';

  try {
    // 1. Save automation configuration (commit ranges)
    await fetchApi('/automation/config', {
      method: 'PUT',
      body: JSON.stringify({
        enabled: true,
        minimumTasks: state.minTasks,
        maximumTasks: state.maxTasks,
        timezone: 'IST',
        preferredExecutionTime: state.executionTime,
        requireApproval: false, // Zero manual approvals!
        allowedMaintenanceTypes: ['documentation', 'lint_format', 'config_maintenance', 'testing'],
      }),
    });

    // 2. Save or create schedule
    await fetchApi('/schedules', {
      method: 'POST',
      body: JSON.stringify({
        repositoryIds: state.selectedRepoIds,
        enabled: true,
        timezone: 'IST',
        executionTime: state.executionTime,
        daysOfWeek: state.daysOfWeek,
      }),
    });

    showAlert('24/7 Cloud Automation Activated!', 'success');
    renderDashboard();
    setStep(5);
  } catch (err) {
    showAlert(`Save failed: ${err.message}`);
  } finally {
    elements.btnSaveAll.disabled = false;
    elements.btnSaveAll.textContent = 'Activate 24/7 Automation';
  }
});

/**
 * Step 5: Dashboard Actions
 */
elements.btnRunNow.addEventListener('click', async () => {
  elements.btnRunNow.disabled = true;
  elements.btnRunNow.textContent = 'Dispatching to Cloud...';

  try {
    const triggerUrl = `${API_BASE}/automation/cron-trigger?secret=${CRON_SECRET}&force=true`;
    const res = await fetch(triggerUrl, { method: 'POST' });
    const data = await res.json().catch(() => ({}));

    if (res.ok && data.success) {
      showAlert('Maintenance commits initiated in cloud!', 'success');
    } else {
      showAlert(data.message || 'Execution error');
    }
  } catch (err) {
    showAlert(`Execution failed: ${err.message}`);
  } finally {
    setTimeout(() => {
      elements.btnRunNow.disabled = false;
      elements.btnRunNow.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg>
        <span>Run Commits Now</span>
      `;
    }, 2000);
  }
});

elements.btnReconfigure.addEventListener('click', () => {
  setStep(2);
});

elements.btnOpenWeb.addEventListener('click', () => {
  chrome.tabs.create({ url: WEB_APP_URL });
});

elements.btnLogout.addEventListener('click', async () => {
  await storage.remove(['gitgry_token', 'gitgry_user']);
  state.token = null;
  state.user = null;
  state.selectedRepoIds = [];
  setStep(1);
});

// Run on popup open
document.addEventListener('DOMContentLoaded', init);
