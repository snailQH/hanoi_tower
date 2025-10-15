/**
 * 数独游戏 - 排行榜模块
 * 负责处理排行榜数据的加载、显示和提交成绩
 */
(function() {
    'use strict';
    
    // 排行榜配置
    const LEADERBOARD_CONFIG = {
        recordsPerPage: 10,
        updateInterval: 60000, // 自动更新间隔(毫秒)
        difficulties: ['easy', 'medium', 'hard'],
        difficultyNames: {
            easy: '简单',
            medium: '中等',
            hard: '困难'
        }
    };

    // LeanCloud配置, appId: "l0pEfgHT7pBH9gxzqIaYmMlY-gzGzoHsz",appKey: "DOjFLuTJvqvLZGky8FSfMZjL",serverURL: "https://l0pefght.lc-cn-n1-shared.com"
    const LEANCLOUD_CONFIG = {
        appId: "nKK1iiL13vVjKrEToTXrvrYS-MdYXbMMI",
        appKey: "tCdbaUwBHeMgXvln6NoqIb0X",
        serverURL: "https://l0pefght.lc-cn-n1-shared.com"
    };

    // 排行榜类
    const Leaderboard = {
        state: {
            currentDifficulty: 'medium',
            isLoading: false,
            updateTimer: null
        },

        // 初始化排行榜
        init: function() {
            try {
                this.initDOMElements();
                this.bindEvents();
                this.loadLeaderboard(this.state.currentDifficulty);
                this.setupAutoUpdate();
                return true;
            } catch (error) {
                console.error("初始化排行榜失败:", error);
                return false;
            }
        },

        // 初始化DOM元素引用
        initDOMElements: function() {
            this.elements = {
                leaderboardBody: document.getElementById('leaderboardBody'),
                difficultyTabs: document.querySelectorAll('.leaderboard-tabs .control-btn'),
                visitorCount: document.getElementById('visitorCount')
            };

            if (!this.elements.leaderboardBody || !this.elements.difficultyTabs) {
                throw new Error("找不到必要的排行榜DOM元素");
            }
        },

        // 绑定事件
        bindEvents: function() {
            // 难度标签切换
            this.elements.difficultyTabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    this.switchDifficulty(tab.dataset.difficulty);
                });
            });
        },

        // 切换难度
        switchDifficulty: function(difficulty) {
            if (this.state.isLoading || this.state.currentDifficulty === difficulty) return;

            // 更新标签状态
            this.elements.difficultyTabs.forEach(tab => {
                tab.classList.toggle('active', tab.dataset.difficulty === difficulty);
            });

            this.state.currentDifficulty = difficulty;
            this.loadLeaderboard(difficulty);
        },

        // 加载排行榜数据
        loadLeaderboard: async function(difficulty) {
            if (this._loadingThrottle) return;
            this._loadingThrottle = true;
            setTimeout(() => { this._loadingThrottle = false; }, 1000);

            if (this.state.isLoading) return;

            this.state.isLoading = true;
            this.showLoading();

            try {
                // 创建查询
                const query = new AV.Query('Score');
                query.equalTo('difficulty', difficulty);
                query.descending('score'); // 按分数降序
                query.limit(LEADERBOARD_CONFIG.recordsPerPage);

                // 执行查询
                const scores = await query.find();
                this.updateLeaderboardUI(scores);
            } catch (error) {
                console.error("加载排行榜失败:", error);
                this.showError("加载排行榜失败，请稍后重试");
            } finally {
                this.state.isLoading = false;
            }
        },

        // 更新排行榜UI
        updateLeaderboardUI: function(scores) {
            const tbody = this.elements.leaderboardBody;
            tbody.innerHTML = '';

            if (scores.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="5" class="empty-message">
                            暂无记录
                        </td>
                    </tr>
                `;
                return;
            }

            scores.forEach((score, index) => {
                const data = score.toJSON();
                const row = document.createElement('tr');
                
                // 判断是否是当前玩家
                if (data.playerName === SudokuGame.Game.state.playerName) {
                    row.classList.add('current-user');
                }

                // 添加排名样式
                if (index < 3) {
                    row.classList.add(`rank-${index + 1}`);
                }

                row.innerHTML = `
                    <td class="rank-cell">${index + 1}</td>
                    <td>${this.escapeHTML(data.playerName)}</td>
                    <td>${this.formatTime(data.timeSpent)}</td>
                    <td>${data.errors || 0}</td>
                    <td>${this.formatDate(data.timestamp)}</td>
                `;

                tbody.appendChild(row);
            });
        },

        // 提交分数
        submitScore: async function(scoreData) {
            try {
                const Score = AV.Object.extend('Score');
                const score = new Score();

                // 计算最终得分
                const finalScore = this.calculateScore(
                    scoreData.timeSpent,
                    scoreData.errors,
                    scoreData.hintsUsed,
                    scoreData.difficulty
                );

                // 设置分数数据
                score.set('playerName', scoreData.playerName);
                score.set('difficulty', scoreData.difficulty);
                score.set('timeSpent', scoreData.timeSpent);
                score.set('errors', scoreData.errors);
                score.set('hintsUsed', scoreData.hintsUsed);
                score.set('score', finalScore);
                score.set('timestamp', scoreData.timestamp);

                // 保存分数
                await score.save();
                
                // 刷新排行榜
                this.loadLeaderboard(this.state.currentDifficulty);
                
                return true;
            } catch (error) {
                console.error("提交分数失败:", error);
                return false;
            }
        },

        // 计算最终得分
        calculateScore: function(timeSpent, errors, hintsUsed, difficulty) {
            let baseScore = 1000;
            
            // 难度加成
            const difficultyMultiplier = {
                easy: 1,
                medium: 1.5,
                hard: 2
            }[difficulty] || 1;

            // 时间扣分
            const timeDeduction = Math.floor(timeSpent / 60) * 10;
            
            // 错误扣分
            const errorDeduction = errors * 50;
            
            // 提示扣分
            const hintDeduction = hintsUsed * 100;

            // 计算最终得分
            let finalScore = baseScore * difficultyMultiplier;
            finalScore -= timeDeduction + errorDeduction + hintDeduction;

            // 确保分数不为负
            return Math.max(0, Math.floor(finalScore));
        },

        // 设置自动更新
        setupAutoUpdate: function() {
            if (this.state.updateTimer) {
                clearInterval(this.state.updateTimer);
            }

            this.state.updateTimer = setInterval(() => {
                this.loadLeaderboard(this.state.currentDifficulty);
            }, LEADERBOARD_CONFIG.updateInterval);
        },

        // 更新访问计数
        updateVisitorCount: async function() {
            try {
                const query = new AV.Query('VisitorCount');
                query.equalTo('type', 'total');
                let counter = await query.first();

                if (!counter) {
                    counter = new AV.Object('VisitorCount');
                    counter.set('type', 'total');
                    counter.set('count', 0);
                }

                counter.increment('count');
                await counter.save();

                if (this.elements.visitorCount) {
                    this.elements.visitorCount.textContent = counter.get('count');
                }
            } catch (error) {
                console.error("更新访问计数失败:", error);
            }
        },

        // 工具方法
        formatTime: function(seconds) {
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
        },

        formatDate: function(timestamp) {
            const date = new Date(timestamp);
            return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
        },

        escapeHTML: function(str) {
            const div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
        },

        showLoading: function() {
            this.elements.leaderboardBody.innerHTML = `
                <tr>
                    <td colspan="5" class="loading-message">
                        <div class="loading"></div>
                        加载中...
                    </td>
                </tr>
            `;
        },

        showError: function(message) {
            this.elements.leaderboardBody.innerHTML = `
                <tr>
                    <td colspan="5" class="error-message">
                        ${this.escapeHTML(message)}
                    </td>
                </tr>
            `;
        }
    };

    // 导出模块
    window.SudokuGame.Leaderboard = Leaderboard;
    console.log("Leaderboard模块加载完成");
})();
