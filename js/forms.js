/**
 * Roteador principal do container do formulário de partidas.
 * Valida os requisitos mínimos de jogadores para os modos individual e em equipe.
 */
function renderMatchForm() {
  const players = (state.dbData.rankings && state.dbData.rankings[state.currentMod]) 
    ? state.dbData.rankings[state.currentMod] 
    : [];
  
  const formContainer = document.getElementById('matchForm');
  const submitBtn = document.getElementById('btnSubmitMatch');
  
  if (players.length < 2) {
    formContainer.innerHTML = "<p class='loading-text'>Cadastre pelo menos 2 jogadores para registrar partidas.</p>";
    if (submitBtn) {
      submitBtn.classList.add('hidden');
      submitBtn.disabled = true;
    }
    return;
  }

  // Redireciona para o modo individual caso o total de jogadores caia para menos de 4
  if (state.modoJogo === 'equipe' && players.length < 4) {
    state.modoJogo = 'individual';
  }

  if (submitBtn) {
    submitBtn.classList.remove('hidden');
    submitBtn.disabled = false;
  }

  let htmlContent = '';

  if (state.currentMod === 'Domino' || state.currentMod === 'Uno') {
    const canPlayTeams = players.length >= 4;
    const titleTooltip = canPlayTeams ? '' : 'title="Cadastre pelo menos 4 jogadores para liberar o modo em equipes"';

    htmlContent += `
      <div class="tabs-modo-jogo">
        <button class="modo-btn ${state.modoJogo === 'individual' ? 'active' : ''}" onclick="setGameMode('individual')">👤 Individual</button>
        <button class="modo-btn ${state.modoJogo === 'equipe' ? 'active' : ''}" 
                onclick="setGameMode('equipe')" 
                ${!canPlayTeams ? 'disabled style="opacity: 0.4; cursor: not-allowed;"' : ''} 
                ${titleTooltip}>
          👥 Em Equipes ${!canPlayTeams ? '(Min. 4 Jogadores)' : ''}
        </button>
      </div>
    `;
  }

  if (state.modoJogo === 'equipe' && (state.currentMod === 'Domino' || state.currentMod === 'Uno')) {
    htmlContent += buildTeamFormHTML(players);
  } else {
    htmlContent += buildIndividualFormHTML(players);
  }

  formContainer.innerHTML = htmlContent;
  updateDynamicPlayersForm();
}

/**
 * Alterna a aba de modo de jogo entre 'individual' e 'equipe' e atualiza o formulário.
 */
function setGameMode(mode) {
  state.modoJogo = mode;
  renderMatchForm();
}

/**
 * Constrói a estrutura HTML dos controles de seleção para o modo individual.
 */
function buildIndividualFormHTML(players) {
  if (state.currentMod === 'Xadrez' || state.currentMod === 'Damas') {
    return `<input type="hidden" id="qtdMesa" value="2"><div id="dynamicPlayersContainer"></div>`;
  } else {
    const maxPlayers = state.currentMod === 'Domino' ? Math.min(4, players.length) : Math.min(10, players.length);
    let defaultCount = Math.min(state.currentMod === 'Domino' ? 4 : 3, maxPlayers);
    if (defaultCount < 2) defaultCount = 2;

    return `
      <div id="qtdMesaContainer">
        <label>Quantidade de Jogadores na Mesa (Máx: ${maxPlayers}):</label>
        <input type="number" id="qtdMesa" value="${defaultCount}" min="2" max="${maxPlayers}" onchange="updateDynamicPlayersForm()">
      </div>
      <div id="dynamicPlayersContainer"></div>
    `;
  }
}

/**
 * Constrói a estrutura HTML dos controles para o modo em equipes.
 */
function buildTeamFormHTML(players) {
  if (state.currentMod === 'Domino') {
    return `
      <input type="hidden" id="tamanhoGrupo" value="2">
      <input type="hidden" id="qtdEquipes" value="2">
      <div id="dynamicPlayersContainer"></div>
    `;
  } else {
    const maxP = players.length;
    let sizeOptions = [];
    if (maxP >= 4) sizeOptions.push('<option value="2" selected>Duplas (2 por equipe)</option>');
    if (maxP >= 6) sizeOptions.push('<option value="3">Trios (3 por equipe)</option>');
    if (maxP >= 8) sizeOptions.push('<option value="4">Quartetos (4 por equipe)</option>');
    if (maxP >= 10) sizeOptions.push('<option value="5">Quintetos (5 por equipe)</option>');

    return `
      <div style="display:flex; gap:12px; flex-wrap:wrap;">
        <div style="flex:1; min-width:180px;">
          <label>Tamanho da Equipe:</label>
          <select id="tamanhoGrupo" onchange="updateTeamCountOptions()">${sizeOptions.join('')}</select>
        </div>
        <div style="flex:1; min-width:180px;">
          <label>Quantidade de Equipes:</label>
          <select id="qtdEquipes" onchange="updateDynamicPlayersForm()"></select>
        </div>
      </div>
      <div id="dynamicPlayersContainer"></div>
    `;
  }
}

/**
 * Atualiza o dropdown de quantidade de equipes de acordo com o tamanho do grupo e jogadores disponíveis.
 */
function updateTeamCountOptions() {
  const sizeSelect = document.getElementById('tamanhoGrupo');
  const countSelect = document.getElementById('qtdEquipes');
  if (!sizeSelect || !countSelect) return;

  const teamSize = parseInt(sizeSelect.value) || 2;
  const players = (state.dbData.rankings && state.dbData.rankings[state.currentMod]) ? state.dbData.rankings[state.currentMod] : [];
  const maxPossibleTeams = Math.floor(players.length / teamSize);
  const maxLimit = Math.min(5, maxPossibleTeams);

  let optionsHtml = [];
  for (let i = 2; i <= maxLimit; i++) {
    optionsHtml.push(`<option value="${i}">${i} Equipes</option>`);
  }
  countSelect.innerHTML = optionsHtml.join('');
  updateDynamicPlayersForm();
}

/**
 * Atualiza dinamicamente a exibição dos cards de jogadores com base no tamanho da mesa e no modo selecionado.
 */
function updateDynamicPlayersForm() {
  const container = document.getElementById('dynamicPlayersContainer');
  if (!container) return;

  const players = state.dbData.rankings[state.currentMod] || [];

  if (state.modoJogo === 'equipe' && (state.currentMod === 'Domino' || state.currentMod === 'Uno')) {
    if (state.currentMod === 'Uno') {
      const countSelect = document.getElementById('qtdEquipes');
      if (!countSelect || !countSelect.value) {
        updateTeamCountOptions();
        return;
      }
    }
    renderTeamTable(container, players);
  } else {
    renderIndividualTable(container, players);
  }
}

/**
 * Renderiza os cards de seletores para o modo individual.
 */
function renderIndividualTable(container, players) {
  const countInput = document.getElementById('qtdMesa');
  let playerLimit = countInput ? parseInt(countInput.value) || 2 : 2;
  let maxAllowed = (state.currentMod === 'Domino') ? Math.min(4, players.length) : (state.currentMod === 'Uno' ? Math.min(10, players.length) : 2);

  if (playerLimit > maxAllowed) { playerLimit = maxAllowed; if (countInput) countInput.value = playerLimit; }
  if (playerLimit < 2) { playerLimit = 2; if (countInput) countInput.value = playerLimit; }

  let htmlContent = '';
  for (let i = 0; i < playerLimit; i++) {
    let selectedPlayerId = players[i % players.length] ? players[i % players.length].id : '';
    let options = players.map(p => `<option value="${p.id}" ${p.id === selectedPlayerId ? 'selected' : ''}>${p.nome} (${Math.round(p.rating)})</option>`).join('');

    let resOptions = state.currentMod === 'Uno' 
      ? `<option value="vitoria" ${i === 0 ? 'selected' : ''}>Vitória</option><option value="derrota" ${i > 0 ? 'selected' : ''}>Derrota</option>`
      : `<option value="vitoria" ${i === 0 ? 'selected' : ''}>Vitória</option><option value="derrota" ${i > 0 ? 'selected' : ''}>Derrota</option><option value="empate">Empate</option>`;

    let fieldHtml = '';
    if (state.currentMod !== 'Xadrez') {
      let label = '', minVal = 0, maxVal = 100, defaultVal = 0;
      if (state.currentMod === 'Damas') {
        label = 'Peças restantes:'; maxVal = 12; minVal = (i === 0) ? 1 : 0; defaultVal = (i === 0) ? 1 : 0;
      } else if (state.currentMod === 'Uno') {
        label = 'Cartas restantes:'; maxVal = 108 - (playerLimit - 1); minVal = (i > 0) ? 1 : 0; defaultVal = (i > 0) ? 1 : 0;
      } else if (state.currentMod === 'Domino') {
        label = 'Pontinhos restantes:'; minVal = 0; defaultVal = (i === 0) ? 0 : 1;
        maxVal = (playerLimit === 2) ? 153 : (playerLimit === 3 ? 118 : 69);
      }
      fieldHtml = `<label class="lblPecasCartas" style="margin-top:8px; display:block;">${label}</label><input type="number" class="mPecasCartas" value="${defaultVal}" min="${minVal}" max="${maxVal}">`;
    }

    htmlContent += `
      <div class="player-card" style="border:1px solid var(--card-border); background: #0b111e; padding:12px; margin-top:10px; border-radius:8px;" data-index="${i}">
        <label style="font-weight:600; color:var(--muted);">Jogador ${i+1}:</label>
        <select class="mPlayer" onchange="validatePlayerSelection()">${options}</select>
        <label style="margin-top:8px; display:block; font-weight:600; color:var(--muted);">Resultado:</label>
        <select class="mResultado" onchange="handleResultChange(${i})">${resOptions}</select>
        ${fieldHtml}
      </div>
    `;
  }

  container.innerHTML = htmlContent;
  for (let i = 0; i < playerLimit; i++) adjustPieceCardLimits(i);
  validatePlayerSelection();
}

/**
 * Renderiza os containers coloridos e seletores agrupados por equipe.
 */
function renderTeamTable(container, players) {
  const sizeInput = document.getElementById('tamanhoGrupo');
  const countInput = document.getElementById('qtdEquipes');

  const teamSize = sizeInput ? parseInt(sizeInput.value) || 2 : 2;
  const numTeams = countInput ? parseInt(countInput.value) || 2 : 2;
  const totalPlayers = teamSize * numTeams;

  let htmlContent = '';
  let playerCounter = 0;

  for (let teamIdx = 0; teamIdx < numTeams; teamIdx++) {
    const colorClass = `team-bg-${teamIdx % 5}`;
    
    let resOptions = state.currentMod === 'Uno'
      ? `<option value="vitoria" ${teamIdx === 0 ? 'selected' : ''}>Vitória</option><option value="derrota" ${teamIdx > 0 ? 'selected' : ''}>Derrota</option>`
      : `<option value="vitoria" ${teamIdx === 0 ? 'selected' : ''}>Vitória</option><option value="derrota" ${teamIdx > 0 ? 'selected' : ''}>Derrota</option><option value="empate">Empate</option>`;

    let fieldHtml = '';
    if (state.currentMod === 'Domino') {
      fieldHtml = `<label style="margin-top:8px; display:block; font-weight:600;">Pontinhos restantes da Equipe:</label>
                   <input type="number" class="mTeamPecasCartas" data-team="${teamIdx}" value="${teamIdx === 0 ? 0 : 1}" min="0" max="118">`;
    } else if (state.currentMod === 'Uno') {
      const virtualOpponents = totalPlayers - teamSize + 1;
      const maxCards = 108 - (virtualOpponents - 1);
      fieldHtml = `<label style="margin-top:8px; display:block; font-weight:600;">Cartas restantes da Equipe:</label>
                   <input type="number" class="mTeamPecasCartas" data-team="${teamIdx}" value="${teamIdx === 0 ? 0 : 1}" min="${teamIdx === 0 ? 0 : 1}" max="${maxCards}">`;
    }

    htmlContent += `
      <div class="team-container ${colorClass}" data-team-index="${teamIdx}">
        <span class="team-title">🛡️ Equipe ${teamIdx + 1}</span>
        
        <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap; margin-bottom:10px;">
          <div style="flex:1; min-width:140px;">
            <label style="font-weight:600;">Resultado da Equipe:</label>
            <select class="mTeamResultado" data-team="${teamIdx}" onchange="handleTeamResultChange(${teamIdx})">${resOptions}</select>
          </div>
          <div style="flex:1; min-width:140px;">${fieldHtml}</div>
        </div>

        <div class="team-players-list">
    `;

    for (let p = 0; p < teamSize; p++) {
      let selectedPlayerId = players[playerCounter % players.length] ? players[playerCounter % players.length].id : '';
      let options = players.map(pl => `<option value="${pl.id}" ${pl.id === selectedPlayerId ? 'selected' : ''}>${pl.nome} (${Math.round(pl.rating)})</option>`).join('');

      htmlContent += `
        <div style="margin-top:6px;">
          <label style="font-size:0.85rem; color:var(--muted);">Jogador ${p + 1} da Equipe:</label>
          <select class="mPlayer" data-team="${teamIdx}" onchange="validatePlayerSelection()">${options}</select>
        </div>
      `;
      playerCounter++;
    }

    htmlContent += `</div></div>`;
  }

  container.innerHTML = htmlContent;
  for (let teamIdx = 0; teamIdx < numTeams; teamIdx++) adjustTeamPieceCardLimits(teamIdx);
  validatePlayerSelection();
}

/**
 * Sincroniza automaticamente os resultados das equipes (ex: Vitória em uma marca Derrota na outra).
 */
function handleTeamResultChange(changedTeamIdx) {
  const teamResultSelects = document.querySelectorAll('.mTeamResultado');
  const teamCount = teamResultSelects.length;
  const newValue = teamResultSelects[changedTeamIdx].value;

  if (state.currentMod === 'Domino' || state.currentMod === 'Uno') {
    if (newValue === 'vitoria') {
      teamResultSelects.forEach((select, idx) => {
        if (idx !== changedTeamIdx) select.value = 'derrota';
      });
    } else if (newValue === 'derrota' && teamCount === 2) {
      const otherIdx = changedTeamIdx === 0 ? 1 : 0;
      teamResultSelects[otherIdx].value = 'vitoria';
    } else if (newValue === 'empate' && state.currentMod === 'Domino') {
      if (teamCount === 2) {
        const otherIdx = changedTeamIdx === 0 ? 1 : 0;
        teamResultSelects[otherIdx].value = 'empate';
      } else {
        teamResultSelects.forEach(select => {
          if (select.value === 'vitoria') select.value = 'empate';
        });
      }
    }
  }

  teamResultSelects.forEach((_, idx) => adjustTeamPieceCardLimits(idx));
}

/**
 * Ajusta os limites de entradas de cartas ou pontinhos para o modo em equipe.
 */
function adjustTeamPieceCardLimits(teamIdx) {
  const teamContainer = document.querySelector(`.team-container[data-team-index="${teamIdx}"]`);
  if (!teamContainer) return;

  const resultSelect = teamContainer.querySelector('.mTeamResultado');
  const pieceInput = teamContainer.querySelector('.mTeamPecasCartas');
  if (!resultSelect || !pieceInput) return;

  const result = resultSelect.value;

  if (state.currentMod === 'Uno') {
    if (result === 'vitoria') {
      pieceInput.value = 0;
      pieceInput.min = 0;
      pieceInput.disabled = true;
    } else {
      pieceInput.disabled = false;
      pieceInput.min = 1;
      if (parseInt(pieceInput.value) < 1) pieceInput.value = 1;
    }
  } else if (state.currentMod === 'Domino') {
    if (result === 'vitoria' && parseInt(pieceInput.value) > 0) {
      pieceInput.value = 0;
    } else if (result === 'derrota' && parseInt(pieceInput.value) === 0) {
      pieceInput.value = 1;
    }
  }
}

/**
 * Sincroniza automaticamente os resultados dos jogadores no modo individual.
 */
function handleResultChange(changedIndex) {
  const resultSelects = document.querySelectorAll('.mResultado');
  const playerCount = resultSelects.length;
  const newValue = resultSelects[changedIndex].value;

  if (state.currentMod === 'Xadrez' || state.currentMod === 'Damas') {
    const otherIndex = changedIndex === 0 ? 1 : 0;
    if (newValue === 'vitoria') resultSelects[otherIndex].value = 'derrota';
    else if (newValue === 'derrota') resultSelects[otherIndex].value = 'vitoria';
    else if (newValue === 'empate') resultSelects[otherIndex].value = 'empate';
  } else if (state.currentMod === 'Uno' || state.currentMod === 'Domino') {
    if (newValue === 'vitoria') {
      resultSelects.forEach((select, idx) => { if (idx !== changedIndex) select.value = 'derrota'; });
    } else if (newValue === 'derrota' && playerCount === 2) {
      const otherIdx = changedIndex === 0 ? 1 : 0;
      resultSelects[otherIdx].value = 'vitoria';
    } else if (newValue === 'empate' && state.currentMod === 'Domino') {
      if (playerCount === 2) {
        const otherIdx = changedIndex === 0 ? 1 : 0;
        resultSelects[otherIdx].value = 'empate';
      } else {
        resultSelects.forEach(select => { if (select.value === 'vitoria') select.value = 'empate'; });
      }
    }
  }

  for (let i = 0; i < playerCount; i++) adjustPieceCardLimits(i);
}

/**
 * Ajusta os limites de entradas de cartas ou pontinhos no modo individual.
 */
function adjustPieceCardLimits(index) {
  const cards = document.querySelectorAll('.player-card');
  if (!cards[index]) return;
  
  const resultSelect = cards[index].querySelector('.mResultado');
  const pieceInput = cards[index].querySelector('.mPecasCartas');
  if (!resultSelect || !pieceInput) return;

  const result = resultSelect.value;
  const playerCount = cards.length;

  if (state.currentMod === 'Damas') {
    if (result === 'derrota') {
      pieceInput.min = 0; pieceInput.max = 0; pieceInput.value = 0; pieceInput.disabled = true;
    } else {
      pieceInput.disabled = false; pieceInput.min = 1; pieceInput.max = 12;
      if (parseInt(pieceInput.value) < 1) pieceInput.value = 1;
    }
  } else if (state.currentMod === 'Uno') {
    let maxCards = 108 - (playerCount - 1);
    if (result === 'derrota') {
      pieceInput.min = 1; pieceInput.max = maxCards;
      if (parseInt(pieceInput.value) < 1) pieceInput.value = 1;
    } else {
      pieceInput.min = 0; pieceInput.max = 0; pieceInput.value = 0;
    }
  } else if (state.currentMod === 'Domino') {
    let maxPoints = (playerCount === 2) ? 153 : (playerCount === 3 ? 118 : 69);
    pieceInput.min = 0; pieceInput.max = maxPoints;
    if (result === 'derrota' && parseInt(pieceInput.value) === 0) pieceInput.value = 1;
  }
}

/**
 * Valida os seletores de jogador para evitar seleção duplicada do mesmo jogador na mesma mesa.
 */
function validatePlayerSelection() {
  const playerSelects = document.querySelectorAll('.mPlayer');
  const selectedIds = [];
  let hasDuplicate = false;

  playerSelects.forEach(select => {
    if (selectedIds.includes(select.value)) {
      hasDuplicate = true;
      select.style.borderColor = 'var(--danger)';
    } else {
      select.style.borderColor = 'var(--card-border)';
      selectedIds.push(select.value);
    }
  });

  return !hasDuplicate;
}