/**
 * Inicializador da janela: verifica se há uma sessão ativa armazenada.
 */
window.onload = function() {
  checkSavedSession();
};

/**
 * Carrega todos os dados da API (rankings, backups e histórico) e atualiza a interface.
 */
async function loadData() {
  const btnRefresh = document.getElementById('btnRefresh');
  if (btnRefresh) btnRefresh.style.display = 'none';

  if (state.refreshTimeout) clearTimeout(state.refreshTimeout);

  document.getElementById('registrarLoadingTag').classList.remove('hidden');
  document.getElementById('sec-registrar').classList.add('form-disabled');

  document.getElementById('adicionarLoadingTag').classList.remove('hidden');
  document.getElementById('adicionarContainer').classList.add('form-disabled');

  document.getElementById('backupLoadingTag').classList.remove('hidden');
  document.getElementById('backupContainer').classList.add('form-disabled');

  document.getElementById('historicoLoadingTag').classList.remove('hidden');
  document.getElementById('historicoContainer').classList.add('form-disabled');

  if (state.isFirstLoad) {
    document.getElementById('rankingTableBody').innerHTML = '<tr><td colspan="5" class="loading-text">Carregando...</td></tr>';
    document.getElementById('backupTableBody').innerHTML = '<tr><td colspan="6" class="loading-text">Carregando...</td></tr>';
    document.getElementById('historicoTableBody').innerHTML = '<tr><td colspan="5" class="loading-text">Carregando...</td></tr>';
  } else {
    document.getElementById('rankingLoadingTag').classList.remove('hidden');
    document.getElementById('rankingTable').classList.add('grayed-out-full');
  }

  try {
    state.dbData = await fetchAppData();

    if (state.currentUser && state.currentUser.role === 'admin' && state.currentSessionToken) {
      const dataHist = await fetchHistoryData(state.currentSessionToken);
      if (dataHist.history) {
        state.historyData = dataHist.history;
        renderHistoryTable();
      }
    }

    renderRankingTable();
    renderBackupTable();
    renderMatchForm();
    state.isFirstLoad = false;
  } catch (err) {
    console.error("Erro ao carregar dados:", err);
  } finally {
    document.getElementById('rankingLoadingTag').classList.add('hidden');
    document.getElementById('rankingTable').classList.remove('grayed-out-full');

    document.getElementById('registrarLoadingTag').classList.add('hidden');
    document.getElementById('sec-registrar').classList.remove('form-disabled');

    document.getElementById('adicionarLoadingTag').classList.add('hidden');
    document.getElementById('adicionarContainer').classList.remove('form-disabled');

    document.getElementById('backupLoadingTag').classList.add('hidden');
    document.getElementById('backupContainer').classList.remove('form-disabled');

    document.getElementById('historicoLoadingTag').classList.add('hidden');
    document.getElementById('historicoContainer').classList.remove('form-disabled');

    state.refreshTimeout = setTimeout(() => {
      if (btnRefresh) btnRefresh.style.display = 'flex';
    }, 10000);
  }
}

/**
 * Alterna a modalidade de jogo ativa (Xadrez, Damas, Dominó, Uno).
 */
function switchMod(mod) {
  state.currentMod = mod;
  state.modoJogo = 'individual';
  
  document.querySelectorAll('.tabs-modalidades .tab-btn').forEach(btn => {
    const matchName = btn.innerText === 'Dominó' ? 'Domino' : btn.innerText;
    btn.classList.toggle('active', matchName === mod);
  });
  
  const modTitleText = mod === 'Domino' ? 'Dominó' : mod;
  document.querySelectorAll('.modTitle').forEach(el => el.innerText = modTitleText);

  renderRankingTable();
  renderBackupTable();
  renderMatchForm();
  renderHistoryTable();
}

/**
 * Alterna a aba de seção visível (Ranking, Registrar, Adicionar, Backup, Histórico).
 */
function switchSection(sec) {
  state.currentSec = sec;
  
  document.querySelectorAll('.subtab-btn').forEach(btn => btn.classList.remove('active'));
  const activeBtn = document.getElementById(`subtab-${sec}`);
  if (activeBtn) activeBtn.classList.add('active');

  const sections = ['ranking', 'registrar', 'adicionar', 'backup', 'historico'];
  sections.forEach(s => {
    const el = document.getElementById(`sec-${s}`);
    if (el) el.classList.add('hidden');
  });

  const secToShow = document.getElementById(`sec-${sec}`);
  if (secToShow) secToShow.classList.remove('hidden');
}

/**
 * Envia a requisição para adicionar um novo jogador à modalidade ativa.
 */
async function addPlayer() {
  const btnAdd = document.getElementById('btnAddPlayer');
  const nomeInput = document.getElementById('newPlayerName');
  const nome = nomeInput.value.trim();
  
  if (!nome) return alert('Digite o nome do jogador!');

  const currentPlayers = (state.dbData.rankings && state.dbData.rankings[state.currentMod]) ? state.dbData.rankings[state.currentMod] : [];
  const nameExists = currentPlayers.some(p => p.nome.trim().toLowerCase() === nome.toLowerCase());

  if (nameExists) {
    return alert(`Erro: Já existe um jogador cadastrado com o nome "${nome}" na modalidade ${state.currentMod === 'Domino' ? 'Dominó' : state.currentMod}.`);
  }

  if (btnAdd) {
    btnAdd.disabled = true;
    btnAdd.classList.add('form-disabled');
  }

  try {
    const data = await postAction({ action: 'addPlayer', modalidade: state.currentMod, nome: nome, token: state.currentSessionToken });
    if (data.status === 'error') return alert(data.message);

    nomeInput.value = '';
    await loadData();
  } catch (err) {
    console.error("Erro ao adicionar jogador:", err);
    alert("Ocorreu um erro ao salvar o jogador.");
  } finally {
    if (btnAdd) {
      btnAdd.disabled = false;
      btnAdd.classList.remove('form-disabled');
    }
  }
}

/**
 * Envia a requisição para mover um jogador ativo para a lixeira (backup).
 */
async function deletePlayer(playerId, btnEl) {
  if (!confirm("Tem certeza que deseja mover este jogador para o backup?")) return;

  if (btnEl) {
    btnEl.disabled = true;
    btnEl.classList.add('form-disabled');
  }

  try {
    const data = await postAction({ action: 'deletePlayer', modalidade: state.currentMod, playerId: playerId, token: state.currentSessionToken });
    if (data.status === 'error') return alert(data.message);

    await loadData();
  } catch (err) {
    console.error("Erro ao excluir jogador:", err);
    alert("Ocorreu um erro ao mover o jogador.");
  } finally {
    if (btnEl) {
      btnEl.disabled = false;
      btnEl.classList.remove('form-disabled');
    }
  }
}

/**
 * Envia a requisição para restaurar um jogador da lixeira de volta ao ranking ativo.
 */
async function restorePlayer(playerId, btnEl) {
  if (btnEl) {
    btnEl.disabled = true;
    btnEl.classList.add('form-disabled');
  }

  try {
    const data = await postAction({ action: 'restorePlayer', modalidade: state.currentMod, playerId: playerId, token: state.currentSessionToken });
    if (data.status === 'error') return alert(data.message);

    await loadData();
  } catch (err) {
    console.error("Erro ao restaurar jogador:", err);
    alert("Ocorreu um erro ao restaurar o jogador.");
  } finally {
    if (btnEl) {
      btnEl.disabled = false;
      btnEl.classList.remove('form-disabled');
    }
  }
}

/**
 * Submete o resultado da partida validando as regras específicas do modo e da modalidade.
 */
async function submitMatch() {
  if (!validatePlayerSelection()) return alert("Erro: O mesmo jogador não pode ser selecionado mais de uma vez na mesa.");

  let jogadoresArr = [];
  let empatesCount = 0;

  if (state.modoJogo === 'equipe' && (state.currentMod === 'Domino' || state.currentMod === 'Uno')) {
    const teamContainers = document.querySelectorAll('.team-container');
    
    teamContainers.forEach((container, eqIdx) => {
      const resVal = container.querySelector('.mTeamResultado').value;
      const pecasInput = container.querySelector('.mTeamPecasCartas');
      const teamPecas = pecasInput ? (parseInt(pecasInput.value) || 0) : 0;
      
      if (resVal === 'empate') empatesCount++;

      const pSelects = container.querySelectorAll('.mPlayer');
      pSelects.forEach(sel => {
        jogadoresArr.push({
          id: sel.value,
          resultado: resVal,
          pecasOuCartas: teamPecas,
          equipeIndex: eqIdx
        });
      });
    });

  } else {
    const pSelects = document.querySelectorAll('.mPlayer');
    const pResultados = document.querySelectorAll('.mResultado');
    const pPecasCartas = document.querySelectorAll('.mPecasCartas');

    pSelects.forEach((sel, i) => {
      const resVal = pResultados[i].value;
      if (resVal === 'empate') empatesCount++;

      jogadoresArr.push({
        id: sel.value,
        resultado: resVal,
        pecasOuCartas: pPecasCartas[i] ? (parseInt(pPecasCartas[i].value) || 0) : 0
      });
    });
  }

  if (empatesCount === 1) {
    return alert("Erro: Se houve um empate, pelo menos duas pessoas/equipes na mesa devem ter o resultado Empate.");
  }

  if ((state.currentMod === 'Xadrez' || state.currentMod === 'Damas') && jogadoresArr.length !== 2) {
    return alert("Xadrez e Damas exigem exatamente 2 jogadores.");
  }

  const matchSection = document.getElementById('sec-registrar');
  const submitBtn = document.getElementById('btnSubmitMatch');
  const originalBtnText = submitBtn.innerText;

  matchSection.classList.add('form-disabled');
  submitBtn.innerText = "Salvando...";
  submitBtn.disabled = true;

  try {
    const resData = await postAction({
      action: 'recordMatch',
      modalidade: state.currentMod,
      modoJogo: state.modoJogo,
      token: state.currentSessionToken,
      jogadores: jogadoresArr
    });

    if (resData.status === 'error') {
      alert("Erro ao registrar: " + resData.message);
      return;
    }

    if (resData.data) {
      state.dbData = resData.data;
    }

    if (state.currentUser && state.currentUser.role === 'admin' && state.currentSessionToken) {
      const dataHist = await fetchHistoryData(state.currentSessionToken);
      if (dataHist.history) {
        state.historyData = dataHist.history;
        renderHistoryTable();
      }
    }

    renderRankingTable();
    renderBackupTable();
    renderMatchForm();

  } catch (err) {
    console.error("Erro ao registrar partida:", err);
    alert("Ocorreu um erro ao salvar a partida.");
  } finally {
    matchSection.classList.remove('form-disabled');
    submitBtn.innerText = originalBtnText;
    submitBtn.disabled = false;
  }
}

/**
 * Atalho de teclado para enviar login ao pressionar a tecla Enter.
 */
function handleEnter(e) {
  if (e.key === 'Enter') login();
}