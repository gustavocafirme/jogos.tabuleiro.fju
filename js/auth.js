function checkSavedSession() {
  let savedToken = localStorage.getItem('app_session_token');
  let savedUser = localStorage.getItem('app_session_user');

  if (!savedToken) {
    savedToken = sessionStorage.getItem('app_session_token');
    savedUser = sessionStorage.getItem('app_session_user');
  }

  if (savedToken && savedUser) {
    state.currentSessionToken = savedToken;
    state.currentUser = JSON.parse(savedUser);
    setupAppInterface();
  }
}

async function login() {
  const uVal = document.getElementById('loginUser').value.trim();
  const pVal = document.getElementById('loginPass').value;
  const remember = document.getElementById('rememberMe').checked;
  const btnLogin = document.getElementById('btnLogin');

  if (!uVal || !pVal) return alert('Informe o usuário e a senha!');

  const originalText = btnLogin.innerText;
  btnLogin.innerText = "Entrando...";
  btnLogin.disabled = true;
  btnLogin.classList.add('form-disabled');

  try {
    const data = await postAction({
      action: 'login',
      username: uVal,
      password: pVal,
      remember: remember
    });

    if (data.status === 'success') {
      state.currentUser = data.user;
      state.currentSessionToken = data.token;

      if (remember) {
        localStorage.setItem('app_session_token', state.currentSessionToken);
        localStorage.setItem('app_session_user', JSON.stringify(state.currentUser));
      } else {
        sessionStorage.setItem('app_session_token', state.currentSessionToken);
        sessionStorage.setItem('app_session_user', JSON.stringify(state.currentUser));
      }

      setupAppInterface();
    } else {
      alert(data.message || 'Falha no login.');
    }
  } catch (err) {
    console.error("Erro no login:", err);
    alert("Erro de conexão ao tentar realizar o login.");
  } finally {
    btnLogin.innerText = originalText;
    btnLogin.disabled = false;
    btnLogin.classList.remove('form-disabled');
  }
}

function loginAsViewer() {
  state.currentUser = { username: "Visitante", role: "visualizador" };
  state.currentSessionToken = null;
  setupAppInterface();
}

function logout() {
  localStorage.removeItem('app_session_token');
  localStorage.removeItem('app_session_user');
  sessionStorage.removeItem('app_session_token');
  sessionStorage.removeItem('app_session_user');

  state.currentUser = null;
  state.currentSessionToken = null;
  state.isFirstLoad = true;

  document.getElementById('appScreen').classList.add('hidden');
  document.getElementById('loginScreen').classList.remove('hidden');
  document.getElementById('loginPass').value = '';
  document.getElementById('loginUser').value = '';
}

function setupAppInterface() {
  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('appScreen').classList.remove('hidden');
  
  document.getElementById('userDisplay').innerText = state.currentUser.username;
  document.getElementById('roleDisplay').innerText = `(${state.currentUser.role})`;

  const roles = ['admin', 'subadmin', 'auxiliar', 'visualizador'];
  roles.forEach(r => {
    document.querySelectorAll(`.role-${r}`).forEach(el => el.classList.add('hidden'));
  });

  if (state.currentUser.role === 'admin') {
    document.querySelectorAll('.role-admin').forEach(el => el.classList.remove('hidden'));
  } else if (state.currentUser.role === 'subadmin') {
    document.querySelectorAll('.role-subadmin').forEach(el => el.classList.remove('hidden'));
  } else if (state.currentUser.role === 'auxiliar') {
    document.querySelectorAll('.role-auxiliar').forEach(el => el.classList.remove('hidden'));
  }

  document.querySelectorAll('.admin-only').forEach(el => {
    if (state.currentUser.role !== 'admin') el.classList.add('hidden');
    else el.classList.remove('hidden');
  });

  switchSection('ranking');
  loadData();
}