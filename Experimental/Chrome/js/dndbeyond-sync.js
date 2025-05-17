// Signal that the content script is loaded
console.log("D&D Beyond sync script loaded");

// Listen for messages from our extension
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    console.log("Message received in D&D Beyond content script:", message);

    if (message.type === 'UPDATE_CHARACTER_DATA') {
        console.log('Received update for character', message.characterId);

        try {
            // Based on the update type, modify the D&D Beyond page
            if (message.data.type === 'health') {
                updateDnDBeyondHealth(message.data.currentHP, message.data.maxHP);
                sendResponse({ success: true });
            } else {
                // Handle other types of updates
                console.log('Unhandled update type:', message.data.type);
                sendResponse({ success: false, error: 'Unhandled update type' });
            }
        } catch (error) {
            console.error('Error updating D&D Beyond page:', error);
            sendResponse({ success: false, error: error.message });
        }

        return true; // Keep the message channel open for async response
    }

    // Always send a response even for unhandled messages
    sendResponse({ success: false, error: 'Unhandled message type' });
    return true;
});

// Register with background script
chrome.runtime.sendMessage({ type: 'DNDBEYOND_CONTENT_LOADED' });

function updateDnDBeyondHealth(currentHP, maxHP) {
    console.log(`Attempting to update health to ${currentHP}/${maxHP}`);

    // First try the current HP button (from data.txt)
    const currentHPButton = document.querySelector('.styles_valueButton__0rK5Z');
    const maxHPSpan = document.querySelector('[data-testid="max-hp"]');

    if (currentHPButton && maxHPSpan) {
        console.log('Found new D&D Beyond UI elements');

        // Get the current HP value
        const currentValue = parseInt(currentHPButton.textContent);
        // Calculate the difference (can be positive or negative)
        const diff = currentHP - currentValue;

        if (diff !== 0) {
            // Click the current HP button to activate the edit mode
            currentHPButton.click();

            // Wait for the input field to appear
            setTimeout(() => {
                const hpInput = document.querySelector('[data-testid="hp-adjust-input"]');
                const healButton = document.querySelector('.styles_heal__4AW3J');
                const damageButton = document.querySelector('.styles_damage__cxeXD');

                if (hpInput && (healButton || damageButton)) {
                    // Set the absolute value of the difference
                    hpInput.value = Math.abs(diff);
                    hpInput.dispatchEvent(new Event('input', { bubbles: true }));

                    // Click either heal or damage button depending on the sign of diff
                    if (diff > 0) {
                        console.log(`Healing for ${Math.abs(diff)} points`);
                        healButton.click();
                    } else {
                        console.log(`Damaging for ${Math.abs(diff)} points`);
                        damageButton.click();
                    }
                    console.log('HP update applied');
                } else {
                    console.error('Could not find HP adjustment inputs after clicking');
                }
            }, 500); // Give time for the input to appear

            return;
        } else {
            console.log('No HP change needed, current value matches');
            return;
        }
    } else {
        console.error('Could not find D&D Beyond HP elements using new selectors');

        // Try falling back to alternative selectors
        const alternativeHPButton = document.querySelector('button[id^="styles_valueButton"]');
        const alternativeMaxHP = document.querySelector('span[data-testid="max-hp"]');

        if (alternativeHPButton && alternativeMaxHP) {
            console.log('Found alternative D&D Beyond UI elements');
            // Similar implementation as above...
        } else {
            console.error('Could not find any D&D Beyond HP elements');
        }
    }
}
