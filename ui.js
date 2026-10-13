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
  function playSound(name) {
    window.__sfxLog.push(name);
    if (window.__sfxLog.length > 60) window.__sfxLog.shift();
    if (!soundOn) return;
    try {
      if (name === 'select')       { tone(880, 0, 0.05, 'sine', 0.08); }
      else if (name === 'correct') { tone(660, 0, 0.09, 'triangle', 0.12); tone(990, 0.09, 0.12, 'triangle', 0.12); }
      else if (name === 'wrong')   { tone(170, 0, 0.18, 'sawtooth', 0.07); tone(125, 0.1, 0.2, 'sawtooth', 0.07); }
      else if (name === 'word')    { tone(523, 0, 0.12, 'triangle', 0.13); tone(659, 0.11, 0.12, 'triangle', 0.13); tone(784, 0.22, 0.2, 'triangle', 0.13); }
      else if (name === 'hint')    { tone(1200, 0, 0.08, 'sine', 0.09); tone(1600, 0.08, 0.12, 'sine', 0.09); }
      else if (name === 'win')     { tone(523, 0, 0.14, 'triangle', 0.14); tone(659, 0.13, 0.14, 'triangle', 0.14); tone(784, 0.26, 0.14, 'triangle', 0.14); tone(1047, 0.39, 0.4, 'triangle', 0.15); }
    } catch (e) { /* 忽略 */ }
  }
  window.__setSound = setSoundOn;
  window.__getSound = function () { return soundOn; };

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
    { min: 100, name: '状元' }
  ];
  var HOUSES = [
    { min: 0, name: '草屋' },
    { min: 5, name: '泥屋' },
    { min: 25, name: '木屋' },
    { min: 60, name: '大木屋' },
    { min: 100, name: '书院' }
  ];

  var cleared = [];   // 已通关关卡序号的数组(不重复的整数,按从小到大排序)

  // 从存档读通关记录。迁移:PROGRESS_KEY 不存在(老玩家)时,用主存档的当前关序号
  // level 生成 [0,1,...,level-1] 并立即写回;PROGRESS_KEY 存在但坏了(解析失败/
  // 不是对象)则返回 [],不迁移。调用前提:levels 已加载(见 start() 里 load() 之后)。
  function loadProgress() {
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
      return out.slice();
    } catch (e) { return []; }                            // 坏了:空记录,不迁移
  }

  function saveProgress() {
    try { localStorage.setItem(PROGRESS_KEY, JSON.stringify({ cleared: cleared })); } catch (e) {}
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

  window.__markCleared = markCleared;
  window.__rankInfo = rankInfo;
  window.__houseInfo = houseInfo;

  // ---------- 存档(SPEC 第 6 节):所有读写包 try/catch,坏数据回默认值 ----------
  // levelOverride(第 5a 步):checkWin 发奖后传入"下一关"序号(最后一关传 0),
  // 这样通关后未点"下一关"就刷新也不会重复领奖励;不传则用 currentIndex。
  function save(levelOverride) {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({
        level: (typeof levelOverride === 'number') ? levelOverride : currentIndex,
        coins: coins,
        script: script,
        unlocked: unlocked                        // 第 5b 步:存档增加 unlocked 字段
      }));
    } catch (e) { /* 读写失败:忽略 */ }
  }

  function load() {
    var s = { level: DEFAULT_LEVEL, coins: DEFAULT_COINS, script: DEFAULT_SCRIPT, unlocked: 0 };
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
          }
        }
      }
    } catch (e) { /* 读不到 / 解析失败:用默认值 */ }
    // 第 5b 步:保证当前关一定已解锁 —— level 大于 unlocked 时把 unlocked 抬到 level
    if (s.level > s.unlocked) s.unlocked = s.level;
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
    document.getElementById('level-title').textContent = '第 ' + level.id + ' 关';
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
    document.getElementById('btn-hint').classList.toggle('disabled', coins < 60);
    document.getElementById('btn-meaning').classList.toggle('disabled', coins < 30);

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
  function openWinModal(reward) {
    var panel = document.getElementById('win-panel');
    panel.textContent = '';                     // 每次重建内容

    var h = el('div', 'win-title');
    h.textContent = '通关!';
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
    gain.textContent = '获得 ' + reward + ' 金币';
    panel.appendChild(gain);

    var last = currentIndex >= levels.length - 1;   // 最后一关:按钮变"重新开始"
    var btn = el('button', 'meaning-close');        // 复用关闭按钮样式
    btn.type = 'button';
    btn.textContent = last ? '重新开始' : '下一关';
    btn.addEventListener('click', function () {     // 每次重建,绑在当前按钮上,无重复问题
      closeWinModal();
      gotoLevel(last ? 0 : currentIndex + 1);       // 重新开始时 unlocked 保持不变(第 5b 步)
    });
    panel.appendChild(btn);

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
        if (soundOn) playSound('correct');                     // 开启时试听;关闭时不播放
      });
      if (pair[0] === 'on') onBtn = b; else offBtn = b;
      soundRow.appendChild(b);
    });
    panel.appendChild(soundRow);

    // 第 7b 步:解锁全部关卡按钮(独立一行,事件直接绑在按钮上,同字体按钮做法)
    var unlockRow = el('div', 'settings-row');
    var unlockBtn = el('button', 'unlock-all-btn');
    unlockBtn.type = 'button';
    if (unlocked >= levels.length - 1) {         // 面板每次重建:创建时直接判断已全解锁
      unlockBtn.disabled = true;
      unlockBtn.textContent = '已全部解锁';
    } else {
      unlockBtn.textContent = '解锁全部关卡';
      unlockBtn.addEventListener('click', function () {
        unlocked = levels.length - 1;            // 全部可点
        save();                                  // 存档(不动 currentIndex/coins/script)
        showToast('已解锁全部关卡');
        unlockBtn.disabled = true;               // 变禁用,不可再点
        unlockBtn.textContent = '已全部解锁';
      });
    }
    unlockRow.appendChild(unlockBtn);
    panel.appendChild(unlockRow);

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
          playSound('word');
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
    box.innerHTML = (window.HOUSE_SVG && window.HOUSE_SVG[hi]) || '';
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
      if (window.GUESTS[i].need <= c) out.push(window.GUESTS[i]);
    }
    return out;
  }

  function openGuestsPanel() {
    var panel = document.getElementById('settings-panel');
    panel.textContent = '';

    var h = el('div', 'win-title');
    h.textContent = '宾客';
    panel.appendChild(h);

    var all = window.GUESTS || [];
    var unlockedSet = guestsUnlocked();

    var cnt = el('div', 'guest-count');
    cnt.textContent = '已结识 ' + unlockedSet.length + ' / ' + all.length + ' 位';
    panel.appendChild(cnt);

    var grid = el('div', 'guest-grid');
    for (var i = 0; i < all.length; i++) {
      var g = all[i];
      var isUnlocked = g.need <= rankInfo().count;
      var card = el('div', 'guest-card' + (isUnlocked ? ' unlocked' : ' locked'));
      var fig = el('div', 'guest-figure');
      fig.innerHTML = g.svg;                     // 静态代码,非用户输入,可用 innerHTML
      card.appendChild(fig);
      var name = el('div', 'guest-name');
      name.textContent = isUnlocked ? g.name : '???';
      card.appendChild(name);
      var desc = el('div', 'guest-desc');
      desc.textContent = isUnlocked ? g.desc : ('通关 ' + g.need + ' 关后来访');
      card.appendChild(desc);
      grid.appendChild(card);
    }
    panel.appendChild(grid);

    var back = el('button', 'meaning-close');  // 复用关闭按钮样式
    back.type = 'button';
    back.textContent = '返回';
    back.addEventListener('click', openProgressPanel);   // 每次重建,绑在当前按钮上
    panel.appendChild(back);

    document.getElementById('settings-overlay').hidden = false;
  }
  window.__openGuests = openGuestsPanel;
  window.__guestsUnlocked = function () { return guestsUnlocked().map(function (g) { return g.name; }); };

  // 第 A2b 步:通关庆祝(撒花 + 金币滚动 + 飘字 + 延迟弹窗)
  function celebrate(reward, oldCoins) {
    playSound('win');                                    // 第 A3a 步:通关音效(声音不属于视觉动效,放 reduce 判断之前)
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
    var reward = 20;                              // SPEC 第 3 节第 8 条:基础 20
    if (game.state.errors === 0) reward += 10;    // 本关零错额外 +10
    var oldCoins = coins;
    coins += reward;
    // 第 5b 步:通关解锁下一关(不超过最后一关);重新开始(最后一关通关回第 1 关)时不重置
    unlocked = Math.min(Math.max(unlocked, currentIndex + 1), levels.length - 1);
    // 第 A2b 步:不整盘重画(否则最后一格弹跳动画被抹掉),只更新金币相关 UI
    document.getElementById('btn-hint').classList.toggle('disabled', coins < 60);
    document.getElementById('btn-meaning').classList.toggle('disabled', coins < 30);
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
    if (newGuests > oldGuests) promoParts.push('宾客来访:' + guestsUnlocked()[newGuests - 1].name);  // 第 D2 步:一次通关最多新解锁一位
    pendingPromo = promoParts.join(' · ');
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
      if (i > unlocked) tile.classList.add('locked');     // 未解锁:灰底淡字,点击无反应
      else if (i === currentIndex) tile.classList.add('current');   // 当前关:朱红边框
      grid.appendChild(tile);
    });
  }

  // showScreen('home' | 'levels' | 'game'):切换三个容器的 hidden;home/levels 每次进入重绘。
  function showScreen(name) {
    document.getElementById('home').hidden = (name !== 'home');
    document.getElementById('level-select').hidden = (name !== 'levels');
    document.getElementById('app').hidden = (name !== 'game');
    if (name === 'home') renderHome();
    if (name === 'levels') renderLevels();
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

    // 提示按钮(60 金币):判断全走 game.hint(),ui 只扣币和提示
    document.getElementById('btn-hint').addEventListener('click', function () {
      var game = window.__game;
      if (coins < 60) { showToast('金币不足'); return; }   // 不扣币,什么都不填
      var h = game.hint();
      if (h === null) return;                              // 没有空格可填:不扣币
      coins -= 60;
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
      if (coins < 30) { showToast('金币不足'); return; }   // 不扣币
      var words = [];
      game.level.words.forEach(function (w) {
        for (var i = 0; i < w.cells.length; i++) {
          if (w.cells[i][0] === sel.r && w.cells[i][1] === sel.c) { words.push(w); break; }
        }
      });
      coins -= 30;
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
      if (btn.querySelector('.home-btn-sub')) { showScreen('game'); return; }  // 继续游戏
      if (btn.textContent === '选关') { showScreen('levels'); return; }
      if (btn.textContent === '签到') { openCheckinPanel(); return; }
      openSettingsPanel();                                                      // 设置
    });

    // 选关页:事件委托绑在网格容器 #level-grid 上(只绑一次);未解锁格子点击无反应(不弹提示)。
    document.getElementById('level-grid').addEventListener('click', function (e) {
      var tile = e.target.closest('.level-tile');
      if (!tile) return;
      var index = parseInt(tile.getAttribute('data-level-index'), 10);
      if (index > unlocked) return;                     // 未解锁:无反应
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

  function start() {
    fetch('data/levels.json')
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (json) {
        levels = Game.loadLevels(json);           // 提到外层变量(第 4c 步规则 2)
        var saved = load();                       // 启动先读存档
        cleared = loadProgress();                 // 第 C1 步:通关记录(levels 已加载,可安全读/迁移)
        vocab = loadVocab();                        // 第 D1 步:成语册(cleared 已加载,可安全读/迁移)
        currentIndex = saved.level;
        coins = saved.coins;
        script = saved.script;                    // 读存档里的 's'/'t'(第 5a 步起可切换)
        unlocked = saved.unlocked;                // 第 5b 步:读存档里的 unlocked(load() 已校验/抬高)
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
