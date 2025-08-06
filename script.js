/*
 * script.js
 *
 * Bevat de logica voor het bijhouden van de score van een klaverjas-partij.
 * De gebruiker vult de behaalde punten in van het team dat heeft geteld.
 * Het andere team krijgt automatisch het restant (162 - behaalde punten).
 * Roem kan afzonderlijk ingevoerd worden voor beide teams, maar telt mee bij de
 * totale score. Het spelende team wordt opgegeven zodat de app kan bepalen
 * of een partij 'nat' is (als het spelende team minder of evenveel punten
 * inclusief roem haalt dan de tegenpartij). In dat geval gaan alle punten
 * en roem naar de tegenpartij.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Elementen uit de DOM ophalen
  const playingTeamButtons = document.getElementById('playingTeamButtons');
  const tellerTeamButtons = document.getElementById('tellerTeamButtons');
  const editPlayingTeamButtons = document.getElementById('editPlayingTeamButtons');
  const editTellerTeamButtons = document.getElementById('editTellerTeamButtons');
  const pointsInput = document.getElementById('pointsInput');
  const wijRoemDisplay = document.getElementById('wijRoemDisplay');
  const zijRoemDisplay = document.getElementById('zijRoemDisplay');
  const wijRoem20Btn = document.getElementById('wijRoem20');
  const wijRoem50Btn = document.getElementById('wijRoem50');
  const zijRoem20Btn = document.getElementById('zijRoem20');
  const zijRoem50Btn = document.getElementById('zijRoem50');
  const addRoundBtn = document.getElementById('addRoundBtn');
  const resetGameBtn = document.getElementById('resetGameBtn');
  const clearInputsBtn = document.getElementById('clearInputsBtn');
  const scoreTableBody = document.querySelector('#scoreTable tbody');
  const intermediateMessageEl = document.getElementById('intermediateMessage');
  const totWijPointsEl = document.getElementById('totWijPoints');
  const totWijRoemEl = document.getElementById('totWijRoem');
  const totWijTotalEl = document.getElementById('totWijTotal');
  const totZijPointsEl = document.getElementById('totZijPoints');
  const totZijRoemEl = document.getElementById('totZijRoem');
  const totZijTotalEl = document.getElementById('totZijTotal');
  // Modal elementen
  const editModal = document.getElementById('editModal');
  const editPointsInput = document.getElementById('editPointsInput');
  const editWijRoemInput = document.getElementById('editWijRoemInput');
  const editZijRoemInput = document.getElementById('editZijRoemInput');
  const saveEditBtn = document.getElementById('saveEditBtn');
  const deleteRoundBtn = document.getElementById('deleteRoundBtn');
  const cancelEditBtn = document.getElementById('cancelEditBtn');

  // Eindspel modal elementen
  const finalModal = document.getElementById('finalModal');
  const finalHeader = document.getElementById('finalHeader');
  const finalText = document.getElementById('finalText');
  const closeFinalBtn = document.getElementById('closeFinalBtn');

  // Roem counters voor huidige ronde
  let currentWijRoem = 0;
  let currentZijRoem = 0;
  // Geselecteerde teams voor de nieuwe ronde
  let selectedPlayingTeam = 'wij';
  let selectedTellerTeam = 'wij';
  // Geselecteerde teams en index voor het bewerken
  let editSelectedPlayingTeam = null;
  let editSelectedTellerTeam = null;
  let editIndex = null;

  // Dataopslag voor rondes
  let rounds = [];

  // Eindspel getoond? (om te voorkomen dat de modale popup meerdere keren opent)
  let finalShown = false;

  // Helper: roem display bijwerken
  function updateRoemDisplays() {
    wijRoemDisplay.textContent = currentWijRoem;
    zijRoemDisplay.textContent = currentZijRoem;
  }

  // Hulpfunctie om teamknoppen te selecteren
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

  // Functie om totalen te herberekenen en weer te geven
  function updateTotals() {
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
    totWijPointsEl.textContent = totWijPoints;
    totWijRoemEl.textContent = totWijRoem;
    totWijTotalEl.textContent = totWijTotal;
    totZijPointsEl.textContent = totZijPoints;
    totZijRoemEl.textContent = totZijRoem;
    totZijTotalEl.textContent = totZijTotal;
  }

  // Functie om een tussenstandbericht te tonen (of te verbergen)
  function updateIntermediate() {
    intermediateMessageEl.style.display = 'none';
    // Als spel volledig, laat de felicitaties via modal zien; verberg tussenstandbericht
    if (rounds.length >= 16) {
      intermediateMessageEl.style.display = 'none';
      return;
    }
    // Tussenstand na iedere 4 rondes (4, 8, 12)
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

  // Functie om het einde van het spel te controleren (16 rondes)
  function checkEndGame() {
    if (rounds.length >= 16) {
      addRoundBtn.disabled = true;
      // Toon eindspel-modal slechts één keer
      if (!finalShown) {
        showFinalModal();
        finalShown = true;
      }
    } else {
      // Minder dan 16 rondes: sta nieuwe rondes toe en verberg felicitaties indien nodig
      addRoundBtn.disabled = false;
      if (finalShown) {
        finalModal.style.display = 'none';
        finalShown = false;
      }
    }
  }

  /**
   * Toon de felicitaties en de einduitslag wanneer 16 rondes zijn gespeeld.
   * Bepaalt het winnende team op basis van het totaal van punten + roem.
   * Gebruikt de ingevoerde spelersnamen om de winnaars te tonen.
   */
  function showFinalModal() {
    // Totals verzamelen
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
    // Winnaars bepalen
    let header;
    // Team 1 (wij) spelers
    const t1p1 = document.getElementById('team1Player1').value || 'Wij';
    const t1p2 = document.getElementById('team1Player2').value || '';
    // Team 2 (zij) spelers
    const t2p1 = document.getElementById('team2Player1').value || 'Zij';
    const t2p2 = document.getElementById('team2Player2').value || '';
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
    // Bericht met punten, roem en totaal per team
    finalText.innerHTML =
      `Team Wij: ${totWijPoints} punten, ${totWijRoem} roem, totaal ${totWijTotal}.<br>` +
      `Team Zij: ${totZijPoints} punten, ${totZijRoem} roem, totaal ${totZijTotal}.`;
    finalModal.style.display = 'flex';
  }

  // Rondecalculatie: neemt tellerTeam, playingTeam, tellerPoints, wijRoem, zijRoem en retourneert rondedata
  function calculateRound(tellerTeam, playingTeam, points, wijRoemInput, zijRoemInput) {
    // Basispunten
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
    // Pit?
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
      tellerTeam: tellerTeam,
      tellerPoints: points,
      playingTeam: playingTeam,
      wijPoints: wijPoints,
      zijPoints: zijPoints,
      wijRoem: wijRoem,
      zijRoem: zijRoem,
      wijTotal: wijTotal,
      zijTotal: zijTotal,
      nat: nat,
      pit: pit,
    };
  }

  // Functie om het scorebord te renderen
  function renderTable() {
    scoreTableBody.innerHTML = '';
    // Array met labels voor data-label attributen in dezelfde volgorde als de cellen
    const labels = ['#','Wij punten','Wij roem','Wij totaal','Zij punten','Zij roem','Zij totaal','Spelend team','Nat?','Pit?','Acties'];
    rounds.forEach((r, index) => {
      r.roundNo = index + 1;
      const row = scoreTableBody.insertRow(-1);
      // Data voor de cellen (alleen tekst, actie wordt later gezet)
      const cellValues = [
        r.roundNo,
        r.wijPoints,
        r.wijRoem,
        r.wijTotal,
        r.zijPoints,
        r.zijRoem,
        r.zijTotal,
        r.playingTeam,
        r.nat ? 'Ja' : 'Nee',
        r.pit ? 'Ja' : 'Nee'
      ];
      // Voeg cells toe voor alle waarden
      cellValues.forEach((val, i) => {
        const cell = row.insertCell(-1);
        cell.setAttribute('data-label', labels[i]);
        cell.textContent = val;
      });
      // Actie cell
      const actionCell = row.insertCell(-1);
      actionCell.setAttribute('data-label', labels[10]);
      actionCell.innerHTML = '✏️';
      actionCell.classList.add('edit-btn');
      actionCell.setAttribute('onclick', `openEditModal(${index})`);
    });
  }

  // Functie om een ronde toe te voegen
  function addRound() {
    const points = parseInt(pointsInput.value, 10);
    if (isNaN(points) || points < 0 || points > 162) {
      alert('Voer een geldig aantal punten in voor het tellende team (0 t/m 162).');
      return;
    }
    // Gebruik geselecteerde teams (val op 'wij' als niet geselecteerd)
    const tellerTeam = selectedTellerTeam || 'wij';
    const playingTeam = selectedPlayingTeam || 'wij';
    // Bereken ronde
    const r = calculateRound(tellerTeam, playingTeam, points, currentWijRoem, currentZijRoem);
    rounds.push(r);
    // Reset invoer
    pointsInput.value = '';
    currentWijRoem = 0;
    currentZijRoem = 0;
    updateRoemDisplays();
    // Update en opslaan
    renderTable();
    updateTotals();
    updateIntermediate();
    checkEndGame();
    saveState();
  }

  // Functie om de app-stand op te slaan in localStorage
  function saveState() {
    localStorage.setItem('klaverjas_rounds', JSON.stringify(rounds));
    const players = {
      t1p1: document.getElementById('team1Player1').value,
      t1p2: document.getElementById('team1Player2').value,
      t2p1: document.getElementById('team2Player1').value,
      t2p2: document.getElementById('team2Player2').value,
    };
    localStorage.setItem('klaverjas_players', JSON.stringify(players));
    localStorage.setItem('klaverjas_variant', document.getElementById('variantSelect').value);
  }

  // Functie om de app-stand te laden uit localStorage
  function loadState() {
    const savedRounds = localStorage.getItem('klaverjas_rounds');
    if (savedRounds) {
      rounds = JSON.parse(savedRounds);
      // Voor oudere versies kunnen tellerTeam/tellerPoints ontbreken; herstel indien nodig
      rounds.forEach((r) => {
        if (!r.tellerTeam) {
          r.tellerTeam = 'wij';
        }
        if (typeof r.tellerPoints === 'undefined') {
          // Probeer punten van tellend team te reconstrueren: neem hoogste van wijPoints en zijPoints of 162 - andere
          r.tellerPoints = r.tellerTeam === 'wij' ? r.wijPoints : r.zijPoints;
        }
      });
    }
    renderTable();
    updateTotals();
    // Spelers en variant laden
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
    updateIntermediate();
    checkEndGame();
  }

  // Functie om het spel te resetten
  function resetGame() {
    if (!confirm('Weet je zeker dat je een nieuw spel wilt starten? Alle rondes worden verwijderd.')) {
      return;
    }
    rounds = [];
    renderTable();
    updateTotals();
    intermediateMessageEl.style.display = 'none';
    // Eindspel-prompt verbergen en resetten
    finalModal.style.display = 'none';
    finalShown = false;
    localStorage.removeItem('klaverjas_rounds');
    pointsInput.value = '';
    currentWijRoem = 0;
    currentZijRoem = 0;
    updateRoemDisplays();
    addRoundBtn.disabled = false;
    saveState();
  }

  // Bewerken modal openen
  function openEditModal(index) {
    editIndex = index;
    const r = rounds[index];
    // Stel invoervelden in
    editPointsInput.value = r.tellerPoints;
    editWijRoemInput.value = r.wijRoem;
    editZijRoemInput.value = r.zijRoem;
    editSelectedPlayingTeam = r.playingTeam;
    // Als tellerTeam ontbreekt gebruik opgeslagen waarde of default
    editSelectedTellerTeam = r.tellerTeam || 'wij';
    updateTeamButtonSelection(editPlayingTeamButtons, editSelectedPlayingTeam);
    updateTeamButtonSelection(editTellerTeamButtons, editSelectedTellerTeam);
    editModal.style.display = 'flex';
  }

  // Bewerken modal annuleren
  function closeEditModal() {
    editModal.style.display = 'none';
    editIndex = null;
  }

  // Bewerken modal opslaan
  function saveEdit() {
    if (editIndex === null) return;
    const points = parseInt(editPointsInput.value, 10);
    if (isNaN(points) || points < 0 || points > 162) {
      alert('Voer een geldig aantal punten in voor het tellende team (0 t/m 162).');
      return;
    }
    const tellerTeam = editSelectedTellerTeam || 'wij';
    const playingTeam = editSelectedPlayingTeam || 'wij';
    const wijRoem = parseInt(editWijRoemInput.value, 10) || 0;
    const zijRoem = parseInt(editZijRoemInput.value, 10) || 0;
    const newRound = calculateRound(tellerTeam, playingTeam, points, wijRoem, zijRoem);
    rounds[editIndex] = newRound;
    closeEditModal();
    renderTable();
    updateTotals();
    updateIntermediate();
    checkEndGame();
    saveState();
  }

  // Bewerken modal verwijderen
  function deleteRound() {
    if (editIndex === null) return;
    if (!confirm('Weet je zeker dat je deze ronde wilt verwijderen?')) {
      return;
    }
    rounds.splice(editIndex, 1);
    closeEditModal();
    renderTable();
    updateTotals();
    updateIntermediate();
    checkEndGame();
    saveState();
  }

  // Roem knoppen functionaliteit
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

  // Team knop events (nieuwe ronde)
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
  // Team knop events (bewerken modal)
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

  // Eventlisteners voor knoppen
  addRoundBtn.addEventListener('click', addRound);
  resetGameBtn.addEventListener('click', resetGame);
  saveEditBtn.addEventListener('click', saveEdit);
  deleteRoundBtn.addEventListener('click', deleteRound);
  cancelEditBtn.addEventListener('click', closeEditModal);

  // Clear-button: reset huidige invoer (punten en roem)
  clearInputsBtn.addEventListener('click', () => {
    // Zet roem counters terug naar 0
    currentWijRoem = 0;
    currentZijRoem = 0;
    updateRoemDisplays();
    // Maak puntenveld leeg
    pointsInput.value = '';
  });


  // Opslaan van spelers en variant wanneer aangepast
  document.getElementById('team1Player1').addEventListener('change', saveState);
  document.getElementById('team1Player2').addEventListener('change', saveState);
  document.getElementById('team2Player1').addEventListener('change', saveState);
  document.getElementById('team2Player2').addEventListener('change', saveState);
  document.getElementById('variantSelect').addEventListener('change', saveState);

  // Eindspel modal sluiten
  closeFinalBtn.addEventListener('click', () => {
    finalModal.style.display = 'none';
  });

  // Initialisatie: standaardselecties tonen
  updateTeamButtonSelection(playingTeamButtons, selectedPlayingTeam);
  updateTeamButtonSelection(tellerTeamButtons, selectedTellerTeam);
  updateRoemDisplays();
  loadState();

  // Maak de edit-functie globaal beschikbaar zodat onclick op de actiebalk functioneert
  window.openEditModal = openEditModal;
});