let characterSheetOverlayOpen = false;
saveSpellSlots(null);

setTimeout(function () {
    getUserCharacter((error, adventureData) => {
        if (error) {
	    console.error("Error:", error);
	    return;
	}
    	if (adventureData['@is_dm'] === "yes") {
            console.log('You are the DM, there is no character button for you!');
        } else {
            changePlayArea(); //resizes playarea   

            const container = document.querySelector('.container');//contains each section of the page (playArea, chat, header, etc.)

            const divCharacterTools = document.createElement('div');
            divCharacterTools.className = "charactertools";//This is where all the character's infomation will be.
            container.appendChild(divCharacterTools);

            const viewCharacter = document.createElement('button');
            viewCharacter.textContent = "View Character Sheet";
            viewCharacter.classList.add('btn', 'btn-default');
            viewCharacter.style.position = 'fixed';
            viewCharacter.style.bottom = '10px';
            viewCharacter.style.left = '15px';
            divCharacterTools.appendChild(viewCharacter); // Appended the button to the container

            viewCharacter.addEventListener('click', function(event) {
                event.preventDefault();
				getUserCharacter((error, adventureData) => {
  					if (error) {
    					console.error('Error:', error);
    					return;
  					}
					showCharacterSheet(adventureData);
				});
            });
        }
    });
}, 0);

function changePlayArea() {
    const playArea = document.querySelector('.playarea');
    playArea.style.bottom = '50px';
}

function write_sidebar(message) {
    var sidebar = document.querySelector('.sidebar');
    message = message.replace(/\n/g, '<br />');
    sidebar.innerHTML += '<p>' + message + '</p>';
    sidebar.scrollTop = sidebar.scrollHeight;
}

function message_to_sidebar(name, message) {
	if ((message.substring(0, 7) == 'http://') || (message.substring(0, 8) == 'https://')) {
		var parts = message.split('.');
		var extension = parts.pop();
		var images = ['gif', 'jpg', 'jpeg', 'png', 'webp'];

		if (images.includes(extension)) {
			message = '<img src="' + message + '" style="cursor:pointer;" onClick="javascript:show_image(this)" />';
		} else {
			message = '<a href="' + message + '" target="_blank">' + message + '</a>';
		}
	} else {
		message = message.replace(/</g, '&lt;').replace(/\n/g, '<br />');
	}

	if (name != null) {
		message = '<b>' + name + ':</b><span style="display:block; margin-left:15px;">' + message + '</span>';
	}
	write_sidebar(message);
}

function websocket_send(data) {
    // Inject script into webpage context to access window.websocket
    var script = document.createElement('script');
    script.textContent = `
        // Access the WebSocket object from the webpage
        var websiteWebSocket = window.websocket;
        
        // Log the WebSocket object
        //console.log("WebSocket object from website:", websiteWebSocket);

        // Once you have access to the WebSocket object, perform further actions
        if (websiteWebSocket == null || websiteWebSocket.readyState !== WebSocket.OPEN) {
            //console.log("Not open");
        }

        var data = ${JSON.stringify(data)};
	//console.log(data);
        websiteWebSocket.send(data);
    `;
    (document.head || document.documentElement).appendChild(script);
    script.remove(); // Clean up injected script after use
}

function handleWebSocketMessage(event) {
    // Extract the data from the WebSocket message
    var messageData = event.data;

    // Process the received data as needed
    //console.log("Received data from WebSocket:", messageData);

    // Example: Forward the received data to the background script
    chrome.runtime.sendMessage({dataFromWebSocket: messageData});
}

function message_send(message, name, write_to_sidebar = true) {
	var data = {
		action: 'say',
		name: name,
		mesg: message
	};
	//console.log(data);
	websocket_send(data);

	if (write_to_sidebar) {
		message_to_sidebar(name, message);
	}
}

function showCharacterSheet(adventureData, buttonPressed) {
    if (characterSheetOverlayOpen && buttonPressed == "null") {
        console.log('character sheet already open');
		return;
	}

	try {
		// clear content of overlay
		const content = document.getElementById('overlayContainer');
		content.innerHTML = '';
	} catch {}

    const listSkills = [{ name: "Acrobatics", ability: "Dex" },{ name: "Animal Handling", ability: "Wis" },{ name: "Arcana", ability: "Int" },{ name: "Athletics", ability: "Str" },{ name: "Deception", ability: "Cha" },{ name: "History", ability: "Int" },{ name: "Insight", ability: "Wis" },{ name: "Intimidation", ability: "Cha" },{ name: "Investigation", ability: "Int" },{ name: "Medicine", ability: "Wis" },{ name: "Nature", ability: "Int" },{ name: "Perception", ability: "Wis" },{ name: "Performance", ability: "Cha" },{ name: "Persuasion", ability: "Cha" },{ name: "Religion", ability: "Int" },{ name: "Sleight of Hand", ability: "Dex" },{ name: "Stealth", ability: "Dex" },{ name: "Survival", ability: "Wis" }];
    const savingThrowList = ["Strength", "Dexterity", "Constitution", "Intellegence", "Wisdom", "Charisma"];    

	chrome.storage.local.get('characterData', function (result) {
        const characterData = result.characterData;
		const stats = getCharacterStats(characterData);
		console.log(characterData);
		console.log(adventureData);

		chrome.storage.local.get(null, function (result) {
			console.log('All stored data:', result);
		});

        const overlayContainer = document.createElement('div');
        overlayContainer.id = 'customOverlay';
        overlayContainer.classList.add('panel', 'panel-primary');
        overlayContainer.style.display = 'none';
        overlayContainer.style.position = 'fixed';
        overlayContainer.style.top = '40px';
        overlayContainer.style.left = '15px';
        overlayContainer.style.backgroundColor = 'rgba(255,255,255, 1)';
        overlayContainer.style.zIndex = '10010';

		let currentCauldronHitPoints = 0;
		let currentArmourClass = 0;
		let characterHidden = "";

		//get the player's character's current hp
		// the current hp of the viewd character will be based on what the hp for their charatcer is on cauldron
		for (let i = 0; i<adventureData.characters.character.length; i++) {
			if (adventureData.characters.character[i].name === characterData.name) {
			currentCauldronHitPoints = (Number(adventureData.characters.character[i].hitpoints) - Number(adventureData.characters.character[i].damage));
			currentArmourClass = (Number(adventureData.characters.character[i].armor_class));

			if (adventureData.characters.character[i].hidden === "yes") {
				characterHidden = "[hidden]";
			}
			break;
			}
		}

			// Create overlay header
			const overlayHeader = document.createElement('div');
			overlayHeader.classList.add('panel-heading');
			overlayHeader.id = "titleBar";
			overlayHeader.innerHTML = `${characterData.name} - Character ${characterHidden} <span class="glyphicon glyphicon-remove close" aria-hidden="true"></span>`;

		const closeButton = overlayHeader.querySelector('.close');
		closeButton.addEventListener('click', function() {
			overlayContainer.style.display = 'none';
			characterSheetOverlayOpen = false;

			const characterSheetOverlay = document.getElementById('customOverlay');
			if (characterSheetOverlay) {
	   		characterSheetOverlay.remove();
			}
		});

		//working out the total character hp
		const conStat = Math.floor((stats.totalConstitution - 10) / 2)//ability score -10/2 to get modifier (round up)
		const level = calculateLevel(characterData.currentXp)
		const totalHitPoints = characterData.baseHitPoints + (Number(conStat) * Number(level));//constitustion modifier X level + base hit points = total hp
		console.log("total: " + totalHitPoints);

		// Create overlay body
		const overlayBody = document.createElement('div');
		overlayBody.classList.add('panel-body');

		//html for the main page of the character sheet
		overlayBody.innerHTML = `
				<style>
        				.character-menu {
            				display: grid;
            				grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); /* Adjust minmax values as needed */
            				gap: 10px; /* Adjust gap as needed */
        				}
    				</style>
				<div id="overlayContainer" style="display: flex;">
    					<div style="border: 2px solid #336699; padding: 10px; margin-right: 10px; height: 515px;">
						<br>
       		            			<h5 style="font-weight: bold;">STR</h5>
        					<button id="strButton" style="margin-right: 5px;">${stats.totalStrength} (${stats.totalStrength >= 10 ? '+' : ''}${Math.floor((stats.totalStrength-10)/2)})</button>
						<h5 style="font-weight: bold;">DEX</h5>
        					<button id="dexButton" style="margin-right: 5px;">${stats.totalDexterity} (${stats.totalDexterity >= 10 ? '+' : ''}${Math.floor((stats.totalDexterity-10)/2)})</button>
        					<h5 style="font-weight: bold;">CON</h5>
        					<button id="conButton" style="margin-right: 5px;">${stats.totalConstitution} (${stats.totalConstitution >= 10 ? '+' : ''}${Math.floor((stats.totalConstitution-10)/2)})</button>
  						<h5 style="font-weight: bold;">INT</h5>
        					<button id="intButton" style="margin-right: 5px;">${stats.totalIntellegence} (${stats.totalIntellegence >= 10 ? '+' : ''}${Math.floor((stats.totalIntellegence-10)/2)})</button>
						<h5 style="font-weight: bold;">WIS</h5>
        					<button id="wisButton" style="margin-right: 5px;">${stats.totalWisdom} (${stats.totalWisdom >= 10 ? '+' : ''}${Math.floor((stats.totalWisdom-10)/2)})</button>
						<h5 style="font-weight: bold;">CHA</h5>
        					<button id="chaButton" style="margin-right: 5px;">${stats.totalCharisma} (${stats.totalCharisma >= 10 ? '+' : ''}${Math.floor((stats.totalCharisma-10)/2)})</button>
    			    			<h3 style="margin-top: 50px; font-size: 20px;">ᴬᵇᶦˡᶦᵗʸ ˢᶜᵒʳᵉ</h3>
					</div>
					<div id=SkillListDiv style="border: 2px solid #336699; padding: 15px; margin-right: 10px; height: 515px;">
					<ul id="skillList">
					</ul>
					<h3 style="margin-top: -10px; font-size: 20px; margin-left: 45px;">ˢᵏᶦˡˡˢ</h3>
					</div>
					<div style="border: 2px solid #336699; padding 15px; margin-right: 1px; height: 185px; margin-top: 330px; width: 110px;">
					<ul id="savingThrowElement">
						</ul>
					<h3 style="margin-top: -8px; font-size: 20px; margin-left: 10px;">ˢᵃᵛᶦⁿᵍ ᵀʰʳᵒʷˢ</h3>
					</div>
					<div class="Character-menu-container" style="margin-top: 95px; height: 40px; margin-left: 9px;">
						<div class="character-menu" style="border: 2px solid #336699; padding 5px; height: 230px; width: 110px; margin-left: -120px;">
						<button id="actions" class="btn btn-primary btn-xs open_menu" style="font-size: 12px; margin-top: 10px; margin-left: 2px; width: 100px; height: 28px;">Actions</button>
						<button id="bio" class="btn btn-primary btn-xs open_menu" style="font-size: 12px; margin-top: -10px; margin-left: 2px; width: 100px; height: 28px;">Bio</button>
						<button id="character" class="btn btn-primary btn-xs open_menu" style="font-size: 12px; margin-top: -10px; margin-left: 2px; width: 100px; height: 28px;">Character</button>
						<button id="features" class="btn btn-primary btn-xs open_menu" style="font-size: 12px; margin-top: -10px; margin-left: 2px; width: 100px; height: 28px;">Features</button>	
						<button id="inventory" class="btn btn-primary btn-xs open_menu" style="font-size: 12px; margin-top: -10px; margin-left: 2px; width: 100px; height: 28px;">Inventory</button>
						<button id="spells" class="btn btn-primary btn-xs open_menu" style="font-size: 12px; margin-top: -10px; margin-left: 2px; width: 100px; height: 28px;">Spells</button>
						</div>
					</div>
					<div>
					<input type="text" id="maxHitPoints" disabled="true" value="${totalHitPoints}" style="width: 30px; height: 30px; margin-left: -35px;">
  			    		<input type="text" id="CurrentHitPoints" disabled=true value="${String(currentCauldronHitPoints)}" style="width: 30px; height: 30px; margin-left: -78px;">
					<label style="margin-left: -6px; font-size: 20px;">／</label>
						<label style="width: 30px; height: 30px; margin-left: -80px; font-size: 14px;">Hit Points</label>
					</div>
					<div>
					<input type="text" id="armourClass" disabled="true" value="${currentArmourClass}" style="margin-left: -65px; margin-top: 55px; width: 40px; height: 30px;">
					<label style="width: 30px; height: 30px; margin-left: -95px; margin-top: 55px; font-size: 14px;">AC</label>
				</div>
	`;

		//All the css that is in control of the format of character sheets
		const link = document.createElement('link');
		link.rel = 'stylesheet';
		link.type = 'text/html';
		link.href = 'characterSheet.css';
		document.head.appendChild(link);

		//event listeners for the ability buttons
		const strButton = overlayBody.querySelector('#strButton');
		strButton.addEventListener('click', function() {
			console.log("Your strength:", stats.totalStrength);

			//random number
			let randomNumber = Math.floor(Math.random() * 20)+1 //this will do any number from 1 - 20
			var message = `strength check \nModifier: ${Math.floor((stats.totalStrength-10)/2)}\nRolled: ${randomNumber}\nTotal: [${randomNumber + Math.floor((stats.totalStrength-10)/2)}]`;
			sendDataToSidebar(message, characterData.name);	
		 });

		const dexButton = overlayBody.querySelector('#dexButton');
		dexButton.addEventListener('click', function() {
			console.log("Your dexterity:", stats.totalDexterity);

			//random number
			let randomNumber = Math.floor(Math.random() * 20)+1 //this will do any number from 0 - 20
			var message = `You made a Dexteriy check - Modifier: ${Math.floor((stats.totalDexterity-10)/2)} Rolled: ${randomNumber} Total: [${randomNumber + Math.floor((stats.totalDexterity-10)/2)}]`;
			sendDataToSidebar(message, characterData.name);	

		});
	
		const conButton = overlayBody.querySelector('#conButton');
		conButton.addEventListener('click', function() {
    		console.log("Your constitution:", stats.totalConstitution);

			//random number
			let randomNumber = Math.floor(Math.random() * 20)+1 //this will do any number from 0 - 20
			var message = `You made a Constitution check - Modifier: ${Math.floor((stats.totalConstitution-10)/2)} Rolled: ${randomNumber} Total: [${randomNumber + Math.floor((stats.totalConstitution-10)/2)}]`;
			sendDataToSidebar(message, characterData.name);	

		});

		const intButton = overlayBody.querySelector('#intButton');
		intButton.addEventListener('click', function() {
    		console.log("Your intelligence:", stats.totalintellegence);

			//random number
			let randomNumber = Math.floor(Math.random() * 20)+1 //this will do any number from 0 - 20
			var message = `You made a Intellegence check - Modifier: ${Math.floor((stats.totalIntellegence-10)/2)} Rolled: ${randomNumber} Total: [${randomNumber + Math.floor((stats.totalIntellegence-10)/2)}]	`;
			sendDataToSidebar(message, characterData.name);	
		});

		const wisButton = overlayBody.querySelector('#wisButton');
		wisButton.addEventListener('click', function() {
			console.log("Your wisdom:", stats.totalWisdom);

			//random number
			let randomNumber = Math.floor(Math.random() * 20)+1 //this will do any number from 0 - 20
			var message = `You made a Wisdom check - Modifier: ${Math.floor((stats.totalWisdom-10)/2)} Rolled: ${randomNumber} Total: [${randomNumber + Math.floor((stats.totalWisdom-10)/2)}]`;
			sendDataToSidebar(message, characterData.name);	
		});

		const chaButton = overlayBody.querySelector('#chaButton');
		chaButton.addEventListener('click', function() {
  		  	console.log("Your charisma:", stats.totalCharisma);

			//random number
			let randomNumber = Math.floor(Math.random() * 20)+1 //this will do any number from 0 - 20
			var message = `You made a Charisma check - Modifier: ${Math.floor((stats.totalCharisma-10)/2)} Rolled: ${randomNumber} Total: [${randomNumber + Math.floor((stats.totalCharisma-10)/2)}]`;
			sendDataToSidebar(message, characterData.name);	
		});

		//event listeners for the character buttons
		const actionButton = overlayBody.querySelector('#actions');
		actionButton.addEventListener('click', function() {
			console.log("action button pressed");
			showActions(adventureData, buttonPressed, characterData);
		});
	
		const bioButton = overlayBody.querySelector('#bio');
		bioButton.addEventListener('click', function() {
			console.log("bio button pressed");
			showBio(adventureData, buttonPressed, characterData);
		});

		const characterButton = overlayBody.querySelector('#character');
		characterButton.addEventListener('click', function() {
			console.log('character button pressed');
		});

		const featuresButton = overlayBody.querySelector('#features');
		featuresButton.addEventListener('click', function() {
			console.log('features button pressed');
			showFeatures(adventureData, buttonPressed, characterData);
		});

		const inventoryButton = overlayBody.querySelector('#inventory');
		inventoryButton.addEventListener('click', function() {
			console.log('inventory button pressed');
			showInventory(adventureData, buttonPressed, characterData);
		});

		const spellsButton = overlayBody.querySelector('#spells');
		spellsButton.addEventListener('click', function() {
			console.log('spells button pressed');
			showSpells(adventureData, buttonPressed, characterData, stats);
		});

			// Append elements to build the overlay
			overlayContainer.appendChild(overlayHeader);
			overlayContainer.appendChild(overlayBody);

			// Append overlay container to the body
			document.body.appendChild(overlayContainer);

		// Show overlay
			overlayContainer.style.display = 'block';

		//loop for showing all elements for skills
		const getSkillListElement = document.getElementById('skillList');
		for (let i = 0; i < listSkills.length; i++) {
			//radio button
			const listElement = document.createElement('input');
			listElement.type = "radio";
			listElement.disabled = true;

			for (let j = 0; j < characterData.modifiers.background.length; j++) {
				if (characterData.modifiers.background[j].subType.includes(listSkills[i].name.toLowerCase())) {
					listElement.checked = true;
					break;
				}
			}

			for (let j = 0; j < characterData.modifiers.class.length; j++) {
				if (characterData.modifiers.class[j].subType.includes(listSkills[i].name.toLowerCase())) {
					listElement.checked = true;
					break;
				}
			}

			for (let j = 0; j < characterData.modifiers.race.length; j++) {
				if (characterData.modifiers.race[j].subType.includes(listSkills[i].name.toLowerCase())) {
					listElement.checked = true;
					break;
				}
			}

			//breakline
			const breakLine = document.createElement('br');

			//skill label
			const skillLabel = document.createElement('label');
			skillLabel.style.fontSize = "11px";
			skillLabel.textContent = listSkills[i].name;

			//skill number button
			const skillModifier = document.createElement('button');
			skillModifier.id = "modifierButton";
			skillModifier.style.marginRight = "5px";

			if (listElement.checked === true) {
				let total = 0;
				const characterProf = calculateProf(calculateLevel(characterData.currentXp));

				if (listSkills[i].ability === "Str") {
					total = Math.floor((stats.totalStrength - 10) / 2) + characterProf;
				} else if (listSkills[i].ability === "Dex") {
					total = Math.floor((stats.totalDexterity - 10) / 2) + characterProf;
				} else if (listSkills[i].ability === "Int") {
					total = Math.floor((stats.totalIntellegence - 10) / 2) + characterProf;
				} else if (listSkills[i].ability === "Wis") {
					total = Math.floor((stats.totalWisdom - 10) / 2) + characterProf;
				} else if (listSkills[i].ability === "Cha") {
					total = Math.floor((stats.totalCharisma - 10) / 2) + characterProf;
				}
				skillModifier.textContent = total >= 0 ? `+${total}` : total;
				skillModifier.addEventListener('click', function () {
					let randomNumber = Math.floor(Math.random() * 20) + 1
					var message = `${listSkills[i].name} check\nModifier: ${total}\nRolled: ${randomNumber}\nTotal: [${randomNumber + total}]`;
					sendDataToSidebar(message, characterData.name);
				});
			} else {
				let total = 0;

				if (listSkills[i].ability === "Str") {
					total = Math.floor((stats.totalStrength - 10) / 2);
				} else if (listSkills[i].ability === "Dex") {
					total = Math.floor((stats.totalDexterity - 10) / 2);
				} else if (listSkills[i].ability === "Int") {
					total = Math.floor((stats.totalIntellegence - 10) / 2);
				} else if (listSkills[i].ability === "Wis") {
					total = Math.floor((stats.totalWisdom - 10) / 2);
				} else if (listSkills[i].ability === "Cha") {
					total = Math.floor((stats.totalCharisma - 10) / 2);
				}
				skillModifier.textContent = total >= 0 ? `+${total}` : total;

				skillModifier.addEventListener('click', function () {
					let randomNumber = Math.floor(Math.random() * 20) + 1
					var message = `${listSkills[i].name} check\nModifier: ${total}\nRolled: ${randomNumber}\nTotal: [${randomNumber + total}]`;
					sendDataToSidebar(message, characterData.name);
				});
			}

			//adding all elements 
			getSkillListElement.appendChild(listElement);
			getSkillListElement.appendChild(skillModifier);
			getSkillListElement.appendChild(skillLabel);
			getSkillListElement.appendChild(breakLine);
		}

		//saving throw loop
		const getSavingThrowElement = document.getElementById('savingThrowElement');
		for (let i = 0; i<savingThrowList.length; i++){
			//radio button
			const listElement = document.createElement('input');
			listElement.type = "radio";
			listElement.disabled = true;

			//getting profs in different saving throws
			for (let j = 0; j < characterData.modifiers.class.length; j++) {
 				if (characterData.modifiers.class[j].friendlySubtypeName.replace('Saving Throws', '').includes(savingThrowList[i])) {
				listElement.checked = true;
			}
			}

			//text label
			const savingThrowLabel = document.createElement('label');
			savingThrowLabel.style.fontSize = "11px";
			savingThrowLabel.textContent = savingThrowList[i];

			//button
			savingThrowButton = document.createElement('button');
			savingThrowButton.id = "modifierButton";
			savingThrowButton.style.marginRight = "5px";

			if (listElement.checked === true) {
				let total = 0;
				const characterProf = calculateProf(calculateLevel(characterData.currentXp));

				if (savingThrowList[i] === "Strength") {
				total = Math.floor((stats.totalStrength-10)/2) + characterProf;
			} else if (savingThrowList[i] === "Dexterity") {
        			total = Math.floor((stats.totalDexterity - 10) / 2) + characterProf;
    				} else if (savingThrowList[i] === "Constitution") {
        			total = Math.floor((stats.totalConstitution - 10) / 2) + characterProf;
    			} else if (savingThrowList[i] === "Intelligence") {
        			total = Math.floor((stats.totalIntellegence - 10) / 2) + characterProf;
    			} else if (savingThrowList[i] === "Wisdom") {
        			total = Math.floor((stats.totalWisdom - 10) / 2) + characterProf;
    			} else if (savingThrowList[i] === "Charisma") {
        			total = Math.floor((stats.totalCharisma - 10) / 2) + characterProf;
   			}
		
			savingThrowButton.textContent = total >= 0 ? `+${total}` : total;

			savingThrowButton.addEventListener('click', function () {
				let randomNumber = Math.floor(Math.random() * 20) + 1
				var message = `${listSkills[i].name} check\nModifier: ${total}\nRolled: ${randomNumber}\nTotal: [${randomNumber + total}]`;
				sendDataToSidebar(message, characterData.name);
			});
				
			} else {
			 let total = 0;

				if (savingThrowList[i] === "Strength") {
				total = Math.floor((stats.totalStrength-10) / 2)
			} else if (savingThrowList[i] === "Dexterity") {
        			total = Math.floor((stats.totalDexterity - 10) / 2); 	 
    				} else if (savingThrowList[i] === "Constitution") {
        			total = Math.floor((stats.totalConstitution - 10) / 2);
    			} else if (savingThrowList[i] === "Intelligence") {
        			total = Math.floor((stats.totalIntellegence - 10) / 2);
    			} else if (savingThrowList[i] === "Wisdom") {
        			total = Math.floor((stats.totalWisdom - 10) / 2);
    			} else if (savingThrowList[i] === "Charisma") {
        			total = Math.floor((stats.totalCharisma - 10) / 2);
   			}
		
			savingThrowButton.textContent = total >= 0 ? `+${total}` : total;

			savingThrowButton.addEventListener('click', function () {
				let randomNumber = Math.floor(Math.random() * 20) + 1
				var message = `${listSkills[i].name} check\nModifier: ${total}\nRolled: ${randomNumber}\nTotal: [${randomNumber + total}]`;
				sendDataToSidebar(message, characterData.name);
			});
			}

			//breakline
			const breakLine = document.createElement('br');

			//adding all elements
			getSavingThrowElement.appendChild(listElement);
			getSavingThrowElement.appendChild(savingThrowButton);
			getSavingThrowElement.appendChild(savingThrowLabel);
			getSavingThrowElement.appendChild(breakLine);
		}

			characterSheetOverlayOpen = true;
    });
}

function showActions(adventureData, buttonPressed, characterData) {
	if (characterSheetOverlayOpen && buttonPressed == "null") {
		console.log('character sheet already open');
		return;
	}

	const content = document.getElementById('overlayContainer');
	content.innerHTML = ''; // Clear existing content

	chrome.storage.local.get('characterData', function (result) {
		const characterData = result.characterData;
		const stats = getCharacterStats(characterData);

		let characterHidden = "";

		// get the player's character's current hp
		// the current hp of the viewed character will be based on what the hp for their character is on cauldron
		for (let i = 0; i < adventureData.characters.character.length; i++) {
			if (adventureData.characters.character[i].name === characterData.name) {
				if (adventureData.characters.character[i].hidden === "yes") {
					characterHidden = "[hidden]";
				}
				break;
			}
		}

		var header = document.getElementById('titleBar');
		header.innerHTML = `${characterData.name} - Action ${characterHidden} <span class="glyphicon glyphicon-remove close" aria-hidden="true"></span>`;

		//closes the overlay on button click of the cross
		const closeButton = header.querySelector('.close');
		closeButton.addEventListener('click', function () {
			//overlayContainer.style.display = 'none';
			characterSheetOverlayOpen = false;

			const characterSheetOverlay = document.getElementById('customOverlay');
			if (characterSheetOverlay) {
				characterSheetOverlay.remove();
			}
		});

		const overlayBody = document.querySelector('.panel-body');
		overlayBody.innerHTML = `
            <style>
				.vertical-line {
				.vertical-line {
					border-left: 1px solid #000; /* Adjust the color and size as needed */
					height: 30px; /* Adjust the height as needed */
					margin: 0 10px; /* Adjust the margin as needed */
				}

				.bottom-right-container {
					position: absolute;
					bottom: 0;
					right: 0;
					margin-right: 700px; /* Adjust the margin as needed */
					margin-bottom: 30px; /* Adjust the margin as needed */
					border: 2px solid #336699;
					padding: 5px;
					width: 110px;
					height: 230px;
				}

				.bottom-right-button {
					font-size: 12px;
					width: 100px;
					height: 28px;
					margin-top: 10px;
					margin-left: 2px;
				}
			</style>
			<div>
				<div class="Character-menu-container" style="margin-top: -10px; height: 40px; margin-left: 455px;">
					<div class="character-menu" style="border: 2px solid #336699; padding 5px; height: 230px; width: 110px; margin-left: -120px;">
						<button id="actions" class="btn btn-primary btn-xs open_menu" style="font-size: 12px; margin-top: 10px; margin-left: 2px; width: 100px; height: 28px;">Actions</button>
						<button id="bio" class="btn btn-primary btn-xs open_menu" style="font-size: 12px; margin-top: -10px; margin-left: 2px; width: 100px; height: 28px;">Bio</button>
						<button id="character" class="btn btn-primary btn-xs open_menu" style="font-size: 12px; margin-top: -10px; margin-left: 2px; width: 100px; height: 28px;">Character</button>
						<button id="features" class="btn btn-primary btn-xs open_menu" style="font-size: 12px; margin-top: -10px; margin-left: 2px; width: 100px; height: 28px;">Features</button>
						<button id="inventory" class="btn btn-primary btn-xs open_menu" style="font-size: 12px; margin-top: -10px; margin-left: 2px; width: 100px; height: 28px;">Inventory</button>
						<button id="spells" class="btn btn-primary btn-xs open_menu" style="font-size: 12px; margin-top: -10px; margin-left: 2px; width: 100px; height: 28px;">Spells</button>
					</div>
				</div>
				<div id="actionsList" style="height: 495px; width: 345px; margin-left: -25px; margin-top: -50px; overflow: auto; border: 2px solid #336699; padding: 10px;">
					<ul id="ContentList">
						<p style="font-size: 20px;"><b>Actions</b></p>
						<div style="margin-left: 20px;">
							<ul id="actionList">
							    <div id="allActions">
									<p><b>Actions In Combat</b></p>
									<p style="max-width: 400px; font-size: 12px;">Attack, Cast a Spell, Dash, Disengage, Dodge, Grapple, Help, Hide, Improvise, Ready, Search, Shove, Use an Object</p>
									<button id="unarmedStrike"><b>Unarmed Strike</b></button>
									<label style="font-size: 22px;">｜</label>
									<label id="actionReach">reach: 5ft.</label>
									<label style="font-size: 22px;">｜</label>
									<button id="unarmedStrikeAttackRoll" class="unarmedStrikeAttackRoll">0</button>
									<hr>
								</div>
							</ul>
						</div>
					</ul>
				</div>
			</div>
			<div id="ammoList" style="border: 2px solid #336699; padding 5px; height: 230px; width: 110px; margin-left: 335px; margin-top: -230px;"></div>	
        `;

		//there should be two daggers, show one as melee stats, and one as ranged
		let secondDagger = false;
		//loop for weapons
		for (let i = 0; i < characterData.inventory.length; i++) {
			var allActionsDiv = overlayBody.querySelector('#allActions');

			const weaponReach = ["Glaive", "Halberd", "Lance", "Pike", "Whip"];
			const rangeWeapon = ["Crossbow, light", "Dart", "Shortbow", "Sling", "Blowgun", "Crossbow hand", "Crossbow, heavy", "Longbow", "Net"];

			if (characterData.inventory[i].definition.filterType === "Weapon" || characterData.inventory[i].definition.filterType === "Rod" || characterData.inventory[i].definition.filterType === "Staff") {
				const itemName = characterData.inventory[i].definition.name;
				const equiped = characterData.inventory[i].equiped;
				const range = characterData.inventory[i].definition.range;
				const longRange = characterData.inventory[i].definition.longRange;

				const characterLevel = calculateLevel(characterData.currentXp);
				const profBonus = calculateProf(characterLevel);

				//weapon
				var weaponButton = document.createElement('button');
				weaponButton.id = "weapon"
				weaponButton.style.fontWeight = 'bold';
				weaponButton.textContent = itemName;

				//label
				var splitLabel = document.createElement('label');
				splitLabel.style.fontSize = "22px";
				splitLabel.style.fontWeight = 'bold';
				splitLabel.textContent = "｜";

				//weapon reach
				if (secondDagger === true || rangeWeapon.includes(characterData.inventory[i].definition.type)) {
					var reachLabel = document.createElement('label');
					reachLabel.textContent = range + "/" + longRange + "ft.";
				} else {
					let reach = 5;
					if (characterData.race.baseName === "Bugbear") {
						reach += 5;
					}
					if (weaponReach.includes(characterData.inventory[i].definition.type)) {
						reach += 5;
					}

					var reachLabel = document.createElement('label');
					reachLabel.textContent = "Reach: " + String(reach) + "ft.";
				}

				//weapon attack roll
				var weaponAttackButton = document.createElement('button');
				weaponAttackButton.id = "weapon";

				if (secondDagger === true || rangeWeapon.includes(characterData.inventory[i].definition.type)) {
					const dex = Math.floor((stats.totalDexterity - 10) / 2);
					if (dex >= 0) {
						weaponAttackButton.textContent = "+" + Number(profBonus + dex);
					} else {
						weaponAttackButton.textContent = "-" + Number(profBonus + dex);
					}
				} else {
					const str = Math.floor((stats.totalStrength - 10) / 2);
					if (str >= 0) {
						weaponAttackButton.textContent = "+" + Number(profBonus + str)
					} else {
						weaponAttackButton.textContent = "-" + Number(profBonus + str)
					}
				}

				if (itemName === "Dagger") {
					secondDagger = true;
				}

				//label
				var SecondSplitLabel = document.createElement('label');
				SecondSplitLabel.style.fontSize = "22px";
				SecondSplitLabel.style.fontWeight = 'bold';
				SecondSplitLabel.textContent = "｜";

				//description
				var weaponDescription = document.createElement('label');
				weaponDescription.textContent = characterData.inventory[i].definition.description.replace(/<[^>]*>/g, '');

				const breakLine = document.createElement('hr');

				allActionsDiv.appendChild(weaponButton);
				allActionsDiv.appendChild(splitLabel);
				allActionsDiv.appendChild(reachLabel);
				allActionsDiv.appendChild(SecondSplitLabel);
				allActionsDiv.appendChild(weaponAttackButton);
				allActionsDiv.appendChild(weaponDescription);
				allActionsDiv.appendChild(breakLine);

				(function () {
					// Add a click event listener to the current weapon button
					const currentWeaponButton = weaponButton;
					const currentAttackRoll = weaponAttackButton;
					currentWeaponButton.addEventListener('click', function () {
						message = `${currentWeaponButton.textContent}\nReach: ${reachLabel.textContent}\nTo Hit: ${weaponAttackButton.textContent}\n${weaponDescription.textContent}`;
						sendDataToSidebar(message, characterData.name);
					});

					currentAttackRoll.addEventListener('click', function () {
						console.log('Weapon attack button pressed:', currentAttackRoll.textContent);
					});
				})();
			}
		}

		//for other none weapon actions
		for (let i = 0; i < characterData.actions.class.length; i++) {
			var allActionsDiv = overlayBody.querySelector('#allActions');
			const snippet = characterData.actions.class[i].snippet.toLowerCase();

			//name button
			var nameButton = null

			//label for description/snippet
			var snippetLabel = null

			//breakline
			var breakLine = null

			if (snippet.includes("as an action") || snippet.includes("your action")) {
				nameButton = document.createElement('button');
				nameButton.textContent = characterData.actions.class[i].name;
				nameButton.id = "actionName"
				nameButton.style.fontWeight = "bold";

				snippetLabel = document.createElement('label');
				snippetLabel.textContent = characterData.actions.class[i].snippet;

				breakLine = document.createElement('hr');
			}

			try {
				allActionsDiv.appendChild(nameButton);
				allActionsDiv.appendChild(snippetLabel);
				allActionsDiv.appendChild(breakLine);

				(function () {
					const currentALTWeapon = nameButton;
					const currentALTAttack =

						// Add a click event listener to the current weapon button
						currentALTWeapon.addEventListener('click', function () {
							// Handle the click event for the current weapon button
							console.log("Weapon button clicked:", currentALTWeapon.textContent);
							// Add your custom logic here
						});
				})();
			}
			catch { }
		}

		//feats
		for (let i = 0; i < characterData.actions.feat.length; i++) {
			var allActionsDiv = overlayBody.querySelector('#allActions');
			const snippet = characterData.actions.feat[i].snippet.toLowerCase();

			//name button
			var nameButton = null

			//label for description/snippet
			var snippetLabel = null

			//breakline
			var breakLine = null

			if (snippet.includes("as an action") || snippet.includes("use your action")) {
				nameButton = document.createElement('button');
				nameButton.textContent = characterData.actions.feat[i].name;
				nameButton.id = "actionName"
				nameButton.style.fontWeight = "bold";

				snippetLabel = document.createElement('label');
				snippetLabel.textContent = characterData.actions.feat[i].snippet;

				breakLine = document.createElement('hr');
			}

			try {
				allActionsDiv.appendChild(nameButton);
				allActionsDiv.appendChild(snippetLabel);
				allActionsDiv.appendChild(breakLine);

				(function () {
					const currentFeatsButton = nameButton;

					// Add a click event listener to the current weapon button
					currentFeatsButton.addEventListener('click', function () {
						// Handle the click event for the current weapon button
						console.log("Weapon button clicked:", currentFeatsButton.textContent);
						// Add your custom logic here
					});
				})();
			}
			catch { }
		}

		//race
		for (let i = 0; i < characterData.actions.race.length; i++) {
			var allActionsDiv = overlayBody.querySelector('#allActions');
			const snippet = characterData.actions.race[i].snippet.toLowerCase();

			//name button
			var nameButton = null

			//label for description/snippet
			var snippetLabel = null

			//breakline
			var breakLine = null

			if (snippet.includes("as an action") || snippet.includes("use your action")) {
				nameButton = document.createElement('button');
				nameButton.textContent = characterData.actions.race[i].name;
				nameButton.id = "actionName"
				nameButton.style.fontWeight = "bold";

				snippetLabel = document.createElement('label');
				snippetLabel.textContent = characterData.actions.race[i].snippet;

				breakLine = document.createElement('hr');
			}

			try {
				allActionsDiv.appendChild(nameButton);
				allActionsDiv.appendChild(snippetLabel);
				allActionsDiv.appendChild(breakLine);

				(function () {
					const currentRaceButton = nameButton;

					// Add a click event listener to the current weapon button
					currentRaceButton.addEventListener('click', function () {
						// Handle the click event for the current weapon button
						console.log("Weapon button clicked:", currentRaceButton.textContent);
						// Add your custom logic here
					});
				})();
			}
			catch { }
		}

		setTimeout(() => {
			let unarmedStrikeAttackRoll = document.getElementById('unarmedStrikeAttackRoll');
			if (unarmedStrikeAttackRoll) {
				const modifier = Math.floor((stats.totalStrength - 10) / 2);
				if (modifier > 0) {
					unarmedStrikeAttackRoll.textContent = "+" + modifier;
				} else {
					unarmedStrikeAttackRoll.textContent = "-" + modifier;
				}
			} else {
				console.error("Button not found.");
				console.error("Please refresh page");
			    if (confirm("The page needs to reload to continue using the Character Sheet!")) {
					window.location.reload();
				}
			}
		}, 0);

		//event listeners for the character buttons
		const actionButton = overlayBody.querySelector('#actions');
		actionButton.addEventListener('click', function () {
			console.log("action button pressed");
		});
		const bioButton = overlayBody.querySelector('#bio');
		bioButton.addEventListener('click', function () {
			console.log("bio button pressed");
			showBio(adventureData, buttonPressed, characterData);
		});

		const characterButton = overlayBody.querySelector('#character');
		characterButton.addEventListener('click', function () {
			console.log('character button pressed');
			const characterSheetOverlay = document.getElementById('customOverlay');
			characterSheetOverlay.remove();
			showCharacterSheet(adventureData);
		});

		const featuresButton = overlayBody.querySelector('#features');
		featuresButton.addEventListener('click', function () {
			console.log('features button pressed');
			showFeatures(adventureData, buttonPressed, characterData);
		});

		const inventoryButton = overlayBody.querySelector('#inventory');
		inventoryButton.addEventListener('click', function () {
			console.log('inventory button pressed');
			showInventory(adventureData, buttonPressed, characterData);
		});

		const spellsButton = overlayBody.querySelector('#spells');
		spellsButton.addEventListener('click', function () {
			console.log('spells button pressed');
			showSpells(adventureData, buttonPressed, characterData, stats);
		});

		const unarmedStrikeButton = overlayBody.querySelector('#unarmedStrike');
		const unarmedStrikeMod = overlayBody.querySelector('#unarmedStrikeAttackRoll')
		unarmedStrikeButton.addEventListener('click', function () {
			console.log('unarmed strike button pressed: ' + unarmedStrikeMod.textContent);
		});

		//shows ammo left in inventory
		const ammoList = ["Crossbow Bolts", "Arrows", "Sling Bullets", "Blowgun Needles"]
		for (let i = 0; i < characterData.inventory.length; i++) {
			var ammoDiv = overlayBody.querySelector('#ammoList');
			if (ammoList.includes(characterData.inventory[i].definition.name)) {
				console.log(characterData.inventory[i].definition.name);
				console.log(characterData.inventory[i].quantity);

				//name label
				var nameLabel = document.createElement('label');
				nameLabel.textContent = characterData.inventory[i].definition.name;
				nameLabel.style.fontSize = "11px";

				//splitLabel
				var splitLabel = document.createElement('label');
				splitLabel.textContent = " | ";
				splitLabel.style.fontSize = "16px";

				//amount of ammo
				var ammoAmountLabel = document.createElement('label');
				ammoAmountLabel.textContent = characterData.inventory[i].quantity;
				ammoAmountLabel.style.fontSize = "11px";

				//line
				const breakLine = document.createElement('hr');

				ammoDiv.appendChild(nameLabel);
				ammoDiv.appendChild(splitLabel);
				ammoDiv.appendChild(ammoAmountLabel);
				ammoDiv.appendChild(breakLine);
			}
		}

		// Append overlayBody to the document body
		content.appendChild(overlayBody);
	});
}

function showBio(adventureData, buttonPressed, characterData) {
	if (characterSheetOverlayOpen && buttonPressed == "null") {
		console.log('character sheet already open');
		return;
	}

	const content = document.getElementById('overlayContainer');
	content.innerHTML = ''; // Clear existing content

	let characterHidden = "";

	// get the player's character's current hp
	// the current hp of the viewed character will be based on what the hp for their character is on cauldron
	for (let i = 0; i < adventureData.characters.character.length; i++) {
		if (adventureData.characters.character[i].name === characterData.name) {
			if (adventureData.characters.character[i].hidden === "yes") {
				characterHidden = "[hidden]";
			}
			break;
		}
	}

	var header = document.getElementById('titleBar');
	header.innerHTML = `${characterData.name} - Bio ${characterHidden} <span class="glyphicon glyphicon-remove close" aria-hidden="true"></span>`;

	//closes the overlay on button click of the cross
	const closeButton = header.querySelector('.close');
	closeButton.addEventListener('click', function () {
		//overlayContainer.style.display = 'none';
		characterSheetOverlayOpen = false;

		const characterSheetOverlay = document.getElementById('customOverlay');
		if (characterSheetOverlay) {
			characterSheetOverlay.remove();
		}
	});

	const overlayBody = document.querySelector('.panel-body');
	overlayBody.innerHTML = `
			<div id="overlayContainer">
				<div class="Character-menu-container" style="margin-top: -10px; height: 40px; margin-left: 465px;">
					<div class="character-menu" style="border: 2px solid #336699; padding 5px; height: 230px; width: 110px; margin-left: -120px;">
						<button id="actions" class="btn btn-primary btn-xs open_menu" style="font-size: 12px; margin-top: 10px; margin-left: 2px; width: 100px; height: 28px;">Actions</button>
						<button id="bio" class="btn btn-primary btn-xs open_menu" style="font-size: 12px; margin-top: -10px; margin-left: 2px; width: 100px; height: 28px;">Bio</button>
						<button id="character" class="btn btn-primary btn-xs open_menu" style="font-size: 12px; margin-top: -10px; margin-left: 2px; width: 100px; height: 28px;">Character</button>
						<button id="features" class="btn btn-primary btn-xs open_menu" style="font-size: 12px; margin-top: -10px; margin-left: 2px; width: 100px; height: 28px;">Features</button>
						<button id="inventory" class="btn btn-primary btn-xs open_menu" style="font-size: 12px; margin-top: -10px; margin-left: 2px; width: 100px; height: 28px;">Inventory</button>
						<button id="spells" class="btn btn-primary btn-xs open_menu" style="font-size: 12px; margin-top: -10px; margin-left: 2px; width: 100px; height: 28px;">Spells</button>
					</div>
				</div>
				<div class="bioDiv" style="height: 495px; width: 345px; margin-left: -10px; margin-top: -40px; overflow: auto; border: 2px solid #336699; padding: 10px;">
					<ul id="ContentList">
						<button id=bioButton style="font-size: 20px;"><b>Backstory</b></button>
						<div id="backstoryDiv" style="margin-left: 20px;">
							<label style="font-size: 13px;">${characterData.notes.backstory ? characterData.notes.backstory : ""}</label>
						</div>
						<button id=bioButton style="font-size: 20px;"><b>Allies</b></button>
						<div id="alliesDiv" style="margin-left: 20px;">
							<label style="font-size: 13px;">${characterData.notes.allies ? characterData.notes.allies : ""}</label>
						</div>
						<button id=bioButton style="font-size: 20px;"><b>Enemies</b></button>
						<div id="enemiesDiv" style="margin-left: 20px;">
							<label style="font-size: 13px;">${characterData.notes.enemies ? characterData.notes.enemies : ""}</label>
						</div>
						<button id=bioButton style="font-size: 20px;"><b>Organizations</b></button>
						<div id="organizationsDiv" style="margin-left: 20px;">
							<label style="font-size: 13px;">${characterData.notes.organizations ? characterData.notes.organizations : ""}</label>
						</div>
						<button id=bioButton style="font-size: 20px;"><b>Other holdings</b></button>
						<div id="otherHoldingsDiv" style="margin-left: 20px;">
							<label style="font-size: 13px;">${characterData.notes.otherHoldings ? characterData.notes.otherHoldings : ""}</label>
						</div>
						<button id=bioButton style="font-size: 20px;"><b>Other Notes</b></button>
						<div id="otherNotesDiv" style="margin-left: 20px;">
							<label style="font-size: 13px;">${characterData.notes.otherNotes ? characterData.notes.otherNotes : ""}</label>
						</div>
						<button id=bioButton style="font-size: 20px;"><b>Personal Possessions</b></button>
						<div id="personalPossessionsDiv" style="margin-left: 20px;">
							<label style="font-size: 13px;">${characterData.notes.personalPossessions ? characterData.notes.personalPossessions : ""}</label>
						</div>
						<button id=bioButton style="font-size: 20px;"><b>Background: ${characterData.background.definition.name}</b></button>
						<div id="backgroundDescription" style="margin-left: 20px;">
							<label style="font-size: 13px;">${removeHtmlTags(characterData.background.definition.shortDescription)}
						</div>
						<button id=bioButton style="font-size: 12px;"><b>Background Feature: ${characterData.background.definition.featureName}</b></button>
						<div id="backgroundFeature" style="margin-left: 20px;">
							<label style="font-size: 13px;">${removeHtmlTags(characterData.background.definition.featureDescription)}
						</div>
						<button id=bioButton style="font-size: 16px;"><b>Appearance</b></button>
						<div id="apperance" style="margin-left: 20px;">
							<label style="font-size: 13px;">${characterData.traits.appearance ? characterData.traits.appearance : ""}
						</div>
						<button id=bioButton style="font-size: 16px;"><b>Bond</b></button>
						<div id="bond" style="margin-left: 20px;">
							<label style="font-size: 13px;">${characterData.traits.bonds}
						</div>
						<button id=bioButton style="font-size: 16px;"><b>Flaws</b></button>
						<div id="flaws" style="margin-left: 20px;">
							<label style="font-size: 13px;">${characterData.traits.flaws}
						</div>
						<button id=bioButton style="font-size: 16px;"><b>Ideals</b></button>
						<div id="ideals" style="margin-left: 20px;">
							<label style="font-size: 13px;">${characterData.traits.ideals}
						</div>
						<button id=bioButton style="font-size: 16px;"><b>Personality Traits</b></button>
						<div id="personalityTraits" style="margin-left: 20px;">
							<label style="font-size: 13px;">${characterData.traits.personalityTraits}
						</div>
					</ul>
				</div>
			</div>
    `;
	//event listeners for the character buttons
	const actionButton = overlayBody.querySelector('#actions');
	actionButton.addEventListener('click', function () {
		console.log("action button pressed");
		showActions(adventureData, buttonPressed, characterData);
	});

	const bioButton = overlayBody.querySelector('#bio');
	bioButton.addEventListener('click', function () {
		console.log("bio button pressed");
		//showBio(adventureData);
	});

	const characterButton = overlayBody.querySelector('#character');
	characterButton.addEventListener('click', function () {
		console.log('character button pressed');
		const characterSheetOverlay = document.getElementById('customOverlay');
		characterSheetOverlay.remove();
		showCharacterSheet(adventureData);
	});

	const featuresButton = overlayBody.querySelector('#features');
	featuresButton.addEventListener('click', function () {
		console.log('features button pressed');
		showFeatures(adventureData, buttonPressed, characterData);
	});

	const inventoryButton = overlayBody.querySelector('#inventory');
	inventoryButton.addEventListener('click', function () {
		console.log('inventory button pressed');
		showInventory(adventureData, buttonPressed);
	});

	const spellsButton = overlayBody.querySelector('#spells');
	spellsButton.addEventListener('click', function () {
		console.log('spells button pressed');
		showSpells(adventureData, buttonPressed, characterData, stats);
	});
	content.appendChild(overlayBody);
}

function showFeatures(adventureData, buttonPressed, characterData) {
	if (characterSheetOverlayOpen && buttonPressed == "null") {
		console.log("character sheet already open");
		return;
	}

	const content = document.getElementById('overlayContainer');
	content.innerHTML = ''; //clear existing content

	let characterHidden = "";

	for (let i = 0; i < adventureData.characters.character.length; i++) {
		if (adventureData.characters.character[i].name === characterData.name) {
			if (adventureData.characters.character[i].hidden === "yes") {
				characterHidden = "[hidden]";
			}
			break;
		}
	}

	var header = document.getElementById('titleBar');
	header.innerHTML = `${characterData.name} - Features ${characterHidden} <span class="glyphicon glyphicon-remove close" aria-hidden="true"></span>`;

	//closes the overlay on button click of the cross
	const closeButton = header.querySelector('.close');
	closeButton.addEventListener('click', function () {
		//overlayContainer.style.display = 'none';
		characterSheetOverlayOpen = false;

		const characterSheetOverlay = document.getElementById('customOverlay');
		if (characterSheetOverlay) {
			characterSheetOverlay.remove();
		}
	});

	const overlayBody = document.querySelector('.panel-body');
	overlayBody.innerHTML = `
			<div id="overlayContainer">
				<div class="Character-menu-container" style="margin-top: -10px; height: 40px; margin-left: 465px;">
					<div class="character-menu" style="border: 2px solid #336699; padding 5px; height: 230px; width: 110px; margin-left: -120px;">
						<button id="actions" class="btn btn-primary btn-xs open_menu" style="font-size: 12px; margin-top: 10px; margin-left: 2px; width: 100px; height: 28px;">Actions</button>
						<button id="bio" class="btn btn-primary btn-xs open_menu" style="font-size: 12px; margin-top: -10px; margin-left: 2px; width: 100px; height: 28px;">Bio</button>
						<button id="character" class="btn btn-primary btn-xs open_menu" style="font-size: 12px; margin-top: -10px; margin-left: 2px; width: 100px; height: 28px;">Character</button>
						<button id="features" class="btn btn-primary btn-xs open_menu" style="font-size: 12px; margin-top: -10px; margin-left: 2px; width: 100px; height: 28px;">Features</button>
						<button id="inventory" class="btn btn-primary btn-xs open_menu" style="font-size: 12px; margin-top: -10px; margin-left: 2px; width: 100px; height: 28px;">Inventory</button>
						<button id="spells" class="btn btn-primary btn-xs open_menu" style="font-size: 12px; margin-top: -10px; margin-left: 2px; width: 100px; height: 28px;">Spells</button>
					</div>
				</div>
				<div class="featureDiv" style="height: 495px; width: 345px; margin-left: -10px; margin-top: -40px; overflow: auto; border: 2px solid #336699; padding: 10px;">
					<ul id="actionList">
						<div id="allActions">
						</div>
					</ul>
				<div>
			</div>
	`;


	var listFeatures = [];

	const actionTypes = ['class', 'background', 'feat', 'item', 'race'];

	// Iterate over each action type
	actionTypes.forEach(actionType => {
   		try {
     		    // Get the array of actions based on the current action type
     	  	    const actions = actionType === 'class' ? characterData.actions[actionType] : characterData.actions[actionType];

        	    // Loop through the actions array and add elements to the listFeatures array
               	actions.forEach(action => {
					var allActionsDiv = document.querySelector('#allActions');

         	        var featureNameButton = document.createElement('button');
         	        featureNameButton.id = "featureButton";
         	        featureNameButton.textContent = action.name;

           	        var featureDescription = document.createElement('p');
            	        featureDescription.textContent = descriptionToCharacterData(action.snippet, characterData, stats);

           	        var breakline = document.createElement('hr');

            	    // Add all elements to the listFeatures array
            	    listFeatures.push([featureNameButton, featureDescription, breakline]);
       		    });
    		} catch (error) {
        	    console.log(`Error processing ${actionType} actions:`, error);
    		}
	    });

	const optionTypes = ['class', 'background', 'feat', 'item', 'race'];

	// Iterate over each option type
	optionTypes.forEach(optionType => {
    		try {
        	    // Get the array of options based on the current option type
        	    const options = characterData.options[optionType];

        	    // Loop through the options array and add elements to the listFeatures array
        	    options.forEach(option => {
            		var allActionsDiv = document.querySelector('#allActions');

            		var featureNameButton = document.createElement('button');
            		featureNameButton.id = "featureButton";
            		featureNameButton.textContent = option.definition.name;

            		var featureDescription = document.createElement('p');
            		featureDescription.textContent = descriptionToCharacterData(option.definition.snippet, characterData, stats);

            		var breakline = document.createElement('hr');

            		// Add all elements to the listFeatures array
            		listFeatures.push([featureNameButton, featureDescription, breakline]);
        	    });
    		} catch {}
	});

	listFeatures.sort((a, b) => {
    		// Check if either 'a' or 'b' is undefined
    		if (!a || !a[0].innerHTML) return -1; // 'a' comes before 'b'
    		if (!b || !b[0].innerHTML) return 1; // 'b' comes before 'a'
    		return a[0].innerHTML.localeCompare(b[0].innerHTML);
		});

	for (let i = 0; i<listFeatures.length; i++) {
		var allFeaturesDiv = document.querySelector('#allActions');

		for (let j = 0; j<listFeatures[i].length; j++) {
		    allFeaturesDiv.appendChild(listFeatures[i][j]);
		}

	}

	//event listeners for the character buttons
	const actionButton = overlayBody.querySelector('#actions');
	actionButton.addEventListener('click', function () {
		console.log("action button pressed");
		showActions(adventureData, buttonPressed, characterData);
	});

	const bioButton = overlayBody.querySelector('#bio');
	bioButton.addEventListener('click', function () {
		console.log("bio button pressed");
		showBio(adventureData, buttonPressed, characterData);
	});

	const characterButton = overlayBody.querySelector('#character');
	characterButton.addEventListener('click', function () {
		console.log('character button pressed');
		const characterSheetOverlay = document.getElementById('customOverlay');
		characterSheetOverlay.remove();
		showCharacterSheet(adventureData);
	});

	const featuresButton = overlayBody.querySelector('#features');
	featuresButton.addEventListener('click', function () {
		console.log('features button pressed');
	});

	const inventoryButton = overlayBody.querySelector('#inventory');
	inventoryButton.addEventListener('click', function () {
		console.log('inventory button pressed');
		showInventory(adventureData, buttonPressed, characterData);
	});

	const spellsButton = overlayBody.querySelector('#spells');
	spellsButton.addEventListener('click', function () {
		console.log('spells button pressed');
		showSpells(adventureData, buttonPressed, characterData, stats);
	});

	content.appendChild(overlayBody);
}

function showInventory(adventureData, buttonPressed, characterData) {
	if (characterSheetOverlayOpen && buttonPressed == "null") {
		console.log("character sheeta already open");
		return;
	}

	const content = document.getElementById('overlayContainer');
	content.innerHTML = ''; //clear existing content

	let characterHidden = "";

	for (let i = 0; i < adventureData.characters.character.length; i++) {
		if (adventureData.characters.character[i].name === characterData.name) {
			if (adventureData.characters.character[i].hidden === "yes") {
				characterHidden = "[hidden]";
			}
			break;
		}
	}

	var header = document.getElementById('titleBar');
	header.innerHTML = `${characterData.name} - Inventory ${characterHidden} <span class="glyphicon glyphicon-remove close" aria-hidden="true"></span>`;

	//closes the overlay on button click of the cross
	const closeButton = header.querySelector('.close');
	closeButton.addEventListener('click', function () {
		//overlayContainer.style.display = 'none';
		characterSheetOverlayOpen = false;

		const characterSheetOverlay = document.getElementById('customOverlay');
		if (characterSheetOverlay) {
			characterSheetOverlay.remove();
		}
	});

	const overlayBody = document.querySelector('.panel-body');
	overlayBody.innerHTML = `
		<style>
			.buttonNameWrap {
			white-space: normal; 
			width: 120px; 
			font-style: italic;
			background-color: white;
			color: #6385C1;
			padding: 5px;
			border: 1px solid black;
			border-radius: 5px;
			cursor: pointer;
			font-size: 15px;
			}
			buttonNameWrap:hover {
			    background-color: white;
			}
			.hrBreakline {
				margin: 0;
				padding: 20;
			}
		</style>
		<div id="overlayContainer">
			<div class="Character-menu-container" style="margin-top: -10px; height: 40px; margin-left: 465px;">
				<div class="character-menu" style="border: 2px solid #336699; padding 5px; height: 230px; width: 110px; margin-left: -120px;">
					<button id="actions" class="btn btn-primary btn-xs open_menu" style="font-size: 12px; margin-top: 10px; margin-left: 2px; width: 100px; height: 28px;">Actions</button>
					<button id="bio" class="btn btn-primary btn-xs open_menu" style="font-size: 12px; margin-top: -10px; margin-left: 2px; width: 100px; height: 28px;">Bio</button>
					<button id="character" class="btn btn-primary btn-xs open_menu" style="font-size: 12px; margin-top: -10px; margin-left: 2px; width: 100px; height: 28px;">Character</button>
					<button id="features" class="btn btn-primary btn-xs open_menu" style="font-size: 12px; margin-top: -10px; margin-left: 2px; width: 100px; height: 28px;">Features</button>
					<button id="inventory" class="btn btn-primary btn-xs open_menu" style="font-size: 12px; margin-top: -10px; margin-left: 2px; width: 100px; height: 28px;">Inventory</button>
					<button id="spells" class="btn btn-primary btn-xs open_menu" style="font-size: 12px; margin-top: -10px; margin-left: 2px; width: 100px; height: 28px;">Spells</button>
				</div>
			</div>
			<div id="currencyList" style="border: 2px solid #336699; padding 5px; height: 230px; width: 110px; margin-left: 345px; margin-top: 220px;">
				<div style="margin-top: 25px; margin-left: 5px;">
					<label style="margin-left: 10px;">PP&nbsp:&nbsp &nbsp ${characterData.currencies.pp}</label>
					<hr class="hrBreakline">
					<label style="margin-left: 10px;">GP&nbsp:&nbsp &nbsp ${characterData.currencies.gp}</label>
					<hr class="hrBreakline">
					<label style="margin-left: 10px;">EP&nbsp:&nbsp &nbsp ${characterData.currencies.ep}</label>
					<hr class="hrBreakline">
					<label style="margin-left: 10px;">SP&nbsp:&nbsp &nbsp ${characterData.currencies.sp}</label>
					<hr class="hrBreakline">
					<label style="margin-left: 10px;">CP&nbsp:&nbsp &nbsp ${characterData.currencies.cp}</label>
				</div>
			</div>
			<div class="inventoryDiv" style="height: 495px; width: 345px; margin-left: -10px; margin-top: -490px; overflow: auto; border: 2px solid #336699; padding: 10px;">
				<ul id="inventoryList">
					<div id="allInventory">
						<h6><b>Equipment &nbsp &nbsp &nbsp &nbsp &nbsp &nbsp &nbsp &nbsp &nbsp &nbsp &nbsp &nbsp Quantity&nbsp &nbsp &nbsp &nbsp &nbsp &nbsp &nbsp &nbsp &nbsp Cost(GP)</b></h6>
					</div>
				</ul>
			<div>
		</div>
	`;

	for (let i = 0; i < characterData.inventory.length; i++) {
		var allInventoryDiv = document.querySelector('#allInventory');

		//button for item name
		var itemButton = document.createElement('button');
		itemButton.style.fontSize = '13px';
		itemButton.style.fontWeight = 'bold';
		itemButton.textContent = characterData.inventory[i].definition.name;
		itemButton.classList = 'buttonNameWrap';

		//quantity label
		var quantityLabel = document.createElement('label');
		quantityLabel.textContent = characterData.inventory[i].quantity;
		quantityLabel.style.position = "relative";
		quantityLabel.style.left = "40px";

		//cost label
		var costLabel = document.createElement('label');
		costLabel.textContent = characterData.inventory[i].definition.cost;
		costLabel.style.position = "relative";
		costLabel.style.left = "120px";

		var itemDescription = document.createElement('label');
		itemDescription.textContent = removeHtmlTags(characterData.inventory[i].definition.description);

		//breakline
		const breakline = document.createElement('hr');

		allInventoryDiv.appendChild(itemButton);
		allInventoryDiv.appendChild(quantityLabel);
		allInventoryDiv.appendChild(costLabel);
		allInventoryDiv.appendChild(itemDescription);
		allInventoryDiv.appendChild(breakline);
	}

	//event listeners for the character buttons
	const actionButton = overlayBody.querySelector('#actions');
	actionButton.addEventListener('click', function () {
		console.log("action button pressed");
		showActions(adventureData, buttonPressed, characterData);
	});

	const bioButton = overlayBody.querySelector('#bio');
	bioButton.addEventListener('click', function () {
		console.log("bio button pressed");
		showBio(adventureData, buttonPressed, characterData);
	});

	const characterButton = overlayBody.querySelector('#character');
	characterButton.addEventListener('click', function () {
		console.log('character button pressed');
		const characterSheetOverlay = document.getElementById('customOverlay');
		characterSheetOverlay.remove();
		showCharacterSheet(adventureData);
	});

	const featuresButton = overlayBody.querySelector('#features');
	featuresButton.addEventListener('click', function () {
		console.log('features button pressed');
		showFeatures(adventureData, buttonPressed, characterData);
	});

	const inventoryButton = overlayBody.querySelector('#inventory');
	inventoryButton.addEventListener('click', function () {
		console.log('inventory button pressed');
	});

	const spellsButton = overlayBody.querySelector('#spells');
	spellsButton.addEventListener('click', function () {
		console.log('spells button pressed');
		showSpells(adventureData, buttonPressed, characterData, stats);
	});

	content.appendChild(overlayBody);
}

function showSpells(adventureData, buttonPressed, characterData, stats) {
	if (characterSheetOverlayOpen && buttonPressed == "null") {
		console.log("Character sheet already open");
		return;
	}

	const content = document.querySelector('#overlayContainer');
	content.innerHTML = '';

	let characterHidden = '';

	for (let i = 0; i < adventureData.characters.character.length; i++) {
		if (adventureData.characters.character[i].name === characterData.name) {
			if (adventureData.characters.character[i].hidden === "yes") {
				characterHidden = "[hidden]";
			}
			break;
		}
	}

	const abilityScores = ['Strength', 'Dexterity', 'Constitution', 'Intelligence', 'Wisdom', 'Charisma'];
	var header = document.getElementById('titleBar');
	header.innerHTML = `${characterData.name} - Spells ${characterHidden} <span class="glyphicon glyphicon-remove close" aria-hidden="true"></span>`;

	//closes the overlay on button click of the cross
	const closeButton = header.querySelector('.close');
	closeButton.addEventListener('click', function () {
		//overlayContainer.style.display = 'none';
		characterSheetOverlayOpen = false;

		const characterSheetOverlay = document.getElementById('customOverlay');
		if (characterSheetOverlay) {
			characterSheetOverlay.remove();
		}
	});

	// Retrieve spell slots and assign to spellSlotData
	getSpellSlots(function (data) {
		if (data) {
			const overlayBody = document.querySelector('.panel-body');
			overlayBody.innerHTML = `
			<style>
				.buttonNameWrap {
					white-space: normal; 
					width: 120px; 
					font-style: italic;
					background-color: white;
					color: #6385C1;
					padding: 5px;
					border: 1px solid black;
					border-radius: 5px;
					cursor: pointer;
					font-size: 15px;
					}
					buttonNameWrap:hover {
						background-color: white;
					}
					.hrBreakline {
						margin: 0;
						padding: 20;
					}
			</style>
			<div id="overlayContainer">
				<div class="Character-menu-container" style="margin-top: -10px; height: 40px; margin-left: 465px;">
					<div class="character-menu" style="border: 2px solid #336699; padding 5px; height: 230px; width: 110px; margin-left: -120px;">
			    		<button id="actions" class="btn btn-primary btn-xs open_menu" style="font-size: 12px; margin-top: 10px; margin-left: 2px; width: 100px; height: 28px;">Actions</button>
					<button id="bio" class="btn btn-primary btn-xs open_menu" style="font-size: 12px; margin-top: -10px; margin-left: 2px; width: 100px; height: 28px;">Bio</button>
					<button id="character" class="btn btn-primary btn-xs open_menu" style="font-size: 12px; margin-top: -10px; margin-left: 2px; width: 100px; height: 28px;">Character</button>
					<button id="features" class="btn btn-primary btn-xs open_menu" style="font-size: 12px; margin-top: -10px; margin-left: 2px; width: 100px; height: 28px;">Features</button>
					<button id="inventory" class="btn btn-primary btn-xs open_menu" style="font-size: 12px; margin-top: -10px; margin-left: 2px; width: 100px; height: 28px;">Inventory</button>
					<button id="spells" class="btn btn-primary btn-xs open_menu" style="font-size: 12px; margin-top: -10px; margin-left: 2px; width: 100px; height: 28px;">Spells</button>
					</div>
				</div>
				<div id="SpellInformation" style="border: 2px solid #336699; padding 5px; height: 230px; width: 110px; margin-left: 345px; margin-top: 220px;">
					<div style="margin-top: 25px; margin-left: 5px;">
					<label class=spellAbility>Spell Ability: ${abilityScores[characterData.classes[0].definition.spellCastingAbilityId - 1]}</label>
					<label class=spellSaveDc>Spell Save DC: ${characterData.classes[0].definition.hitDice + calculateProf(characterData.classes[0].level) + Math.floor((stats.totalCharisma - 10) / 2)}</label>
					<label class=SpellAttack>Spell Attack: ${calculateProf(characterData.classes[0].level) + Math.floor((stats.totalCharisma - 10) / 2)}</label>
					<label style="margin-left: 10px;">
					<hr class="hrBreakline">
					<label style="margin-left: 10px;">
					<hr class="hrBreakline">
					<label style="margin-left: 10px;">
					</div>
				</div>
				<div class="spellDiv" style="height: 495px; width: 345px; margin-left: -10px; margin-top: -490px; overflow: auto; border: 2px solid #336699; padding: 10px;">
					<ul id="spellList">
					<div id="allSpells">
							<h4><b>Name&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbspTime&nbsp&nbsp&nbspRange&nbsp&nbsp&nbspAoE</b></h4>
						<div id="level0">
							<h2><b>Cantrips</b></h2>
						</div>
						<div id="level1">
						<h2><b>Level 1</b></h2>
						<p>Spell Slots&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbspExpended Spell Slots</p>
						<div style="display: flex; justify-content: space-between;">
    							<input class="spellSlots" placeholder="${characterData.spellSlots[0].available}" disabled=true style="width: 40px;">
							<div style="width: 5px;"></div>
    							<input class="maxHitPoints" value="${data[0].used}" disabled=true style="width: 40px;">
						</div>
						<br>
						</div>
						<div id="level2">
  							<h2><b>Level 2</b></h2>
							<p>Spell Slots&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbspExpended Spell Slots</p>
						<div style="display: flex; justify-content: space-between;">
    							<input class="spellSlots" placeholder="${characterData.spellSlots[1].available}" disabled=true style="width: 40px;">
							<div style="width: 5px;"></div>
    							<input class="maxHitPoints" value="${data[1].used}" disabled=true style="width: 40px;">
						</div>
						<br>
						</div>
						<div id="level3">
  							<h2><b>Level 3</b></h2>
						<p>Spell Slots&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbspExpended Spell Slots</p>
						<div style="display: flex; justify-content: space-between;">
    							<input class="spellSlots" placeholder="${characterData.spellSlots[2].available}" disabled=true style="width: 40px;">
							<div style="width: 5px;"></div>
    							<input class="maxHitPoints" value="${data[2].used}" disabled=true style="width: 40px;">
						</div>
						<br>
						</div>
						<div id="level4">
   							<h2><b>Level 4</b></h2>
						<p>Spell Slots&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbspExpended Spell Slots</p>
						<div style="display: flex; justify-content: space-between;">
    							<input class="spellSlots" placeholder="${characterData.spellSlots[3].available}" disabled=true style="width: 40px;">
							<div style="width: 5px;"></div>
    							<input class="maxHitPoints" value="${data[3].used}" disabled=true style="width: 40px;">
						</div>
						<br>
						</div>
						<div id="level5">
   							<h2><b>Level 5</b></h2>
						<p>Spell Slots&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbspExpended Spell Slots</p>
						<div style="display: flex; justify-content: space-between;">
    							<input class="spellSlots" placeholder="${characterData.spellSlots[4].available}" disabled=true style="width: 40px;">
							<div style="width: 5px;"></div>
    							<input class="usedSpellSlots" value="${data[4].used}" disabled=true style="width: 40px;">
						</div>
						<br>
						</div>
						<div id="level6">
  							<h2><b>Level 6</b></h2>
						<p>Spell Slots&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbspExpended Spell Slots</p>
						<div style="display: flex; justify-content: space-between;">
    							<input class="spellSlots" placeholder="${characterData.spellSlots[5].available}" disabled=true style="width: 40px;">
							<div style="width: 5px;"></div>
    							<input class="usedSpellSlots" value="${data[5].used}" disabled=true style="width: 40px;">
						</div>
						<br>
						</div>
						<div id="level7">
  							<h2><b>Level 7</b></h2>
						<p>Spell Slots&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbspExpended Spell Slots</p>
						<div style="display: flex; justify-content: space-between;">
    							<input class="spellSlots" placeholder="${characterData.spellSlots[6].available}" disabled=true style="width: 40px;">
							<div style="width: 5px;"></div>
    							<input class="usedSpellSlots" value="${data[6].used}" disabled=true style="width: 40px;">
						</div>
						<br>
						</div>
						<div id="level8">
  							<h2><b>Level 8</b></h2>
						<p>Spell Slots&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbspExpended Spell Slots</p>
						<div style="display: flex; justify-content: space-between;">
    							<input class="spellSlots" placeholder="${characterData.spellSlots[7].available}" disabled=true style="width: 40px;">
							<div style="width: 5px;"></div>
    							<input class="usedSpellSlots" value="${data[7].used}" disabled=true style="width: 40px;">
						</div>
						<br>
						</div>
						<div id="level9">
  							<h2><b>Level 9</b></h2>
						<p>Spell Slots&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbspExpended Spell Slots</p>
						<div style="display: flex; justify-content: space-between;">
    							<input class="spellSlots" placeholder="${characterData.spellSlots[8].available}" disabled=true style="width: 40px;">
							<div style="width: 5px;"></div>
    							<input class="usedSpellSlots" value="${data[8].used}" disabled=true style="width: 40px;">
						</div>
						<br>
						</div>
					</div>
					</ul>
				</div>
			</div>
			`;

			if (characterData.classes[0].definition.name === "Warlock") {
				const characterLevel = calculateLevel(characterData.currentXp);
				var spellSlotElements = document.getElementsByClassName('spellSlots');
				for (var i = 0, length = spellSlotElements.length; i < length; i++) {
					if (characterLevel === 1) {
						spellSlotElements[i].disabled = false;
						spellSlotElements[i].value = 1;
						spellSlotElements[i].disabled = true;
					} else if (characterLevel > 1 && characterLevel < 11) {
						spellSlotElements[i].disabled = false;
						spellSlotElements[i].value = 2;
						spellSlotElements[i].disabled = true;
					} else if (characterLevel > 10 && characterLevel < 17) {
						spellSlotElements[i].disabled = false;
						spellSlotElements[i].value = 3;
						spellSlotElements[i].disabled = true;
					} else if (characterLevel > 16 && characterLevel < 20) {
						spellSlotElements[i].disabled = false;
						spellSlotElements[i].value = 4;
						spellSlotElements[i].disabled = true;
					} else if (characterLevel === 20) {
						spellSlotElements[i].disabled = false;
						spellSlotElements[i].value = 5;
						spellSlotElements[i].disabled = true;
					}
				}
			}

			//characterData.spells.items is not included as this is for items that give the player spells which in the list of spells would be confusing
			//because spell items doesn't specif where they came from (e.g. a helment) then it isn't wise to put the spell in with the rest of them.;
			const spellLocation = [characterData.classSpells[0].spells, characterData.spells.class, characterData.spells.race, characterData.spells.feat]
			let = spellInformation = {};
			let level = 0

			for (let j = 0; j < spellLocation.length; j++) {
				for (let l = -1; l < level; l++) {
					for (let i = 0; i < spellLocation[j].length; i++) {
						var allSpellDiv = document.querySelector('#allSpells');
						var cantripsDiv = document.getElementById('level0');
						var level1Div = document.getElementById('level1');
						var level2Div = document.getElementById('level2');
						var level3Div = document.getElementById('level3');
						var level4Div = document.getElementById('level4');
						var level5Div = document.getElementById('level5');
						var level6Div = document.getElementById('level6');
						var level7Div = document.getElementById('level7');
						var level8Div = document.getElementById('level8');
						var level9Div = document.getElementById('level9');
						var time = spellLocation[j][i].activation.activationTime;
						var type = spellLocation[j][i].activation.activationType;
						var range = spellLocation[j][i].range.rangeValue;
						var areaOfEffect = spellLocation[j][i].range.aoeValue;
						var areaOfEffectShape = spellLocation[j][i].range.aoeType;

						//name of spell button
						var nameButton = document.createElement('button');
						nameButton.style.fontSize = '13px';
						nameButton.style.fontWeight = 'bold';

						if (spellLocation[j][i].usesSpellSlot == false) {
							nameButton.textContent = spellLocation[j][i].definition.name + " (At Will)";
						} else {
							nameButton.textContent = spellLocation[j][i].definition.name;
						}
						nameButton.classList = 'buttonNameWrap';

						timeLabel = document.createElement('label');
						timeLabel.id = "spellTime";
						timeLabel.style.fontSize = '13px';
						timeLabel.style.fontWeight = 'bold';
						timeLabel.style.padding = '8px';

						rangeLabel = document.createElement('label');
						rangeLabel.id = 'spellRange';
						rangeLabel.style.fontWeight = 'bold';
						rangeLabel.style.padding = '8px';
						rangeLabel.textContent = range + " ft."

						aoeLabel = document.createElement('label');
						aoeLabel.id = 'aoeRange';
						aoeLabel.style.fontSize = '13px';
						aoeLabel.style.fontWeight = 'bold';
						aoeLabel.style.padding = '8px';

						if (areaOfEffect != null) {
							aoeLabel.textContent = areaOfEffect + ' ft. - ' + areaOfEffectShape;
						} else {
							aoeLabel.textContent = " -- ";
						}

						if (type == 1) {
							timeLabel.textContent = time + "A";
						} else if (type == 3) {
							timeLabel.textContent = time + "BA";
						} else if (type == 4) {
							timeLabel.textContent = time + "R";
						} else if (type == 6) {
							timeLabel.textContent = time + "M";
						} else if (type == 7) {
							timeLabel.textContent = time + "H";
						}

						nameButton.addEventListener('click', function () {
							var type = spellLocation[j][i].activation.activationType;
							var time = spellLocation[j][i].activation.activationTime;

							spellInformation["name"] = spellLocation[j][i].definition.name;//spell name

							//spell school and level
							if (spellLocation[j][i].definition.level === 0) {
								spellInformation["school level"] = spellLocation[j][i].definition.school + " Cantrip"
							} else {
								if (spellLocation[j][i].definition.ritual != false) {
									spellInformation["school level"] = spellLocation[j][i].definition.school + " Level " + spellLocation[j][i].definition.level + " (ritual)";
								} else {
									spellInformation["school level"] = spellLocation[j][i].definition.school + " Level " + spellLocation[j][i].definition.level;
								}
							}

							//casting time
							if (type == 1) {
								spellInformation["casting time"] = "Casting Time: " + time + " Action";
							} else if (type == 3) {
								spellInformation["casting time"] = "Casting Time: " + time + " Bonus Action";
							} else if (type == 4) {
								spellInformation["casting time"] = "Casting Time: " + time + " Reaction";
							} else if (type == 6) {
								if (time > 1) {
									spellInformation["casting time"] = "Casting Time: " + time + " Mintue";
								} else {
									spellInformation["casting time"] = "Casting Time: " + time + " Mintues";
								}
							} else if (type == 7) {
								if (time > 1) {
									spellInformation["casting time"] = "Casting Time: " + time + " Hour";
								} else {
									spellInformation["casting time"] = "Casting Time: " + time + " Hours";
								}
							}

							//range
							spellInformation["range"] = "Range: " + spellLocation[j][i].definition.range.rangeValue + " feet";


							//components
							let components = []
							for (let i = 0; i < spellLocation[j][i].definition.components.length; i++) {
								if (spellLocation[j][i].definition.components[i] == 1) {
									components.push("V");
								}

								if (spellLocation[j][i].definition.components[i] == 2) {
									components.push("S");
								}

								if (spellLocation[j][i].definition.components[i] == 3) {
									components.push("M (" + spellLocation[j][i].definition.componentsDescription + ")");
								}
							}
							spellInformation["components"] = "Components: " + components.toString();

							//duration
							let duration = [];
							if (spellLocation[j][i].definition.duration.durationType != null) {
								duration.push(spellLocation[j][i].definition.duration.durationType);
							}
							if (spellLocation[j][i].definition.duration.durationInterval != 0) {
								duration.push(spellLocation[j][i].definition.duration.durationInterval);
							}
							if (spellLocation[j][i].definition.duration.durationUnit != null) {
								duration.push(spellLocation[j][i].definition.duration.durationUnit);
							}

							if (duration[0] === "Concentration") {
								spellInformation["duration"] = "Duration: " + duration[0] + ", up to " + duration[1] + " " + duration[2]
							} else if (duration.length < 2) {
								spellInformation["duration"] = "Duration: " + duration[0];
							} else if (duration[0] != "Concentration") {
								spellInformation["duration"] = "Duration: " + duration[1] + " " + duration[2];
							}

							spellInformation["cast at will"] = spellLocation[j][i].usesSpellSlot;

							//description
							spellInformation["description"] = removeHtmlTags(spellLocation[j][i].definition.description);

							spellInfo(buttonPressed, adventureData, spellInformation, spellLocation[j][i].definition.level, characterData, stats);
						})

						//breakline
						const breakline = document.createElement('hr');

						switch (spellLocation[j][i].definition.level) {
							case 0:
								cantripsDiv.appendChild(nameButton);
								cantripsDiv.appendChild(timeLabel);
								cantripsDiv.appendChild(rangeLabel);
								cantripsDiv.appendChild(aoeLabel);
								cantripsDiv.appendChild(breakline);
								break;
							case 1:
								level1Div.appendChild(nameButton);
								level1Div.appendChild(timeLabel);
								level1Div.appendChild(rangeLabel);
								level1Div.appendChild(aoeLabel);
								level1Div.appendChild(breakline);
								break;
							case 2:
								level2Div.appendChild(nameButton);
								level2Div.appendChild(timeLabel);
								level2Div.appendChild(rangeLabel);
								level2Div.appendChild(aoeLabel);
								level2Div.appendChild(breakline);
								break;
							case 3:
								level3Div.appendChild(nameButton);
								level3Div.appendChild(timeLabel);
								level3Div.appendChild(rangeLabel);
								level3Div.appendChild(aoeLabel);
								level3Div.appendChild(breakline);
								break;
							case 4:
								level4Div.appendChild(nameButton);
								level4Div.appendChild(timeLabel);
								level4Div.appendChild(rangeLabel);
								level4Div.appendChild(aoeLabel);
								level4Div.appendChild(breakline);
								break;
							case 5:
								level5Div.appendChild(nameButton);
								level5Div.appendChild(timeLabel);
								level5Div.appendChild(rangeLabel);
								level5Div.appendChild(aoeLabel);
								level5Div.appendChild(breakline);
								break;
							case 6:
								level6Div.appendChild(nameButton);
								level6Div.appendChild(timeLabel);
								level6Div.appendChild(rangeLabel);
								level6Div.appendChild(aoeLabel);
								level6Div.appendChild(breakline);
								break;
							case 7:
								level7Div.appendChild(nameButton);
								level7Div.appendChild(timeLabel);
								level7Div.appendChild(rangeLabel);
								level7Div.appendChild(aoeLabel);
								level7Div.appendChild(breakline);
								break;
							case 8:
								level8Div.appendChild(nameButton);
								level8Div.appendChild(timeLabel);
								level8Div.appendChild(rangeLabel);
								level8Div.appendChild(aoeLabel);
								level8Div.appendChild(breakline);
								break;
							case 9:
								level9Div.appendChild(nameButton);
								level9Div.appendChild(timeLabel);
								level9Div.appendChild(rangeLabel);
								level9Div.appendChild(aoeLabel);
								level9Div.appendChild(breakline);
								break;
							default:
								allSpellDiv.appendChild(nameButton);
								allSpellDiv.appendChild(breakline);
						}
					}
				}
			}
			//event listeners for the character buttons
			const actionButton = overlayBody.querySelector('#actions');
			actionButton.addEventListener('click', function () {
				console.log("action button pressed");
				showActions(adventureData, buttonPressed, characterData);
			});

			const bioButton = overlayBody.querySelector('#bio');
			bioButton.addEventListener('click', function () {
				console.log("bio button pressed");
				showBio(adventureData, buttonPressed, characterData);
			});

			const characterButton = overlayBody.querySelector('#character');
			characterButton.addEventListener('click', function () {
				console.log('character button pressed');
				const characterSheetOverlay = document.getElementById('customOverlay');
				characterSheetOverlay.remove();
				showCharacterSheet(adventureData);
			});

			const featuresButton = overlayBody.querySelector('#features');
			featuresButton.addEventListener('click', function () {
				console.log('features button pressed');
				showFeatures(adventureData, buttonPressed, characterData);
			});

			const inventoryButton = overlayBody.querySelector('#inventory');
			inventoryButton.addEventListener('click', function () {
				console.log('inventory button pressed');
				showInventory(adventureData, buttonPressed);
			});

			const spellsButton = overlayBody.querySelector('#spells');
			spellsButton.addEventListener('click', function () {
				console.log('spells button pressed');
			});

			content.appendChild(overlayBody);
		};
	});
}

function spellInfo(buttonPressed, adventureData, spellInformation, spellLevel, characterData, stats) {
	if (characterSheetOverlayOpen && buttonPressed === null) {
		console.log("Character sheet already open");
		return;
	}

	const content = document.querySelector('#overlayContainer');
	content.innerHTML = '';

	let characterHidden = '';

	for (let i = 0; i < adventureData.characters.character.length; i++) {
		if (adventureData.characters.character[i].name === characterData.name) {
			if (adventureData.characters.character[i].hidden === "yes") {
				characterHidden = "[hidden]";
			}
			break;
		}
	}

	var header = document.getElementById('titleBar');
	header.innerHTML = `${characterData.name} - Spells ${characterHidden} <span class="glyphicon glyphicon-remove close" aria-hidden="true"></span>`;

	//closes the overlay on button click of the cross
	const closeButton = header.querySelector('.close');
	closeButton.addEventListener('click', function () {
		characterSheetOverlayOpen = false;

		const characterSheetOverlay = document.getElementById('customOverlay');
		if (characterSheetOverlay) {
			characterSheetOverlay.remove();
		}
	});

	const overlayBody = document.createElement('div');
	overlayBody.classList.add('panel-body');

	overlayBody.innerHTML = `
        <div id="overlayContainer">
            <button id="backButton" class="btn btn-primary btn-xs open_menu" style="height=75px; width=0px; font-size: 25px; margin-top: -20px; margin-left: -20px;">🢀</button>
            <div class="spellDiv" style="height: 400px; width: 345px; margin-left: -10px; margin-top: 25px; overflow: auto; border: 2px solid #336699; padding: 10px;">
                <h2><b>${spellInformation['name']}</b></h2>
                <hr>
                <h5><b>${spellInformation['casting time']}</b></h5>
                <h5><b>${spellInformation['range']}</b></h5>
                <h5><b>${spellInformation['components']}</b></h5>
                <h5><b>${spellInformation['duration']}</b></h5>
                <h5>${spellInformation['description']}</h5>
            </div>
            <button id="castSpell" class="btn btn-primary btn-xs open_menu" style="font-size: 30px; margin-left: 75px; margin-top: 5px;">Cast Spell</button>
        <div>
    `;

	const backButton = overlayBody.querySelector('#backButton');
	backButton.addEventListener('click', function () {
		console.log("Back button pressed");
		showSpells(adventureData, buttonPressed, characterData, stats);
	});

	const castSpell = overlayBody.querySelector('#castSpell');
	castSpell.addEventListener('click', function () {
		console.log("cast spell button pressed");
		const newline = "\n";
		var message = spellInformation['name'] + newline + spellInformation['school level'] + newline + spellInformation['casting time'] + newline + spellInformation['range'] + newline + spellInformation['components'] + newline + spellInformation['duration'] + newline + newline + spellInformation['description'].replace(/<br><br>/g, '\n\n');
		message_send(message, characterData.name);

		getSpellSlots(function (data) {
			if (data) {
				switch (spellLevel) {
					case 1:
						if (spellInformation['cast at will'] == true) {
							data[0].used = data[0].used + 1;
						}
						break
					case 2:
						if (spellInformation['cast at will'] == true) {
							data[1].used = data[1].used + 1;
						}
						break
					case 3:
						if (spellInformation['cast at will'] == true) {
							data[2].used = data[2].used + 1;
						}
						break
					case 4:
						if (spellInformation['cast at will'] == true) {
							data[3].used = data[3].used + 1;
						}
						break
					case 5:
						if (spellInformation['cast at will'] == true) {
							data[4].used = data[4].used + 1;
						}
						break
					case 6:
						if (spellInformation['cast at will'] == true) {
							data[5].used = data[5].used + 1;
						}
						break
					case 7:
						if (spellInformation['cast at will'] == true) {
							data[6].used = data[6].used + 1;
						}
						break
					case 8:
						if (spellInformation['cast at will'] == true) {
							data[7].used = data[7].used + 1;
						}
						break
					case 9:
						if (spellInformation['cast at will'] == true) {
							data[8].used = data[8].used + 1;
						}
						break
				}
				saveSpellSlots(data);
				showSpells(adventureData, buttonPressed, characterData, stats);
			}
		});
	});

	content.appendChild(overlayBody);
}

function compareSlots2Used(spellLevelData) {
	const spellSlotElements = document.querySelectorAll('.spellSlots');
	spellSlotElements.forEach((element, index) => {
		const slotValue = parseInt(element.textContent.trim(), 10);

		if (slotValue === spellLevelData) {
			console.log(`Element ${index + 1} value matches data.used: ${slotValue}`);
		} else {
			console.log(`Element ${index + 1} value does not match data.used: ${slotValue}`);
		}
	});
}

function handleSkillButtonClick(skillName, modifier) {
    console.log(`Skill: ${skillName}, Modifier: ${modifier}`);
}

function calculateProf(characterLevel) {
    if (characterLevel >= 1 && characterLevel <= 4) {
        return 2;
    } else if (characterLevel >= 5 && characterLevel <= 8) {
        return 3;
    } else if (characterLevel >= 9 && characterLevel <= 12) {
        return 4;
    } else if (characterLevel >= 13 && characterLevel <= 16) {
        return 5;
    } else if (characterLevel >= 17) {
        return 6;
    } else {
        // Character level is less than 1, return 0 as proficiency bonus
        return 0;
    }
}

function calculateLevel(xp) {
    const xpThresholds = [0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000];

    for (let i = 0; i < xpThresholds.length; i++) {
        if (xp < xpThresholds[i]) {
                return i;
        }
    }

    // If the XP is higher than all values in the table, return the last level
    return xpThresholds.length;
}

function getCharacterStats(characterData) {
    let totalStrength = characterData.stats[0].value;
    let totalDexterity = characterData.stats[1].value;
    let totalConstitution = characterData.stats[2].value;
    let totalIntellegence = characterData.stats[3].value;
    let totalWisdom = characterData.stats[4].value;
    let totalCharisma = characterData.stats[5].value;

    for (let i = 0; i<characterData.modifiers.race.length; i++) {
		if (characterData.modifiers.race[i].friendlyTypeName === "Bonus") {
			const abilityIncrease = characterData.modifiers.race[i].friendlySubtypeName.replace(" Score", "");
			if (abilityIncrease === "Strength") {
			totalStrength += characterData.modifiers.race[i].value;
			} else if (abilityIncrease === "Dexterity") {
			totalDexterity += characterData.modifiers.race[i].value;
			} else if (abilityIncrease === "Constitution") {
			totalConstitution += characterData.modifiers.race[i].value;
			} else if (abilityIncrease === "Intelligence") {
					totalIntelligence += characterData.modifiers.race[i].value;
				}
		}
	}

	for (let i = 0; i < characterData.modifiers.class.length; i++) {
		const abilities = ["Strength", "Dexterity", "Constitution", "Intellegence", "Wisdom", "Charisma"]
		const type = characterData.modifiers.class[i].friendlySubtypeName.replace(' Score', '');

		if (abilities.includes(type) && characterData.modifiers.class[i].type === "bonus") {
			const ability = abilities.includes(type);
			if (type === "Strength" && ability === true) {
				totalStrength += characterData.modifiers.class[i].value;
			} else if (type === 'Dexterity' && ability === true) {
				totalDexterity += characterData.modifiers.class[i].value;
			} else if (type === 'Constitution' && type === true) {
				totalConstitution += characterData.modifiers.class[i].value;
			} else if (type === 'Intellegence' && ability === true) {
				totalIntellegence += characterData.modifiers.class[i].value;
			} else if (type === 'Wisdom' && ability === true) {
				totalWisdom += characterData.modifiers.class[i].value;
			} else if (type === 'Charisma' && ability === true) {
				totalCharisma += characterData.modifiers.class[i].value;
			}
		}
	}

    return {
        totalStrength,
        totalDexterity,
        totalConstitution,
        totalIntellegence,
        totalWisdom,
        totalCharisma,
    };
}

function totalHitPoints(hitPoints) {
    chrome.storage.local.get('characterData', function (result) {
        const characterData = results.characterData;
	const stats = getCharacterData(characterData);

        if (characterData) {

            const conStat = Math.floor((stats.totalConstitution - 10) / 2)//ability score -10/2 to get modifier (round up)
            const level = calculateLevel(characterData.currentXp)
            const totalHitPoints = characterData.baseHitPoints + (Number(conStat) * Number(level));//constitustion modifier X level + base hit points = total hp
            hitPoints.value = totalHitPoints;
        } else {
            console.log('Character Data not found in storage');
        }
    });

    return totalHitPoints;
}

function getUserCharacter(callback) {
  chrome.storage.local.get('url', function (result) {
    const cauldronURL = result.url;

    fetch(cauldronURL + "?output=json")
      .then(response => response.json())
      .then(data => {
        callback(null, data.adventure);
      })
      .catch(error => {
        console.error('Error fetching cauldron JSON data:', error);
        // Invoke the callback with the error
        callback(error);
      });
  });
}

function removeHtmlTags(htmlString) {
	const doc = new DOMParser().parseFromString(htmlString, 'text/html');
	const paragraphs = doc.body.getElementsByTagName('p');
	let result = "";

	for (const paragraph of paragraphs) {
		result += (paragraph.textContent + '<br><br>');
	}

	return result;
}

function getSpellSlots(callback) {
	chrome.storage.local.get('currentSpellSlots', function (result) {
		if (result.currentSpellSlots) {
			console.log('Retrieved currentSpellSlots');
			callback(result.currentSpellSlots);
		} else {
			console.log("Can't load currentSpellSlots");
			callback(null);
		}
	});
}

function saveSpellSlots(spellSlots) {
	chrome.storage.local.get('currentSpellSlots', function (result) {
		if (result.currentSpellSlots != null && spellSlots != null) {
			console.log('spell slot Data already exists');
			chrome.storage.local.set({ 'currentSpellSlots': spellSlots }, function () {
				console.log("Spell Slots stored");
			});
		} else {
			console.log('spell slot Data does not exist.');
			chrome.storage.local.get('characterData', function (result) {
				const characterData = result.characterData;
				chrome.storage.local.set({ 'currentSpellSlots': characterData.spellSlots }, function () {
					console.log("Spell Slots stored from characterData");
				});
			});
		}
	});
}

function descriptionToCharacterData(description, characterData, stats) {
    const abilityMap = {
        "str": "totalStrength",
        "dex": "totalDexterity",
        "con": "totalConstitution",
        "int": "totalIntelligence",
        "wis": "totalWisdom",
        "cha": "totalCharisma"
    };

    //replaces modifier:[ability score] with the correct number
    for (let abilityAbbreviation in abilityMap) {
        let rePattern = new RegExp(`modifier:${abilityAbbreviation}`, "g");
        let abilityModifier = Math.floor((stats[abilityMap[abilityAbbreviation]] - 10) / 2);
	let replacementValue = abilityModifier >= 0 ? '+' + abilityModifier : '-' + abilityModifier;

        description = description.replace(rePattern, replacementValue).replace('{', '').replace('}', '');
    }

    //replaces +classlevel with the classes level
    let rePattern = /\+classlevel\)/;
    let replacementValue = calculateLevel(characterData.currentXp); // Replace this with the desired number
    description = description.replace(rePattern, "+" + replacementValue);

    //replaces min:1#unsighned
    let rePattern2 = /@(min|max):\d+#unsigned/;
    description = description.replace(rePattern2, "");

    let rePatternSum = /(\d+)\s*\+\s*(\d+)/g;
    description = description.replace(rePatternSum, (match, x, y) => parseInt(x) + parseInt(y));

    return description;
}

function sendDataToSidebar(information, characterName) {
	let script = document.createElement('script');

	script.textContent = `
			  // Call the page's function with the provided arguments
			  send_message(${JSON.stringify(information)}, '${characterName}');
			`;

	(document.head || document.documentElement).appendChild(script);
}

//after the above then add the compareSlots2Used function to switch case
//in spell description give option to cast at higher level where possible, otherwise just offer "cast spell" button
// remove all the previous copied functions as they are no longer needed