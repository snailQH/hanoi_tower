/**
 * 数独游戏 - UI模块
 * 负责创建和更新游戏界面
 */
(function() {
    'use strict';

    // 确保SudokuGame对象存在
    if (typeof window.SudokuGame === 'undefined') {
        console.error('SudokuGame对象未定义');
        return;
    }

    // UI模块
    const UI = {
        // DOM元素缓存
        elements: {},
        
        // 状态变量
        state: {
            selectedCell: null,
            isNotesMode: false,
            isMobile: /Mobile|Android|iOS|iPhone|iPad|iPod/i.test(navigator.userAgent)
        },

        // 初始化UI
        init: function() {
            try {
                console.log("UI模块开始初始化...");
                
                // 首先检查游戏容器是否显示
                const gameContent = document.getElementById('gameContent');
                if (gameContent) {
                    gameContent.style.display = 'block';
                }

                // 检查并初始化基本元素
                const basicElements = {
                    board: document.getElementById('sudokuBoard'),
                    numberPad: document.querySelector('.number-pad'),
                    timer: document.getElementById('timer'),
                    errors: document.getElementById('errors')
                };

                // 验证基本元素
                for (const [key, element] of Object.entries(basicElements)) {
                    if (!element) {
                        throw new Error(`找不到必要的DOM元素: ${key}`);
                    }
                    this.elements[key] = element;
                }

                // 初始化棋盘
                this.createBoard();
                console.log("棋盘创建成功");

                // 初始化数字选择器
                this.createNumberPad();
                console.log("数字选择器创建成功");

                // 初始化事件监听
                this.initEventListeners();
                console.log("事件监听器初始化成功");

                // 添加游戏说明折叠功能
                this.initInstructions();

                console.log("UI模块初始化完成");
                return true;
            } catch (error) {
                console.error("UI模块初始化失败:", error);
                this.showError("UI模块初始化失败: " + error.message);
                return false;
            }
        },

        // 初始化DOM引用
        initDOMReferences: function() {
            try {
                // 基础游戏元素
                this.elements = {
                    board: document.getElementById('sudokuBoard'),
                    numberPad: document.querySelector('.number-pad'),
                    timer: document.getElementById('timer'),
                    errors: document.getElementById('errors'),
                    noteBtn: document.getElementById('noteBtn'),
                    cells: [],
                    numberButtons: [],
                    newGameBtn: null,
                    checkBtn: null,
                    hintBtn: null,
                    difficulty: null
                };

                // 验证必要元素存在
                for (const [key, element] of Object.entries(this.elements)) {
                    if (!element && key !== 'cells') {
                        throw new Error(`找不到必要的DOM元素: ${key}`);
                    }
                }
            } catch (error) {
                console.error("初始化DOM引用失败:", error.message);
                throw error;
            }
        },

        // 创建数独棋盘
        createBoard: function() {
            const board = this.elements.board;
            board.innerHTML = '';
            this.elements.cells = [];

            for (let i = 0; i < 81; i++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.index = i;
                cell.dataset.row = Math.floor(i / 9);
                cell.dataset.col = i % 9;

                const valueDisplay = document.createElement('div');
                valueDisplay.className = 'value-display';
                cell.appendChild(valueDisplay);

                const notesContainer = document.createElement('div');
                notesContainer.className = 'notes-container';
                for (let j = 1; j <= 9; j++) {
                    const note = document.createElement('span');
                    note.className = 'note';
                    note.textContent = j;
                    notesContainer.appendChild(note);
                }
                cell.appendChild(notesContainer);

                board.appendChild(cell);
                this.elements.cells.push(cell);
            }
        },

        // 创建数字选择器
        createNumberPad: function() {
            const numberPad = this.elements.numberPad;
            numberPad.innerHTML = '';

            for (let i = 1; i <= 9; i++) {
                const button = document.createElement('button');
                button.className = 'number-btn';
                button.textContent = i;
                numberPad.appendChild(button);
            }

            const eraseBtn = document.createElement('button');
            eraseBtn.className = 'number-btn erase';
            eraseBtn.textContent = '✕';
            numberPad.appendChild(eraseBtn);
        },

        // 初始化事件监听器
        initEventListeners: function() {
            try {
                // 单元格点击事件
                this.elements.cells.forEach(cell => {
                    cell.addEventListener('click', (e) => this.handleCellClick(e));
                    
                    // 移动端触摸事件
                    if (this.state.isMobile) {
                        cell.addEventListener('touchstart', (e) => {
                            e.preventDefault();
                            this.handleCellClick(e);
                        });
                    }
                });

                // 数字按钮点击事件
                const numberButtons = document.querySelectorAll('.number-btn');
                numberButtons.forEach((button, index) => {
                    button.addEventListener('click', () => {
                        if (index < 9) {
                            this.handleNumberClick(index + 1);
                        } else {
                            this.handleEraseClick();
                        }
                    });
                    
                    if (this.state.isMobile) {
                        button.addEventListener('touchstart', (e) => {
                            e.preventDefault();
                            this.handleNumberClick(index + 1);
                        });
                    }
                });

                // 笔记模式按钮
                if (this.elements.noteBtn) {
                    this.elements.noteBtn.addEventListener('click', () => this.toggleNotesMode());
                }

                // 键盘输入支持
                document.addEventListener('keydown', (e) => this.handleKeyPress(e));
            } catch (error) {
                console.error("初始化事件监听器失败:", error.message);
                throw error;
            }
        },

        // 处理单元格点击
        handleCellClick: function(e) {
            const cell = e.target.closest('.cell');
            if (!cell || cell.classList.contains('fixed')) return;
            
            // 取消之前的选择
            if (this.state.selectedCell) {
                this.state.selectedCell.classList.remove('selected');
            }
            
            // 选择新的单元格
            cell.classList.add('selected');
            this.state.selectedCell = cell;
            
            // 高亮相关单元格
            this.highlightRelatedCells(cell);
        },

        // 处理数字点击
        handleNumberClick: function(number) {
            if (!this.state.selectedCell) return;
            
            const valueDisplay = this.state.selectedCell.querySelector('.value-display');
            valueDisplay.textContent = number;
            
            // 触发值更改事件
            const event = new CustomEvent('cellValueChanged', {
                detail: {
                    row: parseInt(this.state.selectedCell.dataset.row),
                    col: parseInt(this.state.selectedCell.dataset.col),
                    value: number
                }
            });
            document.dispatchEvent(event);
        },

        // 处理键盘输入
        handleKeyPress: function(e) {
            if (!this.state.selectedCell) return;
            
            if (e.key >= '1' && e.key <= '9') {
                this.handleNumberClick(parseInt(e.key));
            } else if (e.key === 'Backspace' || e.key === 'Delete') {
                this.clearCell(this.state.selectedCell);
            }
        },

        // 设置单元格值
        setCellValue: function(row, col, value) {
            console.log(`设置单元格值: (${row}, ${col}) = ${value}`);
            const cell = this.elements.cells[row * 9 + col];
            const valueDisplay = cell.querySelector('.value-display');
            valueDisplay.textContent = value;
            
            // 清除笔记
            const notes = cell.querySelectorAll('.note');
            notes.forEach(note => note.classList.remove('visible'));
            
            // 触发值更改事件
            const event = new CustomEvent('cellValueChanged', {
                detail: { row, col, value }
            });
            document.dispatchEvent(event);
        },

        // 切换笔记模式
        toggleNotesMode: function() {
            this.state.isNotesMode = !this.state.isNotesMode;
            this.elements.noteBtn.classList.toggle('active');
        },

        // 切换笔记
        toggleNote: function(row, col, number) {
            const cell = this.elements.cells[row * 9 + col];
            const note = cell.querySelectorAll('.note')[number - 1];
            note.classList.toggle('visible');
        },

        // 高亮相关单元格
        highlightRelatedCells: function(cell) {
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            
            this.elements.cells.forEach(c => {
                c.classList.remove('related');
                const cRow = parseInt(c.dataset.row);
                const cCol = parseInt(c.dataset.col);
                
                // 同行、同列或同一个3x3宫格
                if (cRow === row || cCol === col || 
                    (Math.floor(cRow/3) === Math.floor(row/3) && 
                     Math.floor(cCol/3) === Math.floor(col/3))) {
                    c.classList.add('related');
                }
            });
        },

        // 清除单元格
        clearCell: function(cell) {
            const valueDisplay = cell.querySelector('.value-display');
            valueDisplay.textContent = '';
            
            // 清除笔记
            const notes = cell.querySelectorAll('.note');
            notes.forEach(note => note.classList.remove('visible'));
        },

        // 更新计时器显示
        updateTimer: function(time) {
            this.elements.timer.textContent = time;
        },

        // 更新错误计数
        updateErrors: function(count) {
            this.elements.errors.textContent = count;
        },

        // 填充初始数独板
        fillBoard: function(puzzle) {
            puzzle.forEach((row, rowIndex) => {
                row.forEach((value, colIndex) => {
                    if (value !== 0) {
                        const cell = this.elements.cells[rowIndex * 9 + colIndex];
                        this.setCellValue(rowIndex, colIndex, value);
                        cell.classList.add('fixed');
                    }
                });
            });
        },

        // 显示错误
        showError: function(message) {
            const errorDiv = document.createElement('div');
            errorDiv.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: #ff5252;
                color: white;
                padding: 20px;
                border-radius: 5px;
                text-align: center;
                z-index: 1000;
                box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            `;
            
            errorDiv.innerHTML = `
                <div>${message}</div>
                <button onclick="location.reload()" style="
                    margin-top: 10px;
                    padding: 8px 16px;
                    background: white;
                    color: #ff5252;
                    border: none;
                    border-radius: 3px;
                    cursor: pointer;
                ">刷新页面</button>
            `;
            
            document.body.appendChild(errorDiv);
        },

        // 显示胜利
        showVictory: function() {
            document.getElementById('victoryModal').style.display = 'flex';
        },

        // 重置棋盘
        resetBoard: function() {
            this.elements.cells.forEach(cell => {
                this.clearCell(cell);
                cell.classList.remove('fixed', 'error', 'selected', 'related');
            });
            
            if (this.state.selectedCell) {
                this.state.selectedCell = null;
            }
            
            this.state.isNotesMode = false;
            this.elements.noteBtn.classList.remove('active');
        },

        // 处理擦除点击
        handleEraseClick: function() {
            if (!this.state.selectedCell) return;
            
            const valueDisplay = this.state.selectedCell.querySelector('.value-display');
            valueDisplay.textContent = '';
        },

        // 添加新方法
        initInstructions: function() {
            const instructions = document.querySelector('.game-instructions');
            const content = document.querySelector('.instruction-content');
            
            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'instruction-toggle';
            toggleBtn.textContent = '隐藏说明';
            instructions.insertBefore(toggleBtn, content);
            
            toggleBtn.addEventListener('click', () => {
                content.classList.toggle('collapsed');
                toggleBtn.textContent = content.classList.contains('collapsed') ? 
                    '显示说明' : '隐藏说明';
            });
        }
    };

    // 导出模块
    window.SudokuGame = window.SudokuGame || {};
    window.SudokuGame.UI = UI;
    console.log("UI模块加载完成");
})();