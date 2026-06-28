/**
 * navbar.js — Shared navigation bar (rendered into every authenticated page)
 * Renders an <ea-navbar> with: brand · nav links · notif bell · user chip · logout
 */

const NAV_LINKS = {
  student: [
    { key: 'dashboard',     label: 'Dashboard',   href: 'dashboard-student.html' },
    { key: 'lessons',       label: 'Materi',       href: 'lessons.html' },
    { key: 'assignments',   label: 'Tugas',        href: 'assignments.html' },
    { key: 'quiz',          label: 'Kuis',         href: 'quiz.html' },
    { key: 'exam',          label: 'Ujian',        href: 'exam.html' },
    { key: 'ocr',           label: 'OCR',          href: 'ocr.html' },
    { key: 'translator',    label: 'Translator',   href: 'translator.html' },
    { key: 'vocabulary',    label: 'Kosakata',     href: 'vocabulary.html' },
    { key: 'certificates',  label: 'Sertifikat',   href: 'certificates.html' },
  ],
  teacher: [
    { key: 'dashboard',       label: 'Dashboard',      href: 'dashboard-teacher.html' },
    { key: 'students',        label: 'Data Siswa',      href: 'students.html' },
    { key: 'content-manager', label: 'Materi & Tugas',  href: 'content-manager.html' },
    { key: 'gradebook',       label: 'Penilaian',       href: 'gradebook.html' },
    { key: 'attendance',      label: 'Kehadiran',       href: 'attendance.html' },
  ],
  admin: [
    { key: 'dashboard',       label: 'Dashboard',      href: 'dashboard-admin.html' },
    { key: 'students',        label: 'Data Siswa',      href: 'students.html' },
    { key: 'user-management', label: 'Pengguna',        href: 'user-management.html' },
    { key: 'content-manager', label: 'Materi & Tugas',  href: 'content-manager.html' },
    { key: 'analytics',       label: 'Analitik',        href: 'analytics.html' },
    { key: 'settings',        label: 'Pengaturan',      href: 'settings.html' },
  ],
};

function renderNavbar(activeKey) {
  const user = getCurrentUser();
  if (!user) return;

  const links   = NAV_LINKS[user.role] || [];
  const initials = (user.fullName || 'U').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  const linksHtml = links.map(l => `
    <li>
      <a class="nav-link${l.key === activeKey ? ' active' : ''}" href="${l.href}">${l.label}</a>
    </li>`).join('');

  const html = `
  <nav class="ea-navbar">
    <div class="container-fluid">
      <a class="ea-brand" href="dashboard-${user.role}.html">
        🎓 English<span class="dot">.</span>Academy
      </a>

      <ul class="ea-nav-links">${linksHtml}</ul>

      <div class="ea-nav-right">
        <!-- Bell -->
        <div style="position:relative;">
          <button class="notif-bell" id="notifBellBtn" title="Notifikasi">
            🔔
            <span class="notif-badge" id="notifBadge" style="display:none;"></span>
          </button>
          <div class="notif-dropdown" id="notifDropdown" style="display:none;">
            <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 4px 8px;border-bottom:1px solid var(--border);margin-bottom:4px;">
              <span style="font-size:.8rem;font-weight:600;color:var(--text);">Notifikasi</span>
              <button onclick="markAllNotifsRead()" style="background:none;border:none;font-size:.75rem;color:var(--primary);cursor:pointer;padding:0;">Tandai semua dibaca</button>
            </div>
            <div id="notifList"><div style="text-align:center;padding:20px;color:var(--muted);font-size:.82rem;">Memuat...</div></div>
          </div>
        </div>

        <!-- User chip -->
        <a href="profile.html" class="ea-user-chip">
          <div class="ea-avatar">${initials}</div>
          <span class="user-name" style="font-size:.8rem;font-weight:500;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${user.fullName}</span>
          <span class="role-badge">${user.role}</span>
        </a>

        <!-- Logout -->
        <button class="ea-logout-btn" id="navLogoutBtn">Keluar</button>
      </div>
    </div>
  </nav>`;

  // Replace the placeholder div
  const placeholder = document.getElementById('app-navbar');
  if (placeholder) {
    placeholder.outerHTML = html;
  } else {
    document.body.insertAdjacentHTML('afterbegin', html);
  }

  // Wire up logout
  document.getElementById('navLogoutBtn').addEventListener('click', async () => {
    try { await callApi('logout', { token: getSessionToken() }); } catch(e) {}
    clearSession();
    window.location.href = 'index.html';
  });

  // Notification bell toggle
  const bell     = document.getElementById('notifBellBtn');
  const dropdown = document.getElementById('notifDropdown');
  let dropOpen   = false;

  bell.addEventListener('click', (e) => {
    e.stopPropagation();
    dropOpen = !dropOpen;
    dropdown.style.display = dropOpen ? 'block' : 'none';
    if (dropOpen) loadNotifDropdown();
  });

  document.addEventListener('click', (e) => {
    if (!bell.contains(e.target) && !dropdown.contains(e.target)) {
      dropOpen = false;
      dropdown.style.display = 'none';
    }
  });

  // Start polling badge count
  refreshNotifBadge();
  setInterval(refreshNotifBadge, 30000);
}

// ── Notification helpers ───────────────────────────────────────────────────
async function refreshNotifBadge() {
  try {
    const { count } = await callApi('getUnreadNotificationCount', { token: getSessionToken() });
    const badge = document.getElementById('notifBadge');
    if (!badge) return;
    if (count > 0) {
      badge.textContent = count > 9 ? '9+' : count;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  } catch(e) {}
}

async function loadNotifDropdown() {
  const list = document.getElementById('notifList');
  if (!list) return;
  try {
    const notifs = await callApi('listMyNotifications', { token: getSessionToken() });
    if (!notifs.length) {
      list.innerHTML = '<div style="text-align:center;padding:24px 12px;color:var(--muted);font-size:.82rem;">Belum ada notifikasi 🎉</div>';
      return;
    }
    list.innerHTML = notifs.map(n => `
      <div class="notif-item ${n.isRead !== 'TRUE' ? 'unread' : ''}" onclick="markNotifRead('${n.notificationId}')">
        <div class="notif-title">${n.title}</div>
        <div class="notif-body">${n.message}</div>
        <div class="notif-time">${new Date(n.createdAt).toLocaleString('id-ID')}</div>
      </div>`).join('');
  } catch(e) {
    list.innerHTML = '<div style="text-align:center;padding:16px;color:var(--muted);font-size:.82rem;">Gagal memuat notifikasi.</div>';
  }
}

async function markNotifRead(notificationId) {
  try {
    await callApi('markNotificationRead', { token: getSessionToken(), notificationId });
    refreshNotifBadge();
    loadNotifDropdown();
  } catch(e) {}
}

async function markAllNotifsRead() {
  try {
    await callApi('markAllNotificationsRead', { token: getSessionToken() });
    refreshNotifBadge();
    loadNotifDropdown();
  } catch(e) {}
}
