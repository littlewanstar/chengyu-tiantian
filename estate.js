// 府邸经济(第 G3a 步,Claude 编写):数据 + 纯逻辑。不碰界面、不碰 localStorage、不碰 coins 变量。
// 用法:window.ESTATE(浏览器)或 require('./estate.js')(node 测试)。
// 状态对象 st(可 JSON 存档):
//   { annex:{id:等级1~3}, decor:[已购陈设 id], freeHints:n, hintsGranted:n, pondDay:'YYYY-MM-DD'|null, pondStock:n }
// 购买函数传入当前金币,返回 {ok, coins(扣款后), ...};失败时 coins 原样返回并带 reason。
(function (root) {
  var ELEGANCE_STEP = 20;      // 每攒满 20 点雅致度 → 1 次免费提示
  var MAX_LEVEL = 3;
  var POND_CAP_DAYS = 3;       // 池塘产出最多囤 3 天,不收获就停止累积
  var DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

  // 房产槽位,下标 = HOUSES 下标(草屋0 泥屋1 木屋2 大木屋3 书院4)
  var SLOTS = [
    { annex: 1, decor: 3 },
    { annex: 2, decor: 5 },
    { annex: 3, decor: 8 },
    { annex: 4, decor: 12 },
    { annex: 6, decor: 20 }
  ];

  // 附属建筑:tier = 需要的最低房产下标;costs[i] = 建成/升到第 i+1 级的价格;
  // elegance[i] = 达到第 i+1 级时该建筑贡献的雅致度(累计值,不是增量);
  // effect: pond 每日产出 / hint 提示费 / meaning 释义费 的各级数值。
  var ANNEX = [
    { id: 'well',    name: '水井',   tier: 0, costs: [50, 100, 200],  elegance: [2, 4, 6],   effect: null, desc: '一口老井,清冽甘甜。' },
    { id: 'woodshed',name: '柴房',   tier: 0, costs: [50, 100, 200],  elegance: [2, 4, 6],   effect: null, desc: '柴薪码得整整齐齐。' },
    { id: 'veggie',  name: '菜地',   tier: 0, costs: [50, 100, 200],  elegance: [2, 4, 6],   effect: null, desc: '几畦青菜,自给自足。' },
    { id: 'pond',    name: '池塘',   tier: 2, costs: [100, 200, 400], elegance: [3, 6, 9],   effect: { type: 'pond', values: [6, 12, 24] }, desc: '荷塘养鱼,每日产出金币(最多囤 3 天,需手动收获)。' },
    { id: 'stable',  name: '马厩',   tier: 2, costs: [100, 200, 400], elegance: [3, 6, 9],   effect: null, desc: '良驹一匹,出入有车马。' },
    { id: 'storage', name: '仓库',   tier: 2, costs: [100, 200, 400], elegance: [3, 6, 9],   effect: null, desc: '粮帛满仓,家业殷实。' },
    { id: 'pavilion',name: '凉亭',   tier: 3, costs: [160, 320, 640], elegance: [4, 8, 12],  effect: null, desc: '临水而建,可对弈、可听雨。' },
    { id: 'orchard', name: '果园',   tier: 3, costs: [160, 320, 640], elegance: [4, 8, 12],  effect: null, desc: '桃李成蹊,四时有果。' },
    { id: 'workshop',name: '工坊',   tier: 3, costs: [160, 320, 640], elegance: [4, 8, 12],  effect: { type: 'meaning', values: [25, 20, 15] }, desc: '匠人驻守,查阅释义更省(释义费 30 → 25 / 20 / 15)。' },
    { id: 'library', name: '藏书阁', tier: 4, costs: [240, 480, 960], elegance: [5, 10, 15], effect: { type: 'hint', values: [50, 40, 30] }, desc: '万卷藏书,提示更省(提示费 60 → 50 / 40 / 30)。' },
    { id: 'school',  name: '私塾',   tier: 4, costs: [240, 480, 960], elegance: [5, 10, 15], effect: null, desc: '朗朗书声,桃李满门。' },
    { id: 'steles',  name: '碑林',   tier: 4, costs: [240, 480, 960], elegance: [5, 10, 15], effect: null, desc: '历代名帖,刻石为记。' }
  ];

  // 陈设:纯金币,无房产门槛,只受"陈设槽位"数量限制;每件只能买一次。
  var DECOR = [
    { id: 'lantern',   name: '灯笼',   cost: 20,  elegance: 1 },
    { id: 'fence',     name: '竹篱',   cost: 25,  elegance: 1 },
    { id: 'path',      name: '石径',   cost: 30,  elegance: 1 },
    { id: 'windchime', name: '风铃',   cost: 35,  elegance: 1 },
    { id: 'flowerbed', name: '花坛',   cost: 40,  elegance: 2 },
    { id: 'bonsai',    name: '盆景',   cost: 50,  elegance: 2 },
    { id: 'stonelamp', name: '石灯',   cost: 60,  elegance: 2 },
    { id: 'incense',   name: '香炉',   cost: 70,  elegance: 2 },
    { id: 'bench',     name: '石桌凳', cost: 80,  elegance: 2 },
    { id: 'qin',       name: '古琴',   cost: 80,  elegance: 3 },
    { id: 'lotusjar',  name: '莲缸',   cost: 90,  elegance: 3 },
    { id: 'screen',    name: '屏风',   cost: 90,  elegance: 3 },
    { id: 'painting',  name: '字画',   cost: 100, elegance: 3 },
    { id: 'magnolia',  name: '玉兰',   cost: 110, elegance: 3 },
    { id: 'rockery',   name: '假山',   cost: 120, elegance: 3 },
    { id: 'plum',      name: '梅树',   cost: 120, elegance: 4 },
    { id: 'bamboo',    name: '竹林',   cost: 130, elegance: 4 },
    { id: 'sundial',   name: '日晷',   cost: 140, elegance: 4 },
    { id: 'crane',     name: '鹤雕',   cost: 150, elegance: 4 },
    { id: 'inkstone',  name: '砚台案', cost: 150, elegance: 4 },
    { id: 'chess',     name: '棋台',   cost: 160, elegance: 4 },
    { id: 'taihu',     name: '太湖石', cost: 180, elegance: 5 },
    { id: 'bronze',    name: '青铜鼎', cost: 200, elegance: 5 },
    { id: 'bell',      name: '古钟',   cost: 220, elegance: 5 }
  ];

  var annexById = Object.create(null), decorById = Object.create(null);   // 无原型:'constructor' 等字符串不会被误判为已知 id
  ANNEX.forEach(function (a) { annexById[a.id] = a; });
  DECOR.forEach(function (d) { decorById[d.id] = d; });

  function isInt(n) { return typeof n === 'number' && isFinite(n) && Math.floor(n) === n; }
  function clampHouse(h) { return isInt(h) ? Math.max(0, Math.min(SLOTS.length - 1, h)) : 0; }

  function newState() {
    return { annex: {}, decor: [], freeHints: 0, hintsGranted: 0, pondDay: null, pondStock: 0 };
  }

  // 清洗任意输入(存档读出的 JSON):未知 id、非法等级、重复项、非整数全部丢弃/归零。
  function sanitize(raw) {
    var st = newState();
    if (!raw || typeof raw !== 'object') return st;
    if (raw.annex && typeof raw.annex === 'object' && !Array.isArray(raw.annex)) {
      Object.keys(raw.annex).forEach(function (id) {
        var lv = raw.annex[id];
        if (annexById[id] && isInt(lv) && lv >= 1 && lv <= MAX_LEVEL) st.annex[id] = lv;
      });
    }
    if (Array.isArray(raw.decor)) {
      var seen = {};
      raw.decor.forEach(function (id) {
        if (typeof id === 'string' && decorById[id] && !seen[id]) { seen[id] = true; st.decor.push(id); }
      });
    }
    if (isInt(raw.freeHints) && raw.freeHints >= 0 && raw.freeHints <= 999) st.freeHints = raw.freeHints;
    if (isInt(raw.hintsGranted) && raw.hintsGranted >= 0 && raw.hintsGranted <= 999) st.hintsGranted = raw.hintsGranted;
    if (typeof raw.pondDay === 'string' && DATE_RE.test(raw.pondDay)) st.pondDay = raw.pondDay;
    if (isInt(raw.pondStock) && raw.pondStock >= 0 && raw.pondStock <= 99999) st.pondStock = raw.pondStock;
    // 池塘不存在时库存必须为 0;库存不能超过上限
    if (!st.annex.pond) { st.pondStock = 0; }
    else { st.pondStock = Math.min(st.pondStock, pondDaily(st) * POND_CAP_DAYS); }
    return st;
  }

  function annexCount(st) { return Object.keys(st.annex).length; }

  function slotInfo(st, houseIdx) {
    var s = SLOTS[clampHouse(houseIdx)];
    return { annexUsed: annexCount(st), annexMax: s.annex, decorUsed: st.decor.length, decorMax: s.decor };
  }

  function elegance(st) {
    var total = 0;
    Object.keys(st.annex).forEach(function (id) { total += annexById[id].elegance[st.annex[id] - 1]; });
    st.decor.forEach(function (id) { total += decorById[id].elegance; });
    return total;
  }

  // 雅致度每满一格(ELEGANCE_STEP)送 1 次免费提示;只增不减,重复调用不会重复发。返回本次新增次数。
  function grantHints(st) {
    var earned = Math.floor(elegance(st) / ELEGANCE_STEP);
    var add = earned - st.hintsGranted;
    if (add <= 0) return 0;
    st.hintsGranted += add;
    st.freeHints += add;
    return add;
  }
  function useFreeHint(st) {
    if (st.freeHints <= 0) return false;
    st.freeHints -= 1;
    return true;
  }
  function nextEleganceAt(st) { return (Math.floor(elegance(st) / ELEGANCE_STEP) + 1) * ELEGANCE_STEP; }

  function fail(reason, coins) { return { ok: false, reason: reason, coins: coins }; }

  // 建造或升级附属建筑。新建:需房产达标 + 有空槽;升级:需未满级。都需要金币够。
  // 注意:调用方在购买(尤其升级池塘)之前应先 tickPond(st, today),让旧等级的产出先结算。
  function buyAnnex(st, id, houseIdx, coins) {
    var a = annexById[id];
    if (!a) return fail('unknown', coins);
    var h = clampHouse(houseIdx);
    if (h < a.tier) return fail('locked', coins);
    var lv = st.annex[id] || 0;
    if (lv >= MAX_LEVEL) return fail('max', coins);
    if (lv === 0 && annexCount(st) >= SLOTS[h].annex) return fail('slots', coins);
    var cost = a.costs[lv];
    if (!isInt(coins) || coins < cost) return fail('coins', coins);
    st.annex[id] = lv + 1;
    var added = grantHints(st);
    return { ok: true, coins: coins - cost, level: lv + 1, cost: cost, newHints: added };
  }

  function buyDecor(st, id, houseIdx, coins) {
    var d = decorById[id];
    if (!d) return fail('unknown', coins);
    if (st.decor.indexOf(id) !== -1) return fail('owned', coins);
    if (st.decor.length >= SLOTS[clampHouse(houseIdx)].decor) return fail('slots', coins);
    if (!isInt(coins) || coins < d.cost) return fail('coins', coins);
    st.decor.push(id);
    var added = grantHints(st);
    return { ok: true, coins: coins - d.cost, cost: d.cost, newHints: added };
  }

  // ---- 附属建筑的实际效果 ----
  function effectValue(st, type) {
    for (var i = 0; i < ANNEX.length; i++) {
      var a = ANNEX[i];
      if (a.effect && a.effect.type === type && st.annex[a.id]) return a.effect.values[st.annex[a.id] - 1];
    }
    return null;
  }
  function hintCost(st, base) { var v = effectValue(st, 'hint'); return v === null ? base : Math.min(base, v); }
  function meaningCost(st, base) { var v = effectValue(st, 'meaning'); return v === null ? base : Math.min(base, v); }
  function pondDaily(st) { var v = effectValue(st, 'pond'); return v === null ? 0 : v; }

  function dayDiff(a, b) {
    var pa = a.split('-'), pb = b.split('-');
    return Math.round((Date.UTC(+pb[0], +pb[1] - 1, +pb[2]) - Date.UTC(+pa[0], +pa[1] - 1, +pa[2])) / 86400000);
  }
  // 按日期累积池塘库存(上限 3 天产出)。today='YYYY-MM-DD'。没有池塘:什么都不做。
  // 时钟倒退(today 早于 pondDay)只重置 pondDay,不累积也不扣。
  function tickPond(st, today) {
    var daily = pondDaily(st);
    if (!daily || typeof today !== 'string' || !DATE_RE.test(today)) return 0;
    if (!st.pondDay) { st.pondDay = today; return 0; }
    var days = dayDiff(st.pondDay, today);
    if (days <= 0) { if (days < 0) st.pondDay = today; return 0; }
    var before = st.pondStock;
    st.pondStock = Math.min(daily * POND_CAP_DAYS, st.pondStock + days * daily);
    st.pondDay = today;
    return st.pondStock - before;
  }
  function collectPond(st, today, coins) {
    tickPond(st, today);
    if (!st.pondStock) return { ok: false, reason: 'empty', coins: coins, gained: 0 };
    var g = st.pondStock;
    st.pondStock = 0;
    return { ok: true, coins: coins + g, gained: g };
  }

  var api = {
    ELEGANCE_STEP: ELEGANCE_STEP, MAX_LEVEL: MAX_LEVEL, POND_CAP_DAYS: POND_CAP_DAYS,
    SLOTS: SLOTS, ANNEX: ANNEX, DECOR: DECOR,
    newState: newState, sanitize: sanitize, slotInfo: slotInfo,
    elegance: elegance, grantHints: grantHints, useFreeHint: useFreeHint, nextEleganceAt: nextEleganceAt,
    buyAnnex: buyAnnex, buyDecor: buyDecor,
    hintCost: hintCost, meaningCost: meaningCost, pondDaily: pondDaily, tickPond: tickPond, collectPond: collectPond
  };
  root.ESTATE = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : this);
