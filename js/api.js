const API_URL = "https://script.google.com/macros/s/AKfycbyvYdylsWuc0kjufyfrg9CB_pgf2LUUcNRss5gCmu50BeRi1ylv3pkR1WilvReHzWafuw/exec";

async function fetchAppData() {
  const res = await fetch(API_URL);
  return await res.json();
}

async function fetchHistoryData(token) {
  const res = await fetch(`${API_URL}?action=getHistory&token=${token}`);
  return await res.json();
}

async function postAction(payload) {
  const res = await fetch(API_URL, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  return await res.json();
}