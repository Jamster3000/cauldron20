chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'fetchCharacterInfo') {
        const characterId = message.characterId;
        const buttonIndex = message.buttonIndex; // Get the button index

        // Call fetchCharacterInfo and pass sendResponse as an argument
        fetchCharacterInfo(characterId, buttonIndex, sendResponse);
        return true;  // Will respond asynchronously
    }

    if (message.type === 'ROLL_DICE') {
        //console.log('Background: Received roll dice message', message);

        //execute's roll_dice
        chrome.scripting.executeScript({
            target: { tabId: sender.tab.id },
            func: (dice) => {
                //console.log('Attempting to call window.roll_dice with:', dice);

                try {
                    //if roll_dice is a function, call it with the dice argument
                    if (typeof window.roll_dice === 'function') {
                        //console.log('window.roll_dice function found');
                        window.roll_dice(dice);
                        return { success: true, message: 'Function directly called' };
                    } else {
                        //console.error('window.roll_dice is NOT a function');
                        return {
                            success: false,
                            error: 'roll_dice not a function',
                            type: typeof window.roll_dice,
                            exists: window.roll_dice !== undefined
                        };
                    }
                } catch (error) {
                    //console.error('Error calling roll_dice:', error);
                    return {
                        success: false,
                        error: error.toString(),
                        stack: error.stack
                    };
                }
            },
            args: [message.dice],
            world: 'MAIN'  // Important: ensures script runs in page context
        }).then(results => {
            //console.log('Execution results:', results);
            sendResponse(results[0]?.result);
        }).catch(error => {
            //console.error('Script execution failed:', error);
            sendResponse({
                success: false,
                error: error.toString()
            });
        });
        return true;
    }

    if (message.type === 'SEND_DATA_TO_SIDEBAR') {
        console.log('Background: Received send data to sidebar message', message);

        chrome.scripting.executeScript({
            target: { tabId: sender.tab.id },
            func: (information, characterName) => {
                console.log('Attempting to call send_message with:', { information, characterName });

                try {
                    // Explicitly call the function
                    if (typeof window.send_message === 'function') {
                        console.log('window.send_message function found');
                        window.send_message(information, characterName);
                        return { success: true, message: 'Function directly called' };
                    } else {
                        console.error('window.send_message is NOT a function');
                        return {
                            success: false,
                            error: 'send_message not a function',
                            type: typeof window.send_message,
                            exists: window.send_message !== undefined
                        };
                    }
                } catch (error) {
                    console.error('Error calling send_message:', error);
                    return {
                        success: false,
                        error: error.toString(),
                        stack: error.stack
                    };
                }
            },
            args: [message.information, message.characterName],
            world: 'MAIN'  // Ensures script runs in page context
        }).then(results => {
            console.log('Execution results:', results);
            sendResponse(results[0]?.result);
        }).catch(error => {
            console.error('Script execution failed:', error);
            sendResponse({
                success: false,
                error: error.toString()
            });
        });

        return true;  // For async response
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