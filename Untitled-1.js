// ===============================
// ✅ SECTION 1 — VARIABLES & INIT
// ===============================

// Données principales du jeu
let points = 0;
let quests = [];
let history = [];
let dailyCount = 0;
let activeQuest = null;

// Pool des quêtes journalières
const dailyQuestsPool = [
  {name:"Lire 20 minutes", reward:15, icon:"📖"},
  {name:"Marcher 30 minutes", reward:20, icon:"🚶"},
  {name:"Faire une sieste", reward:10, icon:"😴"},
  {name:"Boire 1L d’eau", reward:10, icon:"💧"},
  {name:"Faire du sport", reward:25, icon:"🏃"},
  {name:"Travailler 1h", reward:20, icon:"📚"},
  {name:"Écouter de la musique", reward:10, icon:"🎵"},
  {name:"Regarder un film en anglais", reward:25, icon:"🎬"},
  {name:"Ranger ta chambre", reward:15, icon:"🧹"},
  {name:"Aider quelqu’un", reward:20, icon:"🤝"},
  {name:"Dessiner ou créer", reward:15, icon:"🎨"},
  {name:"Faire un exercice de maths", reward:20, icon:"➗"},
  {name:"Écrire un texte ou journal", reward:15, icon:"✍️"},
  {name:"Méditer 10 minutes", reward:10, icon:"🧘"},
  {name:"Cuisiner quelque chose", reward:20, icon:"🍳"}
];

// Sauvegarde
function saveData() {
  localStorage.setItem("gameData", JSON.stringify({
    points, quests, history, dailyCount, activeQuest
  }));
}

// Chargement
function loadData() {
  const data = JSON.parse(localStorage.getItem("gameData"));
  if (!data) return;

  points = data.points;
  quests = data.quests;
  history = data.history;
  dailyCount = data.dailyCount;
  activeQuest = data.activeQuest;

  document.getElementById("points").innerText = points;
}

// Initialisation
loadData();

// ===========================================
// ✅ SECTION 2 — QUÊTES JOURNALIÈRES
// ===========================================

// Tire 3 quêtes aléatoires par jour
function getDailyQuests() {
  const today = new Date().toDateString();
  const savedDate = localStorage.getItem("dailyQuestsDate");

  // Nouveau jour → nouveau tirage
  if (savedDate !== today) {
    const shuffled = [...dailyQuestsPool].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 3);

    localStorage.setItem("dailyQuests", JSON.stringify(selected));
    localStorage.setItem("dailyQuestsDate", today);

    dailyCount = 0; // reset du compteur
  }

  return JSON.parse(localStorage.getItem("dailyQuests"));
}

// Affiche les quêtes journalières
function renderDailyQuests() {
  const list = document.getElementById("dailyList");
  list.innerHTML = "";

  const quests = getDailyQuests();

  quests.forEach(q => {
    list.innerHTML += `
      <label>
        <input type="checkbox" onchange="completeDaily(this, '${q.name}', ${q.reward})">
        ${q.icon} ${q.name} (+${q.reward} pts)
      </label>
    `;
  });
}

// Validation d’une quête journalière
function completeDaily(box, name, reward) {

  // Limite de 3 par jour
  if (dailyCount >= 3 && box.checked) {
    alert("Tu as déjà validé 3 quêtes journalières aujourd’hui !");
    box.checked = false;
    return;
  }

  // Ajout des points
  if (box.checked) {
    points += reward;
    dailyCount++;
    history.push(`📅 Quête journalière : ${name} (+${reward} pts)`);
  }

  document.getElementById("points").innerText = points;

  renderHistory();
  saveData();
  renderShop();
  checkMilestone();
}

// ===========================================
// ✅ SECTION 3 — QUÊTES PERSO (AJOUT & AFFICHAGE)
// ===========================================

// Ajout d'une quête perso
function addQuest() {
  const name = document.getElementById("questName").value.trim();
  const diff = parseInt(document.getElementById("difficulty").value);
  const duration = parseInt(document.getElementById("questDuration").value);

  if (!name || !duration) {
    alert("Entre un nom et une durée !");
    return;
  }

  if (duration > 240) {
    alert("Durée maximale : 4h (240 minutes)");
    return;
  }

  const reward = diff * 10;

  quests.push({
    name,
    diff,
    reward,
    duration,
    startTime: null
  });

  renderQuests();
  saveData();
}

// Affichage des quêtes perso
function renderQuests() {
  const container = document.getElementById("quests");
  container.innerHTML = "";

  quests.forEach((q, i) => {
    const stars = "⭐".repeat(q.diff);

    const durationText =
      q.duration < 60
        ? `${q.duration} min`
        : `${Math.floor(q.duration / 60)}h${q.duration % 60 ? q.duration % 60 + "m" : ""}`;

    container.innerHTML += `
      <div class="quest-card">
        <h3>${q.name}</h3>
        <p>Difficulté : ${stars} | Récompense : ${q.reward} pts | Durée : ${durationText}</p>

        <div class="progress-container">
          <div id="progress-${i}" class="progress-bar"></div>
        </div>

        <p id="timer-${i}" class="timer">⏳ Temps restant : non démarré</p>

        <button onclick="startQuest(${i})">Démarrer chrono</button>
        <button onclick="completeQuest(${i})">Valider</button>
        <button class="danger" onclick="cancelQuest(${i})">Annuler</button>
      </div>
    `;
  });
}

// Annuler une quête perso
function cancelQuest(i) {
  history.push(`❌ Quête annulée : ${quests[i].name}`);

  quests.splice(i, 1);
  activeQuest = null;

  renderQuests();
  renderHistory();
  saveData();
}

// ===========================================
// ✅ SECTION 4 — CHRONO + PROGRESS BAR + TIMER
// ===========================================

// Démarrer une quête
function startQuest(i) {
  if (activeQuest !== null) {
    alert("Tu as déjà une quête en cours !");
    return;
  }

  quests[i].startTime = Date.now();
  activeQuest = i;

  history.push(`⏱️ Quête lancée : ${quests[i].name} (${quests[i].duration} min)`);
  renderHistory();
  saveData();

  updateProgressBar(i);
}

// Met à jour la barre de progression + timer
function updateProgressBar(i) {
  const quest = quests[i];
  const bar = document.getElementById(`progress-${i}`);
  const timer = document.getElementById(`timer-${i}`);

  const durationMs = quest.duration * 60000;
  const start = quest.startTime;

  const interval = setInterval(() => {

    // Si la quête a été supprimée → stop
    if (!quests[i]) {
      clearInterval(interval);
      return;
    }

    const elapsed = Date.now() - start;
    const remaining = Math.max(durationMs - elapsed, 0);

    // Pourcentage de progression
    const percent = Math.min((elapsed / durationMs) * 100, 100);
    bar.style.width = percent + "%";

    // Affichage du temps restant
    const minutes = Math.floor(remaining / 60000);

    if (minutes >= 60) {
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      timer.innerText = `⏳ Temps restant : ${h}h${m > 0 ? m + "m" : ""}`;
    } else {
      timer.innerText = `⏳ Temps restant : ${minutes} min`;
    }

    // Quand le temps est écoulé
    if (percent >= 100) {
      clearInterval(interval);
      timer.innerText = "✅ Temps écoulé";
    }

  }, 1000);
}

// Valider une quête perso
function completeQuest(i) {
  const quest = quests[i];

  if (!quest.startTime) {
    alert("Tu dois lancer le chrono avant de valider !");
    return;
  }

  const elapsed = (Date.now() - quest.startTime) / 60000;
  const minRequired = quest.duration * 0.9; // 90% du temps minimum

  if (elapsed < minRequired) {
    alert("Tu as terminé trop vite, ça ne compte pas !");
    return;
  }

  points += quest.reward;
  history.push(`✅ Quête terminée : ${quest.name} (+${quest.reward} pts)`);

  quests.splice(i, 1);
  activeQuest = null;

  document.getElementById("points").innerText = points;

  renderQuests();
  renderHistory();
  renderShop();
  saveData();
  checkMilestone();
}

// ===========================================
// ✅ SECTION 5 — BOUTIQUE + PALIERS + END
// ===========================================

// Retourne la liste des objets disponibles selon le nombre de quêtes terminées
function getShopItems() {
  const completedQuests = history.filter(h => h.includes("Quête terminée")).length;
  const items = [];

  // Palier 0–19
  items.push(
    {name:"STONE", label:"🪨 Pierre", cost:10},
    {name:"OAK_PLANKS", label:"🪵 Bois", cost:15},
    {name:"GLASS", label:"🪟 Verre", cost:20},
    {name:"APPLE", label:"🍎 Pomme", cost:10},
    {name:"BREAD", label:"🥖 Pain", cost:12}
  );

  // Palier 20+
  if (completedQuests >= 20) {
    items.push(
      {name:"IRON_INGOT", label:"⛓️ Lingot de fer", cost:30},
      {name:"REDSTONE", label:"🔴 Redstone", cost:35},
      {name:"WATER_BUCKET", label:"💧 Seau d’eau", cost:25},
      {name:"LAVA_BUCKET", label:"🔥 Seau de lave", cost:25}
    );
  }

  // Palier 40+
  if (completedQuests >= 40) {
    items.push(
      {name:"DIAMOND", label:"💎 Diamant", cost:50},
      {name:"OBSIDIAN", label:"🟪 Obsidienne", cost:60},
      {name:"GOLD_INGOT", label:"🥇 Lingot d’or", cost:45},
      {name:"ENCHANTING_TABLE", label:"📖 Table d’enchantement", cost:70}
    );
  }

  // Palier 60+
  if (completedQuests >= 60) {
    items.push(
      {name:"NETHERITE_INGOT", label:"⚫ Netherite", cost:100},
      {name:"BEACON", label:"🔦 Beacon", cost:150},
      {name:"DRAGON_EGG", label:"🐉 Œuf de dragon", cost:200}
    );
  }

  // Palier 140+ (END)
  if (completedQuests >= 140) {
    items.push(
      {name:"ENDER_PEARL", label:"🟣 Perle de l’Ender", cost:120},
      {name:"EYE_OF_ENDER", label:"👁️ Œil de l’Ender", cost:150},
      {name:"END_PORTAL_FRAME", label:"🟪 Cadre de portail de l’End", cost:200},
      {name:"ELYTRA", label:"🪂 Élytra", cost:250}
    );
  }

  return items;
}

// Affiche la boutique
function renderShop() {
  const shopDiv = document.getElementById("shop");
  shopDiv.innerHTML = "";

  const items = getShopItems();

  items.forEach(item => {
    shopDiv.innerHTML += `
      <button onclick="buyBlock('${item.name}', ${item.cost})">
        ${item.label} (${item.cost} pts)
      </button>
    `;
  });
}

// Achat d’un objet
function buyBlock(block, cost) {
  if (points < cost) {
    alert("Pas assez de points !");
    return;
  }

  points -= cost;
  history.push(`🛒 Achat : ${block} (-${cost} pts)`);

  document.getElementById("points").innerText = points;
  renderHistory();
  saveData();

  alert(`Objet ${block} acheté !`);

  // Condition de victoire
  if (block === "ELYTRA" || block === "EYE_OF_ENDER") {
    alert("🏆 Félicitations ! Tu as atteint l'End et terminé le jeu !");
  }
}

// ===========================================
// ✅ SECTION 6 — HISTORIQUE + RESET + PALIERS
// ===========================================

// Affiche l'historique
function renderHistory() {
  const ul = document.getElementById("history");
  ul.innerHTML = "";

  history.forEach(entry => {
    ul.innerHTML += `<li>${entry}</li>`;
  });
}

// Supprime l'historique
function clearHistory() {
  history = [];
  renderHistory();
  saveData();
}

// Reset complet du jeu
function resetAll() {
  points = 0;
  quests = [];
  history = [];
  dailyCount = 0;
  activeQuest = null;

  // Reset visuel
  document.getElementById("points").innerText = points;
  document.querySelectorAll(".daily input").forEach(cb => cb.checked = false);

  renderQuests();
  renderHistory();
  renderShop();
  renderDailyQuests();
  saveData();
}

// Message de palier (20, 40, 60, 140 quêtes terminées)
function checkMilestone() {
  const completedQuests = history.filter(h => h.includes("Quête terminée")).length;

  if ([20, 40, 60, 140].includes(completedQuests)) {
    alert("🎉 Nouveau palier débloqué !");
  }

  if (completedQuests === 140) {
    alert("🚀 Tu peux maintenant acheter des objets de l’End !");
  }
}

// ===========================================
// ✅ SECTION 7 — INITIALISATION FINALE
// ===========================================

// Charge les données sauvegardées
loadData();

// Affiche tout ce qui doit être visible au démarrage
renderQuests();
renderHistory();
renderShop();
renderDailyQuests();
