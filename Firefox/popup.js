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

    document.getElementById('fetchButton').addEventListener('click', fetchCharacterInfo);
});

function fetchCharacterInfo() {
    // Get the character ID from the input field
    const characterIdInput = document.getElementById('characterIdInput');
    const characterId = parseInt(characterIdInput.value, 10);

    if (isNaN(characterId) || characterId <= 0) {
        console.error('Invalid character ID.');
        return;
    }

    // Store the character ID in chrome.storage.local
    chrome.storage.local.set({ 'characterId': characterId });

    // clear input field
    characterIdInput.value = '';

    fetch(`https://character-service.dndbeyond.com/character/v3/character/${characterId}`)
        .then(response => response.json())
        .then(data => {
            displayCharacterInfo(data.data);
            storeCharacterData(data.data);
        })
        .catch(error => {
            console.error('Error fetching character info:', error);
        });
}

function displayCharacterInfo(characterData) {
    const characterInfoElement = document.getElementById('characterInfo');
    characterInfoElement.innerHTML = `
    <h3>${characterData.name}</h3>
  `;
}

function storeCharacterData(characterData) {
    chrome.storage.local.set({ 'characterData': characterData }, function () {
        console.log('Character Data stored:', characterData);
    });
}
