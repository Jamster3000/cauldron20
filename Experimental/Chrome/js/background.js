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

    if (message.type === 'ROLL_D20') {
        chrome.scripting.executeScript({
            target: { tabId: sender.tab.id },
            func: (modifier, rollType) => {
                try {
                    if (typeof window.roll_d20 === 'function') {
                        console.log(`Rolling d20 with modifier ${modifier} and rollType ${rollType}`);
                        window.roll_d20(modifier, rollType);
                        return { success: true, message: 'roll_d20 called successfully' };
                    } else {
                        console.error('window.roll_d20 is not a function');
                        if (typeof window.roll_dice === 'function') {
                            const rollCommand = rollType === 1 ? "2d20kh1" + modifier :
                                rollType === 2 ? "2d20kl1" + modifier :
                                    "1d20" + modifier;
                            window.roll_dice(rollCommand);
                            return { success: true, message: 'Fallback to roll_dice' };
                        }
                        return {
                            success: false,
                            error: 'Neither roll_d20 nor roll_dice are available functions'
                        };
                    }
                } catch (error) {
                    return {
                        success: false,
                        error: error.toString(),
                        stack: error.stack
                    };
                }
            },
            args: [message.modifier, message.rollType],
            world: 'MAIN'
        }).then(results => {
            sendResponse(results[0]?.result);
        }).catch(error => {
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
    if (message.type === 'APPLY_HEALING') {
        chrome.scripting.executeScript({
            target: { tabId: sender.tab.id },
            func: (healAmount) => {
                try {
                    // Use the my_character variable from Cauldron VTT's global scope
                    if (typeof window.object_damage_command === 'function' && window.my_character) {
                        console.log(`Applying healing: ${healAmount} to character: ${window.my_character}`);
                        window.object_damage_command(window.my_character, -parseInt(healAmount));
                        return { success: true, message: 'Healing applied successfully' };
                    } else {
                        console.error('Required functions or variables not available:',
                            'object_damage_command exists:', typeof window.object_damage_command === 'function',
                            'my_character exists:', !!window.my_character);
                        return {
                            success: false,
                            error: 'Required Cauldron VTT functions or variables not available',
                            object_damage_command_exists: typeof window.object_damage_command === 'function',
                            my_character_exists: !!window.my_character,
                            my_character_value: window.my_character
                        };
                    }
                } catch (error) {
                    console.error("Error applying healing:", error);
                    return {
                        success: false,
                        error: error.toString(),
                        stack: error.stack
                    };
                }
            },
            args: [message.healAmount],
            world: 'MAIN'  // Important: ensures script runs in the Cauldron VTT page context
        }).then(results => {
            sendResponse(results[0]?.result);
        }).catch(error => {
            sendResponse({
                success: false,
                error: error.toString()
            });
        });
        return true;
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