// contentScript.js

console.log('Content script is running.');

// Wait for the page to fully load by using setTimeout
setTimeout(function () {
    console.log('Attempting to modify the page.');

    // Attempt to find the input element with id "name" on the page
    const nameInput = document.getElementById('name');
    const hitPoints = document.getElementById('hitpoints')
    const armourClass = document.getElementById('armor_class');
    const initiative = document.getElementById('initiative');

    if (nameInput) {
        const addNameButton = createButton('Add Character Name');
        //nameInput.after(addNameButton);
        addNameBUtton = addEventListener('click', function (event) {
            event.preventDefault();
            const characterNameString = "";
            const characterName = chrome.runtime.sendMessage({ action: 'addCharacterName', characterName: characterNameString })
            console.log("Your characters name: ", characterNameString)
        });
        nameInput.after(addNameButton);
    }
    if (hitPoints) {
        const addHitPointsButton = createButton('Add Hit Points');
        hitPoints.after(addHitPointsButton);
    }
    if (armourClass) {
        const addArmourClass = createButton('Add Armour Class');
        armourClass.after(addArmourClass)
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