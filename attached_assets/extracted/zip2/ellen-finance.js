window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');

/**
 * AMBIENT PARTICLES
 * Spawns small gold circles that drift upward,
 * creating a sense of financial energy/momentum.
 * Each particle is self-removing to prevent DOM bloat.
 */
(function initParticles() {
  const container = document.getElementById('particles');
  if (!container) return;

  function spawn() {
    const el = document.createElement('div');
    el.className = 'p-dot';

    // Random size: 1.5 – 4px
    const size = 1.5 + Math.random() * 2.5;

    // Random horizontal position across the viewport
    const left = Math.random() * 100;

    // Random duration: 11 – 20 seconds (slower = dreamy/premium)
    const dur = (11 + Math.random() * 9).toFixed(1) + 's';

    // Random delay: 0 – 7 seconds so they don't all start at once
    const delay = (Math.random() * 7).toFixed(1) + 's';

    el.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      left: ${left}%;
      bottom: -8px;
      --dur: ${dur};
      --delay: ${delay};
    `;

    container.appendChild(el);

    // Self-clean after animation completes (dur + delay + 1s buffer)
    const totalMs = (parseFloat(dur) + parseFloat(delay) + 1) * 1000;
    setTimeout(() => el.remove(), totalMs);
  }

  // Seed with 10 immediate particles so the background isn't empty on load
  for (let i = 0; i < 10; i++) spawn();

  // Then spawn one new particle every 800ms
  setInterval(spawn, 800);
})();

/* ── Account Modal Logic ── */
const modal = document.getElementById('accountModal');
let currentUser = null;

// Demo accounts (in real app this would be server-side)
const demoAccounts = {
  'demo@ellen.com': { name: 'Demo User', pass: 'demo123', loans: [
    { type: 'School Fees', amount: '$350', status: 'active', issued: '12 Mar 2025', due: '12 Jun 2025', remaining: '$210' },
    { type: 'Emergency', amount: '$150', status: 'pending', issued: '02 May 2025', due: 'Pending', remaining: '$150' },
  ]},
  '+263780000000': { name: 'Test Client', pass: 'test123', loans: [] },
};

function openAccountModal() {
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeAccountModal() {
  modal.classList.remove('open');
  document.body.style.overflow = '';
}
// Close on overlay click
modal.addEventListener('click', function(e) {
  if (e.target === modal) closeAccountModal();
});

function switchTab(tab) {
  document.getElementById('loginTab').classList.toggle('active', tab === 'login');
  document.getElementById('registerTab').classList.toggle('active', tab === 'register');
  document.getElementById('loginForm').style.display = tab === 'login' ? 'block' : 'none';
  document.getElementById('registerForm').style.display = tab === 'register' ? 'block' : 'none';
}

function doLogin() {
  const id = document.getElementById('loginPhone').value.trim();
  const pass = document.getElementById('loginPass').value;
  const acct = demoAccounts[id];
  if (acct && acct.pass === pass) {
    currentUser = { id, ...acct };
    showDashboard();
  } else {
    document.getElementById('loginPhone').style.borderColor = '#cc3333';
    setTimeout(() => { document.getElementById('loginPhone').style.borderColor = ''; }, 1500);
  }
}

/* ── Upload state ── */
const uploads = { selfie: null, idpic: null, por: null, payslip: null };

function handleUpload(input, key, boxId) {
  if (input.files && input.files[0]) {
    uploads[key] = input.files[0];
    const box = document.getElementById(boxId);
    const status = document.getElementById('status-' + key);
    box.classList.add('has-file');
    if (status) { status.style.display = 'block'; }
    const hint = box.querySelector('.upload-hint');
    if (hint) hint.textContent = input.files[0].name;
  }
}

/* ── Step navigation ── */
let currentRegPage = 1;
const TOTAL_REG_PAGES = 3;

function updateStepIndicators(page) {
  for (let i = 1; i <= TOTAL_REG_PAGES; i++) {
    const ind = document.getElementById('step-ind-' + i);
    if (!ind) continue;
    ind.classList.remove('active','done');
    if (i < page) ind.classList.add('done');
    else if (i === page) ind.classList.add('active');
  }
}

function regNext(fromPage) {
  // Validate step 1
  if (fromPage === 1) {
    const name = document.getElementById('regName').value.trim();
    const dob  = document.getElementById('regDob').value;
    const idNo = document.getElementById('regId').value.trim();
    const addr = document.getElementById('regAddress').value.trim();
    const occ  = document.getElementById('regOccupation').value.trim();
    const phone= document.getElementById('regPhone').value.trim();
    if (!name || !dob || !idNo || !addr || !occ || !phone) {
      showFieldError('Please fill in all required personal details.');
      return;
    }
  }
  // Validate step 2 — selfie, ID pic, proof of residence required
  if (fromPage === 2) {
    if (!uploads.selfie || !uploads.idpic || !uploads.por) {
      showFieldError('Please upload your selfie with ID, ID photo, and proof of residence.');
      return;
    }
  }
  const curr = document.getElementById('regPage' + fromPage);
  const next = document.getElementById('regPage' + (fromPage + 1));
  if (curr) curr.classList.remove('active');
  if (next) next.classList.add('active');
  currentRegPage = fromPage + 1;
  updateStepIndicators(currentRegPage);
  // Scroll modal to top
  const card = document.querySelector('.modal-card');
  if (card) card.scrollTop = 0;
}

function regBack(fromPage) {
  const curr = document.getElementById('regPage' + fromPage);
  const prev = document.getElementById('regPage' + (fromPage - 1));
  if (curr) curr.classList.remove('active');
  if (prev) prev.classList.add('active');
  currentRegPage = fromPage - 1;
  updateStepIndicators(currentRegPage);
  const card = document.querySelector('.modal-card');
  if (card) card.scrollTop = 0;
}

function showFieldError(msg) {
  let el = document.getElementById('regError');
  if (!el) {
    el = document.createElement('p');
    el.id = 'regError';
    el.style.cssText = 'font-size:0.62rem;color:#cc3333;font-weight:600;padding:0.4rem 0.6rem;background:rgba(204,51,51,0.07);border-radius:5px;margin-bottom:0.5rem;';
    const page = document.getElementById('regPage' + currentRegPage);
    if (page) page.insertBefore(el, page.firstChild);
  }
  el.textContent = msg;
  setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 3000);
}

function doRegister() {
  const name  = document.getElementById('regName').value.trim();
  const phone = document.getElementById('regPhone').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const pass  = document.getElementById('regPass').value;
  const pass2 = document.getElementById('regPass2').value;

  if (!pass) { showFieldError('Please create a password.'); return; }
  if (pass !== pass2) { showFieldError('Passwords do not match.'); return; }

  // Build application summary
  const dob  = document.getElementById('regDob').value;
  const idNo = document.getElementById('regId').value.trim();
  const addr = document.getElementById('regAddress').value.trim();
  const occ  = document.getElementById('regOccupation').value.trim();

  const key = email || phone;
  demoAccounts[key] = { name, pass, loans: [], dob, idNo, addr, occ,
    docs: {
      selfie: uploads.selfie ? uploads.selfie.name : null,
      idpic:  uploads.idpic  ? uploads.idpic.name  : null,
      por:    uploads.por    ? uploads.por.name     : null,
      payslip:uploads.payslip? uploads.payslip.name : null,
    },
    status: 'pending_review'
  };
  currentUser = { id: key, name, loans: [], status: 'pending_review' };

  // Reset step state for next time
  currentRegPage = 1;
  showDashboard();
}

function showDashboard() {
  document.getElementById('authForms').style.display = 'none';
  const dash = document.getElementById('dashboardView');
  dash.style.display = 'block';
  document.getElementById('dashName').textContent = 'Welcome, ' + currentUser.name + '!';

  const list = document.getElementById('loansList');
  let hasActiveLoans = false;

  if (currentUser.loans && currentUser.loans.length > 0) {
    list.innerHTML = currentUser.loans.map(loan => `
      <div class="loan-card">
        <div class="loan-card-header">
          <span class="loan-type">${loan.type} Loan</span>
          <span class="loan-status ${loan.status === 'active' ? 'status-active' : 'status-pending'}">
            ${loan.status === 'active' ? '● Active' : '◎ Pending'}
          </span>
        </div>
        <div class="loan-amount">${loan.amount}</div>
        <div class="loan-meta-row">
          <div class="loan-meta-item">
            <span class="loan-meta-label">Issued</span>
            <span class="loan-meta-value">${loan.issued}</span>
          </div>
          <div class="loan-meta-item">
            <span class="loan-meta-label">Due Date</span>
            <span class="loan-meta-value">${loan.due}</span>
          </div>
          <div class="loan-meta-item">
            <span class="loan-meta-label">Remaining</span>
            <span class="loan-meta-value">${loan.remaining}</span>
          </div>
        </div>
      </div>`).join('');

    hasActiveLoans = currentUser.loans.some(l => l.status === 'active');
  } else {
    const isPending = currentUser.status === 'pending_review';
    list.innerHTML = isPending
      ? `<div class="dash-empty">
          <div class="dash-empty-icon">⏳</div>
          <strong style="color:#a07820;display:block;margin-bottom:0.3rem;">Application Under Review</strong>
          Your documents have been submitted. Our team will review your application within 24 hours and contact you via WhatsApp or phone.
         </div>`
      : `<div class="dash-empty">
          <div class="dash-empty-icon">📋</div>
          No active loans yet.<br>Contact us on WhatsApp to get started.
         </div>`;
  }

  // Show repayment section only when there is at least one active loan
  const repaySection = document.getElementById('repaySection');
  if (hasActiveLoans) {
    repaySection.style.display = 'block';
    // Generate a deterministic reference from the user id
    const ref = 'EF-' + (currentUser.id || 'USER').replace(/[^A-Z0-9]/gi,'').toUpperCase().slice(0,6).padEnd(6,'0');
    const ecoRefEl = document.getElementById('ecoRef');
    const innRefEl = document.getElementById('innRef');
    if (ecoRefEl) ecoRefEl.textContent = ref;
    if (innRefEl) innRefEl.textContent = ref;
  } else {
    repaySection.style.display = 'none';
  }
}

function submitRepayment(method) {
  const numId  = method === 'eco' ? 'ecoNumber' : 'innNumber';
  const amtId  = method === 'eco' ? 'ecoAmount' : 'innAmount';
  const confId = method === 'eco' ? 'ecoConfirm' : 'innConfirm';
  const num    = document.getElementById(numId).value.trim();
  const amt    = document.getElementById(amtId).value.trim();
  if (!num) {
    document.getElementById(numId).style.borderColor = '#cc3333';
    setTimeout(() => { document.getElementById(numId).style.borderColor = ''; }, 1500);
    return;
  }
  if (!amt || parseFloat(amt) <= 0) {
    document.getElementById(amtId).style.borderColor = '#cc3333';
    setTimeout(() => { document.getElementById(amtId).style.borderColor = ''; }, 1500);
    return;
  }
  // Show confirmation
  document.getElementById(confId).classList.add('show');
  // Reset inputs after 3 s
  setTimeout(() => {
    document.getElementById(numId).value = '';
    document.getElementById(amtId).value = '';
    document.getElementById(confId).classList.remove('show');
  }, 6000);
}

function doLogout() {
  currentUser = null;
  document.getElementById('authForms').style.display = 'block';
  document.getElementById('dashboardView').style.display = 'none';
  document.getElementById('loginPhone').value = '';
  document.getElementById('loginPass').value = '';
  switchTab('login');
}

/* ── FAQ accordion ── */
document.querySelectorAll('.faq-question').forEach(btn => {
  btn.addEventListener('click', () => {
    const item = btn.parentElement;
    const isOpen = item.classList.contains('open');
    // close all
    document.querySelectorAll('.faq-item').forEach(i => {
      i.classList.remove('open');
      i.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
    });
    // open clicked unless it was already open
    if (!isOpen) {
      item.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
    }
  });
});