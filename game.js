// 成语填填 — 纯游戏逻辑(不碰 DOM)。浏览器里挂到 window.Game,node 里用 module.exports。
// 数据格式见 SPEC.md;本文件不内置任何成语数据,一切来自 levels.json。

function loadLevels(json) {
  var data = json;
  if (typeof json === 'string') data = JSON.parse(json);
  if (!data || !Array.isArray(data.levels)) {
    throw new Error('levels.json: 缺少 levels 数组');
  }
  return data.levels.map(function (level) {
    // 浅拷贝关卡结构,不改动原始数据
    var copy = Object.assign({}, level);
    copy.cells = level.cells.map(function (cell) { return Object.assign({}, cell); });
    copy.words = level.words.map(function (w) {
      return Object.assign({}, w, { cells: w.cells.map(function (rc) { return [rc[0], rc[1]]; }) });
    });
    copy.pool = level.pool.map(function (p) { return Object.assign({}, p); });
    return copy;
  });
}

function createGame(level) {
  var cellMap = {};   // "r,c" -> cell 对象
  level.cells.forEach(function (cell) {
    cellMap[cell.r + ',' + cell.c] = cell;
  });

  var wordMap = {};   // word.id -> word 对象
  level.words.forEach(function (w) { wordMap[w.id] = w; });

  var wordsByCell = {}; // "r,c" -> [word, ...]
  level.words.forEach(function (w) {
    w.cells.forEach(function (rc) {
      var k = rc[0] + ',' + rc[1];
      (wordsByCell[k] = wordsByCell[k] || []).push(w);
    });
  });

  // 行优先的空格列表(按 level.cells 原始顺序,即生成器行优先顺序)
  var blankCells = level.cells.filter(function (c) { return c.blank === true; });

  var state = {
    selected: null,        // {r, c} | null
    errors: 0,
    usedPool: level.pool.map(function () { return false; }),
    filled: {}             // "r,c" -> 填入的字(简体)
  };

  function key(r, c) { return r + ',' + c; }

  function isBlank(r, c) {
    var cell = cellMap[key(r, c)];
    return !!cell && cell.blank === true;
  }

  function hasChar(r, c) {
    var cell = cellMap[key(r, c)];
    if (!cell) return false;
    return cell.blank !== true || Object.prototype.hasOwnProperty.call(state.filled, key(r, c));
  }

  // 行优先找该格之后的空格(跳过已有字的格子);之后没有则从头回绕
  function nextBlankRowMajor(fromR, fromC) {
    var wrapped = null;
    for (var i = 0; i < blankCells.length; i++) {
      var b = blankCells[i];
      if (hasChar(b.r, b.c)) continue;
      if (b.r > fromR || (b.r === fromR && b.c > fromC)) {
        return { r: b.r, c: b.c };
      }
      if (wrapped === null) wrapped = b; // 记录第一个仍为空的格(回绕用)
    }
    return wrapped ? { r: wrapped.r, c: wrapped.c } : null;
  }

  // 优先同一成语里该格之后的空格(按该成语格子顺序),否则行优先(含回绕)
  function nextBlankAfter(r, c) {
    var ws = wordsByCell[key(r, c)] || [];
    for (var w = 0; w < ws.length; w++) {
      var word = ws[w];
      for (var i = 0; i < word.cells.length; i++) {
        var rc = word.cells[i];
        if (rc[0] === r && rc[1] === c) {
          for (var j = i + 1; j < word.cells.length; j++) {
            var rc2 = word.cells[j];
            if (!hasChar(rc2[0], rc2[1])) return { r: rc2[0], c: rc2[1] };
          }
          break; // 本成语后面没有空格,继续看下一个交叉成语
        }
      }
    }
    return nextBlankRowMajor(r, c);
  }

  // 找池中未使用的、与选中格答案匹配的候选字下标
  function findPoolIndex(r, c) {
    var cell = cellMap[key(r, c)];
    for (var i = 0; i < level.pool.length; i++) {
      if (!state.usedPool[i] && level.pool[i].s === cell.s) return i;
    }
    return -1;
  }

  function select(r, c) {
    if (!isBlank(r, c) || hasChar(r, c)) return false;
    state.selected = { r: r, c: c };
    return true;
  }

  function input(poolIndex) {
    if (poolIndex < 0 || poolIndex >= level.pool.length || state.usedPool[poolIndex]) {
      return { result: 'ignored', cell: null };
    }
    var sel = state.selected;
    if (sel && hasChar(sel.r, sel.c)) sel = null; // 选中格已被填(如 hint 后) -> 重新自动选
    if (!sel) {
      sel = nextBlankRowMajor(-1, -1);
      if (!sel) return { result: 'ignored', cell: null };
      state.selected = { r: sel.r, c: sel.c };
    }
    var cell = cellMap[key(sel.r, sel.c)];
    var picked = level.pool[poolIndex];
    if (picked.s === cell.s) {
      state.filled[key(sel.r, sel.c)] = cell.s;
      state.usedPool[poolIndex] = true;
      var filledCell = { r: sel.r, c: sel.c };
      state.selected = nextBlankAfter(sel.r, sel.c);
      return { result: 'correct', cell: filledCell };
    }
    state.errors += 1;
    return { result: 'wrong', cell: { r: sel.r, c: sel.c } };
  }

  function hint() {
    var sel = state.selected;
    if (sel && hasChar(sel.r, sel.c)) sel = null; // 选中格已被填 -> 重新自动选
    if (!sel) {
      sel = nextBlankRowMajor(-1, -1);
      if (!sel) return null;
      state.selected = { r: sel.r, c: sel.c };
    }
    var cell = cellMap[key(sel.r, sel.c)];
    var idx = findPoolIndex(sel.r, sel.c);
    if (idx === -1) return null;
    state.filled[key(sel.r, sel.c)] = cell.s;
    state.usedPool[idx] = true;
    var out = { r: sel.r, c: sel.c, char: cell.s };
    state.selected = nextBlankAfter(sel.r, sel.c);
    return out;
  }

  function completedWords() {
    var ids = [];
    level.words.forEach(function (w) {
      var done = w.cells.every(function (rc) { return hasChar(rc[0], rc[1]); });
      if (done) ids.push(w.id);
    });
    return ids;
  }

  function isComplete() {
    return blankCells.every(function (b) { return hasChar(b.r, b.c); });
  }

  function display(r, c, script) {
    var cell = cellMap[key(r, c)];
    if (!cell) return null;
    var ch;
    if (cell.blank === true) {
      ch = state.filled[key(r, c)];
      if (ch === undefined) return null;
    } else {
      ch = cell.s;
    }
    if (script === 't') {
      // 空格填入的字:直接用该格的 t 字段(数据里 s/t 一一对应)
      ch = cell.t;
    }
    return ch;
  }

  return {
    level: level,
    state: state,
    select: select,
    input: input,
    hint: hint,
    completedWords: completedWords,
    isComplete: isComplete,
    display: display
  };
}

var Game = { loadLevels: loadLevels, createGame: createGame };

if (typeof window !== 'undefined') window.Game = Game;
if (typeof module !== 'undefined' && module.exports) module.exports = Game;
