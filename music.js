// 背景音乐(第 F2 步):WebAudio 合成的中国风五声音阶乐曲,不使用任何音频文件。
// 四种情绪(悠闲 / 轻快 / 激烈 / 沉重)随机轮换,每首约 1 分钟,换曲时避免与上一首相同。
// 对外接口:window.Music = { start, stop, pause, resume, next, isPlaying, current, moods, setVolume,
//                            renderOffline, __log }
(function () {
  'use strict';

  // ---------- 音阶与乐理 ----------
  function hz(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  // 五声音阶:各情绪的"调式音程"(相对主音的半音数),宫商角徵羽
  var PENT_MAJOR = [0, 2, 4, 7, 9];      // 宫调式:明亮
  var PENT_MINOR = [0, 3, 5, 7, 10];     // 羽调式:低沉、苍凉
  var PENT_ZHI   = [0, 2, 5, 7, 9];      // 徵调式:开阔

  // 伪随机(可复现):mulberry32
  function makeRng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // ---------- 情绪定义 ----------
  // root:主音 MIDI;scale:音阶;bpm:每分钟拍数(一拍 = 2 个八分格);bars:本曲小节数
  var MOODS = {
    '悠闲': { name: '悠闲', root: 62, scale: PENT_MAJOR, bpm: 60,  bars: 16 },   // D 宫
    '轻快': { name: '轻快', root: 67, scale: PENT_ZHI,   bpm: 116, bars: 24 },   // G 徵
    '激烈': { name: '激烈', root: 57, scale: PENT_MINOR, bpm: 150, bars: 32 },   // A 羽
    '沉重': { name: '沉重', root: 50, scale: PENT_MINOR, bpm: 52,  bars: 14 }    // D 羽
  };
  var MOOD_NAMES = ['悠闲', '轻快', '激烈', '沉重'];

  // 取音阶中第 deg 级(可为负或超过 4,按八度折叠)的 MIDI
  function degToMidi(mood, deg) {
    var n = mood.scale.length;
    var oct = Math.floor(deg / n);
    var idx = ((deg % n) + n) % n;
    return mood.root + mood.scale[idx] + 12 * oct;
  }

  // ---------- 乐器(全部合成) ----------
  // 每个乐器函数:(ctx, dest, t, midi/其它, dur, vel) —— 创建节点、安排起止,不返回
  function env(g, t, a, peak, d, end) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(d, a + 0.02));
  }

  // 古筝/琵琶:拨弦。三角波 + 泛音,滤波器从亮到暗模拟"拨下去先亮后暗"。
  function pluck(ctx, dest, t, midi, dur, vel, bright) {
    var f = hz(midi);
    var o1 = ctx.createOscillator(), o2 = ctx.createOscillator();
    o1.type = 'triangle'; o2.type = 'sine';
    o1.frequency.setValueAtTime(f, t);
    o2.frequency.setValueAtTime(f * 2.002, t);      // 轻微失谐的二次泛音
    var g1 = ctx.createGain(), g2 = ctx.createGain();
    g1.gain.value = 1; g2.gain.value = 0.28;
    var lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(Math.min(f * (bright || 7), 9000), t);
    lp.frequency.exponentialRampToValueAtTime(Math.max(f * 1.6, 300), t + dur);
    var g = ctx.createGain();
    env(g, t, 0.004, 0.2 * vel, t + dur);
    o1.connect(g1); o2.connect(g2); g1.connect(lp); g2.connect(lp); lp.connect(g); g.connect(dest);
    o1.start(t); o2.start(t); o1.stop(t + dur + 0.05); o2.stop(t + dur + 0.05);
  }

  // 笛/箫:正弦 + 颤音 + 少量气声,起音柔和。
  function flute(ctx, dest, t, midi, dur, vel) {
    var f = hz(midi);
    var o = ctx.createOscillator(), o2 = ctx.createOscillator();
    o.type = 'sine'; o2.type = 'sine';
    o.frequency.setValueAtTime(f, t); o2.frequency.setValueAtTime(f * 2, t);
    var lfo = ctx.createOscillator(), lg = ctx.createGain();
    lfo.frequency.value = 5.2; lg.gain.value = f * 0.006;
    lfo.connect(lg); lg.connect(o.frequency);
    var g2 = ctx.createGain(); g2.gain.value = 0.12;
    var g = ctx.createGain();
    var peak = 0.16 * vel, a = Math.min(0.09, dur * 0.4);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.setValueAtTime(peak, t + Math.max(a, dur - 0.18));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); o2.connect(g2); g2.connect(g); g.connect(dest);
    // 气声
    var nb = noiseBuffer(ctx);
    var ns = ctx.createBufferSource(); ns.buffer = nb;
    var bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f * 2.5; bp.Q.value = 2;
    var ng = ctx.createGain(); ng.gain.setValueAtTime(0.0001, t);
    ng.gain.exponentialRampToValueAtTime(0.03 * vel, t + a); ng.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    ns.connect(bp); bp.connect(ng); ng.connect(dest);
    o.start(t); o2.start(t); lfo.start(t); ns.start(t);
    o.stop(t + dur + 0.05); o2.stop(t + dur + 0.05); lfo.stop(t + dur + 0.05); ns.stop(t + dur + 0.05);
  }

  var _noise = null;
  function noiseBuffer(ctx) {
    if (_noise && _noise.sampleRate === ctx.sampleRate) return _noise;
    var len = Math.floor(ctx.sampleRate * 1.0);
    var buf = ctx.createBuffer(1, len, ctx.sampleRate);
    var d = buf.getChannelData(0);
    var rng = makeRng(12345);
    for (var i = 0; i < len; i++) d[i] = rng() * 2 - 1;
    _noise = buf;
    return buf;
  }

  // 大鼓:低频正弦下扫 + 一点噪声
  function drum(ctx, dest, t, vel, low) {
    var o = ctx.createOscillator(); o.type = 'sine';
    var f0 = low ? 90 : 140, f1 = low ? 42 : 55;
    o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + 0.22);
    var g = ctx.createGain(); env(g, t, 0.003, 0.42 * vel, t + 0.35);
    o.connect(g); g.connect(dest); o.start(t); o.stop(t + 0.4);
    var ns = ctx.createBufferSource(); ns.buffer = noiseBuffer(ctx);
    var hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 900;
    var ng = ctx.createGain(); env(ng, t, 0.002, 0.07 * vel, t + 0.06);
    ns.connect(hp); hp.connect(ng); ng.connect(dest); ns.start(t); ns.stop(t + 0.08);
  }

  // 木鱼/梆子:短促的"嗒"
  function wood(ctx, dest, t, vel) {
    var o = ctx.createOscillator(); o.type = 'square';
    o.frequency.setValueAtTime(900, t); o.frequency.exponentialRampToValueAtTime(600, t + 0.04);
    var bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 800; bp.Q.value = 3;
    var g = ctx.createGain(); env(g, t, 0.001, 0.09 * vel, t + 0.07);
    o.connect(bp); bp.connect(g); g.connect(dest); o.start(t); o.stop(t + 0.1);
  }

  // 编钟/磬:不谐和泛音,长衰减
  function bell(ctx, dest, t, midi, dur, vel) {
    var f = hz(midi);
    var ratios = [1, 2.76, 5.4, 8.93], amps = [1, 0.5, 0.25, 0.12];
    var g = ctx.createGain(); env(g, t, 0.003, 0.17 * vel, t + dur);
    g.connect(dest);
    for (var i = 0; i < ratios.length; i++) {
      var o = ctx.createOscillator(); o.type = 'sine';
      o.frequency.setValueAtTime(f * ratios[i], t);
      var pg = ctx.createGain(); pg.gain.value = amps[i];
      o.connect(pg); pg.connect(g); o.start(t); o.stop(t + dur + 0.05);
    }
  }

  // 低音长音(沉重):两个正弦(主音 + 五度)缓起缓落
  function drone(ctx, dest, t, midi, dur, vel) {
    var o1 = ctx.createOscillator(), o2 = ctx.createOscillator();
    o1.type = 'sine'; o2.type = 'sine';
    o1.frequency.setValueAtTime(hz(midi), t); o2.frequency.setValueAtTime(hz(midi + 7), t);
    var g2 = ctx.createGain(); g2.gain.value = 0.45;
    var g = ctx.createGain();
    var peak = 0.13 * vel;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + dur * 0.25);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o1.connect(g); o2.connect(g2); g2.connect(g); g.connect(dest);
    o1.start(t); o2.start(t); o1.stop(t + dur + 0.05); o2.stop(t + dur + 0.05);
  }

  // ---------- 旋律生成 ----------
  // 一个"小节动机":8 个八分格,每格是音阶级数偏移(相对该小节的"落点")或 null(休止)
  function makeMotif(rng, density, span) {
    var m = [], cur = 0;
    for (var i = 0; i < 8; i++) {
      if (rng() < density || i === 0) {
        var step = Math.round((rng() - 0.5) * span);     // 随机游走
        cur = Math.max(-3, Math.min(7, cur + step));
        m.push(cur);
      } else m.push(null);
    }
    return m;
  }

  // 为一首曲子生成"小节计划":每小节包含若干事件 {step, inst, midi, dur(格数), vel}
  function planTrack(mood, seed) {
    var rng = makeRng(seed);
    var bars = [];
    var isLeisure = mood.name === '悠闲', isLively = mood.name === '轻快',
        isIntense = mood.name === '激烈', isHeavy = mood.name === '沉重';
    var dens = isLeisure ? 0.35 : isLively ? 0.75 : isIntense ? 0.9 : 0.28;
    var span = isIntense ? 4 : isLively ? 3 : 2.4;
    var motifA = makeMotif(rng, dens, span), motifB = makeMotif(rng, dens, span);
    // 小节结构:A A' B A | A A' B A | …;最后一小节落在主音
    var pattern = ['A', 'A2', 'B', 'A'];
    var baseDeg = isHeavy ? -3 : isLeisure ? 2 : isLively ? 5 : 5;   // 旋律所在音区(以级数计)
    for (var b = 0; b < mood.bars; b++) {
      var tag = pattern[b % 4];
      var motif = tag === 'B' ? motifB : motifA;
      var shift = (tag === 'A2') ? (rng() < 0.5 ? 1 : -1) : 0;      // A' 是 A 的轻微变奏
      var ev = [];
      var last = b === mood.bars - 1;
      // 旋律
      for (var s = 0; s < 8; s++) {
        var d = motif[s];
        if (d === null) continue;
        var deg = baseDeg + d + shift;
        if (last) { if (s === 0) deg = baseDeg; else continue; }   // 终止小节:只在第一拍落主音
        var len = 1;
        for (var k = s + 1; k < 8 && motif[k] === null; k++) len++;      // 持续到下一个音
        if (isLeisure || isHeavy) len = Math.min(len + 1, 8 - s);
        if (last) len = 8;
        ev.push({ step: s, inst: (isLeisure || isHeavy) ? 'flute' : 'pluck',
                  midi: degToMidi(mood, deg), dur: len, vel: 0.9 });
      }
      // 伴奏
      if (isLeisure) {                              // 古筝上下行琶音(每格一音,落在和弦音 1-3-5 级)
        var arp = [0, 2, 4, 2, 3, 2, 4, 2];
        var rootDeg = (b % 4 === 2) ? 3 : 0;        // 第 3 小节换到 4 级和声
        for (var s2 = 0; s2 < 8; s2++) {
          if (last && s2 > 0) break;
          ev.push({ step: s2, inst: 'pluck', midi: degToMidi(mood, rootDeg + arp[s2] - 5), dur: 2, vel: 0.45 });
        }
      } else if (isLively) {                        // 木鱼节奏 + 低音拨弦
        for (var s3 = 0; s3 < 8; s3 += 2) if (!last) ev.push({ step: s3, inst: 'wood', vel: 0.6 });
        ev.push({ step: 0, inst: 'pluck', midi: degToMidi(mood, -5), dur: 3, vel: 0.6 });
        if (!last) ev.push({ step: 4, inst: 'pluck', midi: degToMidi(mood, -3), dur: 3, vel: 0.5 });
      } else if (isIntense) {                       // 大鼓:强拍重击 + 低音急拨
        ev.push({ step: 0, inst: 'drum', vel: 1.0 });
        if (!last) {
          ev.push({ step: 2, inst: 'drum', vel: 0.55, low: false });
          ev.push({ step: 4, inst: 'drum', vel: 0.9 });
          ev.push({ step: 6, inst: 'drum', vel: 0.55 });
          for (var s4 = 0; s4 < 8; s4 += 2) ev.push({ step: s4, inst: 'pluck', midi: degToMidi(mood, -5), dur: 1, vel: 0.5 });
        }
      } else if (isHeavy) {                         // 长音低鸣 + 编钟
        ev.push({ step: 0, inst: 'drone', midi: mood.root - 12, dur: 8, vel: 1.0 });
        ev.push({ step: 0, inst: 'bell', midi: degToMidi(mood, 0) , dur: 8, vel: 0.8 });
        if (!last && b % 2 === 1) ev.push({ step: 4, inst: 'bell', midi: degToMidi(mood, 2), dur: 6, vel: 0.5 });
      }
      bars.push(ev);
    }
    return bars;
  }

  // ---------- 调度(实时 + 离线共用) ----------
  var LOG = [];          // 测试用:最近 600 个事件 {mood, inst, midi, t}
  function logEv(mood, inst, midi, t) {
    LOG.push({ mood: mood, inst: inst, midi: midi === undefined ? null : midi, t: t });
    if (LOG.length > 600) LOG.shift();
  }

  function playEvent(ctx, dest, wet, mood, e, t, stepDur) {
    var dur = (e.dur || 1) * stepDur;
    logEv(mood.name, e.inst, e.midi, t);
    if (e.inst === 'pluck') {
      pluck(ctx, dest, t, e.midi, Math.max(dur, 0.35), e.vel, mood.name === '激烈' ? 9 : 6);
      if (wet && e.vel > 0.6) pluck(ctx, wet, t, e.midi, Math.max(dur, 0.35), e.vel * 0.35, 5);
    }
    else if (e.inst === 'flute') flute(ctx, dest, t, e.midi, Math.max(dur, 0.5), e.vel);
    else if (e.inst === 'drum')  drum(ctx, dest, t, e.vel, mood.name === '沉重');
    else if (e.inst === 'wood')  wood(ctx, dest, t, e.vel);
    else if (e.inst === 'bell')  bell(ctx, wet || dest, t, e.midi, Math.max(dur, 1.2), e.vel);
    else if (e.inst === 'drone') drone(ctx, dest, t, e.midi, Math.max(dur, 1.5), e.vel);
  }

  // 建立主输出链:master → (压缩器) → destination;并行"回响"(简易反馈延迟)
  function buildChain(ctx, volume) {
    var master = ctx.createGain(); master.gain.value = volume;
    var comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18; comp.ratio.value = 4; comp.attack.value = 0.01; comp.release.value = 0.25;
    master.connect(comp); comp.connect(ctx.destination);
    var wetIn = ctx.createGain(); wetIn.gain.value = 0.5;
    var dl = ctx.createDelay(1.0); dl.delayTime.value = 0.31;
    var fb = ctx.createGain(); fb.gain.value = 0.38;
    var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2600;
    wetIn.connect(dl); dl.connect(lp); lp.connect(fb); fb.connect(dl); lp.connect(master);
    var analyser = ctx.createAnalyser(); analyser.fftSize = 1024; master.connect(analyser);
    return { master: master, wet: wetIn, analyser: analyser };
  }

  // ---------- 播放器状态 ----------
  var ctx = null, chain = null;
  var volume = 0.5;
  var playing = false, paused = false;
  var timer = null;
  var track = null;         // { mood, plan, bar, step, nextTime, stepDur, restBars }
  var lastMood = null;
  var trackCount = 0;

  function ensureCtx() {
    if (ctx) return ctx;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      chain = buildChain(ctx, volume);
    } catch (e) { ctx = null; chain = null; }
    return ctx;
  }

  function pickMood(forced) {
    if (forced && MOODS[forced]) return MOODS[forced];
    var pool = MOOD_NAMES.filter(function (n) { return n !== lastMood; });
    var name = pool[Math.floor(Math.random() * pool.length)];
    return MOODS[name];
  }

  function newTrack(startAt, forced) {
    var mood = pickMood(forced);
    lastMood = mood.name;
    trackCount++;
    var seed = (Date.now() ^ (trackCount * 2654435761)) >>> 0;
    track = {
      mood: mood, plan: planTrack(mood, seed), bar: 0, step: 0,
      stepDur: 60 / mood.bpm / 2, nextTime: startAt, restBars: 0
    };
  }

  // 把 [当前, upTo] 之间到期的格子全部安排出去
  function pump(c, dest, wet, upTo) {
    while (track && track.nextTime < upTo) {
      if (track.bar >= track.mood.bars) {                  // 一首结束:休息 2 小节后换曲
        track.restBars = 2;
        newTrack(track.nextTime + track.stepDur * 16);
        continue;
      }
      var evs = track.plan[track.bar];
      for (var i = 0; i < evs.length; i++) {
        if (evs[i].step === track.step) playEvent(c, dest, wet, track.mood, evs[i], track.nextTime, track.stepDur);
      }
      track.nextTime += track.stepDur;
      track.step++;
      if (track.step >= 8) { track.step = 0; track.bar++; }
    }
  }

  function tick() {
    if (!ctx || !playing || paused) return;
    pump(ctx, chain.master, chain.wet, ctx.currentTime + 0.6);
  }

  var Music = {
    moods: MOOD_NAMES.slice(),
    // 开始播放(应在用户点击/触摸之后调用,否则浏览器会拦截)。forcedMood 可选,用于测试。
    start: function (forcedMood) {
      if (playing) return true;
      var c = ensureCtx();
      if (!c) return false;
      try { if (c.state === 'suspended' && c.resume) c.resume(); } catch (e) {}
      playing = true; paused = false;
      newTrack(c.currentTime + 0.15, forcedMood);
      tick();
      timer = setInterval(tick, 120);
      return true;
    },
    stop: function () {
      playing = false; paused = false;
      if (timer) { clearInterval(timer); timer = null; }
      track = null;
      if (ctx) {                                    // 立刻静音:断开旧链路,下次 start 重建
        try { chain.master.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.05); } catch (e) {}
        var old = ctx; ctx = null; chain = null;
        setTimeout(function () { try { old.close(); } catch (e) {} }, 400);
      }
    },
    pause: function () {
      if (!playing || paused) return;
      paused = true;
      try { if (ctx && ctx.suspend) ctx.suspend(); } catch (e) {}
    },
    resume: function () {
      if (!playing || !paused) return;
      paused = false;
      try { if (ctx && ctx.resume) ctx.resume(); } catch (e) {}
    },
    next: function () {                             // 立刻换下一首(随机)
      if (!playing || !ctx) return;
      newTrack(ctx.currentTime + 0.2);
    },
    isPlaying: function () { return playing && !paused; },
    current: function () { return track ? track.mood.name : null; },
    setVolume: function (v) {
      volume = Math.max(0, Math.min(1, v));
      if (chain) chain.master.gain.value = volume;
    },
    level: function () {                            // 测试用:当前输出的 RMS
      if (!chain) return 0;
      var a = new Float32Array(chain.analyser.fftSize);
      chain.analyser.getFloatTimeDomainData(a);
      var s = 0; for (var i = 0; i < a.length; i++) s += a[i] * a[i];
      return Math.sqrt(s / a.length);
    },
    // 离线渲染(测试用):返回 Promise<AudioBuffer>,用同样的调度代码生成 seconds 秒的指定情绪
    renderOffline: function (moodName, seconds, seed) {
      var sr = 22050;
      var oc = new OfflineAudioContext(1, Math.floor(sr * seconds), sr);
      var ch = buildChain(oc, volume);
      var saveTrack = track, saveLast = lastMood;
      var mood = MOODS[moodName];
      track = { mood: mood, plan: planTrack(mood, seed || 1), bar: 0, step: 0,
                stepDur: 60 / mood.bpm / 2, nextTime: 0.05, restBars: 0 };
      pump(oc, ch.master, ch.wet, seconds);
      track = saveTrack; lastMood = saveLast;
      return oc.startRendering();
    },
    __log: LOG,
    __plan: function (moodName, seed) { return planTrack(MOODS[moodName], seed || 1); },
    __scale: function (moodName) {
      var m = MOODS[moodName]; var set = {};
      for (var d = -12; d < 20; d++) set[degToMidi(m, d)] = true;
      return set;
    }
  };

  window.Music = Music;
})();
