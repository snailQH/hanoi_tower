/* filepath: /Users/liqinghui/repository/hanoi_tower/sudoku/js/solver.js */
/**
 * 数独游戏 - 解题器模块
 * 负责数独生成、求解和验证
 */
(function() {
    'use strict';
    
    // 常量定义
    const GRID_SIZE = 9;
    const BOX_SIZE = 3;
    const EMPTY_CELL = 0;
    const DIFFICULTY_SETTINGS = {
        easy: { minEmpty: 30, maxEmpty: 35 },
        medium: { minEmpty: 40, maxEmpty: 45 },
        hard: { minEmpty: 50, maxEmpty: 55 }
    };
    
    // 预生成的有效数独解决方案（作为后备方案）
    const FALLBACK_SOLUTION = [
        [1, 2, 3, 4, 5, 6, 7, 8, 9],
        [4, 5, 6, 7, 8, 9, 1, 2, 3],
        [7, 8, 9, 1, 2, 3, 4, 5, 6],
        [2, 3, 4, 5, 6, 7, 8, 9, 1],
        [5, 6, 7, 8, 9, 1, 2, 3, 4],
        [8, 9, 1, 2, 3, 4, 5, 6, 7],
        [3, 4, 5, 6, 7, 8, 9, 1, 2],
        [6, 7, 8, 9, 1, 2, 3, 4, 5],
        [9, 1, 2, 3, 4, 5, 6, 7, 8]
    ];

    /**
     * 生成数独解决方案
     * @returns {Array<Array<number>>} 9x9的完整数独解
     */
    function generateSolution() {
        console.log("Solver.generateSolution: 开始生成数独解");
        
        try {
        // 创建空数独板
            const board = createEmptyBoard();
        
            // 使用回溯法填充数独
        if (solveSudoku(board)) {
            console.log("Solver.generateSolution: 成功生成数独解");
            return board;
            }
            
            console.warn("Solver.generateSolution: 使用回溯法生成失败，使用后备方案");
            return FALLBACK_SOLUTION;
        } catch (error) {
            console.error("Solver.generateSolution: 生成数独解失败", error);
            return FALLBACK_SOLUTION;
        }
    }
    
    /**
     * 创建空的数独板
     * @returns {Array<Array<number>>} 空的9x9数组
     */
    function createEmptyBoard() {
        return Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(EMPTY_CELL));
    }
    
    /**
     * 使用回溯法解决数独
     * @param {Array<Array<number>>} board 数独板
     * @returns {boolean} 是否成功解决
     */
    function solveSudoku(board) {
        const emptyCell = findEmptyCell(board);
        if (!emptyCell) return true; // 所有格子都已填满
        
        const [row, col] = emptyCell;
        const numbers = shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        
        for (const num of numbers) {
                    if (isValidPlacement(board, row, col, num)) {
                        board[row][col] = num;
                        
                        if (solveSudoku(board)) {
                            return true;
                        }
                        
                board[row][col] = EMPTY_CELL; // 回溯
                    }
                }
                
                return false;
    }

    /**
     * 查找空格子
     * @param {Array<Array<number>>} board 数独板
     * @returns {[number, number] | null} 空格子的坐标 [row, col]
     */
    function findEmptyCell(board) {
        for (let row = 0; row < GRID_SIZE; row++) {
            for (let col = 0; col < GRID_SIZE; col++) {
                if (board[row][col] === EMPTY_CELL) {
                    return [row, col];
                }
            }
        }
        return null;
    }

    /**
     * 检查数字放置是否有效
     * @param {Array<Array<number>>} board 数独板
     * @param {number} row 行号
     * @param {number} col 列号
     * @param {number} num 要放置的数字
     * @returns {boolean} 是否可以放置
     */
    function isValidPlacement(board, row, col, num) {
        return (
            isValidRow(board, row, num) &&
            isValidColumn(board, col, num) &&
            isValidBox(board, row, col, num)
        );
    }

    /**
     * 检查行是否有效
     * @param {Array<Array<number>>} board 数独板
     * @param {number} row 行号
     * @param {number} num 要检查的数字
     * @returns {boolean} 是否有效
     */
    function isValidRow(board, row, num) {
        return !board[row].includes(num);
    }

    /**
     * 检查列是否有效
     * @param {Array<Array<number>>} board 数独板
     * @param {number} col 列号
     * @param {number} num 要检查的数字
     * @returns {boolean} 是否有效
     */
    function isValidColumn(board, col, num) {
        return !board.some(row => row[col] === num);
    }

    /**
     * 检查3x3宫格是否有效
     * @param {Array<Array<number>>} board 数独板
     * @param {number} row 行号
     * @param {number} col 列号
     * @param {number} num 要检查的数字
     * @returns {boolean} 是否有效
     */
    function isValidBox(board, row, col, num) {
        const boxRow = Math.floor(row / BOX_SIZE) * BOX_SIZE;
        const boxCol = Math.floor(col / BOX_SIZE) * BOX_SIZE;
        
        for (let i = 0; i < BOX_SIZE; i++) {
            for (let j = 0; j < BOX_SIZE; j++) {
                if (board[boxRow + i][boxCol + j] === num) {
                    return false;
                }
            }
        }
        
        return true;
    }
    
    /**
     * 打乱数组顺序
     * @param {Array} array 要打乱的数组
     * @returns {Array} 打乱后的数组
     */
    function shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
    
    /**
     * 验证数独解是否有效
     * @param {Array<Array<number>>} board 要验证的数独板
     * @returns {boolean} 是否有效
     */
    function validateSolution(board) {
        // 检查每一行
        for (let row = 0; row < GRID_SIZE; row++) {
            if (!isValidSet(board[row])) return false;
        }
        
        // 检查每一列
        for (let col = 0; col < GRID_SIZE; col++) {
            const column = board.map(row => row[col]);
            if (!isValidSet(column)) return false;
        }
        
        // 检查每个3x3宫格
        for (let boxRow = 0; boxRow < GRID_SIZE; boxRow += BOX_SIZE) {
            for (let boxCol = 0; boxCol < GRID_SIZE; boxCol += BOX_SIZE) {
                const box = [];
                for (let i = 0; i < BOX_SIZE; i++) {
                    for (let j = 0; j < BOX_SIZE; j++) {
                        box.push(board[boxRow + i][boxCol + j]);
                    }
                }
                if (!isValidSet(box)) return false;
            }
        }
        
        return true;
    }

    /**
     * 检查一组数字是否有效（1-9各出现一次）
     * @param {Array<number>} numbers 要检查的数字数组
     * @returns {boolean} 是否有效
     */
    function isValidSet(numbers) {
        const seen = new Set();
        for (const num of numbers) {
            if (num === EMPTY_CELL) return false;
            if (seen.has(num)) return false;
            seen.add(num);
        }
        return seen.size === GRID_SIZE;
    }

    /**
     * 计算数独难度
     * @param {Array<Array<number>>} board 数独板
     * @returns {string} 难度等级
     */
    function calculateDifficulty(board) {
        let emptyCells = 0;
        let patterns = 0;
        
        // 计算空格数和特殊模式
        for (let row = 0; row < GRID_SIZE; row++) {
            for (let col = 0; col < GRID_SIZE; col++) {
                if (board[row][col] === EMPTY_CELL) {
                    emptyCells++;
                    patterns += countPossibleValues(board, row, col);
                }
            }
        }
        
        // 根据空格数和可能值的平均数确定难度
        const averagePatterns = patterns / (emptyCells || 1);
        
        if (emptyCells < 35) return 'easy';
        if (emptyCells < 45) return 'medium';
        if (emptyCells < 55) return 'hard';
        return 'expert';
    }

    /**
     * 计算某个位置可能的值的数量
     * @param {Array<Array<number>>} board 数独板
     * @param {number} row 行号
     * @param {number} col 列号
     * @returns {number} 可能值的数量
     */
    function countPossibleValues(board, row, col) {
        let count = 0;
        for (let num = 1; num <= GRID_SIZE; num++) {
            if (isValidPlacement(board, row, col, num)) {
                count++;
            }
        }
        return count;
    }

    // 数独求解器类
    const Solver = {
        // 生成新的数独谜题
        generatePuzzle: function(difficulty = 'medium') {
            console.log(`开始生成${difficulty}难度的数独...`);
            
            let attempts = 0;
            const maxAttempts = 3;
            
            while (attempts < maxAttempts) {
                try {
                    const solution = this.generateSolution();
                    if (!solution) {
                        throw new Error("无法生成有效解");
                    }

                    const puzzle = this.createPuzzle(solution, difficulty);
                    if (!puzzle) {
                        throw new Error("无法生成有效谜题");
                    }

                    console.log("数独生成成功");
                    return { puzzle, solution };
                } catch (error) {
                    console.warn(`生成尝试 ${attempts + 1} 失败:`, error);
                    attempts++;
                }
            }

            console.error("达到最大尝试次数，使用备用谜题");
            return this.getBackupPuzzle(difficulty);
        },

        // 生成完整的数独解
        generateSolution: function() {
            const grid = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(EMPTY_CELL));
            
            // 填充对角线上的3个3x3方块(这些可以独立填充)
            for (let i = 0; i < GRID_SIZE; i += BOX_SIZE) {
                this.fillBox(grid, i, i);
            }
            
            // 填充剩余的格子
            if (this.solveSudoku(grid)) {
                return grid;
            }
            return null;
        },

        // 填充3x3的方块
        fillBox: function(grid, row, col) {
            const numbers = this.shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);
            let index = 0;
            
            for (let i = 0; i < BOX_SIZE; i++) {
                for (let j = 0; j < BOX_SIZE; j++) {
                    grid[row + i][col + j] = numbers[index++];
                }
            }
        },

        // 创建谜题(通过从解中移除数字)
        createPuzzle: function(solution, difficulty) {
            const puzzle = solution.map(row => [...row]);
            const settings = DIFFICULTY_SETTINGS[difficulty];
            const cellsToRemove = Math.floor(
                Math.random() * (settings.maxEmpty - settings.minEmpty + 1) + settings.minEmpty
            );
            
            // 随机移除数字
            let removed = 0;
            while (removed < cellsToRemove) {
                const row = Math.floor(Math.random() * GRID_SIZE);
                const col = Math.floor(Math.random() * GRID_SIZE);
                
                if (puzzle[row][col] !== EMPTY_CELL) {
                    const temp = puzzle[row][col];
                    puzzle[row][col] = EMPTY_CELL;
                    
                    // 确保谜题仍然只有唯一解
                    if (this.countSolutions(puzzle) === 1) {
                        removed++;
                    } else {
                        puzzle[row][col] = temp;
                    }
                }
            }
            
            return puzzle;
        },

        // 计算谜题的解的数量
        countSolutions: function(grid, limit = 2) {
            const solutions = [];
            
            const findSolutions = (g) => {
                if (solutions.length >= limit) return;
                
                const empty = this.findEmptyCell(g);
                if (!empty) {
                    solutions.push(g.map(row => [...row]));
                    return;
                }
                
                const [row, col] = empty;
                for (let num = 1; num <= GRID_SIZE; num++) {
                    if (this.isValidPlacement(g, row, col, num)) {
                        g[row][col] = num;
                        findSolutions(g);
                        g[row][col] = EMPTY_CELL;
                    }
                }
            };
            
            findSolutions(grid.map(row => [...row]));
            return solutions.length;
        },

        // 求解数独
        solveSudoku: function(grid) {
            const empty = this.findEmptyCell(grid);
            if (!empty) return true;
            
            const [row, col] = empty;
            const numbers = this.shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);
            
            for (const num of numbers) {
                if (this.isValidPlacement(grid, row, col, num)) {
                    grid[row][col] = num;
                    
                    if (this.solveSudoku(grid)) {
                        return true;
                    }
                    
                    grid[row][col] = EMPTY_CELL;
                }
            }
            
            return false;
        },

        // 查找空格子
        findEmptyCell: function(grid) {
            for (let row = 0; row < GRID_SIZE; row++) {
                for (let col = 0; col < GRID_SIZE; col++) {
                    if (grid[row][col] === EMPTY_CELL) {
                        return [row, col];
                    }
                }
            }
            return null;
        },

        // 验证数字放置是否有效
        isValidPlacement: function(grid, row, col, num) {
            return this.isValidRow(grid, row, num) &&
                   this.isValidColumn(grid, col, num) &&
                   this.isValidBox(grid, row - row % BOX_SIZE, col - col % BOX_SIZE, num);
        },

        // 验证行
        isValidRow: function(grid, row, num) {
            return !grid[row].includes(num);
        },

        // 验证列
        isValidColumn: function(grid, col, num) {
            return !grid.some(row => row[col] === num);
        },

        // 验证3x3方块
        isValidBox: function(grid, startRow, startCol, num) {
            for (let row = 0; row < BOX_SIZE; row++) {
                for (let col = 0; col < BOX_SIZE; col++) {
                    if (grid[row + startRow][col + startCol] === num) {
                        return false;
                    }
                }
            }
            return true;
        },

        // 数组随机排序
        shuffleArray: function(array) {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
            return array;
        },

        // 验证完整的数独解
        validateSolution: function(grid) {
            // 验证每一行
            for (let row = 0; row < GRID_SIZE; row++) {
                const rowNums = new Set(grid[row]);
                if (rowNums.size !== GRID_SIZE || rowNums.has(EMPTY_CELL)) return false;
            }
            
            // 验证每一列
            for (let col = 0; col < GRID_SIZE; col++) {
                const colNums = new Set(grid.map(row => row[col]));
                if (colNums.size !== GRID_SIZE || colNums.has(EMPTY_CELL)) return false;
            }
            
            // 验证每个3x3方块
            for (let boxRow = 0; boxRow < GRID_SIZE; boxRow += BOX_SIZE) {
                for (let boxCol = 0; boxCol < GRID_SIZE; boxCol += BOX_SIZE) {
                    const boxNums = new Set();
                    for (let i = 0; i < BOX_SIZE; i++) {
                        for (let j = 0; j < BOX_SIZE; j++) {
                            boxNums.add(grid[boxRow + i][boxCol + j]);
                        }
                    }
                    if (boxNums.size !== GRID_SIZE || boxNums.has(EMPTY_CELL)) return false;
                }
            }
            
            return true;
        },

        // 获取提示
        getHint: function(puzzle, solution) {
            // 找到一个空格子或错误的格子
            for (let row = 0; row < GRID_SIZE; row++) {
                for (let col = 0; col < GRID_SIZE; col++) {
                    if (puzzle[row][col] === EMPTY_CELL || 
                        puzzle[row][col] !== solution[row][col]) {
                        return {
                            row: row,
                            col: col,
                            value: solution[row][col]
                        };
                    }
                }
            }
            return null;
        },

        // 检查当前填写是否正确
        checkCurrentState: function(puzzle, solution) {
            const errors = [];
            for (let row = 0; row < GRID_SIZE; row++) {
                for (let col = 0; col < GRID_SIZE; col++) {
                    if (puzzle[row][col] !== EMPTY_CELL && 
                        puzzle[row][col] !== solution[row][col]) {
                        errors.push({row, col});
                    }
                }
            }
            return errors;
        },

        // 添加备用数独谜题
        getBackupPuzzle: function(difficulty) {
            // 预定义的数独谜题
            const backupPuzzles = {
                easy: {
                    puzzle: [/* 预定义的简单数独 */],
                    solution: [/* 对应的解答 */]
                },
                medium: {
                    puzzle: [/* 预定义的中等数独 */],
                    solution: [/* 对应的解答 */]
                },
                hard: {
                    puzzle: [/* 预定义的困难数独 */],
                    solution: [/* 对应的解答 */]
                }
            };

            return backupPuzzles[difficulty] || backupPuzzles.medium;
        }
    };
    
    // 导出模块
    window.SudokuGame.Solver = Solver;
    console.log("Solver模块加载完成");
})();