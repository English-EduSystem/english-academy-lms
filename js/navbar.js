/**
 * js/navbar.js
 * ---------------------------------------------------------------------------
 * Setiap halaman yang butuh login memanggil renderNavbar('pageKey') di awal
 * script-nya. Menu yang muncul menyesuaikan role user yang sedang login.
 * ---------------------------------------------------------------------------
 */

const NAV_LINKS = {
  student: [
    { key: 'dashboard', label: 'Dashboard', href: 'dashboard-student.html' },
    { key: 'lessons', label: 'Materi', href: 'lessons.html' },
    { key: 'assignments', label: 'Tugas', href: 'assignments.html' },
    { key: 'ocr', label: 'OCR Scanner', href: 'ocr.html' },
    { key: 'translator', label: 'Translator', href: 'translator.html' },
    { key: 'vocabulary', label: 'Kosakata', href: 'vocabulary.html' },
    { key: 'certificates', label: 'Sertifikat', href: 'certificates.html' }
  ],
  teacher: [
    { key: 'dashboard', label: 'Dashboard', href: 'dashboard-teacher.html' },
    { key: 'content-manager', label: 'Materi & Tugas', href: 'content-manager.html' },
    { key: 'gradebook', label: 'Penilaian', href: 'gradebook.html' },
    { key: 'attendance', label: 'Kehadiran', href: 'attendance.html' }
  ],
  admin: [
    { key: 'dashboard', label: 'Dashboard', href: 'dashboard-admin.html' },
    { key: 'user-management', label: 'Pengguna', href: 'user-management.html' },
    { key: 'content-manager', label: 'Materi & Tugas', href: 'content-manager.html' },
    { key: 'analytics', label: 'Analitik', href: 'analytics.html' },
    { key: 'settings', label: 'Pengaturan', href: 'settings.html' }
  ]
};

function renderNavbar(activeKey) {
  const user = getCurrentUser();
  if (!user) return;

  const links = NAV_LINKS[user.role] || [];
  const linksHtml = links.map(link => `
    <li class="nav-item">
      <a class="nav-link ${link.key === activeKey ? 'active fw-semibold' : ''}" href="${link.href}">${link.label}</a>
    </li>
  `).join('');

  const navHtml = `
  <nav class="navbar navbar-expand-lg bg-white shadow-sm mb-4">
    <div class="container">
      <a class="navbar-brand fw-bold" href="dashboard-${user.role}.html" style="color: var(--color-primary);">
        English Academy <span class="text-accent">Indonesia</span>
      </a>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNav">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="mainNav">
        <ul class="navbar-nav me-auto">${linksHtml}</ul>
        <div class="d-flex align-items-center gap-3">
          <div class="dropdown">
            <button class="btn btn-sm btn-light position-relative" data-bs-toggle="dropdown" id="notifBellBtn">
              🔔
              <span class="badge bg-danger rounded-pill position-absolute top-0 start-100 translate-middle" id="notifBadge" style="display:none; font-size:0.6rem;"></span>
            </button>
            <div class="dropdown-menu dropdown-menu-end p-2" style="width: 320px; max-height: 400px; overflow-y: auto;" id="notifDropdown">
              <div class="text-muted small text-center py-3">Memuat...</div>
            </div>
          </div>
          <a href="profile.html" class="text-muted small text-decoration-none ${activeKey === 'profile' ? 'fw-semibold' : ''}">
            ${user.fullName} <span class="badge bg-light text-dark border">${user.role}</span>
          </a>
          <button class="btn btn-sm btn-outline-secondary" id="navLogoutBtn">Keluar</button>
        </div>
      </div>
    </div>
  </nav>`;

  document.getElementById('app-navbar').outerHTML = navHtml;
  document.getElementById('navLogoutBtn').addEventListener('click', async () => {
    try { await callApi('logout', { token: getSessionToken() }); } catch (e) { /* ignore */ }
    clearSession();
    window.location.href = 'index.html';
  });

  initNotificationBell();
}

async function initNotificationBell() {
  await refreshNotifBadge();
  setInterval(refreshNotifBadge, 30000); // poll — Apps Script has no push/websockets

  document.getElementById('notifBellBtn').addEventListener('click', loadNotifDropdown);
}

async function refreshNotifBadge() {
  try {
    const { count } = await callApi('getUnreadNotificationCount', { token: getSessionToken() });
    const badge = document.getElementById('notifBadge');
    if (!badge) return;
    if (count > 0) { badge.textContent = count > 9 ? '9+' : count; badge.style.display = 'block'; }
    else { badge.style.display = 'none'; }
  } catch (e) { /* non-critical */ }
}

async function loadNotifDropdown() {
  const dropdown = document.getElementById('notifDropdown');
  try {
    const notifs = await callApi('listMyNotifications', { token: getSessionToken() });
    const markAllHtml = notifs.length
      ? `<button class="btn btn-sm btn-link p-0 mb-2" onclick="markAllNotifsRead()">Tandai semua dibaca</button>`
      : '';
    dropdown.innerHTML = markAllHtml + (notifs.map(n => `
      <div class="border-bottom py-2 small ${n.isRead === 'TRUE' ? 'text-muted' : 'fw-semibold'}" role="button" onclick="markNotifRead('${n.notificationId}')">
        <div>${n.title}</div>
        <div class="fw-normal text-muted" style="font-size:0.8rem;">${n.message}</div>
        <div class="fw-normal text-muted" style="font-size:0.7rem;">${new Date(n.createdAt).toLocaleString('id-ID')}</div>
      </div>
    `).join('') || '<div class="text-muted small text-center py-3">Belum ada notifikasi.</div>');
  } catch (e) {
    dropdown.innerHTML = '<div class="text-muted small text-center py-3">Gagal memuat notifikasi.</div>';
  }
}

async function markNotifRead(notificationId) {
  try {
    await callApi('markNotificationRead', { token: getSessionToken(), notificationId });
    refreshNotifBadge();
    loadNotifDropdown();
  } catch (e) { /* non-critical */ }
}

async function markAllNotifsRead() {
  try {
    await callApi('markAllNotificationsRead', { token: getSessionToken() });
    refreshNotifBadge();
    loadNotifDropdown();
  } catch (e) { /* non-critical */ }
}
