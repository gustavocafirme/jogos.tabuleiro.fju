function renderRanking() {
  let list = (state.dbData.rankings && state.dbData.rankings[state.currentMod]) ? [...state.dbData.rankings[state.currentMod]] : [];
  list.sort((a, b) => b.rating - a.rating);

  const tbody = document.getElementById('rankingTableBody');
  if (list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="loading-text">Nenhum jogador cadastrado.</td></tr>';
    return;
  }

  tbody.innerHTML = list.map((p, idx) => {
    let posDisplay = idx + 1;
    if (p.partidas > 0) {
      if (idx === 0) posDisplay = '🥇';
      else if (idx === 1) posDisplay = '🥈';
      else if (idx === 2) posDisplay = '🥉';
    }

    return `
      <tr class="${p.partidas === 0 ? 'grayed-out' : ''}">
        <td>${posDisplay}</td>
        <td>${p.nome}</td>
        <td><b>${Math.round(p.rating)}</b></td>
        <td>${p.partidas}</td>
        <td class="admin-only ${state.currentUser?.role !== 'admin' ? 'hidden' : ''}">
          <button class="btn-danger" onclick="deletePlayer('${p.id}')">Excluir</button>
        </td>
      </tr>
    `;
  }).join('');
}

function renderBackupTable() {
  let list = (state.dbData.backups && state.dbData.backups[state.currentMod]) ? state.dbData.backups[state.currentMod] : [];
  const tbody = document.getElementById('backupTableBody');
  
  if (list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="loading-text">Nenhum jogador na lixeira.</td></tr>';
    return;
  }

  tbody.innerHTML = list.map(p => `
    <tr>
      <td>${p.nome}</td>
      <td>${Math.round(p.rating)}</td>
      <td>${p.partidas}</td>
      <td>${p.dataExclusao}</td>
      <td>${p.excluidoPor}</td>
      <td>
        <button class="btn-restore" onclick="restorePlayer('${p.id}')">Restaurar</button>
      </td>
    </tr>
  `).join('');
}

function renderHistoryTable() {
  const tbody = document.getElementById('historicoTableBody');
  const modHistory = state.historyData[state.currentMod] || [];

  if (!modHistory || modHistory.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="loading-text">Nenhum registro encontrado no histórico.</td></tr>';
    return;
  }

  tbody.innerHTML = modHistory.map(h => `
    <tr>
      <td>${h.dataHora}</td>
      <td>${h.usuario}</td>
      <td>${h.acao}</td>
      <td>${h.envolvidos}</td>
      <td style="font-size:0.82rem; color:#94a3b8;">${h.detalhes}</td>
    </tr>
  `).join('');
}

function renderMatchForm() {
  const players = (state.dbData.rankings && state.dbData.rankings[state.currentMod]) ? state.dbData.rankings[state.currentMod] : [];
  const form = document.getElementById('matchForm');
  
  if (players.length < 2) {
    form.innerHTML = "<p class='loading-text'>Cadastre pelo menos 2 jogadores para registrar partidas.</p>";
    return;
  }

  let html = '';
  if (state.currentMod === 'Xadrez' || state.currentMod === 'Damas') {
    html = `<input type="hidden" id="qtdMesa" value="2">
            <div id="dynamicPlayersContainer"></div>`;
  } else {
    let maxJogadores = state.currentMod === 'Domino' ? Math.min(4, players.length) : Math.min(10, players.length);
    let defaultQtd = Math.min(state.currentMod === 'Domino' ? 4 : 3, maxJogadores);
    if (defaultQtd < 2) defaultQtd = 2;

    html = `
      <div id="qtdMesaContainer">
        <label>Quantidade de Jogadores na Mesa (Máx: ${maxJogadores}):</label>
        <input type="number" id="qtdMesa" value="${defaultQtd}" min="2" max="${maxJogadores}" onchange="updateDynamicPlayersForm()">
      </div>
      <div id="dynamicPlayersContainer"></div>
    `;
  }

  form.innerHTML = html;
  updateDynamicPlayersForm();
}

function updateDynamicPlayersForm() {
  const qtdInput = document.getElementById('qtdMesa');
  if (!qtdInput) return;

  let qtd = parseInt(qtdInput.value) || 2;
  const players = state.dbData.rankings[state.currentMod] || [];
  let maxAllowed = (state.currentMod === 'Domino') ? Math.min(4, players.length) : (state.currentMod === 'Uno' ? Math.min(10, players.length) : 2);

  if (qtd > maxAllowed) { qtd = maxAllowed; qtdInput.value = qtd; }
  if (qtd < 2) { qtd = 2; qtdInput.value = qtd; }

  const container = document.getElementById('dynamicPlayersContainer');
  let html = '';

  for (let i = 0; i < qtd; i++) {
    let selectedPlayerId = players[i % players.length] ? players[i % players.length].id : '';

    let options = players.map(p => 
      `<option value="${p.id}" ${p.id === selectedPlayerId ? 'selected' : ''}>${p.nome} (${Math.round(p.rating)})</option>`
    ).join('');

    let resOptions = state.currentMod === 'Uno' 
      ? `<option value="vitoria" ${i === 0 ? 'selected' : ''}>Vitória</option><option value="derrota" ${i > 0 ? 'selected' : ''}>Derrota</option>`
      : `<option value="vitoria" ${i === 0 ? 'selected' : ''}>Vitória</option><option value="derrota" ${i > 0 ? 'selected' : ''}>Derrota</option><option value="empate">Empate</option>`;

    let fieldHtml = '';
    if (state.currentMod !== 'Xadrez') {
      let label = '', minVal = 0, maxVal = 100, defaultVal = 0;

      if (state.currentMod === 'Damas') {
        label = 'Peças restantes:'; maxVal = 12; minVal = (i === 0) ? 1 : 0; defaultVal = (i === 0) ? 1 : 0;
      } else if (state.currentMod === 'Uno') {
        label = 'Cartas restantes:'; maxVal = 108 - (qtd - 1); minVal = (i > 0) ? 1 : 0; defaultVal = (i > 0) ? 1 : 0;
      } else if (state.currentMod === 'Domino') {
        label = 'Pontinhos restantes:'; minVal = 0; defaultVal = (i === 0) ? 0 : 1;
        maxVal = (qtd === 2) ? 153 : (qtd === 3 ? 118 : 69);
      }

      fieldHtml = `
        <label class="lblPecasCartas" style="margin-top:8px; display:block;">${label}</label>
        <input type="number" class="mPecasCartas" value="${defaultVal}" min="${minVal}" max="${maxVal}">
      `;
    }

    html += `
      <div class="player-card" style="border:1px solid var(--card-border); background: #0b111e; padding:12px; margin-top:10px; border-radius:8px;" data-index="${i}">
        <label style="font-weight:600; color:var(--muted);">Jogador ${i+1}:</label>
        <select class="mPlayer" onchange="validatePlayerSelection()">${options}</select>
        
        <label style="margin-top:8px; display:block; font-weight:600; color:var(--muted);">Resultado:</label>
        <select class="mResultado" onchange="handleResultadoChange(${i})">${resOptions}</select>

        ${fieldHtml}
      </div>
    `;
  }

  container.innerHTML = html;
  for (let i = 0; i < qtd; i++) adjustPecasCartasLimits(i);
  validatePlayerSelection();
}

function handleResultadoChange(changedIndex) {
  const resSelects = document.querySelectorAll('.mResultado');
  const qtd = resSelects.length;
  const newVal = resSelects[changedIndex].value;

  if (state.currentMod === 'Xadrez' || state.currentMod === 'Damas') {
    const otherIndex = changedIndex === 0 ? 1 : 0;
    if (newVal === 'vitoria') resSelects[otherIndex].value = 'derrota';
    else if (newVal === 'derrota') resSelects[otherIndex].value = 'vitoria';
    else if (newVal === 'empate') resSelects[otherIndex].value = 'empate';
  } else if (state.currentMod === 'Uno' || state.currentMod === 'Domino') {
    if (newVal === 'vitoria') {
      resSelects.forEach((sel, idx) => { if (idx !== changedIndex) sel.value = 'derrota'; });
    } else if (newVal === 'empate' && state.currentMod === 'Domino') {
      resSelects.forEach(sel => { if (sel.value === 'vitoria') sel.value = 'empate'; });
    }
  }

  for (let i = 0; i < qtd; i++) adjustPecasCartasLimits(i);
}

function adjustPecasCartasLimits(index) {
  const cards = document.querySelectorAll('.player-card');
  if (!cards[index]) return;
  
  const resSelect = cards[index].querySelector('.mResultado');
  const inputPecas = cards[index].querySelector('.mPecasCartas');
  if (!resSelect || !inputPecas) return;

  const res = resSelect.value;
  const qtd = cards.length;

  if (state.currentMod === 'Damas') {
    if (res === 'derrota') {
      inputPecas.min = 0; inputPecas.max = 0; inputPecas.value = 0; inputPecas.disabled = true;
    } else {
      inputPecas.disabled = false; inputPecas.min = 1; inputPecas.max = 12;
      if (parseInt(inputPecas.value) < 1) inputPecas.value = 1;
    }
  } else if (state.currentMod === 'Uno') {
    let maxCartas = 108 - (qtd - 1);
    if (res === 'derrota') {
      inputPecas.min = 1; inputPecas.max = maxCartas;
      if (parseInt(inputPecas.value) < 1) inputPecas.value = 1;
    } else {
      inputPecas.min = 0; inputPecas.max = 0; inputPecas.value = 0;
    }
  } else if (state.currentMod === 'Domino') {
    let maxPontinhos = (qtd === 2) ? 153 : (qtd === 3 ? 118 : 69);
    inputPecas.min = 0; inputPecas.max = maxPontinhos;
    if (res === 'derrota' && parseInt(inputPecas.value) === 0) inputPecas.value = 1;
  }
}

function validatePlayerSelection() {
  const pSelects = document.querySelectorAll('.mPlayer');
  const selectedIds = [];
  let hasDuplicate = false;

  pSelects.forEach(sel => {
    if (selectedIds.includes(sel.value)) {
      hasDuplicate = true;
      sel.style.borderColor = 'var(--danger)';
    } else {
      sel.style.borderColor = 'var(--card-border)';
      selectedIds.push(sel.value);
    }
  });

  return !hasDuplicate;
}