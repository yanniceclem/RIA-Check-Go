async function api(path, opts={}){
  const res = await fetch(path, Object.assign({headers:{'Content-Type':'application/json'}}, opts));
  return res.json().catch(()=>({ok:false}));
}

async function loadPlans(){
  const el = document.getElementById('plansList');
  el.innerText = 'Chargement...';
  const r = await api('/api/v1/sgr/plans');
  if(!r.ok){ el.innerText = 'Erreur: ' + (r.error||''); return; }
  el.innerHTML = '';
  if(r.plans.length===0) return el.innerText = 'Aucun plan.';
  const tpl = document.getElementById('planTpl');
  for(const p of r.plans){
    const node = tpl.content.cloneNode(true);
      node.querySelector('.title').innerText = p.title;
      node.querySelector('.meta').innerText = `${p.status} • ${p.created_at ? p.created_at.split('T')[0] : ''}`;
      node.querySelector('.desc').innerText = p.description || '';
      if(p.diagnostic_id){
        try{
          const a = document.createElement('a');
          a.href = `/api/v1/diagnostics/${p.diagnostic_id}`;
          a.innerText = `Diagnostic #${p.diagnostic_id}`;
          a.style.marginLeft = '8px';
          a.style.fontSize = '0.9em';
          a.target = '_blank';
          node.querySelector('.meta').appendChild(a);
        }catch(e){ /* ignore */ }
      }
    const viewBtn = node.querySelector('.viewBtn');
    const deleteBtn = node.querySelector('.deleteBtn');
    const tasksArea = node.querySelector('.tasksArea');
    viewBtn.addEventListener('click', async ()=>{
      if(tasksArea.style.display==='none'){
        // load tasks
        const detail = await api('/api/v1/sgr/plans/'+p.id);
        if(!detail.ok){ alert('Erreur chargement plan'); return; }
        tasksArea.innerHTML = '';
        const createTaskForm = document.createElement('form');
        createTaskForm.innerHTML = `\n          <h4>Ajouter tâche</h4>\n          <label>Titre<input name="title" required /></label>\n          <label>Description<textarea name="description"></textarea></label>\n          <label>Assigner à (ID)<input name="assignee_id" type="number" /></label>\n          <div class="actions"><button>Ajouter</button></div>\n        `;
        createTaskForm.addEventListener('submit', async (ev)=>{
          ev.preventDefault();
          const formData = new FormData(createTaskForm);
          const payload = { title: formData.get('title'), description: formData.get('description'), assignee_id: formData.get('assignee_id') || null };
          const r2 = await api(`/api/v1/sgr/plans/${p.id}/tasks`, {method:'POST', body: JSON.stringify(payload)});
          if(!r2.ok){ alert('Erreur création tâche'); return; }
          await loadPlans();
        });
        tasksArea.appendChild(createTaskForm);
        if(detail.tasks && detail.tasks.length){
          const list = document.createElement('div');
          for(const t of detail.tasks){
            const tnode = document.createElement('div');
            tnode.style.borderTop = '1px dashed #ddd';
            tnode.style.paddingTop = '6px';
            tnode.innerHTML = `<strong>${t.title}</strong> <small>${t.status}</small><div>${t.description||''}</div>`;
            const updateBtn = document.createElement('button'); updateBtn.innerText='Marquer fait';
            updateBtn.addEventListener('click', async ()=>{
              const r3 = await api(`/api/v1/sgr/tasks/${t.id}`, {method:'PUT', body: JSON.stringify({ ...t, status: 'done' })});
              if(r3.ok) loadPlans();
            });
            tnode.appendChild(updateBtn);
            list.appendChild(tnode);
          }
          tasksArea.appendChild(list);
        }
        tasksArea.style.display = 'block';
      } else {
        tasksArea.style.display = 'none';
      }
    });
    deleteBtn.addEventListener('click', async ()=>{
      if(!confirm('Supprimer ce plan ?')) return;
      const r2 = await api('/api/v1/sgr/plans/'+p.id, {method:'DELETE'});
      if(r2.ok) loadPlans(); else alert('Erreur suppression');
    });
    el.appendChild(node);
  }
}

// create plan
const createForm = document.getElementById('createPlanForm');
createForm.addEventListener('submit', async (ev)=>{
  ev.preventDefault();
  const fd = new FormData(createForm);
  const payload = { title: fd.get('title'), description: fd.get('description'), due_date: fd.get('due_date'), diagnostic_id: fd.get('diagnostic_id') || null };
  const r = await api('/api/v1/sgr/plans', {method:'POST', body: JSON.stringify(payload)});
  const resEl = document.getElementById('createPlanResult');
  if(r.ok){ resEl.innerText = 'Plan créé'; createForm.reset(); loadPlans(); }
  else resEl.innerText = 'Erreur création';
});

// initial
loadPlans();

// simple auth check: if not logged in, redirect to dashboard for login
(async ()=>{
  const s = await api('/api/v1/session');
  if(!s.ok){ alert('Vous devez être connecté·e pour utiliser le SGR.'); window.location.href = '/dashboard.html'; }
})();
