import {default as mu} from './mathutil.js';  
import * as settings from './settings.js';  
import * as ts from './tetrominos.js'; 

export function makeRandomColor(minBright=64) {
  let r = mu.getRandomInt(minBright,255);
  let g = mu.getRandomInt(minBright,255);        
  let b = mu.getRandomInt(minBright,255);
  return `rgb(${r},${g},${b})`;
}

export function driftColor(rgb, amount) {
  let clamp = (x => x < 64 ? 64 : x > 255 ? 255 : x); 
  return [clamp(rgb[0] + mu.getRandomInt(-amount, amount)),
          clamp(rgb[1] + mu.getRandomInt(-amount, amount)),
          clamp(rgb[2] + mu.getRandomInt(-amount, amount))];
  }

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
  for (let i=half.length - 1; i > -1; i--) {
    if (half[i] != Infinity) {
      boole = true;
    }
    if (boole) {toret.unshift(half[i]);}
  }
  return toret;
}

export function padwithzeros(string) {
  let a = string;
  for (let i=0; i < 6 - string.length; i++) {
    a = '0' + a;
  }
  return a;
}

export function colorDistance(a, b) {
  return Math.sqrt(
    (parseInt(a[1] + a[2], 16) - parseInt(b[1] + b[2], 16))**2 * 2.5 + 
    (parseInt(a[3] + a[4], 16) - parseInt(b[3] + b[4], 16))**2 * 5 + 
    (parseInt(a[5] + a[6], 16) - parseInt(b[5] + b[6], 16))**2 * 1.5);
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


function bottom2numberD(bottom) {
  let X = 0;
  let toret = 0;
  for (let i=0; i<bottom.length - 1; i++) {
    if (bottom[i] == bottom[i+1]) {
      X += 1;
    } else {
      toret += 255 * (1 - 0.5 ** X);
      X = 0;
    }
  }
  toret += 255 * (1 - 0.5 ** X);
  return toret;
}


export function matrix2color(matrix) {
  let matrices = [matrix, mu.rotate(matrix), mu.rotate(mu.rotate(matrix)), mu.rotate(mu.rotate(mu.rotate(matrix)))];
  let bottoms = matrices.map(matrice => removeEdgeInf(matrice.map(row => mu.minusonetoinf(row.indexOf(1)))));
  bottoms = bottoms.map(bottom => bottom.map(x => x - Math.min(array)));
  let A = mu.extremifiedaverage(bottoms.map(bottom => mu.zeroifnan(bottom2numberA(bottom))));
  let B = mu.extremifiedaverage(bottoms.map(bottom => mu.zeroifnan(bottom2numberB(bottom))));
  let C = mu.extremifiedaverage(bottoms.map(bottom => mu.zeroifnan(bottom2numberC(bottom))));
  let D = mu.extremifiedaverage(bottoms.map(bottom => mu.zeroifnan(bottom2numberD(bottom))));
  let channels = [A, B, C, D];
  return '#' + padwithzeros((
    Math.round(channels[mu.modulo(Math.round(settings.user['redColor']),4)]) * 65536 + 
    Math.round(channels[mu.modulo(Math.round(settings.user['greenColor']),4)]) * 256 + 
    Math.round(channels[mu.modulo(Math.round(settings.user['blueColor']),4)])).toString(16));
}


