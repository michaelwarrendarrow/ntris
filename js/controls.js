import {ntrisGame as game} from './ntris.js'; 
import * as settings from './settings.js'; 

export function showControls() {
  document.getElementById("helpDialog").showModal();
}

export function hideControls() {
  document.getElementById("helpDialog").close();
}

// listen to keyboard events to move the active tetromino
// we should probably add customizable keybinds but i'm not ready to do that
document.addEventListener('keydown', function(e) {
  if (!game.controlsOff()) {
    // left
    if (e.which === 37 || e.which === 65 || e.which === 97) {
      if(settings.game.dual && settings.user.lrDual && FlipIfDual(false)) {
        game.pieceLeft();
      } else {
        game.pieceRight(); 
      }
    }

    // right
    if (e.which === 39 || e.which === 68 || e.which === 100) {
      if(settings.game.dual && settings.user.lrDual && FlipIfDual(false)) {
        game.pieceRight();
      } else {
        game.pieceLeft(); 
      }
    }


    // up
    if(e.which === 38 || e.which === 87 || e.which === 119) {
      game.pieceRotate(); 
    }

    // down
    if(e.which === 40 || e.which === 83 || e.which === 115) {
      game.pieceDown();
    }


    if (e.which === 32 || e.which === 81 || e.which === 113) {
      game.pieceHold();
    }

    if (e.which === 69 || e.which === 101) {
        game.pieceFlip();
    }
  }
});