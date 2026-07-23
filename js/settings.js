import {default as mu} from './mathutil.js'; 
import * as color from './color.js'; 
import * as ts from './tetrominos.js';  

let gameDefault = {
	gr: 0, 
	boardWidth: 10, 
	boardHeight: 20, 
	mystery: 15584, 
	fallingSpeed: 35, 
	fa: 1.01, 
	nextPieces: 1, 
	closeEnough: 0, 
	heldPieces: 0, 
	garbagePercentage: 50, 
	scoreAcceleration: 1, 
	wrapAround: false, 
	rgr: false, 
	sd: false, 
	dual: false, 
	flipping: false, 
	stairs: false,
  morph: false,
  drunkAnt: false,
  stickyChance: 0,
  floorIsLava: false,
  polyominoes: false,
  ghostyChance: 0
};

export let game = {...gameDefault};

export let user = {
	udDual: false, 
	lrDual: false, 
	rotateDual: false, 
	wadc: false, 
	prdb: 0, 
	prscb: 0, 
	prsb: 0,
  redColor: 0,
  greenColor: 1,
  blueColor: 2,
  useStaticColor: 0, // Yes UI -- just to demonstrate power of new interfaces
  lossBehaivor: 'nothing'
};

export function resetSettings() { 
  game = {...gameDefault};
}

export function showSettings() {
  document.getElementById("settingGR").value = game["gr"];
  document.getElementById("settingBoardWidth").value = game["boardWidth"];
  document.getElementById("settingBoardHeight").value = game["boardHeight"];
  document.getElementById("settingMystery").value = game["mystery"];
  document.getElementById("settingFallingSpeed").value = game["fallingSpeed"];
  document.getElementById("settingFA").value = game["fa"];
  document.getElementById("settingNextPieces").value = game["nextPieces"];
  document.getElementById("settingCloseEnough").value = game["closeEnough"];
  document.getElementById("settingHeldPieces").value = game["heldPieces"];
  document.getElementById("settingGarbagePercentage").value = game["garbagePercentage"];
  document.getElementById("settingScoreAcceleration").value = game["scoreAcceleration"];
  document.getElementById("settingWrapAround").checked = game["wrapAround"];
  document.getElementById("settingRGR").checked = game["rgr"];
  document.getElementById("settingSD").checked = game["sd"];
  document.getElementById("settingDual").checked = game["dual"];
  document.getElementById("settingFlipping").checked = game["flipping"];
  document.getElementById("settingStairs").checked = game["stairs"];
  document.getElementById("settingMorph").checked = game["morph"];
  document.getElementById("settingDrunkAnt").checked = game["drunkAnt"];
  document.getElementById("settingStickyChance").value = game["stickyChance"];
  document.getElementById("settingGhostyChance").value = game["ghostyChance"];
  document.getElementById("settingFloorIsLava").checked = game["floorIsLava"];
  document.getElementById("settingPolyominoes").checked = game["polyominoes"];

  document.getElementById("settingbLRDual").checked     = user["lrDual"];
  document.getElementById("settingbUDDual").checked     = user["udDual"];
  document.getElementById("settingbRotateDual").checked = user["rotateDual"];
  document.getElementById("settingbWADC").checked       = user["wadc"];
  document.getElementById("settingbPRDB").value         = user["prdb"];
  document.getElementById("settingbPRSB").value         = user["prsb"];
  document.getElementById("settingbPRSCB").value        = user["prscb"];
  document.getElementById("settingbRedColor").value     = user["redColor"];
  document.getElementById("settingbGreenColor").value   = user["greenColor"];
  document.getElementById("settingbBlueColor").value    = user["blueColor"];
  document.getElementById("settingbStaticColor").checked= user["useStaticColor"];
  document.getElementById("settingbLoss").value         = user["lossBehavior"];

  document.getElementById("settingsDialog").showModal();
  document.getElementById("settingsButton").blur();
}

export function hideSettings() {
  document.getElementById("settingsDialog").close();
}

export function saveSettings() {
  game["gr"]           = document.getElementById("settingGR").value * 1;
  game["boardWidth"]   = document.getElementById("settingBoardWidth").value * 1;
  game["boardHeight"]  = document.getElementById("settingBoardHeight").value * 1;
  game["mystery"]      = document.getElementById("settingMystery").value * 1;
  game["fallingSpeed"] = document.getElementById("settingFallingSpeed").value * 1;
  game["fa"]           = document.getElementById("settingFA").value * 1;
  game["nextPieces"]   = document.getElementById("settingNextPieces").value * 1;
  game["closeEnough"]  = document.getElementById("settingCloseEnough").value * 1;
  game["heldPieces"]   = document.getElementById("settingHeldPieces").value * 1;
  game["garbagePercentage"] = document.getElementById("settingGarbagePercentage").value * 1;
  game["scoreAcceleration"] = document.getElementById("settingScoreAcceleration").value * 1;
  game["stickyChance"] = document.getElementById("settingStickyChance").value * 1;
  game["ghostyChance"] = document.getElementById("settingGhostyChance").value * 1;
  game["floorIsLava"]  = document.getElementById("settingFloorIsLava").checked;
  game["wrapAround"]   = document.getElementById("settingWrapAround").checked;
  game["rgr"]          = document.getElementById("settingRGR").checked;
  game["sd"]           = document.getElementById("settingSD").checked;
  game["dual"]         = document.getElementById("settingDual").checked;
  game["flipping"]     = document.getElementById("settingFlipping").checked;
  game["stairs"]       = document.getElementById("settingStairs").checked;
  game["morph"]        = document.getElementById("settingMorph").checked;
  game["drunkAnt"]     = document.getElementById("settingDrunkAnt").checked;
  game["polyominoes"]  = document.getElementById("settingPolyominoes").checked;

  user["lrDual"]     = document.getElementById("settingbLRDual").checked;
  user["udDual"]     = document.getElementById("settingbUDDual").checked;
  user["rotateDual"] = document.getElementById("settingbRotateDual").checked;
  user["wadc"]       = document.getElementById("settingbWADC").checked;
  user["prdb"]       = document.getElementById("settingbPRDB").value * 1;
  user["prscb"]      = document.getElementById("settingbPRSCB").value * 1;
  user["prsb"]       = document.getElementById("settingbPRSB").value * 1;
  user["redColor"]   = document.getElementById("settingbRedColor").value * 1;
  user["greenColor"] = document.getElementById("settingbGreenColor").value * 1;
  user["blueColor"]  = document.getElementById("settingbBlueColor").value * 1;
  user["useStaticColor"] = document.getElementById("settingbStaticColor").checked;
  user["lossBehavior"] = document.getElementById("settingbLoss").value;

  // There can only be one alternative piece generation algorithm
  if(game.polyominoes && game.drunkAnt) {
    if(Math.random() > 0.5) {
      game.polyominoes = 0;
      document.getElementById("settingPolyominoes").checked = false;
    } else {
      game.drunkAnt = 0; 
      document.getElementById("settingDrunkAnt").checked = false;
    }
  }  

  // Drunkant and morph are incompatible
  if(game.drunkAnt) {
    game.morph = false;    
    document.getElementById("settingMorph").checked = false;
  }

  document.getElementById("settingsDialog").close();

  if(game.dual) { game.ghostyChance = 0; }
}

export function randomizeSettings() {
  game["boardHeight"] = mu.getRandomInt(10,30);
  game["boardWidth"] = mu.getRandomInt(Math.round(game["boardHeight"]/3), Math.round(game["boardHeight"]*2/3));
  game["gr"] = Math.min(mu.getRandomInt(0,game["boardHeight"]),mu.getRandomInt(0,game["boardHeight"]));
  game["fallingSpeed"] = mu.getRandomInt(20, 50);
  game["fa"] = 1 + 0.02 * Math.random();
  game["mystery"] = 0;

  let randomColor = '#' + color.padwithzeros(mu.getRandomInt(0, 16777215).toString(16));
  let j = Math.ceil(Math.random()**Math.exp(- user.prdb / 3) * ts.allpieces.length); 

  // Here there be dragons =====================
  // I have attempted to make the dragons more readable below
  // I do not claim to understand the dragons 
  /*
  for (let i = 1 + Math.floor(-6*Math.log(Math.random()));i>0;i--) {
    let k = mu.getRandomInt(0,j);
    while (((mu.allorientations(ts.tetrominos[allpieces[k]]).lastIndexOf(ts.tetrominos[allpieces[k]]) > 3 ^ (Math.random() < 1 / (Math.exp(-user.prsb) + 1))) ||
      (color.colorDistance(color.matrix2color(ts.tetrominos[allpieces[k]]), randomColor) > 255 * 3 / Math.exp(user.prscb)) && Math.random() > 0.0003) || !(game["mystery"] % 2**(k+1) < 2**k) ) {

      k = (Math.random() > 0.003) ? mu.getRandomInt(0,j) : mu.getRandomInt(0, allpieces.length - 1);
    }
    game["mystery"] += 2**k;
  }
  */
  // End dragons ===============================

  for (let i = 1 + Math.floor(-6*Math.log(Math.random()));i>0;i--) {
    let k = mu.getRandomInt(0,j);

    let symmetrycond, colorcond, randcond, mystcond;
    symmetrycond = true; 
    while (symmetrycond || (colorcond && randcond) || mystcond) {

      k = (Math.random() > 0.003) ? mu.getRandomInt(0,j) : mu.getRandomInt(0, ts.allpieces.length - 1);

      let kname  = ts.allpieces[k];
      let kmatrix = ts.tetrominos[kname];
      let kcolor  = color.matrix2color(kmatrix); 

      symmetrycond   = mu.allorientations(kmatrix).lastIndexOf(kmatrix) > 3 ^ (Math.random() < 1 / (Math.exp(-user.prsb) + 1));
      colorcond = color.colorDistance(kcolor, randomColor) > 255 * 3 / Math.exp(user.prscb);
      randcond  = Math.random() > 0.0003;
      mystcond  = !(game["mystery"] % 2**(k+1) < 2**k); 
    }
    game["mystery"] += 2**k;
  }

  // End readable(?) dragons =================

  game["nextPieces"] = Math.floor(-2*Math.log(Math.random()));
  game["closeEnough"] = Math.floor(-Math.log(Math.random()));
  game["heldPieces"] = Math.floor(-2*Math.log(Math.random()));
  game["garbagePercentage"] = mu.getRandomInt(1, 99);
  game["scoreAcceleration"] = mu.getRandomInt(0, 2);
  game["stickyChance"] = mu.getRandomInt(0, 1) * mu.getRandomInt(0, 1) * mu.getRandomInt(1, 99);
  game["ghostyChance"] = mu.getRandomInt(0,5) < 1 ? Math.floor(Math.random()*Math.random()*100) : 0;
  game["wrapAround"] = (Math.random() > 5/6);
  game["rgr"] = (Math.random() > 5/6);
  game["sd"] = (Math.random() > 5/6);
  game["dual"] = (Math.random() > 5/6);
  game["flipping"] = (Math.random() > 5/6);
  game["stairs"] = (Math.random() > 5/6);
  game["floorIsLava"] = (game.stickyChance > 0 || game.gr > 0) && (Math.random() > 1/2);
  game["polyominoes"] = (Math.random() > 4/5);
  if (game["polyominoes"]) {
    game["mystery"] = Math.floor(-8*Math.log(Math.random()));
    game.drunkAnt = false; 
  }

  game["morph"]    = (Math.random() > 9/10);
  game["drunkAnt"] = (Math.random() > 9/10);

  if(game.drunkAnt) { game.morph = false; }

  if(game.dual) { game.ghostyChance = 0; }

}