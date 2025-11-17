// Generic JRPG - Proof of Concept
// Game Design Document v1.1 Implementation
// Refactored to sprite-based rendering per Betty's Specification v1.0

// ===== ASSET MANIFEST =====
const ASSET_MANIFEST = {
    // Overworld tileset (4 tiles: 2 grass, 2 path)
    'tileset_world': 'https://placehold.co/128x64/228B22/000000?text=GRASS-1%0AGRASS-2&font=arial',
    'tileset_path': 'https://placehold.co/128x64/8B4513/FFFFFF?text=PATH-1%0APATH-2&font=arial',

    // Player Sprite Sheet (32x64 sprites)
    // Layout: [Idle, Walk1, Walk2, Walk3]
    // Row 1 (y=0):   Walk Down
    // Row 2 (y=64):  Walk Left
    // Row 3 (y=128): Walk Right
    // Row 4 (y=192): Walk Up
    'sheet_leo': 'https://placehold.co/128x256/0000FF/FFFFFF?text=LeoSheet&font=arial',
    'sheet_eliza': 'https://placehold.co/128x256/800080/FFFFFF?text=ElizaSheet&font=arial',
    'sheet_blayde': 'https://placehold.co/128x256/FF0000/FFFFFF?text=BlaydeSheet&font=arial',
    'sheet_serapha': 'https://placehold.co/128x256/FFC0CB/000000?text=SeraphaSheet&font=arial',

    // Enemy Sprite
    'enemy_shadow_beast': 'https://placehold.co/64x64/4B0082/FFFFFF?text=Beast&font=arial',

    // UI Elements
    'ui_window': 'https://placehold.co/128x128/191970/FFFFFF?text=UI-Window&font=arial',
    'ui_cursor': 'https://placehold.co/32x32/FFFF00/000000?text=Cursor&font=arial'
};

// ===== ASSET LOADER =====
class AssetLoader {
    constructor(manifest) {
        this.manifest = manifest;
        this.assets = {};
        this.totalAssets = 0;
        this.loadedAssets = 0;
        this.loadingComplete = false;
        this.loadingError = null;
    }

    async loadAll() {
        const assetKeys = Object.keys(this.manifest);
        this.totalAssets = assetKeys.length;
        this.loadedAssets = 0;

        console.log(`[AssetLoader] Loading ${this.totalAssets} assets...`);

        const loadPromises = assetKeys.map(key => this.loadAsset(key, this.manifest[key]));

        try {
            await Promise.all(loadPromises);
            this.loadingComplete = true;
            console.log(`[AssetLoader] All ${this.totalAssets} assets loaded successfully!`);
            return true;
        } catch (error) {
            this.loadingError = error;
            console.error('[AssetLoader] Failed to load assets:', error);
            return false;
        }
    }

    loadAsset(key, url) {
        return new Promise((resolve, reject) => {
            const img = new Image();

            img.onload = () => {
                this.assets[key] = img;
                this.loadedAssets++;
                console.log(`[AssetLoader] Loaded ${key} (${this.loadedAssets}/${this.totalAssets})`);
                resolve(img);
            };

            img.onerror = (error) => {
                console.error(`[AssetLoader] Failed to load ${key} from ${url}`, error);
                reject(new Error(`Failed to load asset: ${key}`));
            };

            img.src = url;
        });
    }

    getAsset(key) {
        if (!this.assets[key]) {
            console.warn(`[AssetLoader] Asset "${key}" not found!`);
            return null;
        }
        return this.assets[key];
    }

    getLoadingProgress() {
        if (this.totalAssets === 0) return 0;
        return Math.floor((this.loadedAssets / this.totalAssets) * 100);
    }
}

// ===== SAVE SYSTEM =====
class SaveSystem {
    constructor() {
        this.saveKey = 'genericJRPG_save';
        this.version = '1.0';
    }

    save(game) {
        try {
            const saveData = {
                version: this.version,
                timestamp: Date.now(),
                party: game.party.map(c => this.serializeCharacter(c)),
                inventory: {
                    items: game.inventory.items,
                    equipment: game.inventory.equipment,
                    keyItems: game.inventory.keyItems
                },
                gil: game.gil,
                playTime: Math.floor((Date.now() - game.startTime) / 1000) + game.playTime,
                storyPhase: game.currentStoryPhase,
                hasSeenAwakening: game.hasSeenAwakening,
                hasSeenIncident: game.hasSeenIncident,
                playerPosition: {
                    x: game.player.x,
                    y: game.player.y,
                    direction: game.player.direction
                }
            };

            localStorage.setItem(this.saveKey, JSON.stringify(saveData));
            console.log('[SaveSystem] Game saved successfully');
            return true;
        } catch (error) {
            console.error('[SaveSystem] Failed to save:', error);
            return false;
        }
    }

    _getRawSaveData() {
        try {
            const data = localStorage.getItem(this.saveKey);
            if (!data) return null;
            return JSON.parse(data);
        } catch (error) {
            console.error('[SaveSystem] Failed to parse save data:', error);
            return null;
        }
    }

    load() {
        const saveData = this._getRawSaveData();
        if (!saveData) {
            console.log('[SaveSystem] No save data found');
            return null;
        }

        // Version check
        if (saveData.version !== this.version) {
            console.warn('[SaveSystem] Save version mismatch');
            // Could implement migration here
        }

        console.log('[SaveSystem] Save data loaded successfully');
        return saveData;
    }

    serializeCharacter(character) {
        return {
            name: character.name,
            level: character.level,
            controlType: character.controlType,
            archetype: character.archetype,
            exp: character.exp,
            stats: { ...character.stats },
            abilities: [...character.abilities],
            equipment: {
                weapon: Object.keys(EQUIPMENT_DATA).find(key => EQUIPMENT_DATA[key] === character.equipment.weapon) || null,
                armor: Object.keys(EQUIPMENT_DATA).find(key => EQUIPMENT_DATA[key] === character.equipment.armor) || null,
                accessory: Object.keys(EQUIPMENT_DATA).find(key => EQUIPMENT_DATA[key] === character.equipment.accessory) || null
            },
            statusEffects: { ...character.statusEffects }
        };
    }

    deleteSave() {
        try {
            localStorage.removeItem(this.saveKey);
            console.log('[SaveSystem] Save data deleted');
            return true;
        } catch (error) {
            console.error('[SaveSystem] Failed to delete save:', error);
            return false;
        }
    }

    hasSaveData() {
        return localStorage.getItem(this.saveKey) !== null;
    }

    getSaveInfo() {
        const saveData = this._getRawSaveData();
        if (!saveData) return null;

        return {
            timestamp: saveData.timestamp,
            playTime: saveData.playTime,
            storyPhase: saveData.storyPhase,
            partySize: saveData.party.length
        };
    }
}

// ===== CONSTANTS AND DATA =====
const STATUS_EFFECTS = {
    POISON: { name: 'POISON', color: '#9b59b6', persistent: true },
    SLEEP: { name: 'SLEEP', color: '#3498db', persistent: false },
    PARALYSIS: { name: 'PARALYSIS', color: '#f39c12', persistent: false },
    PROTECT: { name: 'PROTECT', color: '#2ecc71', persistent: false },
    HASTE: { name: 'HASTE', color: '#e74c3c', persistent: false },
    REGEN: { name: 'REGEN', color: '#1abc9c', persistent: false }
};

const EQUIPMENT_DATA = {
    // Weapons
    BROADSWORD: { 
        name: 'Broadsword', 
        type: 'weapon', 
        price: 180, 
        STR: 12, 
        compatibleWith: ['Blayde', 'Leo'],
        description: 'A sturdy steel sword'
    },
    WOODEN_STAFF: { 
        name: 'Wooden Staff', 
        type: 'weapon', 
        price: 150, 
        INT: 8, 
        MND: 8,
        compatibleWith: ['Serapha', 'Eliza'],
        description: 'A simple wooden staff'
    },
    // Armor
    LEATHER_TUNIC: { 
        name: 'Leather Tunic', 
        type: 'armor', 
        price: 100, 
        DEF: 8,
        compatibleWith: ['Blayde', 'Serapha', 'Leo', 'Eliza'],
        description: 'Light leather armor'
    },
    // Accessories
    LEATHER_SHIELD: { 
        name: 'Leather Shield', 
        type: 'accessory', 
        price: 80, 
        DEF: 5,
        compatibleWith: ['Blayde', 'Leo'],
        description: 'A small wooden shield'
    },
    POISON_RING: {
        name: 'Poison Ring',
        type: 'accessory',
        price: 120,
        effect: 'POISON_IMMUNITY',
        compatibleWith: ['Blayde', 'Serapha', 'Leo', 'Eliza'],
        description: 'Prevents POISON status'
    },
    SPEED_BOOTS: {
        name: 'Speed Boots',
        type: 'accessory',
        price: 150,
        SPD: 5,
        compatibleWith: ['Blayde', 'Serapha', 'Leo', 'Eliza'],
        description: 'Increases speed'
    }
};

const SHOP_DATA = {
    LEAFY_VILLAGE_ITEMS: {
        name: 'Toadstool Sundries',
        items: [
            { id: 'POTION', price: 50 },
            { id: 'ANTIDOTE', price: 20 },
            { id: 'PHOENIX_DOWN', price: 500 }
        ]
    },
    LEAFY_VILLAGE_EQUIPMENT: {
        name: 'The Rusty Helm',
        items: [
            { id: 'BROADSWORD', price: 180 },
            { id: 'WOODEN_STAFF', price: 150 },
            { id: 'LEATHER_TUNIC', price: 100 },
            { id: 'LEATHER_SHIELD', price: 80 }
        ]
    }
};

const ITEM_DATA = {
    POTION: { name: 'Potion', type: 'consumable', maxStack: 9, description: 'Restores 50 HP', effect: 'heal', value: 50 },
    ETHER: { name: 'Ether', type: 'consumable', maxStack: 9, description: 'Restores 20 MP', effect: 'restoreMP', value: 20 },
    ANTIDOTE: { name: 'Antidote', type: 'consumable', maxStack: 9, description: 'Cures POISON', effect: 'curePoison' },
    PHOENIX_DOWN: { name: 'Phoenix Down', type: 'consumable', maxStack: 9, description: 'Revives with 1 HP', effect: 'revive' }
};

// ===== NARRATIVE & SCENE DATA =====
const SCENES = {
    AWAKENING: {
        id: 'AWAKENING',
        location: 'INN_ROOM',
        music: 'inn_theme',
        dialogue: [
            { speaker: 'Leo', text: "What the... this isn't my room. Where's my PC?" },
            { speaker: 'Eliza', text: 'Leo. Don\'t panic. But I think... I think we\'re in Chrono-Fantasy 7.' },
            { speaker: 'Leo', text: 'In what? The SNES game? That\'s impossible. We were just... on the couch.' },
            { speaker: 'Leo', text: 'This has to be a dream.', action: 'pinch' },
            { speaker: 'System', text: 'STATUS: NORMAL' },
            { speaker: 'Leo', text: '...', action: 'look_at_hands' },
            { speaker: 'System', text: 'LEO: HP 70/70 MP 25/25' },
            { speaker: 'Eliza', text: 'See? We have a UI. We\'re in the game. We must have gotten pulled in when we booted up the console.' },
            { speaker: 'Leo', text: 'How do I skip this? Where\'s the \'Start\' button? Where\'s the menu? How do I quit?' },
            { speaker: 'Eliza', text: 'I\'ve tried. It doesn\'t work. The game is in a cutscene. We are in a cutscene. And there\'s only one way to end an RPG, Leo.' },
            { speaker: 'Leo', text: '...You don\'t mean.' },
            { speaker: 'Eliza', text: 'We have to beat it. From the inside.' },
            { speaker: 'Innkeeper', text: 'Ah, you\'re finally awake!' },
            { speaker: 'Innkeeper', text: 'You must hurry! The great \'Inciting Incident Festival\' is about to begin!' },
            { speaker: 'Leo', text: '...That guy just... slid. And... \'The Inciting Incident Festival\'?' },
            { speaker: 'Eliza', text: 'That\'s our cue. We\'re the Tragic Protagonists, or at least we\'re expected to be. Let\'s go.' },
            { speaker: 'Leo', text: 'I am not tragic. And I am not a protagonist.' }
        ]
    },
    THE_INCIDENT: {
        id: 'THE_INCIDENT',
        location: 'TOWN_SQUARE',
        music: 'town_theme',
        dialogue: [
            { speaker: 'Town Elder', text: '...and so, with the Crystal\'s blessing, we ensure another year of peaceful...!' },
            { speaker: 'Leo', text: '...An airship. Of course. Impossibly advanced, dark metal, glowing red lights... From the \'High-Tech Empire from one town over.\'' },
            { speaker: 'General Kage', text: 'Fools! Your pitiful festival is over! I, General Kage of the Zetrulan Empire, am here for your Crystal!' },
            { speaker: 'Blayde', text: 'I... I don\'t know who I am... or how I got here... My head... a memory? No, it\'s gone... but I know that what you\'re doing is WRONG!' },
            { speaker: 'Serapha', text: 'The Prophecy... It\'s you! The amnesiac warrior from the sky!' },
            { speaker: 'Eliza', text: '(Whispering) Okay. There\'s our actual protagonist. The amnesiac one. And there\'s the healer/love-interest. They\'re a set.' },
            { speaker: 'Leo', text: '(Whispering) Good. Let them handle it. We just need to stay out of the cutscene.' },
            { speaker: 'General Kage', text: 'Insolent child! You dare oppose me? Then you will be the first to die!' },
            { speaker: 'System', text: 'BATTLE START - GENERAL KAGE' },
            { speaker: 'Leo', text: 'Wait, what? We\'re in the party?! We\'re not even in the cutscene!' },
            { speaker: 'Eliza', text: 'We got pulled in! Just... \'Defend\'!' }
        ]
    },
    POST_BATTLE: {
        id: 'POST_BATTLE',
        location: 'TOWN_SQUARE',
        dialogue: [
            { speaker: 'Leo', text: '...We\'re dead. We died. I knew it.' },
            { speaker: 'Eliza', text: 'No... look. It was an unwinnable fight. A story boss. Hmph. Cheap.' },
            { speaker: 'General Kage', text: 'This is but the first of the Seven Crystals! Soon, the Emperor will awaken the great Demon God, and we shall rule this pathetic world! Next, I\'ll check the Ice Cave and the Volcano!' },
            { speaker: 'Leo', text: '(Muttering) He\'s not just telling us the whole plot, he\'s giving us the walkthrough.' },
            { speaker: 'Blayde', text: 'No... He got away... I... I must stop him! I must go to the... uh...' },
            { speaker: 'Town Elder', text: '(Helpfully) The airship flew north, toward the \'Dungeon of the First Trial,\' which is also known as the \'Cavern of Whispers\'!' },
            { speaker: 'Blayde', text: '...Right! The Cavern of Whispers! I go now!' },
            { speaker: 'Blayde', text: 'You two. You have the hearts of warriors. You withstood the General\'s ultimate attack! Will you join me?' },
            { speaker: 'Leo', text: 'Absolutely not. We \'withstood\' nothing. That was a scripted event. I\'m going to find a way to hack the save file.' },
            { speaker: 'Eliza', text: 'We would be honored, Blayde. We must stop this... great evil.' },
            { speaker: 'System', text: 'LEO takes 1 DMG' },
            { speaker: 'System', text: 'BLAYDE joined the party!' },
            { speaker: 'System', text: 'SERAPHA joined the party!' },
            { speaker: 'Eliza', text: '(To Leo) Right. Before we go to that cave, we hit the shop. We are not fighting with our bare hands again.' },
            { speaker: 'Leo', text: 'Fine. But I am not grinding for 100 hours. And if I see one talking animal mascot, I\'m quitting.' },
            { speaker: 'Eliza', text: 'That\'s probably Act 2, Leo. Just... just try to keep up. We need to beat the final boss. How hard can it be?' }
        ]
    }
};

const NPC_DATA = {
    INNKEEPER: {
        name: 'Innkeeper',
        location: 'LEAFY_VILLAGE',
        dialogue: ['A good rest sharpens the mind! Stay the night for 10 Gil?'],
        sprite: 'innkeeper'
    },
    WANDERING_NPC_1: {
        name: 'Villager',
        location: 'LEAFY_VILLAGE',
        dialogue: ['The item shop has new Potions in stock!'],
        sprite: 'villager',
        wanders: true
    },
    HOMEOWNER: {
        name: 'Homeowner',
        location: 'LEAFY_VILLAGE',
        dialogue: [
            'Welcome to Leafyvillage! The weather is lovely today.',
            'I heard a rumor that monsters are coming back.'
        ],
        sprite: 'villager'
    },
    TOWN_ELDER: {
        name: 'Town Elder',
        location: 'TOWN_SQUARE',
        dialogue: ['The Crystal has protected our village for generations...'],
        sprite: 'elder'
    },
    SHOPKEEPER: {
        name: 'Shopkeeper',
        location: 'LEAFY_VILLAGE',
        dialogue: ['Welcome! Potions and remedies for the weary traveler!'],
        sprite: 'shopkeeper'
    },
    BLACKSMITH: {
        name: 'Blacksmith',
        location: 'LEAFY_VILLAGE',
        dialogue: ['You won\'t survive long with that flimsy gear. Take a look.'],
        sprite: 'blacksmith'
    }
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
class BlaydeAI {
    static decideAction(character, allies, enemies, game) {
        // Blayde's "Artificial Stupidity"
        // 1. Check if he has enough MP for Fire Slash (his "impressive" ability)
        const fireSlashAbility = ABILITIES.FIRE_SLASH;
        if (character.abilities.includes('FIRE_SLASH') &&
            fireSlashAbility &&
            character.stats.mp >= fireSlashAbility.cost) {

            // Select living enemies only
            const livingEnemies = enemies.filter(e => e.stats.hp > 0);
            if (livingEnemies.length > 0) {
                return {
                    action: 'ability',
                    ability: 'FIRE_SLASH',
                    target: livingEnemies[Math.floor(Math.random() * livingEnemies.length)]
                };
            }
        }

        // 2. Default: Random attack on living enemies
        const livingEnemies = enemies.filter(e => e.stats.hp > 0);
        if (livingEnemies.length > 0) {
            return {
                action: 'attack',
                target: livingEnemies[Math.floor(Math.random() * livingEnemies.length)]
            };
        }

        // 3. Fallback: Defend if no valid targets
        return { action: 'defend' };
    }
}

class SeraphaAI {
    static decideAction(character, allies, enemies, game) {
        // Serapha's inefficient healing AI

        // Check if defending and prayer passive triggers
        if (character.isDefending && ABILITIES.PRAYER && ABILITIES.PRAYER.effect()) {
            return { action: 'pray' }; // Waste turn "praying"
        }

        // Try to heal - but inefficiently
        // Start from top of party list
        const healAbility = ABILITIES.HEAL;
        if (healAbility) {
            for (const ally of allies) {
                if (ally.stats.hp > 0 && ally.stats.hp < ally.stats.maxHp) {
                    // Will heal even if just 1 HP missing
                    if (character.stats.mp >= healAbility.cost) {
                        return {
                            action: 'ability',
                            ability: 'HEAL',
                            target: ally
                        };
                    }
                }
            }
        }

        // Try to cast Protect on Blayde (repeatedly, even if it doesn't stack)
        const protectAbility = ABILITIES.PROTECT;
        if (protectAbility) {
            const blayde = allies.find(a => a.name === 'Blayde' && a.stats.hp > 0);
            if (blayde && character.stats.mp >= protectAbility.cost) {
                return {
                    action: 'ability',
                    ability: 'PROTECT',
                    target: blayde
                };
            }
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
            POTION: { ...ITEM_DATA.POTION, count: 5 },
            ETHER: { ...ITEM_DATA.ETHER, count: 2 },
            ANTIDOTE: { ...ITEM_DATA.ANTIDOTE, count: 3 },
            PHOENIX_DOWN: { ...ITEM_DATA.PHOENIX_DOWN, count: 1 }
        };
        
        this.equipment = {}; // Stores owned equipment pieces
        this.keyItems = [];
    }
    
    getItemCount(itemId) {
        return this.items[itemId]?.count || 0;
    }
    
    hasItem(itemId) {
        return (this.items[itemId] && this.items[itemId].count > 0) || 
               (this.equipment[itemId] && this.equipment[itemId].count > 0);
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

    removeItem(itemId, count = 1) {
        if (this.items[itemId] && this.items[itemId].count >= count) {
            this.items[itemId].count -= count;
            if (this.items[itemId].count === 0) {
                delete this.items[itemId];
            }
            return true;
        }
        return false;
    }

    addItem(itemId, count = 1) {
        const itemData = ITEM_DATA[itemId];
        if (itemData) {
            if (!this.items[itemId]) {
                this.items[itemId] = { ...itemData, count: 0 };
            }
            this.items[itemId].count = Math.min(
                this.items[itemId].count + count,
                itemData.maxStack
            );
            return true;
        }
        return false;
    }
    
    addEquipment(equipId, count = 1) {
        const equipData = EQUIPMENT_DATA[equipId];
        if (equipData) {
            if (!this.equipment[equipId]) {
                this.equipment[equipId] = { ...equipData, count: 0 };
            }
            this.equipment[equipId].count += count;
            return true;
        }
        return false;
    }
    
    removeEquipment(equipId) {
        if (this.equipment[equipId] && this.equipment[equipId].count > 0) {
            this.equipment[equipId].count--;
            if (this.equipment[equipId].count === 0) {
                delete this.equipment[equipId];
            }
            return true;
        }
        return false;
    }
    
    getTotalItemCount() {
        let count = 0;
        for (const item of Object.values(this.items)) {
            count += 1; // Each stack counts as 1 slot
        }
        for (const equip of Object.values(this.equipment)) {
            count += equip.count; // Each equipment piece is 1 slot
        }
        return count;
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
        this.isExecuting = false; // Add this lock
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

        // Safety counter to prevent infinite loops
        const maxIterations = this.turnOrder.length * 2;
        let iterationCount = 0;
        let foundActiveCharacter = false;

        // Move to next character
        do {
            iterationCount++;

            // INFINITE LOOP PROTECTION
            if (iterationCount > maxIterations) {
                console.error('[Battle] Infinite loop detected in nextTurn()!');
                this.addLog('ERROR: No active characters found!');

                // Emergency recovery: Wake up first sleeping character or end battle
                const sleepingChar = this.turnOrder.find(c =>
                    c.stats.hp > 0 && c.hasStatus('SLEEP')
                );

                if (sleepingChar) {
                    sleepingChar.removeStatus('SLEEP');
                    this.addLog(`${sleepingChar.name} forcefully awakens!`);
                    this.currentCharacter = sleepingChar;
                    foundActiveCharacter = true;
                    console.log('[Battle] Emergency recovery: woke up sleeping character');
                    break;
                } else {
                    // No recovery possible - force end battle
                    console.error('[Battle] No recovery possible, ending battle');
                    this.addLog('Battle ended due to system error!');
                    this.endBattle('defeat');
                    return;
                }
            }

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

            foundActiveCharacter = true;
            break;
        } while (true);

        // Log if we had to iterate multiple times (potential issue indicator)
        if (iterationCount > this.turnOrder.length) {
            console.warn(`[Battle] nextTurn() required ${iterationCount} iterations (turnOrder size: ${this.turnOrder.length})`);
        }

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

    // Promise-based delay helper to replace setTimeout
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async executeAITurn() {
        if (this.isExecuting) return;
        this.isExecuting = true;

        try {
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
                    action = BlaydeAI.decideAction(this.currentCharacter, allies, enemies, this.game);
                } else if (this.currentCharacter.name === 'Serapha') {
                    action = SeraphaAI.decideAction(this.currentCharacter, allies, enemies, this.game);
                } else {
                    // Enemy AI - simple attack
                    const livingAllies = allies.filter(a => a.stats.hp > 0);
                    if (livingAllies.length > 0) {
                        action = {
                            action: 'attack',
                            target: livingAllies[Math.floor(Math.random() * livingAllies.length)]
                        };
                    }
                }
            }

            this.executeAction(action);

            // Use Promise-based delay instead of setTimeout
            await this.delay(1500);

            this.nextTurn();
        } catch (error) {
            console.error('[Battle] Error in executeAITurn:', error);
            this.addLog('ERROR: AI turn failed!');
            this.nextTurn();
        } finally {
            this.isExecuting = false;
        }
    }

    async executePlayerAction(action) {
        if (this.isExecuting) return;
        this.isExecuting = true;

        try {
            this.waitingForPlayer = false;
            this.executeAction(action);

            // Use Promise-based delay instead of setTimeout
            await this.delay(1500);

            this.nextTurn();
        } catch (error) {
            console.error('[Battle] Error executing player action:', error);
            this.addLog('ERROR: Action failed!');
            this.nextTurn();
        } finally {
            this.isExecuting = false;
        }
    }

    executeAction(action) {
        try {
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
        } catch (error) {
            console.error('[Battle] Error in executeAction:', error);
            this.addLog(`ERROR: ${actor?.name || 'Action'} failed!`);
            throw error; // Re-throw to be caught by executePlayerAction
        }
    }
    
    addLog(message) {
        this.battleLog.push(message);
        if (this.battleLog.length > 10) {
            this.battleLog.shift();
        }
    }
    
    async endBattle(result) {
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

            // Use Promise-based delay instead of setTimeout
            await this.delay(3000);
            this.game.endBattle('victory');
        } else {
            this.addLog('Defeat...');

            // Use Promise-based delay instead of setTimeout
            await this.delay(3000);
            this.game.endBattle('defeat');
        }
    }
}

// ===== DIALOGUE & CUTSCENE SYSTEM =====
class DialogueSystem {
    constructor(game) {
        this.game = game;
        this.currentScene = null;
        this.currentDialogueIndex = 0;
        this.isActive = false;
        this.dialogueBox = document.getElementById('dialogue-box');
        this.dialogueText = document.getElementById('dialogue-text');
    }
    
    startScene(sceneId) {
        const scene = SCENES[sceneId];
        if (!scene) return false;
        
        this.currentScene = scene;
        this.currentDialogueIndex = 0;
        this.isActive = true;
        this.showNextDialogue();
        return true;
    }
    
    showNextDialogue() {
        if (!this.currentScene || this.currentDialogueIndex >= this.currentScene.dialogue.length) {
            this.endScene();
            return;
        }
        
        const dialogue = this.currentScene.dialogue[this.currentDialogueIndex];
        let displayText = '';
        
        if (dialogue.speaker === 'System') {
            displayText = `[${dialogue.text}]`;
        } else if (dialogue.text.includes('(Whispering)') || dialogue.text.includes('(Muttering)') || dialogue.text.includes('(To Leo)') || dialogue.text.includes('(Helpfully)')) {
            displayText = `${dialogue.speaker}: ${dialogue.text}`;
        } else {
            displayText = `${dialogue.speaker}: "${dialogue.text}"`;
        }
        
        this.dialogueText.textContent = displayText;
        this.dialogueBox.classList.remove('hidden');
    }
    
    advance() {
        if (!this.isActive) return;
        
        this.currentDialogueIndex++;
        this.showNextDialogue();
    }
    
    endScene() {
        this.isActive = false;
        this.dialogueBox.classList.add('hidden');
        this.currentScene = null;
        this.currentDialogueIndex = 0;
        
        // Trigger post-scene events
        if (this.game) {
            this.game.onSceneEnd();
        }
    }
    
    skip() {
        this.endScene();
    }
}

// ===== MAIN GAME CLASS =====
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;

        this.state = 'LOADING'; // LOADING, TITLE, OVERWORLD, BATTLE, MENU
        this.keys = {};

        // Initialize Asset Loader
        this.assetLoader = new AssetLoader(ASSET_MANIFEST);

        // Battle menu event listener cleanup tracking
        this.battleMenuCleanup = [];

        // Start asset loading, then initialize game
        this.loadAssetsAndStart();
        this.setupEventListeners();
        this.gameLoop();
    }

    async loadAssetsAndStart() {
        try {
            const success = await this.assetLoader.loadAll();
            if (success) {
                console.log('[Game] Assets loaded successfully, initializing game...');
                this.initGame();
                this.state = 'TITLE';
            } else {
                console.error('[Game] Failed to load assets');
                this.state = 'ERROR';
            }
        } catch (error) {
            console.error('[Game] Error during asset loading:', error);
            this.state = 'ERROR';
        }
    }
    
    initGame() {
        // Initialize party - Start with Leo and Eliza only (narrative will add Blayde and Serapha)
        this.party = [
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
        
        // Store Blayde and Serapha for later recruitment
        this.blaydeCharacter = new Character({
            name: 'Blayde',
            level: 5,
            controlType: 'AI',
            archetype: 'HERO',
            hp: 80, maxHp: 80,
            mp: 20, maxMp: 20,
            STR: 25, DEF: 15, INT: 5, MND: 5, SPD: 15,
            abilities: ['FIRE_SLASH', 'HEADSTRONG'],
            aiLogic: BlaydeAI
        });
        
        this.seraphaCharacter = new Character({
            name: 'Serapha',
            level: 5,
            controlType: 'AI',
            archetype: 'HEALER',
            hp: 50, maxHp: 50,
            mp: 40, maxMp: 40,
            STR: 8, DEF: 10, INT: 12, MND: 25, SPD: 18,
            abilities: ['HEAL', 'CURE_POISON', 'PROTECT', 'PRAYER'],
            aiLogic: SeraphaAI
        });
        
        this.inventory = new Inventory();
        this.battle = null;

        // Save System
        this.saveSystem = new SaveSystem();

        // Game tracking
        this.gil = 500; // Starting money
        this.startTime = Date.now();
        this.playTime = 0; // in seconds
        
        // Narrative tracking
        this.currentStoryPhase = 'AWAKENING'; // AWAKENING, TOWN_EXPLORATION, INCIDENT, POST_INCIDENT
        this.hasSeenAwakening = false;
        this.hasSeenIncident = false;
        
        // Dialogue system
        this.dialogueSystem = new DialogueSystem(this);
        
        // Overworld
        this.player = {
            x: 400,
            y: 300,
            direction: 'down',
            speed: 2.5,
            // Animation properties (per Betty's spec)
            frame: 0,
            animationTimer: 0,
            animationThreshold: 10 // Frames before advancing animation
        };
        
        this.encounterTimer = 0;
        this.titleBlink = 0;
        this.menuState = null;
    }

    loadGame() {
        try {
            const saveData = this.saveSystem.load();
            if (!saveData) {
                console.log('[Game] No save data to load');
                return false;
            }

            console.log('[Game] Loading save data...');

            // Restore party
            this.party = saveData.party.map(charData => {
                const char = new Character(charData);
                char.level = charData.level;
                char.exp = charData.exp;
                char.stats = { ...charData.stats };
                char.statusEffects = { ...charData.statusEffects };
                char.controlType = charData.controlType;
                char.archetype = charData.archetype;
                char.abilities = [...charData.abilities];

                // Restore equipment
                char.equipment.weapon = charData.equipment.weapon ? EQUIPMENT_DATA[charData.equipment.weapon] : null;
                char.equipment.armor = charData.equipment.armor ? EQUIPMENT_DATA[charData.equipment.armor] : null;
                char.equipment.accessory = charData.equipment.accessory ? EQUIPMENT_DATA[charData.equipment.accessory] : null;

                // Restore AI logic if AI character
                if (char.controlType === 'AI') {
                    if (char.name === 'Blayde') {
                        char.aiLogic = BlaydeAI;
                    } else if (char.name === 'Serapha') {
                        char.aiLogic = SeraphaAI;
                    }
                }

                return char;
            });

            // Restore inventory
            this.inventory.items = saveData.inventory.items;
            this.inventory.equipment = saveData.inventory.equipment;
            this.inventory.keyItems = saveData.inventory.keyItems;

            // Restore game tracking
            this.gil = saveData.gil;
            this.playTime = saveData.playTime;
            this.startTime = Date.now(); // Reset start time to now

            // Restore story progress
            this.currentStoryPhase = saveData.storyPhase;
            this.hasSeenAwakening = saveData.hasSeenAwakening;
            this.hasSeenIncident = saveData.hasSeenIncident;

            // Restore player position
            this.player.x = saveData.playerPosition.x;
            this.player.y = saveData.playerPosition.y;
            this.player.direction = saveData.playerPosition.direction;

            console.log('[Game] Save data loaded successfully!');
            return true;
        } catch (error) {
            console.error('[Game] Failed to load game:', error);
            return false;
        }
    }

    saveGame() {
        try {
            const success = this.saveSystem.save(this);
            if (success) {
                console.log('[Game] Game saved successfully!');
                this.showMessage && this.showMessage('Game saved!');
                return true;
            } else {
                console.error('[Game] Failed to save game');
                return false;
            }
        } catch (error) {
            console.error('[Game] Error saving game:', error);
            return false;
        }
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            
            if (e.key === 'Enter') {
                // Advance dialogue if active
                if (this.dialogueSystem.isActive) {
                    this.dialogueSystem.advance();
                } else if (this.state === 'TITLE') {
                    // Check if save data exists
                    const hasSave = this.saveSystem && this.saveSystem.hasSaveData();

                    if (hasSave) {
                        // Load the saved game
                        console.log('[Game] Loading saved game from title screen...');
                        const success = this.loadGame();
                        if (success) {
                            this.state = 'OVERWORLD';
                            this.showMessage('Welcome back! Game loaded.');
                        } else {
                            console.error('[Game] Failed to load save, starting new game');
                            this.startNewGame();
                        }
                    } else {
                        // No save data, start new game
                        this.startNewGame();
                    }
                }
            }

            if (e.key === 'n' || e.key === 'N') {
                // Start new game (even if save exists)
                if (this.state === 'TITLE') {
                    const hasSave = this.saveSystem && this.saveSystem.hasSaveData();
                    if (hasSave) {
                        // Confirm overwrite if save exists
                        const confirmed = confirm('Start new game? This will not delete your save file.');
                        if (confirmed) {
                            this.startNewGame();
                        }
                    } else {
                        this.startNewGame();
                    }
                }
            }
            
            if (e.key === 'm' || e.key === 'M') {
                if (this.state === 'OVERWORLD' && !this.dialogueSystem.isActive) {
                    this.openMenu();
                }
            }
            
            if (e.key === 'Escape') {
                if (this.state === 'MENU') {
                    this.closeMenu();
                } else if (this.dialogueSystem.isActive) {
                    // Allow skipping cutscenes with Escape
                    this.dialogueSystem.skip();
                }
            }
            
            if (e.key === ' ') {
                // Space bar also advances dialogue
                if (this.dialogueSystem.isActive) {
                    this.dialogueSystem.advance();
                }
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
    }
    
    startNewGame() {
        // Reset game state (re-run initGame but don't lose SaveSystem reference)
        const savedSystemRef = this.saveSystem;
        this.initGame();
        this.saveSystem = savedSystemRef;

        // Start the opening cutscene
        this.state = 'CUTSCENE';
        setTimeout(() => {
            this.dialogueSystem.startScene('AWAKENING');
        }, 500);
    }

    onSceneEnd() {
        // Handle post-scene logic
        if (this.currentStoryPhase === 'AWAKENING') {
            this.hasSeenAwakening = true;
            this.currentStoryPhase = 'TOWN_EXPLORATION';
            this.state = 'OVERWORLD';
            this.showMessage('You can now explore Leafy Village. Press M for menu. Walk around to trigger events.');
            // Auto-save after awakening scene
            setTimeout(() => this.saveGame(), 1000);
        } else if (this.currentStoryPhase === 'INCIDENT') {
            this.hasSeenIncident = true;
            this.currentStoryPhase = 'POST_INCIDENT';
            // Start the story battle with General Kage
            this.startStoryBattle();
        } else if (this.currentStoryPhase === 'POST_INCIDENT') {
            // Add Blayde and Serapha to the party
            this.party.push(this.blaydeCharacter);
            this.party.push(this.seraphaCharacter);
            this.currentStoryPhase = 'ADVENTURE';
            this.state = 'OVERWORLD';
            this.showMessage('Blayde and Serapha joined your party! You can now explore and prepare for the Cavern of Whispers.');
            // Auto-save after gaining new party members
            setTimeout(() => this.saveGame(), 1000);
        }
    }
    
    startStoryBattle() {
        this.state = 'CUTSCENE';
        // Show the post-battle dialogue immediately (it's an unwinnable fight)
        setTimeout(() => {
            // Add Blayde and Serapha temporarily for the battle
            const tempParty = [...this.party, this.blaydeCharacter, this.seraphaCharacter];
            
            // Simulate the unwinnable battle
            tempParty.forEach(member => {
                member.stats.hp = 1; // "Defeated" by story boss
            });
            
            this.dialogueSystem.startScene('POST_BATTLE');
        }, 1000);
    }
    
    gameLoop() {
        try {
            this.update();
            this.render();
        } catch (error) {
            console.error('[Game Loop] Critical error:', error);
            this.handleCriticalError(error, 'Game Loop');
        }
        requestAnimationFrame(() => this.gameLoop());
    }

    update() {
        try {
            if (this.state === 'OVERWORLD') {
                this.updateOverworld();
            }
        } catch (error) {
            console.error('[Update] Error during update:', error);
            throw error; // Re-throw to be caught by gameLoop
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

        // Animation logic (per Betty's spec)
        if (moved) {
            player.animationTimer++;
            if (player.animationTimer >= player.animationThreshold) {
                player.frame = (player.frame + 1) % 4; // Cycle through 4 frames
                player.animationTimer = 0;
            }

            // Random encounters
            this.encounterTimer++;
            if (this.encounterTimer > 120 && Math.random() < 0.015) {
                this.startBattle();
                this.encounterTimer = 0;
            }
        } else {
            // Reset to idle frame when not moving
            player.frame = 0;
            player.animationTimer = 0;
        }
    }
    
    render() {
        try {
            this.ctx.clearRect(0, 0, this.width, this.height);

            if (this.state === 'LOADING') {
                this.renderLoading();
            } else if (this.state === 'ERROR') {
                this.renderError();
            } else if (this.state === 'TITLE') {
                this.renderTitle();
            } else if (this.state === 'OVERWORLD') {
                this.renderOverworld();
            } else if (this.state === 'BATTLE') {
                this.renderBattle();
            }
        } catch (error) {
            console.error('[Render] Error during render:', error);
            throw error; // Re-throw to be caught by gameLoop
        }
    }

    renderLoading() {
        // Background
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Loading text
        this.ctx.font = '32px Courier New';
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = '#fff';
        this.ctx.fillText('Loading Assets...', this.width / 2, this.height / 2 - 20);

        // Progress bar
        const progress = this.assetLoader.getLoadingProgress();
        const barWidth = 400;
        const barHeight = 30;
        const barX = this.width / 2 - barWidth / 2;
        const barY = this.height / 2 + 20;

        // Bar background
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(barX, barY, barWidth, barHeight);

        // Bar fill
        this.ctx.fillStyle = '#4CAF50';
        this.ctx.fillRect(barX, barY, (barWidth * progress) / 100, barHeight);

        // Percentage text
        this.ctx.font = '20px Courier New';
        this.ctx.fillStyle = '#fff';
        this.ctx.fillText(`${progress}%`, this.width / 2, barY + barHeight / 2 + 7);
    }

    renderError() {
        // Background
        this.ctx.fillStyle = '#300';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Error text
        this.ctx.font = '32px Courier New';
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = '#f00';
        this.ctx.fillText('ERROR LOADING ASSETS', this.width / 2, this.height / 2 - 40);

        this.ctx.font = '18px Courier New';
        this.ctx.fillStyle = '#fff';
        this.ctx.fillText('Please refresh the page', this.width / 2, this.height / 2 + 10);

        if (this.assetLoader.loadingError) {
            this.ctx.font = '14px Courier New';
            this.ctx.fillStyle = '#aaa';
            this.ctx.fillText(this.assetLoader.loadingError.message, this.width / 2, this.height / 2 + 40);
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

        // Menu options
        const hasSave = this.saveSystem && this.saveSystem.hasSaveData();

        if (hasSave) {
            // Show Continue and New Game options
            this.ctx.font = '24px Courier New';

            // Continue option (blinking)
            if (Math.floor(Date.now() / 500) % 2 === 0) {
                this.ctx.fillStyle = '#ffd700';
                this.ctx.fillText('Press ENTER to Continue', this.width / 2, 420);
            }

            // New Game option
            this.ctx.font = '18px Courier New';
            this.ctx.fillStyle = '#aaaaaa';
            this.ctx.fillText('Press N for New Game', this.width / 2, 460);
        } else {
            // No save - just show start option
            if (Math.floor(Date.now() / 500) % 2 === 0) {
                this.ctx.font = '24px Courier New';
                this.ctx.fillStyle = '#ffd700';
                this.ctx.fillText('Press ENTER to Start', this.width / 2, 450);
            }
        }

        this.ctx.restore();
    }
    
    renderOverworld() {
        // SPRITE-BASED RENDERING (per Betty's spec)
        // Draw grass tiles using sprite sheet
        const grassTileset = this.assetLoader.getAsset('tileset_world');
        const pathTileset = this.assetLoader.getAsset('tileset_path');

        if (!grassTileset || !pathTileset) {
            // Fallback if assets not loaded
            this.ctx.fillStyle = '#2d5016';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '20px Courier New';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Assets loading...', this.width / 2, this.height / 2);
            return;
        }

        const tileSize = 32; // Each tile is 32x32 in the sprite sheet (64x64 has 2 tiles)

        // Draw grass field (tiled pattern)
        for (let y = 0; y < this.height; y += tileSize) {
            for (let x = 0; x < this.width; x += tileSize) {
                // Alternate between grass tile 1 and grass tile 2
                const tileIndex = ((x / tileSize) + (y / tileSize)) % 2;
                const sx = tileIndex * tileSize; // 0 or 32
                const sy = 0; // Top row (grassTileset is 64x32)

                this.ctx.drawImage(
                    grassTileset,
                    sx, sy, tileSize, tileSize, // Source rectangle
                    x, y, tileSize, tileSize    // Destination rectangle
                );
            }
        }

        // Draw paths using path tileset
        // Align all path coordinates to tile grid to prevent visual artifacts
        const pathWidth = 64; // Must be multiple of tileSize (32)
        const pathCenterX = Math.floor(this.width / 2 / tileSize) * tileSize;
        const pathCenterY = Math.floor(this.height / 2 / tileSize) * tileSize;

        // Vertical path
        for (let y = 0; y < this.height; y += tileSize) {
            for (let px = pathCenterX - pathWidth; px < pathCenterX + pathWidth; px += tileSize) {
                const tileIndex = ((px / tileSize) + (y / tileSize)) % 2;
                const sx = tileIndex * tileSize;
                const sy = 0;

                this.ctx.drawImage(
                    pathTileset,
                    sx, sy, tileSize, tileSize,
                    px, y, tileSize, tileSize
                );
            }
        }

        // Horizontal path
        for (let x = 0; x < this.width; x += tileSize) {
            for (let py = pathCenterY - pathWidth; py < pathCenterY + pathWidth; py += tileSize) {
                const tileIndex = ((x / tileSize) + (py / tileSize)) % 2;
                const sx = tileIndex * tileSize;
                const sy = 0;

                this.ctx.drawImage(
                    pathTileset,
                    sx, sy, tileSize, tileSize,
                    x, py, tileSize, tileSize
                );
            }
        }

        // Draw player
        this.drawPlayer();

        // Draw HUD
        this.drawOverworldHUD();
    }
    
    drawPlayer() {
        // SPRITE-BASED PLAYER RENDERING (per Betty's spec)
        const p = this.player;
        const leoSheet = this.assetLoader.getAsset('sheet_leo');

        if (!leoSheet) {
            // Fallback: Simple colored square if sprite not loaded
            this.ctx.fillStyle = '#0000FF';
            this.ctx.fillRect(p.x - 16, p.y - 32, 32, 64);
            return;
        }

        // Draw shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        this.ctx.beginPath();
        this.ctx.ellipse(p.x, p.y + 20, 12, 6, 0, 0, Math.PI * 2);
        this.ctx.fill();

        // Determine sprite coordinates based on direction and animation frame
        const spriteWidth = 32;  // Each frame is 32 pixels wide
        const spriteHeight = 64; // Each frame is 64 pixels tall

        // Calculate source X (which animation frame: 0-3)
        const sx = p.frame * spriteWidth; // frame 0-3 = sx 0, 32, 64, 96

        // Calculate source Y (which direction row)
        let sy = 0;
        switch (p.direction) {
            case 'down':
                sy = 0;   // Row 1
                break;
            case 'left':
                sy = 64;  // Row 2
                break;
            case 'right':
                sy = 128; // Row 3
                break;
            case 'up':
                sy = 192; // Row 4
                break;
        }

        // Draw the sprite (9-argument drawImage for clipping)
        this.ctx.drawImage(
            leoSheet,                              // Image source
            sx, sy, spriteWidth, spriteHeight,     // Source rectangle (clip from sprite sheet)
            p.x - 16, p.y - 32,                    // Destination position (centered on player position)
            spriteWidth, spriteHeight              // Destination size (1x scale)
        );

        // Debug info (optional - can remove later)
        if (false) { // Set to true to see debug info
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '10px Courier New';
            this.ctx.fillText(`F:${p.frame} D:${p.direction}`, p.x - 20, p.y - 40);
        }
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
        // SPRITE-BASED BATTLE RENDERING (per Betty's spec)
        let sprite = null;
        let spriteWidth = 32;
        let spriteHeight = 64;

        if (isHero) {
            // Get character sprite sheet
            const sheetMap = {
                'Leo': 'sheet_leo',
                'Eliza': 'sheet_eliza',
                'Blayde': 'sheet_blayde',
                'Serapha': 'sheet_serapha'
            };

            const sheetKey = sheetMap[character.name];
            if (sheetKey) {
                sprite = this.assetLoader.getAsset(sheetKey);
            }

            if (!sprite) {
                // Fallback: colored square based on character
                const colorMap = {
                    'Leo': '#0000FF',
                    'Eliza': '#800080',
                    'Blayde': '#FF0000',
                    'Serapha': '#FFC0CB'
                };
                this.ctx.fillStyle = colorMap[character.name] || '#888';
                this.ctx.fillRect(x - 16, y - 32, 32, 64);
            } else {
                // Draw character sprite (use first frame, down direction)
                // For battle, we use the idle frame (frame 0, down direction)
                const sx = 0;  // First frame
                const sy = 0;  // Down direction

                this.ctx.drawImage(
                    sprite,
                    sx, sy, spriteWidth, spriteHeight,
                    x - spriteWidth / 2, y - spriteHeight + 10,
                    spriteWidth, spriteHeight
                );
            }
        } else {
            // Enemy sprite
            sprite = this.assetLoader.getAsset('enemy_shadow_beast');
            spriteWidth = 64;
            spriteHeight = 64;

            if (!sprite) {
                // Fallback: purple square
                this.ctx.fillStyle = '#4B0082';
                this.ctx.fillRect(x - 32, y - 32, 64, 64);
            } else {
                this.ctx.drawImage(
                    sprite,
                    0, 0, spriteWidth, spriteHeight,
                    x - spriteWidth / 2, y - spriteHeight / 2,
                    spriteWidth, spriteHeight
                );
            }
        }

        // HP bar (kept from original - this is UI, not character rendering)
        const barWidth = 70;
        const hpPercent = character.stats.hp / character.stats.maxHp;

        // Bar border
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(x - barWidth / 2 - 2, y - 50, barWidth + 4, 10);

        // Bar background
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(x - barWidth / 2, y - 48, barWidth, 6);

        // HP fill with gradient effect
        const hpColor = hpPercent > 0.5 ? '#0f0' : hpPercent > 0.25 ? '#ff0' : '#f00';
        const hpDark = hpPercent > 0.5 ? '#0a0' : hpPercent > 0.25 ? '#cc0' : '#a00';

        for (let i = 0; i < barWidth * hpPercent; i += 2) {
            this.ctx.fillStyle = i % 4 === 0 ? hpColor : hpDark;
            this.ctx.fillRect(x - barWidth / 2 + i, y - 48, 2, 6);
        }

        // Name with shadow
        this.ctx.font = 'bold 14px Courier New';
        this.ctx.fillStyle = '#000';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(character.name, x + 1, y - 56);
        this.ctx.fillStyle = '#fff';
        this.ctx.fillText(character.name, x, y - 57);
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

        // Use event delegation to prevent memory leaks
        const handler = (e) => {
            const option = e.target.closest('.menu-option');
            if (option && option.dataset.action) {
                const action = option.dataset.action;
                this.handleBattleMenuSelection(action, character);
            }
        };

        mainActions.addEventListener('click', handler);

        // Track for cleanup
        this.battleMenuCleanup.push({
            element: mainActions,
            event: 'click',
            handler: handler
        });
    }
    
    handleBattleMenuSelection(action, character) {
        if (this.battle.isExecuting) return;

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
            this.showItemMenu(character);
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

        // Use event delegation to prevent memory leaks
        const handler = (e) => {
            const option = e.target.closest('.menu-option:not(.disabled)');
            if (option && option.dataset.ability) {
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
            }
        };

        abilityOptions.addEventListener('click', handler);

        // Track for cleanup
        this.battleMenuCleanup.push({
            element: abilityOptions,
            event: 'click',
            handler: handler
        });
    }

    showItemMenu(character) {
        document.getElementById('action-menu').classList.add('hidden');
        const itemMenu = document.getElementById('item-menu');
        const itemOptions = document.getElementById('item-options');

        itemMenu.classList.remove('hidden');

        // Get consumable items from inventory
        const items = [];
        for (const [itemId, itemData] of Object.entries(this.inventory.items)) {
            if (itemData.count > 0) {
                const itemInfo = ITEM_DATA[itemId];
                items.push({
                    id: itemId,
                    ...itemInfo,
                    count: itemData.count
                });
            }
        }

        if (items.length === 0) {
            itemOptions.innerHTML = '<div class="menu-option disabled">No items available</div>';
        } else {
            itemOptions.innerHTML = items.map(item => `
                <div class="menu-option" data-item="${item.id}">
                    ${item.name}
                    <span class="item-count">x${item.count}</span>
                </div>
            `).join('');
        }

        // Use event delegation to prevent memory leaks
        const handler = (e) => {
            const option = e.target.closest('.menu-option:not(.disabled)');
            if (option && option.dataset.item) {
                const itemId = option.dataset.item;
                const itemInfo = ITEM_DATA[itemId];

                // Determine target type based on item effect
                let targetType = 'ally'; // Most items target allies
                if (itemInfo.effect === 'revive') {
                    // Revive items need special handling (target dead allies)
                    this.selectDeadAlly(character, (target) => {
                        this.useItem(itemId, target);
                        itemMenu.classList.add('hidden');
                    });
                } else {
                    this.selectTarget(character, targetType, (target) => {
                        this.useItem(itemId, target);
                        itemMenu.classList.add('hidden');
                    });
                }
            }
        };

        itemOptions.addEventListener('click', handler);

        // Track for cleanup
        this.battleMenuCleanup.push({
            element: itemOptions,
            event: 'click',
            handler: handler
        });
    }

    useItem(itemId, target) {
        const itemInfo = ITEM_DATA[itemId];

        // Check if we have the item
        if (!this.inventory.items[itemId] || this.inventory.items[itemId].count <= 0) {
            this.battle.addLog('No items available!');
            return;
        }

        // Remove item from inventory
        this.inventory.removeItem(itemId, 1);

        // Apply item effect
        let message = '';
        switch (itemInfo.effect) {
            case 'heal':
                const healAmount = Math.min(itemInfo.value, target.stats.maxHp - target.stats.hp);
                target.stats.hp += healAmount;
                message = `${target.name} recovered ${healAmount} HP!`;
                break;

            case 'restoreMP':
                const mpAmount = Math.min(itemInfo.value, target.stats.maxMp - target.stats.mp);
                target.stats.mp += mpAmount;
                message = `${target.name} recovered ${mpAmount} MP!`;
                break;

            case 'curePoison':
                if (target.hasStatus('POISON')) {
                    target.removeStatus('POISON');
                    message = `${target.name} was cured of POISON!`;
                } else {
                    message = `${target.name} was not poisoned.`;
                }
                break;

            case 'revive':
                if (target.stats.hp <= 0) {
                    target.stats.hp = 1;
                    message = `${target.name} was revived!`;
                } else {
                    message = `${target.name} is not knocked out.`;
                }
                break;

            default:
                message = `Used ${itemInfo.name} on ${target.name}!`;
        }

        this.battle.addLog(message);

        // Execute action through battle system
        this.battle.executePlayerAction({ action: 'item', itemId: itemId, target: target });
    }

    selectDeadAlly(character, callback) {
        const targetMenu = document.getElementById('target-menu');
        const targetOptions = document.getElementById('target-options');

        document.getElementById('item-menu').classList.add('hidden');
        targetMenu.classList.remove('hidden');

        // Get dead party members
        const deadAllies = this.party.filter(m => m.stats.hp <= 0);

        if (deadAllies.length === 0) {
            targetOptions.innerHTML = '<div class="menu-option disabled">No knocked out allies</div>';
        } else {
            targetOptions.innerHTML = deadAllies.map(target =>
                `<div class="menu-option" data-target="${target.name}">${target.name}</div>`
            ).join('');
        }

        // Use event delegation to prevent memory leaks
        const handler = (e) => {
            const option = e.target.closest('.menu-option:not(.disabled)');
            if (option && option.dataset.target) {
                const targetName = option.dataset.target;
                const target = this.party.find(t => t.name === targetName);
                targetMenu.classList.add('hidden');
                callback(target);
            }
        };

        targetOptions.addEventListener('click', handler);

        // Track for cleanup
        this.battleMenuCleanup.push({
            element: targetOptions,
            event: 'click',
            handler: handler
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

        // Use event delegation to prevent memory leaks
        const handler = (e) => {
            const option = e.target.closest('.menu-option');
            if (option && option.dataset.target) {
                const targetName = option.dataset.target;
                const target = this.party.find(m => m.name === targetName);

                // Now select action for the overridden character
                this.selectOverrideAction(character, target);
                targetMenu.classList.add('hidden');
            }
        };

        targetOptions.addEventListener('click', handler);

        // Track for cleanup
        this.battleMenuCleanup.push({
            element: targetOptions,
            event: 'click',
            handler: handler
        });
    }
    
    selectOverrideAction(overrider, target) {
        // Hide other menus
        document.getElementById('action-menu').classList.add('hidden');
        document.getElementById('ability-menu').classList.add('hidden');
        document.getElementById('item-menu').classList.add('hidden');

        // Show override action menu
        const overrideMenu = document.getElementById('override-action-menu');
        const overrideOptions = document.getElementById('override-action-options');
        overrideMenu.classList.remove('hidden');

        // Build action options
        const actions = [
            { id: 'attack', label: 'Attack' },
            { id: 'defend', label: 'Defend' }
        ];

        // Add ability option if target has abilities
        if (target.abilities && target.abilities.length > 0) {
            actions.push({ id: 'ability', label: 'Abilities' });
        }

        // Render options
        overrideOptions.innerHTML = actions.map(action =>
            `<div class="menu-option" data-override-action="${action.id}">${action.label}</div>`
        ).join('');

        // Use event delegation for memory safety
        const handler = (e) => {
            const option = e.target.closest('.menu-option');
            if (option && option.dataset.overrideAction) {
                const actionType = option.dataset.overrideAction;
                this.handleOverrideActionSelection(overrider, target, actionType);
            }
        };

        overrideOptions.addEventListener('click', handler);

        // Track for cleanup
        this.battleMenuCleanup.push({
            element: overrideOptions,
            event: 'click',
            handler: handler
        });
    }

    handleOverrideActionSelection(overrider, target, actionType) {
        // Hide override action menu
        document.getElementById('override-action-menu').classList.add('hidden');

        switch (actionType) {
            case 'attack':
                // Show enemy target selection
                this.selectTarget(target, 'enemy', (selectedTarget) => {
                    this.executeOverrideAction(overrider, target, {
                        action: 'attack',
                        target: selectedTarget
                    });
                });
                break;

            case 'defend':
                // Defend needs no target
                this.executeOverrideAction(overrider, target, {
                    action: 'defend'
                });
                break;

            case 'ability':
                // Show ability selection for the target character
                this.showOverrideAbilityMenu(overrider, target);
                break;
        }
    }

    showOverrideAbilityMenu(overrider, target) {
        const abilityMenu = document.getElementById('ability-menu');
        const abilityOptions = document.getElementById('ability-options');
        abilityMenu.classList.remove('hidden');

        // Build ability list for the target character
        const abilities = target.abilities.map(abilityId => {
            const ability = ABILITIES[abilityId];
            if (!ability) return null;

            const canUse = target.stats.mp >= ability.cost;
            return {
                id: abilityId,
                name: ability.name,
                cost: ability.cost,
                canUse: canUse
            };
        }).filter(a => a !== null);

        // Render abilities
        abilityOptions.innerHTML = abilities.map(ability =>
            `<div class="menu-option ${ability.canUse ? '' : 'disabled'}" data-ability="${ability.id}">
                ${ability.name}
                <span class="mp-cost">MP: ${ability.cost}</span>
            </div>`
        ).join('');

        // Use event delegation
        const handler = (e) => {
            const option = e.target.closest('.menu-option');
            if (option && option.dataset.ability && !option.classList.contains('disabled')) {
                const abilityId = option.dataset.ability;
                const ability = ABILITIES[abilityId];

                // Hide ability menu and show target selection
                abilityMenu.classList.add('hidden');

                // Determine target type based on ability
                const targetType = ability.targetType || 'enemy';
                this.selectTarget(target, targetType, (selectedTarget) => {
                    this.executeOverrideAction(overrider, target, {
                        action: 'ability',
                        ability: abilityId,
                        target: selectedTarget
                    });
                });
            }
        };

        abilityOptions.addEventListener('click', handler);

        // Track for cleanup
        this.battleMenuCleanup.push({
            element: abilityOptions,
            event: 'click',
            handler: handler
        });
    }

    executeOverrideAction(overrider, target, overrideAction) {
        // Execute the override action
        this.battle.executePlayerAction({
            action: 'override',
            target: target,
            overrideAction: overrideAction
        });
    }
    
    selectTarget(character, targetType, callback) {
        const targetMenu = document.getElementById('target-menu');
        const targetOptions = document.getElementById('target-options');
        
        document.getElementById('ability-menu').classList.add('hidden');
        targetMenu.classList.remove('hidden');
        
        let targets;
        if (targetType === 'enemy') {
            targets = this.battle ? this.battle.enemies.filter(e => e.stats.hp > 0) : [];
        } else if (targetType === 'ally') {
            targets = this.party.filter(m => m.stats.hp > 0);
        }
        
        if (targets.length === 0) {
            targetMenu.classList.add('hidden');
            return;
        }

        targetOptions.innerHTML = targets.map(target =>
            `<div class="menu-option" data-target="${target.name}">${target.name}</div>`
        ).join('');

        // Use event delegation to prevent memory leaks
        const handler = (e) => {
            const option = e.target.closest('.menu-option');
            if (option && option.dataset.target) {
                const targetName = option.dataset.target;
                const target = targets.find(t => t.name === targetName);
                targetMenu.classList.add('hidden');
                callback(target);
            }
        };

        targetOptions.addEventListener('click', handler);

        // Track for cleanup
        this.battleMenuCleanup.push({
            element: targetOptions,
            event: 'click',
            handler: handler
        });
    }
    
    endBattle(result) {
        // Clean up all battle menu event listeners to prevent memory leaks
        this.cleanupBattleMenus();

        this.state = 'OVERWORLD';
        document.getElementById('battle-ui').classList.add('hidden');
        this.battle = null;

        if (result === 'victory') {
            this.showMessage('Victory! You gained experience!');
            // Auto-save after battle victory
            setTimeout(() => {
                this.saveGame();
            }, 500);
        } else {
            this.showMessage('Defeated... Game Over. Press F5 to restart.');
        }
    }

    cleanupBattleMenus() {
        // Remove all tracked event listeners to prevent memory leaks
        this.battleMenuCleanup.forEach(({ element, event, handler }) => {
            element.removeEventListener(event, handler);
        });

        // Clear the cleanup array
        this.battleMenuCleanup = [];

        console.log('[Game] Battle menu event listeners cleaned up');
    }
    
    openMenu() {
        try {
            this.state = 'MENU';
            const menuElement = document.getElementById('main-menu');
            menuElement.classList.remove('hidden');

            // Setup menu options
            const menuOptions = menuElement.querySelectorAll('.menu-option');
            menuOptions.forEach(option => {
                option.onclick = () => this.handleMenuSelection(option.dataset.menu);
            });

            // Show default view (party status)
            this.showMenuParty();
        } catch (error) {
            console.error('[Menu] Error opening menu:', error);
            this.showMessage('Error opening menu! Please try again.');
        }
    }

    handleMenuSelection(menuType) {
        try {
            switch (menuType) {
                case 'party':
                    this.showMenuParty();
                    break;
                case 'equipment':
                    this.showMenuEquipment();
                    break;
                case 'inventory':
                    this.showMenuInventory();
                    break;
                case 'save':
                    this.showMenuSave();
                    break;
                case 'close':
                    this.closeMenu();
                    break;
            }
        } catch (error) {
            console.error('[Menu] Error handling menu selection:', error);
            this.showMessage('Menu error! Closing menu.');
            this.closeMenu();
        }
    }
    
    showMenuParty() {
        const details = document.getElementById('menu-details');
        let html = '<h3 style="color: #ffd700; margin-bottom: 15px;">Party Status</h3>';
        
        this.party.forEach(member => {
            const hpPercent = (member.stats.hp / member.stats.maxHp) * 100;
            const mpPercent = (member.stats.mp / member.stats.maxMp) * 100;
            const expPercent = (member.exp / member.expToNext) * 100;
            
            html += `
                <div style="background: rgba(0,0,50,0.5); border: 2px solid #4169e1; border-radius: 4px; padding: 12px; margin-bottom: 12px;">
                    <div style="color: #ffd700; font-weight: bold; font-size: 18px; margin-bottom: 8px;">
                        ${member.name} - Level ${member.level} [${member.controlType}]
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;">
                        <div>
                            <div>HP: ${member.stats.hp}/${member.stats.maxHp}</div>
                            <div class="stat-bar" style="width: 120px; height: 8px; background: #222; border: 1px solid #fff; margin-top: 4px;">
                                <div style="width: ${hpPercent}%; height: 100%; background: linear-gradient(to right, #0f0, #0a0);"></div>
                            </div>
                        </div>
                        <div>
                            <div>MP: ${member.stats.mp}/${member.stats.maxMp}</div>
                            <div class="stat-bar" style="width: 120px; height: 8px; background: #222; border: 1px solid #fff; margin-top: 4px;">
                                <div style="width: ${mpPercent}%; height: 100%; background: linear-gradient(to right, #00f, #00a);"></div>
                            </div>
                        </div>
                    </div>
                    <div style="font-size: 12px; color: #ccc;">
                        STR: ${member.stats.STR} | DEF: ${member.stats.DEF} | INT: ${member.stats.INT} | MND: ${member.stats.MND} | SPD: ${member.stats.SPD}
                    </div>
                    <div style="margin-top: 8px; font-size: 12px;">
                        EXP: ${member.exp}/${member.expToNext}
                        <div class="stat-bar" style="width: 200px; height: 6px; background: #222; border: 1px solid #ffd700; margin-top: 4px;">
                            <div style="width: ${expPercent}%; height: 100%; background: #ffd700;"></div>
                        </div>
                    </div>
                    <div style="margin-top: 8px; font-size: 12px; color: #ffaa00;">
                        Equipment: ${member.equipment.weapon?.name || 'None'} | ${member.equipment.armor?.name || 'None'} | ${member.equipment.accessory?.name || 'None'}
                    </div>
                </div>
            `;
        });
        
        html += `
            <div style="margin-top: 20px; padding: 10px; background: rgba(255,215,0,0.1); border: 2px solid #ffd700; border-radius: 4px;">
                <div style="color: #ffd700;">Gil: ${this.gil}</div>
                <div style="color: #ffd700; margin-top: 4px;">Time: ${this.getPlayTimeString()}</div>
            </div>
        `;
        
        details.innerHTML = html;
    }
    
    showMenuEquipment() {
        const details = document.getElementById('menu-details');
        let html = '<h3 style="color: #ffd700; margin-bottom: 15px;">Equipment</h3>';
        html += '<p style="color: #ccc; margin-bottom: 15px;">Select a character to change equipment:</p>';
        
        this.party.forEach((member, index) => {
            html += `
                <div class="menu-option" onclick="game.selectCharacterForEquipment(${index})" style="margin-bottom: 8px;">
                    ${member.name} - Lv${member.level}
                </div>
            `;
        });
        
        details.innerHTML = html;
    }
    
    showMenuInventory() {
        const details = document.getElementById('menu-details');
        let html = '<h3 style="color: #ffd700; margin-bottom: 15px;">Inventory</h3>';
        html += `<p style="color: #ccc; margin-bottom: 10px;">Items: ${this.inventory.getTotalItemCount()}/${this.inventory.maxSlots}</p>`;
        
        html += '<h4 style="color: #4169e1; margin: 15px 0 10px;">Consumables</h4>';
        for (const [id, item] of Object.entries(this.inventory.items)) {
            html += `
                <div class="inventory-item">
                    <div class="item-name">${item.name} <span class="item-quantity">x${item.count}</span></div>
                    <div class="item-description">${item.description}</div>
                </div>
            `;
        }
        
        html += '<h4 style="color: #4169e1; margin: 15px 0 10px;">Equipment</h4>';
        const equipCount = Object.keys(this.inventory.equipment).length;
        if (equipCount === 0) {
            html += '<p style="color: #888; font-style: italic;">No equipment in inventory</p>';
        } else {
            for (const [id, equip] of Object.entries(this.inventory.equipment)) {
                html += `
                    <div class="inventory-item">
                        <div class="item-name">${equip.name} <span class="item-quantity">x${equip.count}</span></div>
                        <div class="item-description">${equip.description}</div>
                    </div>
                `;
            }
        }
        
        details.innerHTML = html;
    }
    
    selectCharacterForEquipment(index) {
        const member = this.party[index];
        const details = document.getElementById('menu-details');
        
        let html = `<h3 style="color: #ffd700; margin-bottom: 15px;">${member.name}'s Equipment</h3>`;
        html += '<p style="color: #888; font-size: 12px; margin-bottom: 15px;">Note: No stat comparisons shown (as per GDD)</p>';
        
        // Show equipment slots
        const slots = ['weapon', 'armor', 'accessory'];
        slots.forEach(slot => {
            const equipped = member.equipment[slot];
            html += `
                <div class="equipment-slot">
                    <div class="equipment-slot-name">${slot.toUpperCase()}</div>
                    <div class="equipment-item ${equipped ? '' : 'empty'}">
                        ${equipped ? equipped.name : 'Empty'}
                    </div>
                </div>
            `;
        });
        
        html += '<div class="menu-option" onclick="game.showMenuEquipment()" style="margin-top: 20px;">← Back</div>';
        details.innerHTML = html;
    }
    
    getPlayTimeString() {
        const totalSeconds = Math.floor((Date.now() - this.startTime) / 1000) + this.playTime;
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    showMenuSave() {
        const details = document.getElementById('menu-details');
        let html = '<h3 style="color: #ffd700; margin-bottom: 15px;">Save Data</h3>';

        // Check if save data exists
        const hasSave = this.saveSystem.hasSaveData();
        const saveInfo = this.saveSystem.getSaveInfo();

        if (hasSave && saveInfo) {
            const date = new Date(saveInfo.timestamp);
            const hours = Math.floor(saveInfo.playTime / 3600);
            const minutes = Math.floor((saveInfo.playTime % 3600) / 60);

            html += `
                <div style="background: rgba(0,0,50,0.5); border: 2px solid #4169e1; border-radius: 4px; padding: 12px; margin-bottom: 15px;">
                    <div style="color: #ffd700; font-weight: bold; margin-bottom: 8px;">Current Save File</div>
                    <div style="font-size: 14px; color: #ccc;">
                        <div>Story Phase: ${saveInfo.storyPhase}</div>
                        <div>Party Size: ${saveInfo.partySize}</div>
                        <div>Play Time: ${hours}h ${minutes}m</div>
                        <div>Saved: ${date.toLocaleString()}</div>
                    </div>
                </div>
            `;
        } else {
            html += `
                <div style="background: rgba(50,0,0,0.5); border: 2px solid #8b0000; border-radius: 4px; padding: 12px; margin-bottom: 15px;">
                    <div style="color: #ff6666; font-style: italic;">No save data found</div>
                </div>
            `;
        }

        html += `
            <div class="menu-option" data-save-action="save" style="margin-bottom: 8px;">
                Save Game
            </div>
        `;

        if (hasSave) {
            html += `
                <div class="menu-option" data-save-action="load" style="margin-bottom: 8px;">
                    Load Game
                </div>
                <div class="menu-option" data-save-action="delete" style="margin-bottom: 8px; border-color: #8b0000;">
                    Delete Save Data
                </div>
            `;
        }

        details.innerHTML = html;

        // Use event delegation for save menu options
        const handleSaveAction = (e) => {
            const option = e.target.closest('.menu-option');
            if (option && option.dataset.saveAction) {
                const action = option.dataset.saveAction;
                switch (action) {
                    case 'save':
                        this.performSave();
                        break;
                    case 'load':
                        this.performLoad();
                        break;
                    case 'delete':
                        this.performDeleteSave();
                        break;
                }
            }
        };

        // Remove previous listener if exists
        details.removeEventListener('click', this._saveMenuHandler);

        // Store handler reference for cleanup
        this._saveMenuHandler = handleSaveAction;
        details.addEventListener('click', handleSaveAction);
    }

    performSave() {
        const success = this.saveGame();
        if (success) {
            this.showMessage('Game saved successfully!');
            // Refresh the save menu to show updated info
            this.showMenuSave();
        } else {
            this.showMessage('Failed to save game!');
        }
    }

    performLoad() {
        const confirmed = confirm('Load saved game? Any unsaved progress will be lost.');
        if (confirmed) {
            const success = this.loadGame();
            if (success) {
                this.closeMenu();
                this.showMessage('Game loaded successfully!');
            } else {
                this.showMessage('Failed to load game!');
            }
        }
    }

    performDeleteSave() {
        const confirmed = confirm('Delete save data? This cannot be undone!');
        if (confirmed) {
            const success = this.saveSystem.deleteSave();
            if (success) {
                this.showMessage('Save data deleted.');
                this.showMenuSave(); // Refresh menu
            } else {
                this.showMessage('Failed to delete save data!');
            }
        }
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

    // ===== ERROR HANDLING SYSTEM =====

    handleCriticalError(error, context) {
        // Log error details
        this.logError(error, context);

        // Show user-friendly error message
        this.showErrorUI(error, context);

        // Attempt recovery if possible
        this.attemptErrorRecovery(context);
    }

    logError(error, context) {
        // Initialize error log if not exists
        if (!this.errorLog) {
            this.errorLog = [];
        }

        const errorEntry = {
            timestamp: new Date().toISOString(),
            context: context,
            message: error.message,
            stack: error.stack,
            state: this.state,
            party: this.party ? this.party.map(m => ({ name: m.name, hp: m.stats.hp })) : null
        };

        this.errorLog.push(errorEntry);

        // Keep only last 50 errors
        if (this.errorLog.length > 50) {
            this.errorLog.shift();
        }

        // Log to console with formatting
        console.group(`[ERROR] ${context}`);
        console.error('Message:', error.message);
        console.error('Stack:', error.stack);
        console.error('Game State:', this.state);
        console.groupEnd();

        // Store in localStorage for debugging
        try {
            localStorage.setItem('genericJRPG_errorLog', JSON.stringify(this.errorLog));
        } catch (e) {
            console.warn('Could not save error log to localStorage');
        }
    }

    showErrorUI(error, context) {
        // Create error overlay if it doesn't exist
        let errorOverlay = document.getElementById('error-overlay');
        if (!errorOverlay) {
            errorOverlay = document.createElement('div');
            errorOverlay.id = 'error-overlay';
            errorOverlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.9);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                font-family: 'Courier New', monospace;
            `;
            document.body.appendChild(errorOverlay);
        }

        errorOverlay.innerHTML = `
            <div style="background: #300; border: 3px solid #f00; border-radius: 8px; padding: 30px; max-width: 600px; color: #fff;">
                <h2 style="color: #f00; margin-top: 0;">⚠️ Critical Error</h2>
                <p style="color: #ff6666;"><strong>Context:</strong> ${context}</p>
                <p style="color: #ff9999;"><strong>Message:</strong> ${error.message}</p>
                <div style="margin-top: 20px; padding: 15px; background: rgba(0,0,0,0.5); border: 1px solid #666; border-radius: 4px;">
                    <p style="margin: 0 0 10px 0; color: #ccc;"><strong>Recovery Options:</strong></p>
                    <button onclick="location.reload()" style="
                        background: #c00;
                        color: #fff;
                        border: none;
                        padding: 10px 20px;
                        margin-right: 10px;
                        cursor: pointer;
                        font-family: 'Courier New', monospace;
                        font-size: 14px;
                        border-radius: 4px;
                    ">Reload Game</button>
                    <button onclick="document.getElementById('error-overlay').style.display='none'" style="
                        background: #666;
                        color: #fff;
                        border: none;
                        padding: 10px 20px;
                        cursor: pointer;
                        font-family: 'Courier New', monospace;
                        font-size: 14px;
                        border-radius: 4px;
                    ">Dismiss</button>
                </div>
                <p style="font-size: 12px; color: #999; margin-top: 15px;">
                    Error details have been logged to console (F12).
                </p>
            </div>
        `;

        errorOverlay.style.display = 'flex';
    }

    attemptErrorRecovery(context) {
        // Attempt context-specific recovery
        console.log(`[Recovery] Attempting recovery for: ${context}`);

        if (context === 'Game Loop') {
            // Game loop errors are non-fatal, continue running
            console.log('[Recovery] Game loop will continue');
        } else if (context.includes('Battle')) {
            // Battle errors - try to end battle safely
            try {
                if (this.battle) {
                    this.battle = null;
                    this.state = 'OVERWORLD';
                    document.getElementById('battle-ui').classList.add('hidden');
                    console.log('[Recovery] Battle safely terminated');
                }
            } catch (e) {
                console.error('[Recovery] Could not recover from battle error:', e);
            }
        } else if (context.includes('Menu')) {
            // Menu errors - close menu and return to overworld
            try {
                this.state = 'OVERWORLD';
                document.getElementById('main-menu').classList.add('hidden');
                console.log('[Recovery] Menu safely closed');
            } catch (e) {
                console.error('[Recovery] Could not recover from menu error:', e);
            }
        }
    }

    getErrorLog() {
        return this.errorLog || [];
    }

    clearErrorLog() {
        this.errorLog = [];
        try {
            localStorage.removeItem('genericJRPG_errorLog');
        } catch (e) {
            console.warn('Could not clear error log from localStorage');
        }
    }
}

// ===== START GAME =====
let game; // Global game instance
window.addEventListener('load', () => {
    game = new Game();
});
