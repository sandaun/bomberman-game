document.onload = function() {
  const playButton = document.getElementById('playMe');
  const canvas = document.getElementById('bomberman');
  const playAgainButton = document.getElementById('playAgain');
  const playAgainWinButton = document.getElementById('playAgainwin');
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
    const begin = document.getElementById('begin');
    const canvasSection = document.getElementById('canvas');
    canvas.style = 'display: block';
    canvasSection.style = 'display: flex';
    begin.style = 'display: none';
  };

  game.start((points) => {
    console.log(points);
  });

  game.onGameOver = () => {
    const gameOver = document.getElementById('gameover');
    gameOver.style = 'display: block';
    gameOver.style = 'position: absolute';
  }

  game.onWinGame = () => {
    const youWin = document.getElementById('youwin');
    youWin.style = 'display: block';
    youWin.style = 'position: absolute';
  }

  playAgainButton.onclick = function () {
    location.reload(true);
  };

  playAgainWinButton.onclick = function () {
    location.reload(true);
  };

}();