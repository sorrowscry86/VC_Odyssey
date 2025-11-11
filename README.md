# VC_Odyssey
A Vibe Coding Experiment - Generic JRPG Proof of Concept

## Overview

**Generic JRPG** is a Super Nintendo era 16-bit JRPG style game demo that explores a unique gameplay concept: dealing with intentionally flawed AI party members. This proof-of-concept implements the core systems defined in Game Design Document v1.1 and UI Systems Specification v1.0.

## Game Concept

The game features a 4-member party where two characters are AI-controlled with deliberately poor decision-making, and two are player-controlled. The core gameplay challenge revolves around using the **Override** command to manually control the AI characters and compensate for their mistakes.

### The Party

1. **Blayde (AI-Controlled "Hero")**
   - Archetype: Tragic Protagonist
   - High STR, Low INT
   - AI Behavior: Uses flashy abilities at wrong times, never uses healing items
   - Special: "Headstrong" passive - 10% chance to ignore Override commands

2. **Serapha (AI-Controlled "Healer")**
   - Archetype: Healer/Love Interest  
   - High MND/MP, Low HP/STR
   - AI Behavior: Heals characters with 95% HP while others are at 10%, wastes MP inefficiently
   - Special: "Prayer" passive - Sometimes wastes turns praying

3. **Leo (Player-Controlled "Realist")**
   - Archetype: The Cautious Player
   - Balanced stats with high DEF
   - Special: **Override** command - Manually control an AI ally's next action

4. **Eliza (Player-Controlled "Strategist")**
   - Archetype: The Knowledgeable Player
   - High INT/MND
   - Special: **Scan** ability - Reveals enemy HP, weakness, and drops

## Features Implemented

### Core Systems
- ✅ Turn-based battle system with SPD-based turn order
- ✅ Character stats (HP, MP, STR, DEF, INT, MND, SPD)
- ✅ Level-up system with automatic stat increases
- ✅ Status effects (POISON, SLEEP, PARALYSIS, PROTECT, HASTE, REGEN)
- ✅ AI logic for both ally and enemy characters
- ✅ Experience and leveling system

### Battle System
- ✅ Player and enemy rendering with HP bars
- ✅ Battle log showing combat messages
- ✅ Target selection for attacks and abilities
- ✅ Victory/defeat conditions with EXP rewards
- ✅ Abilities: Fire Slash, Heal, CurePoison, Protect, Scan, Override

### Menu Systems
- ✅ Pause menu (Press 'M' in overworld)
- ✅ Party status view with full stats and equipment
- ✅ Inventory management (consumables and equipment)
- ✅ Equipment view for all characters
- ✅ Gil (money) tracking
- ✅ Play time tracking

### Overworld
- ✅ Pixel art style grass field environment
- ✅ Player movement with arrow keys
- ✅ Random battle encounters
- ✅ Party status HUD

## How to Play

### Controls
- **Arrow Keys** - Move in overworld
- **Enter** - Confirm selections, advance dialogue
- **M** - Open pause menu
- **Escape** - Close menu
- **Mouse** - Click menu options and battle commands

### Getting Started
1. Open `index.html` in a web browser
2. Press Enter at the title screen
3. Move around the overworld with arrow keys
4. Random encounters will trigger battles
5. Press M to open the menu and view party status

### Battle Controls
- Select actions from the battle menu
- For player-controlled characters (Leo/Eliza):
  - **Attack** - Physical attack on enemy
  - **Override** - Control an AI ally's next action  
  - **Ability** - Use special abilities (costs MP)
  - **Item** - Use items from inventory (not yet implemented in battle)
  - **Defend** - Reduce incoming damage
- AI characters (Blayde/Serapha) act automatically with their flawed logic

### Menu System
- **Party** - View detailed stats, equipment, EXP, Gil, and time played
- **Equipment** - Manage character equipment (view only in current build)
- **Inventory** - View consumable items and equipment pieces
- **Close** - Return to overworld

## Technical Details

### Technologies
- HTML5 Canvas for rendering
- Vanilla JavaScript (no frameworks)
- CSS3 for UI styling
- Pixel art aesthetic with retro color palette

### Architecture
- Object-oriented design with ES6 classes
- Character class with stats, equipment, and status effects
- BattleSystem class managing turn order and combat
- Inventory class for item management
- Game class coordinating all systems

### Data Structures
The game is designed with flexibility for future story/script integration:
- Equipment and item data stored in constant objects
- Shop data ready for town implementation
- Character definitions support easy expansion
- Status effects system supports custom effects

## Game Design Documents

This implementation follows:
- **Game Design Document v1.1** - Character definitions, stats, abilities, and core systems
- **UI & Interstitial Systems Specification v1.0** - Menu systems, shops, and save points

## Roadmap

### Planned Features
- Town NPCs (Inn, Item Shop, Equipment Shop)
- Buy/Sell shop mechanics (50% sell price)
- Save Point system with healing
- Full Override menu for controlling AI actions
- Item usage in overworld menu
- Story/script integration
- Additional dungeons and boss battles
- More enemy types
- Complete ability sets for all characters

### Future Expansion
The game architecture supports easy integration of:
- Additional party members
- New locations and dungeons
- Boss encounters
- Side quests
- Equipment progression
- Magic system expansion

## Development Notes

This is a proof-of-concept demo showcasing:
- Classic JRPG mechanics with a unique twist
- Intentional AI "stupidity" as a core gameplay mechanic
- Meta-commentary on JRPG tropes
- 16-bit era aesthetic and design philosophy

The game is designed to be expanded with narrative content while maintaining the core mechanical systems already in place.

## Credits

Created as part of the VC Odyssey project - A Vibe Coding Experiment

Implements specifications from:
- Game Design Document v1.1 (Character Definitions, Systems)
- UI & Interstitial Systems Specification v1.0 (Menus, Shops, Save Points)

## License

This is an experimental project created for demonstration purposes.
