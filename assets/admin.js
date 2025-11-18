(() => {
  const loginForm = document.getElementById('loginForm');
  const loginResult = document.getElementById('loginResult');
  const adminArea = document.getElementById('adminArea');
  const diagnosticsList = document.getElementById('diagnosticsList');
  const incidentsList = document.getElementById('incidentsList');
  const logsList = document.getElementById('logsList');

  async function checkSession(){
    const r = await fetch('/api/v1/session');
    const j = await r.json();
    return j;
  }

  async function loadAdmin(){
    diagnosticsList.textContent = 'Chargement...';
    const d = await fetch('/api/v1/admin/diagnostics');
    if(d.status===401){ showLogin(); return; }
    const diags = await d.json();
    diagnosticsList.innerHTML = '<ul>'+diags.map(x=>`<li>#${x.id} - ${x.level||'N/A'} - ${x.created_at}</li>`).join('')+'</ul>';

    // load users
    const uResp = await fetch('/api/v1/admin/users');
    const users = uResp.ok ? await uResp.json() : [];
    const usersList = document.getElementById('usersList');
    usersList.innerHTML = '<ul>'+users.map(u=>`<li>#${u.id} - ${u.email} (${u.role}) <button data-id="${u.id}" class="del-user">Suppr</button></li>`).join('')+'</ul>';
    // wire delete buttons
    Array.from(usersList.querySelectorAll('.del-user')).forEach(b=> b.addEventListener('click', async (e)=>{
      const id = e.target.getAttribute('data-id');
      if(!confirm('Supprimer cet utilisateur ?')) return;
      await fetch(`/api/v1/admin/users/${id}`,{method:'DELETE'});
      loadAdmin();
    }));

    const createForm = document.getElementById('createUserForm');
    createForm.addEventListener('submit', async (ev)=>{
      ev.preventDefault();
      const fd = Object.fromEntries(new FormData(createForm));
      const r = await fetch('/api/v1/admin/users',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(fd)});
      const j = await r.json();
      document.getElementById('createUserResult').innerText = j.ok ? `Utilisateur créé (id: ${j.id})` : `Erreur: ${j.error||'?'}`;
      createForm.reset();
      loadAdmin();
    });

    const inc = await fetch('/api/v1/admin/incidents');
    const incs = await inc.json();
    incidentsList.innerHTML = '<ul>'+incs.map(i=>`<li>#${i.id} - ${i.title} - ${i.severity}</li>`).join('')+'</ul>';

    const logs = await fetch('/api/v1/admin/logs');
    const logsj = await logs.json();
    logsList.innerHTML = '<ul>'+logsj.map(l=>`<li>[${l.created_at}] ${l.type} - ${l.message}</li>`).join('')+'</ul>';
  }

  function showLogin(){ document.getElementById('auth').style.display='block'; adminArea.style.display='none'; }
  function showAdmin(){ document.getElementById('auth').style.display='none'; adminArea.style.display='block'; }

  loginForm.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(loginForm));
    const r = await fetch('/api/v1/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(fd)});
    const j = await r.json();
    if(j.ok){ loginResult.innerHTML = `<p>Connecté en tant que ${j.user.email}</p>`; showAdmin(); loadAdmin(); }
    else loginResult.innerHTML = `<p>Erreur: ${j.error||'inconnu'}</p>`;
  });

  document.getElementById('logout').addEventListener('click', async ()=>{
    await fetch('/api/v1/logout',{method:'POST'});
    showLogin();
  });

  // on load
  checkSession().then(j=>{ if(j.ok) { showAdmin(); loadAdmin(); } else showLogin(); }).catch(()=>showLogin());
})();
