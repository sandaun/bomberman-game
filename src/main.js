document.onload = function() {
  const playButton = document.getElementById('playMe');
  const begin = document.getElementById('begin');
  const canvas = document.getElementById('bomberman');
  const ctx = canvas.getContext('2d');
  const widthCell = 10;
  
  playButton.onclick = letsPlay;

  const game = new Game({
    rows: canvas.width / widthCell,
    columns: canvas.height / widthCell,
    player: new Player(canvas.width / widthCell, canvas.height / widthCell),
    ctx: ctx
  });

  function letsPlay () {
    canvas.style = 'display: block';
    begin.style = 'display: none';
    game.drawBoard();
    game.drawPlayer();
  }

  // game.start((points) => {
  //   console.log(points);
  // });

  // game.onGameOver = () => {
  //   let gameOver = document.getElementById('gameover');
  //   canvas.style = 'display: none';
  //   gameOver.style = 'display: block';
  // }

}();