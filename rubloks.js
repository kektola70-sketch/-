const express = require("express");
const fs = require("fs");
const app = express();

app.use(express.json());

const USERS_FILE = "users.json";
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, "{}");

/* ================= HTML ================= */
const html = `
<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<title>Рублокс</title>

<!-- СТАБИЛЬНЫЙ Three.js ДЛЯ ТЕЛЕФОНА -->
<script src="https://unpkg.com/three@0.155/build/three.min.js"></script>

<style>
body {
  margin:0;
  font-family: Arial;
  background:#eaeaea;
  text-align:center;
}
.box {
  background:white;
  padding:20px;
  margin:30px auto;
  width:320px;
  border-radius:10px;
}
input, button {
  width:90%;
  padding:10px;
  margin:5px;
}
#game { display:none; }
#avatar { font-size:50px; }
canvas {
  margin-top:10px;
  border-radius:10px;
  background:#000;
}
</style>
</head>

<body>

<div class="box" id="auth">
  <h2>🎮 РУБЛОКС</h2>
  <input id="user" placeholder="Логин">
  <input id="pass" type="password" placeholder="Пароль">
  <button onclick="register()">Регистрация</button>
  <button onclick="login()">Вход</button>
  <p id="msg"></p>
</div>

<div class="box" id="game">
  <h3>Добро пожаловать!</h3>
  <div id="avatar">🙂</div>
  <button onclick="changeAvatar()">Сменить аватар</button>
  <canvas id="world" width="300" height="300"></canvas>
  <br><br>
  <button onclick="logout()">Выйти</button>
</div>

<script>
/* ===== АВТОВХОД ===== */
if (localStorage.user) showGame();

/* ===== АВАТАР ===== */
const faces = ["🙂","😎","🤖","😺","😀"];
let faceIndex = 0;
function changeAvatar(){
  faceIndex = (faceIndex + 1) % faces.length;
  avatar.innerText = faces[faceIndex];
}

/* ===== АВТОРИЗАЦИЯ ===== */
function showGame(){
  auth.style.display = "none";
  game.style.display = "block";
  setTimeout(init3D, 300); // КЛЮЧЕВО ДЛЯ ТЕЛЕФОНА
}

async function register(){
  const r = await fetch("/register",{
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body:JSON.stringify({u:user.value,p:pass.value})
  });
  msg.innerText = (await r.json()).msg;
}

async function login(){
  const r = await fetch("/login",{
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body:JSON.stringify({u:user.value,p:pass.value})
  });
  const d = await r.json();
  if(d.ok){
    localStorage.user = user.value;
    showGame();
  } else msg.innerText = "Неверный логин или пароль";
}

function logout(){
  localStorage.clear();
  location.reload();
}

/* ===== 3D МИР (АДАПТИРОВАН ДЛЯ ТЕЛЕФОНА) ===== */
let started = false;

function init3D(){
  if(started) return;
  started = true;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);

  const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 100);
  camera.position.z = 3;

  const renderer = new THREE.WebGLRenderer({
    canvas: world,
    antialias: false
  });
  renderer.setSize(300,300);

  // ПРОСТОЙ КУБ (НЕ НУЖЕН СВЕТ)
  const cube = new THREE.Mesh(
    new THREE.BoxGeometry(),
    new THREE.MeshBasicMaterial({ color: 0xff0000 })
  );
  scene.add(cube);

  function animate(){
    requestAnimationFrame(animate);
    cube.rotation.y += 0.01;
    renderer.render(scene, camera);
  }
  animate();
}
</script>

</body>
</html>
`;

/* ================= СЕРВЕР ================= */
app.get("/", (req,res)=>res.send(html));

app.post("/register",(req,res)=>{
  const users = JSON.parse(fs.readFileSync(USERS_FILE));
  if(users[req.body.u]) return res.json({msg:"Пользователь существует"});
  users[req.body.u] = { p: req.body.p };
  fs.writeFileSync(USERS_FILE, JSON.stringify(users,null,2));
  res.json({msg:"Регистрация успешна"});
});

app.post("/login",(req,res)=>{
  const users = JSON.parse(fs.readFileSync(USERS_FILE));
  res.json({ ok: users[req.body.u]?.p === req.body.p });
});

/* ================= ЗАПУСК ================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>console.log("РУБЛОКС ▶ http://localhost:" + PORT));
