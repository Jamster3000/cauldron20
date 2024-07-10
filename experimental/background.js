chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'fetchCharacterInfo') {
        const characterId = request.characterId;
        const buttonIndex = request.buttonIndex; // Get the button index

        // Call fetchCharacterInfo and pass sendResponse as an argument
        fetchCharacterInfo(characterId, buttonIndex, sendResponse);
        return true;  // Will respond asynchronously
    }
});

function fetchCharacterInfo(characterId, buttonIndex, sendResponse) {
    fetch(`https://character-service.dndbeyond.com/character/v3/character/${characterId}`)
        .then(response => response.json())
        .then(data => {
            chrome.storage.local.set({ 'characterData': data.data }, () => {
                console.log('Character Data stored:', data.data);
            });

            // Send the response back to the content script along with the button index
            sendResponse({ characterInfo: data.data, buttonIndex: buttonIndex });
        })
        .catch(error => {
            console.error('Error fetching character info:', error);
            sendResponse({ error: error.message }); // Send error message
        });
}
