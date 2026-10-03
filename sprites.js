// Sprites 16x16 em matrizes de caracteres -> pixel art 8-bit
// Cada letra = uma cor na paleta de cada sprite
"use strict";

const SPRITES = {
  player: {
    palette: { B:"#00e5ff", W:"#ffffff", R:"#ff3355", D:"#0a2a33", ".":null },
    map: [
      ".......WW.......",
      ".......WW.......",
      "......BWWB......",
      "......BWWB......",
      "......BWWB......",
      ".....BBWWBB.....",
      ".....BBWWBB.....",
      "....BBBWWBBB....",
      "....BBBWWBBB....",
      "..R.BBBWWBBBR...",
      "..RRBBBWWBBRR...",
      ".BRRBBWWWWBRRB..",
      ".BRBBBWWWWBBBRB.",
      "BBBRBWWWWWRBRBBB",
      "WBBRBWWWWWRBRBBW",
      "WBBRRRWWWWRRRBBW",
    ]
  },
  // 1 - Hamburguer voador
  burger: {
    palette: { T:"#e8a33d", S:"#7a4a12", G:"#39d353", R:"#ff4040", Y:"#ffe600", W:"#fff2c9", ".":null },
    map: [
      ".....TTTTTT.....",
      "....TTTTTTTT....",
      "...TTWTWTTTT....",
      "....TTTTTTTT....",
      "...SSSSSSSSSS...",
      "..SRRGGYYRRGGS..",
      "..SRRGGYYRRGGS..",
      ".SSSSSSSSSSSSSS.",
      ".TTTTTTTTTTTTTT.",
      ".TTTTTTTTTTTTTT.",
      "..TTTTTTTTTTTT..",
      "................",
      ".....R....R.....",
      "................",
      "................",
      "................",
    ]
  },
  // 2 - Bolacha / Biscoito
  cookie: {
    palette: { T:"#d89a4e", D:"#6b3d0f", C:"#2b1500", W:"#fff2c9", ".":null },
    map: [
      "....TTTTTTTT....",
      "..TTTTTTTTTTTT..",
      ".TTWTTTTTTTTTTT.",
      ".TTTTCDTTTTDTTT.",
      "TTTTTTCDTTTTTCTT",
      "TTTTTTTTTTTTTTTT",
      "TTTTDTTTTCTTTTTT",
      "TTTTTTTTTTTTTTTT",
      "TTTTCTTTTDTTTTTT",
      "TTTTTTTTTTTTDTTT",
      ".TTTTDTTTTTTTTTT",
      ".TTTTTTTTCTTTTT.",
      "..TTTTTTTTTTTT..",
      "....TTTTTTTT....",
      "................",
      "................",
    ]
  },
  // 3 - Ferro de passar
  iron: {
    palette: { M:"#c0c8d0", D:"#5a6470", H:"#222831", R:"#ff2020", Y:"#ffe600", ".":null },
    map: [
      ".....HHHH.......",
      ".....HHHH.......",
      "...DDDDDDDDD....",
      "..DMMMMMMMMMMD..",
      "..DMMMDMMMMMMMD.",
      ".DMMMMDMMMMMMMMD",
      ".DMMMMDMMMMMMMMM",
      "DMMMMMDMMMMMMMMM",
      "DMMMMMMMMMMMMMMR",
      "DMMMMMMMMMMMMMRR",
      "DMMMMMMMMMMMMMRR",
      "DDDDDDDDDDDDDDDR",
      ".YYYYYYYYYYYYYY.",
      "................",
      "................",
      "................",
    ]
  },
  // 4 - Gravata borboleta
  bowtie: {
    palette: { R:"#ff2060", P:"#ff8ab3", D:"#7a0030", Y:"#ffe600", ".":null },
    map: [
      "................",
      "RRR........RRR..",
      "RRRRR....RRRRR..",
      "RPRRRRYYRRRRPR..",
      "RPPRRRYYYYRRPPR.",
      "RPPPRRYYYYRRPPPR",
      "RPPPRRYYYYRRPPPR",
      "RPPRRRYYYYRRPPR.",
      "RPRRRRYYRRRRPR..",
      "RRRRR....RRRRR..",
      "RRR........RRR..",
      "................",
      "................",
      "................",
      "................",
      "................",
    ]
  },
  // 5 - Diamante
  diamond: {
    palette: { C:"#7df9ff", W:"#ffffff", B:"#0066ff", D:"#0033aa", ".":null },
    map: [
      "......WWWW......",
      ".....WCCCCW.....",
      "....WCCCCCCW....",
      "...WCCCWWCCCW...",
      "..WCCWWWWWWCCW..",
      ".WCCWWCCCCWWCCW.",
      ".WCCWCCCCCCWCCW.",
      "..WCWCCCCCCWCW..",
      "...WWCCCCCCWW...",
      "....WCCCCCCW....",
      ".....WCCCCW.....",
      "......WCCW......",
      ".......WW.......",
      "................",
      "................",
      "................",
    ]
  }
};

const ENEMY_ORDER = ["burger", "cookie", "iron", "bowtie", "diamond"];
const ENEMY_NAMES = { burger:"HAMBÚRGUER", cookie:"BOLACHA", iron:"FERRO", bowtie:"GRAVATA", diamond:"DIAMANTE" };
const ENEMY_COLORS = { burger:"#e8a33d", cookie:"#d89a4e", iron:"#c0c8d0", bowtie:"#ff2060", diamond:"#7df9ff" };

function drawSprite(ctx, def, x, y, scale=1, flash=false) {
  const map = def.map, pal = def.palette;
  for (let r=0; r<map.length; r++) {
    const row = map[r];
    for (let c=0; c<row.length; c++) {
      const ch = row[c];
      if (ch==="." ) continue;
      let col = pal[ch];
      if (!col) continue;
      if (flash) col = "#ffffff";
      ctx.fillStyle = col;
      ctx.fillRect(Math.round(x+c*scale), Math.round(y+r*scale), scale, scale);
    }
  }
}
