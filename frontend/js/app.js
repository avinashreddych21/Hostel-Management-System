// Shared API utilities
const API = {
  base: '/api',
  
  getToken() { return localStorage.getItem('token'); },
  getUser() { return JSON.parse(localStorage.getItem('user') || '{}'); },
  
  headers() {
    return { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + this.getToken() };
  },

  async get(path) {
    const res = await fetch(this.base + path, { headers: this.headers() });
    if (res.status === 401) { this.logout(); return null; }
    return res.json();
  },

  async post(path, data) {
    const res = await fetch(this.base + path, { method: 'POST', headers: this.headers(), body: JSON.stringify(data) });
    return { ok: res.ok, data: await res.json() };
  },

  async put(path, data) {
    const res = await fetch(this.base + path, { method: 'PUT', headers: this.headers(), body: JSON.stringify(data) });
    return { ok: res.ok, data: await res.json() };
  },

  async delete(path) {
    const res = await fetch(this.base + path, { method: 'DELETE', headers: this.headers() });
    return { ok: res.ok, data: await res.json() };
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/index.html';
  }
};

function requireAdmin() {
  const user = API.getUser();
  if (!user.role || user.role !== 'admin') { window.location.href = '/index.html'; }
}

function requireStudent() {
  const user = API.getUser();
  if (!user.role || user.role !== 'student') { window.location.href = '/index.html'; }
}

function formatCurrency(amount) { return '₹' + parseFloat(amount || 0).toLocaleString('en-IN'); }
function formatDate(date) { return date ? new Date(date).toLocaleDateString('en-IN') : '-'; }
function getInitials(name) { return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) : '?'; }

function getStatusBadge(status) {
  const map = {
    active: 'badge-green', paid: 'badge-green', resolved: 'badge-green', available: 'badge-green',
    pending: 'badge-yellow', in_progress: 'badge-blue', occupied: 'badge-blue',
    overdue: 'badge-red', inactive: 'badge-gray', maintenance: 'badge-orange', open: 'badge-orange'
  };
  return `<span class="badge ${map[status] || 'badge-gray'}">${status?.replace('_',' ') || ''}</span>`;
}

function showModal(html) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `<div class="modal">${html}</div>`;
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
  return overlay;
}

function closeModal() {
  document.querySelector('.modal-overlay')?.remove();
}

function toast(msg, type = 'success') {
  const el = document.createElement('div');
  el.style.cssText = `position:fixed;top:20px;right:20px;background:${type==='success'?'#22c55e':'#ef4444'};color:white;padding:12px 20px;border-radius:8px;font-size:14px;z-index:9999;font-weight:500;box-shadow:0 4px 12px rgba(0,0,0,0.15)`;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

function buildAdminSidebar(active) {
  const user = API.getUser();
  const pages = [
    { href: 'dashboard.html', icon: 'fa-gauge', label: 'Dashboard' },
    { href: 'staff.html', icon: 'fa-users-gear', label: 'Staff' },
    { href: 'rooms.html', icon: 'fa-door-open', label: 'Rooms' },
    { href: 'students.html', icon: 'fa-user-graduate', label: 'Students' },
    { href: 'payments.html', icon: 'fa-credit-card', label: 'Payments' },
    { href: 'complaints.html', icon: 'fa-comment-dots', label: 'Complaints' },
    { href: 'mess.html', icon: 'fa-utensils', label: 'Mess Menu' },
  ];
  return `
    <div class="sidebar-brand">
      <div class="brand-icon"><i class="fas fa-building"></i></div>
      <div class="sidebar-brand-text"><strong>HostelIMS</strong><span>Admin Panel</span></div>
    </div>
    <nav class="sidebar-nav">
      ${pages.map(p => `<a class="nav-item ${active===p.label?'active':''}" href="${p.href}"><i class="fas ${p.icon}"></i>${p.label}</a>`).join('')}
    </nav>
    <div class="sidebar-footer">
      <div class="sidebar-user">
        <div class="user-avatar">${getInitials(user.name)}</div>
        <div class="user-info"><strong>${user.name||'Admin'}</strong><span>Administrator</span></div>
      </div>
      <button class="signout-btn" onclick="API.logout()"><i class="fas fa-right-from-bracket"></i> Sign Out</button>
    </div>`;
}

function buildStudentSidebar(active) {
  const user = API.getUser();
  const pages = [
    { href: 'dashboard.html', icon: 'fa-gauge', label: 'Dashboard' },
    { href: 'rooms.html', icon: 'fa-door-open', label: 'Book Room' },
    { href: 'payments.html', icon: 'fa-credit-card', label: 'Payments' },
    { href: 'complaints.html', icon: 'fa-comment-dots', label: 'Complaints' },
    { href: 'mess.html', icon: 'fa-utensils', label: 'Mess Menu' },
    { href: 'profile.html', icon: 'fa-circle-user', label: 'My Profile' },
  ];
  return `
    <div class="sidebar-brand">
      <div class="brand-icon"><i class="fas fa-building"></i></div>
      <div class="sidebar-brand-text"><strong>HostelIMS</strong><span>Student Portal</span></div>
    </div>
    <nav class="sidebar-nav">
      ${pages.map(p => `<a class="nav-item ${active===p.label?'active':''}" href="${p.href}"><i class="fas ${p.icon}"></i>${p.label}</a>`).join('')}
    </nav>
    <div class="sidebar-footer">
      <div class="sidebar-user">
        <div class="user-avatar">${getInitials(user.name)}</div>
        <div class="user-info"><strong>${user.name||'Student'}</strong><span>${user.roll_number||''}</span></div>
      </div>
      <button class="signout-btn" onclick="API.logout()"><i class="fas fa-right-from-bracket"></i> Sign Out</button>
    </div>`;
}