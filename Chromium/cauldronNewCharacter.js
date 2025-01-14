// chromeium cauldronNewCharacter.js

setTimeout(function () {
    const nameInput = document.getElementById('name');
    const hitPoints = document.getElementById('hitpoints');
    const armourClass = document.getElementById('armor_class');
    const initiative = document.getElementById('initiative');
    const thirdRadioButton = document.querySelector('.radio-group input[value="url"]');
    const sheetURL = document.querySelector('.sheet_url');
    const radioButtons = document.querySelectorAll('.radio-group input[name="sheet"]');
    const urlInput = document.getElementById('sheet_url');

    //add button to the button where cancel and save are
    const newButton = document.createElement('button');
    newButton.textContent = 'Auto Fill';
    newButton.classList.add('btn', 'btn-default');
    const btnGroup = document.querySelector('.btn-group'); 
    btnGroup.appendChild(newButton);

    //checkes the url remote file radio button
    if (thirdRadioButton) {
        thirdRadioButton.checked = true;
        sheetURL.style = "";
    }

    //shows the correct div for the correct radio button checked
    radioButtons.forEach(function (radioButton) {
        radioButton.addEventListener('change', function () {
            if (radioButton.value === 'url' && radioButton.checked) {
                sheetURL.style.display = 'block';
            } else {
                sheetURL.style.display = 'none';
            }
        });
    });

    const initialCheckedRadioButton = document.querySelector('.radio-group input[name="sheet"]:checked');
    if (initialCheckedRadioButton && initialCheckedRadioButton.value === 'url') {
        sheetURL.style.display = 'block';
    } else {
        sheetURL.style.display = 'none';
    }

    //add the url to the url input element
    chrome.storage.local.get('characterData', function (result) {
        const characterData = result.characterData;
        urlInput.value = characterData.readonlyUrl;
    })

    if (btnGroup) {
        //adds a button to fill in all the inputs
        newButton.addEventListener('click', function (event) {
            event.preventDefault();
            addName(nameInput);
            addHP(hitPoints);
            addAC(armourClass);
            addInitiative(initiative);
            console.log("Name: ", nameInput.value);
            console.log("HP: ", hitPoints.value);
            console.log("AC: ", armourClass.value);
            console.log("Initiative: ", initiative.value);
        });
    }
    if (nameInput) {
        const addNameButton = createButton('Add Character Name');
        addNameButton.classList.add('btn', 'btn-default');
        nameInput.after(addNameButton);

        //splits the text below from the button avoiding it from moving to the right of the button
        const lineBreak1 = document.createElement('br');
        const lineBreak2 = document.createElement('br');
        addNameButton.after(lineBreak1);
        addNameButton.after(lineBreak2);
        
        addNameButton.addEventListener('click', function (event) {
            event.preventDefault();
            addName(nameInput);
        });
        
    }
    if (hitPoints) {
        const addHitPointsButton = createButton('Add Hit Points');
        hitPoints.after(addHitPointsButton);
        addHitPointsButton.classList.add('btn', 'btn-default');

        const lineBreak1 = document.createElement('br');
        const lineBreak2 = document.createElement('br');
        addHitPointsButton.after(lineBreak1);
        addHitPointsButton.after(lineBreak2);
        addHitPointsButton.addEventListener('click', function (event) {
            event.preventDefault();
            addHP(hitPoints);
        });
        hitPoints.after(addHitPointsButton);
    }
    if (armourClass) {
        const addArmourClass = createButton('Add Armour Class');
        addArmourClass.classList.add('btn', 'btn-default');
        armourClass.after(addArmourClass);

        const lineBreak1 = document.createElement('br');
        const lineBreak2 = document.createElement('br');
        armourClass.after(lineBreak1);
        armourClass.after(lineBreak2);
        addArmourClass.addEventListener('click', function (event) {
            event.preventDefault();
            addAC(armourClass);
            
        });
        armourClass.after(addArmourClass);
    }
    if (initiative) {
        const addInitiativeButton = createButton('Add Initiative');
        addInitiativeButton.classList.add('btn', 'btn-default');
        initiative.after(addInitiativeButton);

        const lineBreak1 = document.createElement('br');
        const lineBreak2 = document.createElement('br');
        initiative.after(lineBreak1);
        initiative.after(lineBreak2);
        addInitiativeButton.addEventListener('click', function (event) {
            event.preventDefault();
            addInitiative(initiative);
        });
        initiative.after(addInitiativeButton);
    }
    else {
        console.log('Name input not found.');
    }
}, 0);

function createButton(text) {
    const button = document.createElement('button');
    button.textContent = text;
    button.classList.add('custom-button');
    return button;
}

function calculateLevel(xp) {
    const xpThresholds = [0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000];

    for (let i = 0; i < xpThresholds.length; i++) {
        if (xp < xpThresholds[i]) {
                return i;
        }
    }

    // If the XP is higher than all values in the table, return the last level
    return xpThresholds.length;
}

function addName(nameInput) {
    chrome.storage.local.get('characterData', function (result) {
        const characterData = result.characterData;
        if (characterData) {
            nameInput.value = characterData.name || '';
            console.log(characterData);
        } else {
            console.log('Character data not found in storage');
        }
    });
}

function addHP(hitPoints) {
    chrome.storage.local.get('characterData', function (result) {
        const characterData = result.characterData;
        if (characterData) {
            const stats = getCharacterStats(characterData);

            const conMod = Math.floor((stats.totalConstitution - 10) / 2); // Constitution modifier
            const level = characterData.classes[0].level;
            let totalHitPoints = characterData.baseHitPoints + (conMod * level);

            // Adding hit points from modifiers
            for (let modifier of characterData.modifiers.class) {
                if (modifier.subType === "hit-points-per-level") {
                    totalHitPoints += parseInt(modifier.value) * level;
                }
            }

            // Additional hit points for specific class features
            if (characterData.classes[0].definition.name === "Sorcerer" && characterData.classes[0].subclassDefinition.name === "Draconic Bloodline") {
                totalHitPoints += level; // Draconic Bloodline feature adds 1 HP per level
            }
            
            hitPoints.value = totalHitPoints;
        } else {
            console.log('Character Data not found in storage');
        }
    });
}


function addAC(armourClass) {
    chrome.storage.local.get('characterData', function (result) {
        const characterData = result.characterData;
        const stats = getCharacterStats(characterData);

        let totalArmourClass = 0;
        const inventory = characterData.inventory;

        let hasEquippedArmor = false;
        let shieldAC = 0;

        // Loop through inventory to calculate AC from equipped armor and shields
        for (let item of inventory) {
            if (item.definition.armorClass != null) {
                if (item.equipped) {
                    const armourAC = checkArmour(item.definition.name, stats, item, characterData);
                    if (item.definition.name === "Shield") {
                        shieldAC = 2;  // Store shield AC separately
                    } else {
                        totalArmourClass += armourAC;
                        hasEquippedArmor = true;
                    }
                }
            }
        }

        // If no armor is equipped, calculate default AC
        if (!hasEquippedArmor) {
            const defaultAC = 10 + Math.floor((stats.totalDexterity - 10) / 2);
            totalArmourClass = defaultAC;
        }

        // Apply shield AC if applicable
        totalArmourClass += shieldAC;

        // Apply class-based AC bonuses
        const characterClass = characterData.classes[0].definition.name;
        const subclass = characterData.classes[0].subclassDefinition ? characterData.classes[0].subclassDefinition.name : "";

        if (characterClass === "Sorcerer" && subclass === "Draconic Bloodline") {
            const sorcererAC = 13 + Math.floor((stats.totalDexterity - 10) / 2);
            totalArmourClass = Math.max(totalArmourClass, sorcererAC);
        } else if (characterClass === "Monk") {
            const dexStat = Math.floor((characterData.stats[1].value - 10) / 2);
            const wisStat = Math.floor((characterData.stats[4].value - 10) / 2);
            const monkAC = 10 + dexStat + wisStat;
            totalArmourClass = Math.max(totalArmourClass, monkAC);
        } else if (characterClass === "Barbarian") {
            const dexStat = Math.floor((characterData.stats[1].value - 10) / 2);
            const conStat = Math.floor((characterData.stats[2].value - 10) / 2);
            const barbarianAC = 10 + dexStat + conStat;
            totalArmourClass = Math.max(totalArmourClass, barbarianAC);
        }

        // Apply race-based AC bonuses
        const raceBaseName = characterData.race.baseName;
        if (raceBaseName === "Lizardfolk") {
            const dexStat = Math.floor((characterData.stats[1].value - 10) / 2);
            const lizardfolkAC = 13 + dexStat;
            totalArmourClass = Math.max(totalArmourClass, lizardfolkAC);
        } else if (raceBaseName === "Locathah") {
            const dexStat = Math.floor((characterData.stats[1].value - 10) / 2);
            const locathahAC = 12 + dexStat;
            totalArmourClass = Math.max(totalArmourClass, locathahAC);
        } else if (raceBaseName === "Loxodon" || raceBaseName === "Tortle") {
            const dexStat = Math.floor((characterData.stats[1].value - 10) / 2);
            const loxodonTortleAC = 13 + dexStat;
            totalArmourClass = Math.max(totalArmourClass, loxodonTortleAC);
        }

        // Check for custom shield items
        for (let item of characterData.customItems) {
            try {
                if (item.name.toLowerCase().includes("shield") || item.notes.toLowerCase().includes("shield") || item.description.toLowerCase().includes("shield")) {
                    totalArmourClass += 2;
                }
            } catch (TypeError) {}
        }

        // Check for the Armoured Bonus for a fighting style
        for (let option of characterData.options.class) {
            if (option.definition.name === "Defense") {
                totalArmourClass += 1;
            }
        }

        armourClass.value = totalArmourClass;
    });
}

function addInitiative(initiative) {
    chrome.storage.local.get('characterData', function (result) {
        const characterData = result.characterData;
        stats = getCharacterStats(characterData);
        if (characterData) {

            const dexStat = Math.floor((stats.totalDexterity - 10) / 2)//ability score -10/2 to get modifier (round up)
            initiative.value = dexStat;
        } else {
            console.log('Character Data not found in storage');
        }
    })
}

function checkArmour(name, stats, armourData, characterData) {
    const dexterityMod = Math.floor((stats.totalDexterity - 10) / 2);
    let number = 0;

    // Light Armor
    if (name === "Padded" || name === "Leather") {
        number = 11 + dexterityMod;
    } else if (name === "Studded Leather") {
        number = 12 + dexterityMod;
    }

    // Medium Armor
    else if (name === "Hide") {
        number = 12 + Math.min(dexterityMod, 2);
    } else if (name === "Chain Shirt") {
        number = 13 + Math.min(dexterityMod, 2);
    } else if (name === "Scale Mail" || name === "Breastplate") {
        number = 14 + Math.min(dexterityMod, 2);
    } else if (name === "Half Plate") {
        number = 15 + Math.min(dexterityMod, 2);
    }

    // Heavy Armor
    else if (name === "Ring Mail") {
        number = 14;
    } else if (name === "Chain Mail") {
        number = 16;
    } else if (name === "Splint") {
        number = 17;
    } else if (name === "Plate") {
        number = 18;
    }

    // Default Armor
    else {
        number = armourData.definition.armorClass;
    }

    for (let i = 0; i < characterData.feats.length; i++) {
        if (characterData.feats[i].definition.name === "Medium Armour Master") {
            number = number + 1
        }
    }
    
    return number;
}


function getCharacterStats(characterData) {
    let totalStrength = characterData.stats[0].value;
    let totalDexterity = characterData.stats[1].value;
    let totalConstitution = characterData.stats[2].value;
    let totalIntellegence = characterData.stats[3].value;
    let totalWisdom = characterData.stats[4].value;
    let totalCharisma = characterData.stats[5].value;

    for (let i = 0; i < characterData.modifiers.race.length; i++) {
        if (characterData.modifiers.race[i].friendlyTypeName === "Bonus") {
            const abilityIncrease = characterData.modifiers.race[i].friendlySubtypeName.replace(" Score", "");
            if (abilityIncrease === "Strength") {
                totalStrength += characterData.modifiers.race[i].value;
            } else if (abilityIncrease === "Dexterity") {
                totalDexterity += characterData.modifiers.race[i].value;
            } else if (abilityIncrease === "Constitution") {
                totalConstitution += characterData.modifiers.race[i].value;
            } else if (abilityIncrease === "Intellegence") {
                totalIntelligence += characterData.modifiers.race[i].value;
            } else if (abilityIncrease === "Wisdom") {
                totalWisdom += characterData.modifiers.race[i].value;
            } else if (abilityIncrease === "Charisma") {
                totalCharisma += characterData.modifiers.race[i].value;
            }
        }
    }

    for (let i = 0; i < characterData.modifiers.feat.length; i++) {
        const abilities = ["Strength", "Dexterity", "Constitution", "Intellegence", "Wisdom", "Charisma"]
        const type = characterData.modifiers.feat[i].friendlySubtypeName.replace(' Score', '');

        if (abilities.includes(type) && characterData.modifiers.feat[i].type === "bonus") {
            const ability = abilities.includes(type);
            if (type === "Strength" && ability === true) {
                totalStrength += characterData.modifiers.feat[i].value;
            } else if (type === 'Dexterity' && ability === true) {
                totalDexterity += characterData.modifiers.feat[i].value;
            } else if (type === 'Constitution' && ability === true) {
                totalConstitution += characterData.modifiers.feat[i].value;
            } else if (type === 'Intellegence' && ability === true) {
                totalIntellegence += characterData.modifiers.feat[i].value;
            } else if (type === 'Wisdom' && ability === true) {
                totalWisdom += characterData.modifiers.feat[i].value;
            } else if (type === 'Charisma' && ability === true) {
                totalCharisma += characterData.modifiers.feat[i].value;
            }
        }
    }

    for (let i = 0; i < characterData.modifiers.class.length; i++) {
        const abilities = ["Strength", "Dexterity", "Constitution", "Intelligence", "Wisdom", "Charisma"]
        const type = characterData.modifiers.class[i].friendlySubtypeName.replace(' Score', '');
        if (abilities.includes(type) && characterData.modifiers.class[i].type === "bonus") {
            const ability = abilities.includes(type);
            if (type === "Strength" && ability === true) {
                totalStrength += characterData.modifiers.class[i].value;
            } else if (type === 'Dexterity' && ability === true) {
                totalDexterity += characterData.modifiers.class[i].value;
            } else if (type === 'Constitution' && ability === true) {
                totalConstitution += characterData.modifiers.class[i].value;
            } else if (type === 'Intellegence' && ability === true) {
                totalIntellegence += characterData.modifiers.class[i].value;
            } else if (type === 'Wisdom' && ability === true) {
                totalWisdom += characterData.modifiers.class[i].value;
            } else if (type === 'Charisma' && ability === true) {
                totalCharisma += characterData.modifiers.class[i].value;
            }
        }
    }

    for (let i = 0; i < characterData.modifiers.background.length; i++) {
        const abilities = ["Strength", "Dexterity", "Constitution", "Intellegence", "Wisdom", "Charisma"]
        const type = characterData.modifiers.background[i].friendlySubtypeName.replace(' Score', '');

        if (abilities.includes(type) && characterData.modifiers.background[i].type === "bonus") {
            const ability = abilities.includes(type);
            if (type === "Strength" && ability === true) {
                totalStrength += characterData.modifiers.background[i].value;
            } else if (type === 'Dexterity' && ability === true) {
                totalDexterity += characterData.modifiers.background[i].value;
            } else if (type === 'Constitution' && ability === true) {
                totalConstitution += characterData.modifiers.background[i].value;
            } else if (type === 'Intellegence' && ability === true) {
                totalIntellegence += characterData.modifiers.background[i].value;
            } else if (type === 'Wisdom' && ability === true) {
                totalWisdom += characterData.modifiers.background[i].value;
            } else if (type === 'Charisma' && ability === true) {
                totalCharisma += characterData.modifiers.background[i].value;
            }
        }
    }

    for (let i = 0; i < characterData.modifiers.item.length; i++) {
        const abilities = ["Strength", "Dexterity", "Constitution", "Intellegence", "Wisdom", "Charisma"]
        const type = characterData.modifiers.item[i].friendlySubtypeName.replace(' Score', '');

        if (abilities.includes(type) && characterData.modifiers.item[i].type === "bonus") {
            const ability = abilities.includes(type);
            if (type === "Strength" && ability === true) {
                totalStrength += characterData.modifiers.item[i].value;
            } else if (type === 'Dexterity' && ability === true) {
                totalDexterity += characterData.modifiers.item[i].value;
            } else if (type === 'Constitution' && ability === true) {
                totalConstitution += characterData.modifiers.item[i].value;
            } else if (type === 'Intellegence' && ability === true) {
                totalIntellegence += characterData.modifiers.item[i].value;
            } else if (type === 'Wisdom' && ability === true) {
                totalWisdom += characterData.modifiers.item[i].value;
            } else if (type === 'Charisma' && ability === true) {
                totalCharisma += characterData.modifiers.item[i].value;
            }
        }
    }

    for (let i = 0; i < characterData.modifiers.condition.length; i++) {
        const abilities = ["Strength", "Dexterity", "Constitution", "Intellegence", "Wisdom", "Charisma"]
        const type = characterData.modifiers.condition[i].friendlySubtypeName.replace(' Score', '');

        if (abilities.includes(type) && characterData.modifiers.condition[i].type === "bonus") {
            const ability = abilities.includes(type);
            if (type === "Strength" && ability === true) {
                totalStrength += characterData.modifiers.condition[i].value;
            } else if (type === 'Dexterity' && ability === true) {
                totalDexterity += characterData.modifiers.condition[i].value;
            } else if (type === 'Constitution' && ability === true) {
                totalConstitution += characterData.modifiers.condition[i].value;
            } else if (type === 'Intellegence' && ability === true) {
                totalIntellegence += characterData.modifiers.condition[i].value;
            } else if (type === 'Wisdom' && ability === true) {
                totalWisdom += characterData.modifiers.condition[i].value;
            } else if (type === 'Charisma' && ability === true) {
                totalCharisma += characterData.modifiers.condition[i].value;
            }
        }
    }

    for (let i = 0; i < characterData.inventory.length; i++) {
        try {
            if (characterData.inventory[i].definition.grantedModifiers[0].subType === "constitution-score") {
                if (characterData.inventory[i].definition.grantedModifiers[0].type === "set") {
                    totalConstitution = characterData.inventory[i].definition.grantedModifiers[0].value;
                } else if (characterData.inventory[i].definition.grantedModifiers[0].type === "bonus") {
                    totalConstitution += characterData.inventory[i].definition.grantedModifiers[0].value;
                }
            } else if (characterData.inventory[i].definition.grantedModifiers[0].subType === "strength-score") {
                if (characterData.inventory[i].definition.grantedModifiers[0].type === "set") {
                    totalStrength = characterData.inventory[i].definition.grantedModifiers[0].value;
                } else if (characterData.inventory[i].definition.grantedModifiers[0].type === "bonus") {
                    totalStrength += characterData.inventory[i].definition.grantedModifiers[0].value;
                }
            } else if (characterData.inventory[i].definition.grantedModifiers[0].subType === "dexterity-score") {
                if (characterData.inventory[i].definition.grantedModifiers[0].type === "set") {
                    totalDexterity = characterData.inventory[i].definition.grantedModifiers[0].value;
                } else if (characterData.inventory[i].definition.grantedModifiers[0].type === "bonus") {
                    totalDexterity += characterData.inventory[i].definition.grantedModifiers[0].value;
                }
            } else if (characterData.inventory[i].definition.grantedModifiers[0].subType === "intellegence-score") {
                if (characterData.inventory[i].definition.grantedModifiers[0].type === "set") {
                    totalIntellegence = characterData.inventory[i].definition.grantedModifiers[0].value;
                } else if (characterData.inventory[i].definition.grantedModifiers[0].type === "bonus") {
                    totalIntellegence += characterData.inventory[i].definition.grantedModifiers[0].value;
                }
            } else if (characterData.inventory[i].definition.grantedModifiers[0].subType === "wisdom-score") {
                if (characterData.inventory[i].definition.grantedModifiers[0].type === "set") {
                    totalWisdom = characterData.inventory[i].definition.grantedModifiers[0].value;
                } else if (characterData.inventory[i].definition.grantedModifiers[0].type === "bonus") {
                    totalWisdom += characterData.inventory[i].definition.grantedModifiers[0].value;
                }
            } else if (characterData.inventory[i].definition.grantedModifiers[0].subType === "charisma-score") {
                if (characterData.inventory[i].definition.grantedModifiers[0].type === "set") {
                    totalCharisma = characterData.inventory[i].definition.grantedModifiers[0].value;
                } else if (characterData.inventory[i].definition.grantedModifiers[0].type === "bonus") {
                    totalCharisma += characterData.inventory[i].definition.grantedModifiers[0].value;
                }
            }
        } catch (TypeError) {
            continue
        }
    }

    if (characterData.overrideStats[0].value != null) {
        totalStrength = characterData.overrideStats[0].value;
    }

    if (characterData.overrideStats[1].value != null) {
        totalDexterity = characterData.overrideStats[1].value;
    }

    if (characterData.overrideStats[2].value != null) {
        totalConstitution = characterData.overrideStats[2].value;
    }

    if (characterData.overrideStats[3].value != null) {
        totalIntellegence = characterData.overrideStats[3].value;
    }

    if (characterData.overrideStats[4].value != null) {
        totalWisdom = characterData.overrideStats[4].value;
    }

    if (characterData.overrideStats[5].value != null) {
        totalCharisma = characterData.overrideStats[5].value;
    }

    return {
        totalStrength,
        totalDexterity,
        totalConstitution,
        totalIntellegence,
        totalWisdom,
        totalCharisma,
    };
}