/* ============================================
   AllDelivered PM — Core Application Logic
   ============================================ */

// --- LocalStorage Helpers ---
function getData(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function setData(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getSession() {
  return getData('ad_session');
}

function setSession(session) {
  setData('ad_session', session);
}

function clearSession() {
  localStorage.removeItem('ad_session');
}

// --- Auth ---
function checkAuth(allowedRoles) {
  const session = getSession();
  if (!session) {
    window.location.href = 'index.html';
    return null;
  }
  if (allowedRoles && !allowedRoles.includes(session.role)) {
    window.location.href = 'index.html';
    return null;
  }
  return session;
}

function getUsers() {
  return getData('ad_users') || [];
}

function getCases() {
  return getData('ad_cases') || [];
}

function saveUsers(users) {
  setData('ad_users', users);
}

function saveCases(cases) {
  setData('ad_cases', cases);
}

function getCaseById(id) {
  return getCases().find(c => c.id === id) || null;
}

function updateCase(updatedCase) {
  const cases = getCases();
  const idx = cases.findIndex(c => c.id === updatedCase.id);
  if (idx !== -1) {
    cases[idx] = updatedCase;
    saveCases(cases);
  }
}

function generateId(prefix) {
  return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4);
}

// --- Toast ---
function showToast(message, type = 'success') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = 'toast ' + type;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// --- Modal ---
function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('active');
}

// --- Section Toggle ---
function initCollapsible() {
  document.querySelectorAll('.section-header').forEach(header => {
    header.addEventListener('click', (e) => {
      if (e.target.closest('.btn, .btn-icon, a')) return;
      header.closest('.section').classList.toggle('collapsed');
    });
  });
}

// --- Formatting ---
function fmt(num) {
  return Number(num || 0).toLocaleString();
}

function fmtDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.getFullYear() + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + String(d.getDate()).padStart(2, '0');
}

function isOverdue(dateStr) {
  if (!dateStr) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(dateStr) < today;
}

function isToday(dateStr) {
  if (!dateStr) return false;
  const today = new Date();
  const d = new Date(dateStr);
  return d.getFullYear() === today.getFullYear() &&
         d.getMonth() === today.getMonth() &&
         d.getDate() === today.getDate();
}

function todayStr() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

// --- Status Helpers ---
function statusBadge(status) {
  const map = {
    'active': '<span class="badge badge-active">進行中</span>',
    'hold': '<span class="badge badge-hold">保留</span>',
    'done': '<span class="badge badge-done">完了</span>',
    'proposal': '<span class="badge badge-proposal">提案中</span>',
    'archived': '<span class="badge" style="background:rgba(255,255,255,0.06);color:var(--text-sub);">📦 アーカイブ</span>'
  };
  return map[status] || status;
}

function billingBadge(status) {
  const map = {
    '未請求': '<span class="badge badge-billing-unpaid">未請求</span>',
    '請求済': '<span class="badge badge-billing-invoiced">請求済</span>',
    '入金済': '<span class="badge badge-billing-paid">入金済</span>'
  };
  return map[status] || status;
}

function assigneeName(id) {
  const map = { 'admin': 'Taketo', 'kanchan': 'Kanchan', 'client': 'クライアント' };
  return map[id] || id;
}

function priorityDot(p) {
  return '<span class="priority-dot ' + p + '"></span>';
}

// --- Sidebar ---
function initSidebar(session, activePage) {
  const sidebar = document.querySelector('.sidebar');
  if (!sidebar) return;

  const isAdmin = session.role === 'admin';
  const isPartner = session.role === 'partner';

  let navHtml = '';
  if (isAdmin || isPartner) {
    navHtml += '<a href="dashboard.html" class="sidebar-nav-item' + (activePage === 'dashboard' ? ' active' : '') + '">📊 ダッシュボード</a>';

    // 案件ごとのリンク
    const cases = getCases().filter(c => c.status !== 'archived');
    const active = cases.filter(c => c.status === 'active');
    const proposal = cases.filter(c => c.status === 'proposal');

    if (active.length > 0) {
      navHtml += '<div class="sidebar-section-label">進行中</div>';
      active.forEach(c => {
        const isCurrent = activePage === c.id;
        navHtml += '<a href="case.html?id=' + c.id + '" class="sidebar-nav-item sidebar-case-item' + (isCurrent ? ' active' : '') + '" title="' + c.clientName + ' — ' + c.name + '">'
          + '<span class="sidebar-case-dot active-dot"></span>'
          + '<span class="sidebar-case-name">' + c.clientName + '</span>'
          + '</a>';
      });
    }

    if (proposal.length > 0) {
      navHtml += '<div class="sidebar-section-label">提案中</div>';
      proposal.forEach(c => {
        const isCurrent = activePage === c.id;
        navHtml += '<a href="case.html?id=' + c.id + '" class="sidebar-nav-item sidebar-case-item' + (isCurrent ? ' active' : '') + '" title="' + c.clientName + ' — ' + c.name + '">'
          + '<span class="sidebar-case-dot proposal-dot"></span>'
          + '<span class="sidebar-case-name">' + c.clientName + '</span>'
          + '</a>';
      });
    }
  }

  sidebar.querySelector('.sidebar-nav').innerHTML = navHtml;

  const userEl = sidebar.querySelector('.sidebar-user');
  userEl.innerHTML = `
    <div class="user-name">${session.name}</div>
    <div class="user-role">${session.role}</div>
    <a href="#" class="logout-link" onclick="clearSession(); window.location.href='index.html'; return false;">ログアウト</a>
  `;

  // Hamburger
  const hamburger = document.querySelector('.hamburger');
  const overlay = document.querySelector('.sidebar-overlay');
  if (hamburger) {
    hamburger.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      overlay.classList.toggle('active');
    });
  }
  if (overlay) {
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('active');
    });
  }
}

// --- CSV Export ---
function exportCSV(filename, headers, rows) {
  const bom = '\uFEFF';
  let csv = bom + headers.join(',') + '\n';
  rows.forEach(row => {
    csv += row.map(cell => '"' + String(cell || '').replace(/"/g, '""') + '"').join(',') + '\n';
  });
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

// --- JSON Export/Import ---
function exportAllData() {
  const data = {
    ad_users: getUsers(),
    ad_cases: getCases(),
    exportedAt: new Date().toISOString()
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'alldelivered_backup_' + todayStr() + '.json';
  link.click();
  URL.revokeObjectURL(link.href);
}

function importAllData(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.ad_users) saveUsers(data.ad_users);
        if (data.ad_cases) saveCases(data.ad_cases);
        resolve();
      } catch (err) {
        reject(err);
      }
    };
    reader.readAsText(file);
  });
}

// --- Satisfaction color ---
function satColor(score) {
  if (score >= 80) return 'var(--success)';
  if (score >= 60) return 'var(--warning)';
  return 'var(--error)';
}

// --- Gantt helpers ---
function daysBetween(start, end) {
  const s = new Date(start);
  const e = new Date(end);
  return Math.ceil((e - s) / (1000 * 60 * 60 * 24));
}

function dayOffset(base, date) {
  const b = new Date(base);
  const d = new Date(date);
  return Math.ceil((d - b) / (1000 * 60 * 60 * 24));
}

function dateAddDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function getMondayOf(dateStr) {
  const d = new Date(dateStr);
  const dow = d.getDay(); // 0=Sun
  const offset = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

// --- Initial Data Setup ---
function initDefaultData() {
  if (!getData('ad_users')) {
    saveUsers([
      { id: "admin", role: "admin", name: "Taketo（中川雄斗）", password: "alldelivered2025" },
      { id: "kanchan", role: "partner", name: "Kanchan", password: "kanchan2025" },
      { id: "tobeshinhome", role: "client", name: "Tobeshinhome", clientId: "tobeshinhome", password: "tobeshinhome2025" },
      { id: "kiraku", role: "client", name: "Kiraku", clientId: "kiraku", password: "kiraku2025" },
      { id: "xknock", role: "client", name: "X-knock", clientId: "xknock", password: "xknock2025" }
    ]);
  }

  if (!getData('ad_cases')) {
    saveCases([
      {
        id: "case_001",
        clientId: "tobeshinhome",
        clientName: "Tobeshinhome",
        name: "HP制作・SEO支援",
        status: "active",
        phase: "継続中",
        probability: 100,
        startDate: "2025-01-01",
        endDate: "2025-12-31",
        consultingFee: 300000,
        monthlyFee: 200000,
        assignee: "admin",
        nextFollowDate: "2025-04-10",
        billing: [
          { id: "bill_001", month: "2025-03", consultingFee: 300000, monthlyFee: 200000, status: "入金済", paidDate: "2025-03-25" }
        ],
        satisfaction: [
          {
            id: "sat_001", date: "2025-03-01",
            scores: { responseSpeed: 18, proposalQuality: 16, communication: 19, results: 15, continuationWill: 17 },
            total: 85, comment: "全体的に満足いただいている"
          }
        ],
        gantt: [
          { id: "task_001", name: "初回ヒアリング", startDate: "2025-01-05", endDate: "2025-01-10", assignee: "admin", priority: "high", done: true },
          { id: "task_002", name: "サイト設計", startDate: "2025-01-11", endDate: "2025-01-25", assignee: "admin", priority: "medium", done: true },
          { id: "task_003", name: "デザイン制作", startDate: "2025-01-26", endDate: "2025-02-15", assignee: "kanchan", priority: "medium", done: true },
          { id: "task_004", name: "SEO施策実行", startDate: "2025-02-16", endDate: "2025-06-30", assignee: "admin", priority: "high", done: false }
        ],
        kpis: [
          { id: "kpi_001", name: "月次問い合わせ数", unit: "件", target: 20, actual: 17, prevActual: 12 },
          { id: "kpi_002", name: "SEO順位（メインKW）", unit: "位", target: 10, actual: 15, prevActual: 23 }
        ],
        followups: [
          { id: "fu_001", date: "2025-04-10", content: "月次レポート送付", status: "未対応" }
        ],
        minutes: [
          {
            id: "min_001", date: "2025-03-15", title: "3月定例MTG",
            body: "現状の施策進捗を確認。LP修正を優先対応することで合意。",
            nextActions: [
              { text: "LP修正対応", assignee: "admin", dueDate: "2025-03-22", done: false },
              { text: "アクセス解析レポート作成", assignee: "kanchan", dueDate: "2025-03-25", done: true }
            ]
          }
        ],
        resources: [
          { id: "res_001", title: "施策管理シート", url: "https://docs.google.com/spreadsheets/d/example", type: "Sheet" },
          { id: "res_002", title: "デザインカンプ", url: "https://www.figma.com/file/example", type: "Figma" }
        ],
        proposalUrl: "",
        contractUrl: ""
      },
      {
        id: "case_002",
        clientId: "xknock",
        clientName: "X-knock",
        name: "広告運用支援",
        status: "active",
        phase: "継続中",
        probability: 100,
        startDate: "2025-02-01",
        endDate: "2025-12-31",
        consultingFee: 0,
        monthlyFee: 150000,
        assignee: "kanchan",
        nextFollowDate: "2025-04-05",
        billing: [],
        satisfaction: [],
        gantt: [
          { id: "task_010", name: "アカウント分析", startDate: "2025-02-01", endDate: "2025-02-14", assignee: "kanchan", priority: "high", done: true },
          { id: "task_011", name: "広告運用開始", startDate: "2025-02-15", endDate: "2025-12-31", assignee: "kanchan", priority: "medium", done: false }
        ],
        kpis: [
          { id: "kpi_010", name: "ROAS", unit: "%", target: 300, actual: 250, prevActual: 180 }
        ],
        followups: [
          { id: "fu_010", date: "2025-04-05", content: "広告パフォーマンス報告", status: "未対応" }
        ],
        minutes: [],
        resources: [],
        proposalUrl: "",
        contractUrl: ""
      },
      {
        id: "case_003",
        clientId: "kiraku",
        clientName: "Kiraku",
        name: "売上改善コンサル",
        status: "active",
        phase: "契約済",
        probability: 100,
        startDate: "2025-03-01",
        endDate: "2025-09-30",
        consultingFee: 300000,
        monthlyFee: 200000,
        assignee: "admin",
        nextFollowDate: "2025-04-15",
        billing: [],
        satisfaction: [],
        gantt: [
          { id: "task_020", name: "現状分析", startDate: "2025-03-01", endDate: "2025-03-15", assignee: "admin", priority: "high", done: true },
          { id: "task_021", name: "改善提案作成", startDate: "2025-03-16", endDate: "2025-03-31", assignee: "admin", priority: "high", done: false }
        ],
        kpis: [],
        followups: [
          { id: "fu_020", date: "2025-04-15", content: "初回提案MTG", status: "未対応" }
        ],
        minutes: [],
        resources: [],
        proposalUrl: "",
        contractUrl: ""
      }
    ]);
  }
}

// --- Get monthly revenue ---
function getMonthlyRevenue(cases) {
  const now = new Date();
  const currentMonth = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
  let total = 0;
  let unpaid = 0;

  cases.forEach(c => {
    if (c.status === 'active' && c.monthlyFee) {
      total += c.monthlyFee;
    }
    (c.billing || []).forEach(b => {
      if (b.month === currentMonth) {
        total += (b.consultingFee || 0);
        if (b.status !== '入金済') {
          unpaid += (b.consultingFee || 0) + (b.monthlyFee || 0);
        }
      }
    });
  });

  return { total, unpaid };
}

// --- Calculate average satisfaction ---
function getAvgSatisfaction(cases) {
  let scores = [];
  cases.forEach(c => {
    if (c.satisfaction && c.satisfaction.length > 0) {
      const latest = c.satisfaction[c.satisfaction.length - 1];
      scores.push(latest.total);
    }
  });
  if (scores.length === 0) return 0;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

// --- Count followups this week ---
function getWeeklyFollowups(cases) {
  const now = new Date();
  const weekEnd = new Date(now);
  weekEnd.setDate(now.getDate() + (7 - now.getDay()));
  let count = 0;
  cases.forEach(c => {
    (c.followups || []).forEach(f => {
      const fd = new Date(f.date);
      if (fd >= now && fd <= weekEnd && f.status === '未対応') count++;
    });
    if (c.nextFollowDate) {
      const nf = new Date(c.nextFollowDate);
      if (nf >= now && nf <= weekEnd) count++;
    }
  });
  return count;
}

// Run init on every page
initDefaultData();
