// 府邸插画(第 C2b 步):5 档,按 HOUSES 顺序:草屋、泥屋、木屋、大木屋、书院。
// 每个都是 viewBox 0 0 200 140 的内联 SVG 字符串;原创绘制。
(function () {
  var G = '<ellipse cx="100" cy="128" rx="92" ry="9" fill="#10242c" opacity="0.55"/>';
  var WIN = '<linearGradient id="hw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe9a8"/><stop offset="1" stop-color="#e9a64a"/></linearGradient>';
  function wrap(body) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 140" role="img"><defs>' + WIN + '</defs>' + G + body + '</svg>';
  }
  window.HOUSE_SVG = [
    // 0 草屋:茅草顶 + 矮土墙
    wrap(
      '<rect x="56" y="82" width="88" height="44" fill="#8a6a4a"/>' +
      '<path d="M40 88 L100 40 L160 88 Z" fill="#c9a85a"/>' +
      '<path d="M48 88 L100 48 L152 88" fill="none" stroke="#a88a3c" stroke-width="3"/>' +
      '<path d="M62 84 L100 54 M138 84 L100 54 M80 86 L100 62 M120 86 L100 62" stroke="#a88a3c" stroke-width="2"/>' +
      '<rect x="88" y="98" width="24" height="28" rx="2" fill="#4a3426"/>' +
      '<rect x="64" y="94" width="14" height="12" fill="url(#hw)"/>'
    ),
    // 1 泥屋:黄泥墙 + 缓坡茅顶 + 小窗
    wrap(
      '<rect x="44" y="70" width="112" height="56" fill="#a88a62"/>' +
      '<path d="M44 70 H156 V78 H44 Z" fill="#8a6c46"/>' +
      '<path d="M34 72 Q100 36 166 72 L156 76 Q100 52 44 76 Z" fill="#b99a4a"/>' +
      '<rect x="88" y="92" width="24" height="34" rx="2" fill="#4a3426"/>' +
      '<rect x="56" y="88" width="22" height="18" fill="url(#hw)"/><path d="M67 88 V106 M56 97 H78" stroke="#6b4a30" stroke-width="2"/>' +
      '<rect x="122" y="88" width="22" height="18" fill="url(#hw)"/><path d="M133 88 V106 M122 97 H144" stroke="#6b4a30" stroke-width="2"/>' +
      '<path d="M44 100 L52 96 M148 110 L156 106" stroke="#8a6c46" stroke-width="2"/>'
    ),
    // 2 木屋:木板墙 + 青瓦人字顶 + 烟囱
    wrap(
      '<rect x="128" y="34" width="12" height="30" fill="#5a4a4a"/>' +
      '<rect x="48" y="66" width="104" height="60" fill="#8b5a36"/>' +
      '<path d="M48 78 H152 M48 90 H152 M48 102 H152 M48 114 H152" stroke="#6b4228" stroke-width="2"/>' +
      '<path d="M36 70 L100 26 L164 70 Z" fill="#3a3a48"/>' +
      '<path d="M36 70 L100 26 L164 70" fill="none" stroke="#242430" stroke-width="3"/>' +
      '<path d="M60 64 L100 38 M140 64 L100 38" stroke="#4a4a5a" stroke-width="2"/>' +
      '<rect x="88" y="92" width="24" height="34" rx="2" fill="#3a2418"/><circle cx="106" cy="110" r="1.6" fill="#d9a73a"/>' +
      '<rect x="58" y="84" width="22" height="20" fill="url(#hw)"/><path d="M69 84 V104 M58 94 H80" stroke="#5a341e" stroke-width="2"/>' +
      '<rect x="120" y="84" width="22" height="20" fill="url(#hw)"/><path d="M131 84 V104 M120 94 H142" stroke="#5a341e" stroke-width="2"/>'
    ),
    // 3 大木屋:两层 + 侧厢 + 灯笼
    wrap(
      '<rect x="26" y="84" width="48" height="42" fill="#7a4e30"/>' +
      '<path d="M18 88 L50 62 L82 88 Z" fill="#33333f"/>' +
      '<rect x="64" y="70" width="112" height="56" fill="#8b5a36"/>' +
      '<rect x="78" y="42" width="84" height="30" fill="#7a4e30"/>' +
      '<path d="M64 74 H176 M64 86 H176 M64 98 H176 M64 110 H176" stroke="#6b4228" stroke-width="2"/>' +
      '<path d="M70 46 L120 18 L170 46 Z" fill="#33333f"/>' +
      '<path d="M54 74 Q120 52 186 74 L176 78 Q120 62 64 78 Z" fill="#242430"/>' +
      '<rect x="104" y="96" width="26" height="30" rx="2" fill="#3a2418"/>' +
      '<rect x="74" y="86" width="20" height="18" fill="url(#hw)"/><rect x="142" y="86" width="20" height="18" fill="url(#hw)"/>' +
      '<rect x="108" y="48" width="24" height="18" fill="url(#hw)"/><path d="M120 48 V66 M108 57 H132" stroke="#5a341e" stroke-width="2"/>' +
      '<rect x="36" y="98" width="16" height="14" fill="url(#hw)"/>' +
      '<path d="M92 78 V84" stroke="#2b1c1c"/><ellipse cx="92" cy="90" rx="5" ry="6" fill="#c8452f"/>' +
      '<path d="M150 78 V84" stroke="#2b1c1c"/><ellipse cx="150" cy="90" rx="5" ry="6" fill="#c8452f"/>'
    ),
    // 4 书院:台基 + 红柱 + 飞檐双层顶 + 匾额
    wrap(
      '<rect x="22" y="116" width="156" height="10" fill="#5a484a"/><rect x="30" y="108" width="140" height="9" fill="#4a3a3c"/>' +
      '<rect x="44" y="66" width="112" height="42" fill="#3a2c30"/>' +
      '<rect x="48" y="68" width="7" height="40" fill="#b03a2c"/><rect x="96" y="68" width="8" height="40" fill="#b03a2c"/><rect x="145" y="68" width="7" height="40" fill="#b03a2c"/>' +
      '<rect x="60" y="78" width="30" height="24" rx="2" fill="url(#hw)"/><rect x="110" y="78" width="30" height="24" rx="2" fill="url(#hw)"/>' +
      '<path d="M75 78 V102 M60 90 H90 M125 78 V102 M110 90 H140" stroke="#6b3a30" stroke-width="1.6"/>' +
      '<path d="M16 70 Q56 66 100 40 Q144 66 184 70 Q150 72 100 54 Q50 72 16 70 Z" fill="#2c2026"/>' +
      '<path d="M28 70 L172 70 L152 56 Q100 36 48 56 Z" fill="#1d1519"/>' +
      '<path d="M56 48 Q80 44 100 24 Q120 44 144 48 Q122 48 100 36 Q78 48 56 48 Z" fill="#2c2026"/>' +
      '<rect x="84" y="50" width="32" height="12" rx="1" fill="#6b3a30"/><rect x="87" y="52" width="26" height="8" fill="#d9a73a"/>' +
      '<circle cx="100" cy="21" r="3" fill="#d9a73a"/>' +
      '<path d="M26 74 V86" stroke="#2b1c1c"/><ellipse cx="26" cy="92" rx="6" ry="8" fill="#c8452f"/>' +
      '<path d="M174 74 V86" stroke="#2b1c1c"/><ellipse cx="174" cy="92" rx="6" ry="8" fill="#c8452f"/>'
    )
  ];
})();
