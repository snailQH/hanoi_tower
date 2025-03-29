/**
 * 数独游戏 - 游戏逻辑模块
 * 负责游戏初始化、状态管理和游戏规则
 */
(function() {
    'use strict';
    
    // 游戏配置
    const GAME_CONFIG = {
        difficulties: {
            easy: { minEmpty: 30, maxEmpty: 35, maxErrors: 3 },
            medium: { minEmpty: 40, maxEmpty: 45, maxErrors: 3 },
            hard: { minEmpty: 50, maxEmpty: 55, maxErrors: 3 }
        },
        defaultDifficulty: 'medium',
        hintPenalty: 30, // 使用提示增加的秒数
        errorPenalty: 20  // 每次错误增加的秒数
    };

    // 游戏类
    const Game = {
        // 游戏状态
        state: {
            puzzle: null,
            solution: null,
            currentBoard: null,
            difficulty: GAME_CONFIG.defaultDifficulty,
            errors: 0,
            startTime: null,
            timerInterval: null,
            isGameActive: false,
            playerName: '匿名',
            usedHints: 0
        },

        // 初始化游戏
        init: function() {
            try {
                console.log("开始初始化Game模块...");
                if (!window.SudokuGame.UI) {
                    throw new Error("UI模块未加载");
                }
                
                this.resetGameState();
                this.bindEvents();
                console.log("Game模块初始化完成");
                return true;
            } catch (error) {
                console.error("Game模块初始化失败:", error);
                return false;
            }
        },

        resetGameState: function() {
            this.state = {
                puzzle: null,
                solution: null,
                currentBoard: null,
                difficulty: 'medium',
                errors: 0,
                startTime: null,
                timerInterval: null,
                isGameActive: false,
                playerName: '匿名',
                usedHints: 0
            };
            
            // 清除之前的计时器
            if (this.timerInterval) {
                clearInterval(this.timerInterval);
            }
        },

        // 绑定事件监听器
        bindEvents: function() {
            // 监听单元格值变化
            document.addEventListener('cellValueChanged', (e) => {
                this.handleCellValueChange(e.detail);
            });

            // 监听难度选择变化
            document.getElementById('difficulty').addEventListener('change', (e) => {
                this.state.difficulty = e.target.value;
                this.resetGame();
            });

            // 监听新游戏按钮
            document.getElementById('newGameBtn').addEventListener('click', () => {
                if (confirm('确定要开始新游戏吗？')) {
                    this.resetGame();
                }
            });

            // 监听检查按钮
            document.getElementById('checkBtn').addEventListener('click', () => {
                this.checkCurrentBoard();
            });

            // 监听提示按钮
            document.getElementById('hintBtn').addEventListener('click', () => {
                this.provideHint();
            });

            // 监听胜利模态框的"再来一局"按钮
            document.getElementById('playAgainBtn').addEventListener('click', () => {
                document.getElementById('victoryModal').style.display = 'none';
                this.resetGame();
            });
        },

        // 重置游戏
        resetGame: function() {
            // 清除计时器
            if (this.state.timerInterval) {
                clearInterval(this.state.timerInterval);
            }

            // 重置状态
            this.state.errors = 0;
            this.state.usedHints = 0;
            this.state.isGameActive = false;
            this.state.startTime = null;

            // 更新UI显示
            SudokuGame.UI.updateErrors(0);
            SudokuGame.UI.updateTimer('00:00');

            try {
                // 生成新的数独谜题
                const generated = SudokuGame.Solver.generatePuzzle(this.state.difficulty);
                if (!generated) {
                    throw new Error("生成数独失败");
                }

                this.state.puzzle = generated.puzzle;
                this.state.solution = generated.solution;
                this.state.currentBoard = this.state.puzzle.map(row => [...row]);

                // 重置UI
                SudokuGame.UI.resetBoard();
                SudokuGame.UI.fillBoard(this.state.puzzle);

                console.log("游戏重置成功");
            } catch (error) {
                console.error("重置游戏失败:", error);
                alert("初始化游戏失败，请刷新页面重试");
            }
        },

        // 开始游戏
        startGame: function() {
            if (!this.state.isGameActive) {
                this.state.isGameActive = true;
                this.state.startTime = new Date();
                this.startTimer();
            }
        },

        // 启动计时器
        startTimer: function() {
            this.state.timerInterval = setInterval(() => {
                if (!this.state.startTime) return;
                
                const currentTime = new Date();
                const elapsedSeconds = Math.floor((currentTime - this.state.startTime) / 1000);
                const minutes = Math.floor(elapsedSeconds / 60);
                const seconds = elapsedSeconds % 60;
                
                SudokuGame.UI.updateTimer(
                    `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
                );
            }, 1000);
        },

        // 处理单元格值变化
        handleCellValueChange: function({row, col, value}) {
            if (!this.state.puzzle || !this.state.solution) {
                console.error("游戏状态无效");
                return;
            }
            if (!this.state.isGameActive) {
                this.startGame();
            }

            // 更新当前棋盘状态
            this.state.currentBoard[row][col] = parseInt(value) || 0;

            // 检查是否填写正确
            if (value && value !== this.state.solution[row][col]) {
                this.handleError(row, col);
            } else if (this.isBoardComplete()) {
                this.handleVictory();
            }
        },

        // 处理错误
        handleError: function(error) {
            console.error("游戏错误:", error);
            
            // 尝试恢复游戏状态
            if (this.state.isGameActive) {
                try {
                    // 保存当前进度
                    const gameProgress = {
                        board: this.state.currentBoard,
                        time: this.state.startTime,
                        errors: this.state.errors
                    };
                    
                    // 存储到本地
                    localStorage.setItem('sudokuGameProgress', JSON.stringify(gameProgress));
                    
                    alert("游戏状态已保存，请刷新页面恢复");
                } catch (e) {
                    console.error("无法保存游戏状态:", e);
                    alert("发生错误，需要重新开始游戏");
                }
            }
            
            // 重置游戏状态
            this.resetGame();
        },

        // 处理游戏结束
        handleGameOver: function() {
            clearInterval(this.state.timerInterval);
            alert(`游戏结束！错误次数达到${this.state.errors}次。`);
            this.resetGame();
        },

        // 处理胜利
        handleVictory: function() {
            clearInterval(this.state.timerInterval);
            
            // 更新胜利模态框信息
            document.getElementById('finalTime').textContent = 
                document.getElementById('timer').textContent;
            document.getElementById('finalErrors').textContent = this.state.errors;

            // 计算得分并提交
            this.submitScore();

            // 显示胜利模态框
            SudokuGame.UI.showVictory();
        },

        // 提交分数
        submitScore: function() {
            const endTime = new Date();
            const timeSpent = Math.floor((endTime - this.state.startTime) / 1000);
            
            // 计算最终得分
            const score = {
                playerName: this.state.playerName,
                difficulty: this.state.difficulty,
                timeSpent: timeSpent,
                errors: this.state.errors,
                hintsUsed: this.state.usedHints,
                timestamp: new Date()
            };

            // 提交到排行榜
            SudokuGame.Leaderboard.submitScore(score);
        },

        // 检查当前填写状态
        checkCurrentBoard: function() {
            const errors = SudokuGame.Solver.checkCurrentState(
                this.state.currentBoard, 
                this.state.solution
            );

            if (errors.length > 0) {
                errors.forEach(({row, col}) => {
                    SudokuGame.UI.showError(row, col);
                });
                alert(`发现 ${errors.length} 处错误`);
            } else {
                alert('目前填写都是正确的！');
            }
        },

        // 提供提示
        provideHint: function() {
            const hint = SudokuGame.Solver.getHint(
                this.state.currentBoard, 
                this.state.solution
            );

            if (hint) {
                this.state.usedHints++;
                // 添加提示惩罚时间
                this.state.startTime = new Date(
                    this.state.startTime - GAME_CONFIG.hintPenalty * 1000
                );
                
                SudokuGame.UI.setCellValue(hint.row, hint.col, hint.value);
                this.state.currentBoard[hint.row][hint.col] = hint.value;
            }
        },

        // 检查棋盘是否完成
        isBoardComplete: function() {
            return this.state.currentBoard.every((row, i) =>
                row.every((cell, j) => cell === this.state.solution[i][j])
            );
        },

        // 设置玩家名称
        setPlayerName: function(name) {
            this.state.playerName = name || '匿名';
        },

        // 获取当前游戏状态
        getGameState: function() {
            return {
                difficulty: this.state.difficulty,
                errors: this.state.errors,
                timeSpent: this.state.startTime ? 
                    Math.floor((new Date() - this.state.startTime) / 1000) : 0,
                hintsUsed: this.state.usedHints,
                isActive: this.state.isGameActive
            };
        },

        // 尝试恢复保存的游戏
        tryRestoreGame: function() {
            try {
                const savedProgress = localStorage.getItem('sudokuGameProgress');
                if (savedProgress) {
                    const progress = JSON.parse(savedProgress);
                    
                    // 恢复游戏状态
                    this.state.currentBoard = progress.board;
                    this.state.startTime = new Date(progress.time);
                    this.state.errors = progress.errors;
                    
                    // 更新UI
                    SudokuGame.UI.fillBoard(this.state.currentBoard);
                    SudokuGame.UI.updateErrors(this.state.errors);
                    
                    // 清除保存的进度
                    localStorage.removeItem('sudokuGameProgress');
                    
                    return true;
                }
            } catch (error) {
                console.error("恢复游戏失败:", error);
            }
            return false;
        }
    };

    // 导出模块
    window.SudokuGame.Game = Game;
    console.log("Game模块加载完成");
})();