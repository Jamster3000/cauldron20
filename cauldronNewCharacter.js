// contentScript.js

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
            console.log(characterData.name);
        } else {
            console.log('Character data not found in storage');
        }
    });
}

function addHP(hitPoints) {
    chrome.storage.local.get('characterData', function (result) {
        const characterData = result.characterData;
        if (characterData) {

            const conStat = Math.ceil((characterData.stats[2]['value'] - 10) / 2)//ability score -10/2 to get modifier (round up)
            const level = calculateLevel(characterData.currentXp)
            const totalHitPoints = characterData.baseHitPoints + (Number(conStat) * Number(level));//constitustion modifier X level + base hit points = total hp
            hitPoints.value = totalHitPoints;
            console.log(totalHitPoints);
        } else {
            console.log('Character Data not found in storage');
        }
    });
}

function addAC(armourClass) {
    chrome.storage.local.get('characterData', function (result) {
        const characterData = result.characterData;
        console.log(characterData);
        // Check if characterData and classFeatures are defined
        if (characterData && characterData.classes[0].classFeatures) {
            const armourClassData = characterData.armourClass;
            totalArmourClass = 0;
            const inventory = characterData.inventory;

            //looks for armour that is equipped
            for (let i = 0; i < inventory.length; i++) {
                if (inventory[i].definition.armorClass != null) {
                    totalArmourClass = inventory[i].definition.armorClass;
                    armourClass.value = totalArmourClass;
                    console.log("armour found");
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
                            } else if (characterData.race.baseName === "tortle") {
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
        if (characterData) {

            const dexStat = Math.ceil((characterData.stats[1].value - 10) / 2)//ability score -10/2 to get modifier (round up)
            initiative.value = dexStat;
        } else {
            console.log('Character Data not found in storage');
        }
    })
}