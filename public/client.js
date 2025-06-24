const socket = io();
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const hud = document.getElementById('hud');

const player = { id: null, x: 0, y: 0, size: 20 };
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
    if (p.shield) {
      ctx.strokeStyle = '#0ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x + offsetX, p.y + offsetY, p.size + 4, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  hud.textContent = `Size: ${player.size}`;
}

setInterval(update, 1000 / 30);
