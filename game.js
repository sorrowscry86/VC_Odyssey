// VC Odyssey - 16-bit JRPG Game Demo
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        this.state = 'TITLE'; // TITLE, OVERWORLD, BATTLE, MENU
        this.keys = {};
        this.dialogueBox = document.getElementById('dialogue-box');
        this.dialogueText = document.getElementById('dialogue-text');
        this.battleMenu = document.getElementById('battle-menu');
        this.statsPanel = document.getElementById('party-stats');
        
        this.setupEventListeners();
        this.initGame();
        this.gameLoop();
    }
    
    initGame() {
        // Player party
        this.party = [
            {
                name: 'Hero',
                level: 5,
                hp: 80,
                maxHp: 80,
                mp: 30,
                maxMp: 30,
                attack: 25,
                defense: 15,
                speed: 20,
                x: 400,
                y: 300
            }
        ];
        
        // Enemy data
        this.enemies = [];
        
        // Overworld position
        this.player = {
            x: 400,
            y: 300,
            direction: 'down',
            speed: 3,
            animFrame: 0,
            animTimer: 0
        };
        
        this.camera = { x: 0, y: 0 };
        this.battleTurn = 0;
        this.selectedAction = 0;
        this.messageQueue = [];
        this.currentMessage = 0;
        this.encounterTimer = 0;
        this.titleBlink = 0;
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            
            if (e.key === 'Enter') {
                if (this.state === 'TITLE') {
                    this.state = 'OVERWORLD';
                    this.showMessage('Welcome to VC Odyssey! Use arrow keys to move. Press Space for menu.');
                } else if (this.state === 'BATTLE' && this.battleMenu.classList.contains('hidden')) {
                    this.executeBattleAction();
                }
            }
            
            if (e.key === ' ' && this.state === 'OVERWORLD') {
                e.preventDefault();
                this.showMessage('Hero: "This world is full of mysteries..."');
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
        
        // Battle menu clicks
        document.querySelectorAll('.menu-option').forEach((option, index) => {
            option.addEventListener('click', () => {
                this.selectedAction = index;
                document.querySelectorAll('.menu-option').forEach(o => o.classList.remove('selected'));
                option.classList.add('selected');
            });
        });
    }
    
    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
    
    update() {
        if (this.state === 'OVERWORLD') {
            this.updateOverworld();
        } else if (this.state === 'BATTLE') {
            this.updateBattle();
        }
    }
    
    updateOverworld() {
        const player = this.player;
        let moved = false;
        
        if (this.keys['ArrowUp']) {
            player.y -= player.speed;
            player.direction = 'up';
            moved = true;
        }
        if (this.keys['ArrowDown']) {
            player.y += player.speed;
            player.direction = 'down';
            moved = true;
        }
        if (this.keys['ArrowLeft']) {
            player.x -= player.speed;
            player.direction = 'left';
            moved = true;
        }
        if (this.keys['ArrowRight']) {
            player.x += player.speed;
            player.direction = 'right';
            moved = true;
        }
        
        // Keep player in bounds
        player.x = Math.max(32, Math.min(this.width - 32, player.x));
        player.y = Math.max(32, Math.min(this.height - 32, player.y));
        
        // Animation
        if (moved) {
            player.animTimer++;
            if (player.animTimer > 8) {
                player.animFrame = (player.animFrame + 1) % 4;
                player.animTimer = 0;
            }
            
            // Random encounters
            this.encounterTimer++;
            if (this.encounterTimer > 180 && Math.random() < 0.02) {
                this.startBattle();
                this.encounterTimer = 0;
            }
        }
    }
    
    updateBattle() {
        // Battle logic updates
    }
    
    render() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        if (this.state === 'TITLE') {
            this.renderTitle();
        } else if (this.state === 'OVERWORLD') {
            this.renderOverworld();
        } else if (this.state === 'BATTLE') {
            this.renderBattle();
        }
        
        this.renderStats();
    }
    
    renderTitle() {
        // Background gradient
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, '#001a33');
        gradient.addColorStop(1, '#000000');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Stars
        for (let i = 0; i < 100; i++) {
            const x = (i * 37) % this.width;
            const y = (i * 73) % this.height;
            const size = (i % 3) + 1;
            this.ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + (Math.sin(Date.now() / 1000 + i) + 1) * 0.35})`;
            this.ctx.fillRect(x, y, size, size);
        }
        
        // Title
        this.ctx.save();
        this.ctx.font = 'bold 64px Courier New';
        this.ctx.textAlign = 'center';
        
        // Shadow
        this.ctx.fillStyle = '#8b0000';
        this.ctx.fillText('VC ODYSSEY', this.width / 2 + 4, 200 + 4);
        
        // Main text
        this.titleBlink += 0.05;
        const brightness = Math.sin(this.titleBlink) * 0.3 + 0.7;
        this.ctx.fillStyle = `rgb(${255 * brightness}, ${215 * brightness}, 0)`;
        this.ctx.fillText('VC ODYSSEY', this.width / 2, 200);
        
        // Subtitle
        this.ctx.font = '24px Courier New';
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillText('A 16-bit JRPG Adventure', this.width / 2, 250);
        
        // Press Enter
        if (Math.floor(Date.now() / 500) % 2 === 0) {
            this.ctx.font = '20px Courier New';
            this.ctx.fillStyle = '#ffd700';
            this.ctx.fillText('Press ENTER to Start', this.width / 2, 400);
        }
        
        this.ctx.restore();
    }
    
    renderOverworld() {
        // Draw grass field background
        for (let y = 0; y < this.height; y += 32) {
            for (let x = 0; x < this.width; x += 32) {
                const color1 = ((x / 32 + y / 32) % 2 === 0) ? '#2d5016' : '#2a4c14';
                this.ctx.fillStyle = color1;
                this.ctx.fillRect(x, y, 32, 32);
                
                // Add grass details
                if (Math.random() > 0.7) {
                    this.ctx.fillStyle = '#3a6b1f';
                    this.ctx.fillRect(x + 8, y + 8, 2, 4);
                    this.ctx.fillRect(x + 16, y + 12, 2, 4);
                    this.ctx.fillRect(x + 24, y + 8, 2, 4);
                }
            }
        }
        
        // Draw paths
        this.ctx.fillStyle = '#a0826d';
        this.ctx.fillRect(this.width / 2 - 40, 0, 80, this.height);
        this.ctx.fillRect(0, this.height / 2 - 40, this.width, 80);
        
        // Draw player character
        this.drawPlayer();
        
        // Add some trees
        this.drawTree(150, 150);
        this.drawTree(650, 150);
        this.drawTree(150, 450);
        this.drawTree(650, 450);
    }
    
    drawPlayer() {
        const p = this.player;
        const size = 32;
        
        // Shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.beginPath();
        this.ctx.ellipse(p.x, p.y + 20, 12, 6, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Body (blue tunic)
        this.ctx.fillStyle = '#4169e1';
        this.ctx.fillRect(p.x - 12, p.y - 8, 24, 20);
        
        // Head (skin tone)
        this.ctx.fillStyle = '#ffdbac';
        this.ctx.fillRect(p.x - 10, p.y - 20, 20, 16);
        
        // Hair (brown)
        this.ctx.fillStyle = '#8b4513';
        this.ctx.fillRect(p.x - 10, p.y - 24, 20, 8);
        
        // Eyes
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(p.x - 6, p.y - 14, 3, 3);
        this.ctx.fillRect(p.x + 3, p.y - 14, 3, 3);
        
        // Arms
        this.ctx.fillStyle = '#ffdbac';
        const armOffset = Math.sin(p.animFrame) * 2;
        this.ctx.fillRect(p.x - 16, p.y - 4 + armOffset, 4, 12);
        this.ctx.fillRect(p.x + 12, p.y - 4 - armOffset, 4, 12);
        
        // Legs
        this.ctx.fillStyle = '#8b4513';
        this.ctx.fillRect(p.x - 8, p.y + 12, 6, 8);
        this.ctx.fillRect(p.x + 2, p.y + 12, 6, 8);
    }
    
    drawTree(x, y) {
        // Trunk
        this.ctx.fillStyle = '#654321';
        this.ctx.fillRect(x - 8, y, 16, 32);
        
        // Leaves
        this.ctx.fillStyle = '#228b22';
        this.ctx.beginPath();
        this.ctx.arc(x, y - 10, 24, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#2e8b2e';
        this.ctx.beginPath();
        this.ctx.arc(x - 10, y - 5, 18, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.beginPath();
        this.ctx.arc(x + 10, y - 5, 18, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    renderBattle() {
        // Battle background
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, '#4a148c');
        gradient.addColorStop(1, '#1a0033');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Ground
        this.ctx.fillStyle = '#3d2817';
        this.ctx.fillRect(0, this.height - 150, this.width, 150);
        
        // Draw grid lines
        this.ctx.strokeStyle = 'rgba(100, 50, 25, 0.5)';
        this.ctx.lineWidth = 2;
        for (let i = 0; i < 10; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, this.height - 150 + i * 15);
            this.ctx.lineTo(this.width, this.height - 150 + i * 15);
            this.ctx.stroke();
        }
        
        // Draw party members (left side)
        this.party.forEach((member, index) => {
            this.drawBattleCharacter(150, 300 + index * 100, member, true);
        });
        
        // Draw enemies (right side)
        this.enemies.forEach((enemy, index) => {
            this.drawBattleCharacter(600, 250 + index * 120, enemy, false);
        });
        
        // Battle text
        this.ctx.font = '24px Courier New';
        this.ctx.fillStyle = '#fff';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('⚔️ BATTLE START ⚔️', this.width / 2, 50);
    }
    
    drawBattleCharacter(x, y, character, isHero) {
        const size = isHero ? 48 : 64;
        
        if (isHero) {
            // Hero character (larger version)
            this.ctx.fillStyle = '#4169e1';
            this.ctx.fillRect(x - 18, y - 12, 36, 30);
            
            this.ctx.fillStyle = '#ffdbac';
            this.ctx.fillRect(x - 15, y - 30, 30, 24);
            
            this.ctx.fillStyle = '#8b4513';
            this.ctx.fillRect(x - 15, y - 36, 30, 12);
            
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(x - 9, y - 21, 4, 4);
            this.ctx.fillRect(x + 5, y - 21, 4, 4);
            
            // Sword
            this.ctx.fillStyle = '#c0c0c0';
            this.ctx.fillRect(x + 20, y - 10, 4, 30);
            this.ctx.fillStyle = '#8b4513';
            this.ctx.fillRect(x + 18, y + 18, 8, 8);
        } else {
            // Enemy (monster)
            this.ctx.fillStyle = '#8b008b';
            this.ctx.fillRect(x - 24, y - 16, 48, 40);
            
            // Horns
            this.ctx.fillStyle = '#ff4500';
            this.ctx.beginPath();
            this.ctx.moveTo(x - 24, y - 16);
            this.ctx.lineTo(x - 32, y - 32);
            this.ctx.lineTo(x - 20, y - 20);
            this.ctx.fill();
            
            this.ctx.beginPath();
            this.ctx.moveTo(x + 24, y - 16);
            this.ctx.lineTo(x + 32, y - 32);
            this.ctx.lineTo(x + 20, y - 20);
            this.ctx.fill();
            
            // Eyes (glowing red)
            this.ctx.fillStyle = '#ff0000';
            this.ctx.fillRect(x - 16, y - 8, 8, 8);
            this.ctx.fillRect(x + 8, y - 8, 8, 8);
            
            // Teeth
            this.ctx.fillStyle = '#fff';
            for (let i = 0; i < 5; i++) {
                this.ctx.fillRect(x - 20 + i * 10, y + 8, 4, 8);
            }
        }
        
        // HP bar above character
        const barWidth = 80;
        const barHeight = 8;
        const hpPercent = character.hp / character.maxHp;
        
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(x - barWidth / 2 - 2, y - 60, barWidth + 4, barHeight + 4);
        
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(x - barWidth / 2, y - 58, barWidth, barHeight);
        
        const hpColor = hpPercent > 0.5 ? '#0f0' : hpPercent > 0.25 ? '#ff0' : '#f00';
        this.ctx.fillStyle = hpColor;
        this.ctx.fillRect(x - barWidth / 2, y - 58, barWidth * hpPercent, barHeight);
        
        // Name
        this.ctx.font = '14px Courier New';
        this.ctx.fillStyle = '#fff';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(character.name, x, y - 70);
    }
    
    renderStats() {
        let statsHTML = '';
        this.party.forEach(member => {
            const hpPercent = (member.hp / member.maxHp) * 100;
            const mpPercent = (member.mp / member.maxMp) * 100;
            
            statsHTML += `
                <div style="margin-bottom: 15px; padding: 10px; background: rgba(255,255,255,0.1); border-radius: 4px;">
                    <div style="font-weight: bold; color: #ffd700; margin-bottom: 5px;">
                        ${member.name} - Lv.${member.level}
                    </div>
                    <div>
                        HP: ${member.hp}/${member.maxHp}
                        <div class="hp-bar">
                            <div class="hp-fill" style="width: ${hpPercent}%"></div>
                        </div>
                    </div>
                    <div>
                        MP: ${member.mp}/${member.maxMp}
                        <div class="mp-bar">
                            <div class="mp-fill" style="width: ${mpPercent}%"></div>
                        </div>
                    </div>
                    <div style="font-size: 12px; margin-top: 5px; color: #ccc;">
                        ATK: ${member.attack} | DEF: ${member.defense} | SPD: ${member.speed}
                    </div>
                </div>
            `;
        });
        
        this.statsPanel.innerHTML = statsHTML;
    }
    
    showMessage(text) {
        this.dialogueText.textContent = text;
        this.dialogueBox.classList.remove('hidden');
        
        setTimeout(() => {
            this.dialogueBox.classList.add('hidden');
        }, 3000);
    }
    
    startBattle() {
        this.state = 'BATTLE';
        this.enemies = [
            {
                name: 'Shadow Beast',
                level: 4,
                hp: 60,
                maxHp: 60,
                mp: 0,
                maxMp: 0,
                attack: 18,
                defense: 10,
                speed: 15
            }
        ];
        
        this.battleMenu.classList.remove('hidden');
        this.showMessage('A Shadow Beast appears!');
        
        setTimeout(() => {
            this.showMessage('What will you do?');
        }, 2000);
    }
    
    executeBattleAction() {
        const actions = ['attack', 'magic', 'item', 'defend'];
        const action = actions[this.selectedAction];
        
        if (action === 'attack') {
            const damage = Math.floor(Math.random() * 15) + 10;
            this.enemies[0].hp -= damage;
            this.showMessage(`Hero attacks for ${damage} damage!`);
            
            if (this.enemies[0].hp <= 0) {
                setTimeout(() => {
                    this.showMessage('Victory! Shadow Beast defeated!');
                    setTimeout(() => {
                        this.state = 'OVERWORLD';
                        this.battleMenu.classList.add('hidden');
                        this.enemies = [];
                    }, 2000);
                }, 1500);
            } else {
                setTimeout(() => {
                    const enemyDamage = Math.floor(Math.random() * 10) + 5;
                    this.party[0].hp -= enemyDamage;
                    this.showMessage(`Shadow Beast attacks for ${enemyDamage} damage!`);
                    
                    if (this.party[0].hp <= 0) {
                        setTimeout(() => {
                            this.showMessage('Game Over... Press F5 to restart.');
                            this.state = 'TITLE';
                            this.battleMenu.classList.add('hidden');
                            this.initGame();
                        }, 2000);
                    }
                }, 1500);
            }
        } else if (action === 'magic') {
            if (this.party[0].mp >= 10) {
                const damage = Math.floor(Math.random() * 25) + 15;
                this.enemies[0].hp -= damage;
                this.party[0].mp -= 10;
                this.showMessage(`Hero casts Fireball for ${damage} damage!`);
                
                if (this.enemies[0].hp <= 0) {
                    setTimeout(() => {
                        this.showMessage('Victory! Shadow Beast defeated!');
                        setTimeout(() => {
                            this.state = 'OVERWORLD';
                            this.battleMenu.classList.add('hidden');
                            this.enemies = [];
                        }, 2000);
                    }, 1500);
                }
            } else {
                this.showMessage('Not enough MP!');
            }
        } else if (action === 'defend') {
            this.showMessage('Hero defends!');
        } else {
            this.showMessage('No items available!');
        }
    }
}

// Start the game
window.addEventListener('load', () => {
    new Game();
});
