'use strict';

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
        for (moveSize = 2; moveSize <= 9; moveSize++) {
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
        this.allowedNumbers = null;
        this.board = null;
    }

    init (board) {
        this.board = board;
        this.allowedNumbers = [];

        for (var i = 0; i < board.length; i++) {
            this.allowedNumbers[i] = [];
            for (var j = 0; j < board.length; j++) {
                this.allowedNumbers[i][j] = 0b1111111110;
            }
        }

        for (var i = 0; i < board.length; i++) {
            for (var j = 0; j < board.length; j++) {
                var c = board[i][j];
                if(c !==".")
                  this.setNumber(i, j, parseInt(c));
            }
        }
    }

    initFromState (state) {
        this.board = [];
        this.allowedNumbers = [];

        for (var i = 0; i < state.board.length; i++) {
          this.board[i] = [];
            for (var j = 0; j < state.board.length; j++) {
                this.board[i][j] = state.board[i][j];
            }
        }
        for (var i = 0; i < state.board.length; i++) {
            this.allowedNumbers[i] = [];
            for (var j = 0; j < state.board.length; j++) {
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

        var oi = ((i / 3 | 0)) * 3;
        var oj = ((j / 3 | 0)) * 3;
        for (var bi = oi; bi < oi + 3; bi++) {
            for (var bj = oj; bj < oj + 3; bj++) {
                if (bi !== i || bj !== j) {
                    this.apply(bi, bj, unsetmask);
                }
            }
        }
        for (var jj = 0; jj < this.allowedNumbers.length; jj++) {
            if (jj !== j) {
                this.apply(i, jj, unsetmask);
            }
        }
        for (var ii = 0; ii < this.allowedNumbers.length; ii++) {
            if (ii !== i) {
                this.apply(ii, j, unsetmask);
            }
        }
        this.board[i][j] = "" + v;
    };

    /**
     * find out an empty cell on board where allowed numbers count is equals to the argument
     *
     * @return {Array} array whose first element is row, second is column, third is allowed numbers count, next are the allowed numbers themselves (max 9)
     * @param {number} number
     */
    findMove (number) {
        var res = null;
        for (var i = 0; i < this.board.length; i++) {
            for (var j = 0; j < this.board.length; j++) {
                if (this.board[i][j] === ".") {
                    var count = this.bitCount(this.allowedNumbers[i][j]);
                    if (count === number) {
                        res = {i:i, j:j, values:[]};
                        for (var n = 1; n <= 9; n++) {
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
