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
        urlInput.value = "https://www.dndbeyond.com/characters/" + characterData.Id;

        if (btnGroup) {
            //adds a button to fill in all the inputs
            newButton.addEventListener('click', function (event) {
                event.preventDefault();
                addName(nameInput, characterData);
                addHP(hitPoints, characterData);
                addAC(armourClass, characterData);
                addInitiative(initiative, characterData);
            });
        } else {
            console.log('Name input not found.');
        }
    });
}, 0);

function createButton(text) {
    const button = document.createElement('button');
    button.textContent = text;
    button.classList.add('custom-button');
    return button;
}

function addName(nameInput, characterData) {
    nameInput.value = characterData.Name;
}

function addHP(hitPoints, characterData) {
    hitPoints.value = characterData.HitPoints;
}

function addAC(armourClass, characterData) {
    armourClass.value = characterData.ArmourClass;
}

function addInitiative(initiative, characterData) {
    initiative.value = characterData.Initiative;
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
