// 府邸插画(第 C2b 步 + 第 H 步):8 张图,下标即 HOUSES 里每档的 art:0 草屋 1 泥屋 2 木屋 3 大木屋 4 书院 5 官邸 6 庄园 7 王府(官邸/庄园/王府的丙乙甲共用同一张)。
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
    ),
    // 5 官邸(丙乙甲共用):粉墙瓦顶围院 + 朱漆大门 + 门前石狮 + 后堂屋顶
    wrap(
      '<rect x="60" y="48" width="80" height="34" fill="#cfc3a8"/><path d="M52 52 Q100 26 148 52 L140 54 Q100 36 60 54Z" fill="#3a3a48"/><path d="M100 28 V20" stroke="#242430" stroke-width="3"/><circle cx="100" cy="18" r="3" fill="#d9a73a"/>' +
      '<rect x="72" y="60" width="14" height="14" fill="url(#hw)"/><rect x="114" y="60" width="14" height="14" fill="url(#hw)"/>' +
      '<rect x="10" y="84" width="180" height="42" fill="#efe6d0"/><rect x="10" y="80" width="180" height="6" fill="#3a3a48"/>' +
      '<path d="M10 80 H190" stroke="#242430" stroke-width="2"/><g stroke="#d9cfb4" stroke-width="1"><path d="M10 100 H190 M10 114 H190"/></g>' +
      '<rect x="76" y="92" width="48" height="34" fill="#b03a2c"/><rect x="82" y="98" width="17" height="28" fill="#8a2a1a" stroke="#5a1a10" stroke-width="1"/><rect x="101" y="98" width="17" height="28" fill="#8a2a1a" stroke="#5a1a10" stroke-width="1"/>' +
      '<g fill="#d9a73a"><circle cx="86" cy="106" r="1.5"/><circle cx="92" cy="106" r="1.5"/><circle cx="108" cy="106" r="1.5"/><circle cx="114" cy="106" r="1.5"/><circle cx="86" cy="116" r="1.5"/><circle cx="92" cy="116" r="1.5"/><circle cx="108" cy="116" r="1.5"/><circle cx="114" cy="116" r="1.5"/></g>' +
      '<path d="M68 94 Q100 74 132 94 L128 96 Q100 82 72 96Z" fill="#2c2026"/><path d="M70 94 H130" stroke="#d9a73a" stroke-width="1.6"/>' +
      '<ellipse cx="66" cy="119" rx="7" ry="8" fill="#b9c0c4"/><circle cx="66" cy="111" r="5" fill="#cfd6da"/><ellipse cx="134" cy="119" rx="7" ry="8" fill="#b9c0c4"/><circle cx="134" cy="111" r="5" fill="#cfd6da"/>' +
      '<rect x="62" y="124" width="76" height="4" fill="#6b7479"/>' +
      '<path d="M22 84 V70 M30 84 V64" stroke="#5a4a3a" stroke-width="3"/><ellipse cx="26" cy="62" rx="14" ry="12" fill="#4f9a5f"/><ellipse cx="176" cy="66" rx="13" ry="11" fill="#5fae6b"/><path d="M176 84 V74" stroke="#5a4a3a" stroke-width="3"/>' +
      '<path d="M44 84 V92 M156 84 V92" stroke="#2b1c1c"/><ellipse cx="44" cy="97" rx="5" ry="6" fill="#c8452f"/><ellipse cx="156" cy="97" rx="5" ry="6" fill="#c8452f"/>'
    ),
    // 6 庄园:中堂 + 两翼厢房 + 水池 + 垂柳 + 凉亭
    wrap(
      '<rect x="0" y="102" width="200" height="26" fill="#8fb06a"/><ellipse cx="156" cy="116" rx="34" ry="8" fill="#5a8fa0"/><ellipse cx="150" cy="115" rx="22" ry="4.6" fill="#74a9b8" opacity=".6"/>' +
      '<rect x="70" y="58" width="60" height="50" fill="#efe6d0"/><rect x="66" y="104" width="68" height="8" fill="#6b7479"/>' +
      '<rect x="72" y="64" width="8" height="40" fill="#b03a2c"/><rect x="96" y="64" width="8" height="40" fill="#b03a2c"/><rect x="120" y="64" width="8" height="40" fill="#b03a2c"/>' +
      '<rect x="82" y="76" width="12" height="28" fill="url(#hw)"/><rect x="106" y="76" width="12" height="28" fill="url(#hw)"/>' +
      '<path d="M58 64 Q100 56 142 64 Q122 60 100 36 Q78 60 58 64Z" fill="#2c2026"/><path d="M62 66 H138" stroke="#d9a73a" stroke-width="2"/><path d="M82 52 Q100 46 118 52 Q108 50 100 38 Q92 50 82 52Z" fill="#3a2c30"/>' +
      '<rect x="12" y="70" width="52" height="38" fill="#efe6d0"/><path d="M6 74 Q38 52 70 74 L64 76 Q38 62 12 76Z" fill="#3a3a48"/><rect x="22" y="82" width="12" height="14" fill="url(#hw)"/><rect x="42" y="82" width="12" height="14" fill="url(#hw)"/><rect x="8" y="106" width="60" height="5" fill="#6b7479"/>' +
      '<rect x="136" y="70" width="52" height="38" fill="#efe6d0"/><path d="M130 74 Q162 52 194 74 L188 76 Q162 62 136 76Z" fill="#3a3a48"/><rect x="146" y="82" width="12" height="14" fill="url(#hw)"/><rect x="166" y="82" width="12" height="14" fill="url(#hw)"/>' +
      '<path d="M96 108 V122 M104 108 V122" stroke="#9aa3a8" stroke-width="3"/><path d="M92 122 H108" stroke="#6b7479" stroke-width="3"/>' +
      '<path d="M184 56 V100" stroke="#5a4a3a" stroke-width="3"/><path d="M184 60 q-14 8 -12 30 M184 60 q8 8 6 30 M184 62 q-20 4 -22 22" stroke="#7fae5a" stroke-width="1.6" fill="none"/>' +
      '<ellipse cx="190" cy="56" rx="9" ry="7" fill="#5fae6b"/>' +
      '<path d="M12 56 V70" stroke="#5a4a3a" stroke-width="3"/><ellipse cx="12" cy="52" rx="10" ry="9" fill="#4f9a5f"/>' +
      '<path d="M96 30 V12" stroke="#d9a73a" stroke-width="2"/><path d="M96 12 L108 16 L96 20Z" fill="#c8452f"/>'
    ),
    // 7 王府:汉白玉三层台基 + 重檐庑殿顶(琉璃瓦金脊) + 朱红柱 + 双阙 + 旗
    wrap(
      '<rect x="14" y="116" width="172" height="10" fill="#d9dde0"/><rect x="24" y="108" width="152" height="9" fill="#e9eef0"/><rect x="34" y="100" width="132" height="9" fill="#f3f6f7"/>' +
      '<path d="M34 100 H166 M24 108 H176 M14 116 H186" stroke="#b9c0c4" stroke-width="1"/>' +
      '<g stroke="#cfd6da" stroke-width="1.4"><path d="M44 104 V116 M60 104 V116 M76 104 V116 M92 104 V116 M108 104 V116 M124 104 V116 M140 104 V116 M156 104 V116"/></g>' +
      '<rect x="46" y="68" width="108" height="33" fill="#3a2226"/>' +
      '<g fill="#b03a2c"><rect x="50" y="70" width="7" height="31"/><rect x="68" y="70" width="7" height="31"/><rect x="86" y="70" width="7" height="31"/><rect x="107" y="70" width="7" height="31"/><rect x="125" y="70" width="7" height="31"/><rect x="143" y="70" width="7" height="31"/></g>' +
      '<rect x="78" y="80" width="44" height="21" fill="#8a2a1a"/><path d="M100 80 V101" stroke="#5a1a10" stroke-width="1.6"/><g fill="#d9a73a"><circle cx="94" cy="90" r="1.4"/><circle cx="106" cy="90" r="1.4"/></g>' +
      '<path d="M18 72 Q60 70 100 46 Q140 70 182 72 Q148 76 100 58 Q52 76 18 72Z" fill="#1f6b5a"/><path d="M26 72 H174" stroke="#d9a73a" stroke-width="2.4"/>' +
      '<path d="M44 58 Q74 54 100 30 Q126 54 156 58 Q128 60 100 42 Q72 60 44 58Z" fill="#2a8a72"/><path d="M52 58 H148" stroke="#d9a73a" stroke-width="2"/>' +
      '<path d="M84 34 Q100 28 116 34 Q108 32 100 22 Q92 32 84 34Z" fill="#1f6b5a"/><circle cx="100" cy="19" r="3.4" fill="#d9a73a"/><path d="M96 24 Q100 14 104 24" stroke="#d9a73a" stroke-width="1.6" fill="none"/>' +
      '<rect x="88" y="48" width="24" height="9" fill="#3a2226" stroke="#d9a73a" stroke-width="1.4"/><rect x="92" y="50" width="16" height="5" fill="#d9a73a"/>' +
      '<rect x="4" y="74" width="16" height="42" fill="#b03a2c"/><path d="M0 76 Q12 62 24 76 L20 78 Q12 70 4 78Z" fill="#1f6b5a"/><circle cx="12" cy="62" r="2.4" fill="#d9a73a"/><rect x="9" y="84" width="6" height="9" fill="url(#hw)"/>' +
      '<rect x="180" y="74" width="16" height="42" fill="#b03a2c"/><path d="M176 76 Q188 62 200 76 L196 78 Q188 70 180 78Z" fill="#1f6b5a"/><circle cx="188" cy="62" r="2.4" fill="#d9a73a"/><rect x="185" y="84" width="6" height="9" fill="url(#hw)"/>' +
      '<path d="M30 100 V74" stroke="#5a4a3a" stroke-width="2"/><path d="M30 74 L44 78 L30 82Z" fill="#c8452f"/><path d="M170 100 V74" stroke="#5a4a3a" stroke-width="2"/><path d="M170 74 L156 78 L170 82Z" fill="#c8452f"/>'
    )
  ];
})();
