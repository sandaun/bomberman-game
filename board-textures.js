function createBoardTextures() {
  function makeTile(paint) {
    const tile = document.createElement('canvas');
    tile.width = 25;
    tile.height = 25;
    paint(tile.getContext('2d'));
    return tile;
  }

  const groundTiles = Array.from({ length: 4 }, (_, variant) => makeTile((ctx) => {
    ctx.fillStyle = '#46984f';
    ctx.fillRect(0, 0, 25, 25);
    for (let i = 0; i < 9; i += 1) {
      const x = (i * 11 + variant * 7 + 3) % 23;
      const y = (i * 7 + variant * 11 + 4) % 23;
      ctx.fillStyle = i % 2 ? '#42934b' : '#4b9c53';
      ctx.fillRect(x, y, 2, 1);
      ctx.fillRect(x + 1, y + 1, 1, 1);
    }
  }));

  const stoneTile = makeTile((ctx) => {
    ctx.fillStyle = '#354b50';
    ctx.fillRect(0, 0, 25, 25);
    ctx.fillStyle = '#71888c';
    ctx.fillRect(1, 1, 23, 20);
    ctx.fillStyle = '#99adae';
    ctx.fillRect(1, 1, 23, 2);
    ctx.fillRect(1, 3, 1, 17);
    ctx.fillStyle = '#536b72';
    ctx.fillRect(2, 9, 22, 2);
    ctx.fillRect(11, 3, 2, 6);
    ctx.fillRect(6, 11, 2, 9);
    ctx.fillRect(19, 11, 2, 9);
    ctx.fillStyle = '#81999b';
    ctx.fillRect(3, 3, 7, 1);
    ctx.fillRect(14, 3, 8, 1);
    ctx.fillRect(9, 11, 9, 1);
    ctx.fillStyle = '#607b80';
    ctx.fillRect(3, 7, 7, 1);
    ctx.fillRect(14, 7, 8, 1);
    ctx.fillRect(9, 18, 9, 1);
    ctx.fillStyle = '#405a62';
    ctx.fillRect(23, 3, 1, 18);
    ctx.fillRect(1, 21, 23, 2);
    ctx.fillStyle = '#293f45';
    ctx.fillRect(0, 23, 25, 2);
  });

  const woodTile = makeTile((ctx) => {
    ctx.fillStyle = '#54371f';
    ctx.fillRect(1, 1, 23, 23);
    ctx.fillStyle = '#bd8845';
    ctx.fillRect(2, 2, 21, 20);
    ctx.fillStyle = '#a57138';
    ctx.fillRect(8, 4, 5, 16);
    ctx.fillRect(19, 4, 3, 16);
    ctx.fillStyle = '#79502b';
    for (const x of [7, 13, 18]) ctx.fillRect(x, 4, 1, 16);
    ctx.fillStyle = '#d19c57';
    for (const x of [3, 9, 15, 20]) ctx.fillRect(x, 5, 1, 13);
    ctx.fillRect(2, 2, 21, 2);
    ctx.fillStyle = '#8c602e';
    ctx.fillRect(2, 19, 21, 3);
    ctx.fillRect(21, 4, 2, 15);
    ctx.fillStyle = '#d19c57';
    ctx.fillRect(3, 19, 18, 1);
    ctx.fillStyle = '#664421';
    ctx.fillRect(2, 22, 21, 2);
    for (const [x, y] of [[3, 3], [20, 3], [3, 20], [20, 20]]) {
      ctx.fillStyle = '#523b28';
      ctx.fillRect(x, y, 2, 1);
    }
    ctx.fillStyle = '#aa783e';
    for (const [x, y] of [[4, 9], [10, 14], [15, 7], [16, 15]]) ctx.fillRect(x, y, 2, 1);
  });

  return { ground: groundTiles, wall: stoneTile, breakable: woodTile };
}

window.createBoardTextures = createBoardTextures;
