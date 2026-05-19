/* ── STAFF ── */
const STAFF = [
  { u:'admin',   p:'ellen2025', name:'Administrator', role:'Admin'   },
  { u:'officer', p:'loans123',  name:'Loan Officer',  role:'Officer' },
];

/* ── APPS DATA ── */
let APPS = [
  { id:'EF-001', name:'Tendai Moyo',       phone:'+263 77 234 5678', idNo:'63-123456A78',
     job:'Secondary School Teacher', loanType:'School Fees', amount:500, risk:'Low',
     purpose:'University tuition – first semester 2025',
     date:'2025-05-15T09:23:00', status:'pending',
     photo:'https://randomuser.me/api/portraits/men/32.jpg' },
  { id:'EF-002', name:'Rutendo Chikwanda', phone:'+263 71 456 7890', idNo:'22-654321B99',
     job:'Registered Nurse',   loanType:'Emergency', amount:200, risk:'Low',
     purpose:'Urgent hospital admission costs',
     date:'2025-05-15T10:47:00', status:'pending',
     photo:'https://randomuser.me/api/portraits/women/44.jpg' },
  { id:'EF-003', name:'Farai Mutasa',       phone:'+263 78 123 9876', idNo:'95-789012C55',
     job:'Small Business Owner', loanType:'Business', amount:1200, risk:'Medium',
     purpose:'Stock purchase – hardware shop expansion',
     date:'2025-05-14T14:30:00', status:'approved',
     photo:'https://randomuser.me/api/portraits/men/56.jpg' },
  { id:'EF-004', name:'Shamiso Dube',       phone:'+263 73 567 8901', idNo:'88-345678D11',
     job:'Retail Cashier',     loanType:'Housing',  amount:800, risk:'High',
     purpose:'Roof repair – storm damage',
     date:'2025-05-14T08:15:00', status:'declined',
     photo:'https://randomuser.me/api/portraits/women/28.jpg' },
  { id:'EF-005', name:'Blessing Ncube',     phone:'+263 77 890 1234', idNo:'93-901234E22',
     job:'Freelance Photographer', loanType:'School Fees', amount:350, risk:'Low',
     purpose:'HEXCO exam registration & study materials',
     date:'2025-05-15T11:55:00', status:'pending',
     photo:'https://randomuser.me/api/portraits/men/71.jpg' },
  { id:'EF-006', name:'Tarisai Zvimba',     phone:'+263 73 789 0123', idNo:'91-234567F44',
     job:'Civil Servant',      loanType:'Housing',  amount:1500, risk:'Low',
     purpose:'Deposit for family home – Mutare West',
     date:'2025-05-13T07:30:00', status:'pending',
     photo:'https://randomuser.me/api/portraits/men/19.jpg' },
];

const ACTIVITY = [
  { text:'New loan application submitted', time:'2 minutes ago' },
  { text:'Customer documents verified — EF-003', time:'18 minutes ago' },
  { text:'Business loan approved — Farai Mutasa', time:'1 hour ago' },
  { text:'Repayment reminder triggered — EF-004', time:'3 hours ago' },
  { text:'New registration — Tarisai Zvimba', time:'Yesterday' },
];

/* ── HELPERS ── */
let currentUser = null;
let selectedId  = null;
let toastTimer  = null;

const typeTag = t => ({
  'School Fees': 'tag-blue', Emergency:'tag-red', Business:'tag-green',
  Housing:'tag-gold', Personal:'tag-purple',
}[t] || 'tag-blue');

const statusTag = s => ({
  pending:'tag-yellow', approved:'tag-green', declined:'tag-red',
}[s] || 'tag-yellow');

const riskTag = r => ({ Low:'tag-green', Medium:'tag-yellow', High:'tag-red' }[r] || 'tag-yellow');

const esc = s => String(s)
  .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

const stats = () => ({
  total:    APPS.length,
  pending:  APPS.filter(a => a.status==='pending').length,
  approved: APPS.filter(a => a.status==='approved').length,
  declined: APPS.filter(a => a.status==='declined').length,
});

/* ── AUTH ── */
function doLogin() {
  const u = document.getElementById('un').value.trim();
  const p = document.getElementById('pw').value;
  const s = STAFF.find(x => x.u===u && x.p===p);
  const card = document.getElementById('login-card');
  const err  = document.getElementById('login-err');
  if (s) {
    currentUser = s;
    card.classList.remove('err'); err.style.display='none';
    document.getElementById('login-screen').style.display='none';
    document.getElementById('app').style.display='flex';
    document.getElementById('nav-user').textContent = s.name;
    renderAll();
  } else {
    card.classList.add('err'); err.style.display='block';
    setTimeout(() => { card.classList.remove('err'); err.style.display='none'; }, 1500);
  }
}

function doLogout() {
  currentUser = null;
  document.getElementById('app').style.display='none';
  document.getElementById('login-screen').style.display='flex';
  document.getElementById('un').value='';
  document.getElementById('pw').value='';
}

document.getElementById('un').addEventListener('keydown', e => { if(e.key==='Enter') document.getElementById('pw').focus(); });
document.getElementById('pw').addEventListener('keydown', e => { if(e.key==='Enter') doLogin(); });

/* ── RENDER ALL ── */
function renderAll() {
  renderKPI();
  renderTable(APPS);
  renderActivity();
  updatePending();
}

/* ── KPI ── */
function renderKPI() {
  const s = stats();
  const cards = [
    { label:'Total Applications', val:s.total,           note:'+12% this month',              noteColor:'#70e0a0', bar:'#c9972c' },
    { label:'Pending Reviews',    val:s.pending,          note:'Needs verification',           noteColor:'#e8c56a', bar:'#e5a020' },
    { label:'Approved Today',     val:s.approved,         note:'Fast processing',              noteColor:'#70e0a0', bar:'#27a362' },
    { label:'Total Outstanding',  val:'$'+(s.total*350).toLocaleString(), note:'Monitor repayment health', noteColor:'#ff9999', bar:'#e05252' },
  ];
  document.getElementById('kpi-grid').innerHTML = cards.map(c => `
    <div class="kpi-card">
      <div class="kpi-bar" style="background:${c.bar}"></div>
      <div class="kpi-label">${c.label}</div>
      <div class="kpi-val">${c.val}</div>
      <div class="kpi-note" style="color:${c.noteColor}">${c.note}</div>
    </div>`).join('');
}

/* ── TABLE ── */
function renderTable(apps) {
  const q  = (document.getElementById('search-q')?.value||'').toLowerCase();
  const st = document.getElementById('filter-status')?.value||'all';
  const visible = apps
    .filter(a => st==='all' || a.status===st)
    .filter(a => !q || a.name.toLowerCase().includes(q) || a.id.toLowerCase().includes(q))
    .sort((a,b) => new Date(b.date)-new Date(a.date));

  document.getElementById('app-tbody').innerHTML = visible.map(app => `
    <tr>
      <td>
        <div class="td-name">${esc(app.name)}</div>
        <div class="td-phone">${esc(app.phone)} · ${esc(app.id)}</div>
      </td>
      <td><span class="tag ${typeTag(app.loanType)}">${esc(app.loanType)}</span></td>
      <td><span class="td-amount">$${app.amount}</span></td>
      <td><span class="tag ${statusTag(app.status)}">${app.status.charAt(0).toUpperCase()+app.status.slice(1)}</span></td>
      <td><span class="tag ${riskTag(app.risk)}">${esc(app.risk)} Risk</span></td>
      <td>
        <div class="td-actions">
          <button class="btn-review" onclick="openDetail('${app.id}')">Review</button>
          <button class="btn-msg">Message</button>
        </div>
      </td>
    </tr>`).join('') || `<tr><td colspan="6" style="text-align:center;color:var(--T3);padding:2rem;font-size:0.72rem;">No applications found</td></tr>`;
}

function filterTable() { renderTable(APPS); }

/* ── ACTIVITY ── */
function renderActivity() {
  document.getElementById('activity-list').innerHTML = ACTIVITY.map(a => `
    <div class="activity-item">
      <span class="act-dot"></span>
      <div>
        <div class="act-text">${esc(a.text)}</div>
        <div class="act-time">${esc(a.time)}</div>
      </div>
    </div>`).join('');
}

/* ── PENDING BADGE ── */
function updatePending() {
  const n = stats().pending;
  const b = document.getElementById('pending-badge');
  document.getElementById('pending-count').textContent = n;
  b.style.display = n>0 ? 'flex' : 'none';
}

/* ── DETAIL MODAL ── */
function openDetail(id) {
  const app = APPS.find(a => a.id===id);
  if (!app) return;
  selectedId = id;

  document.getElementById('modal-name').textContent = app.name;

  const ts = typeTag(app.loanType), ss = statusTag(app.status);
  document.getElementById('modal-tags').innerHTML =
    `<span class="tag ${ts}">${esc(app.loanType)}</span>
     <span class="tag ${ss}">${app.status.charAt(0).toUpperCase()+app.status.slice(1)}</span>
     <span class="tag ${riskTag(app.risk)}">${esc(app.risk)} Risk</span>`;

  document.getElementById('modal-amount').textContent  = '$'+app.amount;
  document.getElementById('modal-purpose').textContent = '"'+app.purpose+'"';

  const fields = [
    ['Ref ID', app.id], ['Phone', app.phone],
    ['ID Number', app.idNo], ['Occupation', app.job],
  ];
  document.getElementById('modal-info').innerHTML = fields.map(([l,v]) => `
    <div class="mi"><div class="mi-lbl">${l}</div><div class="mi-val">${esc(v)}</div></div>`).join('');

  const area = document.getElementById('modal-action-area');
  if (app.status==='pending') {
    area.innerHTML = `
      <label class="modal-note-label">Decision Note (optional)</label>
      <textarea class="modal-textarea" id="decision-note" rows="2" placeholder="e.g. Documents verified, income confirmed…"></textarea>
      <div class="modal-actions">
        <button class="btn-modal-decline" onclick="decide('decline')">✕ Decline</button>
        <button class="btn-modal-approve" onclick="decide('approve')">✓ Approve Application</button>
      </div>`;
  } else {
    const isApproved = app.status==='approved';
    area.innerHTML = `<div class="resolved-banner" style="${isApproved
      ? 'background:rgba(39,163,98,0.10);border:1px solid rgba(39,163,98,0.32);color:#70e0a0;'
      : 'background:rgba(224,82,82,0.10);border:1px solid rgba(224,82,82,0.32);color:#ff9999;'}">
      ${isApproved ? '✓ Application Has Been Approved' : '✕ Application Was Declined'}
    </div>`;
  }

  document.getElementById('modal-overlay').classList.add('open');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
  selectedId = null;
}

function decide(action) {
  const app = APPS.find(a => a.id===selectedId);
  if (!app) return;
  APPS = APPS.map(a => a.id===selectedId ? {...a, status:action==='approve'?'approved':'declined'} : a);
  closeModal();
  showToast(action==='approve' ? `✓ ${app.name} approved` : `${app.name} declined`,
            action==='approve' ? 'ok' : 'err');
  renderAll();
}

document.getElementById('modal-overlay').addEventListener('click', e => {
  if (e.target===document.getElementById('modal-overlay')) closeModal();
});

/* ── TOAST ── */
function showToast(msg, type='ok') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.background = type==='ok' ? 'rgba(39,163,98,0.96)'
    : type==='err' ? 'rgba(224,82,82,0.96)' : 'rgba(229,160,32,0.96)';
  t.classList.add('show');
  if(toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>t.classList.remove('show'), 3500);
}