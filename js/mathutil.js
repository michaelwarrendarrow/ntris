// get a random integer between the range of [min,max]
// @see https://stackoverflow.com/a/1527820/2124254
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);

  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function modulo(a, b) {
  return ((a % b) + b) % b;
}

function zeroifnan(number) {
  if (number > 0 || number < 0 || number == 0) {
    return number;
  } else {
    return 0;
  }
}

function minusonetoinf(element) {
  return element == -1 ? Infinity : element;
}

function extremifiedaverage(array) {
  let X = (Math.max(...array) + Math.min(...array)) / 2;
  return X;
}

function rotate(matrix) {
  const N = matrix.length - 1;
  let result = [];
  for (let i = 0; i < matrix[0].length; i++) {
    result.push([]);
    for (let j = 0; j < matrix.length; j++) {
      result[i].push(matrix[matrix.length - 1 - j][i])
    }
  }
  return result;
}

// Cleverness preserved
// let cellCount = this.matrix.reduce((acc,row) => acc + row.reduce((acc2, cell) => cell ? acc2 + 1 : acc2, 0), 0); 
function countCells(matrix) {
  let cells = 0; 
  for(let i = 0; i < matrix.length; i++) {
    for(let j = 0; j < matrix.length; j++) {
      if(matrix[i][j]) { cells++; }
    }
  }

  return cells; 
}

function countNeighbors(matrix, i, j) {
  let localMatrix = matrix.map(r => r.splice());
  localMatrix = addZeros(localMatrix); 

  i += 1;
  j += 1;

  let count = 0; 
  for(let a = i-1; a <= i+1; a++) {
    for(let b = j-1; b <= j+1; b++) {
      if(a == b == 0) { continue; }
      count += localMatrix[a][b]; 
    }
  }

  return count; 
}

function cellTouchesEdge(matrix) {
  if(matrix[0].indexOf(1) != -1)                 { return true; }
  if(matrix[matrix.length - 1].indexOf(1) != -1) { return true; }
  for(let i = 0; i < matrix.length; i++) {
    if(matrix[i][0] == 1) { return true; }
    if(matrix[i][matrix[i].length-1] == 1) { return true; }
  }
  return false; 
}

function addZeros(matrix) {
  matrix.push(new Array(matrix[0].length).fill(0));
  matrix.unshift(new Array(matrix[0].length).fill(0));
  for (let i = 0; i < matrix.length; i++) {
    matrix[i].push(0);
    matrix[i].unshift(0);
  }
  return matrix;
}

function toCentered(grid) {
  let matrix = grid;
  let Isum = 0;
  let Jsum = 0;
  let total = 0;
  for (let i=0; i<matrix.length; i++) {
    for (let j=0; j<matrix[i].length; j++) {
      if (matrix[i][j]) {
        Isum += i;
        Jsum += j;
        total += 1;
      }
    }
  }
  let centercoords = [Isum / total, Jsum / total];
  let dcc = [1 + (Math.round(centercoords[0] + centercoords[1]) + Math.round(centercoords[0] - centercoords[1])), 1 + (Math.round(centercoords[0] + centercoords[1]) - Math.round(centercoords[0] - centercoords[1]))];
  if (dcc[0] > matrix.length) {
    for (let i = matrix.length; i < dcc[0]; i++) {
      matrix.push(new Array(matrix[0].length).fill(0));
    }
  } else {
    for (let i = matrix.length; i > dcc[0]; i--) {
      matrix.unshift(new Array(matrix[0].length).fill(0));
    }
  }
  if (dcc[1] > matrix[0].length) {
    for (let i = 0; i < matrix.length; i++) {
      for (let j = matrix[i].length; j < dcc[1]; j++) {
        matrix[i].push(0);
      }
    }
  } else {
    for (let i = 0; i < matrix.length; i++) {
      for (let j = matrix[i].length; j > dcc[1]; j--) {
        matrix[i].unshift(0);
      }
    }
  }
  if (matrix.length < matrix[0].length) {
    while (matrix.length < matrix[0].length) {
      matrix.push(new Array(matrix[0].length).fill(0));
      matrix.unshift(new Array(matrix[0].length).fill(0));
    }
  } else {
    while (matrix[0].length < matrix.length) {
      for (let i=0; i < matrix.length; i++) {
        matrix[i].push(0);
        matrix[i].unshift(0);
      }
    }
  }

  while (matrix[0].indexOf(1) == -1 && matrix[matrix.length-1].indexOf(1) == -1 && matrix.every(trerr => trerr[0] == 0 && trerr[trerr.length-1] == 0)) {
    matrix = matrix.slice(1, -1);
    matrix = matrix.map(nswttt => nswttt.slice(1, -1));
  }
  return matrix;
}

function isGreater(array1, array2) {
  if (array1.length > array2.length) {return true;}
  if (array2.length > array1.length) {return false;}
  for (let X = 0; X < Math.min(array1.length, array2.length); X++) {
    if (typeof(array1[X]) == 'number') {
      if (array1[X] > array2[X]) {return true;}
      if (array2[X] > array1[X]) {return false;}
    } else {
      if (isGreater(array1[X], array2[X])) {return true;}
      if (isGreater(array2[X], array1[X])) {return false;}
    }
  }
  return false;
}

function removeZeros(matrix) {
  while (matrix[0].indexOf(1) == -1) {
    matrix = matrix.slice(1, matrix.length);
  }
  while (matrix[matrix.length-1].indexOf(1) == -1) {
    matrix = matrix.slice(0, matrix.length-1);
  }
  while (matrix.every(trerr => trerr[0] == 0)) {
    matrix = matrix.map(nswttt => nswttt.slice(1, nswttt.length));
  }
  while (matrix.every(trerr => trerr[trerr.length-1] == 0)) {
    matrix = matrix.map(nswttt => nswttt.slice(0, nswttt.length-1));
  }
  return matrix;
}

function standardOrientation(matrix) {
  let h = [matrix, rotate(matrix), rotate(rotate(matrix)), rotate(rotate(rotate(matrix)))];
  let J = h[0];
  for(let i = 0; i < 4; i++) {
    if (isGreater(J, h[i])) {J = h[i];}
  }
  return J;
}

function clamp (matrix, i) {return Math.max(0, Math.min(i, matrix.length - 1));}

function notAdjacentOrOn (matrix, a, b) {return (matrix[a][b] == 0 && 
                                               matrix[clamp(matrix, a+1)][clamp(matrix[0], b)] == 0 &&
                                               matrix[clamp(matrix, a-1)][clamp(matrix[0],b)] == 0 &&
                                               matrix[clamp(matrix, a)][clamp(matrix[0],b+1)] == 0 &&
                                               matrix[clamp(matrix, a)][clamp(matrix[0],b-1)] == 0);}

function isAdjacent(matrix, a, b){return (matrix[a][b] == 0 && !(
                                               matrix[clamp(matrix, a+1)][clamp(matrix[0], b)] == 0 &&
                                               matrix[clamp(matrix, a-1)][clamp(matrix[0],b)] == 0 &&
                                               matrix[clamp(matrix, a)][clamp(matrix[0],b+1)] == 0 &&
                                               matrix[clamp(matrix, a)][clamp(matrix[0],b-1)] == 0));}

function allorientations(matrix) {
  return [matrix,rotate(matrix),rotate(rotate(matrix)),rotate(rotate(rotate(matrix))), matrix.toReversed(), rotate(matrix.toReversed()), rotate(rotate(matrix.toReversed())), rotate(rotate(rotate(matrix.toReversed())))];
}

export default {
	getRandomInt, modulo, zeroifnan, minusonetoinf, extremifiedaverage, rotate, allorientations, toCentered, addZeros, clamp, notAdjacentOrOn, isAdjacent, removeZeros, standardOrientation, isGreater,
  countCells, cellTouchesEdge, countNeighbors
}

