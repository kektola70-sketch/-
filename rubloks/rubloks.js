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

<script src="https://cdn.jsdelivr.net/npm/three@0.155/build/three.min.js"></script>

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
  border-radius:10px;
  margin-top:10px;
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
  <br>
  <button onclick="logout()">Выйти</button>
</div>

<script>
/* ===== АВТОВХОД ===== */
if (localStorage.user) showGame();

/* ===== АВАТАР ===== */
const faces = ["🙂","😎","🤖","😺","😀"];
let faceIndex = 0;

function changeAvatar(){
  faceIndex = (faceIndex+1)%faces.length;
  avatar.innerText = faces[faceIndex];
}

/* ===== АВТОРИЗАЦИЯ ===== */
function showGame(){
  auth.style.display="none";
  game.style.display="block";
  init3D();
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
    localStorage.user=user.value;
    showGame();
  } else msg.innerText="Неверный логин или пароль";
}

function logout(){
  localStorage.clear();
  location.reload();
}

/* ===== 3D МИР ===== */
let started=false;
function init3D(){
  if(started) return;
  started=true;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);

  const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
  camera.position.z = 4;

  const renderer = new THREE.WebGLRenderer({ canvas: world });
  renderer.setSize(300,300);

  const light = new THREE.DirectionalLight(0xffffff,1);
  light.position.set(3,3,5);
  scene.add(light);

  const ground = new THREE.Mesh(
    new THREE.BoxGeometry(5,0.2,5),
    new THREE.MeshStandardMaterial({color:0x228b22})
  );
  ground.position.y = -1;
  scene.add(ground);

  const cube = new THREE.Mesh(
    new THREE.BoxGeometry(),
    new THREE.MeshStandardMaterial({color:0xff4444})
  );
  scene.add(cube);

  function animate(){
    requestAnimationFrame(animate);
    cube.rotation.y += 0.01;
    cube.rotation.x += 0.01;
    renderer.render(scene,camera);
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
  users[req.body.u]={p:req.body.p};
  fs.writeFileSync(USERS_FILE,JSON.stringify(users,null,2));
  res.json({msg:"Регистрация успешна"});
});

app.post("/login",(req,res)=>{
  const users = JSON.parse(fs.readFileSync(USERS_FILE));
  res.json({ok: users[req.body.u]?.p === req.body.p});
});

/* ================= ЗАПУСК ================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>console.log("РУБЛОКС ▶ http://localhost:"+PORT));
const express = require("express");
const fs = require("fs");

const API_KEY = process.env.API_KEY;

const app = express();
