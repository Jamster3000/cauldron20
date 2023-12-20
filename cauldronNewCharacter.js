// contentScript.js

console.log('Content script is running.');

// Wait for the page to fully load by using setTimeout
setTimeout(function () {
    console.log('Attempting to modify the page.');

    // Attempt to find the input element with id "name" on the page
    const nameInput = document.getElementById('name');
    const hitPoints = document.getElementById('hitpoints');
    const armourClass = document.getElementById('armor_class');
    const initiative = document.getElementById('initiative');

    if (nameInput) {
        const addNameButton = createButton('Add Character Name');
        //nameInput.after(addNameButton);
        addNameButton.addEventListener('click', function (event) {
            event.preventDefault();

            chrome.storage.local.get('characterData', function (result) {
                const characterData = result.characterData;
                if (characterData) {
                    nameInput.value = characterData.name || '';
                    console.log(characterData.name);
                } else {
                    console.log('Character data not found in storage');
                }
            })           
        });
        nameInput.after(addNameButton);
    }
    if (hitPoints) {
        const addHitPointsButton = createButton('Add Hit Points');
        hitPoints.after(addHitPointsButton);

        addHitPointsButton.addEventListener('click', function (event) {
            event.preventDefault();

            chrome.storage.local.get('characterData', function (result) {
                const characterData = result.characterData;
                if (characterData) {
                  
                    const conStat = Math.ceil((characterData.stats[2]['value'] - 10)/2)//ability score -10/2 to get modifier (round up)
                    const level = calculateLevel(characterData.currentXp)
                    const totalHitPoints = characterData.baseHitPoints + (Number(conStat) * Number(level));//constitustion modifier X level + base hit points = total hp
                    hitPoints.value = totalHitPoints;
                    console.log(conStat, level, totalHitPoints);
                } else {
                    console.log('Character Data not found in storage');
                }
            })
        });
        hitPoints.after(addHitPointsButton);
    }
    if (armourClass) {
        const addArmourClass = createButton('Add Armour Class');
        addArmourClass.addEventListener('click', function (event) {
            event.preventDefault();

            chrome.storage.local.get('characterData', function (result) {
                const characterData = result.characterData;

                // Check if characterData and classFeatures are defined
                if (characterData && characterData.classFeatures) {
                    const armourClass = characterData.armourClass;

                    // Check if armourClass is null
                    if (armourClass == null) {
                        //class features
                        const features = characterData.classFeatures;
                        const unarmoredDefense = features.find(feature => feature.name === "Unarmored Defense");

                        if (unarmoredDefense) {
                            console.log("Has Unarmored Defense");
                            console.log(unarmoredDefense.description);
                        } else {
                            console.log("Doesn't have Unarmored Defense");
                        }
                    }
                }
            });
        });

        armourClass.after(addArmourClass);
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

