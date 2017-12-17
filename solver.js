'use strict';

//digits up to alphadoku 16x16 !
const digits = " 123456789ABCDEFG";

class SudokuSolver {

    constructor() {
      this.stats = {}; // some stats
    }

    /**
     * find the first solution of this board. Throws an "invalid board "exception if board can not be solved.
     * @param board a 2D array of strings
     */
    solve (board) {
        this.stats={tests:0, backtracks:0, time:Date.now()};

        let state = new State();
        state.init(board);
        state = this._solve(state);

        this.stats.time = Date.now()-this.stats.time;

        return state.board;
    }

    /**
     * recursive solve from this state
     * @param state 
     */
    _solve (state) {
        if(this.stats.backtracks>10000) {
            throw "backtrack overflow";        
        }

        //first do all single moves we can
        let move = state.findMove(1);
        while (move != null) {
            state.setDigit(move.i, move.j, move.values[0]);
            move = state.findMove(1);
            this.stats.tests++;
        }

        //if there's no more single move, find the move with minimum possibilities and do backtracking
        let moveSize;
        for (moveSize = 2; moveSize <= state.size; moveSize++) {
            move = state.findMove(moveSize);
            if (move != null)
                break;
        }
        if (move != null) {
            for (var moveVal of move.values) {
                let newState = new State();
                newState.initFromState(state);
                newState.setDigit(move.i, move.j, moveVal);
                try {
                    //try to solve from this new state
                    return this._solve(newState);
                }
                catch (e) {
                    this.stats.backtracks++;
                    //error ? continue
                }
            }
            //this board can not be solved, we move backward.
            throw "invalid board";
        } else {
            return state;
        }
    }
}


class State {
    constructor() {
        //2D array of integers, whose bits correspond to cell allowed numbers
        this.allowedNumbers = null;
        this.board = null;
        this.size = 0;
        this.sizeBlock = 0;
    }

    init (board) {
        this.size = board.length;
        this.sizeBlock = parseInt(""+Math.sqrt(this.size));
        this.board = [];
        this.allowedNumbers = [];

        this.copy(this.board, board);

        let allbits=0;
        for (let i = 1; i <= this.size; i++) {
          allbits |= 1<<i;
        }

        for (let i = 0; i < this.size; i++) {
            let row = [];
            for (let j = 0; j < this.size; j++) {
                row.push(allbits);
            }
            this.allowedNumbers.push(row);
        }

        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                let c = board[i][j];
                if(c !== ".")
                  this.setDigit(i, j, digits.indexOf(c.toUpperCase()));
            }
        }
    }

    initFromState (state) {
        this.size = state.size;
        this.sizeBlock = parseInt(""+Math.sqrt(this.size));
        this.board = [];
        this.allowedNumbers = [];

        this.copy(this.board, state.board);
        this.copy(this.allowedNumbers, state.allowedNumbers);

    }

    apply (i, j, mask) {
      //apply mask
      this.allowedNumbers[i][j] &= mask;
      //if allowedNumbers is zero, a constraint has been violated
        if (this.allowedNumbers[i][j] === 0)
          throw "invalid board";
    }

    /**
     * set a digit a ith row and jth column, unless there's a constraint violation
     */
    setDigit (i, j, digit) {
        //constraint propagation

        //set the bit for this digit
        var setmask = 1 << digit;
        //unset bit mask
        var unsetmask = ~setmask;

        this.allowedNumbers[i][j] = setmask;

        var oi = i - (i % this.sizeBlock);
        var oj = j - (j % this.sizeBlock);
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
        this.board[i][j] = ""+digits.charAt(digit);
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

    /**
     * bit count of this int
     */
    bitCount (u) {
      var uCount = u - ((u >> 1) & 0o33333333333) - ((u >> 2) & 0o11111111111);
      return ((uCount + (uCount >> 3)) & 0o30707070707) % 63;
    }

    copy (d, s) {
        for (var i = 0; i < s.length; i++) {
            let row = [];
            for (var j = 0; j < s[i].length; j++) {
                row.push(s[i][j]);
            }
            d.push(row);
        }
    }
}

module.exports= SudokuSolver;
