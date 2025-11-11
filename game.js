// Generic JRPG - Proof of Concept
// Game Design Document v1.1 Implementation

// ===== CONSTANTS AND DATA =====
const STATUS_EFFECTS = {
    POISON: { name: 'POISON', color: '#9b59b6', persistent: true },
    SLEEP: { name: 'SLEEP', color: '#3498db', persistent: false },
    PARALYSIS: { name: 'PARALYSIS', color: '#f39c12', persistent: false },
    PROTECT: { name: 'PROTECT', color: '#2ecc71', persistent: false },
    HASTE: { name: 'HASTE', color: '#e74c3c', persistent: false },
    REGEN: { name: 'REGEN', color: '#1abc9c', persistent: false }
};

const ABILITIES = {
    // Blayde's Abilities
    FIRE_SLASH: {
        name: 'Fire Slash',
        cost: 8,
        type: 'ability',
        target: 'enemy',
        effect: (user, target) => {
            const baseDamage = user.stats.STR * 1.5;
            const damage = Math.floor(baseDamage + Math.random() * 10);
            target.takeDamage(damage);
            return `${user.name} uses Fire Slash for ${damage} damage!`;
        }
    },
    HEADSTRONG: {
        name: 'Headstrong',
        type: 'passive',
        effect: () => Math.random() < 0.1 // 10% chance to ignore override
    },
    
    // Serapha's Abilities
    HEAL: {
        name: 'Heal',
        cost: 4,
        type: 'magic',
        target: 'ally',
        effect: (user, target) => {
            const healAmount = Math.floor(user.stats.MND * 1.5 + 20);
            target.heal(healAmount);
            return `${user.name} casts Heal! ${target.name} recovers ${healAmount} HP!`;
        }
    },
    CURE_POISON: {
        name: 'CurePoison',
        cost: 3,
        type: 'magic',
        target: 'ally',
        effect: (user, target) => {
            target.removeStatus('POISON');
            return `${user.name} casts CurePoison! ${target.name}'s poison is cured!`;
        }
    },
    PROTECT: {
        name: 'Protect',
        cost: 6,
        type: 'magic',
        target: 'ally',
        effect: (user, target) => {
            target.addStatus('PROTECT', 3);
            return `${user.name} casts Protect! ${target.name}'s defense increases!`;
        }
    },
    PRAYER: {
        name: 'Prayer',
        type: 'passive',
        effect: () => Math.random() < 0.15 // 15% chance when defending
    },
    
    // Leo's Abilities
    OVERRIDE: {
        name: 'Override',
        cost: 0,
        type: 'special',
        target: 'ally',
        effect: (user, target) => {
            return `${user.name} prepares to override ${target.name}'s action!`;
        }
    },
    USE_POTION: {
        name: 'Use Potion',
        cost: 0,
        type: 'item',
        target: 'ally',
        effect: (user, target, game) => {
            if (game.inventory.useItem('POTION')) {
                const healAmount = 50;
                target.heal(healAmount);
                return `${user.name} uses a Potion! ${target.name} recovers ${healAmount} HP!`;
            }
            return `No Potions available!`;
        }
    },
    
    // Eliza's Abilities
    SCAN: {
        name: 'Scan',
        cost: 5,
        type: 'magic',
        target: 'enemy',
        effect: (user, target) => {
            target.scanned = true;
            return `${user.name} scans ${target.name}!\nHP: ${target.stats.hp}/${target.stats.maxHp}\nWeakness: Fire`;
        }
    }
};

// ===== CHARACTER CLASS =====
class Character {
    constructor(data) {
        this.name = data.name;
        this.level = data.level || 1;
        this.controlType = data.controlType; // 'AI' or 'PLAYER'
        this.archetype = data.archetype;
        this.exp = data.exp || 0;
        this.expToNext = this.calculateExpToNext();
        
        this.stats = {
            hp: data.hp,
            maxHp: data.maxHp,
            mp: data.mp,
            maxMp: data.maxMp,
            STR: data.STR,
            DEF: data.DEF,
            INT: data.INT,
            MND: data.MND,
            SPD: data.SPD
        };
        
        this.baseStats = { ...this.stats };
        this.statusEffects = {};
        this.abilities = data.abilities || [];
        this.equipment = {
            weapon: data.equipment?.weapon || null,
            armor: data.equipment?.armor || null,
            accessory: data.equipment?.accessory || null
        };
        
        this.aiLogic = data.aiLogic || null;
        this.scanned = false;
        this.isDefending = false;
        this.overrideAction = null; // For Override command
    }
    
    calculateExpToNext() {
        return this.level * 100; // Simple formula
    }
    
    gainExp(amount) {
        this.exp += amount;
        const messages = [];
        
        while (this.exp >= this.expToNext) {
            this.exp -= this.expToNext;
            this.levelUp();
            messages.push(`${this.name} reached Level ${this.level}!`);
        }
        
        return messages;
    }
    
    levelUp() {
        this.level++;
        
        // Stat increases based on archetype
        const growthRates = {
            'HERO': { maxHp: 10, maxMp: 2, STR: 5, DEF: 3, INT: 1, MND: 1, SPD: 2 },
            'HEALER': { maxHp: 5, maxMp: 8, STR: 1, DEF: 2, INT: 2, MND: 5, SPD: 3 },
            'REALIST': { maxHp: 8, maxMp: 3, STR: 3, DEF: 5, INT: 2, MND: 2, SPD: 2 },
            'STRATEGIST': { maxHp: 6, maxMp: 5, STR: 2, DEF: 3, INT: 5, MND: 4, SPD: 3 }
        };
        
        const growth = growthRates[this.archetype];
        this.stats.maxHp += growth.maxHp;
        this.stats.maxMp += growth.maxMp;
        this.stats.STR += growth.STR;
        this.stats.DEF += growth.DEF;
        this.stats.INT += growth.INT;
        this.stats.MND += growth.MND;
        this.stats.SPD += growth.SPD;
        
        // Full heal on level up
        this.stats.hp = this.stats.maxHp;
        this.stats.mp = this.stats.maxMp;
        
        this.expToNext = this.calculateExpToNext();
    }
    
    takeDamage(amount) {
        // Apply DEF modifier
        let actualDamage = amount;
        if (this.statusEffects.PROTECT) {
            actualDamage = Math.floor(amount / 1.5);
        }
        actualDamage = Math.max(1, Math.floor(actualDamage * (100 / (100 + this.stats.DEF))));
        
        this.stats.hp = Math.max(0, this.stats.hp - actualDamage);
        return actualDamage;
    }
    
    heal(amount) {
        const actualHeal = Math.min(amount, this.stats.maxHp - this.stats.hp);
        this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + amount);
        return actualHeal;
    }
    
    addStatus(statusName, duration = 3) {
        this.statusEffects[statusName] = {
            duration: duration,
            turnsRemaining: duration
        };
    }
    
    removeStatus(statusName) {
        delete this.statusEffects[statusName];
    }
    
    hasStatus(statusName) {
        return !!this.statusEffects[statusName];
    }
    
    updateStatusEffects() {
        const messages = [];
        
        // Process status effects
        if (this.hasStatus('POISON')) {
            const damage = Math.floor(this.stats.maxHp * 0.05);
            this.stats.hp = Math.max(0, this.stats.hp - damage);
            messages.push(`${this.name} takes ${damage} damage from POISON!`);
        }
        
        if (this.hasStatus('REGEN')) {
            const heal = Math.floor(this.stats.maxHp * 0.05);
            this.heal(heal);
            messages.push(`${this.name} recovers ${heal} HP from REGEN!`);
        }
        
        // Decrease durations (except persistent effects)
        for (const [status, data] of Object.entries(this.statusEffects)) {
            if (!STATUS_EFFECTS[status]?.persistent) {
                data.turnsRemaining--;
                if (data.turnsRemaining <= 0) {
                    delete this.statusEffects[status];
                    messages.push(`${this.name}'s ${status} wore off!`);
                }
            }
        }
        
        return messages;
    }
    
    canAct() {
        if (this.stats.hp <= 0) return false;
        if (this.hasStatus('SLEEP')) return false;
        if (this.hasStatus('PARALYSIS')) {
            return Math.random() > 0.5; // 50% chance to act
        }
        return true;
    }
    
    getAvailableAbilities() {
        return this.abilities.filter(abilityName => {
            const ability = ABILITIES[abilityName];
            if (!ability) return false;
            if (ability.cost > this.stats.mp) return false;
            return true;
        });
    }
}

// ===== AI LOGIC =====
class BlaydeBonusAI {
    static decideAction(character, allies, enemies, game) {
        // Blayde's "Artificial Stupidity"
        // 1. Check if he has enough MP for Fire Slash (his "impressive" ability)
        if (character.stats.mp >= 8 && character.abilities.includes('FIRE_SLASH')) {
            return {
                action: 'ability',
                ability: 'FIRE_SLASH',
                target: enemies[Math.floor(Math.random() * enemies.length)]
            };
        }
        
        // 2. Default: Random attack
        return {
            action: 'attack',
            target: enemies[Math.floor(Math.random() * enemies.length)]
        };
    }
}

class SeraphaAI {
    static decideAction(character, allies, enemies, game) {
        // Serapha's inefficient healing AI
        
        // Check if defending and prayer passive triggers
        if (character.isDefending && ABILITIES.PRAYER.effect()) {
            return { action: 'pray' }; // Waste turn "praying"
        }
        
        // Try to heal - but inefficiently
        // Start from top of party list
        for (const ally of allies) {
            if (ally.stats.hp < ally.stats.maxHp) {
                // Will heal even if just 1 HP missing
                if (character.stats.mp >= 4) {
                    return {
                        action: 'ability',
                        ability: 'HEAL',
                        target: ally
                    };
                }
            }
        }
        
        // Try to cast Protect on Blayde (repeatedly, even if it doesn't stack)
        const blayde = allies.find(a => a.name === 'Blayde');
        if (blayde && character.stats.mp >= 6) {
            return {
                action: 'ability',
                ability: 'PROTECT',
                target: blayde
            };
        }
        
        // Default: Defend
        return { action: 'defend' };
    }
}

// ===== INVENTORY SYSTEM =====
class Inventory {
    constructor() {
        this.maxSlots = 20;
        this.items = {
            POTION: { name: 'Potion', type: 'consumable', count: 5, maxStack: 9, description: 'Restores 50 HP' },
            ETHER: { name: 'Ether', type: 'consumable', count: 2, maxStack: 9, description: 'Restores 20 MP' },
            ANTIDOTE: { name: 'Antidote', type: 'consumable', count: 3, maxStack: 9, description: 'Cures POISON' },
            PHOENIX_DOWN: { name: 'Phoenix Down', type: 'consumable', count: 1, maxStack: 9, description: 'Revives with 1 HP' }
        };
        
        this.equipment = [];
        this.keyItems = [];
    }
    
    getItemCount(itemId) {
        return this.items[itemId]?.count || 0;
    }
    
    useItem(itemId) {
        if (this.items[itemId] && this.items[itemId].count > 0) {
            this.items[itemId].count--;
            if (this.items[itemId].count === 0) {
                delete this.items[itemId];
            }
            return true;
        }
        return false;
    }
    
    addItem(itemId, count = 1) {
        if (this.items[itemId]) {
            this.items[itemId].count = Math.min(
                this.items[itemId].count + count,
                this.items[itemId].maxStack
            );
        }
    }
}

// ===== BATTLE SYSTEM =====
class BattleSystem {
    constructor(game, party, enemies) {
        this.game = game;
        this.party = party;
        this.enemies = enemies;
        this.turnOrder = [];
        this.currentTurnIndex = 0;
        this.battleLog = [];
        this.state = 'TURN_START'; // TURN_START, SELECTING_ACTION, EXECUTING, BATTLE_END
        this.currentCharacter = null;
        this.selectedAction = null;
        this.playerActionQueue = null;
        this.waitingForPlayer = false;
    }
    
    start() {
        this.addLog('Battle Start!');
        this.calculateTurnOrder();
        this.nextTurn();
    }
    
    calculateTurnOrder() {
        this.turnOrder = [...this.party, ...this.enemies]
            .filter(char => char.stats.hp > 0)
            .sort((a, b) => {
                let aSpeed = a.stats.SPD;
                let bSpeed = b.stats.SPD;
                
                if (a.hasStatus('HASTE')) aSpeed *= 1.5;
                if (b.hasStatus('HASTE')) bSpeed *= 1.5;
                
                return bSpeed - aSpeed;
            });
    }
    
    nextTurn() {
        // Check win/lose conditions
        if (this.enemies.every(e => e.stats.hp <= 0)) {
            this.endBattle('victory');
            return;
        }
        if (this.party.every(p => p.stats.hp <= 0)) {
            this.endBattle('defeat');
            return;
        }
        
        // Move to next character
        do {
            this.currentTurnIndex = (this.currentTurnIndex + 1) % this.turnOrder.length;
            this.currentCharacter = this.turnOrder[this.currentTurnIndex];
            
            // Skip dead characters
            if (this.currentCharacter.stats.hp <= 0) {
                continue;
            }
            
            // Process status effects at start of turn
            const statusMessages = this.currentCharacter.updateStatusEffects();
            statusMessages.forEach(msg => this.addLog(msg));
            
            // Check if character can act
            if (!this.currentCharacter.canAct()) {
                if (this.currentCharacter.hasStatus('SLEEP')) {
                    this.addLog(`${this.currentCharacter.name} is asleep!`);
                } else if (this.currentCharacter.hasStatus('PARALYSIS')) {
                    this.addLog(`${this.currentCharacter.name} is paralyzed!`);
                }
                continue;
            }
            
            break;
        } while (true);
        
        // Reset defending state
        this.currentCharacter.isDefending = false;
        
        // Determine action based on control type
        if (this.currentCharacter.controlType === 'PLAYER') {
            this.waitForPlayerInput();
        } else {
            this.executeAITurn();
        }
    }
    
    waitForPlayerInput() {
        this.waitingForPlayer = true;
        this.state = 'SELECTING_ACTION';
        this.game.showBattleMenu(this.currentCharacter);
    }
    
    executeAITurn() {
        this.waitingForPlayer = false;
        const allies = this.party;
        const enemies = this.enemies;
        
        let action;
        
        // Check if there's an override action
        if (this.currentCharacter.overrideAction) {
            action = this.currentCharacter.overrideAction;
            this.currentCharacter.overrideAction = null;
            this.addLog(`[OVERRIDE] ${this.currentCharacter.name}'s action is controlled!`);
            
            // Check Headstrong passive (Blayde only)
            if (this.currentCharacter.name === 'Blayde' && 
                this.currentCharacter.abilities.includes('HEADSTRONG') && 
                ABILITIES.HEADSTRONG.effect()) {
                this.addLog(`${this.currentCharacter.name} ignores the override! (Headstrong)`);
                action = null;
            }
        }
        
        // If no override or override was ignored, use AI
        if (!action) {
            if (this.currentCharacter.name === 'Blayde') {
                action = BlaydAI.decideAction(this.currentCharacter, allies, enemies, this.game);
            } else if (this.currentCharacter.name === 'Serapha') {
                action = SeraphaAI.decideAction(this.currentCharacter, allies, enemies, this.game);
            } else {
                // Enemy AI - simple attack
                action = {
                    action: 'attack',
                    target: allies[Math.floor(Math.random() * allies.filter(a => a.stats.hp > 0).length)]
                };
            }
        }
        
        this.executeAction(action);
        
        setTimeout(() => {
            this.nextTurn();
        }, 1500);
    }
    
    executePlayerAction(action) {
        this.waitingForPlayer = false;
        this.executeAction(action);
        
        setTimeout(() => {
            this.nextTurn();
        }, 1500);
    }
    
    executeAction(action) {
        const actor = this.currentCharacter;
        
        if (action.action === 'attack') {
            const damage = Math.floor(actor.stats.STR * 0.8 + Math.random() * 10);
            const actualDamage = action.target.takeDamage(damage);
            this.addLog(`${actor.name} attacks ${action.target.name} for ${actualDamage} damage!`);
            
            // Wake up sleeping targets
            if (action.target.hasStatus('SLEEP')) {
                action.target.removeStatus('SLEEP');
                this.addLog(`${action.target.name} wakes up!`);
            }
        } else if (action.action === 'defend') {
            actor.isDefending = true;
            this.addLog(`${actor.name} defends!`);
        } else if (action.action === 'ability') {
            const ability = ABILITIES[action.ability];
            if (ability && actor.stats.mp >= ability.cost) {
                actor.stats.mp -= ability.cost;
                const message = ability.effect(actor, action.target, this.game);
                this.addLog(message);
            }
        } else if (action.action === 'pray') {
            this.addLog(`${actor.name} prays... (nothing happens)`);
        } else if (action.action === 'override') {
            // Set override for target
            action.target.overrideAction = action.overrideAction;
            this.addLog(`${actor.name} will control ${action.target.name}'s next action!`);
        }
    }
    
    addLog(message) {
        this.battleLog.push(message);
        if (this.battleLog.length > 10) {
            this.battleLog.shift();
        }
    }
    
    endBattle(result) {
        this.state = 'BATTLE_END';
        
        if (result === 'victory') {
            this.addLog('Victory!');
            
            // Award EXP
            const totalExp = this.enemies.reduce((sum, enemy) => sum + (enemy.expReward || 50), 0);
            this.party.forEach(member => {
                if (member.stats.hp > 0) {
                    const levelUpMessages = member.gainExp(totalExp);
                    levelUpMessages.forEach(msg => this.addLog(msg));
                }
            });
            
            // Clear non-persistent status effects
            this.party.forEach(member => {
                for (const status in member.statusEffects) {
                    if (!STATUS_EFFECTS[status]?.persistent) {
                        delete member.statusEffects[status];
                    }
                }
            });
            
            setTimeout(() => {
                this.game.endBattle('victory');
            }, 3000);
        } else {
            this.addLog('Defeat...');
            setTimeout(() => {
                this.game.endBattle('defeat');
            }, 3000);
        }
    }
}

// ===== MAIN GAME CLASS =====
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        this.state = 'TITLE'; // TITLE, OVERWORLD, BATTLE, MENU
        this.keys = {};
        
        this.initGame();
        this.setupEventListeners();
        this.gameLoop();
    }
    
    initGame() {
        // Initialize party based on GDD v1.1
        this.party = [
            new Character({
                name: 'Blayde',
                level: 5,
                controlType: 'AI',
                archetype: 'HERO',
                hp: 80, maxHp: 80,
                mp: 20, maxMp: 20,
                STR: 25, DEF: 15, INT: 5, MND: 5, SPD: 15,
                abilities: ['FIRE_SLASH', 'HEADSTRONG'],
                aiLogic: BlaydAI
            }),
            new Character({
                name: 'Serapha',
                level: 5,
                controlType: 'AI',
                archetype: 'HEALER',
                hp: 50, maxHp: 50,
                mp: 40, maxMp: 40,
                STR: 8, DEF: 10, INT: 12, MND: 25, SPD: 18,
                abilities: ['HEAL', 'CURE_POISON', 'PROTECT', 'PRAYER'],
                aiLogic: SeraphaAI
            }),
            new Character({
                name: 'Leo',
                level: 5,
                controlType: 'PLAYER',
                archetype: 'REALIST',
                hp: 70, maxHp: 70,
                mp: 25, maxMp: 25,
                STR: 18, DEF: 22, INT: 12, MND: 12, SPD: 14,
                abilities: ['OVERRIDE', 'USE_POTION']
            }),
            new Character({
                name: 'Eliza',
                level: 5,
                controlType: 'PLAYER',
                archetype: 'STRATEGIST',
                hp: 60, maxHp: 60,
                mp: 30, maxMp: 30,
                STR: 14, DEF: 16, INT: 22, MND: 20, SPD: 16,
                abilities: ['OVERRIDE', 'SCAN']
            })
        ];
        
        this.inventory = new Inventory();
        this.battle = null;
        
        // Overworld
        this.player = {
            x: 400,
            y: 300,
            direction: 'down',
            speed: 2.5
        };
        
        this.encounterTimer = 0;
        this.titleBlink = 0;
        this.menuState = null;
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            
            if (e.key === 'Enter') {
                if (this.state === 'TITLE') {
                    this.state = 'OVERWORLD';
                    this.showMessage('Welcome to Generic JRPG! Arrow keys to move, M for menu.');
                }
            }
            
            if (e.key === 'm' || e.key === 'M') {
                if (this.state === 'OVERWORLD') {
                    this.openMenu();
                }
            }
            
            if (e.key === 'Escape') {
                if (this.state === 'MENU') {
                    this.closeMenu();
                }
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
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
        
        // Random encounters
        if (moved) {
            this.encounterTimer++;
            if (this.encounterTimer > 120 && Math.random() < 0.015) {
                this.startBattle();
                this.encounterTimer = 0;
            }
        }
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
        this.ctx.font = 'bold 56px Courier New';
        this.ctx.textAlign = 'center';
        
        // Shadow
        this.ctx.fillStyle = '#8b0000';
        this.ctx.fillText('GENERIC JRPG', this.width / 2 + 4, 180 + 4);
        
        // Main text
        this.titleBlink += 0.05;
        const brightness = Math.sin(this.titleBlink) * 0.3 + 0.7;
        this.ctx.fillStyle = `rgb(${255 * brightness}, ${215 * brightness}, 0)`;
        this.ctx.fillText('GENERIC JRPG', this.width / 2, 180);
        
        // Subtitle
        this.ctx.font = '20px Courier New';
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillText('Proof of Concept - GDD v1.1', this.width / 2, 220);
        
        // Instructions
        this.ctx.font = '16px Courier New';
        this.ctx.fillStyle = '#aaaaaa';
        this.ctx.fillText('A game about dealing with terrible AI allies', this.width / 2, 300);
        
        // Press Enter
        if (Math.floor(Date.now() / 500) % 2 === 0) {
            this.ctx.font = '24px Courier New';
            this.ctx.fillStyle = '#ffd700';
            this.ctx.fillText('Press ENTER to Start', this.width / 2, 450);
        }
        
        this.ctx.restore();
    }
    
    renderOverworld() {
        // Draw grass field
        for (let y = 0; y < this.height; y += 32) {
            for (let x = 0; x < this.width; x += 32) {
                const color = ((x / 32 + y / 32) % 2 === 0) ? '#2d5016' : '#2a4c14';
                this.ctx.fillStyle = color;
                this.ctx.fillRect(x, y, 32, 32);
            }
        }
        
        // Draw paths
        this.ctx.fillStyle = '#a0826d';
        this.ctx.fillRect(this.width / 2 - 40, 0, 80, this.height);
        this.ctx.fillRect(0, this.height / 2 - 40, this.width, 80);
        
        // Draw player
        this.drawPlayer();
        
        // Draw HUD
        this.drawOverworldHUD();
    }
    
    drawPlayer() {
        const p = this.player;
        
        // Shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.beginPath();
        this.ctx.ellipse(p.x, p.y + 16, 10, 5, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Body
        this.ctx.fillStyle = '#4169e1';
        this.ctx.fillRect(p.x - 10, p.y - 6, 20, 16);
        
        // Head
        this.ctx.fillStyle = '#ffdbac';
        this.ctx.fillRect(p.x - 8, p.y - 16, 16, 12);
        
        // Hair
        this.ctx.fillStyle = '#8b4513';
        this.ctx.fillRect(p.x - 8, p.y - 20, 16, 6);
        
        // Eyes
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(p.x - 5, p.y - 12, 2, 2);
        this.ctx.fillRect(p.x + 3, p.y - 12, 2, 2);
    }
    
    drawOverworldHUD() {
        // Party status mini-display
        this.ctx.fillStyle = 'rgba(0, 0, 30, 0.9)';
        this.ctx.fillRect(10, 10, 200, this.party.length * 30 + 10);
        
        this.ctx.font = '12px Courier New';
        this.party.forEach((member, index) => {
            const y = 25 + index * 30;
            const hpPercent = member.stats.hp / member.stats.maxHp;
            
            this.ctx.fillStyle = '#fff';
            this.ctx.fillText(`${member.name} Lv${member.level}`, 15, y);
            
            // HP bar
            this.ctx.fillStyle = '#333';
            this.ctx.fillRect(100, y - 8, 100, 8);
            this.ctx.fillStyle = hpPercent > 0.5 ? '#0f0' : hpPercent > 0.25 ? '#ff0' : '#f00';
            this.ctx.fillRect(100, y - 8, 100 * hpPercent, 8);
            
            // HP text
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '10px Courier New';
            this.ctx.fillText(`${member.stats.hp}/${member.stats.maxHp}`, 105, y - 1);
        });
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
        this.ctx.fillRect(0, this.height - 200, this.width, 200);
        
        // Draw characters
        this.party.forEach((member, index) => {
            if (member.stats.hp > 0) {
                this.drawBattleCharacter(120, 250 + index * 80, member, true);
            }
        });
        
        if (this.battle && this.battle.enemies) {
            this.battle.enemies.forEach((enemy, index) => {
                if (enemy.stats.hp > 0) {
                    this.drawBattleCharacter(600, 200 + index * 100, enemy, false);
                }
            });
        }
        
        // Update UI
        this.updateBattleUI();
    }
    
    drawBattleCharacter(x, y, character, isHero) {
        // Draw character sprite (simplified)
        if (isHero) {
            // Hero sprite
            this.ctx.fillStyle = '#4169e1';
            this.ctx.fillRect(x - 16, y - 10, 32, 28);
            
            this.ctx.fillStyle = '#ffdbac';
            this.ctx.fillRect(x - 12, y - 26, 24, 20);
            
            this.ctx.fillStyle = '#8b4513';
            this.ctx.fillRect(x - 12, y - 30, 24, 8);
        } else {
            // Enemy sprite
            this.ctx.fillStyle = '#8b008b';
            this.ctx.fillRect(x - 20, y - 14, 40, 36);
            
            this.ctx.fillStyle = '#ff0000';
            this.ctx.fillRect(x - 12, y - 6, 6, 6);
            this.ctx.fillRect(x + 6, y - 6, 6, 6);
        }
        
        // HP bar
        const barWidth = 60;
        const hpPercent = character.stats.hp / character.stats.maxHp;
        
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(x - barWidth / 2 - 1, y - 45, barWidth + 2, 8);
        
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(x - barWidth / 2, y - 44, barWidth, 6);
        
        const hpColor = hpPercent > 0.5 ? '#0f0' : hpPercent > 0.25 ? '#ff0' : '#f00';
        this.ctx.fillStyle = hpColor;
        this.ctx.fillRect(x - barWidth / 2, y - 44, barWidth * hpPercent, 6);
        
        // Name
        this.ctx.font = '12px Courier New';
        this.ctx.fillStyle = '#fff';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(character.name, x, y - 52);
    }
    
    updateBattleUI() {
        if (!this.battle) return;
        
        // Update party status
        const partyStatus = document.getElementById('party-status');
        partyStatus.innerHTML = this.party.map(member => {
            const hpPercent = (member.stats.hp / member.stats.maxHp) * 100;
            const mpPercent = (member.stats.mp / member.stats.maxMp) * 100;
            const controlClass = member.controlType === 'AI' ? 'ai-controlled' : 'player-controlled';
            const statusText = Object.keys(member.statusEffects).join(', ') || 'None';
            
            return `
                <div class="character-status ${controlClass}">
                    <div class="character-name">${member.name} [${member.controlType}] Lv${member.level}</div>
                    <div class="character-hp">
                        HP: ${member.stats.hp}/${member.stats.maxHp}
                        <div class="stat-bar">
                            <div class="stat-fill hp-fill" style="width: ${hpPercent}%"></div>
                        </div>
                    </div>
                    <div class="character-mp">
                        MP: ${member.stats.mp}/${member.stats.maxMp}
                        <div class="stat-bar">
                            <div class="stat-fill mp-fill" style="width: ${mpPercent}%"></div>
                        </div>
                    </div>
                    <div class="character-status-effects">Status: ${statusText}</div>
                </div>
            `;
        }).join('');
        
        // Update enemy status
        const enemyStatus = document.getElementById('enemy-status');
        if (this.battle.enemies) {
            enemyStatus.innerHTML = this.battle.enemies.map(enemy => {
                const hpPercent = (enemy.stats.hp / enemy.stats.maxHp) * 100;
                const hpDisplay = enemy.scanned ? `${enemy.stats.hp}/${enemy.stats.maxHp}` : '???';
                
                return `
                    <div class="enemy-status">
                        <div class="character-name">${enemy.name}</div>
                        <div class="character-hp">
                            HP: ${hpDisplay}
                            <div class="stat-bar">
                                <div class="stat-fill hp-fill" style="width: ${hpPercent}%"></div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }
        
        // Update battle log
        const battleMessages = document.getElementById('battle-messages');
        battleMessages.innerHTML = this.battle.battleLog.map(msg => 
            `<div class="battle-message">${msg}</div>`
        ).join('');
        battleMessages.scrollTop = battleMessages.scrollHeight;
    }
    
    startBattle() {
        this.state = 'BATTLE';
        document.getElementById('battle-ui').classList.remove('hidden');
        
        // Create enemies
        const enemies = [
            new Character({
                name: 'Shadow Beast',
                level: 4,
                controlType: 'AI',
                archetype: 'MONSTER',
                hp: 60, maxHp: 60,
                mp: 0, maxMp: 0,
                STR: 18, DEF: 12, INT: 5, MND: 5, SPD: 14,
                abilities: [],
                expReward: 80
            })
        ];
        
        this.battle = new BattleSystem(this, this.party, enemies);
        this.battle.start();
    }
    
    showBattleMenu(character) {
        // Show action menu for player-controlled character
        const actionMenu = document.getElementById('action-menu');
        const mainActions = document.getElementById('main-actions');
        
        actionMenu.classList.remove('hidden');
        
        const actions = ['Attack', 'Ability', 'Item', 'Defend'];
        if (character.abilities.includes('OVERRIDE')) {
            actions.splice(1, 0, 'Override');
        }
        
        mainActions.innerHTML = actions.map(action => 
            `<div class="menu-option" data-action="${action.toLowerCase()}">${action}</div>`
        ).join('');
        
        // Add click handlers
        mainActions.querySelectorAll('.menu-option').forEach(option => {
            option.addEventListener('click', () => {
                const action = option.dataset.action;
                this.handleBattleMenuSelection(action, character);
            });
        });
    }
    
    handleBattleMenuSelection(action, character) {
        if (action === 'attack') {
            this.selectTarget(character, 'enemy', (target) => {
                this.battle.executePlayerAction({ action: 'attack', target });
                document.getElementById('action-menu').classList.add('hidden');
            });
        } else if (action === 'defend') {
            this.battle.executePlayerAction({ action: 'defend' });
            document.getElementById('action-menu').classList.add('hidden');
        } else if (action === 'ability') {
            this.showAbilityMenu(character);
        } else if (action === 'override') {
            this.showOverrideMenu(character);
        } else if (action === 'item') {
            alert('Item menu not yet implemented!');
            document.getElementById('action-menu').classList.add('hidden');
            this.battle.executePlayerAction({ action: 'defend' });
        }
    }
    
    showAbilityMenu(character) {
        document.getElementById('action-menu').classList.add('hidden');
        const abilityMenu = document.getElementById('ability-menu');
        const abilityOptions = document.getElementById('ability-options');
        
        abilityMenu.classList.remove('hidden');
        
        const availableAbilities = character.getAvailableAbilities();
        abilityOptions.innerHTML = availableAbilities.map(abilityName => {
            const ability = ABILITIES[abilityName];
            return `
                <div class="menu-option" data-ability="${abilityName}">
                    ${ability.name}
                    <span class="ability-cost">${ability.cost} MP</span>
                </div>
            `;
        }).join('');
        
        if (availableAbilities.length === 0) {
            abilityOptions.innerHTML = '<div class="menu-option disabled">No abilities available</div>';
        }
        
        abilityOptions.querySelectorAll('.menu-option:not(.disabled)').forEach(option => {
            option.addEventListener('click', () => {
                const abilityName = option.dataset.ability;
                const ability = ABILITIES[abilityName];
                
                this.selectTarget(character, ability.target, (target) => {
                    this.battle.executePlayerAction({ 
                        action: 'ability', 
                        ability: abilityName, 
                        target 
                    });
                    abilityMenu.classList.add('hidden');
                });
            });
        });
    }
    
    showOverrideMenu(character) {
        document.getElementById('action-menu').classList.add('hidden');
        const targetMenu = document.getElementById('target-menu');
        const targetOptions = document.getElementById('target-options');
        
        targetMenu.classList.remove('hidden');
        
        // Show AI-controlled allies
        const aiAllies = this.party.filter(m => m.controlType === 'AI' && m.stats.hp > 0);
        targetOptions.innerHTML = aiAllies.map(ally => 
            `<div class="menu-option" data-target="${ally.name}">${ally.name}</div>`
        ).join('');
        
        targetOptions.querySelectorAll('.menu-option').forEach(option => {
            option.addEventListener('click', () => {
                const targetName = option.dataset.target;
                const target = this.party.find(m => m.name === targetName);
                
                // Now select action for the overridden character
                this.selectOverrideAction(character, target);
                targetMenu.classList.add('hidden');
            });
        });
    }
    
    selectOverrideAction(overrider, target) {
        // Show a menu to select what action the AI should take
        alert(`Override menu for ${target.name} - selecting Attack for now`);
        
        // For now, just make them attack a random enemy
        const randomEnemy = this.battle.enemies.filter(e => e.stats.hp > 0)[0];
        
        this.battle.executePlayerAction({
            action: 'override',
            target: target,
            overrideAction: {
                action: 'attack',
                target: randomEnemy
            }
        });
    }
    
    selectTarget(character, targetType, callback) {
        const targetMenu = document.getElementById('target-menu');
        const targetOptions = document.getElementById('target-options');
        
        document.getElementById('ability-menu').classList.add('hidden');
        targetMenu.classList.remove('hidden');
        
        let targets;
        if (targetType === 'enemy') {
            targets = this.battle.enemies.filter(e => e.stats.hp > 0);
        } else if (targetType === 'ally') {
            targets = this.party.filter(m => m.stats.hp > 0);
        }
        
        targetOptions.innerHTML = targets.map(target => 
            `<div class="menu-option" data-target="${target.name}">${target.name}</div>`
        ).join('');
        
        targetOptions.querySelectorAll('.menu-option').forEach(option => {
            option.addEventListener('click', () => {
                const targetName = option.dataset.target;
                const target = targets.find(t => t.name === targetName);
                targetMenu.classList.add('hidden');
                callback(target);
            });
        });
    }
    
    endBattle(result) {
        this.state = 'OVERWORLD';
        document.getElementById('battle-ui').classList.add('hidden');
        this.battle = null;
        
        if (result === 'victory') {
            this.showMessage('Victory! You gained experience!');
        } else {
            this.showMessage('Defeated... Game Over. Press F5 to restart.');
        }
    }
    
    openMenu() {
        this.state = 'MENU';
        document.getElementById('main-menu').classList.remove('hidden');
    }
    
    closeMenu() {
        this.state = 'OVERWORLD';
        document.getElementById('main-menu').classList.add('hidden');
    }
    
    showMessage(text) {
        const dialogueBox = document.getElementById('dialogue-box');
        const dialogueText = document.getElementById('dialogue-text');
        
        dialogueText.textContent = text;
        dialogueBox.classList.remove('hidden');
        
        setTimeout(() => {
            dialogueBox.classList.add('hidden');
        }, 3000);
    }
}

// ===== START GAME =====
window.addEventListener('load', () => {
    new Game();
});
