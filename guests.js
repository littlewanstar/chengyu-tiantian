// 宾客图鉴(第 D2 步):10 位原创人物,按通关数解锁。
// window.GUESTS = [{ name, need, desc, svg }, ...];viewBox 0 0 80 100。未解锁时由 CSS 做成剪影。
(function () {
  function fig(o) {
    var hair = '#2a1f1f', skin = '#f1d3b0';
    var s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 100" role="img">';
    s += '<ellipse cx="40" cy="95" rx="22" ry="4" fill="#000" opacity="0.18"/>';
    // 袍身
    s += '<path d="M22 94 L26 56 Q40 46 54 56 L58 94 Z" fill="' + o.robe + '"/>';
    s += '<path d="M40 52 L40 94" stroke="' + o.trim + '" stroke-width="2"/>';
    s += '<path d="M28 60 Q40 68 52 60" fill="none" stroke="' + o.trim + '" stroke-width="2.4"/>';
    s += '<rect x="30" y="72" width="20" height="3.5" fill="' + o.belt + '"/>';
    // 头
    s += '<circle cx="40" cy="38" r="12" fill="' + skin + '"/>';
    s += '<circle cx="35.5" cy="38" r="1.3" fill="#3a2a2a"/><circle cx="44.5" cy="38" r="1.3" fill="#3a2a2a"/>';
    s += '<path d="M37 43.5 Q40 45.5 43 43.5" fill="none" stroke="#a5604a" stroke-width="1.2"/>';
    if (o.beard) s += '<path d="M33 44 Q40 60 47 44 Q40 50 33 44 Z" fill="#e8e4dc"/>';
    // 帽/发
    if (o.hat === 'scholar') { s += '<path d="M27 34 Q40 16 53 34 L50 30 Q40 22 30 30 Z" fill="' + hair + '"/><rect x="31" y="24" width="18" height="8" rx="2" fill="' + o.hatc + '"/>'; }
    else if (o.hat === 'bun') { s += '<path d="M28 36 Q40 20 52 36 Q40 28 28 36 Z" fill="' + hair + '"/><circle cx="40" cy="22" r="6" fill="' + hair + '"/><rect x="36" y="27" width="8" height="2.5" fill="' + o.hatc + '"/>'; }
    else if (o.hat === 'straw') { s += '<path d="M20 32 Q40 8 60 32 Q40 28 20 32 Z" fill="' + o.hatc + '"/><path d="M24 31 Q40 24 56 31" fill="none" stroke="#8a6a2a" stroke-width="1.2"/>'; }
    else if (o.hat === 'cloth') { s += '<path d="M27 36 Q40 14 53 36 Q40 26 27 36 Z" fill="' + o.hatc + '"/><path d="M52 32 L62 40 L54 38 Z" fill="' + o.hatc + '"/>'; }
    else { s += '<path d="M28 36 Q40 18 52 36 Q40 28 28 36 Z" fill="' + hair + '"/>'; }
    // 道具
    if (o.prop === 'book') s += '<rect x="48" y="60" width="16" height="20" rx="1.5" fill="#e8dcc0" transform="rotate(12 56 70)"/><path d="M52 63 H61 M52 68 H61 M52 73 H59" stroke="#8a6a4a" stroke-width="1" transform="rotate(12 56 70)"/>';
    if (o.prop === 'rod') s += '<path d="M56 78 L72 30" stroke="#7a5a30" stroke-width="2"/><path d="M72 30 Q66 44 70 54" fill="none" stroke="#ccc" stroke-width="0.8"/>';
    if (o.prop === 'axe') s += '<path d="M58 84 L58 52" stroke="#7a5a30" stroke-width="2.4"/><path d="M58 52 L68 54 L66 62 L58 62 Z" fill="#8f98a3"/>';
    if (o.prop === 'zither') s += '<path d="M14 82 L66 74 L66 80 L14 88 Z" fill="#5a3a24"/><path d="M18 84 L64 77" stroke="#e8dcc0" stroke-width="0.8"/>';
    if (o.prop === 'board') s += '<rect x="46" y="74" width="20" height="14" rx="1" fill="#c9a060"/><path d="M52 74 V88 M59 74 V88 M46 81 H66" stroke="#5a3a24" stroke-width="0.8"/><circle cx="55" cy="78" r="1.8" fill="#222"/><circle cx="62" cy="84" r="1.8" fill="#f4f4f4"/>';
    if (o.prop === 'brush') s += '<path d="M60 80 L70 50" stroke="#6b4a2a" stroke-width="2"/><path d="M70 50 L72 42 L68 46 Z" fill="#222"/>';
    if (o.prop === 'herb') s += '<rect x="48" y="66" width="18" height="16" rx="3" fill="#8a5a3a"/><path d="M54 66 Q57 58 60 66" fill="none" stroke="#3a8a4a" stroke-width="2"/>';
    if (o.prop === 'sword') s += '<path d="M60 90 L60 44" stroke="#c9d2dc" stroke-width="2.6"/><rect x="56" y="76" width="8" height="2.6" fill="#6b4a2a"/>';
    if (o.prop === 'tea') s += '<path d="M50 74 H66 L64 84 Q58 88 52 84 Z" fill="#6aa6a0"/><path d="M62 70 Q66 66 64 62" fill="none" stroke="#fff" stroke-width="1" opacity="0.6"/>';
    if (o.prop === 'fan') s += '<path d="M52 74 L64 56 A10 10 0 0 1 72 66 Z" fill="#f4ecd0"/><path d="M52 74 L66 58 M52 74 L68 62" stroke="#a08a5a" stroke-width="0.8"/>';
    return s + '</svg>';
  }
  window.GUESTS = [
    { name: '书童', need: 10, desc: '捧着书卷,总在院门口等你。', svg: fig({ robe: '#7aa6b8', trim: '#e8f0f4', belt: '#c8452f', hat: 'bun', hatc: '#c8452f', prop: 'book' }) },
    { name: '樵夫', need: 20, desc: '山里来的,最爱讲古谚。', svg: fig({ robe: '#8a6a3c', trim: '#c9a85a', belt: '#4a3a2a', hat: 'cloth', hatc: '#6a8a5a', prop: 'axe' }) },
    { name: '渔翁', need: 30, desc: '垂钓江上,话少意深。', svg: fig({ robe: '#4a7a6a', trim: '#cfe3d6', belt: '#2f4f4a', hat: 'straw', hatc: '#d8c074', prop: 'rod', beard: true }) },
    { name: '琴师', need: 40, desc: '一曲未终,字已填满。', svg: fig({ robe: '#7a5a9a', trim: '#e6d9f2', belt: '#f0c860', hat: 'scholar', hatc: '#3a2a4a', prop: 'zither' }) },
    { name: '棋士', need: 50, desc: '落子无悔,逢人必邀对弈。', svg: fig({ robe: '#3a3a4a', trim: '#9aa0b0', belt: '#d9a73a', hat: 'scholar', hatc: '#1d1d28', prop: 'board', beard: true }) },
    { name: '画师', need: 60, desc: '以墨为友,以山为稿。', svg: fig({ robe: '#d8d0b8', trim: '#8a8068', belt: '#6a5a3a', hat: 'cloth', hatc: '#3a3a3a', prop: 'brush' }) },
    { name: '医者', need: 70, desc: '悬壶济世,也懂字里药方。', svg: fig({ robe: '#5a8a5a', trim: '#dcead8', belt: '#8a5a3a', hat: 'scholar', hatc: '#2f5a2f', prop: 'herb', beard: true }) },
    { name: '剑客', need: 80, desc: '剑在鞘中,心在字间。', svg: fig({ robe: '#2f3a5a', trim: '#8aa0d0', belt: '#c8452f', hat: 'none', hatc: '#2a1f1f', prop: 'sword' }) },
    { name: '茶商', need: 90, desc: '远道而来,带着一壶好茶。', svg: fig({ robe: '#b8562f', trim: '#f0d0a8', belt: '#5a3a24', hat: 'cloth', hatc: '#7a2f1f', prop: 'tea' }) },
    { name: '诗人', need: 100, desc: '月下来访,为书院题诗。', svg: fig({ robe: '#e8e0f0', trim: '#a89ac8', belt: '#d9a73a', hat: 'scholar', hatc: '#4a3a6a', prop: 'fan', beard: true }) }
  ];
})();
