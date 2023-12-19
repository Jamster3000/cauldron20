chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action) {
        switch (request.action) {
            case 'addCharacterName':
                addCharacterName();
                break;
            case 'addHitPoints':
                addHitPoints();
                break;
            case 'addArmourClass':
                addArmourClass();
                break;
            case 'addInitiative':
                addInitiative();
                break;
        }
    }
});

function addCharacterName() {
    fetchCharacterInfo();
}

function addHitPoints() {
    fetchCharacterInfo();
}

function addArmourClass() {
    fetchCharacterInfo();
}

function addInitiative() {
    fetchCharacterInfo();
}

// Example function to fetch character info from the content script
function fetchCharacterInfo() {
    // You can implement this function based on your existing fetchCharacterInfo logic
    // Update the popup with the fetched character info
    chrome.runtime.sendMessage({ characterInfo: 'Example Character Info' });
}

// Add more functions as needed for other actions

// Listen for messages from content script
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    // Add any necessary handling for messages from content script if needed
});