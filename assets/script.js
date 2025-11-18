(() => {
  const computeBtn = document.getElementById('compute');
  const reportEl = document.getElementById('report');
  const exportBtn = document.getElementById('exportPdf');
  const contactForm = document.getElementById('contactForm');

  function classify(answers){
    // Règles améliorées pour prototype :
    // - Détection immédiate de cas interdits (Article 5)
    // - Calcul de score pondéré pour estimer le niveau (Minimal / Limité / Élevé / Haut)
    const reasons=[];
    let score=0;

    // Interdictions (exemples basés sur Article 5)
    if(answers.q8==='yes'){
      reasons.push('Usage dans l\'administration de la justice — risque d\'atteinte aux droits fondamentaux (Article 5)');
      return {level:'Risque inacceptable', score:null, reasons, obligations:['Interdiction probable — arrêter le déploiement, consulter un juriste.'], articles:['Article 5']};
    }
    if(answers.q6==='yes' && answers.q3==='yes'){
      // surveillance biométrique sur données sensibles -> très critique
      reasons.push('Surveillance / reconnaissance faciale sur données sensibles — attention aux interdictions');
      // don't immediately return, mark high
      score += 5;
    }

    // Pondérations par question
    const weights = {q1:3,q2:2,q3:3,q4:1,q5:1,q6:3,q7:3,q9:1,q10:3};
    Object.keys(weights).forEach(k => {
      if(answers[k] === 'yes'){
        score += weights[k];
        // ajouter motifs lisibles
        switch(k){
          case 'q1': reasons.push('Décisions juridiques/administratives sensibles'); break;
          case 'q2': reasons.push('Usage en recrutement / sélection (Annexe III)'); break;
          case 'q3': reasons.push('Traitement de données biométriques / santé sensibles'); break;
          case 'q4': reasons.push('Modèle génératif — obligations de transparence'); break;
          case 'q5': reasons.push('Nécessite traçabilité / journaux (Article 12)'); break;
          case 'q6': reasons.push('Surveillance ou contrôle du comportement des personnes'); break;
          case 'q7': reasons.push('Impact sur la santé ou la sécurité des personnes'); break;
          case 'q9': reasons.push('Modèle fourni à des tiers (GPAI) — exigences de transparence'); break;
          case 'q10': reasons.push('Décisions automatisées affectant droits fondamentaux'); break;
        }
      }
    });

    // Déterminer niveau
    let level='Risque minimal';
    let obligations=[];
    const articles = new Set();
    if(score>=8){ level='Haut Risque';
      obligations = ['Système de gestion des risques (Article 9)','Documentation technique complète (Annexe IV)','Évaluation de conformité externe','Enregistrement (Article 51)'];
      ['Article 9','Annexe IV','Article 51','Article 10'].forEach(a=>articles.add(a));
    } else if(score>=5){ level='Risque élevé';
      obligations = ['Auto-évaluation guidée (Article 19)','Journalisation / Traçabilité (Article 12)','Mesures d\'atténuation et tests sur biais'];
      ['Article 19','Article 12','Annexe VI'].forEach(a=>articles.add(a));
    } else if(score>=2){ level='Risque limité';
      obligations = ['Transparence et notice utilisateur','Mesures de sécurité et RGPD'];
      ['Titre IV','Article 13'].forEach(a=>articles.add(a));
    } else { level='Risque minimal'; obligations = ['Aucune obligation renforcée identifiée']; }

    return {level,score,reasons,obligations,articles: Array.from(articles)};
  }

  computeBtn.addEventListener('click',()=>{
    const form = document.getElementById('quiz');
    const data = Object.fromEntries(new FormData(form));
    const result = classify(data);
    const html=[];
    html.push(`<p><strong>Niveau estimé :</strong> ${result.level}</p>`);
    if(result.score!==null) html.push(`<p><strong>Score :</strong> ${result.score}</p>`);
    if(result.articles && result.articles.length){ html.push('<p><strong>Articles / Annexes applicables :</strong></p><ul>' + result.articles.map(a=>`<li>${a}</li>`).join('') + '</ul>') }
    if(result.reasons && result.reasons.length){html.push('<p><strong>Motifs :</strong></p><ul>' + result.reasons.map(r=>`<li>${r}</li>`).join('') + '</ul>')}
    if(result.obligations && result.obligations.length){html.push('<p><strong>Obligations principales :</strong></p><ul>' + result.obligations.map(o=>`<li>${o}</li>`).join('') + '</ul>')}
    html.push('<p>Ce diagnostic est indicatif — se référer au texte complet du RIA et consulter un juriste pour décisions formelles.</p>');
    reportEl.innerHTML = html.join('\n');
    exportBtn.disabled = false;
    // store last result for export and attempt to persist via API
    window.__lastReport = {meta:{date:new Date().toISOString()},answers:data,result};
    // POST to backend to store diagnostic (non-blocking)
    fetch('/api/v1/diagnostics',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({system:{name:document.querySelector('input[name="system_name"]')?.value||'SIA non nommé'},answers:data,result})})
      .then(r=>r.json())
      .then(j=>{
        if(j && j.id){
          const link = document.createElement('a');
          link.href = `/api/v1/diagnostics/${j.id}`;
          link.textContent = `Enregistré (id: ${j.id}) — voir JSON`;
          link.target='_blank';
          reportEl.appendChild(document.createElement('hr'));
          reportEl.appendChild(link);
        }
      }).catch(()=>{});
    location.hash = '#resultat';
  });

  exportBtn.addEventListener('click',async()=>{
    const payload = window.__lastReport;
    if(!payload) return;
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text('RIA Check & Go - Rapport de diagnostic',14,18);
    doc.setFontSize(11);
    doc.text(`Date: ${payload.meta.date}`,14,26);
    doc.text(`Niveau estimé: ${payload.result.level}`,14,36);
    if(payload.result.score!==null) doc.text(`Score: ${payload.result.score}`,14,44);
    let y=54;
    if(payload.result.articles && payload.result.articles.length){doc.text('Articles / Annexes applicables:',14,y); y+=6; payload.result.articles.forEach(a=>{doc.text('- '+a,16,y); y+=6});}
    if(payload.result.reasons && payload.result.reasons.length){y+=2; doc.text('Motifs:',14,y); y+=6; payload.result.reasons.forEach(r=>{doc.text('- '+r,16,y); y+=6});}
    if(payload.result.obligations && payload.result.obligations.length){y+=4; doc.text('Obligations principales:',14,y); y+=6; payload.result.obligations.forEach(o=>{doc.text('- '+o,16,y); y+=6});}
    doc.save('ria-check-report.pdf');
  });

  contactForm.addEventListener('submit',e=>{
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(contactForm));
    // Post to backend contact endpoint
    fetch('/api/v1/contact',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({company:fd.company,email:fd.email,message:fd.message})})
      .then(r=>r.json())
      .then(j=>{
        if(j && j.ok){
          document.getElementById('contactResult').innerHTML = `<p>Demande reçue pour <strong>${fd.company}</strong>. Référence: ${j.id}. Nous contacterons ${fd.email} sous 48h.</p>`;
          contactForm.reset();
        } else {
          document.getElementById('contactResult').innerHTML = `<p>Erreur lors de l'envoi. Essayez plus tard.</p>`;
        }
      }).catch(()=>{ document.getElementById('contactResult').innerHTML = `<p>Erreur réseau lors de l'envoi.</p>` });
  });
})();
