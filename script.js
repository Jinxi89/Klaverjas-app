/*
 * script.js (v7)
 *
 * Dit script beheert de logica voor de Klaverjassen score‑app versie 7.
 * Het ondersteunt een samenvattend scorebord met alleen de totaalscores per team
 * per ronde en een gedetailleerd scorebord dat in een popup wordt getoond.
 * Daarnaast zijn roem, nat/pit en de gespeelde kaart (harten, ruiten, klaveren,
 * schoppen) inbegrepen. Gebruikers kunnen rondes bewerken of verwijderen via
 * een modal. De app slaat de spelstatus op in localStorage zodat de stand
 * behouden blijft bij herladen van de pagina.
 */

document.addEventListener('DOMContentLoaded', () => {
  // ===== DOM Referenties =====
  // Team selectie knoppen (nieuwe ronde)
  const playingTeamButtons = document.getElementById('playingTeamButtons');
  const tellerTeamButtons = document.getElementById('tellerTeamButtons');
  // Suit selectie knoppen (nieuwe ronde)
  const suitButtons = document.getElementById('suitButtons');
  // Inputs en displays voor punten en roem
  const pointsInput = document.getElementById('pointsInput');
  const wijRoemDisplay = document.getElementById('wijRoemDisplay');
  const zijRoemDisplay = document.getElementById('zijRoemDisplay');
  const wijRoem20Btn = document.getElementById('wijRoem20');
  const wijRoem50Btn = document.getElementById('wijRoem50');
  const zijRoem20Btn = document.getElementById('zijRoem20');
  const zijRoem50Btn = document.getElementById('zijRoem50');
  // Actieknoppen voor nieuwe ronde
  const addRoundBtn = document.getElementById('addRoundBtn');
  const resetGameBtn = document.getElementById('resetGameBtn');
  const clearInputsBtn = document.getElementById('clearInputsBtn');
  // Scoreborden en totalen
  const summaryTableBody = document.querySelector('#summaryTable tbody');
  const detailTableBody = document.querySelector('#detailTable tbody');
  const totWijSummaryEl = document.getElementById('totWijSummary');
  const totZijSummaryEl = document.getElementById('totZijSummary');
  const detTotWijPointsEl = document.getElementById('detTotWijPoints');
  const detTotWijRoemEl = document.getElementById('detTotWijRoem');
  const detTotWijTotalEl = document.getElementById('detTotWijTotal');
  const detTotZijPointsEl = document.getElementById('detTotZijPoints');
  const detTotZijRoemEl = document.getElementById('detTotZijRoem');
  const detTotZijTotalEl = document.getElementById('detTotZijTotal');
  // Detail modal knoppen
  const showDetailBtn = document.getElementById('showDetailBtn');
  const detailModal = document.getElementById('detailModal');
  const closeDetailBtn = document.getElementById('closeDetailBtn');
  // Bewerken modal elementen
  const editModal = document.getElementById('editModal');
  const editPointsInput = document.getElementById('editPointsInput');
  const editWijRoemInput = document.getElementById('editWijRoemInput');
  const editZijRoemInput = document.getElementById('editZijRoemInput');
  const editPlayingTeamButtons = document.getElementById('editPlayingTeamButtons');
  const editTellerTeamButtons = document.getElementById('editTellerTeamButtons');
  const editSuitButtons = document.getElementById('editSuitButtons');
  const saveEditBtn = document.getElementById('saveEditBtn');
  const deleteRoundBtn = document.getElementById('deleteRoundBtn');
  const cancelEditBtn = document.getElementById('cancelEditBtn');
  // Eindspel modal
  const finalModal = document.getElementById('finalModal');
  const finalHeader = document.getElementById('finalHeader');
  const finalText = document.getElementById('finalText');
  const closeFinalBtn = document.getElementById('closeFinalBtn');
  // Tussenstand
  const intermediateMessageEl = document.getElementById('intermediateMessage');

  // ===== Interne status =====
  // Ronde gegevens
  let rounds = [];
  // Selecties voor nieuwe ronde
  let selectedPlayingTeam = 'wij';
  let selectedTellerTeam = 'wij';
  let selectedSuit = null;
  let currentWijRoem = 0;
  let currentZijRoem = 0;
  // Selecties voor bewerken
  let editSelectedPlayingTeam = null;
  let editSelectedTellerTeam = null;
  let editSelectedSuit = null;
  let editIndex = null;
  // Eindspel al getoond?
  let finalShown = false;

  // ===== Helper functies =====
  // Update de roemcounters weergave
  function updateRoemDisplays() {
    wijRoemDisplay.textContent = currentWijRoem;
    zijRoemDisplay.textContent = currentZijRoem;
  }

  // Markeer welke teamknop geselecteerd is binnen een container
  function updateTeamButtonSelection(container, team) {
    const buttons = container.querySelectorAll('.team-btn');
    buttons.forEach((btn) => {
      if (btn.dataset.team === team) {
        btn.classList.add('selected');
      } else {
        btn.classList.remove('selected');
      }
    });
  }

  // Markeer welke suitknop geselecteerd is binnen een container
  function updateSuitButtonSelection(container, suit) {
    const buttons = container.querySelectorAll('.suit-btn');
    buttons.forEach((btn) => {
      if (btn.dataset.suit === suit) {
        btn.classList.add('selected');
      } else {
        btn.classList.remove('selected');
      }
    });
  }

  /**
   * Bereken alle waarden van een ronde op basis van het tellende team, spelende team,
   * behaalde punten en roem. Zorgt voor nat/pit logica. Geeft een object terug
   * met punten, roem en totalen voor beide teams plus de flags nat en pit.
   */
  function calculateRound(tellerTeam, playingTeam, points, wijRoemInput, zijRoemInput) {
    // Basispunten op basis van tellend team
    let wijPoints, zijPoints;
    if (tellerTeam === 'wij') {
      wijPoints = points;
      zijPoints = 162 - points;
    } else {
      zijPoints = points;
      wijPoints = 162 - points;
    }
    // Roem kopiëren
    let wijRoem = wijRoemInput;
    let zijRoem = zijRoemInput;
    // Pit: spelend team wint alle slagen (162)
    let pit = false;
    if (playingTeam === 'wij' && wijPoints === 162) {
      pit = true;
      wijRoem += 100;
    } else if (playingTeam === 'zij' && zijPoints === 162) {
      pit = true;
      zijRoem += 100;
    }
    // Totaal berekenen
    let wijTotal = wijPoints + wijRoem;
    let zijTotal = zijPoints + zijRoem;
    let nat = false;
    if (playingTeam === 'wij') {
      if (wijTotal <= zijTotal) {
        nat = true;
        const totalRoem = wijRoem + zijRoem;
        wijPoints = 0;
        wijRoem = 0;
        wijTotal = 0;
        zijPoints = 162;
        zijRoem = totalRoem;
        zijTotal = 162 + totalRoem;
        pit = false;
      }
    } else {
      if (zijTotal <= wijTotal) {
        nat = true;
        const totalRoem = wijRoem + zijRoem;
        zijPoints = 0;
        zijRoem = 0;
        zijTotal = 0;
        wijPoints = 162;
        wijRoem = totalRoem;
        wijTotal = 162 + totalRoem;
        pit = false;
      }
    }
    return {
      tellerTeam,
      playingTeam,
      tellerPoints: points,
      wijPoints,
      zijPoints,
      wijRoem,
      zijRoem,
      wijTotal,
      zijTotal,
      nat,
      pit,
    };
  }

  // Update samenvattende totaalvelden (aggregaten) in het scorebord
  function updateSummaryTotals() {
    let totWijPoints = 0;
    let totWijRoem = 0;
    let totWijTotal = 0;
    let totZijPoints = 0;
    let totZijRoem = 0;
    let totZijTotal = 0;
    rounds.forEach((r) => {
      totWijPoints += r.wijPoints;
      totWijRoem += r.wijRoem;
      totWijTotal += r.wijTotal;
      totZijPoints += r.zijPoints;
      totZijRoem += r.zijRoem;
      totZijTotal += r.zijTotal;
    });
    if (totWijSummaryEl && totZijSummaryEl) {
      totWijSummaryEl.textContent = `${totWijTotal}`;
      totZijSummaryEl.textContent = `${totZijTotal}`;
    }
  }

  // Update detail totaalvelden (punten, roem, totaal)
  function updateDetailTotals() {
    let totWijPoints = 0;
    let totWijRoem = 0;
    let totWijTotal = 0;
    let totZijPoints = 0;
    let totZijRoem = 0;
    let totZijTotal = 0;
    rounds.forEach((r) => {
      totWijPoints += r.wijPoints;
      totWijRoem += r.wijRoem;
      totWijTotal += r.wijTotal;
      totZijPoints += r.zijPoints;
      totZijRoem += r.zijRoem;
      totZijTotal += r.zijTotal;
    });
    detTotWijPointsEl.textContent = totWijPoints;
    detTotWijRoemEl.textContent = totWijRoem;
    detTotWijTotalEl.textContent = totWijTotal;
    detTotZijPointsEl.textContent = totZijPoints;
    detTotZijRoemEl.textContent = totZijRoem;
    detTotZijTotalEl.textContent = totZijTotal;
  }

  // Render het samenvattende scorebord
  function renderSummaryTable() {
    summaryTableBody.innerHTML = '';
    rounds.forEach((r, index) => {
      const row = summaryTableBody.insertRow(-1);
      // ronde nummer
      row.insertCell(0).textContent = index + 1;
      // wij total
      row.insertCell(1).textContent = r.wijTotal;
      // zij total
      row.insertCell(2).textContent = r.zijTotal;
      // acties
      const actionCell = row.insertCell(3);
      // Plaats een potloodpictogram als edit-knop
      actionCell.innerHTML = '✏️';
      actionCell.classList.add('edit-btn');
      actionCell.setAttribute('onclick', `openEditModal(${index})`);
    });
  }

  // Render het gedetailleerde scorebord (voor modal)
  function renderDetailTable() {
    detailTableBody.innerHTML = '';
    const suitSymbols = {
      hearts: '♥',
      diamonds: '♦',
      clubs: '♣',
      spades: '♠',
    };
    rounds.forEach((r, index) => {
      const row = detailTableBody.insertRow(-1);
      row.insertCell(0).textContent = index + 1;
      row.insertCell(1).textContent = r.wijPoints;
      row.insertCell(2).textContent = r.wijRoem;
      row.insertCell(3).textContent = r.wijTotal;
      row.insertCell(4).textContent = r.zijPoints;
      row.insertCell(5).textContent = r.zijRoem;
      row.insertCell(6).textContent = r.zijTotal;
      row.insertCell(7).textContent = r.playingTeam;
      row.insertCell(8).textContent = r.nat ? 'Ja' : 'Nee';
      row.insertCell(9).textContent = r.pit ? 'Ja' : 'Nee';
      row.insertCell(10).textContent = r.suit ? suitSymbols[r.suit] || '' : '';
      // acties
      const actionCell = row.insertCell(11);
      actionCell.innerHTML = '✏️';
      actionCell.classList.add('edit-btn');
      actionCell.setAttribute('onclick', `openEditModal(${index})`);
    });
  }

  // Tussenstand tonen (na elke 4 rondes) of verbergen
  function updateIntermediate() {
    intermediateMessageEl.style.display = 'none';
    if (rounds.length >= 16) {
      // speel afgelopen: verberg tussenstand
      return;
    }
    if (rounds.length % 4 === 0 && rounds.length !== 0) {
      let wijTotal = 0;
      let zijTotal = 0;
      rounds.forEach((r) => {
        wijTotal += r.wijTotal;
        zijTotal += r.zijTotal;
      });
      intermediateMessageEl.textContent = `Tussenstand na ronde ${rounds.length}: Wij ${wijTotal} punten, Zij ${zijTotal} punten.`;
      intermediateMessageEl.style.display = 'block';
    }
  }

  // Controleer of het spel afgelopen is (16 rondes). Toon eindmodal indien nodig.
  function checkEndGame() {
    if (rounds.length >= 16) {
      addRoundBtn.disabled = true;
      if (!finalShown) {
        showFinalModal();
        finalShown = true;
      }
    } else {
      addRoundBtn.disabled = false;
      // verberg eindmodal als we opnieuw beginnen
      if (finalShown) {
        finalModal.style.display = 'none';
        finalShown = false;
      }
    }
  }

  // Toon felicitaties en einduitslag
  function showFinalModal() {
    let totWijTotal = 0;
    let totWijPoints = 0;
    let totWijRoem = 0;
    let totZijTotal = 0;
    let totZijPoints = 0;
    let totZijRoem = 0;
    rounds.forEach((r) => {
      totWijTotal += r.wijTotal;
      totWijPoints += r.wijPoints;
      totWijRoem += r.wijRoem;
      totZijTotal += r.zijTotal;
      totZijPoints += r.zijPoints;
      totZijRoem += r.zijRoem;
    });
    // Bepaal winnaars
    const t1p1 = document.getElementById('team1Player1').value || 'Team 1';
    const t1p2 = document.getElementById('team1Player2').value || '';
    const t2p1 = document.getElementById('team2Player1').value || 'Team 2';
    const t2p2 = document.getElementById('team2Player2').value || '';
    let header;
    if (totWijTotal > totZijTotal) {
      const winners = [t1p1, t1p2].filter(Boolean).join(' en ');
      header = `Gefeliciteerd ${winners}!`;
    } else if (totZijTotal > totWijTotal) {
      const winners = [t2p1, t2p2].filter(Boolean).join(' en ');
      header = `Gefeliciteerd ${winners}!`;
    } else {
      header = 'Eindstand gelijkspel!';
    }
    finalHeader.textContent = header;
    finalText.innerHTML =
      `Team 1: ${totWijPoints}/${totWijRoem}/${totWijTotal}<br>` +
      `Team 2: ${totZijPoints}/${totZijRoem}/${totZijTotal}`;
    finalModal.style.display = 'flex';
  }

  // Voeg een nieuwe ronde toe op basis van invoer
  function addRound() {
    const points = parseInt(pointsInput.value, 10);
    if (isNaN(points) || points < 0 || points > 162) {
      alert('Voer een geldig aantal punten in voor het tellende team (0 t/m 162).');
      return;
    }
    // Gebruik de geselecteerde teams en kaart; standaard 'wij' als niet ingesteld
    const tellerTeam = selectedTellerTeam || 'wij';
    const playingTeam = selectedPlayingTeam || 'wij';
    const roundData = calculateRound(tellerTeam, playingTeam, points, currentWijRoem, currentZijRoem);
    // Voeg suit toe
    roundData.suit = selectedSuit;
    rounds.push(roundData);
    // Reset invoervelden
    pointsInput.value = '';
    currentWijRoem = 0;
    currentZijRoem = 0;
    selectedSuit = null;
    updateRoemDisplays();
    updateSuitButtonSelection(suitButtons, null);
    // Render en update
    renderSummaryTable();
    updateSummaryTotals();
    updateIntermediate();
    checkEndGame();
    saveState();
  }

  // Bewaar de huidige staat in localStorage
  function saveState() {
    localStorage.setItem('klaverjas_rounds', JSON.stringify(rounds));
    // Spelers en variant opslaan
    const players = {
      t1p1: document.getElementById('team1Player1').value,
      t1p2: document.getElementById('team1Player2').value,
      t2p1: document.getElementById('team2Player1').value,
      t2p2: document.getElementById('team2Player2').value,
    };
    localStorage.setItem('klaverjas_players', JSON.stringify(players));
    localStorage.setItem('klaverjas_variant', document.getElementById('variantSelect').value);
  }

  // Laad de opgeslagen staat uit localStorage
  function loadState() {
    const savedRounds = localStorage.getItem('klaverjas_rounds');
    if (savedRounds) {
      rounds = JSON.parse(savedRounds);
    }
    // Herstel spelers en variant
    const savedPlayers = localStorage.getItem('klaverjas_players');
    if (savedPlayers) {
      const p = JSON.parse(savedPlayers);
      document.getElementById('team1Player1').value = p.t1p1 || '';
      document.getElementById('team1Player2').value = p.t1p2 || '';
      document.getElementById('team2Player1').value = p.t2p1 || '';
      document.getElementById('team2Player2').value = p.t2p2 || '';
    }
    const savedVariant = localStorage.getItem('klaverjas_variant');
    if (savedVariant) {
      document.getElementById('variantSelect').value = savedVariant;
    }
    // Render
    renderSummaryTable();
    updateSummaryTotals();
    updateIntermediate();
    checkEndGame();
  }

  // Wis alle rondes en begin opnieuw
  function resetGame() {
    if (!confirm('Weet je zeker dat je een nieuw spel wilt starten? Alle rondes worden verwijderd.')) {
      return;
    }
    rounds = [];
    renderSummaryTable();
    updateSummaryTotals();
    updateIntermediate();
    finalModal.style.display = 'none';
    finalShown = false;
    addRoundBtn.disabled = false;
    pointsInput.value = '';
    currentWijRoem = 0;
    currentZijRoem = 0;
    selectedSuit = null;
    updateRoemDisplays();
    updateSuitButtonSelection(suitButtons, null);
    saveState();
  }

  // Maak de invoervelden schoon (roem en punten) zonder te resetten
  function clearInputs() {
    pointsInput.value = '';
    currentWijRoem = 0;
    currentZijRoem = 0;
    selectedSuit = null;
    updateRoemDisplays();
    updateSuitButtonSelection(suitButtons, null);
  }

  // Open het gedetailleerde scorebord in een modal
  function openDetailModal() {
    renderDetailTable();
    updateDetailTotals();
    detailModal.style.display = 'flex';
  }
  // Sluit het gedetailleerde scorebord
  function closeDetailModal() {
    detailModal.style.display = 'none';
  }

  // Open het bewerkmodal voor een specifieke ronde
  function openEditModal(index) {
    editIndex = index;
    const r = rounds[index];
    // Vul waarden in
    editPointsInput.value = r.tellerPoints;
    editWijRoemInput.value = r.wijRoem;
    editZijRoemInput.value = r.zijRoem;
    editSelectedPlayingTeam = r.playingTeam;
    editSelectedTellerTeam = r.tellerTeam;
    editSelectedSuit = r.suit || null;
    // Update button states
    updateTeamButtonSelection(editPlayingTeamButtons, editSelectedPlayingTeam);
    updateTeamButtonSelection(editTellerTeamButtons, editSelectedTellerTeam);
    updateSuitButtonSelection(editSuitButtons, editSelectedSuit);
    editModal.style.display = 'flex';
  }

  // Sluit het bewerkmodal zonder opslaan
  function closeEditModal() {
    editModal.style.display = 'none';
    editIndex = null;
    editSelectedPlayingTeam = null;
    editSelectedTellerTeam = null;
    editSelectedSuit = null;
  }

  // Sla wijzigingen uit de bewerkmodal op
  function saveEdit() {
    if (editIndex === null) return;
    const points = parseInt(editPointsInput.value, 10);
    if (isNaN(points) || points < 0 || points > 162) {
      alert('Voer een geldig aantal punten in voor het tellende team (0 t/m 162).');
      return;
    }
    const tellerTeam = editSelectedTellerTeam || 'wij';
    const playingTeam = editSelectedPlayingTeam || 'wij';
    const wijRoemVal = parseInt(editWijRoemInput.value, 10) || 0;
    const zijRoemVal = parseInt(editZijRoemInput.value, 10) || 0;
    const newRound = calculateRound(tellerTeam, playingTeam, points, wijRoemVal, zijRoemVal);
    newRound.suit = editSelectedSuit;
    rounds[editIndex] = newRound;
    closeEditModal();
    renderSummaryTable();
    updateSummaryTotals();
    updateIntermediate();
    checkEndGame();
    saveState();
  }

  // Verwijder een ronde
  function deleteRound() {
    if (editIndex === null) return;
    if (!confirm('Weet je zeker dat je deze ronde wilt verwijderen?')) {
      return;
    }
    rounds.splice(editIndex, 1);
    closeEditModal();
    renderSummaryTable();
    updateSummaryTotals();
    updateIntermediate();
    checkEndGame();
    saveState();
  }

  // ===== Event listeners =====
  // Team knop selectie (nieuwe ronde)
  playingTeamButtons.querySelectorAll('.team-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      selectedPlayingTeam = btn.dataset.team;
      updateTeamButtonSelection(playingTeamButtons, selectedPlayingTeam);
    });
  });
  tellerTeamButtons.querySelectorAll('.team-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      selectedTellerTeam = btn.dataset.team;
      updateTeamButtonSelection(tellerTeamButtons, selectedTellerTeam);
    });
  });
  // Suit knop selectie (nieuwe ronde)
  suitButtons.querySelectorAll('.suit-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const suit = btn.dataset.suit;
      if (selectedSuit === suit) {
        // deselect
        selectedSuit = null;
      } else {
        selectedSuit = suit;
      }
      updateSuitButtonSelection(suitButtons, selectedSuit);
    });
  });
  // Roem knoppen
  wijRoem20Btn.addEventListener('click', () => {
    currentWijRoem += 20;
    updateRoemDisplays();
  });
  wijRoem50Btn.addEventListener('click', () => {
    currentWijRoem += 50;
    updateRoemDisplays();
  });
  zijRoem20Btn.addEventListener('click', () => {
    currentZijRoem += 20;
    updateRoemDisplays();
  });
  zijRoem50Btn.addEventListener('click', () => {
    currentZijRoem += 50;
    updateRoemDisplays();
  });
  // Acties voor nieuwe ronde
  addRoundBtn.addEventListener('click', addRound);
  resetGameBtn.addEventListener('click', resetGame);
  clearInputsBtn.addEventListener('click', clearInputs);
  // Detail modal events
  showDetailBtn.addEventListener('click', openDetailModal);
  closeDetailBtn.addEventListener('click', closeDetailModal);
  // Edit modal events
  saveEditBtn.addEventListener('click', saveEdit);
  deleteRoundBtn.addEventListener('click', deleteRound);
  cancelEditBtn.addEventListener('click', closeEditModal);
  // Edit suit/team knop selectie
  editPlayingTeamButtons.querySelectorAll('.team-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      editSelectedPlayingTeam = btn.dataset.team;
      updateTeamButtonSelection(editPlayingTeamButtons, editSelectedPlayingTeam);
    });
  });
  editTellerTeamButtons.querySelectorAll('.team-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      editSelectedTellerTeam = btn.dataset.team;
      updateTeamButtonSelection(editTellerTeamButtons, editSelectedTellerTeam);
    });
  });
  editSuitButtons.querySelectorAll('.suit-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const suit = btn.dataset.suit;
      if (editSelectedSuit === suit) {
        editSelectedSuit = null;
      } else {
        editSelectedSuit = suit;
      }
      updateSuitButtonSelection(editSuitButtons, editSelectedSuit);
    });
  });
  // Final modal sluitknop
  closeFinalBtn.addEventListener('click', () => {
    finalModal.style.display = 'none';
  });
  // Opslaan van spelers en variant bij wijziging
  document.getElementById('team1Player1').addEventListener('change', saveState);
  document.getElementById('team1Player2').addEventListener('change', saveState);
  document.getElementById('team2Player1').addEventListener('change', saveState);
  document.getElementById('team2Player2').addEventListener('change', saveState);
  document.getElementById('variantSelect').addEventListener('change', saveState);

  // Maak openEditModal globaal toegankelijk zodat inline onclick werkt
  window.openEditModal = openEditModal;

  // ===== Initialisatie =====
  // Standaardselecties
  updateTeamButtonSelection(playingTeamButtons, selectedPlayingTeam);
  updateTeamButtonSelection(tellerTeamButtons, selectedTellerTeam);
  updateSuitButtonSelection(suitButtons, selectedSuit);
  updateRoemDisplays();
  // Laad eerder opgeslagen rondes
  loadState();
});