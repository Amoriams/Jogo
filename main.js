"use strict";
// MEGAMANIA-like — shmup fixo, Canvas 240x320, Vanilla JS
const W = 240, H = 320;
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

const elScore = document.getElementById("score");
const elLevel = document.getElementById("level");
const elLives = document.getElementById("lives");
const elFuel = document.getElementById("fuel-fill");
const overlay = document.getElementById("overlay");
const ovTitle = document.getElementById("ov-title");
const ovSub = document.getElementById("ov-sub");
const btnStart = document.getElementById("btn-start");

const WAVES_PER_LEVEL = 2;
const COLS = 4, ROWS = 2;

const G = {
  state: "title", // title | playing | dying | levelclear | gameover
  time: 0,
  score: 0,
  lives: 3,
  level: 1,          // 1..5 depois cicla com dificuldade extra
  wave: 1,           // 1..WAVES_PER_LEVEL dentro do nível
  energy: 100,
  shake: 0,
  bannerT: 0,
  dieT: 0,
  enemyDir: 1,
};

const player = { x: W/2-8, y: H-36, w: 16, h: 16, speed: 145, cool: 0, inv: 0 };
let bullets = [];   // {x,y,w,h,vy,dead}
let ebullets = [];  // max 1 ativo por vez (regra: poucos, um de cada vez)
let enemies = [];   // {bx,by,phase,x,y,w,h,alive,flash}
let parts = [];     // particulas explosao
let eShootT = 1.2;

const input = { left:false, right:false, fire:false };

// ---------- helpers ----------
const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));
function rectsOverlap(a,b){
  return a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y;
}
// hitboxes reduzidas = colisao arcade precisa (perdoa 2-4px nas bordas)
function hitPlayer(){ return {x:player.x+3, y:player.y+2, w:10, h:12}; }
function hitEnemy(e){ return {x:e.x+3, y:e.y+4, w:10, h:8}; }

function enemyTypeForLevel(level){ return ENEMY_ORDER[(level-1) % ENEMY_ORDER.length]; }
function speedMul(){ return 1 + (G.level-1)*0.18; }

// ---------- spawn ----------
function spawnWave(){
  enemies = [];
  const type = enemyTypeForLevel(G.level);
  const mul = speedMul();
  const gapX = 44, gapY = 30;
  const totalW = (COLS-1)*gapX;
  const x0 = W/2 - totalW/2 - 8;
  const y0 = 34;
  for(let r=0;r<ROWS;r++){
    for(let c=0;c<COLS;c++){
      enemies.push({
        type,
        bx: x0 + c*gapX,
        by: y0 + r*gapY,
        phase: (c*0.7 + r*1.3),
        x:0, y:0, w:16, h:16,
        alive:true, flash:0,
        amp: 18 + Math.min(14, G.level*2),
        freq: (1.4 + G.level*0.15) * (r%2? 1 : -1),
        fall: (7 + G.level*2.4) * (1 + r*0.12),
        t: 0,
      });
    }
  }
  ebullets = [];
  eShootT = 0.8 + Math.random()*1.2;
}

function startGame(){
  SFX.init();
  G.state="playing"; G.time=0; G.score=0; G.lives=3;
  G.level=1; G.wave=1; G.energy=100; G.shake=0;
  player.x=W/2-8; player.cool=0; player.inv=2;
  bullets=[]; parts=[];
  spawnWave();
  overlay.classList.add("hidden");
  SFX.level();
  updateHUD();
}

function nextLevel(){
  G.level++;
  G.wave=1;
  G.energy=100; // fase nova = barra renovada
  player.inv=2;
  bullets=[]; ebullets=[];
  spawnWave();
  G.state="playing";
  SFX.level();
  updateHUD();
}

function loseLife(reason){
  SFX.hit();
  explode(player.x+8, player.y+8, "#00e5ff", 26);
  G.lives--;
  updateHUD();
  if(G.lives<=0){
    G.state="gameover";
    showOverlay("FIM DE<br>JOGO", "Score "+G.score+" • Nível "+G.level, "↻ JOGAR DE NOVO");
  } else {
    G.state="dying"; G.dieT=1.4;
    G.energy=100; // perde vida = barra recarrega para nova tentativa
  }
}

function showOverlay(title, sub, btn){
  ovTitle.innerHTML=title; ovSub.textContent=sub; btnStart.textContent=btn;
  overlay.classList.remove("hidden");
}

function explode(x,y,color,n=18){
  for(let i=0;i<n;i++){
    const a=Math.random()*Math.PI*2, s=30+Math.random()*90;
    parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:0.4+Math.random()*0.4,t:0,color:Math.random()<0.3?"#ffffff":color});
  }
  G.shake=4;
}

// ---------- HUD ----------
function updateHUD(){
  elScore.textContent = "SCORE " + String(G.score).padStart(6,"0");
  elLevel.textContent = "NÍVEL " + G.level;
  elLives.textContent = "♥".repeat(Math.max(0,G.lives)) || "—";
  const e = clamp(G.energy,0,100);
  elFuel.style.width = e+"%";
  elFuel.classList.toggle("low", e<25);
}

// ---------- input: teclado ----------
addEventListener("keydown", e=>{
  if(e.key==="ArrowLeft"||e.key==="a"||e.key==="A") input.left=true;
  if(e.key==="ArrowRight"||e.key==="d"||e.key==="D") input.right=true;
  if(e.key===" "||e.key==="ArrowUp"||e.key==="w") { input.fire=true; SFX.init(); e.preventDefault(); }
  if(e.key==="Enter" && G.state!=="playing") startGame();
  if(e.key==="p"||e.key==="P") togglePause();
});
addEventListener("keyup", e=>{
  if(e.key==="ArrowLeft"||e.key==="a"||e.key==="A") input.left=false;
  if(e.key==="ArrowRight"||e.key==="d"||e.key==="D") input.right=false;
  if(e.key===" ") input.fire=false;
});

let paused=false;
function togglePause(){
  if(G.state!=="playing") return;
  paused=!paused;
  showOverlay(paused?"PAUSADO":"", paused?"Pressione P para continuar":"", "▶ CONTINUAR");
  if(!paused) overlay.classList.add("hidden");
}

// ---------- input: touch ----------
function bindHold(id, on, off){
  const el=document.getElementById(id);
  const s=e=>{e.preventDefault(); SFX.init(); on();};
  const x=e=>{e.preventDefault(); off();};
  el.addEventListener("pointerdown",s);
  el.addEventListener("pointerup",x);
  el.addEventListener("pointercancel",x);
  el.addEventListener("pointerleave",x);
}
bindHold("t-left", ()=>input.left=true, ()=>input.left=false);
bindHold("t-right", ()=>input.right=true, ()=>input.right=false);
bindHold("t-fire", ()=>input.fire=true, ()=>input.fire=false);

// arrastar sobre o canvas move a nave (mobile fluido)
let dragging=false;
canvas.addEventListener("pointerdown", e=>{ dragging=true; SFX.init(); moveTo(e); canvas.setPointerCapture(e.pointerId); });
canvas.addEventListener("pointermove", e=>{ if(dragging) moveTo(e); });
canvas.addEventListener("pointerup", ()=>dragging=false);
canvas.addEventListener("pointercancel", ()=>dragging=false);
function moveTo(e){
  const r=canvas.getBoundingClientRect();
  const cx=(e.clientX-r.left)/r.width*W;
  player.x=clamp(cx-8, 2, W-18);
}

btnStart.addEventListener("click", ()=>{
  SFX.init();
  if(paused){ paused=false; overlay.classList.add("hidden"); return; }
  startGame();
});
document.addEventListener("visibilitychange", ()=>{
  if(document.hidden && G.state==="playing" && !paused) togglePause();
});

// ---------- update ----------
function update(dt){
  G.time+=dt;
  if(G.state!=="playing") {
    if(G.state==="dying"){
      G.dieT-=dt;
      updateParts(dt);
      if(G.dieT<=0){ G.state="playing"; player.inv=2.5; }
    }
    if(G.state==="levelclear"){
      G.bannerT-=dt;
      updateParts(dt);
      if(G.bannerT<=0) nextLevel();
    }
    return;
  }
  if(paused) return;

  // energia drena sempre
  G.energy -= dt*4.2;
  if(G.energy<=0){ G.energy=0; updateHUD(); loseLife("energia"); return; }

  // jogador
  const sp = player.speed;
  if(input.left) player.x-=sp*dt;
  if(input.right) player.x+=sp*dt;
  player.x=clamp(player.x, 2, W-18);
  player.cool-=dt; player.inv-=dt;
  if(input.fire && player.cool<=0){
    player.cool=0.18;
    bullets.push({x:player.x+7, y:player.y-6, w:2, h:8, vy:-400, dead:false});
    if(bullets.length>6) bullets.shift();
    SFX.laser();
  }

  // inimigos: zigue-zague + descida lenta em fileiras
  let alive=0;
  for(const e of enemies){
    if(!e.alive) { e.flash=0; continue; }
    alive++;
    e.t+=dt;
    e.x = e.bx + Math.sin(G.time*e.freq + e.phase)*e.amp;
    e.y = e.by + e.t*e.fall;
    e.x=clamp(e.x,0,W-16);
    if(e.flash>0) e.flash-=dt;
    // chegou na linha do jogador = contato fatal
    if(e.y+14 >= player.y && player.inv<=0){
      loseLife("contato");
      return;
    }
    if(e.y>H) { // atravessou: recicla no topo (pressao constante estilo Megamania)
      e.t=0; e.by=30;
    }
  }
  if(alive===0){
    // onda destruída: recupera parte da barra + bonus
    G.score += 500*G.level;
    G.energy = clamp(G.energy+35, 0, 100);
    SFX.level();
    if(G.wave>=WAVES_PER_LEVEL){
      G.state="levelclear"; G.bannerT=2.0;
    } else {
      G.wave++;
      spawnWave();
    }
    updateHUD();
    return;
  }

  // tiro inimigo: UM de cada vez, poucos
  eShootT-=dt;
  const activeEB = ebullets.some(b=>!b.dead);
  if(eShootT<=0 && !activeEB){
    const cands = enemies.filter(e=>e.alive);
    if(cands.length){
      // prefere os mais baixos (fileira da frente)
      cands.sort((a,b)=>b.y-a.y);
      const shooter = cands[Math.floor(Math.random()*Math.min(3,cands.length))];
      ebullets.push({x:shooter.x+7, y:shooter.y+14, w:2, h:8, vy:85+ G.level*9, dead:false});
      SFX.enemyShoot();
    }
    eShootT = Math.max(0.45, 1.5 - G.level*0.12) + Math.random()*0.9;
  }

  // balas
  for(const b of bullets){ b.y+=b.vy*dt; if(b.y<-10) b.dead=true; }
  for(const b of ebullets){ b.y+=b.vy*dt; if(b.y>H+10) b.dead=true; }

  // colisao: tiro jogador x inimigo (precisa arcade)
  for(const b of bullets){
    if(b.dead) continue;
    const hb={x:b.x-1,y:b.y,w:4,h:b.h};
    for(const e of enemies){
      if(!e.alive) continue;
      if(rectsOverlap(hb, hitEnemy(e))){
        b.dead=true; e.alive=false; e.flash=0;
        G.score += 100*G.level;
        G.energy = clamp(G.energy+2, 0, 100); // micro recompensa por abate
        explode(e.x+8, e.y+8, ENEMY_COLORS[e.type]||"#fff", 16);
        SFX.explosion();
        break;
      }
    }
  }

  // colisao: tiro inimigo x jogador
  if(player.inv<=0){
    const hp=hitPlayer();
    for(const b of ebullets){
      if(b.dead) continue;
      if(rectsOverlap({x:b.x-1,y:b.y,w:4,h:b.h}, hp)){ b.dead=true; loseLife("tiro"); return; }
    }
    // contato direto nave x inimigo
    for(const e of enemies){
      if(!e.alive) continue;
      if(rectsOverlap(hp, hitEnemy(e))){ loseLife("colisao"); return; }
    }
  }

  bullets=bullets.filter(b=>!b.dead);
  ebullets=ebullets.filter(b=>!b.dead);
  updateParts(dt);
  if(Math.random()<0.1) updateHUD();
  else { // barra precisa refletir dreno contínuo
    elFuel.style.width = clamp(G.energy,0,100)+"%";
    elFuel.classList.toggle("low", G.energy<25);
  }
}

function updateParts(dt){
  for(const p of parts){ p.t+=dt; p.x+=p.vx*dt; p.y+=p.vy*dt; p.vx*=0.96; p.vy*=0.96; }
  parts=parts.filter(p=>p.t<p.life);
  if(G.shake>0) G.shake=Math.max(0,G.shake-dt*20);
}

// ---------- render ----------
function render(){
  ctx.save();
  ctx.fillStyle="#000";
  ctx.fillRect(0,0,W,H);
  if(G.shake>0) ctx.translate((Math.random()-0.5)*G.shake,(Math.random()-0.5)*G.shake);

  // linha do topo (score espelhado no canvas, estilo arcade)
  ctx.fillStyle="#222";
  ctx.fillRect(0,0,W,1);

  if(G.state==="title"){
    ctx.fillStyle="#333";
    ctx.font="8px monospace";
    ctx.textAlign="center";
    ctx.fillStyle("#00ffea");
    ctx.fillText("DESTRUA A ONDA!", W/2, 120);
    ctx.fillStyle("#666");
    ctx.fillText("5 FASES: BURGER > BOLACHA", W/2, 200);
    ctx.fillText("FERRO > GRAVATA > DIAMANTE", W/2, 212);
    ctx.restore();
    return;
  }

  // inimigos
  for(const e of enemies){
    if(!e.alive) continue;
    const def = SPRITES[e.type];
    drawSprite(ctx, def, e.x, e.y, 1, e.flash>0);
  }

  // balas jogador: laser rapido amarelo/ciano
  for(const b of bullets){
    ctx.fillStyle="#ffe600";
    ctx.fillRect(b.x,b.y,b.w,b.h);
    ctx.fillStyle="#fff";
    ctx.fillRect(b.x,b.y, b.w,2);
  }
  // balas inimigas: poucas, magenta
  for(const b of ebullets){
    ctx.fillStyle="#ff2060";
    ctx.fillRect(b.x,b.y,b.w,b.h);
    ctx.fillStyle="#fff";
    ctx.fillRect(b.x,b.y+b.h-2,b.w,2);
  }

  // jogador (pisca se invencivel)
  if(G.state==="playing"||G.state==="levelclear"){
    if(player.inv<=0 || Math.floor(G.time*10)%2===0){
      drawSprite(ctx, SPRITES.player, player.x, player.y, 1, false);
      // chama do motor
      ctx.fillStyle = Math.floor(G.time*12)%2 ? "#ff8800" : "#ffdd00";
      ctx.fillRect(player.x+7, player.y+16, 2, 3);
    }
  }

  // particulas
  for(const p of parts){
    ctx.globalAlpha = 1-p.t/p.life;
    ctx.fillStyle=p.color;
    ctx.fillRect(p.x,p.y,2,2);
  }
  ctx.globalAlpha=1;

  // banners de nível
  if(G.state==="levelclear"){
    banner("FASE "+G.level+" OK!", ENEMY_NAMES[enemyTypeForLevel(G.level+1)] ? "PRÓXIMO: "+ENEMY_NAMES[enemyTypeForLevel(G.level+1)] : "");
  }
  if(G.state==="playing" && G.time<2.5 && G.wave===1){
    const nm = ENEMY_NAMES[enemyTypeForLevel(G.level)];
    banner("NÍVEL "+G.level, nm);
  }
  // barra fina de energia no canvas (espelho) — principal fica no DOM
  ctx.fillStyle="#333";
  ctx.fillRect(8,H-8,W-16,2);
  ctx.fillStyle = G.energy<25 ? "#ff2020" : "#00ff66";
  ctx.fillRect(8,H-8,(W-16)*clamp(G.energy,0,100)/100,2);

  ctx.restore();
}

function banner(l1,l2){
  ctx.textAlign="center";
  ctx.fillStyle="#ffe600";
  ctx.font="bold 16px monospace";
  ctx.fillText(l1, W/2, H/2-8);
  if(l2){ ctx.fillStyle="#00ffea"; ctx.font="bold 10px monospace"; ctx.fillText(l2, W/2, H/2+10); }
}

// ---------- loop fixo ----------
let last=0;
function loop(t){
  requestAnimationFrame(loop);
  const dt=Math.min(0.033,(t-last)/1000||0.016);
  last=t;
  update(dt);
  render();
  // HUD leve a cada ~10 frames
  if((t|0)%6===0) { elScore.textContent="SCORE "+String(G.score).padStart(6,"0"); }
}
updateHUD();
requestAnimationFrame(loop);
