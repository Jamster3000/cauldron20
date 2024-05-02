// chromeium cauldronNewCharacter.js

// Wait for the page to fully load by using setTimeout
setTimeout(function () {
    // Attempt to find the input element with id "name" on the page
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
        sheetURL.style.displat = 'block';
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
}, 0); // Adjust the delay (in milliseconds) as needed

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
        } else {
            console.log('Character data not found in storage');
        }
    });
}

function addHP(hitPoints) {
    chrome.storage.local.get('characterData', function (result) {
        const characterData = result.characterData;
        if (characterData) {
            stats = getCharacterStats(characterData);

            const conStat = Math.floor((stats.totalConstitution - 10) / 2)//ability score -10/2 to get modifier (round up)
            const level = characterData.classes[0].level;
            var totalHitPoints = characterData.baseHitPoints + (Number(conStat) * Number(level));//constitustion modifier X level + base hit points = total hp

            for (let i = 0; i < characterData.modifiers.class.length; i++) {
                if (characterData.modifiers.class[i].subType === "hit-points-per-level") {
                    totalHitPoints += parseInt(characterData.modifiers.class[i].value) * level;
                }
            }

            if (characterData.classes[0].definition.name === "Sorcerer" && characterData.classes[0].subclassDefinition.name === "Draconic Bloodline") {
                totalHitPoints += 1 * level;
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
        stats = getCharacterStats(characterData);

        if (characterData && characterData.classes[0].classFeatures) {
            totalArmourClass = 0;
            const inventory = characterData.inventory;

            //looks for armour that is equipped
            for (let i = 0; i < inventory.length; i++) {
                if (inventory[i].definition.armorClass != null) {
                    if (inventory[i].equipped === true) {
                        totalArmourClass = totalArmourClass + checkArmour(inventory[i].definition.name, stats);
                    } else {
                        totalArmourClass = totalArmourClass + 10 + Math.floor((stats.totalDexterity-10)/2);
                    }
                    
                    if (inventory[i].definition.name === "Shield") {
                        totalArmourClass = totalArmourClass + 2;
                    }  

                    if (characterData.classes[0].definition.name === "Sorcerer" && characterData.classes[0].subclassDefinition.name === "Draconic Bloodline") {
                        totalArmourClass = totalArmourClass + 13 + Math.floor((stats.totalDexterity-10)/2);
                    }
                              
                    armourClass.value = totalArmourClass;
                    break;
                } else {
                    if (totalArmourClass === 0) {
                        const features = characterData.classes[0].classFeatures;
                        const currentIteratedFeature = features[i]
                        if (currentIteratedFeature.definition.name === "Unarmored Defense" || currentIteratedFeature.definition.name === "Natural Armor") {
                            //the unarmored defense gives additional AC without the need for armour
                            if (characterData.classes[0].definition.name === "Monk") {
                                const dexStat = Math.floor((characterData.stats[1].value - 10) / 2);
                                const wisStat = Math.floor((characterData.stats[4].value - 10) / 2);
                                const armourClassWorkedTotal = 10 + dexStat + wisStat;
                                armourClass.value = armourClassWorkedTotal;
                                break;
                            } else if (characterData.classes[0].definition.name === "Barbarian") {
                                const dexStat = Math.floor((characterData.stats[1]['value'] - 10) / 2)//(dex total -10) /2
                                const conStat = Math.floor((characterData.stats[2]['value'] - 10) / 2)
                                const armourClassWorkedTotal = 10 + dexStat + conStat;
                                armourClass.value = armourClassWorkedTotal;
                                break;
                            } else if (characterData.race.baseName === "Lizardfolk") {
                                const dexStat = Math.floor((characterData.stats[1]['value'] - 10) / 2)//(dex total -10) / 2
                                const armourClassWorkedTotal = 13 + dexStat;
                                armourClass.value = armourClassWorkedTotal;
                                break;
                            } else if (characterData.classes[0].definition.name === "Sorcerer" && characterData.classes[0].subClassDefinition.name === "Draconic") {
                                const dexStat = Math.floor((characterData.stats[1]['value'] - 10) / 2)//(dex total -10) / 2
                                const armourClassWorkedTotal = 13 + dexStat;
                                armourClass.value = armourClassWorkedTotal;
                                break;
                            } else if (characterDara.race.baseName === "Locathah") {
                                const dexStat = Math.floor((characterData.stats[1]['value'] - 10) / 2)//(dex total -10) / 2
                                const armourClassWorkedTotal = 12 + dexStat;
                                armourClass.value = armourClassWorkedTotal;
                                break;
                            } else if (characterData.race.baseName === "Loxodon") {
                                const dexStat = Math.floor((characterData.stats[1]['value'] - 10) / 2)//(dex total -10) / 2
                                const armourClassWorkedTotal = 13 + dexStat;
                                armourClass.value = armourClassWorkedTotal;
                                break;
                            } else if (characterData.race.baseName === "Tortle") {
                                const dexStat = Math.floor((characterData.stats[1]['value'] - 10) / 2)//(dex total -10) / 2
                                const armourClassWorkedTotal = 13 + dexStat;
                                armourClass.value = armourClassWorkedTotal;
                                break;
                            }
                        }
                    }
                }
            }
        }
    })
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

function checkArmour(name, stats) {
    const dexterityMod = Math.floor((stats.totalDexterity - 10) / 2);
    var number = 0;
    if (name === "Padded" || name === "Leather") {
        number = 11 + dexterityMod;
    } else if (name === "Studded Leather") {
        number = 12 + dexterityMod;
    } else if (name === "Hide") {
        if (dexterityMod > 1) {
            number = 12 + 2;
        } else {
            number = 12 + dexterityMod;
        }
    } else if (name === "Chain Shirt") {
        if (dexterityMod > 1) {
            number = 13 + 2;
        } else {
            number = 13 + dexterityMod;
        }
    } else if (name === "Scale Mail" || name === "Breastplate") {
        if (dexterityMod > 1) {
            number = 14 + 2;
        } else {
            number = 14 + dexterityMod;
        }
    } else if (name === "Half Plate") {
        if (dexterityMod > 1) {
            number = 15 + 2;
        } else {
            number = 15 + dexterityMod;
        }
    } else if (name == "Ring Mail") {
        number = 14;
    } else if (name === "Chain Mail") {
        number = 16;
    } else if (name === "Splint") {
        number = 17;
    } else if (name === "Plate") {
        number = 18;
    }

    console.log(number);

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

    return {
        totalStrength,
        totalDexterity,
        totalConstitution,
        totalIntellegence,
        totalWisdom,
        totalCharisma,
    };
}