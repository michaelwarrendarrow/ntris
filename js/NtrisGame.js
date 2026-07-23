import {default as mu} from './mathutil.js'; 
import * as settings from './settings.js'; 
import * as controls from './controls.js'; 
import * as ts from './tetrominos.js'; 
import * as color from './color.js'; 
import * as gc from './GridCell.js'; 
import * as tf from './TetrominoFactory.js'; 

export default class NtrisGame {
	constructor(gameSettings=null, userSettings=null) {
		if(gameSettings) { this.gsettings = gameSettings; } 
		else             { this.gsettings = settings.game; }

		if(userSettings) { this.usettings = userSettings;  }
		else             { this.usettings = settings.user; }

		
		// Screen
		this.rAF = null; // Animation frame
		this.canvas = document.getElementById('game');
		this.context = this.canvas.getContext('2d');
		this.grid = 32;
		this.gridsmall = 20; 
		this.wadcmult = 1; 
		this.loop = this.loop.bind(this); 

		// Game pieces
		this.playfield = null; 
		this.tetromino = null; // Currently falling tetromino
		this.lookAhead = null;
		this.held      = null; 
		this.tetrominoFactory = null; 
		this.movingDown = false; // I didn't want to have this as a parameter in the tryValidMove function

		// Game modes
		this.gamePaused = true;
		this.gameOver = false; 

		// Counters & stats 
		this.score = 0;
		this.framesUntilMove = 0; 
		this.pieceCount = 0;
		this.frameCount = 0; 
		this.holdcycleattempts = 0; 
		this.wrapAroundCol = 0; 


	}

	/// Screen stuff
	startAnimation() {
		if(this.rAF) { cancelAnimationFrame(this.rAF); }
		this.rAF = requestAnimationFrame(this.loop);
	}

	stopAnimation() {
		cancelAnimationFrame(this.rAF);
	}

	calculateCanvasSize() {
		let width = settings.game.boardWidth*this.grid*this.wadcmult + this.gridsmall * 11;
		let height = (settings.game.boardHeight + (settings.game.stairs ? settings.game.boardWidth*this.wadcmult : 0))*this.grid;

		return([width, height]); 
	}

	resizeCanvas() {
	  if (settings.user.wadc && settings.game.wrapAround) {this.wadcmult = 2} else {this.wadcmult = 1}

	  this.grid = Math.round(Math.sqrt(204800 / (settings.game.boardWidth * settings.game.boardHeight * this.wadcmult)));

	  let windowHeight = document.documentElement.clientHeight*0.9; // 0.9 to leave some margin
	  let windowWidth  = document.documentElement.clientWidth*0.9;
	  let canvasWidth, canvasHeight;
	  [canvasWidth, canvasHeight] = this.calculateCanvasSize(); 

	  let fixWidth = 1, fixHeight = 1; 
	  if(canvasWidth  > windowWidth  && canvasWidth  != 0) { fixWidth = windowWidth / canvasWidth; }
	  if(canvasHeight > windowHeight && canvasHeight != 0) { fixHeight = windowHeight / canvasHeight; }

	  let fixGrid = Math.min(fixWidth, fixHeight);
	  if(fixGrid < 1) { this.grid *= fixGrid; }
	  this.gridsmall = Math.round(this.grid * 0.625);

	  [canvasWidth, canvasHeight] = this.calculateCanvasSize(); 

	  this.canvas.width = canvasWidth;
	  this.canvas.height = canvasHeight;
	  this.canvas = document.getElementById('game');
	  this.context = this.canvas.getContext('2d');
	}

	draw() {

	  	this.context.clearRect(0,0,this.canvas.width,this.canvas.height);

		this.drawOutline(); 
		this.drawPlayfield();
		this.drawFallingTetromino();
		this.drawHeld();
		this.drawNextTetrominos();
		this.drawScore(); 
	}

	drawOutline() {
	  let context   = this.context;
	  let canvas    = this.canvas; 
	  let gridsmall = this.gridsmall; 
	  let grid      = this.grid; 

	  context.strokeStyle = "white";
	  context.strokeWidth = 2;
	  let drawnWidth = settings.game.boardWidth*this.wadcmult;
	  if (settings.game.stairs) {
	    context.beginPath();
	    context.moveTo(gridsmall * 5.5, grid * settings.game.boardHeight);
	    context.lineTo(gridsmall * 5.5, 0);
	    for (let i = 0; i < drawnWidth; i++) {
	      context.lineTo(gridsmall * 5.5 + grid * (i+1), grid * i);
	      context.lineTo(gridsmall * 5.5 + grid * (i+1), grid * (i + 1));
	    }
	    context.lineTo(gridsmall * 5.5 + grid * drawnWidth, grid * (drawnWidth + settings.game.boardHeight - 1));
	    context.stroke();
	    if (settings.game.floorIsLava) {context.strokeStyle = "red";}
	    context.beginPath();
	    context.moveTo(gridsmall * 5.5 + grid * drawnWidth, grid * (drawnWidth + settings.game.boardHeight - 1));
	    for (let i = 0; i < drawnWidth; i++) {
	      context.lineTo(gridsmall * 5.5 + grid * (drawnWidth - (i+1)), grid * (drawnWidth + settings.game.boardHeight - (i+1)));
	      context.lineTo(gridsmall * 5.5 + grid * (drawnWidth - (i+1)), grid * (drawnWidth + settings.game.boardHeight - (i+2)));
	    }
	    context.stroke();
	  } else {
	  	context.beginPath();
	  	context.moveTo(gridsmall * 5.5, grid * settings.game.boardHeight);
	  	context.lineTo(gridsmall * 5.5, 0);
	  	context.lineTo(gridsmall * 5.5 + grid * drawnWidth, 0);
	  	context.lineTo(gridsmall * 5.5 + grid * drawnWidth, grid * settings.game.boardHeight);
	  	context.stroke();
	  	if (settings.game.floorIsLava) {context.strokeStyle = "red";}
	  	context.beginPath();
	  	context.moveTo(gridsmall * 5.5, grid * settings.game.boardHeight);
	  	context.lineTo(gridsmall * 5.5 + grid * drawnWidth, grid * settings.game.boardHeight);
	    context.stroke();
	  }
	}

	drawPlayfield() {
		let context = this.context; 
		let playfield = this.playfield;
		let grid = this.grid;
		let gridsmall = this.gridsmall;
		let tetromino = this.tetromino;

		for (let row = 0; row < settings.game.boardHeight; row++) {
		    for (let col = 0; col < settings.game.boardWidth; col++) {
		      if (! this.playfield[row][col].isEmpty()) {
		        let cell = playfield[row][col];
		        context.fillStyle = cell.getColor();
		        // drawing 1 px smaller than the grid creates a grid effect
		        if (settings.game.wrapAround) {
		          if (settings.user.wadc) {
		          	// TODO 
		            context.fillRect(col * grid + gridsmall * 5.5, row * grid + (settings.game.stairs ? (col * grid) : 0), grid-1, grid-1);
		            context.fillRect((col + settings.game.boardWidth) * grid + gridsmall * 5.5, row * grid + (settings.game.stairs ? ((col + settings.game.boardWidth) * this.grid) : 0), this.grid-1, this.grid-1);
		          } else {
		            context.fillRect(mu.modulo(col - tetromino.col + this.spawningCol(tetromino),settings.game.boardWidth) * this.grid + this.gridsmall * 5.5, row * this.grid + (settings.game.stairs ? (mu.modulo(col - tetromino.col + this.spawningCol(tetromino),settings.game.boardWidth) * grid) : 0), grid-1, grid-1);
		          }
		        } else {
		          context.fillRect(col * grid + gridsmall * 5.5, row * grid + (settings.game.stairs ? (col * grid) : 0), grid-1, grid-1);
		        }
		      }
		    }
		}
	}

	drawFallingTetromino() {
		let tetromino = this.tetromino;
		let x, y, gridsize;
		let tetcolor = this.FlipIfDual(false) ? 'black' : '';

		let opts = {drawAsDual: this.FlipIfDual(false), gridLeft: this.gridsmall*5.5, gridRight: this.gridsmall*5.5 + settings.game.boardWidth*this.grid};
		if(! settings.game.wrapAround) {
			opts["gridWrap"] = false; 

			x = tetromino.col * this.grid + this.gridsmall*5.5; 
			y = this.FlipIfDual(tetromino.row) * this.grid;
			gridsize = this.grid; 

			tetromino.paint(this.context, x, y, gridsize, tetcolor, 1, opts); 
		} else {
		  opts["gridWrap"] = true; 
		  if (settings.user.wadc) {
		  	opts["gridRight"] += settings.game.boardWidth*this.grid; 

		    x = (mu.modulo(tetromino.col,settings.game.boardWidth)) * this.grid + this.gridsmall*5.5; 
		    y = this.FlipIfDual(tetromino.row) * this.grid; // Dualmode bug -- flipifdual needs to account for row.  Maybe draw "up" in dual mode? 
			tetromino.paint(this.context, x, y, this.grid, tetcolor, 1, opts); 

			x = (mu.modulo(tetromino.col,settings.game.boardWidth) + settings.game.boardWidth) * this.grid + this.gridsmall*5.5;
			tetromino.paint(this.context, x, y, this.grid, tetcolor, 1, opts); 
          } else {
	          // I am aware that if the tetromino is wider than the grid, it renders out of bounds. I don't care
	          x = (this.spawningCol(tetromino)) * this.grid + this.gridsmall*5.5;
	          y = (this.FlipIfDual(tetromino.row + (settings.game.stairs ? this.spawningRow(tetromino) + 2 : 0)) - (settings.game.stairs ? tetromino.col : 0)) * this.grid;
	          tetromino.paint(this.context, x, y, this.grid, tetcolor, 1, opts); 
          }			
		}

		/*
		if (settings.game.wrapAround) {
          if (settings.user.wadc) {
            context.fillRect((mu.modulo(col + tetromino.col,settings.game.boardWidth)) * grid + gridsmall*5.5, FlipIfDual(tetromino.row + row) * grid, grid-1, grid-1);
            context.fillRect((mu.modulo(col + tetromino.col,settings.game.boardWidth) + settings.game.boardWidth) * grid + gridsmall*5.5, FlipIfDual(tetromino.row + row) * grid, grid-1, grid-1);
          } else {
          // I am aware that if the tetromino is wider than the grid, it renders out of bounds. I don't care
          // Google context.clip, foo! 
            context.fillRect((col + spawningCol(tetromino.matrix)) * grid + gridsmall*5.5, (FlipIfDual(tetromino.row + row + (settings.game.stairs ? spawningRow(tetromino.matrix) + 2 : 0)) - (settings.game.stairs ? tetromino.col : 0)) * grid, grid-1, grid-1);
          }
        } else {
            context.fillRect((col + tetromino.col) * grid + gridsmall*5.5, FlipIfDual(tetromino.row + row) * grid, grid-1, grid-1);
          }
		*/



		/*
		  if (tetromino) {



		    context.fillStyle = FlipIfDual(false) ? 'black' : color.tetromino2color(tetromino.matrix, tetromino.name);

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
		  */
	}

	drawNextTetrominos() {
		for (let i=0;i<settings.game.nextPieces;i++) {
			let piece = this.nextpieces[i]; 
			if(piece && piece.matrix) {
				piece.paint(this.context,
					// What on EARTH?? 
					(this.spawningCol(piece) + 8.5 - settings.game.boardWidth / 2) * this.gridsmall + settings.game.boardWidth * this.grid * this.wadcmult,
					(8.5 + i*4 - piece.matrix.length / 2) * this.gridsmall,
					this.gridsmall,
					'',
					1); 
			} 
		}
	}

	drawHeld() {
	    this.context.fillStyle = 'darkslategray';
		this.context.fillRect(0, 4.5 * this.gridsmall, 5.5 * this.gridsmall, 
			settings.game.heldPieces * 4 * this.gridsmall);

		// draw the held tetrominoes
		for (let i=0;i<settings.game.heldPieces;i++) {
		  if (this.held[i]) {
		    let piece = this.held[i];
		    piece.paint(
		      this.context,
		 	  (this.spawningCol(piece) + 3 - settings.game.boardWidth / 2) * this.gridsmall, 
		      (this.spawningRow(piece) + 8.5 + (settings.game.heldPieces-1-i)*4 - piece.matrix.length / 2) * this.gridsmall, 
		      this.gridsmall,
		      '',
		      1); 
		  }
		}
	}

	increaseScore() {
	  this.score += this.scoreincrease;
	  this.scoreincrease = this.scoreincrease + settings.game.scoreAcceleration;
	}

	drawScore() {
		let context = this.context;

		context.fillStyle = 'white';
		context.font = '36px monospace';
		context.textAlign = 'right';
		context.textBaseline = 'middle';
		context.fillText(this.score, settings.game.boardWidth * this.grid * this.wadcmult + this.gridsmall * 11, 20);

		context.font = '36px monospace';
		context.textAlign = 'left';
		if(settings.game.closeEnough > 0) {
		  context.fillText("AH: " + settings.game.closeEnough, 0, 20);
		}
		if(settings.game.flipping) {
		  context.fillText("Flip", 0, 56);
		}  		
	}

	// show the game over screen
	showGameOver() {
	    if (settings.user.lossBehavior == 'shuffle') {
			settings.randomizeSettings();
			this.restartGame();
		} else {
			if (settings.user.lossBehavior == 'restart') {
				this.restartGame();
			} else {
				
				this.gameOver = true;

				let context = this.context; 
				let canvas = this.canvas; 
				context.fillStyle = 'black';
				context.globalAlpha = 0.75;
				context.fillRect(0, canvas.height / 2 - 30, canvas.width, 60);

				context.globalAlpha = 1;
				context.fillStyle = 'white';
				context.font = '36px monospace';
				context.textAlign = 'center';
				context.textBaseline = 'middle';
		 		context.fillText('GAME OVER!', canvas.width / 2, canvas.height / 2);
				this.pause();
			}
		}
	}

	// Game logic
	restartGame() {
		this.tetrominoFactory = tf.tetrominoFactoryFactory(this.gsettings); 
		this.tetromino = this.tetrominoFactory.getNextTetromino(); 
		this.nextpieces = this.tetrominoFactory.getLookahead(); 
		this.setSpawnLocation();

		this.resizeCanvas(); 
		this.newPlayfield(); 

		if(settings.game.sd) { this.noTouchy(); }
		this.resetHold();
		this.resetCounters();

		this.gameOver = false;
		this.unPause(); 
	}

	newPlayfield() {
		let playfield = [];

		let sg = this.gsettings;

	  	// populate the empty state
		for (let row = -4-sg.boardWidth; row < sg.boardHeight + sg.boardWidth + 4; row++) {
		  playfield[row] = [];
		  if (row >= 0 && row < sg.boardHeight) {
		    for (let col = 0; col < sg.boardWidth; col++) {
		      if (sg.dual) {
		        if (Math.abs(sg.boardHeight - row * 2 - 1/2) > sg.gr) {
		          playfield[row][col] = (row > sg.boardHeight / 2) ? new gc.GridCell(gc.GARBAGE) : new gc.GridCell(); 
		        } else {
		          playfield[row][col] = new gc.GridCell([gc.EMPTY, gc.GARBAGE][(Math.random() < sg.garbagePercentage / 100) * 1]);
		        }

		      } else {
		        if (sg.boardHeight - row > sg.gr) {
		          playfield[row][col] = new gc.GridCell();
		        } else {
		          playfield[row][col] = new gc.GridCell([gc.GARBAGE, gc.EMPTY][(Math.random() < sg.garbagePercentage / 100) * 1]);
		        }
		      }
		    }
		  } else {
		    for (let col = 0; col < sg.boardWidth; col++) {
		      playfield[row][col] = (row > sg.boardHeight / 2) ? new gc.GridCell(gc.GARBAGE) : new gc.GridCell(); 
		    }
		  }
		}

		this.playfield = playfield; 
	}

	resetHold() {
		this.holdcycleattempts = 0; 
		this.held = []; 
	}

	resetCounters() {
		this.score = 0;
		this.rowsUntilAcc = 0; 
		this.scoreincrease = 0;
		this.pieceCount = 0;
		this.frameCount = 0; 
		this.wrapAroundCol = 0; 
	}

	setSpawnLocation() {
		this.tetromino.col = this.spawningCol(this.tetromino); 
		this.tetromino.row = this.spawningRow(this.tetromino); 

		if(settings.game.wrapAround) {
			this.tetromino.col = this.wrapAroundCol;
		}
	}
	spawningCol(piece) {
	  // I and O start centered, all others start in left-middle
	  return Math.floor((settings.game.boardWidth - piece.matrix[0].length) / 2);
	}
	spawningRow(piece) {
	  // I starts on row 21 (-1), all others start on row 22 (-2)
	  return -1-piece.matrix.map(row => row.reduce((a, b) => 1 - (1-a) * (1-b))).lastIndexOf(1) + (settings.game.stairs ? (this.FlipIfDual(false) ? -this.spawningCol(piece) : this.spawningCol(piece)) : 0);
	}

	// it is not a query function!
	tryValidMove(matrix, cellRow, cellCol, move='') {
	  if(cellRow - matrix.length - (settings.game.stairs ? (cellCol) : 0) >= settings.game.boardHeight) {
	  	return false; // Make empty matrices crash eventually
	  }

	  // Copy grid in case ghosty needs it
	  let gridCells = matrix.map(row => row.slice()); 
	  for (let row = 0; row < matrix.length; row++) {
	    for (let col = 0; col < matrix[row].length; col++) {
	      	let gridRow = row + cellRow; 
	      	let gridCol = col + cellCol; 

	      	gridCells[row][col] = this.playfield[
	            this.FlipIfDual(gridRow) - (settings.game.stairs ? (gridCol) : 0)]
	            [mu.modulo(cellCol + col, settings.game.boardWidth)];
	    }
	  }

	  // If we're rotating or flipping, we need an updated ghosty matrix
	  let lgm = this.tetromino.ghostymatrix.map(r => r.slice()); 
	  if(this.tetromino.ghosty) {
	  	if(move == 'rotate') {
	  		lgm = mu.rotate(lgm); 
	  	}
	  	if(move == 'flip') {
	  		lgm = lgm.map(sdrvg => sdrvg.toReversed());
	  	}
	  }

	  for (let row = 0; row < matrix.length; row++) {
	    for (let col = 0; col < matrix[row].length; col++) {
	      if (matrix[row][col]) {
	      	  let gridRow = row + cellRow; 
	      	  let gridCol = col + cellCol; 
	      	  let hitFloor = gridRow - (settings.game.stairs ? (gridCol) : 0) >= settings.game.boardHeight;
	      	  let hitWallLeft = gridCol < 0  && ! settings.game.wrapAround;
	      	  let hitWallRight = gridCol >= settings.game.boardWidth && ! settings.game.wrapAround; 

	      	  // Only solid ghosty pieces actually collide
	      	  
	      	  if(this.tetromino.ghosty) {	      	  	
	      	  	if(! (lgm[row][col] == 'solid')) { 
		      	  	if(! (hitFloor || hitWallLeft || hitWallRight) ) {
		      	  		continue; 
		      	  	}
		      	 }
	      	  }

	      	  if(hitWallLeft || hitWallRight) { if(this.tetromino.sticky) {this.placeTetromino();} return false; }
	      	  if(hitFloor) { if(settings.game.floorIsLava) {this.showGameOver(); return false;} else {this.placeTetromino(); return false;} }
	      	  if(this.isCollidable(gridCells[row][col])) {     
	          	if(this.tetromino.sticky || this.movingDown) {this.placeTetromino();} return false;
	      	  }
	        
	      }
	    }
	  }

	  this.tetromino.matrix = matrix;
	  this.tetromino.row = cellRow;
	  this.tetromino.col = cellCol;

	  if(this.tetromino.ghosty) {
		  if(move == 'rotate') {
		  	this.tetromino.ghostyRotate();
		  } 
		  if(move == 'flip') {
		  	this.tetromino.ghostyFlip();
		  }


	  	this.tetromino.ghostyUpdate(gridCells); 
	   }

	  return true; 
	}

	// game
	isCollidable(cell) {
	  if (this.FlipIfDual(false)) {
	    return cell.isSD() || cell.isEmpty(); 
	  } else {
	    return ! cell.isEmpty(); 
	  }
	}

	FlipIfDual(k) {
	  if (typeof k == "number") {
	    return ((this.pieceCount % 2 == 1) && settings.game.dual) ? (settings.game.boardHeight - 1 - k) : k
	  } else {
	    return ((this.pieceCount % 2 == 1) && settings.game.dual) ^ k
	  }
	}

	droprowsaboverow(row) {
	  for (let r = row; r >= -1; r--) {
	    for (let c = 0; c < this.playfield[r].length; c++) {
	      this.playfield[r][c] = this.playfield[r-1][c];
	    }
	  }
	}

	raiserowsbelowrow(row) {
	  for (let r = row; r < settings.game.boardHeight; r++) {
	    for (let c = 0; c < this.playfield[r].length; c++) {
	      this.playfield[r][c] = this.playfield[r+1][c];
	    }
	  }
	}

	// place the tetromino on the playfield
	placeTetromino() {
	  let tetromino = this.tetromino;
	  let playfield = this.playfield;

	  for (let row = 0; row < tetromino.matrix.length; row++) {
	    for (let col = 0; col < tetromino.matrix[row].length; col++) {
	      if (tetromino.matrix[row][col]) {

	        // game over if piece has any part offscreen
	        let playrow = this.FlipIfDual(tetromino.row + row) - (settings.game.stairs ? tetromino.col + col : 0);
	        if (playrow < 0 || playrow >= settings.game.boardHeight) {
	          this.pause();
	          return this.showGameOver();
	        }

	        let cell = new gc.GridCell();
	        if(tetromino.ghosty) { cell = tetromino.placeGhostyCell(row, col, cell); }
	        else {
	        	if(! this.FlipIfDual(false)) { cell.makePlacedPiece(tetromino.matrix, tetromino.name, tetromino.color); } 
	        }
	        playfield[playrow][mu.modulo((tetromino.col + col),settings.game.boardWidth)] = cell;
	      }
	    }
	  }
	  if (settings.game.sd) {this.noTouchy();}
	  this.scoreincrease = 1;
	  // check for line clears starting from the bottom and working our way up
	  if (!settings.game.dual) {
	    for (let row = settings.game.boardHeight - 1; row >= 0; ) {
	      if (playfield[row].filter(cell => cell.isEmpty()).length <= settings.game.closeEnough) {
	        if (settings.game.rgr && this.playfield[row].filter(cell => cell.isGarbage()).length > 0) {
	          // raise every row below this one
	          this.raiserowsbelowrow(row);
	          for (let i = 0; i < playfield[settings.game.boardHeight-1].length; i++) {
	          	playfield[settings.game.boardHeight-1][i] = new gc.GridCell([gc.EMPTY, gc.GARBAGE][(Math.random() < settings.game.garbagePercentage / 100) * 1]);
	          }
	          this.increaseScore();

	          playfield[settings.game.boardHeight - 1].map(cell => (Math.random() * 100 > settings.game.garbagePercentage ? new gc.GridCell() : new gc.GridCell(gc.GARBAGE)));
	        } else {
	          // drop every row above this one
	          this.droprowsaboverow(row);
	          this.increaseScore();

	        }
	      }
	      else {
	        row--;
	      }
	    }
	  } else {
	    let thebool = false;
	    for (let row = settings.game.boardHeight - 1; row >= 0; row--) {
	      if (playfield[this.FlipIfDual(row)].filter(cell => !this.isCollidable(cell)).length <= settings.game.closeEnough) {
	        if (thebool) {
	        // drop every row above this one
	          this.FlipIfDual(false) ? this.droprowsaboverow(settings.game.boardHeight - 1 - row) : this.raiserowsbelowrow(row);
	          this.increaseScore();
	        }  
	      } else {thebool = true;}
	    }
	  }
	  if (settings.game.sd) {this.noTouchy();}
	  this.wrapAroundCol = this.tetromino.col; 
	  this.nextTetromino();
	}

	noTouchy() {
	  for (let row = -2; row < settings.game.boardHeight; row++) {
	    for (let col = 0; col < settings.game.boardWidth; col++) {
	      if (!this.isSocialDistancer(row,col)) {
	        if ((this.isSocialDistancer(row,col+1) || this.isSocialDistancer(row,col-1) || 
	        	 this.isSocialDistancer(row+1,col) || this.isSocialDistancer(row-1,col))) {
	          this.playfield[row][col] = new gc.GridCell(gc.SOCDIST);
	        } else {this.playfield[row][col] = this.FlipIfDual(false) ? new gc.GridCell(gc.GARBAGE) : new gc.GridCell();}
	      }
	    }
	  }
	}

	isSocialDistancer(row,col) {
	  if (-2 <= row && row < settings.game.boardHeight) {
	    if (0 <= col && col < settings.game.boardWidth) {
	      let cell = this.playfield[row][col]; 

	      return this.FlipIfDual(!cell.isEmpty()) && ! cell.isSD(); 
	    } else {
	      if (settings.game.wrapAround) {return this.isSocialDistancer(row, mu.modulo(col,settings.game.boardWidth));}
	    }
	  } else {return false;}
	  
	}

	nextTetromino() {
  		this.holdcycleattempts = 0;
  		this.pieceCount += 1;
		this.tetromino = this.tetrominoFactory.getNextTetromino();
		this.setSpawnLocation();
	}

	pause() {
		this.gamePaused = true;
	}

	unPause() {
		this.gamePaused = false; 
		this.startAnimation();
	}


	loop() {
		this.rAF = requestAnimationFrame(this.loop);
		if(this.gamePaused) {
			return;
		}

		this.frameCount++; 

		this.update(); 
		this.draw(); 
	}

	update() {
	  if(this.tetromino) {
	    // tetromino falls every 35 frames, but they get faster as you score
	    if (this.framesUntilMove++ > (settings.game.fallingSpeed / (settings.game.fa ** this.score))) {
	      this.framesUntilMove = 0;
	      this.movingDown = true;
		  this.tryValidMove(this.tetromino.matrix, this.tetromino.row + 1, this.tetromino.col);		  	
		  this.movingDown = false;
	    }	
	  }	
	}

	// Controls
	controlsOff() {
	  if (this.gameOver)   return true;
	  if (this.gamePaused) return true;
	  return false; 
	}

	pieceLeft() {
	  this.tryValidMove(this.tetromino.matrix, this.tetromino.row, this.tetromino.col + 1);
	}
	pieceRight() {

	  this.tryValidMove(this.tetromino.matrix, this.tetromino.row, this.tetromino.col - 1);
	}

	pieceRotate() {

	  const matrix = (this.FlipIfDual(false) && !settings.user.roateDual) ? mu.rotate(mu.rotate(mu.rotate(this.tetromino.matrix))) : mu.rotate(this.tetromino.matrix);
	  this.tryValidMove(matrix, this.tetromino.row, this.tetromino.col, 'rotate')
	}

	pieceDown() {
	  this.movingDown = true;
	  const row = this.tetromino.row + 1;
	  this.tryValidMove(this.tetromino.matrix, row, this.tetromino.col)
	  this.movingDown = false;
	}

	pieceFlip() {

	  
	  if (settings.game.flipping) {
	    const matrix = this.tetromino.matrix.map(sdrvg => sdrvg.toReversed());
	    this.tryValidMove(matrix,this.tetromino.row,this.tetromino.col, 'flip');
	  }
	  
	}

	pieceHold() {
	  
	  document.getElementById("settingsButton").blur(); // this one is necessary
	  if (settings.game.heldPieces > 0 && this.holdcycleattempts < settings.game.heldPieces) {
	    this.held.splice(0, 0, this.tetromino);
	    this.holdcycleattempts++;
	    if (this.held.length > settings.game.heldPieces) {
	      this.tetromino = this.held.pop();
	      this.setSpawnLocation();
	    } else {
	      this.nextTetromino();
	    }
	  }
	  
	}

}

