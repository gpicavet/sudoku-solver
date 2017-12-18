'use strict';

//digits up to alphadoku 16x16 !
const digits = " 123456789ABCDEFG";

class SudokuSolver {

    constructor() {
      this.stats = {}; // some stats
    }

    /**
     * find the first solution of this board or throws an "invalid board "exception if it can not be solved.
     * @param board a 2D array of cells containing string digits for clues and "." for empty cells. 
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
        if(this.stats.backtracks>10000) {//avoid infinite loop!
            throw "backtrack overflow";        
        }

        //while there's a cell having one possible digit, set it.
        let cell = state.findEmptyCell(1);
        while (cell != null) {
            state.setCell(cell.i, cell.j, cell.values[0]);
            cell = state.findEmptyCell(1);
            this.stats.tests++;
        }

        //there's no single choice anymore, so we find a cell with minimum possibilities (starting with 2!) and explore each
        //one of them is a solution others will conflict. 
        //If a conflict is detected we have to go back to the initial state.
        let cellChoices;
        for (cellChoices = 2; cellChoices <= state.size; cellChoices++) {
            cell = state.findEmptyCell(cellChoices);
            if (cell != null)
                break;
        }
        if (cell != null) {
            for (var cellVal of cell.values) {
                let newState = new State();
                newState.initFromState(state);
                newState.setCell(cell.i, cell.j, cellVal);
                try {
                    //try to solve from this new state
                    //it only returns when a solution has been fund!
                    return this._solve(newState);
                }
                catch (e) {
                    this.stats.backtracks++;
                    //error => continue exploring
                }
            }
            //all possibilities are in conflict state, so the parent state is invalid.
            throw "invalid board";
        } else {
            return state;
        }
    }
}


class State {
    constructor() {
        //2D array of cells allowed digits. Each cell allowed digit corresponds to a bit. Ex: If 9 and 5 are allowed : "0..01000100000"
        this.allowedDigits = null;
        this.board = null;
        this.size = 0;
        this.sizeBlock = 0;
    }

    init (board) {
        this.size = board.length;
        this.sizeBlock = parseInt(""+Math.sqrt(this.size));
        this.board = [];
        this.allowedDigits = [];

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
            this.allowedDigits.push(row);
        }

        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                let c = board[i][j];
                if(c !== ".")
                  this.setCell(i, j, digits.indexOf(c.toUpperCase()));
            }
        }
    }

    initFromState (state) {
        this.size = state.size;
        this.sizeBlock = parseInt(""+Math.sqrt(this.size));
        this.board = [];
        this.allowedDigits = [];

        this.copy(this.board, state.board);
        this.copy(this.allowedDigits, state.allowedDigits);

    }

    /**
     * set a cell digit at i-th row and j-th column, unless there's a constraint violation
     */
    setCell (i, j, digit) {
        //do constraint propagation

        //set the bit for this digit
        var setmask = 1 << digit;
        //unset bit mask
        var unsetmask = ~setmask;

        //this cell only has one allowed digit
        this.allowedDigits[i][j] = setmask;

        //unset allowed digits of others cell
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

    apply (i, j, mask) {
      //apply mask
      this.allowedDigits[i][j] &= mask;
      //if allowedDigits is zero, a constraint has been violated
        if (this.allowedDigits[i][j] === 0)
          throw "invalid board";
    }

    /**
     * find out an empty cell on board where allowed numbers count is equals to the argument
     *
     * @return {Array} array whose first element is row, second is column, third is allowed numbers count, next are the allowed numbers themselves (max 9)
     * @param {possibilities} number
     */
    findEmptyCell (possibilities) {
        var res = null;
        for (var i = 0; i < this.size; i++) {
            for (var j = 0; j < this.size; j++) {
                if (this.board[i][j] === ".") {

                    var count = this.bitCount(this.allowedDigits[i][j]);
                    if (count === possibilities) {
                        //found one    
                        res = {i:i, j:j, values:[]};
                        for (var n = 1; n <= this.size; n++) {
                            if ((this.allowedDigits[i][j] & (1 << n)) > 0)
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
     * trick to count bits of an int
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