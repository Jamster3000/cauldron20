// Define the function to fetch character info
function fetchCharacterInfo(characterId, sendResponse) {
    fetch(`https://character-service.dndbeyond.com/character/v3/character/${characterId}`)
        .then(response => response.json())
        .then(data => {
            // Store the character data in Chrome storage
            chrome.storage.local.set({ 'characterData': data.data }, function () {
                console.log('Character Data stored:', data.data);

                // Send the response back to the content script
                sendResponse({ characterInfo: data.data });
            });
        })
        .catch(error => {
            console.error('Error fetching character info:', error);
            // Optionally, send an error response back to the content script
            sendResponse({ error: error });
        });

    // Return true to indicate that sendResponse will be called asynchronously
    return true;
}

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === 'fetchCharacterInfo') {
        const characterId = request.characterId;
        // Call fetchCharacterInfo and pass sendResponse as an argument
        return fetchCharacterInfo(characterId, sendResponse);
    }
});
