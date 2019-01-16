document.onload = function() {
  const playButton = document.getElementById('playMe');
  const begin = document.getElementById('begin');
  const canvas = document.getElementById('bomberman');
  const playAgainButton = document.getElementById('playAgain');
  const gameOver = document.getElementById('gameover');
  const ctx = canvas.getContext('2d');
  const widthCell = 50;

  const game = new Game({
    widthCell: widthCell,
    columns: canvas.width / widthCell,
    rows: canvas.height / widthCell,
    // player: new Player(canvas.width / widthCell, canvas.height / widthCell),
    ctx: ctx
  });

  // canvas.style = 'display: block'; // DELETE WHEN GAME IS READY AND UNCOMMENT LINES BELOW: PLAYBUTTON.ONCLICK
  // begin.style = 'display: none';

  playButton.onclick = function () {
    canvas.style = 'display: block';
    begin.style = 'display: none';
  };

  game.start((points) => {
    console.log(points);
  });

  game.onGameOver = () => {
    // canvas.style = 'display: none';
    gameOver.style = 'display: block';
    gameOver.style = 'position: absolute';
  }

  playAgainButton.onclick = function () {
    location.reload(true);
  };

}();