'use strict';

const digits = "0123456789ABCDEF";

class SudokuSolver {

    constructor() {
      this.stats = {};
    }

    /**
     * @param board a 2D array of of strings
     */
    solve (board) {
        this.stats={tests:0, backtracks:0, time:Date.now()};
        var state = new State();
        state.init(board);
        state = this._solve(state);
        this.stats.time = Date.now()-this.stats.time;
        return state.board;
    }

    _solve (state) {
        //do all single moves first (no backtracking)
        var move = state.findMove(1);
        while ((move != null)) {
            state.setNumber(move.i, move.j, move.values[0]);
            move = state.findMove(1);
            this.stats.tests++;
        }

        //find minimum moves and do backtracking
        var moveSize;
        for (moveSize = 2; moveSize <= state.size; moveSize++) {
            move = state.findMove(moveSize);
            if (move != null)
                break;
        }
        if (move != null) {
            for (var moveVal of move.values) {
                var newState = new State();
                newState.initFromState(state);
                newState.setNumber(move.i, move.j, moveVal);
                try {
                    this.stats.backtracks++;
                    return this._solve(newState);
                }
                catch (e) {
                }
            }
            throw "invalid board";
        }
        return state;
    }
}


class State {
    constructor() {
        //2D array of int. Each int bit corresponds to an allowed number for this cell
        this.allowedNumbers = null;
        this.board = null;
        this.size = 0;
        this.sizeBlock = 0;
    }

    init (board) {
        this.size = board.length;
        this.sizeBlock = parseInt(""+Math.sqrt(this.size));
        this.board = board;
        this.allowedNumbers = [];

        var allbits=0;
        for (var i = 1; i <= this.size; i++) {
          allbits |= 1<<i;
        }

        for (var i = 0; i < this.size; i++) {
            this.allowedNumbers[i] = [];
            for (var j = 0; j < this.size; j++) {
                this.allowedNumbers[i][j] = allbits;
            }
        }

        for (var i = 0; i < this.size; i++) {
            for (var j = 0; j < this.size; j++) {
                var c = board[i][j];
                if(c !== ".")
                  this.setNumber(i, j, digits.indexOf(c));
            }
        }
    }

    initFromState (state) {
        this.size = state.size;
        this.sizeBlock = parseInt(""+Math.sqrt(this.size));
        this.board = [];
        this.allowedNumbers = [];

        for (var i = 0; i < this.size; i++) {
          this.board[i] = [];
            for (var j = 0; j < this.size; j++) {
                this.board[i][j] = state.board[i][j];
            }
        }
        for (var i = 0; i < this.size; i++) {
            this.allowedNumbers[i] = [];
            for (var j = 0; j < this.size; j++) {
                this.allowedNumbers[i][j] = state.allowedNumbers[i][j];
            }
        }
    };

    apply (i, j, mask) {
      this.allowedNumbers[i][j] &= mask;
      //if allowedNumbers is zero, a constraint has been violated
        if (this.allowedNumbers[i][j] === 0)
          throw "invalid board";
    }

    setNumber (i, j, v) {
        //constraint propagation
        var setmask = 1 << v;
        var unsetmask = ~setmask;

        this.allowedNumbers[i][j] &= setmask;

        var oi = ((i / this.sizeBlock | 0)) * this.sizeBlock;
        var oj = ((j / this.sizeBlock | 0)) * this.sizeBlock;
        for (var bi = oi; bi < oi + this.sizeBlock; bi++) {
            for (var bj = oj; bj < oj + this.sizeBlock; bj++) {
                if (bi !== i || bj !== j) {
                    this.apply(bi, bj, unsetmask);
                }
            }
        }
        for (var jj = 0; jj < this.size; jj++) {
            if (jj !== j) {
                this.apply(i, jj, unsetmask);
            }
        }
        for (var ii = 0; ii < this.size; ii++) {
            if (ii !== i) {
                this.apply(ii, j, unsetmask);
            }
        }
        this.board[i][j] = ""+digits.charAt(v);
    };

    /**
     * find out an empty cell on board where allowed numbers count is equals to the argument
     *
     * @return {Array} array whose first element is row, second is column, third is allowed numbers count, next are the allowed numbers themselves (max 9)
     * @param {number} number
     */
    findMove (number) {
        var res = null;
        for (var i = 0; i < this.size; i++) {
            for (var j = 0; j < this.size; j++) {
                if (this.board[i][j] === ".") {
                    var count = this.bitCount(this.allowedNumbers[i][j]);
                    if (count === number) {
                        res = {i:i, j:j, values:[]};
                        for (var n = 1; n <= this.size; n++) {
                            if ((this.allowedNumbers[i][j] & (1 << n)) > 0)
                                res.values.push(n);
                        }
                        return res;
                    }
                }
            }
        }
        return res;
    }

    bitCount (u) {
      var uCount = u - ((u >> 1) & 0o33333333333) - ((u >> 2) & 0o11111111111);
      return ((uCount + (uCount >> 3)) & 0o30707070707) % 63;
    }

}

module.exports= SudokuSolver;
