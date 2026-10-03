// Audio 8-bit via WebAudio: laser agudo + explosao crushing. Sem arquivos externos.
"use strict";
const SFX = {
  ctx: null,
  enabled: true,
  init() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) { this.enabled = false; return; }
      this.ctx = new AC();
    }
    if (this.ctx.state === "suspended") this.ctx.resume();
  },
  laser() {
    if (!this.enabled || !this.ctx) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "square";
    o.frequency.setValueAtTime(2200, t);
    o.frequency.exponentialRampToValueAtTime(220, t + 0.14);
    g.gain.setValueAtTime(0.12, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
    o.connect(g).connect(ctx.destination);
    o.start(t); o.stop(t + 0.15);
  },
  enemyShoot() {
    if (!this.enabled || !this.ctx) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(400, t);
    o.frequency.exponentialRampToValueAtTime(90, t + 0.2);
    g.gain.setValueAtTime(0.06, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    o.connect(g).connect(ctx.destination);
    o.start(t); o.stop(t + 0.21);
  },
  explosion() {
    if (!this.enabled || !this.ctx) return;
    const ctx = this.ctx, t = ctx.currentTime;
    // ruido crushing: buffer de ruido + lowpass descendo
    const dur = 0.35, sr = ctx.sampleRate;
    const buf = ctx.createBuffer(1, sr * dur, sr);
    const d = buf.getChannelData(0);
    for (let i=0;i<d.length;i++) d[i] = (Math.random()*2-1) * Math.pow(1-i/d.length, 1.5);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type="lowpass";
    f.frequency.setValueAtTime(3000, t);
    f.frequency.exponentialRampToValueAtTime(120, t+dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.35, t);
    g.gain.exponentialRampToValueAtTime(0.001, t+dur);
    // + corpo tonal grave para "crush"
    const o = ctx.createOscillator(), og = ctx.createGain();
    o.type="triangle";
    o.frequency.setValueAtTime(160,t);
    o.frequency.exponentialRampToValueAtTime(35,t+dur);
    og.gain.setValueAtTime(0.25,t);
    og.gain.exponentialRampToValueAtTime(0.001,t+dur);
    src.connect(f).connect(g).connect(ctx.destination);
    o.connect(og).connect(ctx.destination);
    src.start(t); o.start(t); o.stop(t+dur);
  },
  hit() { // jogador atingido / vida perdida
    if (!this.enabled || !this.ctx) return;
    const ctx=this.ctx,t=ctx.currentTime;
    const o=ctx.createOscillator(),g=ctx.createGain();
    o.type="sawtooth";
    o.frequency.setValueAtTime(300,t);
    o.frequency.exponentialRampToValueAtTime(30,t+0.5);
    g.gain.setValueAtTime(0.3,t);
    g.gain.exponentialRampToValueAtTime(0.001,t+0.5);
    o.connect(g).connect(ctx.destination); o.start(t); o.stop(t+0.5);
  },
  level() {
    if (!this.enabled || !this.ctx) return;
    const ctx=this.ctx,t=ctx.currentTime;
    [523,659,784,1046].forEach((fq,i)=>{
      const o=ctx.createOscillator(),g=ctx.createGain();
      o.type="square"; o.frequency.value=fq;
      const s=t+i*0.09;
      g.gain.setValueAtTime(0.1,s);
      g.gain.exponentialRampToValueAtTime(0.001,s+0.1);
      o.connect(g).connect(ctx.destination); o.start(s); o.stop(s+0.11);
    });
  }
};
