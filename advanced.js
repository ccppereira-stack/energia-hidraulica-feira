/* Laboratório da Água: extensão do nível 2. O nível 1 permanece com sua avaliação original.
   Todas as gravações online passam por RLS no Supabase; nenhum segredo é armazenado no browser.
*/
(() => {
'use strict';
const COURSE = window.LAB_ADVANCED_DATA;
const $ = id => document.getElementById(id);
const note = s => { $('advancedStatus').textContent = s || ''; };
const state = { uid:null, role:null, allowed:false, checked:false, progress:[], attempts:[], active:1, current:null, questions:[], run:0, busy:false };
const LOCAL_KEY = 'hidraulica-avancado-2026-v2';
const client = () => window.LAB_CLOUD_CLIENT || null;
const userKey = () => `${LOCAL_KEY}:${state.uid||'visitante'}`;
function localState(){try{return JSON.parse(localStorage.getItem(userKey()))||{progress:[],attempts:[],run:0}}catch{return {progress:[],attempts:[],run:0}}}
function saveLocal(x){try{localStorage.setItem(userKey(),JSON.stringify(x))}catch(e){console.warn('Sem armazenamento local',e)}}
const pct = (score,total) => total ? Math.round(100*score/total) : 0;
const showScore = row => row ? `${row.score}/${row.total} (${pct(row.score,row.total)}%)` : '—';
const safe = t => String(t).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rich = t => String(t).replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>');
function shuffle(a){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[j],a[i]]=[a[i],a[j]]}return a;}
function allAttemptsFor(mod){return state.attempts.filter(a=>a.module_no===mod)}
function bestFor(mod){return [...allAttemptsFor(mod)].sort((a,b)=>pct(b.score,b.total)-pct(a.score,a.total))[0]||null}
function isStudied(mod){return state.progress.some(p=>Number(p.module_no)===mod)}
function paintGate(){
 $('advancedLocked').classList.toggle('hide',state.allowed);
 $('advancedUnlocked').classList.toggle('hide',!state.allowed);
 $('advancedGateBadge').textContent=state.allowed?'✓ Nível avançado liberado':state.checked?'🔒 É necessário atingir 80% na avaliação inicial':'Verificando a avaliação inicial…';
 if(state.allowed) paintCards();
}
async function checkEligibility(){
 state.checked=false;note('Verificando seu resultado inicial…');paintGate();
 const c=client();
 if(c && state.uid){
  const {data,error}=await c.from('exam_attempts').select('score,total').eq('user_id',state.uid);
  if(error){state.checked=true;state.allowed=false;note('Não foi possível conferir seu resultado no Supabase. Tente atualizar.');paintGate();return}
  // Exame inicial (versão 1): 16 questões. 13/16 equivale a 81,25%.
  state.allowed=(data||[]).some(a=>a.total===16 && a.score>=13);
 } else if(c){state.allowed=false}
 else {const s=typeof getState==='function'?getState():{};state.allowed=Number(s.best)>=13;}
 state.checked=true;
 note(state.allowed?'Você concluiu a avaliação inicial com o aproveitamento necessário. Parabéns!':'Conclua a avaliação inicial com pelo menos 13 acertos em 16 perguntas para liberar este nível.');
 paintGate();
 if(state.allowed) await loadPersonal();
}
async function loadPersonal(){
 const c=client();
 if(c && state.uid){
  const [p,a]=await Promise.all([
   c.from('advanced_progress').select('module_no,completed_at').eq('user_id',state.uid),
   c.from('advanced_attempts').select('module_no,score,total,created_at,concept_results').eq('user_id',state.uid).order('created_at',{ascending:false})
  ]);
  if(p.error||a.error){note('O nível 2 ainda precisa da atualização SQL no Supabase. Veja README_V2.md.');return}
  state.progress=p.data||[];state.attempts=a.data||[];state.run=localState().run||0;
 }else {const s=localState();state.progress=s.progress||[];state.attempts=s.attempts||[];state.run=s.run||0;}
 paintCards();
}
function paintCards(){
 const el=$('advancedCards');el.replaceChildren();
 COURSE.modules.forEach((m,i)=>{
  const n=i+1, done=isStudied(n), best=bestFor(n), card=document.createElement('button');
  card.type='button';card.className='modulecard advanced-card';
  card.innerHTML=`<span class="num">MÓDULO ${n}</span><h3>${safe(m.title)}</h3><p>${safe(m.subtitle)}</p><p class="small"><strong>${done?'✓ Estudado':'○ Ainda não marcado'}</strong> · Melhor avaliação: <strong>${showScore(best)}</strong></p>`;
  card.addEventListener('click',()=>openModule(n));el.appendChild(card);
 });
 const final=bestFor(0),attempts=allAttemptsFor(0);
 $('advancedSummary').textContent=`Módulos marcados como estudados: ${state.progress.length}/5 · Avaliações por módulo: ${state.attempts.filter(a=>a.module_no>0).length} · Avaliação geral: ${attempts.length} tentativa(s), melhor ${showScore(final)}.`;
}
function showArea(part){
 ['advancedOverview','advancedLesson','advancedQuiz'].forEach(id=>$(id).classList.toggle('hide',id!==part));
}
function openModule(n){
 if(!state.allowed){showArea('advancedOverview');return}
 state.active=n;const m=COURSE.modules[n-1];$('advancedLessonTitle').textContent=`Módulo ${n} · ${m.title}`;
 const sections=$('advancedSections');sections.replaceChildren();
 if(m.photo){const fig=document.createElement('figure');fig.className='advanced-photo';const im=document.createElement('img');im.src=m.photo;im.alt=`Maquete de ${n===3?'acumulação':'fio d’água'} construída pelo grupo`;im.loading='lazy';const cap=document.createElement('figcaption');cap.textContent=`Maquete do próprio grupo — ${n===3?'usina de acumulação':'usina a fio d’água'}.`;fig.append(im,cap);sections.appendChild(fig)}
 m.sections.forEach((sec)=>{const box=document.createElement('article');box.className='advanced-section';const h=document.createElement('h3');h.textContent=sec[0];const p=document.createElement('p');p.innerHTML=rich(sec[1]);box.append(h,p);sections.appendChild(box)});
 if(m.sources?.length){const sources=document.createElement('div');sources.className='advanced-section';const h=document.createElement('h3');h.textContent='Para pesquisar e confirmar';sources.appendChild(h);const ul=document.createElement('ul');m.sources.forEach(([label,url])=>{const li=document.createElement('li'),a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener noreferrer';a.textContent=label;li.appendChild(a);ul.appendChild(li)});sources.appendChild(ul);sections.appendChild(sources)}
 $('advancedStudiedLabel').textContent=isStudied(n)?'✓ Módulo já marcado como estudado':'Você pode marcar o estudo antes de fazer a avaliação.';
 $('advancedModuleBest').textContent=`Seu melhor resultado neste módulo: ${showScore(bestFor(n))}. Precisa acertar 4 de 5 para atingir 80%.`;
 $('advancedStartQuiz').disabled=!isStudied(n);
 showArea('advancedLesson');document.getElementById('advanced').scrollIntoView({behavior:'instant',block:'start'});
}
async function markStudied(){
 const n=state.active;if(!state.allowed)return;
 if(isStudied(n))return;
 const c=client();
 if(c && state.uid){
  const {error}=await c.from('advanced_progress').upsert({user_id:state.uid,module_no:n},{onConflict:'user_id,module_no'});
  if(error){$('advancedStudiedLabel').textContent='Não foi possível registrar no Supabase. Verifique a conexão e a migração SQL.';return;}
  state.progress.push({module_no:n,completed_at:new Date().toISOString()});
 }else {state.progress.push({module_no:n,completed_at:new Date().toISOString()});const s=localState();s.progress=state.progress;saveLocal(s)}
 $('advancedStudiedLabel').textContent='✓ Módulo marcado como estudado';$('advancedStartQuiz').disabled=false;paintCards();
}
function buildQuestion(source,variation){
 const indexes=shuffle([0,1,2,3]);
 return {q:source.stems[variation%3],opts:indexes.map(i=>source.options[i]),correct:indexes.indexOf(source.answer),why:source.why};
}
function buildSet(module){
 state.run+=1;const s=localState();s.run=state.run;saveLocal(s);
 if(module===0){
  const pool=[];
  for(let n=1;n<=5;n++){
   const indexes=shuffle([0,1,2,3,4]).slice(0,3);
   indexes.forEach(j=>pool.push({mod:n,concept:j,source:COURSE.bank[n-1][j]}));
  }
  return shuffle(pool.map(x=>({...buildQuestion(x.source,(state.run+x.concept+x.mod)%3),mod:x.mod,concept:x.concept})));
 }
 return shuffle(COURSE.bank[module-1].map((x,j)=>({...buildQuestion(x,(state.run+j)%3),mod:module,concept:j})));
}
function openQuiz(module){
 if(!state.allowed)return;
 if(module!==0&&!isStudied(module))return;
 if(module===0&&state.progress.length!==5){note('Conclua a leitura dos 5 módulos avançados antes da avaliação geral.');return}
 state.active=module;state.questions=buildSet(module);state.current=module;
 $('advancedQuizTitle').textContent=module===0?'Avaliação geral avançada · 15 questões':`Avaliação do módulo ${module} · 5 questões`;
 $('advancedQuizContext').textContent=module===0?'As questões são escolhidas entre os cinco módulos. Para atingir 80%, acerte ao menos 12 de 15.':'As perguntas variam entre três versões de cada conceito e as alternativas mudam de ordem. Para atingir 80%, acerte ao menos 4 de 5.';
 const form=$('advancedQuizForm');form.replaceChildren();
 state.questions.forEach((q,i)=>{
  const field=document.createElement('fieldset');field.className='question';
  const legend=document.createElement('legend');legend.textContent=`${i+1}. ${q.q}`;field.appendChild(legend);
  q.opts.forEach((o,j)=>{const label=document.createElement('label'),radio=document.createElement('input'),span=document.createElement('span');radio.type='radio';radio.name=`adv${i}`;radio.value=String(j);radio.required=true;span.textContent=o;label.append(radio,span);field.appendChild(label)});
  const feedback=document.createElement('div');feedback.id=`advfeedback${i}`;feedback.className='feedback hidden';field.appendChild(feedback);
  form.appendChild(field);
 });
 const submit=document.createElement('button');submit.className='button';submit.type='submit';submit.id='advancedSubmit';submit.textContent='Corrigir avaliação ✓';form.appendChild(submit);
 $('advancedQuizResult').classList.add('hide');showArea('advancedQuiz');document.getElementById('advanced').scrollIntoView({behavior:'instant',block:'start'});
}
async function submitQuiz(evt){
 evt.preventDefault();if(state.busy)return;
 const selections=new FormData(evt.currentTarget), results=[];
 for(let i=0;i<state.questions.length;i++){
  const value=selections.get(`adv${i}`);if(value===null){note('Responda todas as perguntas antes de corrigir.');return}
  const q=state.questions[i],good=Number(value)===q.correct;
  results.push({module:q.mod,concept:q.concept,correct:good});
 }
 state.busy=true;$('advancedSubmit').disabled=true;
 const score=results.filter(r=>r.correct).length,total=results.length,now=new Date().toISOString();
 const attempt={module_no:state.current,score,total,created_at:now,concept_results:results};
 const c=client();
 if(c && state.uid){
  const {error}=await c.from('advanced_attempts').insert({user_id:state.uid,module_no:attempt.module_no,score,total,concept_results:results});
  if(error){state.busy=false;$('advancedSubmit').disabled=false;note('Não foi possível gravar esta avaliação online. Verifique a conexão e a atualização SQL. Nenhuma nota foi registrada.');return}
 }else {const s=localState();s.attempts=[attempt,...(s.attempts||[])];saveLocal(s)}
 state.attempts.unshift(attempt);paintCards();
 state.questions.forEach((q,i)=>{const feedback=$(`advfeedback${i}`);feedback.className='feedback '+(results[i].correct?'':'bad');feedback.textContent=(results[i].correct?'✓ Acertou. ':'✕ Resposta correta: '+q.opts[q.correct]+'. ')+q.why;});
 evt.currentTarget.querySelectorAll('input').forEach(x=>x.disabled=true);
 const result=$('advancedQuizResult');result.classList.remove('hide');
 result.replaceChildren();const h=document.createElement('h2');h.textContent=`Resultado: ${score}/${total} (${pct(score,total)}%)`;const p=document.createElement('p');p.textContent=pct(score,total)>=80?'Aproveitamento de 80% ou mais! Você dominou os conceitos avaliados.':'Estude as explicações das respostas e tente uma nova versão para melhorar.';
 const footer=document.createElement('p');footer.textContent='Sua tentativa foi registrada e pode ser acompanhada pelos responsáveis. As próximas perguntas podem mudar.';
 const again=document.createElement('button');again.type='button';again.className='button secondary';again.textContent='Fazer uma nova versão';again.addEventListener('click',()=>openQuiz(state.current));
 result.append(h,p,footer,again);state.busy=false;note('');
}
async function refreshDashboard(){
 const box=$('advancedDashboard');if(!box||state.role!=='guardian')return;
 box.classList.remove('hide');$('advancedDashboardStatus').textContent='Buscando resultados do nível avançado…';
 const c=client();if(!c){$('advancedDashboardStatus').textContent='Painel online disponível após conectar o Supabase.';return}
 const [users, progress, attempts, basic]=await Promise.all([
  c.from('profiles').select('id,display_name,role'),
  c.from('advanced_progress').select('user_id,module_no,completed_at'),
  c.from('advanced_attempts').select('user_id,module_no,score,total,concept_results,created_at').order('created_at',{ascending:false}),
  c.from('exam_attempts').select('user_id,score,total')
 ]);
 if([users,progress,attempts,basic].some(x=>x.error)){$('advancedDashboardStatus').textContent='Não foi possível carregar o nível avançado; confira se a migração SQL foi aplicada.';return}
 const students=users.data.filter(x=>x.role==='student');const rows=$('advancedDashboardRows');rows.replaceChildren();
 const append=(tr,value)=>{const td=document.createElement('td');td.textContent=value;tr.appendChild(td);return td};
 [...students,...users.data.filter(x=>x.role==='guardian')].forEach(person=>{
  const p=progress.data.filter(x=>x.user_id===person.id),a=attempts.data.filter(x=>x.user_id===person.id);
  const b=basic.data.filter(x=>x.user_id===person.id&&x.total===16);
  const passed=b.some(x=>x.score>=13);
  const best=x=>[...a.filter(t=>t.module_no===x)].sort((l,r)=>pct(r.score,r.total)-pct(l.score,l.total))[0];
  const tr=document.createElement('tr');const name=append(tr,person.display_name);
  append(tr,passed?'✓':'🔒');append(tr,`${new Set(p.map(x=>x.module_no)).size}/5`);
  for(let n=1;n<=5;n++)append(tr,showScore(best(n)));
  append(tr,showScore(best(0)));
  const details=document.createElement('details');const summary=document.createElement('summary');summary.textContent=`Histórico (${a.length} tentativas)`;summary.className='small';details.appendChild(summary);
  const hist=document.createElement('p');hist.className='small muted';hist.textContent=a.slice(0,12).map(x=>`${x.module_no===0?'Geral':'M'+x.module_no}: ${showScore(x)} em ${new Date(x.created_at).toLocaleDateString('pt-BR')}`).join(' · ')||'Nenhuma avaliação avançada registrada.';details.appendChild(hist);name.appendChild(details);
  rows.appendChild(tr);
 });
 // Agregação por matéria: erro/acerto em conceitos. Ajuda a identificar dificuldades individuais.
 const area=$('advancedInsights');area.replaceChildren();
 students.forEach(person=>{
  const a=attempts.data.filter(x=>x.user_id===person.id && x.module_no>0);
  const stats=[1,2,3,4,5].map(n=>{
   const list=a.filter(t=>t.module_no===n).flatMap(t=>(t.concept_results||[]));
   return {module:n,total:list.length,hits:list.filter(x=>x.correct).length};
  }).filter(x=>x.total);
  if(!stats.length)return;
  const p=document.createElement('p');p.className='small';p.textContent=`${person.display_name}: `+stats.map(x=>`M${x.module}: ${pct(x.hits,x.total)}% nos itens respondidos`).join(' · ');area.appendChild(p);
 });
 $('advancedDashboardStatus').textContent='Notas e desempenho separados por módulo; responsáveis não se misturam às estatísticas dos alunos.';
}
window.labAdvancedRefresh=()=>checkEligibility();
window.labAdvancedDashboardRefresh=refreshDashboard;
window.addEventListener('lab-auth-changed',evt=>{
 const d=evt.detail||{};state.uid=d.id||null;state.role=d.role||null;state.progress=[];state.attempts=[];state.checked=false;state.allowed=false;
 paintGate();if(state.uid)checkEligibility();
 if(!state.uid)$('advancedDashboard').classList.add('hide');
});
$('advancedBack').addEventListener('click',()=>showArea('advancedOverview'));
$('advancedBackQuiz').addEventListener('click',()=>state.current===0?showArea('advancedOverview'):openModule(state.current));
$('advancedMarkStudy').addEventListener('click',markStudied);
$('advancedStartQuiz').addEventListener('click',()=>openQuiz(state.active));
$('advancedFinalQuiz').addEventListener('click',()=>openQuiz(0));
$('advancedQuizForm').addEventListener('submit',submitQuiz);
$('advancedDashboardReload').addEventListener('click',refreshDashboard);
// Modo de uso local para quem ainda não configurou nuvem.
if(window.LAB_CURRENT_USER_ID){state.uid=window.LAB_CURRENT_USER_ID;state.role=window.LAB_CURRENT_PROFILE?.role||null;checkEligibility();}
else if(!(window.LAB_CONFIG?.supabaseUrl && window.LAB_CONFIG?.supabasePublishableKey))checkEligibility();
})();
