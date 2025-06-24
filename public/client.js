const socket = io();
const name = prompt('Enter your name');
socket.emit('join', name);
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const hud = document.getElementById('hud');
const scoreboardEl = document.getElementById('scoreboard');
const abilityEl = document.getElementById('ability').firstElementChild;

const player = { id: null, x: 0, y: 0, size: 20, abilityCooldown: 0 };
let pellets = [];
let mapSize = 2000;

socket.on('init', (data) => {
  player.id = data.id;
  pellets = data.pellets;
  mapSize = data.MAP_SIZE;
});

socket.on('state', (players, newPellets) => {
  pellets = newPellets;
  draw(players);
});

const keys = {};
window.addEventListener('keydown', (e) => {
  keys[e.key] = true;
  if (e.key === ' ') {
    socket.emit('ability');
  }
});

window.addEventListener('keyup', (e) => {
  keys[e.key] = false;
});

function update() {
  const dir = { x: 0, y: 0 };
  if (keys['w'] || keys['ArrowUp']) dir.y -= 1;
  if (keys['s'] || keys['ArrowDown']) dir.y += 1;
  if (keys['a'] || keys['ArrowLeft']) dir.x -= 1;
  if (keys['d'] || keys['ArrowRight']) dir.x += 1;
  socket.emit('move', dir);
}

function draw(players) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // camera center on local player
  const me = players.find(p => p.id === player.id);
  if (!me) return;
  player.x = me.x;
  player.y = me.y;
  player.size = me.size;
  player.abilityCooldown = me.abilityCooldown;

  const offsetX = canvas.width / 2 - player.x;
  const offsetY = canvas.height / 2 - player.y;

  // draw pellets
  ctx.fillStyle = '#44c';
  for (const pe of pellets) {
    ctx.beginPath();
    ctx.arc(pe.x + offsetX, pe.y + offsetY, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // draw players
  for (const p of players) {
    ctx.fillStyle = p.id === player.id ? '#0f0' : '#f00';
    ctx.beginPath();
    ctx.arc(p.x + offsetX, p.y + offsetY, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(p.name || 'Anon', p.x + offsetX, p.y + offsetY - p.size - 10);
    if (p.shield) {
      ctx.strokeStyle = '#0ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x + offsetX, p.y + offsetY, p.size + 4, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  hud.textContent = `Size: ${player.size}`;
  const sorted = [...players].sort((a,b) => b.size - a.size).slice(0,5);
  scoreboardEl.innerHTML = sorted.map(p => `${p.name || 'Anon'}: ${p.size}`).join('<br>');
  const cooldownRatio = 1 - Math.min(player.abilityCooldown, 300) / 300;
  abilityEl.style.width = `${cooldownRatio * 100}%`;
}

setInterval(update, 1000 / 30);
