async function fetchCharacterInfo(characterId) {
    try {
        const response = await fetch(`https://character-service.dndbeyond.com/character/v5/character/${characterId}`);
        const data = await response.json();

        if (data && data.data) {
            // Calculate character data
            const characterData = calculateCharacterData(data.data);

            // Store in local storage
            await storeCharacterData(characterData);

            // Return both raw data and processed character data
            return {
                characterInfo: data.data,
                processedData: characterData
            };
        } else {
            throw new Error("Invalid character data received");
        }
    } catch (error) {
        console.error('Error fetching character info:', error);
        throw error;
    }
}

function storeCharacterData(characterData) {
    return new Promise((resolve) => {
        chrome.storage.local.set({ 'characterData': characterData }, () => {
            chrome.storage.local.get(['activeCharacterId', 'characters'], function (result) {
                if (result.activeCharacterId && result.characters &&
                    result.characters[result.activeCharacterId]) {

                    result.characters[result.activeCharacterId] = characterData;
                    chrome.storage.local.set({ 'characters': result.characters }, resolve);
                } else {
                    resolve();
                }
            });
        });
    });
}

/**
 * Add any other functions from background.js that are related to character data calculation here
 * For example: calculateCharacterData, getCharacterStats, etc.
 */

// Export the functionality so it can be imported by adventure.js
window.CharacterFetcher = {
    fetchCharacterInfo
};
