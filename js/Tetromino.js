import * as color from './color.js'; 
import * as settings from './settings.js'; 
import {default as mu} from './mathutil.js'; 

// Potential color styles:
//   - Fixed/hardcoded; stays the same even if the piece mutates
//   - Dynamic: Always use matrix2color even if the piece changes
//   - DynamicFallback: Use matrix2color if hardcoded isn't available
//   - Fixed/flip: hardcoded flip colors
//   - Drifting: r, g, and b get += rand every paint/piececonstruct/?
//   -   colorDriftAmount = int

export default class Tetromino {
	constructor(options) { // matrix, color, col=0, row=0, name='') {
		if(! options.matrix ) {
			console.log("Warning: Called Tetromino without matrix: " + options);
			options.matrix = [[1]];
		}
		this.matrix = options.matrix.map(r => r.slice()); // Deep local copy
		this.color = options.color || ''; // Possible future improvement: save flipcolor
		this.row = options.row || 0;
		this.col = options.col || 0; 
		this.name = options.name || '';
		this.colorStyle = options.colorStyle || 'dynamicFallback'; 
		this.colorDriftAmount = options.colorDriftAmount; 
		this.blueprint = options.blueprint || null; // In case we want its current life to affect its future life
		this.sticky = (Math.random() * 100 < settings.game.stickyChance);
		this.ghosty = (Math.random() * 100 < settings.game.ghostyChance);
		this.paints = 0; 

		let cells = 0;
		for(let i = 0; i < this.matrix.length; i++) {
			for(let j = 0; j < this.matrix.length; j++) {
				if(this.matrix[i][j]) { cells++; }
			}
		}
		if(cells == 0) {
			console.log("Warning: Empty matrix of size " + this.matrix.length + " by " + this.matrix[0].length + ".  Creating monomino.");
			this.matrix = [[1]];
		}

		if(this.ghosty) {
			this.ghostymatrix = this.matrix.map(r => r.slice());
			for(let i = 0; i < this.ghostymatrix.length; i++) {
				for(let j = 0; j < this.ghostymatrix[0].length; j++) {
					if(this.matrix[i][j]) {
						this.ghostymatrix[i][j] = 'ghosty'; 
					} else {
						this.ghostymatrix[i][j] = 0;
					}
				}
			}
		}
	}

	placeGhostyCell(row, col, gc) {
		if(this.ghostymatrix[row][col] == 'solid' || this.ghostymatrix[row][col]== 'ghosty') {
			gc.makePlacedPiece(this.matrix, this.name, this.color);
			return gc; 
		} else {
			gc.makeEmpty();
			return gc; 
		}
	}

	ghostyUpdate(smallgrid) {
		for(let i = 0; i < smallgrid.length; i++) {
			for(let j = 0; j < smallgrid[0].length; j++) {
				let g = smallgrid[i][j];
				if(this.matrix[i][j]) {
					if(this.ghostymatrix[i][j] == 'ghosty' && ! g.isEmpty()) {
						this.ghostymatrix[i][j] = 'inverse'; 
					} else if (this.ghostymatrix[i][j] == 'inverse' && g.isEmpty()) {
						this.ghostymatrix[i][j] = 'solid'; 
					}
				}
			}
		}

	}

	ghostyRotate() {
		this.ghostymatrix = mu.rotate(this.ghostymatrix); 
	}

	ghostyFlip() {
		this.ghostymatrix = this.ghostymatrix.map(sdrvg => sdrvg.toReversed());
	}

	paint(context, x, y, gridsize, makeColor='', margin, options = {}) {
		let tetcolor = this.color;
		if(makeColor) { tetcolor = makeColor; }
		else {
			switch(this.colorStyle) {
				case 'dynamic':
					tetcolor = this.color = color.matrix2color(this.matrix); 
					break;
				case 'static':
					tetcolor = this.color;
					break;
				case 'dynamicFallback':
					if(! this.color ){
						tetcolor = this.color = color.matrix2color(this.matrix); 
					}
					break;
				case 'driftOnPaint':
					if(this.blueprint) {
						this.blueprint.doColorDrift();
						this.color = this.blueprint.color; 
					}
					break; 
			}
		}

		let ghostygrad; 
		if(this.ghosty) {
			// Make a wavy white/purple gradient
			let paints = Math.floor(this.paints/10); 
			let gx = x-paints;
			let gy = y-paints;
			let gx2 = x+ gridsize*(this.matrix[0].length+1)-paints;
			let gy2 = y+ gridsize*(this.matrix.length+1)-paints;
			ghostygrad = context.createLinearGradient(gx, gy, gx2, gy2); 
			let dist = Math.sqrt((gx - gx2)**2 + (gy - gy2)**2);
			let clrdist = Math.floor(dist); 
			this.paints = (this.paints + 1) % (clrdist*10); 

			let white = '#e8cdec'; 
			let purple = '#7a55ae';

			ghostygrad.addColorStop(0, white);
			ghostygrad.addColorStop(0.25, purple);
			ghostygrad.addColorStop(0.5, white);
			ghostygrad.addColorStop(0.75, purple);
			ghostygrad.addColorStop(1, white);
		}

		let flipForDual = options.drawAsDual;
		let gridLeft    = options.gridLeft;
		let gridRight   = options.gridRight;
		let gridWrap    = options.gridWrap; 
		let gridWidth   = gridRight - gridLeft; 
		let stickygradient; 
		if (this.sticky) {
			let centerx = x+this.matrix[0].length*gridsize/2;
			let centery = y+this.matrix.length*gridsize/2;
			stickygradient = context.createRadialGradient(centerx, centery, gridsize/3, centerx, centery, Math.sqrt((this.matrix.length)**2 + (this.matrix[0].length)**2) / 3 * gridsize);
			stickygradient.addColorStop(0, tetcolor);
			stickygradient.addColorStop(1, 'green');
			context.fillStyle = stickygradient;
		} else {
			context.fillStyle = tetcolor; 
		}
		for (let row = 0; row < this.matrix.length; row++) {
		  for (let col = 0; col < this.matrix[row].length; col++) {
		  	if(this.matrix[row][col]) {
		  		// Handle gridwrap for wrap mode
		  		let dx = x + col*gridsize; 
		  		if(gridWrap && gridRight && dx + gridsize > gridRight) {
		  			dx -= gridWidth; 
		  		}

		  		// Handle flip for dual mode 
		  		let dy = y + row*gridsize;
		  		if(flipForDual) { dy = y - row*gridsize; }

		  		if(this.ghosty) {
		  			if(this.ghostymatrix[row][col] == 'ghosty') {
			  			context.fillStyle = ghostygrad;
			  			context.fillRect(dx, dy, gridsize-margin, gridsize-margin); 
			  			context.fillStyle = this.sticky ? stickygradient : tetcolor;
			  			context.fillRect(dx+gridsize/4, dy+gridsize/4, gridsize/2, gridsize/2);
			  		} else if (this.ghostymatrix[row][col] == 'inverse') {
			  			context.fillStyle = ghostygrad;
			  			context.fillRect(dx, dy, gridsize-margin, gridsize-margin); 

			  			context.fillStyle = 'black';
			  			context.fillRect(dx+gridsize/4, dy+gridsize/4, gridsize/2, gridsize/2); 
			  		} else {
			  			context.fillStyle = tetcolor;
			  			context.fillRect(dx, dy, gridsize-margin, gridsize-margin); 

			  		}
		  		} else {
		  			context.fillRect(dx, dy, gridsize-margin, gridsize-margin); 
		  		}
		  	}
		  }
		}
	}
}