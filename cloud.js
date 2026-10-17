/* Laboratório da Água — autenticação e acompanhamento online.
   Front-end estático no GitHub Pages; autenticação e dados privados no Supabase.
   NUNCA armazene chaves secret/service_role neste repositório.
*/
(() => {
  'use strict';
  const cfg = window.LAB_CONFIG || {};
  const configured = Boolean(cfg.supabaseUrl && cfg.supabasePublishableKey);
  const el = id => document.getElementById(id);
  const accountBar = el('accountbar');
  const loginGate = el('loginGate');
  const cloudBanner = el('cloudBanner');
  const navDashboard = el('nav-dashboard');
  let client = null;
  let currentUser = null;
  let currentProfile = null;

  function showLoginStatus(message, isError = false) {
    const box = el('loginStatus');
    box.textContent = message;
    box.className = message ? `statusline ${isError ? 'error' : ''}` : '';
  }
  function showSyncStatus(message, isError = false) {
    cloudBanner.textContent = message;
    cloudBanner.style.display = 'block';
    cloudBanner.style.background = isError ? '#fdece9' : '#e6f6f1';
    cloudBanner.style.color = isError ? '#963e37' : '#23554d';
  }
  function setLocked(locked) {
    document.body.classList.toggle('cloud-locked', locked);
    loginGate.classList.toggle('hide', !locked);
    accountBar.classList.toggle('hide', locked);
  }
  function resetQuizUI() {
    if (typeof resetTest === 'function') resetTest();
  }

  async function loadCurrent() {
    const { data: authResult, error: authError } = await client.auth.getUser();
    if (authError || !authResult?.user) throw new Error('Sessão expirada. Entre novamente.');
    const user = authResult.user;
    const { data: profile, error: profileError } = await client
      .from('profiles').select('id, display_name, role').eq('id', user.id).single();
    if (profileError || !profile) {
      throw new Error('Conta criada sem perfil. Consulte README e configure a tabela profiles no Supabase.');
    }
    currentUser = user;
    currentProfile = profile;
    window.LAB_CURRENT_USER_ID = user.id;
    await syncProgressFromCloud();
    el('accountLabel').textContent = `👤 ${profile.display_name} · ${profile.role === 'guardian' ? 'Responsável' : 'Aluno(a)'}`;
    navDashboard.classList.toggle('hide', profile.role !== 'guardian');
    el('homeSaveNote').textContent = 'Seu progresso fica salvo na sua conta e aparece no painel dos responsáveis.';
    el('testSaveNote').textContent = 'Ao finalizar, sua nota é salva na sua conta e pode ser acompanhada pelos responsáveis. Você pode refazer a avaliação.';
    setLocked(false);
    cloudBanner.style.display = 'none';
    resetQuizUI();
    go('home');
    sync();
  }

  async function syncProgressFromCloud() {
    const { data: progress, error: pErr } = await client.from('module_progress')
      .select('module_no').eq('user_id', currentUser.id);
    if (pErr) throw pErr;
    const { data: attempts, error: aErr } = await client.from('exam_attempts')
      .select('score').eq('user_id', currentUser.id);
    if (aErr) throw aErr;
    const local = getState();
    const remoteDone = (progress || []).map(p => p.module_no);
    const mergedDone = [...new Set([...remoteDone, ...local.done])].sort((a,b) => a-b);
    const remoteBest = (attempts || []).length ? Math.max(...attempts.map(a=>a.score)) : null;
    const best = remoteBest === null ? local.best : local.best === null ? remoteBest : Math.max(local.best, remoteBest);
    setState({ done: mergedDone, best });
    // Se a rede caiu durante uma aula anterior, sincroniza os módulos salvos localmente.
    const toPush = mergedDone.filter(i => !remoteDone.includes(i));
    for (const i of toPush) {
      const { error } = await client.from('module_progress').upsert(
        {user_id: currentUser.id, module_no: i, completed_at: new Date().toISOString()},
        {onConflict:'user_id,module_no'}
      );
      if (error) showSyncStatus('Alguns módulos ainda não foram sincronizados. Recarregue quando houver conexão.', true);
    }
  }

  window.cloudModuleCompleted = async (moduleNo) => {
    if (!currentUser) return;
    try {
      const { error } = await client.from('module_progress').upsert(
        {user_id: currentUser.id, module_no: moduleNo, completed_at:new Date().toISOString()},
        {onConflict:'user_id,module_no'}
      );
      if (error) throw error;
    } catch (err) {
      showSyncStatus('Não foi possível enviar este módulo. Ele ficou salvo neste dispositivo e tentará sincronizar na próxima entrada.', true);
      console.warn('Falha de sincronização do módulo', err);
    }
  };

  window.cloudExamCompleted = async (score, total) => {
    if (!currentUser) return;
    try {
      const {error} = await client.from('exam_attempts').insert(
        { user_id:currentUser.id, score, total }
      );
      if (error) throw error;
      if (currentProfile?.role === 'guardian' && !el('dashboard').classList.contains('hide')) await refreshDashboard();
    } catch (err) {
      showSyncStatus('ATENÇÃO: não foi possível registrar a nota online. Verifique sua conexão e refaça a avaliação para registrar uma tentativa.', true);
      console.warn('Falha ao gravar avaliação', err);
    }
  };

  function makeCell(tr, value) {
    const td = document.createElement('td');
    td.textContent = value == null ? '—' : String(value);
    tr.appendChild(td);
    return td;
  }
  function stamp(iso) {
    if (!iso) return '—';
    const date = new Date(iso);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleString('pt-BR', {day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit'});
  }
  function labelScore(record) {
    if (!record) return '—';
    return `${record.score}/${record.total} (${Math.round(100 * record.score/record.total)}%)`;
  }
  async function refreshDashboard() {
    if (!currentUser || currentProfile?.role !== 'guardian') return;
    el('dashboardStatus').textContent = 'Consultando o acompanhamento...';
    const [pr, mo, ex] = await Promise.all([
      client.from('profiles').select('id,display_name,role').order('display_name'),
      client.from('module_progress').select('user_id,module_no,completed_at'),
      client.from('exam_attempts').select('user_id,score,total,created_at').order('created_at',{ascending:false})
    ]);
    const problem = [pr,mo,ex].find(v => v.error)?.error;
    if (problem) {
      el('dashboardStatus').textContent = 'Não foi possível carregar o painel. Verifique a conexão e as políticas RLS do projeto.';
      console.warn('Painel:',problem);
      return;
    }
    const profiles = pr.data || [];
    const modules = mo.data || [];
    const exams = ex.data || [];
    const participants = [...profiles].sort((a,b)=>(a.role === 'student' ? 0 : 1)-(b.role === 'student' ? 0 : 1)||a.display_name.localeCompare(b.display_name, 'pt-BR'));
    const body = el('dashboardRows');
    body.replaceChildren();
    for (const person of participants) {
      const done = modules.filter(row => row.user_id === person.id);
      const tries = exams.filter(row => row.user_id === person.id);
      const best = tries.length ? [...tries].sort((a,b)=> b.score / b.total - a.score / a.total)[0] : null;
      const last = tries.length ? tries[0] : null;
      const dates = [...done.map(x=>x.completed_at),...tries.map(x=>x.created_at)].filter(Boolean).sort().reverse();
      const tr = document.createElement('tr');
      const nameCell = makeCell(tr,person.display_name);
      const history = document.createElement('details');
      const summary = document.createElement('summary');
      summary.textContent = 'Ver módulos e histórico';
      summary.className = 'small';
      history.appendChild(summary);
      const detail = document.createElement('div');
      detail.className = 'small muted';
      const doneNums = [...new Set(done.map(x=>x.module_no))].sort((a,b)=>a-b);
      const scores = tries.slice(0,6).map(x=>`${stamp(x.created_at)}: ${labelScore(x)}`);
      detail.textContent = `Módulos: ${doneNums.length ? doneNums.join(', ') : 'nenhum'} • Últimas notas: ${scores.length ? scores.join(' | ') : 'nenhuma'}`;
      history.appendChild(detail);
      nameCell.appendChild(history);
      const role = makeCell(tr,person.role==='guardian'?'Responsável':'Aluno(a)');
      role.className = person.role==='guardian'?'tag-adult':'tag-student';
      makeCell(tr,`${new Set(done.map(x=>x.module_no)).size}/5`);
      makeCell(tr,labelScore(best));
      makeCell(tr,labelScore(last));
      makeCell(tr,tries.length);
      makeCell(tr,stamp(dates[0]));
      body.appendChild(tr);
    }
    const students = profiles.filter(p=>p.role==='student');
    const ids = new Set(students.map(p=>p.id));
    el('metricStudents').textContent = students.length;
    el('metricModules').textContent = `${modules.filter(m=>ids.has(m.user_id)).length}/${5*students.length}`;
    el('metricAttempts').textContent = exams.filter(e=>ids.has(e.user_id)).length;
    el('dashboardUpdated').textContent = `Atualizado ${new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}`;
    el('dashboardStatus').textContent = participants.length ? '' : 'Ainda não há perfis cadastrados.';
  }
  el('dashboardRefresh').addEventListener('click', refreshDashboard);

  el('loginProfile').addEventListener('change', (e) => {
    const adult = e.target.value === 'adulto';
    el('adultEmailField').classList.toggle('hide',!adult);
    el('adultEmail').required = adult;
  });
  el('loginForm').addEventListener('submit', async (evt) => {
    evt.preventDefault();
    if (!client) return;
    const choice = el('loginProfile').value;
    const email = choice === 'adulto' ? el('adultEmail').value.trim() : choice;
    const password = el('loginPassword').value;
    if (!email || !password) return;
    const button = el('loginBtn');
    button.disabled = true;
    showLoginStatus('Autenticando e buscando suas informações...');
    try {
      const {error} = await client.auth.signInWithPassword({email,password});
      if(error) throw error;
      await loadCurrent();
      showLoginStatus('');
      el('loginPassword').value = '';
    } catch (err) {
      showLoginStatus('Não foi possível entrar. Verifique os dados e se os perfis já foram cadastrados no Supabase.',true);
      console.warn('Login falhou:',err);
      await client.auth.signOut();
    } finally {button.disabled=false;}
  });
  el('logoutBtn').addEventListener('click', async () => {
    if (client) await client.auth.signOut();
    currentUser = null; currentProfile = null;
    window.LAB_CURRENT_USER_ID = null;
    navDashboard.classList.add('hide');
    el('loginForm').reset();
    el('adultEmailField').classList.add('hide');
    showLoginStatus('');
    sync();
    setLocked(true);
    el('loginProfile').focus();
  });

  async function init() {
    if (!configured) {
      cloudBanner.style.display = 'block';
      return;
    }
    setLocked(true);
    cloudBanner.style.display = 'none';
    if (!window.supabase || !window.supabase.createClient) {
      showLoginStatus('A biblioteca de conexão não carregou. Verifique a internet e atualize a página.',true);
      return;
    }
    client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabasePublishableKey, {
      auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}
    });
    try {
      const {data:{session},error} = await client.auth.getSession();
      if (error) throw error;
      if (session) await loadCurrent();
    } catch (err) {
      console.warn('Sessão não carregada:',err);
      await client.auth.signOut();
      showLoginStatus('Entre com sua conta para acompanhar os estudos.');
    }
  }
  init();
})();
