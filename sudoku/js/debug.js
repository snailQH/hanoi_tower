// 创建新的调试模块
window.SudokuGame.Debug = {
    logGameState: function() {
        console.log({
            initialized: window.SudokuGame.state.initialized,
            gameState: window.SudokuGame.Game.state,
            uiState: window.SudokuGame.UI.state
        });
    },

    validateBoard: function() {
        const game = window.SudokuGame.Game;
        const solver = window.SudokuGame.Solver;
        
        if (!game.state.currentBoard) {
            console.error("没有活动的游戏板");
            return false;
        }

        return solver.validateSolution(game.state.currentBoard);
    },

    runDiagnostics: function() {
        console.group("数独游戏诊断");
        this.logGameState();
        console.log("棋盘验证:", this.validateBoard());
        console.groupEnd();
    }
}; 