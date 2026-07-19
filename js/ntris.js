// https://tetris.fandom.com/wiki/Tetris_Guideline

import {default as mu} from './mathutil.js'; 
import * as settings from './settings.js'; 
import * as controls from './controls.js'; 
import * as ts from './tetrominos.js'; 




var allpieces = ['.', 'i', 'l', 'd', '|', 'I', 'T', 'O', 'banana', 'unbanana', 'L', 'J', 'S', 'Z', 'V', 'F', 'R', 'II', 'X', 'random', 'madnor', 'FY', 'theBrick', 'brick2', 'random2', 'madnor2', 'D', 'F2', 'R2', 'X2', 'FYold', '[', 'W'].map(x => ts.tetrominos[x]); // i could do the effort of properly removing this, but i'm pretty sure we'll usurp the need for this list soon

function allorientations(matrix) {
  return [matrix,rotate(matrix),rotate(rotate(matrix)),rotate(rotate(rotate(matrix))), matrix.toReversed(), rotate(matrix.toReversed()), rotate(rotate(matrix.toReversed())), rotate(rotate(rotate(matrix.toReversed())))];
}

function padwithzeros(string) {
  let a = string;
  for (let i=0; i < 6 - string.length; i++) {
    a = '0' + a;
  }
  return a;
}

function colorDistance(a, b) {
  return Math.sqrt(
    (parseInt(a[1] + a[2], 16) - parseInt(b[1] + b[2], 16))**2 * 2.5 + 
    (parseInt(a[3] + a[4], 16) - parseInt(b[3] + b[4], 16))**2 * 5 + 
    (parseInt(a[5] + a[6], 16) - parseInt(b[5] + b[6], 16))**2 * 1.5);
}



var pause = false; 
var canvas = document.getElementById('game');
var context = canvas.getContext('2d');
var grid = 32;
var gridsmall = 20;
var tetrominoSequence = [];
var held = [];





function removeEdgeInf(array) {
  let boole = false;
  let half = [];
  for (let i=0; i < array.length; i++) {
    if (array[i] != Infinity) {
      boole = true;
    }
    if (boole) {half.push(array[i]);}
  }
  boole = false;
  let toret = [];
  for (let i=array.length - 1; i > -1; i--) {
    if (array[i] != Infinity) {
      boole = true;
    }
    if (boole) {toret.unshift(array[i]);}
  }
  return toret;
}

function bottom2numberA(bottom) {
  let toret = 0;
  for (let i=0; i<bottom.length; i++) {
    toret += (1 - 0.5 ** bottom[i]);
  }
  return Math.cbrt(toret / bottom.length) * 255;
} 

function bottom2numberB(bottom) {
  let toret = 0;
  for (let i=0; i<bottom.length; i++) {
    if ((i + bottom[i]) % 2 > 0) {
      toret += 255;
    } else {
      if ((i + bottom[i] + 1) % 2 > 0) {
        toret -= 255;
      }
    }
  }
  return (toret / bottom.length + 255) / 2;
}

function bottom2numberC(bottom) {
  let toret = 0;
  for (let i=0; i<bottom.length; i++) {
    toret += bottom[i] * i / bottom.length;
  }
  return (0.5 ** toret) * 255;
}



function matrix2color(matrix) {
  let matrices = [matrix, rotate(matrix), rotate(rotate(matrix)), rotate(rotate(rotate(matrix)))];
  let bottoms = matrices.map(matrice => removeEdgeInf(matrice.map(row => mu.minusonetoinf(row.indexOf(1)))));
  let A = mu.extremifiedaverage(bottoms.map(bottom => mu.zeroifnan(bottom2numberA(bottom))));
  let B = mu.extremifiedaverage(bottoms.map(bottom => mu.zeroifnan(bottom2numberB(bottom))));
  let C = mu.extremifiedaverage(bottoms.map(bottom => mu.zeroifnan(bottom2numberC(bottom))));
  return '#' + padwithzeros((Math.round(A) * 65536 + Math.round(B) * 256 + Math.round(C)).toString(16));
}


// keep track of what is in every cell of the game using a 2d array
// tetris playfield is 10x20, with a few rows offscreen
var playfield = [];

let count = 0;
var tetromino;
let rAF = null;  // keep track of the animation frame so we can cancel it
let gameOver = false;
let score = 0;
var holdcycleattempts = 0;
var piececount = 0;

var box = [];
var nextpieces = [];
var wadcmult = 1;

function restartGame() {
  box = [];
  for(let i = 0; i < allpieces.length; i++) {
    if (!(settings.game.mystery % 2**(i + 1) < 2**i)) {
      box.push(allpieces[i]);
    }
  }
  if (settings.user.wadc && settings.game.wrapAround) {wadcmult = 2} else {wadcmult = 1}
  grid = Math.round(Math.sqrt(204800 / (settings.game.boardWidth * settings.game.boardHeight * wadcmult)));
  gridsmall = Math.round(grid * 0.625);

  canvas.width = settings.game.boardWidth*grid*wadcmult + gridsmall * 11;
  canvas.height = (settings.game.boardHeight + (settings.game.stairs ? settings.game.boardWidth*wadcmult : 0))*grid;
  canvas = document.getElementById('game');
  context = canvas.getContext('2d');
  
  holdcycleattempts = 0;
  tetrominoSequence = [];

  playfield = [];
  // populate the empty state
  for (let row = -4-settings.game.boardWidth; row < settings.game.boardHeight + settings.game.boardWidth + 4; row++) {
    playfield[row] = [];
    if (row >= 0 && row < settings.game.boardHeight) {
      for (let col = 0; col < settings.game.boardWidth; col++) {
        if (settings.game.dual) {
          if (Math.abs(settings.game.boardHeight - row * 2 - 1/2) > settings.game.gr) {
            playfield[row][col] = (row > settings.game.boardHeight / 2) ? 'garbage' : 0; 
          } else {
            playfield[row][col] = [0, 'garbage'][(Math.random() < settings.game.garbagePercentage / 100) * 1];
          }

        } else {
          if (settings.game.boardHeight - row > settings.game.gr) {
            playfield[row][col] = 0;
          } else {
            playfield[row][col] = [0, 'garbage'][(Math.random() < settings.game.garbagePercentage / 100) * 1];
          }
        }
      }
    } else {
      for (let col = 0; col < settings.game.boardWidth; col++) {
        playfield[row][col] = (row > settings.game.boardHeight / 2) ? 'garbage' : 0; 
      }
    }
  }

  count = 0;
  tetromino = matrix2tetromino(getNextTetromino());
  nextpieces = [];
  held = [];
  for(let i=0;i<settings.game.nextPieces;i++) {
    nextpieces.push(getNextTetromino());
  }

  rAF = null;  // keep track of the animation frame so we can cancel it
  if (gameOver = true) {
    rAF = requestAnimationFrame(loop);
  }
  gameOver = false;
  score = 0;

  pause = false;
}

function noTouchy() {
  for (let row = -2; row < settings.game.boardHeight; row++) {
    for (let col = 0; col < settings.game.boardWidth; col++) {
      if (!isSocialDistancer(row,col)) {
        if ((isSocialDistancer(row,col+1) || isSocialDistancer(row,col-1) || isSocialDistancer(row+1,col) || isSocialDistancer(row-1,col))) {
          playfield[row][col] = 'nonsolid';
        } else {playfield[row][col] = FlipIfDual(false) ? 'garbage' : 0;}
      }
    }
  }
}

function isSocialDistancer(row,col) {
  if (-2 <= row && row < settings.game.boardHeight) {
    if (0 <= col && col < settings.game.boardWidth) {
      return FlipIfDual(!!playfield[row][col]) && (playfield[row][col] != 'nonsolid')
    } else {
      if (settings.game.wrapAround) {return isSocialDistancer(row, mu.modulo(col,settings.game.boardWidth));}
    }
  } else {return false;}
  
}

function spawningCol(piece) {
  // I and O start centered, all others start in left-middle
  return Math.floor((settings.game.boardWidth - piece[0].length) / 2);
}
function spawningRow(piece) {
  // I starts on row 21 (-1), all others start on row 22 (-2)
  return -1-piece.map(row => row.reduce((a, b) => 1 - (1-a) * (1-b))).lastIndexOf(1) + (settings.game.stairs ? (FlipIfDual(false) ? -spawningCol(piece) : spawningCol(piece)) : 0);
}

// generate a new tetromino sequence
// @see https://tetris.fandom.com/wiki/Random_Generator
function generateSequence() {
  let sequence = box.slice();

  while (sequence.length) {
    const rand = mu.getRandomInt(0, sequence.length - 1);
    const matrix = sequence.splice(rand, 1)[0];
    tetrominoSequence.push(matrix);
  }
}

// get the next tetromino in the sequence
function getNextTetromino() {
  if (tetrominoSequence.length === 0) {
    generateSequence();
  }

  const matrix = tetrominoSequence.pop();
  return matrix;
}

function matrix2tetromino(s) {

  let col = spawningCol(s);
  if (settings.game.wrapAround && !settings.user.wadc) {col = col + tetromino.col - spawningCol(tetromino.matrix);}
  
  let row = spawningRow(s) - (settings.game.stairs && settings.game.wrapAround && !settings.user.wadc ? (spawningCol(tetromino.matrix) - tetromino.col) * (FlipIfDual(false) ? -1 : 1) : 0);

  return {
    matrix: s,  // the piece shape, rotated
    row: row,        // row (starts offscreen)
    col: col         // column
  };
}

// rotate an NxN matrix 90deg
// @see https://codereview.stackexchange.com/a/186834
function rotate(matrix) {
  const N = matrix.length - 1;
  const result = matrix.map((row, i) =>
    row.map((val, j) => matrix[N - j][i])
  );

  return result;
}

// check to see if the new matrix/row/col is valid
function isValidMove(matrix, cellRow, cellCol) {
  for (let row = 0; row < matrix.length; row++) {
    for (let col = 0; col < matrix[row].length; col++) {
      if (matrix[row][col] && (
          // outside the game bounds
          ((cellCol + col < 0 ||
          cellCol + col >= settings.game.boardWidth) && !settings.game.wrapAround) ||
          (cellRow + row - (settings.game.stairs ? (cellCol + col) : 0)) >= settings.game.boardHeight ||
          // collides with another piece
          isCollidable(playfield[FlipIfDual(cellRow + row) - (settings.game.stairs ? (cellCol + col) : 0)][mu.modulo(cellCol + col, settings.game.boardWidth)]))
        ) {
        return false;
      }
    }
  }

  return true;
}

function isCollidable(cell) {
  if (FlipIfDual(false)) {
    return cell == 'nonsolid' || !cell; 
  } else {
    return !!cell
  }
}

function nexttetromino() {
  holdcycleattempts = 0;
  piececount += 1;
  nextpieces.push(getNextTetromino());
  tetromino = matrix2tetromino(nextpieces[0]);
  nextpieces.splice(0, 1);
}

let scoreincrease = 1;
function increasescore() {
  score += scoreincrease;
  scoreincrease = scoreincrease + settings.game.scoreAcceleration;
}

function droprowsaboverow(row) {
  for (let r = row; r >= 0; r--) {
    for (let c = 0; c < playfield[r].length; c++) {
      playfield[r][c] = playfield[r-1][c];
    }
  }
  increasescore();
}

function raiserowsbelowrow(row) {
  for (let r = row; r < settings.boardHeight - 1; r++) {
    for (let c = 0; c < playfield[r].length; c++) {
      playfield[r][c] = playfield[r+1][c];
    }
  }
  increasescore();
}

// place the tetromino on the playfield
function placeTetromino() {
  for (let row = 0; row < tetromino.matrix.length; row++) {
    for (let col = 0; col < tetromino.matrix[row].length; col++) {
      if (tetromino.matrix[row][col]) {

        // game over if piece has any part offscreen
        let playrow = FlipIfDual(tetromino.row + row) - (settings.game.stairs ? tetromino.col + col : 0);
        if (playrow < 0 || playrow >= settings.game.boardHeight) {
          return showGameOver();
        }

        playfield[playrow][mu.modulo((tetromino.col + col),settings.game.boardWidth)] = FlipIfDual(false) ? 0 : tetromino.matrix;
      }
    }
  }
  if (settings.game.sd) {noTouchy();}
  scoreincrease = 1;
  // check for line clears starting from the bottom and working our way up
  if (!settings.game.dual) {
    for (let row = settings.game.boardHeight - 1; row >= 0; ) {
      if (playfield[row].filter(cell => !cell).length <= settings.game.closeEnough) {
        if (settings.game.rgr && playfield[row].filter(cell => cell == 'garbage').length > 0) {
          // raise every row below this one
          raiserowsbelowrow(row);
          playfield[settings.game.boardHeight - 1] = playfield[settings.game.boardHeight - 1].map(cell => (Math.random() * 100 > settings.game.garbagePercentage ? 0 : 'garbage'));
        } else {
          // drop every row above this one
          droprowsaboverow(row);

        }
      }
      else {
        row--;
      }
    }
  } else {
    let thebool = false;
    for (let row = settings.game.boardHeight - 1; row >= 0; row--) {
      if (playfield[FlipIfDual(row)].filter(cell => !isCollidable(cell)).length <= settings.game.closeEnough) {
        if (thebool) {
        // drop every row above this one
          FlipIfDual(false) ? droprowsaboverow(settings.game.boardHeight - 1 - row) : raiserowsbelowrow(row);
        }  
      } else {thebool = true;}
    }
  }
  if (settings.game.sd) {noTouchy();}
  nexttetromino();
}

function FlipIfDual(k) {
  if (typeof k == "number") {
    return ((piececount % 2 == 1) && settings.game.dual) ? (settings.game.boardHeight - 1 - k) : k
  } else {
    return ((piececount % 2 == 1) && settings.game.dual) ^ k
  }
}
// show the game over screen
function showGameOver() {
  cancelAnimationFrame(rAF);
  gameOver = true;

  context.fillStyle = 'black';
  context.globalAlpha = 0.75;
  context.fillRect(0, canvas.height / 2 - 30, canvas.width, 60);

  context.globalAlpha = 1;
  context.fillStyle = 'white';
  context.font = '36px monospace';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText('GAME OVER!', canvas.width / 2, canvas.height / 2);
}

// game loop
function loop() {
  rAF = requestAnimationFrame(loop);
  if(pause) { return; }

  context.clearRect(0,0,canvas.width,canvas.height);

  context.strokeStyle = "white";
  context.strokeWidth = 2;
  let drawnWidth = settings.game.boardWidth*wadcmult;
  if (settings.game.stairs) {
    context.beginPath();
    context.moveTo(gridsmall * 5.5, 0);
    for (let i = 0; i < drawnWidth; i++) {
      context.lineTo(gridsmall * 5.5 + grid * (i+1), grid * i);
      context.lineTo(gridsmall * 5.5 + grid * (i+1), grid * (i + 1));
    }
    context.lineTo(gridsmall * 5.5 + grid * drawnWidth, grid * (drawnWidth + settings.game.boardHeight - 1));
    for (let i = 0; i < drawnWidth; i++) {
      context.lineTo(gridsmall * 5.5 + grid * (drawnWidth - (i+1)), grid * (drawnWidth + settings.game.boardHeight - (i+1)));
      context.lineTo(gridsmall * 5.5 + grid * (drawnWidth - (i+1)), grid * (drawnWidth + settings.game.boardHeight - (i+2)));
    }
    context.closePath();
    context.stroke();
  } else {
    context.strokeRect(gridsmall * 5.5,0,drawnWidth*grid,settings.game.boardHeight*grid);
  }
  // draw the playfield

  for (let row = 0; row < settings.game.boardHeight; row++) {
    for (let col = 0; col < settings.game.boardWidth; col++) {
      if (playfield[row][col]) {
        const name = playfield[row][col];
        context.fillStyle = (name == 0 || name == 'garbage' || name == 'nonsolid') ? (ts.colors[name]) : matrix2color(name);
        // drawing 1 px smaller than the grid creates a grid effect
        if (settings.game.wrapAround) {
          if (settings.user.wadc) {
            context.fillRect(col * grid + gridsmall * 5.5, row * grid + (settings.game.stairs ? (col * grid) : 0), grid-1, grid-1);
            context.fillRect((col + settings.game.boardWidth) * grid + gridsmall * 5.5, row * grid + (settings.game.stairs ? ((col + settings.game.boardWidth) * grid) : 0), grid-1, grid-1);
          } else {
            context.fillRect(mu.modulo(col - tetromino.col + spawningCol(tetromino.matrix),settings.game.boardWidth) * grid + gridsmall * 5.5, row * grid + (settings.game.stairs ? (mu.modulo(col - tetromino.col + spawningCol(tetromino.matrix),settings.game.boardWidth) * grid) : 0), grid-1, grid-1);
          }
        } else {
          context.fillRect(col * grid + gridsmall * 5.5, row * grid + (settings.game.stairs ? (col * grid) : 0), grid-1, grid-1);
        }
      }
    }
  }

  // draw the active tetromino
  if (tetromino) {

    // tetromino falls every 35 frames, but they get faster as you score
    if (++count > (settings.game.fallingSpeed / (settings.game.fa ** score))) {
      tetromino.row++;
      count = 0;

      // place piece if it runs into anything
      if (!isValidMove(tetromino.matrix, tetromino.row, tetromino.col)) {
        tetromino.row--;
        placeTetromino();
      }
    }

    context.fillStyle = FlipIfDual(false) ? 'black' : matrix2color(tetromino.matrix);

    for (let row = 0; row < tetromino.matrix.length; row++) {
      for (let col = 0; col < tetromino.matrix[row].length; col++) {
        if (tetromino.matrix[row][col]) {

          // drawing 1 px smaller than the grid creates a grid effect
          if (settings.game.wrapAround) {
            if (settings.user.wadc) {
              context.fillRect((mu.modulo(col + tetromino.col,settings.game.boardWidth)) * grid + gridsmall*5.5, FlipIfDual(tetromino.row + row) * grid, grid-1, grid-1);
              context.fillRect((mu.modulo(col + tetromino.col,settings.game.boardWidth) + settings.game.boardWidth) * grid + gridsmall*5.5, FlipIfDual(tetromino.row + row) * grid, grid-1, grid-1);
            } else {
            // I am aware that if the tetromino is wider than the grid, it renders out of bounds. I don't care
              context.fillRect((col + spawningCol(tetromino.matrix)) * grid + gridsmall*5.5, (FlipIfDual(tetromino.row + row + (settings.game.stairs ? spawningRow(tetromino.matrix) + 2 : 0)) - (settings.game.stairs ? tetromino.col : 0)) * grid, grid-1, grid-1);
            }
          } else {
            context.fillRect((col + tetromino.col) * grid + gridsmall*5.5, FlipIfDual(tetromino.row + row) * grid, grid-1, grid-1);
          }
        }
      }
    }
  }
  // draw the next tetrominoes
  for (let i=0;i<settings.game.nextPieces;i++) {

    context.fillStyle = matrix2color(nextpieces[i]);
    for (let row = 0; row < nextpieces[i].length; row++) {
      for (let col = 0; col < nextpieces[i][row].length; col++) {
        if (nextpieces[i][row][col]) {

          // drawing it smaller to indicate that it isn't right now
          context.fillRect((spawningCol(nextpieces[i]) + col + 8.5 - settings.game.boardWidth / 2) * gridsmall + settings.game.boardWidth * grid * wadcmult, (row + 8.5 + i*4 - nextpieces[i].length / 2) * gridsmall, gridsmall-1, gridsmall-1);
        }
      }
    }
  }

  context.fillStyle = 'darkslategray';
  context.fillRect(0, 4.5 * gridsmall, 5.5 * gridsmall, settings.game.heldPieces * 4 * gridsmall);

  // draw the held tetrominoes
  for (let i=0;i<settings.game.heldPieces;i++) {
    if (held[i]) {
      context.fillStyle = matrix2color(held[i]);

      for (let row = 0; row < held[i].length; row++) {
        for (let col = 0; col < held[i][row].length; col++) {
          if (held[i][row][col]) {

          // drawing it smaller to indicate that it isn't right now
            context.fillRect((spawningCol(held[i]) + col + 3 - settings.game.boardWidth / 2) * gridsmall, (spawningRow(held[i]) + row + 8.5 + (settings.game.heldPieces-1-i)*4 - held[i].length / 2) * gridsmall, gridsmall-1, gridsmall-1);
          }
        }
      }
    }
  }
  // draw the score
  context.fillStyle = 'white';
  context.font = '36px monospace';
  context.textAlign = 'right';
  context.textBaseline = 'middle';
  context.fillText(score, settings.game.boardWidth * grid * wadcmult + gridsmall * 11, 20);

  context.font = '36px monospace';
  context.textAlign = 'left';
  if(settings.game.closeEnough > 0) {
    context.fillText("AH: " + settings.game.closeEnough, 0, 20);
  }
  if(settings.game.flipping) {
    context.fillText("Flip", 0, 56);
  }

}

function controlsOff() {
  if (gameOver) return true;
  if (pause)    return true;
  return false; 
}

export function pieceLeft() {
  if (controlsOff()) return;

  if (isValidMove(tetromino.matrix, tetromino.row, tetromino.col + 1)) {
    tetromino.col++;
  }
}

export function pieceRight() {
  if (controlsOff()) return;

  if (isValidMove(tetromino.matrix, tetromino.row, tetromino.col - 1)) {
    tetromino.col--;
  }
}

export function pieceRotate() {
  if (controlsOff()) return;

  const matrix = (FlipIfDual(false) && !settings.user.roateDual) ? rotate(rotate(rotate(tetromino.matrix))) : rotate(tetromino.matrix);
  if (isValidMove(matrix, tetromino.row, tetromino.col)) {
    tetromino.matrix = matrix;
  }
}

export function pieceDown() {
  if (controlsOff()) return;

  const row = tetromino.row + 1;
  if (!isValidMove(tetromino.matrix, row, tetromino.col)) {
    tetromino.row = row - 1;

    placeTetromino();
    return;
  }
  tetromino.row = row;
}

export function pieceFlip() {
  if (controlsOff()) return;

  if (settings.game.flipping) {
    const matrix = tetromino.matrix.map(sdrvg => sdrvg.toReversed());
    if(isValidMove(matrix,tetromino.row,tetromino.col)) {
      tetromino.matrix = matrix;
    }
  }
}

export function pieceHold() {
  document.getElementById("settingsButton").blur(); // this one is necessary
  if (settings.game.heldPieces > 0 && holdcycleattempts < settings.game.heldPieces) {
    held.splice(0, 0, tetromino.matrix);
    holdcycleattempts++;
    if (held.length > settings.game.heldPieces) {
      tetromino = matrix2tetromino(held.pop());
    } else {
      nexttetromino();
    }
  }
}



// start the game
rAF = requestAnimationFrame(loop);

restartGame();

document.addEventListener("DOMContentLoaded", function() {
  document.getElementById(       "settingsButton").addEventListener("click", function() { settings.showSettings(); pause=true; }); 
  document.getElementById(           "helpButton").addEventListener("click", function() { controls.showControls(); pause=true; });
  document.getElementById("settingsShuffleButton").addEventListener("click", function() { settings.randomizeSettings(allpieces); 
                                                                                          settings.showSettings(); 
                                                                                        }); 
  document.getElementById(  "settingsResetButton").addEventListener("click", function() { settings.resetSettings(); 
                                                                                           settings.showSettings();     });
  document.getElementById(   "settingsHideButton").addEventListener("click", function() { settings.hideSettings(); pause=false; }); 
  document.getElementById(   "settingsSaveButton").addEventListener("click", function() { settings.saveSettings(); 
                                                                                           restartGame(); pause=false; });
  document.getElementById(   "controlsHideButton").addEventListener("click", function() { controls.hideControls(); pause=false; }); 

  restartGame();
});

