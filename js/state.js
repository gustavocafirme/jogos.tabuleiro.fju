const state = {
  currentUser: null,
  currentSessionToken: null,
  currentMod: 'Xadrez',
  currentSec: 'ranking',
  modoJogo: 'individual', // 'individual' ou 'equipe'
  dbData: { rankings: {}, backups: {} },
  historyData: {},
  refreshTimeout: null,
  isFirstLoad: true
};