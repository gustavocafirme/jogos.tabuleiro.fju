/**
 * Renderiza a tabela de ranking/classificação ordenada pela pontuação Elo.
 */
function renderRankingTable() {
  const rankingList = (state.dbData.rankings && state.dbData.rankings[state.currentMod]) 
    ? [...state.dbData.rankings[state.currentMod]] 
    : [];
  
  rankingList.sort((a, b) => b.rating - a.rating);

  const tableBody = document.getElementById('rankingTableBody');
  if (rankingList.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="5" class="loading-text">Nenhum jogador cadastrado.</td></tr>';
    return;
  }

  tableBody.innerHTML = rankingList.map((player, index) => {
    let positionDisplay = index + 1;
    if (player.partidas > 0) {
      if (index === 0) positionDisplay = '🥇';
      else if (index === 1) positionDisplay = '🥈';
      else if (index === 2) positionDisplay = '🥉';
    }

    return `
      <tr class="${player.partidas === 0 ? 'grayed-out' : ''}">
        <td>${positionDisplay}</td>
        <td>${player.nome}</td>
        <td><b>${Math.round(player.rating)}</b></td>
        <td>${player.partidas}</td>
        <td class="admin-only ${state.currentUser?.role !== 'admin' ? 'hidden' : ''}">
          <button class="btn-danger" onclick="deletePlayer('${player.id}', this)">Excluir</button>
        </td>
      </tr>
    `;
  }).join('');
}

/**
 * Renderiza a lista de jogadores arquivados/excluídos na tabela de backup (lixeira).
 */
function renderBackupTable() {
  const backupList = (state.dbData.backups && state.dbData.backups[state.currentMod]) 
    ? state.dbData.backups[state.currentMod] 
    : [];
  
  const tableBody = document.getElementById('backupTableBody');
  if (backupList.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="6" class="loading-text">Nenhum jogador na lixeira.</td></tr>';
    return;
  }

  tableBody.innerHTML = backupList.map(player => `
    <tr>
      <td>${player.nome}</td>
      <td>${Math.round(player.rating)}</td>
      <td>${player.partidas}</td>
      <td>${player.dataExclusao}</td>
      <td>${player.excluidoPor}</td>
      <td>
        <button class="btn-restore" onclick="restorePlayer('${player.id}', this)">Restaurar</button>
      </td>
    </tr>
  `).join('');
}

/**
 * Renderiza a tabela do histórico de auditoria de ações do sistema (exclusivo para Admins).
 */
function renderHistoryTable() {
  const tableBody = document.getElementById('historicoTableBody');
  const modHistory = state.historyData[state.currentMod] || [];

  if (!modHistory || modHistory.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="5" class="loading-text">Nenhum registro encontrado no histórico.</td></tr>';
    return;
  }

  tableBody.innerHTML = modHistory.map(log => `
    <tr>
      <td>${log.dataHora}</td>
      <td>${log.usuario}</td>
      <td>${log.acao}</td>
      <td>${log.envolvidos}</td>
      <td style="font-size:0.82rem; color:#94a3b8;">${log.detalhes}</td>
    </tr>
  `).join('');
}