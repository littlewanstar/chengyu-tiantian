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

  // render(game, script):全量重绘顶栏、格子区、候选字区、按钮灰态。
  // script 传 's'/'t'(第 5a 步起可切换);第 4 步起会反复调用,故每次先清空再重建。
  function render(game, script) {
    var level = game.level;

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
    document.getElementById('app').style.setProperty('--cell', 'min(64px, calc((100vw - 48px) / ' + level.cols + '))');

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

    var close = el('button', 'meaning-close');  // 复用关闭按钮样式
    close.type = 'button';
    close.textContent = '关闭';
    close.addEventListener('click', closeSettingsPanel);   // 每次重建,绑在当前按钮上
    panel.appendChild(close);

    document.getElementById('settings-overlay').hidden = false;
  }

  function closeSettingsPanel() {
    document.getElementById('settings-overlay').hidden = true;
  }

  // 通关检查:每次"填入成功"之后、render 之后调用。奖励只发一次(rewarded 防重复)。
  function checkWin() {
    var game = window.__game;
    if (!game.isComplete()) return;
    if (rewarded) return;
    rewarded = true;
    var reward = 20;                              // SPEC 第 3 节第 8 条:基础 20
    if (game.state.errors === 0) reward += 10;    // 本关零错额外 +10
    coins += reward;
    // 第 5b 步:通关解锁下一关(不超过最后一关);重新开始(最后一关通关回第 1 关)时不重置
    unlocked = Math.min(Math.max(unlocked, currentIndex + 1), levels.length - 1);
    render(game, script);
    // 第 5a 步:发奖后存"下一关"序号(最后一关存 0),内存 currentIndex 不变;
    // 通关后未点"下一关"就刷新 → 进下一关,不会重复领奖励。
    save(currentIndex >= levels.length - 1 ? 0 : currentIndex + 1);
    openWinModal(reward);
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

    var h1 = el('div', 'home-title');
    h1.textContent = '成语填填';
    home.appendChild(h1);

    var coinRow = el('div', 'home-coins');      // 金币行:小黄圆点 + 金币数(与 coins 同步)
    coinRow.appendChild(el('span', 'coin-dot'));
    var num = el('span', 'home-coins-num');
    num.textContent = String(coins);
    coinRow.appendChild(num);
    home.appendChild(coinRow);

    var cont = el('button', 'home-btn');        // 继续游戏:主标题 + 小字"第 N 关"
    cont.type = 'button';
    var label = el('span', 'home-btn-label');
    label.textContent = '继续游戏';
    var sub = el('span', 'home-btn-sub');
    sub.textContent = '第 ' + levels[currentIndex].id + ' 关';   // N = 当前关卡 level.id
    cont.appendChild(label);
    cont.appendChild(sub);
    home.appendChild(cont);

    var pick = el('button', 'home-btn');        // 选关
    pick.type = 'button';
    pick.textContent = '选关';
    home.appendChild(pick);

    var set = el('button', 'home-btn');         // 设置:调用已有的 openSettingsPanel()
    set.type = 'button';
    set.textContent = '设置';
    home.appendChild(set);
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
      render(game, script);
    });

    document.getElementById('pool').addEventListener('click', function (e) {
      var tile = e.target.closest('.pool-tile');
      if (!tile) return;
      var index = parseInt(tile.getAttribute('data-pool-index'), 10);
      var game = window.__game;
      var res = game.input(index);
      render(game, script);
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
