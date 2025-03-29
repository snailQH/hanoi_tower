// 新建一个专门的状态管理文件
window.SudokuGame = {
    state: {
        board: null,
        solution: null,
        playerName: '匿名',
        difficulty: 'easy',
        errors: 0,
        startTime: null,
        timerInterval: null,
        isNotesMode: false,
        selectedCell: null,
        gameActive: false
    },
    // ... 其他模块
}; 