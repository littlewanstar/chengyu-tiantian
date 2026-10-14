// 府邸图标(第 G3 步,Claude 原创绘制):12 个附属建筑 + 24 件陈设,viewBox 0 0 64 64 的内联 SVG 字符串。
// window.ESTATE_ART = { annex:{id:svg}, decor:{id:svg}, get(kind,id) };id 与 estate.js 一致。风格同 houses.js:扁平、土色系、金色点缀。
(function () {
  function w(parts) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img">' +
      '<ellipse cx="32" cy="58" rx="24" ry="3.6" fill="#10242c" opacity="0.3"/>' + parts.join('') + '</svg>';
  }
  var WOOD = '#8a6a4a', DWOOD = '#4a3426', THATCH = '#c9a85a', STONE = '#9aa3a8', DSTONE = '#6b7479',
      GREEN = '#5fae6b', DGREEN = '#3f7f4f', WATER = '#5a8fa0', RED = '#c8452f', GOLD = '#d9a73a', INK = '#2c2026', CREAM = '#f3ead0';

  var annex = {
    well: w([
      '<rect x="17" y="17" width="3" height="24" fill="' + DWOOD + '"/><rect x="44" y="17" width="3" height="24" fill="' + DWOOD + '"/>',
      '<path d="M11 21 L32 8 L53 21 Z" fill="' + THATCH + '"/><path d="M11 21 H53" stroke="#a88a3c" stroke-width="2"/>',
      '<path d="M16 40 H48 V52 Q48 57 32 57 Q16 57 16 52 Z" fill="' + STONE + '"/>',
      '<ellipse cx="32" cy="40" rx="16" ry="5" fill="' + DSTONE + '"/><ellipse cx="32" cy="40" rx="12" ry="3" fill="#1d2f38"/>',
      '<path d="M32 21 V34" stroke="' + WOOD + '" stroke-width="1.6"/><rect x="29" y="33" width="6" height="5" rx="1" fill="' + DWOOD + '"/>',
      '<path d="M22 46 H42 M20 51 H44" stroke="' + DSTONE + '" stroke-width="1" opacity=".6"/>'
    ]),
    woodshed: w([
      '<rect x="10" y="30" width="44" height="26" fill="' + WOOD + '"/>',
      '<path d="M5 32 L32 15 L59 32 Z" fill="#6b4a30"/><path d="M9 32 H55" stroke="#4a3426" stroke-width="2"/>',
      '<rect x="14" y="36" width="36" height="20" fill="#3a2a20"/>',
      '<circle cx="21" cy="50" r="4.4" fill="#c9a070" stroke="#6b4a30"/><circle cx="31" cy="50" r="4.4" fill="#d3ae7c" stroke="#6b4a30"/><circle cx="41" cy="50" r="4.4" fill="#c9a070" stroke="#6b4a30"/>',
      '<circle cx="26" cy="42" r="4.4" fill="#d3ae7c" stroke="#6b4a30"/><circle cx="36" cy="42" r="4.4" fill="#c9a070" stroke="#6b4a30"/>',
      '<circle cx="21" cy="50" r="1.4" fill="#8a6a4a"/><circle cx="31" cy="50" r="1.4" fill="#8a6a4a"/><circle cx="41" cy="50" r="1.4" fill="#8a6a4a"/><circle cx="26" cy="42" r="1.4" fill="#8a6a4a"/><circle cx="36" cy="42" r="1.4" fill="#8a6a4a"/>'
    ]),
    veggie: w([
      '<path d="M10 36 H54 L60 55 H4 Z" fill="#7a5a3a"/>',
      '<path d="M12 42 H52 M9 48 H55" stroke="#5a3e28" stroke-width="2"/>',
      '<g fill="' + GREEN + '"><ellipse cx="16" cy="40" rx="4" ry="3"/><ellipse cx="28" cy="40" rx="4" ry="3"/><ellipse cx="40" cy="40" rx="4" ry="3"/><ellipse cx="50" cy="40" rx="3.4" ry="2.6"/>',
      '<ellipse cx="14" cy="46" rx="4.6" ry="3.4"/><ellipse cx="26" cy="46" rx="4.6" ry="3.4"/><ellipse cx="38" cy="46" rx="4.6" ry="3.4"/><ellipse cx="50" cy="46" rx="4.2" ry="3.2"/></g>',
      '<g fill="' + DGREEN + '"><ellipse cx="18" cy="52" rx="5" ry="3"/><ellipse cx="32" cy="52" rx="5" ry="3"/><ellipse cx="46" cy="52" rx="5" ry="3"/></g>',
      '<circle cx="46" cy="52" r="2" fill="#e08a3a"/><circle cx="18" cy="52" r="2" fill="#e08a3a"/>',
      '<path d="M6 34 V30 M12 35 V31 M52 35 V31 M58 34 V30 M6 32 H58" stroke="' + DWOOD + '" stroke-width="1.4" fill="none"/>'
    ]),
    pond: w([
      '<ellipse cx="32" cy="40" rx="27" ry="15" fill="' + STONE + '"/><ellipse cx="32" cy="40" rx="24" ry="12.5" fill="' + WATER + '"/>',
      '<ellipse cx="32" cy="39" rx="20" ry="9" fill="#74a9b8" opacity=".6"/>',
      '<ellipse cx="22" cy="40" rx="6.4" ry="3.2" fill="' + GREEN + '"/><ellipse cx="40" cy="44" rx="5.6" ry="2.8" fill="' + DGREEN + '"/><ellipse cx="42" cy="35" rx="4.4" ry="2.2" fill="' + GREEN + '"/>',
      '<path d="M22 38 Q20 32 24 30 Q25 35 22 38Z" fill="#f2b8c0"/><path d="M22 38 Q24 32 20 30 Q19 35 22 38Z" fill="#e89aa8"/>',
      '<path d="M30 42 q4 -3 8 0 q-4 3 -8 0Z" fill="#e8893a"/><path d="M38 42 l3 -2 v4Z" fill="#e8893a"/>',
      '<path d="M12 34 q-4 -8 -2 -14 M16 33 q-1 -8 1 -12" stroke="' + DGREEN + '" stroke-width="1.6" fill="none"/>'
    ]),
    stable: w([
      '<rect x="9" y="30" width="46" height="26" fill="' + WOOD + '"/>',
      '<path d="M4 32 L32 12 L60 32 Z" fill="' + DWOOD + '"/><path d="M9 32 H55" stroke="#2c2026" stroke-width="2"/>',
      '<rect x="14" y="36" width="36" height="20" fill="#2e211a"/>',
      '<path d="M24 56 V44 Q24 38 31 38 L35 40 L40 37 L39 44 L40 56 Z" fill="#7a4a2a"/>',
      '<path d="M35 40 L40 37 L41 40 L37 42Z" fill="#5a3418"/><circle cx="35.4" cy="41" r="0.9" fill="#f3ead0"/>',
      '<path d="M29 38 Q27 44 29 48" stroke="#2c2026" stroke-width="1.6" fill="none"/>',
      '<path d="M14 34 H50" stroke="' + GOLD + '" stroke-width="1.4"/>'
    ]),
    storage: w([
      '<rect x="14" y="28" width="36" height="28" fill="#a88a62"/>',
      '<path d="M7 31 Q32 4 57 31 Z" fill="' + INK + '"/><path d="M12 29 Q32 10 52 29" stroke="#4a3b42" stroke-width="2" fill="none"/>',
      '<rect x="25" y="38" width="14" height="18" fill="' + DWOOD + '"/><path d="M32 38 V56 M25 47 H39" stroke="' + GOLD + '" stroke-width="1.4"/>',
      '<ellipse cx="19" cy="52" rx="4.4" ry="5" fill="' + CREAM + '" stroke="#b9a678"/><ellipse cx="46" cy="52" rx="4.4" ry="5" fill="' + CREAM + '" stroke="#b9a678"/>',
      '<path d="M17 49 H21 M44 49 H48" stroke="#b9a678"/>'
    ]),
    pavilion: w([
      '<rect x="14" y="30" width="3.4" height="24" fill="' + RED + '"/><rect x="46.6" y="30" width="3.4" height="24" fill="' + RED + '"/>',
      '<rect x="30" y="30" width="3.4" height="24" fill="#a8341f"/>',
      '<path d="M4 30 Q26 28 32 6 Q38 28 60 30 Q40 30 32 20 Q24 30 4 30Z" fill="' + INK + '"/>',
      '<path d="M12 30 H52" stroke="' + GOLD + '" stroke-width="1.6"/><circle cx="32" cy="6" r="2" fill="' + GOLD + '"/>',
      '<rect x="10" y="52" width="44" height="5" fill="' + STONE + '"/><path d="M17 44 H47 M17 48 H47" stroke="#a8341f" stroke-width="1.6"/>'
    ]),
    orchard: w([
      '<rect x="29" y="38" width="6" height="18" fill="' + DWOOD + '"/>',
      '<circle cx="22" cy="30" r="12" fill="' + DGREEN + '"/><circle cx="42" cy="30" r="12" fill="' + DGREEN + '"/><circle cx="32" cy="20" r="13" fill="' + GREEN + '"/><circle cx="32" cy="33" r="11" fill="' + GREEN + '"/>',
      '<g fill="' + RED + '"><circle cx="24" cy="26" r="2.6"/><circle cx="38" cy="22" r="2.6"/><circle cx="44" cy="32" r="2.6"/><circle cx="30" cy="34" r="2.6"/><circle cx="20" cy="35" r="2.6"/></g>',
      '<g fill="#f2d27a"><circle cx="32" cy="14" r="2.2"/><circle cx="28" cy="28" r="2.2"/><circle cx="40" cy="38" r="2.2"/></g>',
      '<path d="M16 56 H48" stroke="#2e5a3a" stroke-width="2" opacity=".5"/>'
    ]),
    workshop: w([
      '<rect x="10" y="30" width="38" height="26" fill="#a0806a"/>',
      '<path d="M5 32 L29 14 L53 32 Z" fill="#5a3a30"/>',
      '<rect x="40" y="10" width="7" height="16" fill="' + DSTONE + '"/><path d="M43 8 q-4 -4 0 -8 M47 6 q-3 -3 0 -6" stroke="#9aa3a8" stroke-width="1.6" fill="none" opacity=".7"/>',
      '<rect x="16" y="38" width="14" height="18" fill="#2e211a"/><rect x="18" y="40" width="10" height="14" fill="#ff9a3a"/><rect x="20" y="44" width="6" height="10" fill="#ffd36a"/>',
      '<rect x="46" y="44" width="14" height="5" rx="1" fill="' + DSTONE + '"/><rect x="50" y="49" width="6" height="8" fill="#4a5258"/>',
      '<path d="M36 52 L44 40" stroke="' + DWOOD + '" stroke-width="2.4"/><rect x="41" y="36" width="9" height="5" rx="1" transform="rotate(-26 45 38)" fill="#5a6268"/>'
    ]),
    library: w([
      '<rect x="14" y="36" width="36" height="20" fill="' + CREAM + '"/><rect x="19" y="18" width="26" height="18" fill="#efe2c2"/>',
      '<path d="M7 38 Q32 33 57 38 Q50 38 32 34 Q14 38 7 38Z" fill="' + INK + '"/>',
      '<path d="M12 21 Q32 18 52 21 Q44 20 32 6 Q20 20 12 21Z" fill="' + INK + '"/>',
      '<rect x="27" y="23" width="10" height="7" rx="1" fill="#6b3a30"/><rect x="29" y="24.6" width="6" height="3.6" fill="' + GOLD + '"/>',
      '<rect x="27" y="42" width="10" height="14" fill="' + DWOOD + '"/><path d="M18 42 V56 M46 42 V56" stroke="' + RED + '" stroke-width="2.6"/>',
      '<g fill="' + RED + '"><rect x="20" y="44" width="4" height="9"/><rect x="40" y="44" width="4" height="9"/></g>'
    ]),
    school: w([
      '<rect x="12" y="32" width="40" height="24" fill="#d9c8a0"/>',
      '<path d="M5 35 Q32 24 59 35 L52 35 Q32 28 12 35Z" fill="' + INK + '"/><path d="M10 34 L32 14 L54 34 Z" fill="' + INK + '"/>',
      '<rect x="24" y="38" width="16" height="18" fill="' + RED + '"/><path d="M32 38 V56" stroke="#8a2a1a"/>',
      '<rect x="26" y="26" width="12" height="7" rx="1" fill="#f3ead0" stroke="' + GOLD + '"/><path d="M29 29.5 H35" stroke="' + INK + '" stroke-width="1.2"/>',
      '<rect x="14" y="40" width="7" height="9" fill="none" stroke="#8a6a4a"/>',
      '<path d="M44 42 H50 V50 H44Z" fill="none" stroke="#8a6a4a"/>',
      '<circle cx="56" cy="46" r="2" fill="' + GOLD + '"/>'
    ]),
    steles: w([
      '<rect x="8" y="50" width="48" height="6" fill="' + DSTONE + '"/>',
      '<path d="M12 50 V22 Q12 16 18 16 Q24 16 24 22 V50Z" fill="' + STONE + '"/><path d="M26 50 V14 Q26 7 33 7 Q40 7 40 14 V50Z" fill="#b2bbc0"/><path d="M42 50 V24 Q42 18 48 18 Q54 18 54 24 V50Z" fill="' + STONE + '"/>',
      '<g stroke="' + DSTONE + '" stroke-width="1.4"><path d="M18 24 V44 M15 28 V42 M21 28 V42"/><path d="M33 16 V44 M29.5 20 V42 M36.5 20 V42"/><path d="M48 26 V44 M45 30 V42 M51 30 V42"/></g>',
      '<path d="M26 12 Q33 4 40 12" stroke="#d8dde0" stroke-width="1.2" fill="none"/>'
    ])
  };

  var decor = {
    lantern: w([
      '<path d="M32 4 V12" stroke="' + DWOOD + '" stroke-width="1.6"/>',
      '<rect x="24" y="12" width="16" height="4" rx="1" fill="' + GOLD + '"/><ellipse cx="32" cy="32" rx="14" ry="17" fill="' + RED + '"/>',
      '<path d="M32 15 V49 M24 17 Q21 32 24 47 M40 17 Q43 32 40 47" stroke="#8a2a1a" stroke-width="1.2" fill="none"/>',
      '<ellipse cx="28" cy="26" rx="4" ry="7" fill="#e8705a" opacity=".6"/>',
      '<rect x="24" y="48" width="16" height="4" rx="1" fill="' + GOLD + '"/><path d="M32 52 V58 M29 52 L28 58 M35 52 L36 58" stroke="' + GOLD + '" stroke-width="1.4"/>'
    ]),
    fence: w([
      '<g fill="#a8b86a"><rect x="9" y="22" width="5" height="34" rx="1.4"/><rect x="18" y="20" width="5" height="36" rx="1.4"/><rect x="27" y="22" width="5" height="34" rx="1.4"/><rect x="36" y="20" width="5" height="36" rx="1.4"/><rect x="45" y="22" width="5" height="34" rx="1.4"/></g>',
      '<g fill="#7f8f4a"><rect x="9" y="30" width="5" height="1.6"/><rect x="18" y="38" width="5" height="1.6"/><rect x="27" y="32" width="5" height="1.6"/><rect x="36" y="40" width="5" height="1.6"/><rect x="45" y="34" width="5" height="1.6"/></g>',
      '<rect x="6" y="30" width="48" height="3.4" fill="' + WOOD + '"/><rect x="6" y="44" width="48" height="3.4" fill="' + WOOD + '"/>'
    ]),
    path: w([
      '<g fill="' + STONE + '" stroke="' + DSTONE + '" stroke-width="1"><path d="M10 52 q4 -7 12 -6 q5 2 3 7 q-8 4 -15 -1Z"/><path d="M26 44 q5 -6 13 -4 q4 3 0 7 q-8 3 -13 -3Z"/><path d="M38 34 q5 -5 12 -3 q3 3 -1 6 q-7 2 -11 -3Z"/><path d="M24 30 q4 -4 9 -3 q3 2 0 5 q-6 2 -9 -2Z"/><path d="M12 36 q3 -4 8 -3 q3 2 0 5 q-5 1 -8 -2Z"/></g>',
      '<g fill="' + DGREEN + '"><ellipse cx="8" cy="46" rx="3" ry="1.6"/><ellipse cx="52" cy="46" rx="3" ry="1.6"/><ellipse cx="46" cy="28" rx="2.6" ry="1.4"/></g>'
    ]),
    windchime: w([
      '<path d="M12 8 H52" stroke="' + DWOOD + '" stroke-width="3" stroke-linecap="round"/><path d="M32 8 V14" stroke="' + DWOOD + '" stroke-width="1.4"/>',
      '<g stroke="#8a8f94" stroke-width="1"><path d="M16 9 V26 M24 9 V32 M40 9 V30 M48 9 V24"/></g>',
      '<g fill="' + GOLD + '"><rect x="13.6" y="26" width="4.8" height="14" rx="1"/><rect x="21.6" y="32" width="4.8" height="18" rx="1"/><rect x="37.6" y="30" width="4.8" height="16" rx="1"/><rect x="45.6" y="24" width="4.8" height="12" rx="1"/></g>',
      '<path d="M32 14 L28 22 H36Z" fill="' + RED + '"/><path d="M32 22 V48" stroke="#8a8f94"/><path d="M28 46 H36 L34 54 H30Z" fill="' + CREAM + '" stroke="#b9a678"/>'
    ]),
    flowerbed: w([
      '<path d="M6 44 H58 V54 H6Z" fill="#b0654a"/><path d="M6 44 H58" stroke="#8a4a34" stroke-width="2"/><path d="M16 44 V54 M28 44 V54 M40 44 V54 M52 44 V54" stroke="#8a4a34"/>',
      '<path d="M8 44 Q16 34 24 44 Q32 32 40 44 Q48 34 56 44Z" fill="' + DGREEN + '"/>',
      '<g><circle cx="14" cy="36" r="3.6" fill="#f08aa0"/><circle cx="24" cy="32" r="3.6" fill="#f5d04a"/><circle cx="34" cy="34" r="3.6" fill="#f08aa0"/><circle cx="44" cy="31" r="3.6" fill="#fff3d0"/><circle cx="52" cy="37" r="3.6" fill="#f5d04a"/></g>',
      '<g fill="#c8452f"><circle cx="14" cy="36" r="1.2"/><circle cx="34" cy="34" r="1.2"/></g>'
    ]),
    bonsai: w([
      '<path d="M18 48 H46 L43 58 H21Z" fill="#6b8a9a"/><rect x="16" y="45" width="32" height="4" rx="1" fill="#527080"/>',
      '<path d="M32 46 Q30 36 36 30 Q40 26 34 20" stroke="' + DWOOD + '" stroke-width="3.4" fill="none" stroke-linecap="round"/><path d="M34 34 Q26 32 22 28" stroke="' + DWOOD + '" stroke-width="2.4" fill="none"/>',
      '<ellipse cx="22" cy="26" rx="9" ry="5.4" fill="' + DGREEN + '"/><ellipse cx="38" cy="16" rx="11" ry="6" fill="' + GREEN + '"/><ellipse cx="42" cy="30" rx="8" ry="4.6" fill="' + DGREEN + '"/>'
    ]),
    stonelamp: w([
      '<rect x="20" y="52" width="24" height="5" rx="1" fill="' + DSTONE + '"/><rect x="26" y="40" width="12" height="13" fill="' + STONE + '"/>',
      '<rect x="22" y="38" width="20" height="4" fill="' + DSTONE + '"/><rect x="24" y="24" width="16" height="15" fill="' + STONE + '"/><rect x="27" y="27" width="10" height="9" fill="#ffd77a"/>',
      '<path d="M16 24 L32 12 L48 24Z" fill="' + DSTONE + '"/><circle cx="32" cy="10" r="3" fill="' + STONE + '"/>',
      '<rect x="27" y="27" width="10" height="9" fill="#ffd77a" opacity=".5"/><path d="M32 27 V36 M27 31.5 H37" stroke="' + DSTONE + '" stroke-width="1"/>'
    ]),
    incense: w([
      '<path d="M22 30 H42 L40 44 Q32 50 24 44Z" fill="#a8833a"/><rect x="19" y="27" width="26" height="4" rx="2" fill="#c9a24a"/>',
      '<path d="M26 46 L22 56 M38 46 L42 56 M32 48 V57" stroke="#8a6a2a" stroke-width="3" stroke-linecap="round"/>',
      '<path d="M16 34 q-6 0 -4 6 M48 34 q6 0 4 6" stroke="#a8833a" stroke-width="2.4" fill="none"/>',
      '<path d="M32 27 Q26 20 32 14 Q38 8 31 2" stroke="#cfd6da" stroke-width="2.4" fill="none" opacity=".85" stroke-linecap="round"/>',
      '<path d="M26 36 Q32 40 38 36" stroke="#d9b85a" stroke-width="1.4" fill="none"/>'
    ]),
    bench: w([
      '<ellipse cx="32" cy="34" rx="16" ry="6" fill="#b9c0c4"/><path d="M16 34 V40 Q32 48 48 40 V34" fill="' + STONE + '"/><ellipse cx="32" cy="34" rx="16" ry="6" fill="#c9d0d4"/>',
      '<path d="M26 44 V54 H38 V44" fill="' + DSTONE + '"/>',
      '<ellipse cx="12" cy="46" rx="7" ry="3" fill="#b9c0c4"/><path d="M5 46 V52 Q12 56 19 52 V46" fill="' + STONE + '"/>',
      '<ellipse cx="52" cy="46" rx="7" ry="3" fill="#b9c0c4"/><path d="M45 46 V52 Q52 56 59 52 V46" fill="' + STONE + '"/>',
      '<circle cx="32" cy="33" r="2.6" fill="#7a8a52"/>'
    ]),
    qin: w([
      '<path d="M6 40 L52 20 L58 26 L12 48Z" fill="#3a2a22"/><path d="M8 40 L52 22" stroke="#5a4034" stroke-width="1.4"/>',
      '<g stroke="#e8e2cc" stroke-width="0.9"><path d="M10 41 L54 23 M11 43 L55 25 M12 44.6 L56 26.6"/></g>',
      '<g fill="' + GOLD + '"><circle cx="20" cy="36.4" r="1.2"/><circle cx="27" cy="33.5" r="1.2"/><circle cx="34" cy="30.6" r="1.2"/><circle cx="41" cy="27.7" r="1.2"/><circle cx="48" cy="24.8" r="1.2"/></g>',
      '<path d="M12 48 L10 56 M52 28 L56 56" stroke="' + DWOOD + '" stroke-width="2.4"/>',
      '<path d="M8 46 q-4 4 0 8" stroke="' + RED + '" stroke-width="1.6" fill="none"/>'
    ]),
    lotusjar: w([
      '<path d="M16 28 H48 Q52 40 44 54 Q32 58 20 54 Q12 40 16 28Z" fill="#e8f0f2" stroke="#4a7a9a" stroke-width="1.4"/>',
      '<path d="M18 36 Q32 42 46 36 M19 44 Q32 50 45 44" stroke="#4a7a9a" stroke-width="1.6" fill="none"/>',
      '<ellipse cx="32" cy="28" rx="17" ry="4" fill="#5a8fa0"/>',
      '<ellipse cx="22" cy="25" rx="8" ry="3.4" fill="' + GREEN + '"/><ellipse cx="42" cy="26" rx="7" ry="3" fill="' + DGREEN + '"/>',
      '<path d="M32 28 V16" stroke="' + DGREEN + '" stroke-width="2"/><path d="M32 16 Q26 14 25 8 Q31 8 32 16Z" fill="#f4a8b6"/><path d="M32 16 Q38 14 39 8 Q33 8 32 16Z" fill="#e88a9c"/><path d="M32 16 Q29 8 32 3 Q35 8 32 16Z" fill="#f8c4ce"/>'
    ]),
    screen: w([
      '<g><rect x="6" y="14" width="16" height="38" fill="#efe2c2" stroke="' + DWOOD + '" stroke-width="2.4"/><rect x="24" y="14" width="16" height="38" fill="#efe2c2" stroke="' + DWOOD + '" stroke-width="2.4"/><rect x="42" y="14" width="16" height="38" fill="#efe2c2" stroke="' + DWOOD + '" stroke-width="2.4"/></g>',
      '<path d="M8 46 L14 32 L18 40 L20 36 L20 46Z" fill="#6f8a8a" opacity=".85"/><path d="M26 46 L32 30 L38 46Z" fill="#587a7a" opacity=".85"/><path d="M44 46 L50 34 L54 40 L56 46Z" fill="#6f8a8a" opacity=".85"/>',
      '<circle cx="48" cy="22" r="3.6" fill="' + RED + '" opacity=".8"/><path d="M8 24 q4 -3 8 0 M26 22 q4 -3 8 0" stroke="#9aa3a8" stroke-width="1.4" fill="none"/>',
      '<rect x="4" y="52" width="54" height="4" rx="1" fill="' + DWOOD + '"/>'
    ]),
    painting: w([
      '<rect x="12" y="6" width="40" height="3.4" rx="1.4" fill="' + DWOOD + '"/><rect x="14" y="9" width="36" height="42" fill="#f1e6c8"/><rect x="12" y="51" width="40" height="3.4" rx="1.4" fill="' + DWOOD + '"/>',
      '<path d="M16 44 L26 26 L32 34 L38 22 L48 44Z" fill="#7d9aa0" opacity=".85"/><path d="M16 44 L24 34 L32 44Z" fill="#5a7a80" opacity=".9"/>',
      '<circle cx="40" cy="16" r="3.4" fill="' + RED + '" opacity=".85"/><path d="M17 15 q4 -2 8 0 M17 19 q3 -1.6 6 0" stroke="#9a8a6a" stroke-width="1.2" fill="none"/>',
      '<path d="M32 3 V6" stroke="' + DWOOD + '" stroke-width="1.4"/><path d="M52 52 V58" stroke="' + RED + '" stroke-width="1.4"/><rect x="49.6" y="56" width="4.8" height="2.4" fill="' + GOLD + '"/>'
    ]),
    magnolia: w([
      '<path d="M32 56 V32 M32 44 Q24 40 20 32 M32 40 Q42 36 46 28" stroke="' + DWOOD + '" stroke-width="3" fill="none" stroke-linecap="round"/>',
      '<g><ellipse cx="20" cy="26" rx="6" ry="8" fill="#fbf4f0" stroke="#e8b8c8"/><ellipse cx="32" cy="18" rx="6.4" ry="8.6" fill="#fff" stroke="#e8b8c8"/><ellipse cx="45" cy="22" rx="6" ry="8" fill="#fbf4f0" stroke="#e8b8c8"/><ellipse cx="26" cy="34" rx="5" ry="6.6" fill="#fff" stroke="#e8b8c8"/><ellipse cx="40" cy="33" rx="5" ry="6.6" fill="#fbf4f0" stroke="#e8b8c8"/></g>',
      '<g fill="#f0a8c0" opacity=".8"><ellipse cx="32" cy="22" rx="3" ry="4"/><ellipse cx="20" cy="30" rx="2.6" ry="3.4"/><ellipse cx="45" cy="26" rx="2.6" ry="3.4"/></g>'
    ]),
    rockery: w([
      '<path d="M6 56 Q8 40 16 38 Q18 26 28 24 Q32 12 40 18 Q48 18 50 30 Q58 36 58 56Z" fill="#8f989d"/>',
      '<path d="M16 38 Q22 40 24 50" stroke="#6b7479" stroke-width="1.6" fill="none"/><path d="M28 24 Q34 30 32 40" stroke="#6b7479" stroke-width="1.6" fill="none"/><path d="M50 30 Q44 34 46 46" stroke="#6b7479" stroke-width="1.6" fill="none"/>',
      '<ellipse cx="36" cy="44" rx="4.4" ry="6" fill="#4a5258"/><ellipse cx="20" cy="48" rx="2.8" ry="3.6" fill="#4a5258"/>',
      '<path d="M40 18 V8" stroke="' + DWOOD + '" stroke-width="1.8"/><path d="M34 12 Q40 5 46 12 Q40 9 34 12Z" fill="' + DGREEN + '"/><path d="M36 9 Q40 3 44 9Z" fill="' + GREEN + '"/>'
    ]),
    plum: w([
      '<path d="M30 58 Q28 44 34 36 Q38 30 32 22 M34 38 Q44 34 50 24 M31 46 Q22 40 16 30 M33 30 Q26 26 22 18" stroke="#3a2a26" stroke-width="3" fill="none" stroke-linecap="round"/>',
      '<g fill="#f08aa6"><circle cx="50" cy="24" r="3.4"/><circle cx="46" cy="30" r="3"/><circle cx="16" cy="30" r="3.4"/><circle cx="22" cy="36" r="3"/><circle cx="22" cy="18" r="3.4"/><circle cx="32" cy="22" r="3.4"/><circle cx="36" cy="14" r="3"/><circle cx="14" cy="22" r="2.6"/><circle cx="40" cy="32" r="2.6"/></g>',
      '<g fill="#fff3d0"><circle cx="50" cy="24" r="1"/><circle cx="16" cy="30" r="1"/><circle cx="22" cy="18" r="1"/><circle cx="32" cy="22" r="1"/></g>'
    ]),
    bamboo: w([
      '<g fill="#7fae5a"><rect x="12" y="6" width="5.4" height="52" rx="2"/><rect x="26" y="2" width="6" height="56" rx="2"/><rect x="42" y="8" width="5.4" height="50" rx="2"/></g>',
      '<g fill="#58863a"><rect x="12" y="18" width="5.4" height="2"/><rect x="12" y="34" width="5.4" height="2"/><rect x="12" y="48" width="5.4" height="2"/><rect x="26" y="14" width="6" height="2"/><rect x="26" y="30" width="6" height="2"/><rect x="26" y="46" width="6" height="2"/><rect x="42" y="20" width="5.4" height="2"/><rect x="42" y="36" width="5.4" height="2"/><rect x="42" y="50" width="5.4" height="2"/></g>',
      '<g fill="' + DGREEN + '"><path d="M17 20 q10 -6 14 -2 q-8 6 -14 2Z"/><path d="M32 30 q10 -6 16 -2 q-8 7 -16 2Z"/><path d="M12 36 q-8 -4 -8 -9 q8 1 8 9Z"/><path d="M47 22 q8 -6 12 -2 q-6 6 -12 2Z"/></g>'
    ]),
    sundial: w([
      '<path d="M14 52 H50 L46 58 H18Z" fill="' + DSTONE + '"/><rect x="26" y="44" width="12" height="9" fill="' + STONE + '"/>',
      '<ellipse cx="32" cy="38" rx="22" ry="9" fill="#c9d0d4" stroke="' + DSTONE + '"/><ellipse cx="32" cy="38" rx="17" ry="6.6" fill="#dfe4e6"/>',
      '<g stroke="#8a949a" stroke-width="1"><path d="M32 31.4 V33 M32 43 V44.6 M16 38 H18 M46 38 H48 M21 33 L22 34 M43 33 L42 34 M21 43 L22 42 M43 43 L42 42"/></g>',
      '<path d="M32 38 L40 14 L42 38Z" fill="' + RED + '" opacity=".95"/><path d="M42 38 L50 38 L42 34Z" fill="#00000022"/>'
    ]),
    crane: w([
      '<path d="M26 58 V44 M34 58 V46" stroke="#4a4f54" stroke-width="1.8"/>',
      '<path d="M18 44 Q24 30 36 32 Q44 34 46 42 Q40 48 28 48 Q20 48 18 44Z" fill="#fbfbf6"/>',
      '<path d="M44 38 L58 46 L48 44Z" fill="' + INK + '"/><path d="M18 44 Q12 42 8 46 Q14 50 22 46Z" fill="' + INK + '"/>',
      '<path d="M36 32 Q40 20 38 12" stroke="#fbfbf6" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="38" cy="11" r="3.4" fill="#fbfbf6"/><path d="M40 10 L50 8" stroke="#e8a63a" stroke-width="1.8" stroke-linecap="round"/><circle cx="37" cy="8.6" r="1.8" fill="' + RED + '"/><circle cx="38.6" cy="10.4" r=".8" fill="' + INK + '"/>',
      '<path d="M28 40 Q34 36 40 40" stroke="#d8d8cc" stroke-width="1.2" fill="none"/>'
    ]),
    inkstone: w([
      '<rect x="6" y="38" width="52" height="5" rx="1.4" fill="' + WOOD + '"/><path d="M10 43 V56 M54 43 V56" stroke="' + DWOOD + '" stroke-width="3.4"/>',
      '<path d="M16 38 L18 28 H34 L36 38Z" fill="#2c3238"/><ellipse cx="26" cy="31" rx="6" ry="2" fill="#0f1418"/><path d="M18 28 H34" stroke="#4a525a" stroke-width="1.2"/>',
      '<path d="M40 38 L56 20" stroke="#6b4a30" stroke-width="2.4" stroke-linecap="round"/><path d="M56 20 L60 16" stroke="#e8e2cc" stroke-width="3.2" stroke-linecap="round"/><path d="M40 38 L37 36" stroke="#1a1a1a" stroke-width="2" stroke-linecap="round"/>',
      '<rect x="8" y="34" width="12" height="4" rx=".8" fill="#f1e6c8" stroke="#b9a678"/>'
    ]),
    chess: w([
      '<rect x="12" y="26" width="40" height="26" rx="2" fill="#d9b878" stroke="' + DWOOD + '" stroke-width="1.6"/>',
      '<g stroke="#6b4a30" stroke-width="1"><path d="M18 26 V52 M24 26 V52 M30 26 V52 M36 26 V52 M42 26 V52 M48 26 V52"/><path d="M12 32 H52 M12 38 H52 M12 44 H52"/></g>',
      '<g><circle cx="24" cy="32" r="2.6" fill="' + INK + '"/><circle cx="36" cy="38" r="2.6" fill="#fbfbf6" stroke="#8a8a80" stroke-width=".6"/><circle cx="30" cy="44" r="2.6" fill="' + INK + '"/><circle cx="42" cy="32" r="2.6" fill="#fbfbf6" stroke="#8a8a80" stroke-width=".6"/><circle cx="18" cy="44" r="2.6" fill="#fbfbf6" stroke="#8a8a80" stroke-width=".6"/><circle cx="48" cy="44" r="2.6" fill="' + INK + '"/></g>',
      '<path d="M16 52 V57 M48 52 V57" stroke="' + DWOOD + '" stroke-width="3.4"/><ellipse cx="9" cy="48" rx="4" ry="3.4" fill="#4a3426"/><circle cx="9" cy="47" r="2.6" fill="#fbfbf6"/>'
    ]),
    taihu: w([
      '<path d="M16 58 Q10 44 16 34 Q14 22 24 16 Q28 6 36 10 Q44 8 46 20 Q54 26 50 38 Q56 50 48 58Z" fill="#a9b2b6"/>',
      '<path d="M16 34 Q24 36 24 44 M36 10 Q32 20 38 26 M46 20 Q42 28 46 34" stroke="#7b868b" stroke-width="1.6" fill="none"/>',
      '<ellipse cx="30" cy="30" rx="4.4" ry="6.4" fill="#2f383d"/><ellipse cx="42" cy="42" rx="3.4" ry="5" fill="#2f383d"/><ellipse cx="22" cy="46" rx="2.8" ry="3.8" fill="#2f383d"/><ellipse cx="38" cy="18" rx="2.4" ry="3" fill="#2f383d"/>',
      '<path d="M24 18 Q30 12 36 14" stroke="#d3dadd" stroke-width="2" fill="none" opacity=".8"/>'
    ]),
    bronze: w([
      '<path d="M16 22 H48 Q50 40 44 46 H20 Q14 40 16 22Z" fill="#6f9a82"/>',
      '<rect x="14" y="18" width="36" height="5" rx="2" fill="#86b098"/>',
      '<path d="M14 20 V10 Q14 6 18 6 M50 20 V10 Q50 6 46 6" stroke="#6f9a82" stroke-width="3.4" fill="none"/>',
      '<path d="M22 46 L18 57 M42 46 L46 57 M32 46 V57" stroke="#5a8670" stroke-width="4.4" stroke-linecap="round"/>',
      '<g stroke="#4a7560" stroke-width="1.6" fill="none"><path d="M20 28 h8 v4 h-8z M36 28 h8 v4 h-8z M28 36 h8"/></g>',
      '<path d="M18 24 Q18 36 22 42" stroke="#a8cdb4" stroke-width="1.6" fill="none" opacity=".7"/>'
    ]),
    bell: w([
      '<rect x="6" y="6" width="52" height="5" rx="1.4" fill="' + DWOOD + '"/><path d="M10 11 V56 M54 11 V56" stroke="' + WOOD + '" stroke-width="4"/><path d="M6 56 H58" stroke="' + DWOOD + '" stroke-width="4"/>',
      '<path d="M32 11 V16" stroke="#6b5a2a" stroke-width="3"/><path d="M22 18 Q22 14 32 14 Q42 14 42 18 Q46 34 50 44 H14 Q18 34 22 18Z" fill="#b8913a"/>',
      '<path d="M14 44 H50" stroke="#8a6a1a" stroke-width="2.4"/><path d="M24 24 Q23 34 20 42" stroke="#e8cc7a" stroke-width="1.8" fill="none" opacity=".8"/>',
      '<path d="M18 30 H46 M17 36 H47" stroke="#8a6a1a" stroke-width="1.2"/><circle cx="32" cy="48" r="3" fill="#6b5a2a"/>'
    ])
  };

  // 风格 B「工笔金线」:隐藏的 SVG 滤镜 + 样式。用法:把图标放进 class="estate-icon" 的容器即可(滤镜作用在容器内的 svg 上)。
  var GONG_FILTER = '<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0"><defs><filter id="estate-gong" x="-8%" y="-8%" width="116%" height="116%" color-interpolation-filters="sRGB"><feColorMatrix in="SourceGraphic" type="saturate" values="0.78" result="s"/><feComponentTransfer in="s" result="silk"><feFuncR type="linear" slope="0.94" intercept="0.05"/><feFuncG type="linear" slope="0.92" intercept="0.04"/><feFuncB type="linear" slope="0.82" intercept="0.02"/></feComponentTransfer><feMorphology in="SourceAlpha" operator="dilate" radius="1.1" result="e"/><feFlood flood-color="#a9812f"/><feComposite in2="e" operator="in" result="gold"/><feMorphology in="SourceAlpha" operator="dilate" radius="0.5" result="e2"/><feFlood flood-color="#4a3426"/><feComposite in2="e2" operator="in" result="dark"/><feMerge><feMergeNode in="gold"/><feMergeNode in="dark"/><feMergeNode in="silk"/></feMerge></filter></defs></svg>';
  function installStyle() {
    if (typeof document === 'undefined' || !document.body || document.getElementById('estate-art-defs')) return;
    try {
      var holder = document.createElement('div');
      holder.id = 'estate-art-defs';
      holder.setAttribute('aria-hidden', 'true');
      holder.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none';
      holder.innerHTML = GONG_FILTER;
      document.body.appendChild(holder);
      var st = document.createElement('style');
      st.textContent = '.estate-icon svg{filter:url(#estate-gong)}';
      document.head.appendChild(st);
    } catch (e) { /* 样式装不上:图标仍以原版显示 */ }
  }
  if (typeof document !== 'undefined') {
    if (document.body) installStyle();
    else document.addEventListener('DOMContentLoaded', installStyle);
  }

  window.ESTATE_ART = {
    annex: annex, decor: decor,
    get: function (kind, id) { var t = kind === 'annex' ? annex : decor; return Object.prototype.hasOwnProperty.call(t, id) ? t[id] : ''; }
  };
})();
