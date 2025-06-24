const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Game state
const players = new Map();
const pellets = [];
const MAP_SIZE = 2000;
const START_SIZE = 20;

function spawnPellet() {
  return { x: Math.random() * MAP_SIZE, y: Math.random() * MAP_SIZE };
}

for (let i = 0; i < 500; i++) {
  pellets.push(spawnPellet());
}

function distance(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

io.on('connection', (socket) => {
  // wait for the client to send their name before spawning
  socket.on('join', (name) => {
    const player = {
      id: socket.id,
      name: name || 'Anonymous',
      x: Math.random() * MAP_SIZE,
      y: Math.random() * MAP_SIZE,
      size: START_SIZE,
      speed: 3,
      abilityCooldown: 0,
      shield: false,
    };
    players.set(socket.id, player);
    socket.emit('init', { id: socket.id, pellets, MAP_SIZE });
  });

  socket.on('move', (dir) => {
    const p = players.get(socket.id);
    if (!p) return;
    p.x += dir.x * p.speed;
    p.y += dir.y * p.speed;
    p.x = Math.max(0, Math.min(MAP_SIZE, p.x));
    p.y = Math.max(0, Math.min(MAP_SIZE, p.y));

    // Eat pellets
    for (let i = pellets.length - 1; i >= 0; i--) {
      if (distance(p, pellets[i]) < p.size) {
        pellets.splice(i, 1);
        pellets.push(spawnPellet());
        p.size += 1;
      }
    }
  });

  socket.on('ability', () => {
    const p = players.get(socket.id);
    if (!p || p.abilityCooldown > 0) return;
    p.speed = 6; // speed boost
    p.abilityCooldown = 300; // frames
    p.shield = true; // enable shield for short duration
  });

  socket.on('disconnect', () => {
    players.delete(socket.id);
  });
});

// Game loop
setInterval(() => {
  for (const p of players.values()) {
    if (p.abilityCooldown > 0) {
      p.abilityCooldown -= 1;
      if (p.abilityCooldown === 0) {
        p.speed = 3;
        p.shield = false;
      }
    }
  }
  io.emit('state', Array.from(players.values()), pellets);
}, 1000 / 30);
