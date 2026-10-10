const state = {
  currentUser: null,
  currentSessionToken: null,
  currentMod: 'Xadrez',
  currentSec: 'ranking',
  dbData: { rankings: {}, backups: {} },
  historyData: {},
  refreshTimeout: null,
  isFirstLoad: true
};