// 成语填填 — ui.js(第 5b 步:主界面 + 选关页 + 关卡解锁)
// 所有数据文字一律用 textContent 写入;渲染函数可重复调用,每次重绘全部内容。
// 交互判断全部走 game 接口(game.select / game.input / game.hint),ui 里不复制游戏规则。

(function () {
  'use strict';

  var SAVE_KEY = 'chengyu-tiantian';            // SPEC 第 6 节
  var DEFAULT_LEVEL = 0;
  var DEFAULT_COINS = 100;
  var DEFAULT_SCRIPT = 's';

  var levels = [];                    // 第 4c 步:提到外层,start() 里的局部变量改用这个
  var currentIndex = 0;               // 当前关卡序号(从 0 开始)
  var coins = DEFAULT_COINS;          // SPEC 第 3 节第 10 条:初始金币 100
  var script = DEFAULT_SCRIPT;        // 's'/'t';第 5a 步起可在设置面板里切换
  var rewarded = false;               // 防重复:同一关只发一次通关奖励,进入新关时清零
  var unlocked = 0;                   // 第 5b 步:已解锁的最大关卡序号(从 0 开始),序号 <= unlocked 的关卡可进入
  var unlockAll = false;              // 第 E2 步:"解锁全部"开关(true 时选关页全部可点,不改真实进度 unlocked)
  var prevFilled = {};                // 第 A2a 步:上一次 render 时每个格子是否已有字,键 'r,c' → true
  var prevDone = {};                  // 第 A2a 步:上一次 render 时属于已完成词的格子,键 'r,c' → true
  var lastLevelId = null;             // 第 A2a 步:上一次 render 的关卡 id,换关时不播放动画
  var pendingPromo = '';              // 第 C2a 步:通关时若称号/府邸变化,存晋升提示文案,弹窗出现时展示一次后置空

  function el(tag, className) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    return node;
  }

  function showError(msg) {
    var app = document.getElementById('app');
    app.textContent = '';                       // 清掉骨架,只留一行红字
    var p = el('div');
    p.id = 'load-error';
    p.textContent = msg;
    app.appendChild(p);
  }

  // ---------- 音效(第 A3a 步):WebAudio 合成,不用音频文件 ----------
  var SOUND_KEY = 'chengyu-tiantian-sound';
  var soundOn = true;
  try { if (localStorage.getItem(SOUND_KEY) === 'off') soundOn = false; } catch (e) {}
  var audioCtx = null;
  window.__sfxLog = [];            // 测试用:记录每次请求的音效名(不管开关是否打开,只记录请求;最多保留 60 条)

  function setSoundOn(v) {
    soundOn = !!v;
    try { localStorage.setItem(SOUND_KEY, soundOn ? 'on' : 'off'); } catch (e) {}
  }
  function getAudio() {
    if (audioCtx) return audioCtx;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (AC) audioCtx = new AC();
    } catch (e) { audioCtx = null; }
    return audioCtx;
  }
  // 播放一个音:freq 频率,start 相对现在的秒数,dur 时长秒,type 波形,vol 音量(0~0.2)
  function tone(freq, start, dur, type, vol) {
    var ctx = getAudio();
    if (!ctx) return;
    try {
      if (ctx.state === 'suspended' && ctx.resume) ctx.resume();
      var t0 = ctx.currentTime + start;
      var osc = ctx.createOscillator();
      var g = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t0);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(g); g.connect(ctx.destination);
      osc.start(t0); osc.stop(t0 + dur + 0.02);
    } catch (e) { /* 忽略 */ }
  }
  // 第 F1 步:金币撒落声——约 1.5 秒内 12 次清脆叮当(填字相关音效已全部静音)
  function coinShower() {
    // 约 1.5 秒内 12 次清脆的金币叮当声:高频正弦 + 短促泛音,音高随机取自五声音阶高音
    var pitches = [1568, 1760, 2093, 2349, 2637];
    for (var i = 0; i < 12; i++) {
      var t = i * 0.11 + Math.random() * 0.06;
      var f = pitches[Math.floor(Math.random() * pitches.length)];
      tone(f, t, 0.16, 'sine', 0.07);
      tone(f * 1.5, t + 0.012, 0.1, 'sine', 0.035);
    }
  }
  function playSound(name) {
    window.__sfxLog.push(name);
    if (window.__sfxLog.length > 60) window.__sfxLog.shift();
    if (!soundOn) return;
    try {
      // 第 F1 步:select/correct/wrong/word 不发声(仍记录进 __sfxLog,调用点不变)
      if (name === 'hint')    { tone(1200, 0, 0.08, 'sine', 0.09); tone(1600, 0.08, 0.12, 'sine', 0.09); }
      else if (name === 'win')     { tone(523, 0, 0.14, 'triangle', 0.14); tone(659, 0.13, 0.14, 'triangle', 0.14); tone(784, 0.26, 0.14, 'triangle', 0.14); tone(1047, 0.39, 0.4, 'triangle', 0.15); }
      else if (name === 'coin') { coinShower(); }
    } catch (e) { /* 忽略 */ }
  }
  window.__setSound = setSoundOn;
  window.__getSound = function () { return soundOn; };
// ---------- 背景音乐(第 F2 步):接入 window.Music(由 music.js 提供),设备级偏好 ----------
  var MUSIC_KEY = 'chengyu-tiantian-music';   // 设备级偏好,不按档案区分(同 SOUND_KEY 写法)
  var musicOn = true;                          // 默认开:没有这个键就是开
  try { if (localStorage.getItem(MUSIC_KEY) === 'off') musicOn = false; } catch (e) {}

  function setMusicOn(v) {
    musicOn = !!v;
    try { localStorage.setItem(MUSIC_KEY, musicOn ? 'on' : 'off'); } catch (e) {}
  }
  // 浏览器会拦截未交互时的自动播放,所以只在首次用户手势后调用(见下方 pointerdown 监听)。
  function startMusic() {
    if (!musicOn) return;
    if (!window.Music) return;                 // music.js 没加载时不报错
    try {
      if (!Music.isPlaying()) {                // 只在尚未播放时启动
        Music.setVolume(0.5);
        Music.start();
      }
    } catch (e) { /* 忽略 */ }
  }
  document.addEventListener('pointerdown', function () { startMusic(); });
  // 触屏浏览器里 pointerdown 不一定算"用户手势"(音频会被拦截),click/touchend 再补一道;startMusic 重复调用无副作用
  document.addEventListener('click', function () { startMusic(); });
  document.addEventListener('touchend', function () { startMusic(); });  // 绑在 document:档案登录页(profile gate)也能触发
  document.addEventListener('visibilitychange', function () {
    try {
      if (!window.Music) return;
      if (document.hidden) {
        if (Music.isPlaying()) Music.pause();  // 页面隐藏:暂停
      } else if (musicOn) {
        Music.resume();                        // 暂停过则恢复(没暂停/没 start 时 resume 内部无操作)
        startMusic();                          // 还没 start 过则启动(已在播放则跳过)
      }
    } catch (e) { /* 忽略 */ }
  });
  window.__musicOn = function () { return musicOn; };   // 第 F2 步:测试钩子


  // 轻提示:屏幕下方居中的深色小条,约 1.5 秒后自动消失;新的替换旧的。
  function showToast(msg) {
    var container = document.getElementById('toast-container');
    container.textContent = '';                 // 连续触发时新的替换旧的
    var t = el('div', 'toast');
    t.textContent = msg;                        // 数据文字用 textContent
    container.appendChild(t);
    setTimeout(function () {
      if (container.firstChild === t) container.textContent = '';
    }, 1500);
  }

  // ---------- 每日签到(第 B2a 步) ----------
  var CHECKIN_KEY = 'chengyu-tiantian-checkin';
  var CHECKIN_REWARDS = [20, 30, 40, 50, 60, 80, 150];   // 第 1~7 天奖励

  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function todayStr() {
    if (window.__today) return window.__today;            // 测试用:可由 window.__setToday('2026-10-14') 覆盖
    var d = new Date();
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }
  function dayDiff(a, b) {                                 // b 比 a 晚几天(整数,可为负)
    var pa = a.split('-'), pb = b.split('-');
    var ta = Date.UTC(+pa[0], +pa[1] - 1, +pa[2]), tb = Date.UTC(+pb[0], +pb[1] - 1, +pb[2]);
    return Math.round((tb - ta) / 86400000);
  }
  function loadCheckin() {
    var s = { last: null, streak: 0 };
    try {
      var raw = localStorage.getItem(CHECKIN_KEY);
      if (raw) {
        var o = JSON.parse(raw);
        if (o && typeof o === 'object' &&
            typeof o.last === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(o.last) &&
            typeof o.streak === 'number' && Number.isInteger(o.streak) && o.streak >= 1 && o.streak <= 7) {
          s.last = o.last; s.streak = o.streak;
        }
      }
    } catch (e) { /* 坏数据:用默认 */ }
    return s;
  }
  // 返回 { claimedToday: bool, day: 1..7, reward: number }
  //   claimedToday 为 true 时,day 是"今天已领的是第几天";否则 day 是"今天可领的是第几天"。
  function checkinStatus() {
    var s = loadCheckin();
    var today = todayStr();
    if (s.last !== null) {
      var diff = dayDiff(s.last, today);
      if (diff <= 0) {                                      // 今天已领(diff===0);时钟被往回调(diff<0)也视为已领,防刷
        return { claimedToday: true, day: s.streak, reward: CHECKIN_REWARDS[s.streak - 1] };
      }
      if (diff === 1) {                                     // 连续:接着往下一天;满 7 天后回到第 1 天
        var nd = s.streak >= 7 ? 1 : s.streak + 1;
        return { claimedToday: false, day: nd, reward: CHECKIN_REWARDS[nd - 1] };
      }
    }
    return { claimedToday: false, day: 1, reward: CHECKIN_REWARDS[0] };   // 首次或断签:从第 1 天重新开始
  }
  // 领取:成功返回 { day, reward },今天已领返回 null。
  function claimCheckin() {
    var st = checkinStatus();
    if (st.claimedToday) return null;
    coins += st.reward;
    try { localStorage.setItem(CHECKIN_KEY, JSON.stringify({ last: todayStr(), streak: st.day })); } catch (e) {}
    save();                                                 // 金币变化后存游戏存档
    return { day: st.day, reward: st.reward };
  }
  window.__setToday = function (s) { window.__today = s || null; };
  window.__checkinStatus = checkinStatus;

  // ---------- 通关进度与等级(第 C1 步) ----------
  var PROGRESS_KEY = 'chengyu-tiantian-progress';
  var RANKS = [
    { min: 0, name: '学童' },
    { min: 2, name: '书生' },
    { min: 15, name: '儒生' },
    { min: 40, name: '秀才' },
    { min: 70, name: '举人' },
    { min: 100, name: '状元' },
    { min: 115, name: '翰林丙' },
    { min: 135, name: '翰林乙' },
    { min: 155, name: '翰林甲' },
    { min: 175, name: '大学士丙' },
    { min: 200, name: '大学士乙' },
    { min: 225, name: '大学士甲' },
    { min: 255, name: '首辅丙' },
    { min: 275, name: '首辅乙' },
    { min: 300, name: '首辅甲' }
  ];
  var HOUSES = [
    { min: 0, name: '草屋', art: 0 },
    { min: 5, name: '泥屋', art: 1 },
    { min: 25, name: '木屋', art: 2 },
    { min: 60, name: '大木屋', art: 3 },
    { min: 100, name: '书院', art: 4 },
    { min: 120, name: '官邸丙', art: 5 },
    { min: 145, name: '官邸乙', art: 5 },
    { min: 170, name: '官邸甲', art: 5 },
    { min: 195, name: '庄园丙', art: 6 },
    { min: 220, name: '庄园乙', art: 6 },
    { min: 245, name: '庄园甲', art: 6 },
    { min: 265, name: '王府丙', art: 7 },
    { min: 285, name: '王府乙', art: 7 },
    { min: 300, name: '王府甲', art: 7 }
  ];

  var cleared = [];   // 已通关关卡序号的数组(不重复的整数,按从小到大排序)
  var bonusClaimed = [];   // 已领取奖励关的称号名数组,如 ['书生']
  var bonusRank = null;          // 正在玩的奖励关对应的称号名;null 表示不在奖励关
  var bonusPrevGame = null;      // 进入奖励关前的 window.__game,退出时恢复
  var bonusPrevRewarded = false; // 进入奖励关前的 rewarded 值
  var estate = ESTATE.newState();   // 府邸状态，存放在 PROGRESS_KEY 的 JSON 里（字段 estate）

  // 从存档读通关记录。迁移:PROGRESS_KEY 不存在(老玩家)时,用主存档的当前关序号
  // level 生成 [0,1,...,level-1] 并立即写回;PROGRESS_KEY 存在但坏了(解析失败/
  // 不是对象)则返回 [],不迁移。调用前提:levels 已加载(见 start() 里 load() 之后)。
  function loadProgress() {
    bonusClaimed = [];
    estate = ESTATE.newState();
    var raw = null;
    try { raw = localStorage.getItem(PROGRESS_KEY); } catch (e) { return []; }
    if (raw === null) {                                   // 老玩家:从主存档迁移
      var arr = [];
      try {
        var o = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
        if (o && typeof o.level === 'number' && Number.isInteger(o.level) &&
            o.level >= 0 && o.level < levels.length) {
          for (var i = 0; i < o.level; i++) arr.push(i);  // 已通关的关数就是 level
        }
      } catch (e) { /* 主存档也坏了:空记录 */ }
      cleared = arr;
      saveProgress();                                     // 立即写回 PROGRESS_KEY
      return cleared.slice();
    }
    try {
      var p = JSON.parse(raw);
      if (!p || typeof p !== 'object' || !Array.isArray(p.cleared)) return [];
      var seen = {};
      var out = [];
      for (var j = 0; j < p.cleared.length; j++) {
        var n = p.cleared[j];
        if (Number.isInteger(n) && n >= 0 && n < levels.length && !seen[n]) {
          seen[n] = true;
          out.push(n);
        }
      }
      out.sort(function (a, b) { return a - b; });        // 去重后升序排序
      cleared = out;
      // 读 bonusClaimed:必须是字符串、是 RANKS(第 1 项起)的 name、不重复;
      // p.bonusClaimed 不存在或不是数组则保持 []
      if (Array.isArray(p.bonusClaimed)) {
        var seenB = {};
        for (var k = 0; k < p.bonusClaimed.length; k++) {
          var b = p.bonusClaimed[k];
          if (typeof b !== 'string' || seenB[b]) continue;
          var okRank = false;
          for (var m = 1; m < RANKS.length; m++) {        // 跳过 '学童'(RANKS[0])
            if (RANKS[m].name === b) { okRank = true; break; }
          }
          if (!okRank) continue;
          seenB[b] = true;
          bonusClaimed.push(b);
        }
      }
      estate = ESTATE.sanitize(p.estate);
      return out.slice();
    } catch (e) { return []; }                            // 坏了:空记录,不迁移
  }

  function saveProgress() {
    try { localStorage.setItem(PROGRESS_KEY, JSON.stringify({ cleared: cleared, bonusClaimed: bonusClaimed, estate: estate })); } catch (e) {}
  }

  // 通关时记录:合法整数且不在 cleared 里才 push(去重),push 后重排升序并写盘。
  function markCleared(index) {
    if (!Number.isInteger(index) || index < 0 || index >= levels.length) return;
    if (cleared.indexOf(index) !== -1) return;            // 已记录过:不重复
    cleared.push(index);
    cleared.sort(function (a, b) { return a - b; });
    saveProgress();
  }

  // 按"已通关的不同关卡数"取等级:从后往前找第一个 min <= count 的档。
  function levelFromTable(table, count) {
    for (var i = table.length - 1; i >= 0; i--) {
      if (count >= table[i].min) return table[i];
    }
    return table[0];
  }
  function rankInfo() {
    var c = cleared.length;
    var cur = levelFromTable(RANKS, c);
    var next = null;
    for (var i = 0; i < RANKS.length; i++) {
      if (RANKS[i].min > c) { next = RANKS[i]; break; }
    }
    return { name: cur.name, count: c, nextName: next ? next.name : null,
             nextMin: next ? next.min : null };
  }
  function houseInfo() {
    var c = cleared.length;
    var cur = levelFromTable(HOUSES, c);
    var next = null;
    for (var i = 0; i < HOUSES.length; i++) {
      if (HOUSES[i].min > c) { next = HOUSES[i]; break; }
    }
    return { name: cur.name, count: c, nextName: next ? next.name : null,
             nextMin: next ? next.min : null };
  }

  // 可领取的奖励关称号:RANKS 第 1 项起,min <= 已通关数,且不在 bonusClaimed 里
  function bonusAvailable() {
    var out = [];
    for (var i = 1; i < RANKS.length; i++) {
      if (RANKS[i].min <= cleared.length && bonusClaimed.indexOf(RANKS[i].name) === -1) {
        out.push(RANKS[i].name);
      }
    }
    return out;
  }

  // 奖励关用哪一关(序号,0 开始)。暂用尾部关卡,之后会换成专用奖励关。
  var BONUS_LEVEL_FROM_END = { '书生': 1, '儒生': 2, '秀才': 3, '举人': 4, '状元': 5 };   // 仅当 levels.json 没有 bonus 时的备用
  var BONUS_ORDER = { '书生': 0, '儒生': 1, '秀才': 2, '举人': 3, '状元': 4, '翰林丙': 5, '翰林乙': 6, '翰林甲': 7, '大学士丙': 8, '大学士乙': 9, '大学士甲': 10, '首辅丙': 11, '首辅乙': 12, '首辅甲': 13 };           // 专用奖励关(levels.json 的 bonus 数组)下标
  var bonusLevels = [];                                                                  // 专用奖励关,start() 里加载
  // 取某称号的奖励关:优先用专用奖励关,没有则退回尾部关卡
  function bonusLevelFor(rankName) {
    var k = BONUS_ORDER[rankName];
    if (k === undefined) return null;
    if (bonusLevels[k]) return bonusLevels[k];
    var i = bonusLevelIndex(rankName);
    return i >= 0 && levels[i] ? levels[i] : null;
  }
  function bonusLevelIndex(rankName) {
    var k = BONUS_LEVEL_FROM_END[rankName];
    if (!k) return -1;
    return Math.max(0, levels.length - k);
  }

  // 记录已领取:只接受合法的、尚未领取的称号名;成功返回 true 并 saveProgress()
  function markBonusClaimed(rankName) {
    if (typeof rankName !== 'string') return false;
    var ok = false;
    for (var i = 1; i < RANKS.length; i++) if (RANKS[i].name === rankName) ok = true;
    if (!ok || bonusClaimed.indexOf(rankName) !== -1) return false;
    bonusClaimed.push(rankName);
    saveProgress();
    return true;
  }

  window.__markCleared = markCleared;
  window.__rankInfo = rankInfo;
  window.__houseInfo = houseInfo;
  window.__bonusAvailable = bonusAvailable;
  window.__bonusLevelIndex = bonusLevelIndex;
  window.__markBonusClaimed = markBonusClaimed;
  window.__bonusClaimedList = function () { return bonusClaimed.slice(); };

  // 府邸购买/收获的包装(G3b):先调 ESTATE 纯逻辑,成功才改 coins 并存档、刷新金币显示和按钮价格。
  function estateAfterChange() {
    saveProgress(); save();
    var cn = document.getElementById('coins-num'); if (cn) cn.textContent = String(coins);
    refreshActionButtons();
  }
  function estateBuyAnnex(id) {
    ESTATE.tickPond(estate, todayStr());                 // 先按旧等级结算池塘
    var r = ESTATE.buyAnnex(estate, id, houseIndex(), coins);
    if (r.ok) { coins = r.coins; estateAfterChange(); }
    return r;
  }
  function estateBuyVenue(id) {
    var r = ESTATE.buyVenue(estate, id, houseIndex(), coins);
    if (r.ok) { coins = r.coins; estateAfterChange(); }
    return r;
  }
  function estateBuyDecor(id) {
    var r = ESTATE.buyDecor(estate, id, houseIndex(), coins);
    if (r.ok) { coins = r.coins; estateAfterChange(); }
    return r;
  }
  function estateCollectPond() {
    var r = ESTATE.collectPond(estate, todayStr(), coins);
    if (r.ok) { coins = r.coins; estateAfterChange(); }
    return r;
  }
  window.__estate = function () { return estate; };
  window.__estateBuyAnnex = estateBuyAnnex;
  window.__estateBuyDecor = estateBuyDecor;
  window.__estateBuyVenue = estateBuyVenue;
  window.__estateCollectPond = estateCollectPond;
  window.__houseIndex = houseIndex;
  window.__hintCost = hintCostNow;
  window.__meaningCost = meaningCostNow;
  window.__bonusRank = function () { return bonusRank; };
  window.__startBonus = startBonus;

  // ---------- 府邸经济接线(第 G3b 步) ----------
  function houseIndex() { return HOUSES.indexOf(levelFromTable(HOUSES, cleared.length)); }
  function hintCostNow() { return ESTATE.hintCost(estate, 60); }
  function meaningCostNow() { return ESTATE.meaningCost(estate, 30); }
  // 刷新"提示/释义"按钮的灰态和价格文字
  function refreshActionButtons() {
    var hb = document.getElementById('btn-hint'), mb = document.getElementById('btn-meaning');
    if (!hb || !mb) return;
    var free = estate.freeHints > 0;
    hb.classList.toggle('disabled', !free && coins < hintCostNow());
    mb.classList.toggle('disabled', coins < meaningCostNow());
    var hc = hb.querySelector('.action-cost'), mc = mb.querySelector('.action-cost');
    if (hc) hc.textContent = free ? ('免费×' + estate.freeHints) : String(hintCostNow());
    if (mc) mc.textContent = String(meaningCostNow());
  }

  // ---------- 存档(SPEC 第 6 节):所有读写包 try/catch,坏数据回默认值 ----------
  // levelOverride(第 5a 步):checkWin 发奖后传入"下一关"序号(最后一关传 0),
  // 这样通关后未点"下一关"就刷新也不会重复领奖励;不传则用 currentIndex。
  function save(levelOverride) {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({
        level: (typeof levelOverride === 'number') ? levelOverride : currentIndex,
        coins: coins,
        script: script,
        unlocked: unlocked,                       // 第 5b 步:存档增加 unlocked 字段
        unlockAll: unlockAll                        // 第 E2 步:开关状态入档(独立布尔,不改动 unlocked)
      }));
    } catch (e) { /* 读写失败:忽略 */ }
  }

  function load() {
    var s = { level: DEFAULT_LEVEL, coins: DEFAULT_COINS, script: DEFAULT_SCRIPT, unlocked: 0, unlockAll: false };
    var hadUnlocked = false;                       // 存档里是否有合法的 unlocked 字段(旧存档没有)
    try {
      var raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        var o = JSON.parse(raw);
        if (o && typeof o === 'object') {
          if (typeof o.level === 'number' && Number.isInteger(o.level) &&
              o.level >= 0 && o.level < levels.length) {
            s.level = o.level;
          }
          if (typeof o.coins === 'number' && Number.isFinite(o.coins) && o.coins >= 0) {
            s.coins = o.coins;
          }
          if (o.script === 's' || o.script === 't') s.script = o.script;
          // 第 5b 步:unlocked 不合法(不是整数、<0、超出范围)时用默认 0;
          // 旧存档没有 unlocked 字段也走默认 0(下面再按 level 抬高)。
          if (typeof o.unlocked === 'number' && Number.isInteger(o.unlocked) &&
              o.unlocked >= 0 && o.unlocked < levels.length) {
            s.unlocked = o.unlocked;
            hadUnlocked = true;
          }
          // 第 E2 步:unlockAll 只认真布尔值;缺失/其它值一律 false(旧存档兼容)
          if (typeof o.unlockAll === 'boolean') s.unlockAll = o.unlockAll;
        }
      }
    } catch (e) { /* 读不到 / 解析失败:用默认值 */ }
    // 第 5b 步:保证当前关一定已解锁 —— level 大于 unlocked 时把 unlocked 抬到 level
    // 旧存档(没有合法 unlocked 字段):按 level 抬高;新存档:开关关闭时 level 不得超过真实进度
    if (!hadUnlocked) { if (s.level > s.unlocked) s.unlocked = s.level; }
    else if (!s.unlockAll && s.level > s.unlocked) s.level = s.unlocked;
    return s;
  }

  // 格子边长自适应(第 7a 步):同时受宽度和高度约束,优先保证整页不超出屏幕。
  // 必须在 render 末尾调用(此时 #pool/#actions 已渲染好);other 不含棋盘自身高度,
  // 所以不受当前 --cell 影响,无循环依赖。
  function fitBoard(game) {
    var app = document.getElementById('app');
    var topbar = document.getElementById('topbar');
    var main = document.querySelector('main');
    var board = document.getElementById('board');
    var actions = document.getElementById('actions');
    var pool = document.getElementById('pool');

    var csMain = getComputedStyle(main);
    var csBoard = getComputedStyle(board);
    var csActions = getComputedStyle(actions);
    var csPool = getComputedStyle(pool);

    // 其他元素占用的高度:顶栏 + main 上下 padding + board 上下 margin
    // + actions(含上下 margin) + pool(含上下 margin)
    var other = topbar.offsetHeight
      + parseFloat(csMain.paddingTop) + parseFloat(csMain.paddingBottom)
      + parseFloat(csBoard.marginTop) + parseFloat(csBoard.marginBottom)
      + actions.offsetHeight + parseFloat(csActions.marginTop) + parseFloat(csActions.marginBottom)
      + pool.offsetHeight + parseFloat(csPool.marginTop) + parseFloat(csPool.marginBottom);

    var avail = window.innerHeight - other;
    var cellH = (avail - (game.level.rows - 1) * 6) / game.level.rows;   // 6 = #board 的 gap
    var cellW = (Math.min(window.innerWidth, 430) - 48) / game.level.cols;
    var cell = Math.floor(Math.max(30, Math.min(64, cellW, cellH)));
    app.style.setProperty('--cell', cell + 'px');
  }

  // render(game, script):全量重绘顶栏、格子区、候选字区、按钮灰态。
  // script 传 's'/'t'(第 5a 步起可切换);第 4 步起会反复调用,故每次先清空再重建。
  function render(game, script) {
    var level = game.level;
    var animate = (lastLevelId === level.id);   // 第 A2a 步:换关(含首次)不播放动画

    // 顶栏:第 N 关 + 金币(金币来自 ui 里的 coins 变量)
    document.getElementById('level-title').textContent = bonusRank ? ('奖励关 · ' + bonusRank) : ('第 ' + level.id + ' 关');
    document.getElementById('coins-num').textContent = String(coins);

    // 已完成成语的格子集合(第 1 关开始时应为空,逻辑照写)
    var doneSet = {};
    game.completedWords().forEach(function (wid) {
      var w = null;
      for (var i = 0; i < level.words.length; i++) {
        if (level.words[i].id === wid) { w = level.words[i]; break; }
      }
      if (!w) return;
      w.cells.forEach(function (rc) { doneSet[rc[0] + ',' + rc[1]] = true; });
    });

    // 格子区:CSS Grid,列数 = level.cols;不在 level.cells 里的位置画空占位格
    var board = document.getElementById('board');
    board.textContent = '';
    document.getElementById('app').style.setProperty('--cols', String(level.cols));
    // 第 7a 步:--cell 不再按宽度写死,改由 render 末尾的 fitBoard 按宽高双约束计算。

    var cellMap = {};
    level.cells.forEach(function (cell) { cellMap[cell.r + ',' + cell.c] = cell; });

    for (var r = 0; r < level.rows; r++) {
      for (var c = 0; c < level.cols; c++) {
        var cell = cellMap[r + ',' + c];
        if (!cell) {
          board.appendChild(el('div', 'cell-empty'));   // 留空,不画方块
          continue;
        }
        var tile = el('div', 'cell');
        tile.setAttribute('data-r', String(r));
        tile.setAttribute('data-c', String(c));
        var ch = game.display(r, c, script);            // 空格未填时返回 null
        if (ch !== null) tile.textContent = ch;
        if (cell.blank === true) tile.classList.add('blank');
        if (doneSet[r + ',' + c]) tile.classList.add('done');
        var sel = game.state.selected;
        if (sel && sel.r === r && sel.c === c) tile.classList.add('selected');
        // 第 A2a 步:本次新出现的字弹跳;本次新变 done 的格子(含固定字)闪烁
        if (ch !== null && !prevFilled[r + ',' + c] && animate) tile.classList.add('pop');
        if (doneSet[r + ',' + c] && !prevDone[r + ',' + c] && animate) tile.classList.add('flash');
        board.appendChild(tile);
      }
    }

    // 候选字区:level.pool 每字一个方块,带 data-pool-index
    var pool = document.getElementById('pool');
    pool.textContent = '';
    level.pool.forEach(function (p, i) {
      var t = el('div', 'pool-tile');
      t.setAttribute('data-pool-index', String(i));
      t.textContent = p[script];
      if (game.state.usedPool[i]) t.classList.add('used');
      pool.appendChild(t);
    });

    // 余额不足时按钮视觉变灰(点击仍会弹"金币不足"提示)
    refreshActionButtons();

    // 第 A2a 步:用本次 render 结果重建 prevFilled/prevDone,记录本次关卡 id
    prevFilled = {};
    prevDone = {};
    for (var rr = 0; rr < level.rows; rr++) {
      for (var cc = 0; cc < level.cols; cc++) {
        if (!cellMap[rr + ',' + cc]) continue;
        if (game.display(rr, cc, script) !== null) prevFilled[rr + ',' + cc] = true;
        if (doneSet[rr + ',' + cc]) prevDone[rr + ',' + cc] = true;
      }
    }
    lastLevelId = level.id;

    // 第 7a 步:render 末尾(#pool/#actions 已渲染好)按可用高度计算 --cell
    fitBoard(game);
  }

  // 释义弹窗:列出包含选中格的所有成语(交叉格显示多条),每条 = 成语 + 释义。
  function openMeaningModal(words) {
    var panel = document.getElementById('meaning-panel');
    panel.textContent = '';                     // 每次重建内容
    words.forEach(function (w) {
      var block = el('div', 'meaning-item');
      var title = el('div', 'meaning-word');
      title.textContent = w[script];            // 第 5a 步:跟随当前简繁
      var body = el('div', 'meaning-text');
      body.textContent = w.meaning;
      block.appendChild(title);
      block.appendChild(body);
      panel.appendChild(block);
    });
    var close = el('button', 'meaning-close');
    close.type = 'button';
    close.textContent = '关闭';
    close.addEventListener('click', closeMeaningModal);   // 每次重建,绑在当前按钮上,无重复问题
    panel.appendChild(close);
    document.getElementById('meaning-overlay').hidden = false;
  }

  function closeMeaningModal() {
    document.getElementById('meaning-overlay').hidden = true;
  }

  // ---------- 通关弹窗(第 4c 步):复用 #meaning-overlay 样式,另建 #win-overlay ----------
  // 不能点遮罩关闭(不绑遮罩 click),只能点"下一关"按钮。
  function openWinModal(reward, isBonus) {
    var panel = document.getElementById('win-panel');
    panel.textContent = '';                     // 每次重建内容

    var h = el('div', 'win-title');
    h.textContent = isBonus ? '奖励关完成!' : '通关!';
    panel.appendChild(h);

    window.__game.level.words.forEach(function (w) {
      var block = el('div', 'meaning-item');    // 复用释义弹窗的条目样式
      var title = el('div', 'meaning-word');
      title.textContent = w[script];            // 第 5a 步:跟随当前简繁
      var body = el('div', 'meaning-text');
      body.textContent = w.meaning;
      block.appendChild(title);
      block.appendChild(body);
      panel.appendChild(block);
    });

    var gain = el('div', 'win-reward');
    gain.textContent = isBonus ? ('奖励关双倍:获得 ' + reward + ' 金币') : ('获得 ' + reward + ' 金币');
    panel.appendChild(gain);

    if (isBonus) {   // G2b:奖励关弹窗只有一个"回主页"按钮(不进下一关、不改 currentIndex)
      var bactions = el('div', 'win-actions');
      var bhome = el('button', 'meaning-close');
      bhome.type = 'button';
      bhome.textContent = '回主页';
      bhome.addEventListener('click', function () {
        closeWinModal();
        showScreen('home');                     // showScreen 内部自动 endBonus
      });
      bactions.appendChild(bhome);
      panel.appendChild(bactions);
      document.getElementById('win-overlay').hidden = false;
      return;
    }

    var last = currentIndex >= levels.length - 1;   // 最后一关:按钮变"重新开始"
    // 第 G1 步:两个按钮——主按钮"回主页"(先切到下一关再回主页),次按钮保留原"下一关"快捷方式。
    var actions = el('div', 'win-actions');         // 按钮区固定在弹窗底部(成语多时不用滚动才看到)
    var homeBtn = el('button', 'meaning-close');    // 复用关闭按钮样式
    homeBtn.type = 'button';
    homeBtn.textContent = '回主页';
    homeBtn.addEventListener('click', function () { // 每次重建,绑在当前按钮上,无重复问题
      closeWinModal();
      gotoLevel(last ? 0 : currentIndex + 1);       // 跟原"下一关"的存档/解锁逻辑完全一致
      showScreen('home');                           // showScreen('home') 内部 renderHome 刷新进度
    });
    actions.appendChild(homeBtn);

    var btn = el('button', 'meaning-close win-next');
    btn.type = 'button';
    btn.textContent = last ? '重新开始' : '下一关';
    btn.addEventListener('click', function () {     // 每次重建,绑在当前按钮上,无重复问题
      closeWinModal();
      gotoLevel(last ? 0 : currentIndex + 1);       // 重新开始时 unlocked 保持不变(第 5b 步)
    });
    actions.appendChild(btn);
    panel.appendChild(actions);

    document.getElementById('win-overlay').hidden = false;
  }

  function closeWinModal() {
    document.getElementById('win-overlay').hidden = true;
  }

  // ---------- 设置面板(第 5a 步):复用 #meaning-overlay 的遮罩/面板样式 ----------
  // 内容由 ui.js 动态生成(textContent);打开时重绘以反映当前 script 的 active 态。
  function openSettingsPanel() {
    var panel = document.getElementById('settings-panel');
    panel.textContent = '';                     // 每次重建内容

    var h = el('div', 'win-title');             // 复用通关弹窗标题样式
    h.textContent = '设置';
    panel.appendChild(h);

    var row = el('div', 'settings-row');
    var label = el('span', 'settings-label');
    label.textContent = '字体:';
    row.appendChild(label);
    ['s', 't'].forEach(function (sc) {          // sc:本条按钮对应的简繁码(避免与外层 script 混淆)
      var b = el('button', 'script-btn');
      b.type = 'button';
      b.setAttribute('data-script', sc);
      b.textContent = sc === 's' ? '简体' : '繁體';
      if (script === sc) b.classList.add('active');   // 当前使用的加 active
      b.addEventListener('click', function () {      // 每次重建,绑在当前按钮上,无重复问题
        window.__setScript(sc);                      // 内部:save + render + 重开面板刷新 active
      });
      row.appendChild(b);
    });
    panel.appendChild(row);

    // 第 A3b 步:音效开关行(复用 settings-row / script-btn 样式,事件直接绑在按钮上)
    var soundRow = el('div', 'settings-row');
    var onBtn, offBtn;                                         // forEach 内共享引用,点击时互相更新 active
    var soundLabel = el('span', 'settings-label');
    soundLabel.textContent = '音效:';
    soundRow.appendChild(soundLabel);
    [['on', true], ['off', false]].forEach(function (pair) {   // pair[0]:data-sound 值,pair[1]:对应 soundOn 值
      var b = el('button', 'script-btn');
      b.type = 'button';
      b.setAttribute('data-sound', pair[0]);
      b.textContent = pair[0] === 'on' ? '开' : '关';
      if (soundOn === pair[1]) b.classList.add('active');      // 当前状态加 active
      b.addEventListener('click', function () {                // 只更新这两个按钮的 active,不重建面板
        setSoundOn(pair[1]);
        onBtn.classList.toggle('active', soundOn);
        offBtn.classList.toggle('active', !soundOn);
        if (soundOn) playSound('hint');                      // 第 F1 步:开启时用提示音试听(correct 已静音);关闭时不播放
      });
      if (pair[0] === 'on') onBtn = b; else offBtn = b;
      soundRow.appendChild(b);
    });
    panel.appendChild(soundRow);
    // 第 F2 步:音乐开关行(复用 settings-row / settings-label / script-btn / active,做法完全照抄音效行)
    var musicRow = el('div', 'settings-row');
    var musicOnBtn, musicOffBtn;                                     // forEach 内共享引用,点击时互相更新 active
    var musicLabel = el('span', 'settings-label');
    musicLabel.textContent = '音乐:';
    musicRow.appendChild(musicLabel);
    [['on', true], ['off', false]].forEach(function (pair) {         // pair[0]:data-music 值,pair[1]:对应 musicOn 值
      var b = el('button', 'script-btn');
      b.type = 'button';
      b.setAttribute('data-music', pair[0]);
      b.textContent = pair[0] === 'on' ? '开' : '关';
      if (musicOn === pair[1]) b.classList.add('active');            // 当前状态加 active
      b.addEventListener('click', function () {                      // 只更新这两个按钮的 active,不重建面板
        setMusicOn(pair[1]);                                         // 存设备级偏好
        if (musicOn) startMusic();                                   // 开:启动(已播放则内部跳过)
        else if (window.Music) { try { Music.stop(); } catch (e) {} } // 关:停止(无 Music 不报错)
        musicOnBtn.classList.toggle('active', musicOn);
        musicOffBtn.classList.toggle('active', !musicOn);
      });
      if (pair[0] === 'on') musicOnBtn = b; else musicOffBtn = b;
      musicRow.appendChild(b);
    });
    var nextBtn = el('button', 'script-btn');                        // "换一首"放同一行最后
    nextBtn.type = 'button';
    nextBtn.setAttribute('data-music', 'next');
    nextBtn.textContent = '换一首';
    nextBtn.addEventListener('click', function () {
      if (!musicOn) return;                                          // 关着时什么都不做
      if (!window.Music) return;
      try { Music.next(); } catch (e) { /* 忽略 */ }
    });
    musicRow.appendChild(nextBtn);
    panel.appendChild(musicRow);


    // 第 E2 步:"解锁全部"开关(独立一行,复用 settings-row / script-btn / active,同字体按钮做法)。
    // 开关只改 unlockAll,不碰真实进度 unlocked;关闭后选关页恢复按 unlocked 解锁。
    var unlockRow = el('div', 'settings-row');
    var unlockLabel = el('span', 'settings-label');
    unlockLabel.textContent = '解锁全部:';
    unlockRow.appendChild(unlockLabel);
    var onBtn2, offBtn2;
    [['on', true], ['off', false]].forEach(function (pair) {   // pair[0]:data-unlock 值,pair[1]:对应 unlockAll 值
      var b = el('button', 'script-btn');
      b.type = 'button';
      b.setAttribute('data-unlock', pair[0]);
      b.textContent = pair[0] === 'on' ? '开' : '关';
      if (unlockAll === pair[1]) b.classList.add('active');    // 当前状态加 active
      b.addEventListener('click', function () {                // 只更新这两个按钮的 active,不重建面板
        if (unlockAll === pair[1]) return;                     // 状态没变:无操作
        unlockAll = pair[1];
        save();                                                // 开关状态入档(不动 currentIndex/coins/unlocked)
        onBtn2.classList.toggle('active', unlockAll);
        offBtn2.classList.toggle('active', !unlockAll);
        showToast(unlockAll ? '已解锁全部关卡' : '已恢复真实进度');
      });
      if (pair[0] === 'on') onBtn2 = b; else offBtn2 = b;
      unlockRow.appendChild(b);
    });
    panel.appendChild(unlockRow);

    // 第 E2 步:重置进度行(复用 settings-row / settings-label / profile-warn / profile-err / profile-del)
    var resetRow = el('div', 'settings-row');
    var resetLabel = el('span', 'settings-label');
    resetLabel.textContent = '重置进度:';
    resetRow.appendChild(resetLabel);
    var resetWarn = el('div', 'profile-warn');
    resetWarn.textContent = '清空当前玩家的全部进度(金币、通关记录、成语册、签到),重新开始';
    var resetErr = el('div', 'profile-err');
    var resetBtn = el('button', 'profile-del');
    resetBtn.type = 'button';
    resetBtn.textContent = '重置进度';
    var confirmState = 0;                                      // 0=未点过 1=已点一次待再点确认
    resetBtn.addEventListener('click', function () {
      if (confirmState === 0) {                                // 第一次点:出确认文案 + 密码框(可留空)
        confirmState = 1;
        resetWarn.textContent = '再点一次"重置进度"确认;若设置了 PIN,请输入 PIN 确认';
        var pinIn = el('input', 'profile-pin');
        pinIn.type = 'password';
        pinIn.inputMode = 'numeric';
        pinIn.pattern = '[0-9]*';
        pinIn.maxLength = 4;
        pinIn.autocomplete = 'off';
        pinIn.placeholder = 'PIN(可留空)';
        resetRow.appendChild(pinIn);
        resetBtn.textContent = '确认重置';
        try { pinIn.focus(); } catch (e) {}
        return;
      }
      var prof = null;                                         // 第 E1a 步:有 PIN 的档案要 PIN 对才重置
      if (currentProfileId && currentProfileId !== 'legacy') {
        var list = loadProfiles().list;
        for (var i = 0; i < list.length; i++) {
          if (list[i].id === currentProfileId) { prof = list[i]; break; }
        }
      }
      var pinIn2 = resetRow.querySelector('.profile-pin');
      var pinVal = pinIn2 ? pinIn2.value : '';
      if (prof) {
        if (!/^\d{4}$/.test(pinVal)) { resetErr.textContent = '请输入 PIN 确认'; return; }
        if (!verifyPin(prof, pinVal)) { resetErr.textContent = 'PIN 不正确'; return; }
      }
      resetProgress();                                         // 清空当前档案全部进度
      resetWarn.textContent = '已重置,从头开始';
      resetErr.textContent = '';
      confirmState = 0;
      resetBtn.textContent = '重置进度';
      if (pinIn2) resetRow.removeChild(pinIn2);
      showToast('进度已重置');
    });
    resetRow.appendChild(resetWarn);
    resetRow.appendChild(resetErr);
    resetRow.appendChild(resetBtn);
    panel.appendChild(resetRow);

    var close = el('button', 'meaning-close');  // 复用关闭按钮样式
    close.type = 'button';
    close.textContent = '关闭';
    close.addEventListener('click', closeSettingsPanel);   // 每次重建,绑在当前按钮上
    panel.appendChild(close);

    document.getElementById('settings-overlay').hidden = false;
  }

  function closeSettingsPanel() {
    document.getElementById('settings-overlay').hidden = true;
    if (!document.getElementById('home').hidden) renderHome();
  }

  // ---------- 每日签到面板(第 B2a 步):复用 #settings-overlay / #settings-panel,每次重建内容 ----------
  function openCheckinPanel() {
    var panel = document.getElementById('settings-panel');
    panel.textContent = '';

    var h = el('div', 'win-title');
    h.textContent = '每日签到';
    panel.appendChild(h);

    var note = el('div', 'checkin-note');
    note.textContent = '连续签到,第 7 天有大奖';
    panel.appendChild(note);

    var st = checkinStatus();
    var doneUpTo = st.claimedToday ? st.day : st.day - 1;   // 已领到第几天(未领:可领前一天之前都算 done)

    var grid = el('div', 'checkin-grid');
    for (var i = 1; i <= 7; i++) {
      var cell = el('div', 'checkin-cell');
      if (i <= doneUpTo) cell.classList.add('done');
      if (!st.claimedToday && i === st.day) cell.classList.add('today');
      if (i === 7) cell.classList.add('big');
      var d = el('div', 'checkin-day');
      d.textContent = '第 ' + i + ' 天';
      var rw = el('div', 'checkin-reward');
      rw.textContent = '+' + CHECKIN_REWARDS[i - 1];
      cell.appendChild(d);
      cell.appendChild(rw);
      grid.appendChild(cell);
    }
    panel.appendChild(grid);

    var btn = el('button', 'checkin-claim');
    btn.type = 'button';
    if (st.claimedToday) {
      btn.disabled = true;
      btn.textContent = '今日已签到';
    } else {
      btn.textContent = '领取 +' + st.reward + ' 金币';
      btn.addEventListener('click', function () {
        var r = claimCheckin();
        if (r) {
          showToast('签到成功,获得 ' + r.reward + ' 金币');
          playSound('coin');                                 // 第 F1 步:签到领奖撒金币叮当声(原 word 已静音)
          // 同步金币显示:首页可见则 renderHome() 重绘;否则更新游戏页金币数字
          if (!document.getElementById('home').hidden) renderHome();
          else document.getElementById('coins-num').textContent = String(coins);
          openCheckinPanel();      // 重建面板(按钮变禁用,格子变 done)
        }
      });
    }
    panel.appendChild(btn);

    var close = el('button', 'meaning-close');  // 复用关闭按钮样式
    close.type = 'button';
    close.textContent = '关闭';
    close.addEventListener('click', closeSettingsPanel);   // 每次重建,绑在当前按钮上
    panel.appendChild(close);

    document.getElementById('settings-overlay').hidden = false;
  }
  window.__openCheckin = openCheckinPanel;

  // ---------- 功名府邸面板(第 C2b 步):复用 #settings-overlay / #settings-panel,每次重建内容 ----------
  function openProgressPanel() {
    var panel = document.getElementById('settings-panel');
    panel.textContent = '';

    var h = el('div', 'win-title');
    h.textContent = '功名府邸';
    panel.appendChild(h);

    var ri = rankInfo(), hiInfo = houseInfo();
    var c = ri.count;

    // 府邸插画:当前档位 SVG(HOUSE_SVG 是静态代码,非用户输入,可用 innerHTML)
    var hi = 0;
    for (var i = 0; i < HOUSES.length; i++) {
      if (HOUSES[i].name === hiInfo.name) { hi = i; break; }
    }
    var box = el('div', 'progress-house');
    box.innerHTML = (window.HOUSE_SVG && window.HOUSE_SVG[HOUSES[hi].art]) || '';
    panel.appendChild(box);

    var names = el('div', 'progress-names');
    names.textContent = ri.name + ' · ' + hiInfo.name;
    panel.appendChild(names);

    var line = el('div', 'progress-line');
    line.textContent = '已通关 ' + c + ' / ' + levels.length + ' 关';
    panel.appendChild(line);

    // 进度条行:cur=当前档(表里 min<=count 的最后一档),next=下一档;lo/hi 为两档 min
    function barRow(table, info, topLabel) {
      var cur = null, nxt = null;
      for (var k = 0; k < table.length; k++) {
        if (table[k].min <= c) cur = table[k];
        else if (!nxt) nxt = table[k];
      }
      var row = el('div', 'progress-row');
      var label = el('span', 'progress-label');
      label.textContent = info.nextName
        ? ('距「' + info.nextName + '」还需 ' + (info.nextMin - c) + ' 关')
        : topLabel;
      row.appendChild(label);
      var bar = el('div', 'progress-bar');
      var fill = el('div', 'progress-fill');
      var pct;
      if (!nxt) {
        pct = 100;                                       // 已是最高档
      } else {
        pct = (c - cur.min) / (nxt.min - cur.min) * 100;
        if (pct < 0) pct = 0;
        if (pct > 100) pct = 100;
      }
      fill.style.width = pct + '%';
      bar.appendChild(fill);
      row.appendChild(bar);
      panel.appendChild(row);
    }
    barRow(RANKS, ri, '功名已至巅峰');
    barRow(HOUSES, hiInfo, '府邸已至圆满');

    // 功名阶梯列表
    var ladder = el('div', 'progress-ladder');
    for (var r = 0; r < RANKS.length; r++) {
      var step = el('span', 'progress-step');
      step.textContent = RANKS[r].min === 0 ? RANKS[r].name : (RANKS[r].name + '(' + RANKS[r].min + ')');
      if (c >= RANKS[r].min) step.classList.add('done');
      if (RANKS[r] === levelFromTable(RANKS, c)) step.classList.add('current');
      ladder.appendChild(step);
    }
    panel.appendChild(ladder);

    var vb = el('button', 'checkin-claim');  // 复用绿色按钮样式(第 D1 步)
    vb.type = 'button';
    vb.textContent = '成语册(' + vocab.length + ')';
    vb.addEventListener('click', openVocabPanel);          // 每次重建,绑在当前按钮上
    panel.appendChild(vb);

    var gb = el('button', 'checkin-claim');  // 复用绿色按钮样式(第 D2 步)
    gb.type = 'button';
    gb.textContent = '宾客(' + guestsUnlocked().length + '/' + (window.GUESTS ? window.GUESTS.length : 0) + ')';
    gb.addEventListener('click', openGuestsPanel);         // 每次重建,绑在当前按钮上
    panel.appendChild(gb);

    var close = el('button', 'meaning-close');  // 复用关闭按钮样式
    close.type = 'button';
    close.textContent = '关闭';
    close.addEventListener('click', closeSettingsPanel);   // 每次重建,绑在当前按钮上
    panel.appendChild(close);

    document.getElementById('settings-overlay').hidden = false;
  }
  window.__openProgress = openProgressPanel;

  // ---------- 第 E1b 步:玩家档案面板(复用 #settings-overlay / #settings-panel,每次重建内容) ----------
  function openProfilePanel() {
    if (!currentProfileName()) return;   // 无档案/兼容模式:不进此面板

    var panel = document.getElementById('settings-panel');
    panel.textContent = '';

    var h = el('div', 'win-title');
    h.textContent = '玩家档案';
    panel.appendChild(h);

    var cur = el('div', 'profile-current');
    cur.textContent = '当前玩家:' + currentProfileName();
    panel.appendChild(cur);

    var sw = el('button', 'checkin-claim');   // 复用绿色按钮样式
    sw.type = 'button';
    sw.textContent = '切换玩家';
    sw.addEventListener('click', function () {
      try { save(); } catch (e) {}
      try { localStorage.removeItem(ACTIVE_KEY); } catch (e) {}
      location.reload();
    });
    panel.appendChild(sw);

    var del = el('button', 'profile-del');
    del.type = 'button';
    del.textContent = '删除此档案';
    del.addEventListener('click', openProfileDeletePanel);   // 每次重建,绑在当前按钮上
    panel.appendChild(del);

    var close = el('button', 'meaning-close');
    close.type = 'button';
    close.textContent = '关闭';
    close.addEventListener('click', closeSettingsPanel);     // 每次重建,绑在当前按钮上
    panel.appendChild(close);

    document.getElementById('settings-overlay').hidden = false;
  }
  window.__openProfilePanel = openProfilePanel;

  // 确认删除视图:输入该档案的 4 位 PIN 才能永久删除(删完 reload 回选择/新建档案界面)
  function openProfileDeletePanel() {
    var panel = document.getElementById('settings-panel');
    panel.textContent = '';

    var h = el('div', 'win-title');
    h.textContent = '删除档案';
    panel.appendChild(h);

    var warn = el('div', 'profile-warn');
    warn.textContent = '将永久删除「' + currentProfileName() + '」的所有进度,无法恢复。请输入该档案的 4 位 PIN 确认。';
    panel.appendChild(warn);

    var input = el('input', 'profile-pin');
    input.id = 'pg-delpin';
    input.type = 'password';
    input.inputMode = 'numeric';
    input.pattern = '[0-9]*';
    input.maxLength = 4;
    input.autocomplete = 'off';
    input.placeholder = '4 位 PIN';
    panel.appendChild(input);

    var err = el('div', 'profile-err');
    err.textContent = '';
    panel.appendChild(err);

    var ok = el('button', 'profile-del');
    ok.type = 'button';
    ok.textContent = '确认删除';
    ok.addEventListener('click', function () {   // 每次重建,绑在当前按钮上
      var profile = null;
      var list = loadProfiles().list;
      for (var i = 0; i < list.length; i++) {
        if (list[i].id === currentProfileId) { profile = list[i]; break; }
      }
      if (!profile || !verifyPin(profile, input.value)) {
        err.textContent = 'PIN 不正确';
        input.value = '';
        return;
      }
      deleteProfileData(currentProfileId);
      location.reload();
    });
    panel.appendChild(ok);

    var back = el('button', 'meaning-close');
    back.type = 'button';
    back.textContent = '取消';
    back.addEventListener('click', openProfilePanel);   // 每次重建,绑在当前按钮上
    panel.appendChild(back);

    document.getElementById('settings-overlay').hidden = false;
  }

  // ---------- 成语册面板(第 D1 步):复用 #settings-overlay / #settings-panel,每次重建内容 ----------
  function openVocabPanel() {
    var panel = document.getElementById('settings-panel');
    panel.textContent = '';

    var h = el('div', 'win-title');
    h.textContent = '成语册';
    panel.appendChild(h);

    var cnt = el('div', 'vocab-count');
    cnt.textContent = '已学 ' + vocab.length + ' 条成语';
    panel.appendChild(cnt);

    if (vocab.length === 0) {
      var empty = el('div', 'vocab-empty');
      empty.textContent = '通关后,学到的成语会收在这里';
      panel.appendChild(empty);
    } else {
      var list = el('div', 'vocab-list');
      for (var i = vocab.length - 1; i >= 0; i--) {   // 最近学到的在前(vocab 倒序)
        var info = vocabInfoOf(vocab[i]);
        if (!info) continue;
        var item = el('div', 'vocab-item');
        var word = el('div', 'vocab-word');
        word.textContent = (script === 't' ? info.t : info.s);
        item.appendChild(word);
        var mean = el('div', 'vocab-meaning');
        mean.textContent = info.meaning;
        item.appendChild(mean);
        list.appendChild(item);
      }
      panel.appendChild(list);
    }

    var back = el('button', 'meaning-close');  // 复用关闭按钮样式
    back.type = 'button';
    back.textContent = '返回';
    back.addEventListener('click', openProgressPanel);   // 每次重建,绑在当前按钮上
    panel.appendChild(back);

    document.getElementById('settings-overlay').hidden = false;
  }
  window.__openVocab = openVocabPanel;

  // ---------- 宾客图鉴(第 D2 步):复用 #settings-overlay / #settings-panel,每次重建内容 ----------
  function guestsUnlocked() {
    if (!window.GUESTS) return [];
    var c = rankInfo().count;
    var out = [];
    for (var i = 0; i < window.GUESTS.length; i++) {
      if (window.GUESTS[i].need <= c && ESTATE.venueBuilt(estate, window.GUESTS[i].cat)) out.push(window.GUESTS[i]);
    }
    return out;
  }

  var guestTab = 0;   // 当前类别下标

  function openGuestsPanel() {
    var panel = document.getElementById('settings-panel');
    panel.textContent = '';

    var h = el('div', 'win-title');
    h.textContent = '宾客';
    panel.appendChild(h);

    var all = window.GUESTS || [];
    var cats = window.GUEST_CATS || [];
    var count = rankInfo().count;
    var unlockedSet = guestsUnlocked();

    var cnt = el('div', 'guest-count');
    cnt.textContent = '已结识 ' + unlockedSet.length + ' / ' + all.length + ' 位';
    panel.appendChild(cnt);

    var tabs = el('div', 'guest-tabs');
    cats.forEach(function (c, ci) {
      var n = 0;
      all.forEach(function (g) { if (g.cat === c.name && g.need <= count && ESTATE.venueBuilt(estate, g.cat)) n++; });
      var tb = el('button', 'guest-tab' + (ci === guestTab ? ' on' : ''));
      tb.type = 'button';
      tb.textContent = c.name + ' ' + n;
      tb.addEventListener('click', function () { guestTab = ci; openGuestsPanel(); });
      tabs.appendChild(tb);
    });
    panel.appendChild(tabs);

    var cat = cats[guestTab] || { name: '', venue: '' };
    var vn = el('div', 'guest-venue');
    var vbuilt2 = ESTATE.venueBuilt(estate, cat.name);
    vn.textContent = '会客处:' + cat.venue + (vbuilt2 ? '(已建成)' : '(未建,请到「府邸」建造)');
    if (!vbuilt2) vn.classList.add('warn');
    panel.appendChild(vn);

    var grid = el('div', 'guest-grid');
    all.forEach(function (g) {
      if (g.cat !== cat.name) return;
      var isUnlocked = g.need <= count && ESTATE.venueBuilt(estate, g.cat);
      var card = el('div', 'guest-card' + (isUnlocked ? ' unlocked' : ' locked'));
      var fig = el('div', 'guest-figure');
      var im = document.createElement('img');
      im.src = g.img; im.alt = isUnlocked ? g.name : '未结识'; im.loading = 'lazy'; im.draggable = false;
      fig.appendChild(im);
      card.appendChild(fig);
      var name = el('div', 'guest-name');
      name.textContent = isUnlocked ? g.name : '???';
      card.appendChild(name);
      var desc = el('div', 'guest-desc');
      desc.textContent = isUnlocked ? g.title : (g.need > count ? ('通关 ' + g.need + ' 关') : ('待建' + cat.venue));
      card.appendChild(desc);
      if (isUnlocked) card.addEventListener('click', function () { openGuestDetail(g); });
      grid.appendChild(card);
    });
    panel.appendChild(grid);

    var back = el('button', 'meaning-close');  // 复用关闭按钮样式
    back.type = 'button';
    back.textContent = '返回';
    back.addEventListener('click', openProgressPanel);   // 每次重建,绑在当前按钮上
    panel.appendChild(back);

    document.getElementById('settings-overlay').hidden = false;
  }

  function openGuestDetail(g) {
    var panel = document.getElementById('settings-panel');
    panel.textContent = '';
    var big = el('div', 'guest-big');
    var im = document.createElement('img');
    im.src = g.img; im.alt = g.name; im.draggable = false;
    big.appendChild(im);
    panel.appendChild(big);
    var nm = el('div', 'win-title');
    nm.textContent = g.name;
    panel.appendChild(nm);
    var tt = el('div', 'guest-count');
    tt.textContent = g.cat + ' · ' + g.title;
    panel.appendChild(tt);
    var ds = el('div', 'guest-bio');
    ds.textContent = g.desc;
    panel.appendChild(ds);
    var back = el('button', 'meaning-close');
    back.type = 'button';
    back.textContent = '返回';
    back.addEventListener('click', openGuestsPanel);
    panel.appendChild(back);
  }
  window.__openGuests = openGuestsPanel;
  window.__guestsUnlocked = function () { return guestsUnlocked().map(function (g) { return g.name; }); };

  // 第 A2b 步:通关庆祝(撒花 + 金币滚动 + 飘字 + 延迟弹窗)
  function celebrate(reward, oldCoins) {
    playSound('win');                                    // 第 A3a 步:通关音效(声音不属于视觉动效,放 reduce 判断之前)
    playSound('coin');                                   // 第 F1 步:通关撒金币叮当声
    // 尊重"减少动态效果"系统设置
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    rollCoins(oldCoins, coins, reduce ? 0 : 700);
    if (reduce) return;
    launchConfetti();
    floatGain(reward);
  }
  function rollCoins(from, to, ms) {
    var node = document.getElementById('coins-num');
    if (!ms) { node.textContent = String(to); return; }
    var start = null;
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min(1, (ts - start) / ms);
      node.textContent = String(Math.round(from + (to - from) * p));
      if (p < 1) requestAnimationFrame(step); else node.textContent = String(to);
    }
    requestAnimationFrame(step);
  }
  function launchConfetti() {
    var box = document.createElement('div');
    box.className = 'confetti';
    var colors = ['#d9a73a', '#c8452f', '#5fae6b', '#2f4f5f', '#f3d27a', '#e0b090'];
    for (var i = 0; i < 36; i++) {
      var p = document.createElement('span');
      p.className = 'confetti-piece';
      p.style.left = (Math.random() * 100) + '%';
      p.style.background = colors[i % colors.length];
      p.style.animationDelay = (Math.random() * 0.35) + 's';
      p.style.animationDuration = (1.4 + Math.random() * 0.9) + 's';
      box.appendChild(p);
    }
    document.body.appendChild(box);
    setTimeout(function () { if (box.parentNode) box.parentNode.removeChild(box); }, 2600);
  }
  function floatGain(reward) {
    var anchor = document.getElementById('coins');
    var r = anchor.getBoundingClientRect();
    var t = document.createElement('div');
    t.className = 'gain-float';
    t.textContent = '+' + reward;
    t.style.left = (r.left + r.width / 2) + 'px';
    t.style.top = (r.bottom) + 'px';
    document.body.appendChild(t);
    setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 1300);
  }

  // ---------- 成语册(第 D1 步) ----------
  var VOCAB_KEY = 'chengyu-tiantian-vocab';
  var vocab = [];   // 已学成语(简体字符串数组,按学会的先后顺序,不重复)
  var vocabIndex = {};   // s -> {s, t, meaning}(loadVocab 里从 levels 预建缓存)

  // 从存档读成语册。迁移:VOCAB_KEY 不存在(老玩家)时,按 cleared 升序把每个
  // 已通关关卡的全部 words.s 依次加入(去重)并立即写回;VOCAB_KEY 存在但坏了
  // (解析失败/不是对象)则返回 [],不迁移、不覆盖。调用前提:levels 与 cleared 已加载。
  function loadVocab() {
    var known = {};   // 全部 levels 里真实存在的 s 的集合
    vocabIndex = {};
    for (var i = 0; i < levels.length; i++) {
      var ws = levels[i].words || [];
      for (var j = 0; j < ws.length; j++) {
        if (typeof ws[j].s === 'string' && !(ws[j].s in vocabIndex)) {
          known[ws[j].s] = true;
          vocabIndex[ws[j].s] = { s: ws[j].s, t: ws[j].t, meaning: ws[j].meaning };
        }
      }
    }
    var raw = null;
    try { raw = localStorage.getItem(VOCAB_KEY); } catch (e) { return []; }
    if (raw === null) {                                   // 老玩家:从 cleared 迁移
      var arr = [];
      var seen = {};
      var cl = cleared.slice().sort(function (a, b) { return a - b; });
      for (var k = 0; k < cl.length; k++) {
        var lv = levels[cl[k]];
        if (!lv) continue;
        var w2 = lv.words || [];
        for (var m = 0; m < w2.length; m++) {
          var s2 = w2[m].s;
          if (typeof s2 === 'string' && known[s2] && !seen[s2]) {
            seen[s2] = true;
            arr.push(s2);
          }
        }
      }
      vocab = arr;
      saveVocab();                                        // 立即写回 VOCAB_KEY
      return vocab.slice();
    }
    try {
      var o = JSON.parse(raw);
      if (!o || typeof o !== 'object' || !Array.isArray(o.words)) return [];
      var out = [];
      var seen2 = {};
      for (var n = 0; n < o.words.length; n++) {
        var w3 = o.words[n];
        if (typeof w3 === 'string' && known[w3] && !seen2[w3]) {
          seen2[w3] = true;
          out.push(w3);
        }
      }
      vocab = out;                                        // 保持原顺序
      return out.slice();
    } catch (e) { return []; }                            // 坏了:空记录,不迁移、不覆盖
  }

  function saveVocab() {
    try { localStorage.setItem(VOCAB_KEY, JSON.stringify({ words: vocab })); } catch (e) {}
  }

  // 通关时记录:遍历本关 words,不在 vocab 里的依次 push(去重),有新增才写盘。
  function addVocabFromLevel(index) {
    if (!levels[index]) return;
    var ws = levels[index].words || [];
    var added = false;
    for (var i = 0; i < ws.length; i++) {
      var s = ws[i].s;
      if (typeof s === 'string' && vocab.indexOf(s) === -1) {
        vocab.push(s);
        added = true;
      }
    }
    if (added) saveVocab();
  }

  // 查成语信息:返回 {s, t, meaning},找不到返回 null。
  function vocabInfoOf(s) {
    return (s in vocabIndex) ? vocabIndex[s] : null;
  }
  window.__getVocab = function () { return vocab.slice(); };

  // 通关检查:每次"填入成功"之后、render 之后调用。奖励只发一次(rewarded 防重复)。
  function checkWin() {
    var game = window.__game;
    if (!game.isComplete()) return;
    if (rewarded) return;
    rewarded = true;
    if (bonusRank) {
      var thisBonus = bonusRank;
      var bReward = (20 + (game.state.errors === 0 ? 10 : 0)) * 2;   // 双倍:零错 60,有错 40
      var bOld = coins;
      coins += bReward;
      markBonusClaimed(thisBonus);
      refreshActionButtons();
      save();                      // 不带参数:level 仍是 currentIndex,unlocked 不变
      celebrate(bReward, bOld);
      setTimeout(function () {
        if (bonusRank !== thisBonus) return;                         // 已离开奖励关:不弹
        if (document.getElementById('app').hasAttribute('hidden')) return;
        openWinModal(bReward, true);
      }, 650);
      return;                      // 不走下面的正常通关逻辑(不 markCleared、不加成语册、不晋升、不 unlocked)
    }
    var reward = 20;                              // SPEC 第 3 节第 8 条:基础 20
    if (game.state.errors === 0) reward += 10;    // 本关零错额外 +10
    var oldCoins = coins;
    coins += reward;
    // 第 5b 步:通关解锁下一关(不超过最后一关);重新开始(最后一关通关回第 1 关)时不重置
    if (currentIndex <= unlocked) unlocked = Math.min(Math.max(unlocked, currentIndex + 1), levels.length - 1);   // 只有按顺序推进才提升真实进度(开关打开时跳关不算)
    // 第 A2b 步:不整盘重画(否则最后一格弹跳动画被抹掉),只更新金币相关 UI
    refreshActionButtons();
    // 第 5a 步:发奖后存"下一关"序号(最后一关存 0),内存 currentIndex 不变;
    // 通关后未点"下一关"就刷新 → 进下一关,不会重复领奖励。
    // 第 C2a 步:通关前记下旧称号/府邸,markCleared 后对比,变化则生成晋升提示
    var oldRank = rankInfo().name, oldHouse = houseInfo().name;
    var oldGuests = guestsUnlocked().length;     // 第 D2 步:通关前记下已解锁宾客数
    markCleared(currentIndex);
    addVocabFromLevel(currentIndex);              // 第 D1 步:通关把本关成语收进成语册
    var newGuests = guestsUnlocked().length;      // 第 D2 步:通关后已解锁宾客数
    var promoParts = [];
    if (rankInfo().name !== oldRank) promoParts.push('晋升:' + rankInfo().name);
    if (houseInfo().name !== oldHouse) promoParts.push('府邸升级:' + houseInfo().name);
    if (newGuests > oldGuests) {   // 第 D2/I 步:找出这次新来的那位(need 恰好等于当前通关数且会客处已建)
      var nowCount = rankInfo().count, newG = guestsUnlocked().filter(function (g) { return g.need === nowCount; })[0];
      if (newG) promoParts.push('宾客来访:' + newG.name);
    }
    pendingPromo = promoParts.join(' · ');
    // 第 E2 步:save() 现在会写出 unlockAll,通关时开关状态一并入档(内存值不变)
    save(currentIndex >= levels.length - 1 ? 0 : currentIndex + 1);
    celebrate(reward, oldCoins);
    setTimeout(function () {
      // 第 A2b 步:弹窗前保护——玩家已离开游戏页则不弹窗
      if (document.getElementById('app').hasAttribute('hidden')) { pendingPromo = ''; return; }
      openWinModal(reward);
      // 第 C2a 步:弹窗出现的同一时刻展示晋升提示(有则展示一次,随即置空)
      if (pendingPromo) { showToast(pendingPromo); playSound('win'); pendingPromo = ''; }
    }, 650);
  }

  // 奖励关(G2b):进入/退出。startBonus 不改 currentIndex、不 save;endBonus 恢复进入前的游戏实例。
  function startBonus(rank) {
    if (bonusAvailable().indexOf(rank) === -1) return;       // 不可领:忽略
    var bonusLv = bonusLevelFor(rank);
    if (!bonusLv) return;
    bonusPrevGame = window.__game;
    bonusPrevRewarded = rewarded;
    bonusRank = rank;
    rewarded = false;
    window.__game = Game.createGame(bonusLv);
    render(window.__game, script);        // 注意:不要调用 save(),不要改 currentIndex
    showScreen('game');
  }
  function endBonus() {
    if (!bonusRank) return;
    bonusRank = null;
    rewarded = bonusPrevRewarded;
    if (bonusPrevGame) window.__game = bonusPrevGame;
    else window.__game = Game.createGame(levels[currentIndex]);
    bonusPrevGame = null;
    render(window.__game, script);
  }

  // 跳到第 i 关(0 开始):建新游戏、render、存档。进入新关时 rewarded 清零。
  function gotoLevel(i) {
    currentIndex = i;
    rewarded = false;
    window.__game = Game.createGame(levels[i]);
    render(window.__game, script);
    save();                                       // 换关后存档
  }

  // ---------- 三界面切换(第 5b 步):hidden 属性切换,同一时间只显示一个 ----------
  function renderHome() {
    var home = document.getElementById('home');
    home.textContent = '';                      // 每次进入重绘全部内容

    // ===== 第 B1 步:场景首页 =====
    var top = el('div', 'home-top');            // 顶栏:右侧金币胶囊(小黄圆点 + 金币数,与 coins 同步)
    var coinRow = el('div', 'home-coins');
    coinRow.appendChild(el('span', 'coin-dot'));
    var num = el('span', 'home-coins-num');
    num.textContent = String(coins);
    coinRow.appendChild(num);
    // 第 E1b 步:当前玩家名字胶囊(div,不加 home-btn,不进首页按钮点击委托);为空(无档案/兼容模式)时不显示
    var pname = currentProfileName();
    if (pname) {
      var nameBtn = el('div', 'home-name');
      nameBtn.textContent = '👤 ' + pname;
      nameBtn.addEventListener('click', openProfilePanel);
      top.appendChild(nameBtn);
    }
    top.appendChild(coinRow);
    home.appendChild(top);

    var h1 = el('div', 'home-title');           // 大标题
    h1.textContent = '成语填填';
    home.appendChild(h1);

    var tag = el('div', 'home-tagline');        // 副标语
    tag.textContent = '月下书院 · 以字会友';
    home.appendChild(tag);

    // 第 C2a 步:功名/府邸条(非按钮,不进 .home-btn 委托)
    var rankline = el('div', 'home-rank');
    rankline.textContent = rankInfo().name + ' · ' + houseInfo().name + ' · 已通关 ' + rankInfo().count + ' 关';
    rankline.addEventListener('click', openProgressPanel);   // 第 C2b 步:点功名条打开面板
    home.appendChild(rankline);

    var spacer = el('div', 'home-spacer');      // 弹性撑开(CSS flex:1),把按钮压到画面下方地面
    home.appendChild(spacer);

    var bonusList = bonusAvailable();           // G2b:有可领奖励关时主页顶部加金色"奖励关"按钮
    if (bonusList.length > 0) {
      var bb = el('button', 'home-btn home-bonus');
      bb.type = 'button';
      var bbl = el('span', 'home-bonus-label');
      bbl.textContent = '奖励关';
      var bbs = el('span', 'home-bonus-sub');
      bbs.textContent = bonusList[0] + '贺礼 · 金币×2';
      bb.appendChild(bbl);
      bb.appendChild(bbs);
      home.appendChild(bb);
    }
    var start = el('button', 'home-btn home-start');   // 开始答题:主标题 + 小字"第 N 关"
    start.type = 'button';
    var label = el('span', 'home-btn-label');
    label.textContent = '开始答题';
    var sub = el('span', 'home-btn-sub');
    sub.textContent = '第 ' + levels[currentIndex].id + ' 关';   // N = 当前关卡 level.id
    start.appendChild(label);
    start.appendChild(sub);
    home.appendChild(start);

    var row = el('div', 'home-row');            // 圆形按钮行:选关 + 设置
    var pick = el('button', 'home-btn home-round');
    pick.type = 'button';
    pick.textContent = '选关';                  // textContent 恰好"选关"(点击委托靠它区分)
    row.appendChild(pick);
    var ci = el('button', 'home-btn home-round');
    ci.type = 'button';
    ci.textContent = '签到';
    if (!checkinStatus().claimedToday) ci.classList.add('has-dot');
    row.appendChild(ci);
    var est = el('button', 'home-btn home-round');
    est.type = 'button';
    est.textContent = '府邸';              // textContent 恰好"府邸"（点击委托靠它区分）
    row.appendChild(est);
    var set = el('button', 'home-btn home-round');
    set.type = 'button';
    set.textContent = '设置';                   // textContent 恰好"设置"
    row.appendChild(set);
    home.appendChild(row);
  }

  function renderLevels() {
    var grid = document.getElementById('level-grid');
    grid.textContent = '';                      // 每次进入重绘全部内容
    levels.forEach(function (level, i) {        // levels.length 个格子(10 关 → 5 列 × 2 行)
      var tile = el('button', 'level-tile');
      tile.type = 'button';
      tile.setAttribute('data-level-index', String(i));   // 0 开始的序号(事件委托用)
      tile.textContent = String(level.id);
      // 第 E2 步:开关开着时全部可点;否则按真实进度 unlocked
      if (!unlockAll && i > unlocked) tile.classList.add('locked');   // 未解锁:灰底淡字,点击无反应
      else if (i === currentIndex) tile.classList.add('current');   // 当前关:朱红边框
      if (cleared.indexOf(i) !== -1) tile.classList.add('done');    // 第 H 步:已通关的关卡数字显示金色
      grid.appendChild(tile);
    });
    // 第 H 步:300 关很长,进入选关时把当前关滚动到屏幕中间
    var curTile = grid.querySelector('.level-tile.current');
    if (curTile && curTile.scrollIntoView) curTile.scrollIntoView({ block: 'center' });
  }

  // showScreen('home' | 'levels' | 'game'):切换三个容器的 hidden;home/levels 每次进入重绘。
  function renderEstate() {
    var box = document.getElementById('estate');
    box.textContent = '';                                   // 每次进入重绘
    var top = el('header');
    top.id = 'estate-topbar';
    var back = el('button');
    back.id = 'btn-estate-back';
    back.type = 'button';
    back.setAttribute('aria-label', '返回');
    back.innerHTML = '&#8249;';
    back.addEventListener('click', function () { showScreen('home'); });
    var title = el('div');
    title.id = 'estate-title';
    title.textContent = '府邸';
    var cw = el('div');
    cw.id = 'estate-coins';
    cw.appendChild(el('span', 'coin-dot'));
    var cn = el('span');
    cn.id = 'estate-coins-num';
    cn.textContent = String(coins);
    cw.appendChild(cn);
    top.appendChild(back);
    top.appendChild(title);
    top.appendChild(cw);
    box.appendChild(top);

    var body = el('div');
    body.id = 'estate-body';
    var hero = el('div', 'estate-hero');
    var hi = houseIndex();
    var house = el('div', 'estate-house');
    house.innerHTML = (window.HOUSE_SVG && window.HOUSE_SVG[HOUSES[hi].art]) || '';   // 静态 SVG 代码，不是用户输入
    var nm = el('div', 'estate-house-name');
    nm.textContent = HOUSES[hi].name;
    var si = ESTATE.slotInfo(estate, hi);
    var sub = el('div', 'estate-sub');
    sub.textContent = '附属 ' + si.annexUsed + '/' + si.annexMax + ' · 陈设 ' + si.decorUsed + '/' + si.decorMax;
    hero.appendChild(house);
    hero.appendChild(nm);
    hero.appendChild(sub);
    body.appendChild(hero);

    // 第 G3c-c2 步:雅致度进度条 + 免费提示提示卡
    var ecard = el('div', 'estate-card estate-elegance');
    var erow = el('div', 'estate-row');
    var elft = el('span');
    elft.textContent = '雅致度 ' + ESTATE.elegance(estate);
    var ergt = el('span');
    ergt.textContent = '下一档 ' + ESTATE.nextEleganceAt(estate);
    erow.appendChild(elft);
    erow.appendChild(ergt);
    var bar = el('div', 'estate-bar');
    var fill = el('div', 'estate-bar-fill');
    fill.style.width = ((ESTATE.elegance(estate) % ESTATE.ELEGANCE_STEP) / ESTATE.ELEGANCE_STEP * 100) + '%';
    bar.appendChild(fill);
    var enote = el('div', 'estate-note');
    enote.textContent = '免费提示 ' + estate.freeHints + ' 次(每满 ' + ESTATE.ELEGANCE_STEP + ' 点雅致度送 1 次)';
    ecard.appendChild(erow);
    ecard.appendChild(bar);
    ecard.appendChild(enote);
    body.appendChild(ecard);

    // 第 G3c-c2 步:池塘收获卡(仅当 pondDaily > 0 时显示)
    ESTATE.tickPond(estate, todayStr());
    if (ESTATE.pondDaily(estate) > 0) {
      var pcard = el('div', 'estate-card estate-pond');
      var ptexts = el('div');
      var p1 = el('div', 'estate-row');   // 左对齐文字行
      var p1l = el('span');
      p1l.textContent = '池塘 · 每日 +' + ESTATE.pondDaily(estate) + ' 金币';
      p1.appendChild(p1l);
      var p2 = el('div', 'estate-note');
      p2.textContent = '待收 ' + estate.pondStock + ' 金币';
      ptexts.appendChild(p1);
      ptexts.appendChild(p2);
      var btn = el('button', 'estate-collect');
      btn.type = 'button';
      btn.textContent = '收获';
      if (estate.pondStock === 0) btn.classList.add('is-empty');
      btn.addEventListener('click', function () {
        var r = estateCollectPond();
        if (r.ok) showToast('收获 ' + r.gained + ' 金币');
        else showToast('池塘里还没有金币');
        renderEstate();                     // 重绘:同时刷新顶栏金币
      });
      pcard.appendChild(ptexts);
      pcard.appendChild(btn);
      body.appendChild(pcard);
    }

    // 第 G3c-c3a 步:附属建筑列表(建造/升级)
    var stitle = el('div', 'estate-section-title');
    stitle.textContent = '附属建筑';
    body.appendChild(stitle);
    ESTATE.ANNEX.forEach(function (a) {
      var lv = estate.annex[a.id] || 0;
      var item = el('div', 'estate-item');
      var icon = el('div', 'estate-icon');
      icon.innerHTML = ESTATE_ART.get('annex', a.id);   // 静态 SVG 代码，不是用户输入
      var mid = el('div');
      var name = el('div', 'estate-item-name');
      name.textContent = a.name + '  ' + (lv > 0 ? 'Lv' + lv + '/' + ESTATE.MAX_LEVEL : '未建');
      var note = el('div', 'estate-note');
      note.textContent = a.desc;
      mid.appendChild(name);
      mid.appendChild(note);
      var buy = el('button', 'estate-buy');
      buy.type = 'button';
      if (a.tier > houseIndex()) {
        buy.textContent = '需' + HOUSES[a.tier].name;
        buy.classList.add('is-locked');
        buy.disabled = true;
      } else if (lv >= ESTATE.MAX_LEVEL) {
        buy.textContent = '已满级';
        buy.classList.add('is-max');
        buy.disabled = true;
      } else {
        buy.textContent = (lv === 0 ? '建造 ' : '升级 ') + a.costs[lv] + '金';
        if (coins < a.costs[lv]) buy.classList.add('is-poor');   // 只是变灰，仍可点
        buy.addEventListener('click', function () {
          var r = estateBuyAnnex(a.id);
          if (r.ok) {
            showToast((lv === 0 ? '建成 ' : '升级 ') + a.name + (r.newHints > 0 ? '，获得免费提示 ×' + r.newHints : ''));
          } else if (r.reason === 'coins') {
            showToast('金币不够');
          } else if (r.reason === 'slots') {
            showToast('附属位已满，请先升级房子');
          } else {
            showToast('暂时不能建造');
          }
          renderEstate();                     // 重绘:无论成败都刷新顶栏金币与按钮状态
        });
      }
      item.appendChild(icon);
      item.appendChild(mid);
      item.appendChild(buy);
      body.appendChild(item);
    });

    // 第 I 步:会客处(建成后对应类别的宾客才会来访)
    var vtitle = el('div', 'estate-section-title');
    var vbuilt = Object.keys(estate.venues).length;
    vtitle.textContent = '会客处 ' + vbuilt + '/' + ESTATE.VENUES.length;
    body.appendChild(vtitle);
    ESTATE.VENUES.forEach(function (v) {
      var built = !!estate.venues[v.id];
      var item3 = el('div', 'estate-item');
      var icon3 = el('div', 'estate-icon');
      icon3.innerHTML = ESTATE_ART.get('venue', v.id);   // 静态 SVG 代码，不是用户输入
      var mid3 = el('div');
      var name3 = el('div', 'estate-item-name');
      name3.textContent = v.name + '  ' + (built ? '已建成' : '未建');
      var note3 = el('div', 'estate-note');
      note3.textContent = v.desc;
      mid3.appendChild(name3);
      mid3.appendChild(note3);
      var buy3 = el('button', 'estate-buy');
      buy3.type = 'button';
      if (built) {
        buy3.textContent = '已建成';
        buy3.classList.add('is-max');
        buy3.disabled = true;
      } else if (v.tier > houseIndex()) {
        buy3.textContent = '需' + HOUSES[v.tier].name;
        buy3.classList.add('is-locked');
        buy3.disabled = true;
      } else {
        buy3.textContent = '建造 ' + v.cost + '金';
        if (coins < v.cost) buy3.classList.add('is-poor');
        buy3.addEventListener('click', function () {
          var before = guestsUnlocked().length;
          var r = estateBuyVenue(v.id);
          if (r.ok) {
            var n = guestsUnlocked().length - before;
            showToast(v.name + '落成' + (n > 0 ? '，' + n + ' 位' + v.cat + '宾客入府' : '') + (r.newHints > 0 ? '，获得免费提示 ×' + r.newHints : ''));
          } else if (r.reason === 'coins') {
            showToast('金币不够');
          } else {
            showToast('暂时不能建造');
          }
          renderEstate();
        });
      }
      item3.appendChild(icon3);
      item3.appendChild(mid3);
      item3.appendChild(buy3);
      body.appendChild(item3);
    });

    // 第 G3c-c3b 步:陈设列表(购置)
    var dtitle = el('div', 'estate-section-title');
    dtitle.textContent = '陈设 ' + si.decorUsed + '/' + si.decorMax;
    body.appendChild(dtitle);
    ESTATE.DECOR.forEach(function (d) {
      var owned = estate.decor.indexOf(d.id) !== -1;
      var item2 = el('div', 'estate-item');
      var icon2 = el('div', 'estate-icon');
      icon2.innerHTML = ESTATE_ART.get('decor', d.id);   // 静态 SVG 代码，不是用户输入
      var mid2 = el('div');
      var name2 = el('div', 'estate-item-name');
      name2.textContent = d.name;
      var note2 = el('div', 'estate-note');
      note2.textContent = '雅致度 +' + d.elegance;
      mid2.appendChild(name2);
      mid2.appendChild(note2);
      var buy2 = el('button', 'estate-buy');
      buy2.type = 'button';
      if (owned) {
        buy2.textContent = '已购置';
        buy2.classList.add('is-max');
        buy2.disabled = true;
      } else {
        buy2.textContent = '购置 ' + d.cost + '金';
        if (coins < d.cost) buy2.classList.add('is-poor');   // 只是变灰，仍可点
        buy2.addEventListener('click', function () {
          var r = estateBuyDecor(d.id);
          if (r.ok) {
            showToast('购置 ' + d.name + (r.newHints > 0 ? '，获得免费提示 ×' + r.newHints : ''));
          } else if (r.reason === 'coins') {
            showToast('金币不够');
          } else if (r.reason === 'slots') {
            showToast('陈设位已满，请先升级房子');
          } else {
            showToast('暂时不能购置');
          }
          renderEstate();                     // 重绘:无论成败都刷新顶栏金币与按钮状态
        });
      }
      item2.appendChild(icon2);
      item2.appendChild(mid2);
      item2.appendChild(buy2);
      body.appendChild(item2);
    });

    box.appendChild(body);
  }

  function showScreen(name) {
    if (name !== 'game' && bonusRank) endBonus();     // 离开游戏界面 = 放弃奖励关(不领奖)
    document.getElementById('home').hidden = (name !== 'home');
    document.getElementById('level-select').hidden = (name !== 'levels');
    document.getElementById('app').hidden = (name !== 'game');
    document.getElementById('estate').hidden = (name !== 'estate');
    if (name === 'home') renderHome();
    if (name === 'levels') renderLevels();
    if (name === 'estate') renderEstate();
    // 第 7a 步:回到游戏界面时 #app 刚显示(隐藏时 offsetHeight 全为 0 测不到),重算一次
    if (name === 'game' && window.__game) fitBoard(window.__game);
  }

  // 事件只绑一次(事件委托):render 每次重建全部元素,逐格绑会丢/重复。
  // handler 里读 window.__game;在 start() 拿到 game 后绑定一次(见下)。
  function bindOnce() {
    document.getElementById('board').addEventListener('click', function (e) {
      var tile = e.target.closest('.cell');
      if (!tile) return;
      if (!tile.classList.contains('blank')) return;   // 已有字的格、占位格:无效果
      var r = parseInt(tile.getAttribute('data-r'), 10);
      var c = parseInt(tile.getAttribute('data-c'), 10);
      var game = window.__game;
      game.select(r, c);                                // 非空格/已填格由 game 返回 false,不选中
      if (game.state.selected) playSound('select');    // 第 A3a 步:选中成功才播
      render(game, script);
    });

    document.getElementById('pool').addEventListener('click', function (e) {
      var tile = e.target.closest('.pool-tile');
      if (!tile) return;
      var index = parseInt(tile.getAttribute('data-pool-index'), 10);
      var game = window.__game;
      var beforeDone = game.completedWords().length;   // 第 A3a 步:区分'correct'和整词完成
      var res = game.input(index);
      render(game, script);
      // 第 A3a 步:音效(通关那次只播 'win',由 checkWin→celebrate 负责,这里不播)
      if (res.result === 'wrong') playSound('wrong');
      if (res.result === 'correct' && !game.isComplete()) {
        if (game.completedWords().length > beforeDone) playSound('word');
        else playSound('correct');
      }
      // 错字:渲染完后给对应候选字加 shake,动画结束(animationend)移除
      if (res.result === 'wrong') {
        var bad = document.querySelector('.pool-tile[data-pool-index="' + index + '"]');
        if (bad) {
          bad.addEventListener('animationend', function () {
            bad.classList.remove('shake');
          }, { once: true });
          bad.classList.add('shake');
        }
      }
      // 填入成功后检查通关(先 render 再检查)
      if (res.result === 'correct') checkWin();
    });

    // 提示按钮(提示费见 hintCostNow,府邸藏书阁可降价;免费提示优先):判断全走 game.hint(),ui 只扣币和提示
    document.getElementById('btn-hint').addEventListener('click', function () {
      var game = window.__game;
      var free = estate.freeHints > 0;
      var cost = hintCostNow();
      if (!free && coins < cost) { showToast('金币不足'); return; }   // 不扣币,什么都不填
      var h = game.hint();
      if (h === null) return;                                         // 没有空格可填:不扣币、不用免费次数
      if (free) { ESTATE.useFreeHint(estate); saveProgress(); showToast('使用了一次免费提示'); }
      else { coins -= cost; }
      playSound('hint');                                 // 第 A3a 步:扣币成功后播提示音
      render(game, script);
      save();                                              // 金币变化后存档
      checkWin();                                          // 提示填入后也要检查通关
    });

    // 释义按钮(30 金币):找包含选中格的成语(遍历 level.words 看 cells)
    document.getElementById('btn-meaning').addEventListener('click', function () {
      var game = window.__game;
      var sel = game.state.selected;
      if (!sel) { showToast('请先选中一个空格'); return; } // 不扣币
      var mcost = meaningCostNow();
      if (coins < mcost) { showToast('金币不足'); return; }   // 不扣币
      var words = [];
      game.level.words.forEach(function (w) {
        for (var i = 0; i < w.cells.length; i++) {
          if (w.cells[i][0] === sel.r && w.cells[i][1] === sel.c) { words.push(w); break; }
        }
      });
      coins -= mcost;
      render(game, script);
      save();                                              // 金币变化后存档
      openMeaningModal(words);
    });

    // 释义弹窗:点遮罩(空白处)关闭;关闭按钮在 openMeaningModal 里绑
    document.getElementById('meaning-overlay').addEventListener('click', function (e) {
      if (e.target === this) closeMeaningModal();
    });
    // 通关弹窗:不绑遮罩 click —— 只能点"下一关"按钮关闭

    // 设置(第 5a 步):按钮打开面板;点遮罩(空白处)关闭;面板内按钮在重建时绑
    document.getElementById('btn-settings').addEventListener('click', openSettingsPanel);
    document.getElementById('settings-overlay').addEventListener('click', function (e) {
      if (e.target === this) closeSettingsPanel();
    });

    // ---------- 第 5b 步:主界面 / 选关页 / 游戏顶栏返回 ----------
    // 主界面按钮:内容每次重绘,事件委托绑在固定容器 #home 上(只绑一次,重绘不丢事件)。
    document.getElementById('home').addEventListener('click', function (e) {
      var btn = e.target.closest('.home-btn');
      if (!btn) return;
      if (btn.classList.contains('home-bonus')) { var bl2 = bonusAvailable(); if (bl2.length) startBonus(bl2[0]); return; }
      if (btn.querySelector('.home-btn-sub')) { showScreen('game'); return; }  // 继续游戏
      if (btn.textContent === '选关') { showScreen('levels'); return; }
      if (btn.textContent === '签到') { openCheckinPanel(); return; }
      if (btn.textContent === '府邸') { showScreen('estate'); return; }
      openSettingsPanel();                                                      // 设置
    });

    // 选关页:事件委托绑在网格容器 #level-grid 上(只绑一次);未解锁格子点击无反应(不弹提示)。
    document.getElementById('level-grid').addEventListener('click', function (e) {
      var tile = e.target.closest('.level-tile');
      if (!tile) return;
      var index = parseInt(tile.getAttribute('data-level-index'), 10);
      if (!unlockAll && index > unlocked) return;       // 第 E2 步:未解锁(且开关关):无反应
      gotoLevel(index);
      showScreen('game');
    });
    document.getElementById('btn-levels-back').addEventListener('click', function () {
      showScreen('home');
    });

    // 游戏界面顶栏返回按钮(第 5b 步):回主界面;元素固定,只绑一次
    document.getElementById('btn-back').addEventListener('click', function () {
      showScreen('home');
    });
  }

  // ---------- 玩家档案数据层(第 E1a-1 步) ----------
  var PROFILES_KEY = 'chengyu-tiantian-profiles';
  var ACTIVE_KEY = 'chengyu-tiantian-active';
  var currentProfileId = null;

  // 经典 cyrb53 哈希(种子 0),返回数字。
  function cyrb53(str, seed) {
    seed = seed | 0;
    var h1 = 0xdeadbeef ^ seed, h2 = 0x41c6be57 ^ seed;
    for (var i = 0; i < str.length; i++) {
      var ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
  }
  function hashPin(salt, pin) { return cyrb53(salt + ':' + pin, 0).toString(16); }

  // 8 位随机字母数字串。
  function genSalt() {
    var cs = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    var s = '';
    for (var i = 0; i < 8; i++) s += cs[Math.floor(Math.random() * cs.length)];
    return s;
  }
  function genProfileId() {
    return 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  // 读注册表并校验:整体必须是对象且 list 是数组;逐项要求 id/name/salt/hash
  // 都是非空字符串,不合格的项过滤掉;坏数据或读不到都返回 { list: [] }。
  function loadProfiles() {
    try {
      var raw = localStorage.getItem(PROFILES_KEY);
      if (!raw) return { list: [] };
      var o = JSON.parse(raw);
      if (!o || typeof o !== 'object' || !Array.isArray(o.list)) return { list: [] };
      var ok = o.list.filter(function (p) {
        return p && typeof p === 'object' &&
          typeof p.id === 'string' && p.id !== '' &&
          typeof p.name === 'string' && p.name !== '' &&
          typeof p.salt === 'string' && p.salt !== '' &&
          typeof p.hash === 'string' && p.hash !== '';
      });
      return { list: ok };
    } catch (e) { return { list: [] }; }
  }

  function saveProfiles(reg) {
    try { localStorage.setItem(PROFILES_KEY, JSON.stringify(reg)); } catch (e) {}
  }

  // 档案 id 为 X 时四个键变成 'chengyu-tiantian:X' 等;id==='legacy' 时保持无后缀原名。
  function profileKeyNames(id) {
    if (id === 'legacy') {
      return {
        save: 'chengyu-tiantian',
        checkin: 'chengyu-tiantian-checkin',
        progress: 'chengyu-tiantian-progress',
        vocab: 'chengyu-tiantian-vocab'
      };
    }
    return {
      save: 'chengyu-tiantian:' + id,
      checkin: 'chengyu-tiantian-checkin:' + id,
      progress: 'chengyu-tiantian-progress:' + id,
      vocab: 'chengyu-tiantian-vocab:' + id
    };
  }

  function applyProfileKeys(id) {
    var k = profileKeyNames(id);
    SAVE_KEY = k.save;
    CHECKIN_KEY = k.checkin;
    PROGRESS_KEY = k.progress;
    VOCAB_KEY = k.vocab;
    currentProfileId = id;
  }

  function legacyDataExists() {
    try { return localStorage.getItem('chengyu-tiantian') !== null; } catch (e) { return false; }
  }

  // 把无后缀的四个旧键里【存在的】值复制到该档案的带后缀键;全部复制成功后才
  // 删除无后缀旧键(任何一步异常就不删除,旧数据保留);返回 true/false。
  function migrateLegacyTo(id) {
    if (id === 'legacy') return false;
    var oldKeys = ['chengyu-tiantian', 'chengyu-tiantian-checkin', 'chengyu-tiantian-progress', 'chengyu-tiantian-vocab'];
    var newKeys = profileKeyNames(id);
    var names = ['save', 'checkin', 'progress', 'vocab'];
    try {
      var copied = [];
      for (var i = 0; i < oldKeys.length; i++) {
        var raw = localStorage.getItem(oldKeys[i]);
        if (raw === null) continue;                        // 不存在的旧键:跳过
        localStorage.setItem(newKeys[names[i]], raw);
        copied.push(i);
      }
      for (var j = 0; j < copied.length; j++) {
        localStorage.removeItem(oldKeys[copied[j]]);
      }
      return true;
    } catch (e) { return false; }                         // 异常:不删除,旧数据保留
  }

  function verifyPin(profile, pin) {
    return /^\d{4}$/.test(pin) && hashPin(profile.salt, pin) === profile.hash;
  }

  // 第 E1b 步:当前玩家名字。无档案(null)或兼容模式('legacy')返回 ''。
  function currentProfileName() {
    if (!currentProfileId || currentProfileId === 'legacy') return '';
    var list = loadProfiles().list;
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === currentProfileId) return list[i].name;
    }
    return '';
  }

  // 校验:name 去首尾空格后长度 1~8;不能重名;pin 必须 4 位数字。
  // 合格:生成 id/salt/hash,push 进注册表并保存,返回 { ok:true, profile:{id,name} }
  // (返回值不带 salt/hash)。
  function createProfile(name, pin) {
    var n = (typeof name === 'string') ? name.trim() : '';
    if (n.length < 1 || n.length > 8) return { ok: false, error: '请输入名字' };
    var reg = loadProfiles();
    for (var i = 0; i < reg.list.length; i++) {
      if (reg.list[i].name === n) return { ok: false, error: '名字已被使用' };
    }
    if (!/^\d{4}$/.test(typeof pin === 'string' ? pin : '')) return { ok: false, error: 'PIN 要是 4 位数字' };
    var id = genProfileId();
    var salt = genSalt();
    var entry = { id: id, name: n, salt: salt, hash: hashPin(salt, pin) };
    reg.list.push(entry);
    saveProfiles(reg);
    return { ok: true, profile: { id: id, name: n } };
  }

  // 删除该档案的四个存档键(id==='legacy' 时不做任何事返回 false),从注册表移除
  // 并保存;ACTIVE_KEY 等于该 id 也一并删除;返回 true。
  function deleteProfileData(id) {
    if (id === 'legacy') return false;
    var k = profileKeyNames(id);
    try {
      localStorage.removeItem(k.save);
      localStorage.removeItem(k.checkin);
      localStorage.removeItem(k.progress);
      localStorage.removeItem(k.vocab);
      var reg = loadProfiles();
      reg.list = reg.list.filter(function (p) { return p.id !== id; });
      saveProfiles(reg);
      try { if (localStorage.getItem(ACTIVE_KEY) === id) localStorage.removeItem(ACTIVE_KEY); } catch (e2) {}
      return true;
    } catch (e) { return false; }
  }

  // 测试钩子(挂在 window 上)
  window.__profiles = function () { return loadProfiles().list.map(function (p) { return p.name; }); };
  window.__profileApi = {
    create: createProfile,
    verify: function (name, pin) {
      var p = loadProfiles().list.filter(function (x) { return x.name === name; })[0];
      return !!p && verifyPin(p, pin);
    },
    apply: applyProfileKeys,
    migrate: migrateLegacyTo,
    legacyExists: legacyDataExists,
    remove: deleteProfileData,
    keys: profileKeyNames,
    current: function () { return currentProfileId; },
    reset: function () { resetProgress(); }
  };

  // 第 E2 步:重置当前档案的全部进度:四个键(SAVE/CHECKIN/PROGRESS/VOCAB)全部
  // removeItem,内存同步回默认值(金币 100、第 1 关、unlocked=0、cleared/vocab 清空、
  // rewarded 清零、pendingPromo 置空、prevFilled/prevDone 清空、开关关、音效开关不动);
  // 注册表与 ACTIVE_KEY 不动(玩家和 PIN 保留)。重置后重建游戏并 render + save。
  function resetProgress() {
    try {
      localStorage.removeItem(SAVE_KEY);
      localStorage.removeItem(CHECKIN_KEY);
      localStorage.removeItem(PROGRESS_KEY);
      localStorage.removeItem(VOCAB_KEY);
    } catch (e) { /* 写失败:内存照常重置 */ }
    coins = DEFAULT_COINS;
    currentIndex = DEFAULT_LEVEL;
    unlocked = 0;
    unlockAll = false;
    rewarded = false;
    bonusRank = null; bonusPrevGame = null;
    pendingPromo = '';
    prevFilled = {};
    prevDone = {};
    cleared = [];
    bonusClaimed = [];
    estate = ESTATE.newState();
    vocab = [];
    if (window.__game) {                                       // start() 之前调用时没有游戏实例
      window.__game = Game.createGame(levels[currentIndex]);
      render(window.__game, script);
    }
    save();                                                    // 写回默认档(含 unlockAll:false)
    var homeEl = document.getElementById('home');
    if (homeEl && !homeEl.hidden) renderHome();                // 首页可见时刷新(金币/第 N 关/功名条)
  }

  // ---------- 玩家档案界面(第 E1a-2 步) ----------
  function enterProfile(id, onDone) {
    if (id !== 'legacy') {
      try { localStorage.setItem(ACTIVE_KEY, id); } catch (e) {}
    }
    applyProfileKeys(id);
    var old = document.getElementById('profile-gate');
    if (old && old.parentNode) old.parentNode.removeChild(old);
    if (typeof onDone === 'function') onDone();
  }

  function showProfileGate(onDone, startProfileId) {
    var old = document.getElementById('profile-gate');
    if (old && old.parentNode) old.parentNode.removeChild(old);
    var gate = el('div');
    gate.id = 'profile-gate';
    document.body.appendChild(gate);

    function findProfile(id) {
      var list = loadProfiles().list;
      for (var i = 0; i < list.length; i++) {
        if (list[i].id === id) return list[i];
      }
      return null;
    }

    // 视图 A「选择档案」
    function renderPick() {
      gate.textContent = '';
      var t = el('div', 'pg-title');
      t.textContent = '成语填填';
      gate.appendChild(t);
      var sub = el('div', 'pg-sub');
      sub.textContent = '选择玩家';
      gate.appendChild(sub);
      var list = loadProfiles().list;
      for (var i = 0; i < list.length; i++) {
        (function (profile) {
          var b = el('button', 'pg-btn pg-profile');
          b.type = 'button';
          b.textContent = profile.name;
          b.addEventListener('click', function () { renderPin(profile); });
          gate.appendChild(b);
        })(list[i]);
      }
      var nb = el('button', 'pg-btn pg-new');
      nb.type = 'button';
      nb.textContent = '新建档案';
      nb.addEventListener('click', function () { renderCreate(); });
      gate.appendChild(nb);
    }

    // 视图 B「输入 PIN」
    function renderPin(profile) {
      gate.textContent = '';
      var t = el('div', 'pg-title');
      t.textContent = '成语填填';
      gate.appendChild(t);
      var sub = el('div', 'pg-sub');
      sub.textContent = '欢迎回来,' + profile.name;
      gate.appendChild(sub);
      var input = el('input', 'pg-input');
      input.id = 'pg-pin';
      input.type = 'password';
      input.inputMode = 'numeric';
      input.pattern = '[0-9]*';
      input.maxLength = 4;
      input.autocomplete = 'off';
      input.placeholder = '请输入 4 位 PIN';
      gate.appendChild(input);
      var err = el('div', 'pg-error');
      gate.appendChild(err);
      var ok = el('button', 'pg-btn pg-ok');
      ok.type = 'button';
      ok.textContent = '确定';
      var back = el('button', 'pg-btn pg-back');
      back.type = 'button';
      back.textContent = '返回';
      back.addEventListener('click', function () { renderPick(); });
      gate.appendChild(ok);
      gate.appendChild(back);

      function submit() {
        var v = input.value;
        if (!/^\d{4}$/.test(v)) { err.textContent = '请输入 4 位数字'; return; }
        if (!verifyPin(profile, v)) {
          err.textContent = 'PIN 不正确';
          input.value = '';
          try { input.focus(); } catch (e) {}
          return;
        }
        enterProfile(profile.id, onDone);
      }
      ok.addEventListener('click', submit);
      input.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter') submit();
      });
      try { input.focus(); } catch (e) {}
    }

    // 视图 C「新建档案」
    function renderCreate() {
      gate.textContent = '';
      var t = el('div', 'pg-title');
      t.textContent = '成语填填';
      gate.appendChild(t);
      var sub = el('div', 'pg-sub');
      sub.textContent = '新建档案';
      gate.appendChild(sub);
      var reg = loadProfiles();
      if (reg.list.length === 0 && legacyDataExists()) {
        var note = el('div', 'pg-note');
        note.textContent = '检测到已有的游戏进度,会保留到这个档案里。';
        gate.appendChild(note);
      }
      var nameIn = el('input', 'pg-input');
      nameIn.id = 'pg-name';
      nameIn.type = 'text';
      nameIn.maxLength = 8;
      nameIn.placeholder = '名字(1~8 个字)';
      gate.appendChild(nameIn);
      var pin1 = el('input', 'pg-input');
      pin1.id = 'pg-pin1';
      pin1.type = 'password';
      pin1.inputMode = 'numeric';
      pin1.pattern = '[0-9]*';
      pin1.maxLength = 4;
      pin1.autocomplete = 'off';
      pin1.placeholder = '4 位数字 PIN';
      gate.appendChild(pin1);
      var pin2 = el('input', 'pg-input');
      pin2.id = 'pg-pin2';
      pin2.type = 'password';
      pin2.inputMode = 'numeric';
      pin2.pattern = '[0-9]*';
      pin2.maxLength = 4;
      pin2.autocomplete = 'off';
      pin2.placeholder = '再输入一次';
      gate.appendChild(pin2);
      var err = el('div', 'pg-error');
      gate.appendChild(err);
      var ok = el('button', 'pg-btn pg-ok');
      ok.type = 'button';
      ok.textContent = '创建';
      gate.appendChild(ok);
      if (reg.list.length > 0) {
        var back = el('button', 'pg-btn pg-back');
        back.type = 'button';
        back.textContent = '返回';
        back.addEventListener('click', function () { renderPick(); });
        gate.appendChild(back);
      }

      function submit() {
        var n = nameIn.value.trim();
        if (n.length > 8) { err.textContent = '名字最多 8 个字'; return; }
        if (!/^\d{4}$/.test(pin1.value)) { err.textContent = 'PIN 要是 4 位数字'; return; }
        if (pin1.value !== pin2.value) { err.textContent = '两次 PIN 不一致'; return; }
        var isFirst = loadProfiles().list.length === 0;
        var hasLegacy = legacyDataExists();
        var res = createProfile(n, pin1.value);
        if (!res.ok) { err.textContent = res.error; return; }
        if (isFirst && hasLegacy) migrateLegacyTo(res.profile.id);
        enterProfile(res.profile.id, onDone);
      }
      ok.addEventListener('click', submit);
      nameIn.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') submit(); });
      pin1.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') submit(); });
      pin2.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') submit(); });
    }

    var startProfile = startProfileId ? findProfile(startProfileId) : null;
    if (startProfile) {
      renderPin(startProfile);
    } else if (loadProfiles().list.length > 0) {
      renderPick();
    } else {
      renderCreate();
    }
  }

  window.__showProfileGate = showProfileGate;

  // ---------- 启动接入玩家档案(第 E1a-3 步) ----------
  function ensureProfile(onReady) {
    var active = null;
    try { active = localStorage.getItem(ACTIVE_KEY); } catch (e) {}
    if (active === 'legacy') {          // 兼容/测试模式:不显示登录界面
      applyProfileKeys('legacy');
      onReady();
      return;
    }
    if (active) {
      var list = loadProfiles().list;
      for (var i = 0; i < list.length; i++) {
        if (list[i].id === active) {    // 直接进入该档案的 PIN 输入(每次打开都要输 PIN)
          showProfileGate(onReady, active);
          return;
        }
      }
    }
    showProfileGate(onReady);
  }

  function start() {
    fetch('data/levels.json')
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (json) {
        levels = Game.loadLevels(json);           // 提到外层变量(第 4c 步规则 2)
        bonusLevels = (json && Array.isArray(json.bonus)) ? Game.loadLevels({ levels: json.bonus }) : [];   // 第 H 步:专用奖励关
        ensureProfile(function () {
        var saved = load();                       // 启动先读存档
        cleared = loadProgress();                 // 第 C1 步:通关记录(levels 已加载,可安全读/迁移)
        vocab = loadVocab();                        // 第 D1 步:成语册(cleared 已加载,可安全读/迁移)
        currentIndex = saved.level;
        coins = saved.coins;
        script = saved.script;                    // 读存档里的 's'/'t'(第 5a 步起可切换)
        unlocked = saved.unlocked;                // 第 5b 步:读存档里的 unlocked(load() 已校验/抬高)
        unlockAll = saved.unlockAll;                // 第 E2 步:读回开关状态(load() 已校验,非布尔一律 false)
        // 修复:旧版"解锁全部"会把真实进度 unlocked 永久抬到最后一关,导致开关"关"了仍全开。
        // 真实进度 = 连续通关前缀(从第 1 关起连续已通关的关数,即下一个待玩关的序号);
        // 取 max(前缀, 存档当前关) 为上限,通关记录损坏时也不会把玩家退回到当前关以下。
        var prefix = 0;
        while (cleared.indexOf(prefix) !== -1) prefix++;
        unlocked = Math.min(unlocked, Math.min(levels.length - 1, Math.max(prefix, saved.level)));
        window.__game = Game.createGame(levels[currentIndex]);
        render(window.__game, script);
        bindOnce();          // 事件只绑一次(#board / #pool / 三个按钮 / 弹窗遮罩)
        window.__render = render;   // 第 4 步复用:render(game, 's'/'t')
        window.__getCoins = function () { return coins; };
        window.__setCoins = function (n) { coins = n; render(window.__game, script); };
        window.__goto = gotoLevel;                // 第 4c 步新增:跳到第 i 关(0 开始)
        // 第 5a 步:切换简繁(供审查用)。切换后 save + render;若设置面板正开着,
        // 重建一次以刷新"简体/繁體"的 active 态(面板不关闭,背后格子同步变化)。
        window.__setScript = function (s) {
          script = s;
          save();
          render(window.__game, script);
          if (!document.getElementById('settings-overlay').hidden) openSettingsPanel();
        };
        // 第 5b 步:三界面切换 + 解锁状态(供审查用)。数据加载完成后先进主界面。
        window.__showScreen = showScreen;
        window.__getUnlocked = function () { return unlocked; };
        window.__getUnlockAll = function () { return unlockAll; };      // 第 E2 步:测试钩子
        // 第 7a 步:窗口尺寸/横竖屏变化时重算 --cell(只绑一次);
        // 隐藏状态(#app 有 hidden)下测不到高度,故只在游戏界面可见时调用。
        function refit() {
          if (window.__game && !document.getElementById('app').hasAttribute('hidden')) {
            fitBoard(window.__game);
          }
        }
        window.addEventListener('resize', refit);
        window.addEventListener('orientationchange', refit);
        showScreen('home');
        });
      })
      .catch(function () {
        showError('关卡读取失败,请用 python -m http.server 8000 打开');
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
