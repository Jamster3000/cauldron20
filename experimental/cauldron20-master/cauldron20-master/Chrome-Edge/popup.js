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

    // Event listener for PDF file input change
    document.getElementById('pdfFileInput').addEventListener('change', function (event) {
        importPdf(event);
    });
});

function importPdf(event) {
    var data = new FormData();
    data.append("inputFile", event.target.files[0]);

    var xhr = new XMLHttpRequest();
    xhr.withCredentials = true;
    xhr.addEventListener("readystatechange", function () {
        if (this.readyState === 4) {
            // Parse the response text as JSON
            var jsonResponse = JSON.parse(this.responseText);

            // Check if the conversion was successful
            if (jsonResponse.Successful) {
                // Access the text result
                var textResult = jsonResponse.TextResult;

                // Remove the escape characters from the text result
                var cleanedText = textResult.replace(/\\r\\n/g, "\n").replace(/\\"/g, '"');

                //console.log(cleanedText);
                var characterData = getCharacterData(cleanedText);
                displayCharacterInfo(characterData)
            } else {
                console.error("PDF conversion failed.");
            }
        }
    });

    xhr.open("POST", "https://api.cloudmersive.com/convert/pdf/to/txt");
    xhr.setRequestHeader("Apikey", "332808b3-c8b9-409f-a3dc-f4feadca9d64");
    xhr.send(data);
}

function getCharacterData(unstructuredData) {
    var characterData = {};
    const cleanWhiteSpace = unstructuredData.split(/^\s+|\s+$|\s+(?=\s)/g);
    console.log(cleanWhiteSpace);

    if (cleanWhiteSpace[1].includes("Blood Hunter")) {
        characterData["class"] = cleanWhiteSpace[1].split(" ")[0] + " " + cleanWhiteSpace[1].split(" ")[1];
    } else {
        characterData["class"] = cleanWhiteSpace[1].split(" ")[0];
    }

    characterData["class level"] = cleanWhiteSpace[1].split(" ")[-1];
    characterData["name"] = cleanWhiteSpace[3];
    characterData["race"] = cleanWhiteSpace[6];
    characterData["background"] = cleanWhiteSpace[7];
    characterData["current xp"] = cleanWhiteSpace[8];
    //• this symbol can be found to determine if a character is prof in a skill/saving throw, if it isn't present then the character isn't present

    //saving throws
    var strength = '';
    var dexterity = '';
    var constitution = '';
    var intellegence = '';
    var wisdom = '';
    var charisma = '';
    var bulletToCheck = "\u2022";

    //strength
    if (cleanWhiteSpace[13].trim().includes(bulletToCheck)) {
        strength = cleanWhiteSpace[14].trim();
    } else {
        strength = cleanWhiteSpace[13].trim();
    }

    //dexterity
    if (cleanWhiteSpace[20].trim().includes(bulletToCheck)) {
        dexterity = cleanWhiteSpace[21].trim();
    } else {
        dexterity = cleanWhiteSpace[20].trim();
    }

    //constitution
    if (cleanWhiteSpace[24].trim().includes(bulletToCheck)) {
        constitution = cleanWhiteSpace[25].trim();
    } else {
        constitution = cleanWhiteSpace[24].trim();
    }

    //intellegence
    if (cleanWhiteSpace[30].trim().includes(bulletToCheck)) {
        intellegence = cleanWhiteSpace[31].trim();
    } else {
        intellegence = cleanWhiteSpace[30].trim();
    }

    //wisdom
    if (cleanWhiteSpace[33].trim().includes(bulletToCheck)) {
        wisdom = cleanWhiteSpace[34].trim();
    } else {
        wisdom = cleanWhiteSpace[33].trim();
    }

    //charisma
    if (cleanWhiteSpace[39].trim().includes(bulletToCheck)) {
        charisma = cleanWhiteSpace[40].trim();
    } else {
        charisma = cleanWhiteSpace[39].trim();
    }

    characterData["saving throws"] = { "strength": strength, "dexterity": dexterity, "constitution": constitution, "intellegence": intellegence, "wisdom": wisdom, "charisma": charisma };

    characterData["initiative"] = cleanWhiteSpace[24];
    characterData["armour class"] = cleanWhiteSpace[24];
    characterData["max hp"] = cleanWhiteSpace[26];
    //current hp isn't present in the returned reading of the pdf file there is no element in the list for this.
    characterData["current hp"] = cleanWhiteSpace[27];
    characterData["resistances"] = cleanWhiteSpace[40].replace(" Resistances - ", "").replace("*", "");
    characterData["total hit dice"] = cleanWhiteSpace[41];
    //assuming the success and fail for death save will be • too
    characterData["immunities"] = cleanWhiteSpace[45].replace(" Immunities - ", "").replace("*", "");
    
    characterData["proficiency"] = cleanWhiteSpace[57];
    characterData["skills"] = { "acrobatics": cleanWhiteSpace[60], "animal handling": cleanWhiteSpace[64]};
    characterData["proficiency bonus"] = cleanWhiteSpace[67];

    console.log(characterData);

    return characterData; 
}

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

    // Clear input field
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