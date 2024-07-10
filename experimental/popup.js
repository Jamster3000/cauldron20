document.addEventListener('DOMContentLoaded', function () {
    // Fetch character info when the button is clicked
    document.getElementById('fetchButton').addEventListener('click', fetchCharacterInfo);

    // Retrieve the stored character ID and populate the input field
    chrome.storage.local.get('characterId', function (result) {
        const characterIdInput = document.getElementById('characterIdInput');
        characterIdInput.value = result.characterId || '';

        if (result.characterId) {
            fetchCharacterInfo();
        }
    });

    // Add event listener for Enter key press
    document.getElementById('characterIdInput').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            document.getElementById('fetchButton').click();
        }
    });
});

function fetchCharacterInfo() {
    // Get the character ID from the input field
    const characterIdInput = document.getElementById('characterIdInput');
    const characterId = parseInt(characterIdInput.value, 10);

    if (isNaN(characterId) || characterId <= 0) {
        displayError("Invalid Character ID")
        return;
    }

    // Store the character ID in chrome.storage.local
    chrome.storage.local.set({ 'characterId': characterId });

    // Clear input field
    characterIdInput.value = '';

    fetch(`https://character-service.dndbeyond.com/character/v5/character/${characterId}`)
        .then(response => {
            if (!response.ok) {
                if (response.status === 403) {
                    displayError("403: Character must be in public setting not campaign only or private.")
                }
                else {
                    displayError(`HTTP error! Status: ${response.status}`)
                }
            } else {
                return response.json()
            }
        })
        .then(data => {
            displayCharacterInfo(data.data);
            storeCharacterData(data.data);
        })
        .catch(error => {
            console.log(error.message);
            if (error.message.includes("Cannot read")) {
                displayError("403: Your character might be in campaign only or private. Character must be in public in order for the extension to have permission to read the character.");
            } else {
                displayError(`Error: ${error.message}`);
            }
        });
}

function displayCharacterInfo(characterData) {
    const characterInfoElement = document.getElementById('characterInfo');
    characterInfoElement.innerHTML = `
            <h3>${characterData.name}</h3>
        `;

    displayError("");
}

function storeCharacterData(characterData) {
    chrome.storage.local.set({ 'characterData': characterData }, function () {
        console.log('Character Data stored:', characterData);
    });
}

function displayError(message) {
    const errorMessageElement = document.getElementById('errorMessage');
    errorMessageElement.textContent = message;
}