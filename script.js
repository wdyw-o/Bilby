/* ============ ПЛАВНЫЙ СКРОЛЛ И REVEAL ============ */
const startBtn = document.getElementById("startBtn");
startBtn.addEventListener("click", () => {
  document.getElementById("chapter1").scrollIntoView({ behavior: "smooth" });
});

// Intersection Observer для появления блоков
const revealElements = document.querySelectorAll(".reveal");
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
      }
    });
  },
  { threshold: 0.15 },
);

revealElements.forEach((el) => revealObserver.observe(el));

/* ============ МИНИ-ИГРА ============ */
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const playBtn = document.getElementById("playBtn");
const overlay = document.getElementById("gameOverlay");
const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");

const W = canvas.width;
const H = canvas.height;

let game = {
  running: false,
  score: 0,
  best: parseInt(localStorage.getItem("bilbyBest") || "0"),
  bilby: { x: W / 2, y: H - 60, w: 50, h: 35, vx: 0 },
  obstacles: [],
  chick: { x: W / 2 + 40, y: H - 55 },
  keys: {},
  spawnTimer: 0,
  speed: 2,
  frame: 0,
};

bestEl.textContent = game.best;

// Управление
window.addEventListener("keydown", (e) => {
  game.keys[e.key.toLowerCase()] = true;
  if (["arrowleft", "arrowright", " "].includes(e.key.toLowerCase()))
    e.preventDefault();
});
window.addEventListener("keyup", (e) => {
  game.keys[e.key.toLowerCase()] = false;
});

// Тач-управление
canvas.addEventListener("touchstart", handleTouch);
canvas.addEventListener("touchmove", handleTouch);
canvas.addEventListener("touchend", () => {
  game.keys["arrowleft"] = false;
  game.keys["arrowright"] = false;
});

function handleTouch(e) {
  const rect = canvas.getBoundingClientRect();
  const x = e.touches[0].clientX - rect.left;
  game.keys["arrowleft"] = x < rect.width / 2;
  game.keys["arrowright"] = x >= rect.width / 2;
  e.preventDefault();
}

// Рисуем билби
function drawBilby(x, y) {
  // тень
  ctx.fillStyle = "rgba(0,0,0,0.2)";
  ctx.beginPath();
  ctx.ellipse(x, y + 18, 22, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  // хвост
  ctx.fillStyle = "#5a4636";
  ctx.beginPath();
  ctx.ellipse(x - 20, y, 10, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#1a1a1a";
  ctx.beginPath();
  ctx.ellipse(x - 22, y - 3, 6, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  // тело
  ctx.fillStyle = "#7a6350";
  ctx.beginPath();
  ctx.ellipse(x, y, 22, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  // голова
  ctx.beginPath();
  ctx.ellipse(x + 15, y - 6, 12, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  // уши
  ctx.fillStyle = "#5a4636";
  ctx.beginPath();
  ctx.ellipse(x + 10, y - 18, 3, 8, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x + 18, y - 18, 3, 8, 0.2, 0, Math.PI * 2);
  ctx.fill();
  // глаз
  ctx.fillStyle = "#1a1a1a";
  ctx.beginPath();
  ctx.arc(x + 20, y - 8, 2, 0, Math.PI * 2);
  ctx.fill();
  // нос
  ctx.fillStyle = "#1a1a1a";
  ctx.beginPath();
  ctx.arc(x + 26, y - 5, 1.5, 0, Math.PI * 2);
  ctx.fill();
}

// Рисуем птенца
function drawChick(x, y) {
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.ellipse(x, y, 12, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + 8, y - 6, 7, 0, Math.PI * 2);
  ctx.fill();
  // глаз
  ctx.fillStyle = "#1a1a1a";
  ctx.beginPath();
  ctx.arc(x + 10, y - 7, 1.5, 0, Math.PI * 2);
  ctx.fill();
  // клюв
  ctx.fillStyle = "#f4a261";
  ctx.beginPath();
  ctx.moveTo(x + 14, y - 6);
  ctx.lineTo(x + 19, y - 4);
  ctx.lineTo(x + 14, y - 3);
  ctx.closePath();
  ctx.fill();
}

// Рисуем препятствия
function drawObstacle(o) {
  ctx.save();
  ctx.translate(o.x, o.y);
  if (o.type === "hawk") {
    // орёл
    ctx.fillStyle = "#2b1810";
    ctx.beginPath();
    ctx.moveTo(-25, 0);
    ctx.quadraticCurveTo(0, -15, 25, 0);
    ctx.quadraticCurveTo(0, 5, -25, 0);
    ctx.fill();
    ctx.fillStyle = "#3d2817";
    ctx.beginPath();
    ctx.arc(0, -3, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ff6b35";
    ctx.beginPath();
    ctx.arc(2, -4, 1.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (o.type === "snake") {
    // змея
    ctx.strokeStyle = "#4a7c3a";
    ctx.lineWidth = 8;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-20, 0);
    ctx.quadraticCurveTo(-10, -8, 0, 0);
    ctx.quadraticCurveTo(10, 8, 20, 0);
    ctx.stroke();
    ctx.fillStyle = "#ff6b35";
    ctx.beginPath();
    ctx.arc(20, 0, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1a1a1a";
    ctx.beginPath();
    ctx.arc(22, -1, 1, 0, Math.PI * 2);
    ctx.fill();
  } else if (o.type === "scorpion") {
    // скорпион
    ctx.fillStyle = "#8b4513";
    ctx.beginPath();
    ctx.ellipse(0, 0, 10, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    // хвост
    ctx.strokeStyle = "#8b4513";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-8, 0);
    ctx.quadraticCurveTo(-15, -10, -12, -18);
    ctx.stroke();
    ctx.fillStyle = "#c44536";
    ctx.beginPath();
    ctx.arc(-12, -18, 3, 0, Math.PI * 2);
    ctx.fill();
    // клешни
    ctx.fillStyle = "#8b4513";
    ctx.beginPath();
    ctx.arc(10, -3, 3, 0, Math.PI * 2);
    ctx.arc(10, 3, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// Фон
function drawBackground() {
  // небо
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, "#ff9a56");
  grad.addColorStop(0.5, "#f4a261");
  grad.addColorStop(1, "#d4a574");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // солнце
  ctx.fillStyle = "rgba(255, 243, 176, 0.6)";
  ctx.beginPath();
  ctx.arc(W - 80, 70, 35, 0, Math.PI * 2);
  ctx.fill();

  // дальние дюны (параллакс)
  const offset = (game.frame * 0.3) % 200;
  ctx.fillStyle = "#b8895a";
  for (let i = -1; i < 4; i++) {
    ctx.beginPath();
    ctx.ellipse(i * 200 - offset, H - 100, 150, 50, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // ближние дюны
  const offset2 = (game.frame * 0.8) % 150;
  ctx.fillStyle = "#a07848";
  for (let i = -1; i < 5; i++) {
    ctx.beginPath();
    ctx.ellipse(i * 150 - offset2, H - 50, 100, 35, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // кактусы (проносятся)
  const cactusOffset = (game.frame * 2) % 300;
  ctx.fillStyle = "#4a7c3a";
  for (let i = 0; i < 3; i++) {
    const cx = i * 300 - cactusOffset + 100;
    if (cx > -20 && cx < W + 20) {
      ctx.fillRect(cx - 4, H - 90, 8, 30);
      ctx.fillRect(cx - 12, H - 80, 6, 15);
      ctx.fillRect(cx + 6, H - 85, 6, 18);
    }
  }

  // земля
  ctx.fillStyle = "#8b6239";
  ctx.fillRect(0, H - 40, W, 40);
}

function spawnObstacle() {
  const types = ["hawk", "snake", "scorpion"];
  const type = types[Math.floor(Math.random() * types.length)];
  game.obstacles.push({
    type: type,
    x: Math.random() * (W - 60) + 30,
    y: -30,
    vy: game.speed + Math.random() * 1.5,
    w: 40,
    h: 25,
  });
}

function checkCollision(a, b) {
  return (
    Math.abs(a.x - b.x) < a.w / 2 + b.w / 2 - 10 &&
    Math.abs(a.y - b.y) < a.h / 2 + b.h / 2 - 5
  );
}

function gameOver() {
  game.running = false;
  if (game.score > game.best) {
    game.best = game.score;
    localStorage.setItem("bilbyBest", game.best);
    bestEl.textContent = game.best;
  }
  overlay.classList.remove("hidden");
  overlay.innerHTML = `<div style="text-align:center">
    <div style="font-size:2rem;margin-bottom:10px">💥 Хищник поймал!</div>
    <div>Пройдено: ${game.score} м</div>
    <div style="margin-top:15px;font-size:0.9rem;opacity:0.8">Нажми «Играть» снова</div>
  </div>`;
  playBtn.textContent = "Играть снова ▶";
}

function update() {
  if (!game.running) return;

  game.frame++;
  game.spawnTimer++;

  // ускорение
  game.speed = 2 + game.score / 50;

  // движение билби
  const speed = 5;
  if (game.keys["arrowleft"] || game.keys["a"]) game.bilby.vx = -speed;
  else if (game.keys["arrowright"] || game.keys["d"]) game.bilby.vx = speed;
  else game.bilby.vx *= 0.8;

  game.bilby.x += game.bilby.vx;
  game.bilby.x = Math.max(30, Math.min(W - 30, game.bilby.x));

  // птенец следует за билби
  game.chick.x += (game.bilby.x + 35 - game.chick.x) * 0.1;

  // спавн препятствий
  const spawnRate = Math.max(40, 80 - game.score / 3);
  if (game.spawnTimer > spawnRate) {
    spawnObstacle();
    game.spawnTimer = 0;
  }

  // обновление препятствий
  game.obstacles.forEach((o) => {
    o.y += o.vy;
  });
  game.obstacles = game.obstacles.filter((o) => o.y < H + 50);

  // коллизии
  for (const o of game.obstacles) {
    if (checkCollision(game.bilby, o) || checkCollision(game.chick, o)) {
      gameOver();
      return;
    }
  }

  // счёт
  if (game.frame % 6 === 0) {
    game.score++;
    scoreEl.textContent = game.score;
  }
}

function draw() {
  drawBackground();

  // препятствия
  game.obstacles.forEach(drawObstacle);

  // птенец
  drawChick(game.chick.x, game.chick.y);

  // билби
  drawBilby(game.bilby.x, game.bilby.y);

  // UI
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fillRect(10, 10, 130, 35);
  ctx.fillStyle = "#ffd166";
  ctx.font = "bold 18px Georgia";
  ctx.fillText(`${game.score} м`, 25, 33);
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

playBtn.addEventListener("click", () => {
  game.running = true;
  game.score = 0;
  game.obstacles = [];
  game.spawnTimer = 0;
  game.speed = 2;
  game.frame = 0;
  game.bilby.x = W / 2;
  game.chick.x = W / 2 + 40;
  scoreEl.textContent = "0";
  overlay.classList.add("hidden");
});

// Стартуем отрисовку (даже когда игра не идёт — показываем превью)
loop();

/* ============ ПАРАЛЛАКС В HERO ============ */
window.addEventListener("scroll", () => {
  const scrollY = window.scrollY;
  const sun = document.querySelector(".sun");
  const dunesBack = document.querySelector(".dunes-back");
  const dunesMid = document.querySelector(".dunes-mid");
  if (sun)
    sun.style.transform = `translateX(-50%) translateY(${scrollY * 0.3}px)`;
  if (dunesBack) dunesBack.style.transform = `translateY(${-scrollY * 0.1}px)`;
  if (dunesMid) dunesMid.style.transform = `translateY(${-scrollY * 0.2}px)`;
});

/* ============ ГАЛЕРЕЯ — LIGHTBOX С ЛИСТАНИЕМ ============ */
const lightbox = document.getElementById("lightbox");
const lightboxContent = document.getElementById("lightboxContent");
const lightboxCaption = document.getElementById("lightboxCaption");
const lightboxClose = document.getElementById("lightboxClose");
const lightboxPrev = document.getElementById("lightboxPrev");
const lightboxNext = document.getElementById("lightboxNext");

const galleryItems = Array.from(document.querySelectorAll(".gallery-item"));
let currentIndex = 0;

function showSlide(index) {
  currentIndex = (index + galleryItems.length) % galleryItems.length;
  const item = galleryItems[currentIndex];
  const img = item.querySelector("img");
  const caption = item.querySelector(".gallery-caption").textContent;

  lightboxContent.innerHTML = "";
  const bigImg = document.createElement("img");
  bigImg.src = img.src;
  bigImg.alt = img.alt;
  lightboxContent.appendChild(bigImg);
  lightboxCaption.textContent = `${caption}  (${currentIndex + 1}/${galleryItems.length})`;
}

galleryItems.forEach((item, i) => {
  item.addEventListener("click", () => {
    showSlide(i);
    lightbox.classList.add("active");
    document.body.style.overflow = "hidden";
  });
});

function closeLightbox() {
  lightbox.classList.remove("active");
  document.body.style.overflow = "";
}

lightboxClose.addEventListener("click", closeLightbox);
lightboxPrev.addEventListener("click", (e) => {
  e.stopPropagation();
  showSlide(currentIndex - 1);
});
lightboxNext.addEventListener("click", (e) => {
  e.stopPropagation();
  showSlide(currentIndex + 1);
});

lightbox.addEventListener("click", (e) => {
  if (e.target === lightbox) closeLightbox();
});

document.addEventListener("keydown", (e) => {
  if (!lightbox.classList.contains("active")) return;
  if (e.key === "Escape") closeLightbox();
  if (e.key === "ArrowLeft") showSlide(currentIndex - 1);
  if (e.key === "ArrowRight") showSlide(currentIndex + 1);
});

// Свайпы на мобильных
let touchStartX = 0;
lightbox.addEventListener("touchstart", (e) => {
  touchStartX = e.changedTouches[0].screenX;
});
lightbox.addEventListener("touchend", (e) => {
  const diff = e.changedTouches[0].screenX - touchStartX;
  if (Math.abs(diff) > 60) {
    diff > 0 ? showSlide(currentIndex - 1) : showSlide(currentIndex + 1);
  }
});

/* ============ ФАКТЫ — FLIP НА МОБИЛЬНЫХ ============ */
document.querySelectorAll(".fact-card").forEach((card) => {
  card.addEventListener("click", () => {
    // На тач-устройствах переключаем класс flipped
    if (window.matchMedia("(hover: none)").matches) {
      card.classList.toggle("flipped");
    }
  });
});

/* ============ КНОПКА «СМОТРЕТЬ» ============ */
const watchBtn = document.getElementById("watchBtn");
if (watchBtn) {
  watchBtn.addEventListener("click", () => {
    document.getElementById("watch").scrollIntoView({ behavior: "smooth" });
    // Автофокус на плеер через 800мс (после завершения скролла)
    setTimeout(() => {
      const iframe = document.getElementById("bilbyPlayer");
      if (iframe) iframe.focus();
    }, 800);
  });
}

/* ============ ЛЕНИВАЯ ЗАГРУЗКА ПЛЕЕРА ============ */
// Загружаем iframe только когда секция в зоне видимости
const watchSection = document.getElementById("watch");
const bilbyPlayer = document.getElementById("bilbyPlayer");
let playerLoaded = false;

if (watchSection && bilbyPlayer) {
  // Сохраняем оригинальный src и заменяем на пустой
  const realSrc = bilbyPlayer.src;
  bilbyPlayer.src = "about:blank";

  const playerObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !playerLoaded) {
          bilbyPlayer.src = realSrc;
          playerLoaded = true;
          playerObserver.disconnect();
        }
      });
    },
    { threshold: 0.3 },
  );

  playerObserver.observe(watchSection);
}
