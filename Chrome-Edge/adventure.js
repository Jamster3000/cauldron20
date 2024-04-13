let characterSheetOverlayOpen = false;
saveSpellSlots(null);

setTimeout(function () {
	const urlWithJsonOutput = window.location.href + "?output=json";
	fetchJsonDataFromUrl(urlWithJsonOutput)
		.then(adventureData => {
			adventureData = adventureData.adventure;
			try {
				if (adventureData['@is_dm'] === "yes") {
					console.log('You are the DM, there is no character button for you!');
				} else {
					const container = document.querySelector('.btn-group');//contains each section of the page (playArea, chat, header, etc.)

					const viewCharacter = document.createElement('button');
					viewCharacter.textContent = "View Character Sheet";
					viewCharacter.classList.add('btn', 'btn-primary', 'btn-xs');
					viewCharacter.display = 'inline-block';
					viewCharacter.style.position = 'fixed';
					viewCharacter.style.height = '19.6px';
					viewCharacter.style.top = '7px';
					viewCharacter.style.right = '100px';
					container.appendChild(viewCharacter); // Appended the button to the container


					viewCharacter.addEventListener('click', function (event) {
						event.preventDefault();
						showCharacterSheet(adventureData, true);
					});
				}
			} catch {
				const container = document.querySelector('.btn-group');//contains each section of the page (playArea, chat, header, etc.)

				const viewCharacter = document.createElement('button');
				viewCharacter.textContent = "View Character Sheet";
				viewCharacter.classList.add('btn', 'btn-primary', 'btn-xs');
				viewCharacter.display = 'inline-block';
				viewCharacter.style.position = 'fixed';
				viewCharacter.style.height = '19.6px';
				viewCharacter.style.top = '7px';
				viewCharacter.style.right = '100px';
				container.appendChild(viewCharacter); // Appended the button to the container


				viewCharacter.addEventListener('click', function (event) {
					event.preventDefault();
					showCharacterSheet(adventureData, true);
				});
			}
		})
		.catch(error => {
			console.error('Error fetching JSON data:', error);
		});
}, 0);

function showCharacterSheet(adventureData, buttonPressed) {
    if (characterSheetOverlayOpen && buttonPressed === true) {
		return;
	}

	characterSheetOverlayOpen = true;

	try {
		// clear content of overlay
		const content = document.getElementById('overlayContainer');
		content.innerHTML = '';
	} catch {}

    const listSkills = [{ name: "Acrobatics", ability: "Dex" },{ name: "Animal Handling", ability: "Wis" },{ name: "Arcana", ability: "Int" },{ name: "Athletics", ability: "Str" },{ name: "Deception", ability: "Cha" },{ name: "History", ability: "Int" },{ name: "Insight", ability: "Wis" },{ name: "Intimidation", ability: "Cha" },{ name: "Investigation", ability: "Int" },{ name: "Medicine", ability: "Wis" },{ name: "Nature", ability: "Int" },{ name: "Perception", ability: "Wis" },{ name: "Performance", ability: "Cha" },{ name: "Persuasion", ability: "Cha" },{ name: "Religion", ability: "Int" },{ name: "Sleight of Hand", ability: "Dex" },{ name: "Stealth", ability: "Dex" },{ name: "Survival", ability: "Wis" }];
    const savingThrowList = ["Strength", "Dexterity", "Constitution", "Intellegence", "Wisdom", "Charisma"];    

	const urlWithJsonOutput = window.location.href + "?output=json";
	fetchJsonDataFromUrl(urlWithJsonOutput)
		.then(adventureData => {
			adventureData = adventureData.adventure;
			chrome.storage.local.get('characterData', function (result) {
				const characterData = result.characterData;
				const stats = getCharacterStats(characterData);
				//console.log(characterData); //uncomment this to output all the data from the dndbeyond api

				chrome.storage.local.get(null, function (result) {
					//console.log('All stored data:', result);//uncomment this to get all data stored in the user's local chrome storage for this extension
				});
				console.log(characterData);

				const overlayContainer = document.createElement('div');
				overlayContainer.id = 'customOverlay';
				overlayContainer.classList.add('panel', 'panel-primary');
				overlayContainer.style.display = 'none';
				overlayContainer.style.position = 'fixed';
				overlayContainer.style.top = '40px';
				overlayContainer.style.left = '15px';
				overlayContainer.style.backgroundColor = 'rgba(255,255,255, 1)';
				overlayContainer.style.zIndex = '1010';
				overlayContainer.style.width = "415px";

				let currentCauldronHitPoints = 0;
				let currentArmourClass = 0;
				let characterHidden = "";

				if (adventureData.characters.character.length != null) {
					for (let i = 0; i < adventureData.characters.character.length; i++) {
						if (adventureData.characters.character[i].name === characterData.name) {
							currentCauldronHitPoints = (Number(adventureData.characters.character[i].hitpoints) - Number(adventureData.characters.character[i].damage));
							currentArmourClass = (Number(adventureData.characters.character[i].armor_class));

							if (adventureData.characters.character[i].hidden === "yes") {
								characterHidden = "[hidden]";
							}
							break;
						}
					}
				} else {
					currentCauldronHitPoints = (Number(adventureData.characters.character.hitpoints) - Number(adventureData.characters.character.damage));
					currentArmourClass = (Number(adventureData.characters.character.armor_class));

					if (adventureData.characters.character.hidden === "yes") {
						characterHidden = "[hidden]";
					}
				}

				// Create overlay header
				const overlayHeader = document.createElement('div');
				overlayHeader.classList.add('panel-heading');
				overlayHeader.id = "titleBar";
				overlayHeader.innerHTML = `${characterData.name} - Character ${characterHidden} <span class="glyphicon glyphicon-remove close" aria-hidden="true"></span>`;

				const closeButton = overlayHeader.querySelector('.close');
				closeButton.addEventListener('click', function () {
					overlayContainer.style.display = 'none';
					characterSheetOverlayOpen = false;

					const characterSheetOverlay = document.getElementById('customOverlay');
					if (characterSheetOverlay) {
						characterSheetOverlay.remove();
					}
				});

				//working out the total character hp
				const conStat = Math.floor((stats.totalConstitution - 10) / 2)//ability score -10/2 to get modifier (round up)
				const level = calculateLevel(characterData.currentXp, characterData)
				var totalHitPoints = 0;

				if (adventureData.characters.character.length != null) {
					for (let i = 0; i < adventureData.characters.character.length; i++) {
						totalHitPoints = adventureData.characters.character[0]['hitpoints'];
					}
				}

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
        							<button id="strButton" style="margin-right: 5px;">${stats.totalStrength} (${stats.totalStrength >= 10 ? '+' : ''}${Math.floor((stats.totalStrength - 10) / 2)})</button>
								<h5 style="font-weight: bold;">DEX</h5>
        							<button id="dexButton" style="margin-right: 5px;">${stats.totalDexterity} (${stats.totalDexterity >= 10 ? '+' : ''}${Math.floor((stats.totalDexterity - 10) / 2)})</button>
        							<h5 style="font-weight: bold;">CON</h5>
        							<button id="conButton" style="margin-right: 5px;">${stats.totalConstitution} (${stats.totalConstitution >= 10 ? '+' : ''}${Math.floor((stats.totalConstitution - 10) / 2)})</button>
  								<h5 style="font-weight: bold;">INT</h5>
        							<button id="intButton" style="margin-right: 5px;">${stats.totalIntellegence} (${stats.totalIntellegence >= 10 ? '+' : ''}${Math.floor((stats.totalIntellegence - 10) / 2)})</button>
								<h5 style="font-weight: bold;">WIS</h5>
        							<button id="wisButton" style="margin-right: 5px;">${stats.totalWisdom} (${stats.totalWisdom >= 10 ? '+' : ''}${Math.floor((stats.totalWisdom - 10) / 2)})</button>
								<h5 style="font-weight: bold;">CHA</h5>
        							<button id="chaButton" style="margin-right: 5px;">${stats.totalCharisma} (${stats.totalCharisma >= 10 ? '+' : ''}${Math.floor((stats.totalCharisma - 10) / 2)})</button>
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
								<button id="actions" class="btn btn-primary btn-xs" style="font-size: 12px; margin-top: 10px; margin-left: 2px; width: 100px; height: 28px;">Actions</button>
								<button id="bio" class="btn btn-primary btn-xs" style="font-size: 12px; margin-top: -10px; margin-left: 2px; width: 100px; height: 28px;">Bio</button>
								<button id="character" class="btn btn-primary btn-xs" style="font-size: 12px; margin-top: -10px; margin-left: 2px; width: 100px; height: 28px;">Character</button>
								<button id="features" class="btn btn-primary btn-xs" style="font-size: 12px; margin-top: -10px; margin-left: 2px; width: 100px; height: 28px;">Features</button>	
								<button id="inventory" class="btn btn-primary btn-xs" style="font-size: 12px; margin-top: -10px; margin-left: 2px; width: 100px; height: 28px;">Inventory</button>
								<button id="spells" class="btn btn-primary btn-xs" style="font-size: 12px; margin-top: -10px; margin-left: 2px; width: 100px; height: 28px;">Spells</button>
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
				strButton.addEventListener('click', function () {

					//random number
					let randomNumber = Math.floor(Math.random() * 20) + 1 //this will do any number from 1 - 20
					var message = `Strength Check: ${randomNumber + Math.floor((stats.totalStrength - 10) / 2)} [${Math.floor((stats.totalStrength - 10) / 2) >= 0 ? `+${Math.floor((stats.totalStrength - 10) / 2)}` : Math.floor((stats.totalStrength - 10) / 2)}]`; sendDataToSidebar(message, characterData.name);
				});

				const dexButton = overlayBody.querySelector('#dexButton');
				dexButton.addEventListener('click', function () {

					//random number
					let randomNumber = Math.floor(Math.random() * 20) + 1 //this will do any number from 0 - 20
					var message = `Dexterity Check: ${randomNumber + Math.floor((stats.totalDexterity - 10) / 2)} [${Math.floor((stats.totalDexterity - 10) / 2) >= 0 ? `+${Math.floor((stats.totalDexterity - 10) / 2)}` : Math.floor((stats.totalDexterity - 10) / 2)}]`;
					sendDataToSidebar(message, characterData.name);

				});

				const conButton = overlayBody.querySelector('#conButton');
				conButton.addEventListener('click', function () {

					//random number
					let randomNumber = Math.floor(Math.random() * 20) + 1 //this will do any number from 0 - 20
					var message = `Constitution Check: ${randomNumber + Math.floor((stats.totalConstitution - 10) / 2)} [${Math.floor((stats.totalConstitution - 10) / 2) >= 0 ? `+${Math.floor((stats.totalConstitution - 10) / 2)}` : Math.floor((stats.totalConstitution - 10) / 2)}]`;
					sendDataToSidebar(message, characterData.name);

				});

				const intButton = overlayBody.querySelector('#intButton');
				intButton.addEventListener('click', function () {

					//random number
					let randomNumber = Math.floor(Math.random() * 20) + 1 //this will do any number from 0 - 20
					var message = `Intellegence Check: ${randomNumber + Math.floor((stats.totalIntellegence - 10) / 2)} [${Math.floor((stats.totalIntellegence - 10) / 2) >= 0 ? `+${Math.floor((stats.totalIntellegence - 10) / 2)}` : Math.floor((stats.totalIntellegence - 10) / 2)}]`;
					sendDataToSidebar(message, characterData.name);
				});

				const wisButton = overlayBody.querySelector('#wisButton');
				wisButton.addEventListener('click', function () {

					//random number
					let randomNumber = Math.floor(Math.random() * 20) + 1 //this will do any number from 0 - 20
					var message = `Wisdom Check: ${randomNumber + Math.floor((stats.totalWisdom - 10) / 2)} [${Math.floor((stats.totalWisdom - 10) / 2) >= 0 ? `+${Math.floor((stats.totalWisdom - 10) / 2)}` : Math.floor((stats.totalWisdom - 10) / 2)}]`;
					sendDataToSidebar(message, characterData.name);
				});

				const chaButton = overlayBody.querySelector('#chaButton');
				chaButton.addEventListener('click', function () {

					//random number
					let randomNumber = Math.floor(Math.random() * 20) + 1 //this will do any number from 0 - 20
					var message = `Charisma Check: ${randomNumber + Math.floor((stats.totalCharisma - 10) / 2)} [${Math.floor((stats.totalCharisma - 10) / 2) >= 0 ? `+${Math.floor((stats.totalCharisma - 10) / 2)}` : Math.floor((stats.totalCharisma - 10) / 2)}]`;
					sendDataToSidebar(message, characterData.name);
				});

				//event listeners for the character buttons
				const actionButton = overlayBody.querySelector('#actions');
				actionButton.addEventListener('click', function () {
					showActions(adventureData, buttonPressed, characterData, stats);
				});

				const bioButton = overlayBody.querySelector('#bio');
				bioButton.addEventListener('click', function () {
					showBio(adventureData, buttonPressed, characterData, stats);
				});

				const characterButton = overlayBody.querySelector('#character');
				characterButton.addEventListener('click', function () {
				});

				const featuresButton = overlayBody.querySelector('#features');
				featuresButton.addEventListener('click', function () {
					showFeatures(adventureData, buttonPressed, characterData, stats);
				});

				const inventoryButton = overlayBody.querySelector('#inventory');
				inventoryButton.addEventListener('click', function () {
					showInventory(adventureData, buttonPressed, characterData, stats);
				});

				const spellsButton = overlayBody.querySelector('#spells');
				spellsButton.addEventListener('click', function () {
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
						const characterProf = calculateProf(calculateLevel(characterData.currentXp, characterData));

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
							var message = `${listSkills[i].name} Check: ${randomNumber + total} [${total >= 0 ? `+${total}` : total}]`;
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
							var message = `${listSkills[i].name} Check: ${randomNumber + total} [${total >= 0 ? `+${total}` : total}]`;
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
				for (let i = 0; i < savingThrowList.length; i++) {
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
						const characterProf = calculateProf(calculateLevel(characterData.currentXp, characterData));

						for (const feature in characterData.classes[0].classFeatures) {
							if (characterData.classes[0].classFeatures[feature].definition.name === "Aura of Protection") {
								total += 3;
							}
						}

						if (savingThrowList[i] === "Strength") {
							total += Math.floor((stats.totalStrength - 10) / 2) + characterProf;
						} else if (savingThrowList[i] === "Dexterity") {
							total += Math.floor((stats.totalDexterity - 10) / 2) + characterProf;
						} else if (savingThrowList[i] === "Constitution") {
							total += Math.floor((stats.totalConstitution - 10) / 2) + characterProf;
						} else if (savingThrowList[i] === "Intellegence") {
							total += Math.floor((stats.totalIntellegence - 10) / 2) + characterProf;
						} else if (savingThrowList[i] === "Wisdom") {
							total += Math.floor((stats.totalWisdom - 10) / 2) + characterProf;
						} else if (savingThrowList[i] === "Charisma") {
							total += Math.floor((stats.totalCharisma - 10) / 2) + characterProf;
						}

						savingThrowButton.textContent = total >= 0 ? `+${total}` : total;

						savingThrowButton.addEventListener('click', function () {
							let randomNumber = Math.floor(Math.random() * 20) + 1
							var message = `${savingThrowList[i]} Check: ${randomNumber + total} [${total >= 0 ? `+${total}` : total}]`;
							sendDataToSidebar(message, characterData.name);
						});

					} else {
						let total = 0;

						for (const feature in characterData.classes[0].classFeatures) {
							if (characterData.classes[0].classFeatures[feature].definition.name === "Aura of Protection") {
								total += 3;
							}
						}

						if (savingThrowList[i] === "Strength") {
							total += Math.floor((stats.totalStrength - 10) / 2)
						} else if (savingThrowList[i] === "Dexterity") {
							total += Math.floor((stats.totalDexterity - 10) / 2);
						} else if (savingThrowList[i] === "Constitution") {
							total += Math.floor((stats.totalConstitution - 10) / 2);
						} else if (savingThrowList[i] === "Intellegence") {
							total += Math.floor((stats.totalIntellegence - 10) / 2);
    					} else if (savingThrowList[i] === "Wisdom") {
							total += Math.floor((stats.totalWisdom - 10) / 2);
    					} else if (savingThrowList[i] === "Charisma") {
							total += Math.floor((stats.totalCharisma - 10) / 2);
   					}
		
					savingThrowButton.textContent = total >= 0 ? `+${total}` : total;

					savingThrowButton.addEventListener('click', function () {
						let randomNumber = Math.floor(Math.random() * 20) + 1
						var message = `${savingThrowList[i]} Check: ${randomNumber + total} [${total >= 0 ? `+${total}` : total}]`;
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
			});
		})
		.catch(error => {
			console.error('Error fetching JSON data:', error);
		});
}

function showActions(adventureData, buttonPressed, characterData, stats) {
	if (characterSheetOverlayOpen && buttonPressed == "null") {
		return;
	}

	const characterSheetOverlay = document.getElementById('customOverlay');
	characterSheetOverlay.style.width = "500px";

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
			characterSheetOverlayOpen = false;

			const characterSheetOverlay = document.getElementById('customOverlay');
			if (characterSheetOverlay) {
				characterSheetOverlay.remove();
			}
		});

		const overlayBody = content;
		overlayBody.innerHTML = `
			<div>
				<div id="actionsList" style="height: 495px; width: 350px; margin-left: 0px; margin-top: 0px; overflow: auto; border: 2px solid #336699; padding: 10px;">
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
									<label style="font-size: 22px;">｜</label>
									<button id="unarmedStrikeDamage" class="unarmedStrikeDamage">1${Math.floor((stats.totalStrength - 10) / 2) >= 0 ? `+${Math.floor((stats.totalStrength - 10) / 2)}` : Math.floor((stats.totalStrength - 10) / 2)}</button>
									<hr>
								</div>
							</ul>
						</div>
					</ul>
				</div>
			</div>
			<div class="Character-menu-container" style="margin-top: 0px; height: 40px; margin-left: 150px;">
					<div class="character-menu" style="border: 2px solid #336699; height: 230px; width: 110px; margin-left: -140px;">
						<button id="actions" class="btn btn-primary btn-xs" style="font-size: 12px; margin-top: 10px; margin-left: 2px; width: 100px; height: 28px;">Actions</button>
						<button id="bio" class="btn btn-primary btn-xs" style="font-size: 12px; margin-top: -10px; margin-left: 2px; width: 100px; height: 28px;">Bio</button>
						<button id="character" class="btn btn-primary btn-xs" style="font-size: 12px; margin-top: -10px; margin-left: 2px; width: 100px; height: 28px;">Character</button>
						<button id="features" class="btn btn-primary btn-xs" style="font-size: 12px; margin-top: -10px; margin-left: 2px; width: 100px; height: 28px;">Features</button>
						<button id="inventory" class="btn btn-primary btn-xs" style="font-size: 12px; margin-top: -10px; margin-left: 2px; width: 100px; height: 28px;">Inventory</button>
						<button id="spells" class="btn btn-primary btn-xs" style="font-size: 12px; margin-top: -10px; margin-left: 2px; width: 100px; height: 28px;">Spells</button>
					</div>
				</div>
			<div id="ammoList" style="border: 2px solid #336699; padding 5px; height: 230px; width: 110px; margin-left: -140px; margin-top: 240px;"></div>	
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
				const range = characterData.inventory[i].definition.range;
				const longRange = characterData.inventory[i].definition.longRange;

				const characterLevel = calculateLevel(characterData.currentXp, characterData);
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

				//damage button
				var damageButton = document.createElement('button');
				damageButton.textContent = '';
				damageButton.id = "weapon";

				try {
					if (characterData.inventory[i].definition.range < 6) { //5 or less assume thats the range in feet meaning it's a melee weapon
						for (const feature in characterData.classes[0].classFeatures) {
							if (characterData.classes[0].classFeatures[feature].definition.name === "Aura of Hate") {
								damageButton.textContent = `${characterData.inventory[i].definition.damage.diceString}${(Math.floor((stats.totalStrength - 10) / 2+3) >= 0 ? `+${Math.floor((stats.totalStrength - 10) / 2+3)}` : Math.floor(stats.totalStrength - 10) / 2+3)}`;
								break;
							}
						}

						if (damageButton.textContent === "") {
							damageButton.textContent = `${characterData.inventory[i].definition.damage.diceString}${(Math.floor((stats.totalStrength - 10) / 2) >= 0 ? `+${Math.floor((stats.totalStrength - 10) / 2)}` : Math.floor((stats.totalStrength - 10) / 2))}`;
						}
					} else {
						damageButton.textContent = `${characterData.inventory[i].definition.damage.diceString}${(Math.floor((stats.totalDexterity - 10) / 2) >= 0 ? `+${Math.floor((stats.totalDexterity - 10) / 2)}` : Math.floor((stats.totalDexterity - 10) / 2))}`;
					}
				} catch (TypeError) {//if the TypeError happens then this means that the diceString is else where in the data
					try {
						damageButton.textContent = `${characterData.inventory[i].definition.grantedModifiers[0].dice.diceString}`
					} catch (TypeError) { }
				}

				//label
				var thirdSplitLabel = document.createElement('label');
				thirdSplitLabel.style.fontSize = "22px";
				thirdSplitLabel.style.fontWeight = 'bold';
				thirdSplitLabel.textContent = "｜";

				//description
				var weaponDescription = document.createElement('label');
				weaponDescription.textContent = characterData.inventory[i].definition.description.replace(/<[^>]*>/g, '');

				const breakLine = document.createElement('hr');

				allActionsDiv.appendChild(weaponButton);
				allActionsDiv.appendChild(splitLabel);
				allActionsDiv.appendChild(reachLabel);
				allActionsDiv.appendChild(SecondSplitLabel);
				allActionsDiv.appendChild(weaponAttackButton);
				allActionsDiv.appendChild(thirdSplitLabel);
				allActionsDiv.appendChild(damageButton);
				allActionsDiv.appendChild(weaponDescription);
				allActionsDiv.appendChild(breakLine);

				(function (itemName, range, longRange, weaponDescription, damageButton) {
					// Add a click event listener to the current weapon button
					const currentWeaponButton = weaponButton;
					const damageWeaponButton = damageButton;
					const currentAttackRoll = weaponAttackButton;

					damageButton.addEventListener('click', function () {//damage button to only roll damage
						damageButton = damageButton.textContent;
						var damageModifier = "0";
						var damageDice = "";

						if (damageButton.includes('+')) {
							const tempVar = damageButton.split('+');
							damageDice = tempVar[0];
							damageModifier = +tempVar[1];
						} else if (damageButton.includes('-')) {
							const tempVar = damageButton.split('-');
							damageDice = tempVar[0];
							damageModifier = -tempVar[1];
						} else {
							damageDice = damageButton[0];
						}

						if (range < 6) {
							if (damageDice.includes("d")) {
								message = `${itemName}\nDamage: ${calculateDamage(damageDice, damageModifier)} [${damageModifier >= 0 ? `+${damageModifier}` : damageModifier}]`;
							} else {
								if (range == null || longRange == null) {
									message = `${itemName}\nReach: 5/5ft.\n${weaponDescription}`;
								} else {
									message = `${itemName}\nReach: ${range}/${longRange}ft.\n${weaponDescription}`;
								}
							}
						} else {
							message = `${itemName}\nDamage: ${calculateDamage(damageDice, damageModifier)} [${damageModifier >= 0 ? `+${damageModifier}` : damageModifier}]`;
						}
						sendDataToSidebar(message, characterData.name);
					});

					currentWeaponButton.addEventListener('click', function () {//the whole weapon rolling attack and damage roll
						const randomNumber = Math.floor(Math.random() * 20) + 1

						var damageModifier = "0";
						var damageDice = "";

						if (damageButton.textContent.includes('+')) {
							const tempVar = damageButton.textContent.split('+');
							damageDice = tempVar[0];
							damageModifier = +tempVar[1];
						} else if (damageButton.textContent.includes('-')) {
							const tempVar = damageButton.textContent.split('-');
							damageDice = tempVar[0];
							damageModifier = -tempVar[1];
						} else {
							damageDice = damageButton[0];
						}

						try {
							if (range < 6) {
								if (damageDice.includes("d")) {
									message = `${itemName}\nReach: ${range}/${longRange}ft.\n${weaponDescription}\n\n\nAttack Roll: ${randomNumber + Math.floor((stats.totalStrength - 10) / 2)} [${currentAttackRoll.textContent >= 0 ? `${currentAttackRoll.textContent}` : currentAttackRoll.textContent}]\nDamage: ${calculateDamage(damageDice, damageModifier)} [${damageModifier >= 0 ? `+${damageModifier}` : damageModifier}]`;
								} else {
									if (range == null || longRange == null) {
										message = `${itemName}\nReach: 5/5ft.\n${weaponDescription}`;
									} else {
										message = `${itemName}\nReach: ${range}/${longRange}ft.\n${weaponDescription}`;
									}
								}
							} else {
								message = `${itemName}\nReach: ${range}/${longRange}ft.\n${weaponDescription}\n\n\nAttack Roll: ${randomNumber + Math.floor((stats.totalDexterity - 10) / 2)} [${currentAttackRoll.textContent >= 0 ? `${currentAttackRoll.textContent}` : currentAttackRoll.textContent}]\nDamage: ${calculateDamage(damageDice, damageModifier)} [${damageModifier >= 0 ? `+${damageModifier}` : damageModifier}]`;
							}
							sendDataToSidebar(message, characterData.name);
						} catch (TypeError) {
							const damageDice = damageButton.textContent;
							if (range < 6) {
								if (damageDice.includes("d")) {
									message = `${itemName}\nReach: ${range}/${longRange}ft.\n${weaponDescription}\n\n\nAttack Roll: ${randomNumber + Math.floor((stats.totalStrength - 10) / 2)} [${currentAttackRoll.textContent >= 0 ? `${currentAttackRoll.textContent}` : currentAttackRoll.textContent}]\nDamage: ${calculateDamage(damageDice, damageModifier)} [${damageModifier >= 0 ? `+${damageModifier}` : damageModifier}]`;
								} else {
									if (range == null || longRange == null) {
										message = `${itemName}\nReach: 5/5ft.\n${weaponDescription}`;
									} else {
										message = `${itemName}\nReach: ${range}/${longRange}ft.\n${weaponDescription}`;
									}
								}
							} else {
								message = `${itemName}\nReach: ${range}/${longRange}ft.\n${weaponDescription}\n\n\nAttack Roll: ${randomNumber + Math.floor((stats.totalDexterity - 10) / 2)} [${currentAttackRoll.textContent >= 0 ? `${currentAttackRoll.textContent}` : currentAttackRoll.textContent}]\nDamage: ${calculateDamage(damageDice, damageModifier)} [${damageModifier >= 0 ? `+${damageModifier}` : damageModifier}]`;
							}
							sendDataToSidebar(message, characterData.name);
						}
					});

					currentAttackRoll.addEventListener('click', function () {//the attack roll for only rolling the attack of a weapons
						const randomNumber = Math.floor(Math.random() * 20) + 1
						if (range < 6) {
							message = `${itemName}\nAttack Roll: ${randomNumber + Math.floor((stats.totalStrength - 10) / 2)} [${currentAttackRoll.textContent >= 0 ? `${currentAttackRoll.textContent}` : currentAttackRoll.textContent}]`;
						} else {
							message = `${itemName}\nAttack Roll: ${randomNumber + Math.floor((stats.totalDexterity - 10) / 2)} [${currentAttackRoll.textContent >= 0 ? `${currentAttackRoll.textContent}` : currentAttackRoll.textContent}]`;
						}

						sendDataToSidebar(message, characterData.name);
					});
				})(itemName, range, longRange, weaponDescription.textContent, damageButton);
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
					const currentFeatsButton = nameButton;
					// Add a click event listener to the current weapon button
					currentFeatsButton.addEventListener('click', function () {
						message = `${currentFeatsButton.textContent}\n_______________\n${characterData.actions.class[i].snippet}`
						sendDataToSidebar(message, characterData.name);
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
						message = `${currentFeatsButton.textContent}\n_______________\n${characterData.actions.feat[i].snippet}`;
						sendDataToSidebar(message, characterData.name);
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
						message = `${currentRaceButton.textContent}\n_______________\n${characterData.actions.race[i].snippet}`
						sendDataToSidebar(message, characterData.name);
					});
				})();
			}
			catch { }
		}

		setTimeout(() => {
			let unarmedStrikeAttackRoll = document.getElementById('unarmedStrikeAttackRoll');
			if (unarmedStrikeAttackRoll) {
				//attack roll
				unarmedStrikeAttackRoll.textContent = (Math.floor((stats.totalStrength - 10) / 2) >= 0 ? `+${Math.floor((stats.totalStrength - 10) / 2)}` : Math.floor((stats.totalStrength - 10) / 2))
			} else {
				console.error("Button not found.");
				console.error("Please refresh page");
			    if (confirm("The page needs to reload to continue using the Character Sheet!")) {
					window.location.reload();
				}
			}

			let unarmedStrikeDamageRoll = document.getElementById('unarmedStrikeDamage');
			let unarmedStrikeAttack = document.getElementById('unarmedStrikeAttackRoll');
			if (unarmedStrikeDamageRoll) {
				//damage roll
				if (characterData.classes[0].definition.name === "Monk") {
					var classLevel = (calculateProf(characterData.currentXp));

					unarmedStrikeAttack.textContent = `${Math.floor((stats.totalDexterity - 10) / 2) >= 0 ? `+${Math.floor((stats.totalDexterity - 10) / 2)}` : Math.floor((stats.totalDexterity - 10) / 2)}`

					if (classLevel < 5) {
						//ignore since the default damage is already set
						unarmedStrikeDamageRoll.textContent = `1d4${Math.floor((stats.totalStrength - 10) / 2) >= 0 ? `+${Math.floor((stats.totalStrength - 10) / 2)}` : Math.floor((stats.totalStrength - 10) / 2)}`
					} else if (classLevel < 11 && classLevel > 4) {
						unarmedStrikeDamageRoll.textContent = `1d6${Math.floor((stats.totalStrength - 10) /2) >= 0 ? `+${Math.floor((stats.totalStrength - 10) /2)}` : Math.floor((stats.totalStrength - 10) /2)}`
					} else if (classLevel < 17 && classLevel > 10) {
						unarmedStrikeDamageRoll.textContent = `1d8${Math.floor((stats.totalStrength - 10) /2) >= 0 ? `+${Math.floor((stats.totalStrength - 10) /2)}` : Math.floor((stats.totalStrength - 10) /2)}`
					} else if (classLevel > 16) {
						unarmedStrikeDamageRoll.textContent = `1d10${Math.floor((stats.totalStrength - 10) /2) >= 0 ? `+${Math.floor((stats.totalStrength - 10) /2)}` : Math.floor((stats.totalStrength - 10) /2)}`
					}
				}
			}
		}, 0);

		//event listeners for the character buttons
		const actionButton = overlayBody.querySelector('#actions');
		actionButton.addEventListener('click', function () {
		});
		const bioButton = overlayBody.querySelector('#bio');
		bioButton.addEventListener('click', function () {
			showBio(adventureData, buttonPressed, characterData, stats);
		});

		const characterButton = overlayBody.querySelector('#character');
		characterButton.addEventListener('click', function () {
			const characterSheetOverlay = document.getElementById('customOverlay');
			characterSheetOverlay.remove();
			showCharacterSheet(adventureData);
		});

		const featuresButton = overlayBody.querySelector('#features');
		featuresButton.addEventListener('click', function () {
			showFeatures(adventureData, buttonPressed, characterData, stats);
		});

		const inventoryButton = overlayBody.querySelector('#inventory');
		inventoryButton.addEventListener('click', function () {
			showInventory(adventureData, buttonPressed, characterData, stats);
		});

		const spellsButton = overlayBody.querySelector('#spells');
		spellsButton.addEventListener('click', function () {
			showSpells(adventureData, buttonPressed, characterData, stats);
		});

		const unarmedStrikeButton = overlayBody.querySelector('#unarmedStrike');//the name unarmed attack
		const unarmedStrikeMod = overlayBody.querySelector('#unarmedStrikeAttackRoll');//the attack roll
		const unarmedStrikeDamage = overlayBody.querySelector('#unarmedStrikeDamage');//the damage for attack roll

		unarmedStrikeButton.addEventListener('click', function () {
			if (unarmedStrikeDamage.textContent.includes("d")) {
				var modifierString = unarmedStrikeDamage.textContent;

				if (unarmedStrikeDamage.textContent.includes('+')) {
					var modifierString = unarmedStrikeDamage.textContent.split('+')[0];
				} else if (unarmedStrikeDamage.textContent.includes("-")) {
					var modifierString = unarmedStrikeDamage.textContent.split('-')[0];
				}

				let randomAttackNumber = Math.floor(Math.random() * 20) + 1//any number from 1 to 20
				if (characterData.classes[0].definition.name === "Monk") {
					var message = `Unarmed Strike\n_________________\nRolled: ${randomAttackNumber}\nTotal: [${randomAttackNumber + parseInt(unarmedStrikeMod.textContent)}]\nDamage\n______\nTotal: ${calculateDamage(modifierString, Math.floor((stats.totalDexterity-10)/2))} Bludgeoning`
				} else {
					var message = `Unarmed Strike\n______________\nRolled: ${randomAttackNumber}\nTotal: [${randomAttackNumber + parseInt(unarmedStrikeMod.textContent)}]\nDamage\n______\nTotal: ${calculateDamage(modifierString, Math.floor((stats.totalStrength - 10) / 2))} Bludgeoning`
				}

				sendDataToSidebar(message, characterData.name);
			}
		});

		unarmedStrikeMod.addEventListener('click', function () {
			let randomAttackNumber = Math.floor(Math.random() * 20) + 1;
			var message = `Unarmed Strike\n_________________\nRolled: ${randomAttackNumber}\nTotal: [${randomAttackNumber + parseInt(unarmedStrikeMod.textContent)}]`;
			sendDataToSidebar(message, characterData.name);
		});

		unarmedStrikeDamage.addEventListener('click', function () {
			var modifierString = unarmedStrikeDamage.textContent;

			if (unarmedStrikeDamage.textContent.includes('+')) {
				var modifierString = unarmedStrikeDamage.textContent.split('+')[0];
			} else if (unarmedStrikeDamage.textContent.includes("-")) {
				var modifierString = unarmedStrikeDamage.textContent.split('-')[0];
			}

			if (characterData.classes[0].definition.name === "Monk") {
				message = `Unarmed Strike\n_________________\n${calculateDamage(modifierString, Math.floor((stats.totalDexterity - 10) / 2))} Bludgeoning`;
			} else {
				message = `Unarmed Strike\n_________________\n${calculateDamage(modifierString, Math.floor((stats.totalStrength - 10) / 2))} Bludgeoning`;
			}

			sendDataToSidebar(message, characterData.name);
		});

		//shows ammo left in inventory
		const ammoList = ["Crossbow Bolts", "Arrows", "Sling Bullets", "Blowgun Needles"]
		for (let i = 0; i < characterData.inventory.length; i++) {
			var ammoDiv = overlayBody.querySelector('#ammoList');
			if (ammoList.includes(characterData.inventory[i].definition.name)) {
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
	});
}

function showBio(adventureData, buttonPressed, characterData, stats) {
	if (characterSheetOverlayOpen && buttonPressed == "null") {
		return;
	}

	const characterSheetOverlay = document.getElementById('customOverlay');
	characterSheetOverlay.style.width = "500px";

	const content = document.getElementById('overlayContainer');
	content.innerHTML = ''; // Clear existing content

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

	const overlayBody = content;
	overlayBody.innerHTML = `
			<div id="overlayContainer">
				<div class="Character-menu-container" style="margin-top: -10px; height: 40px; margin-left: 465px;">
					<div class="character-menu" style="border: 2px solid #336699; padding 5px; height: 230px; width: 110px; margin-left: -120px;">
						<button id="actions" class="btn btn-primary btn-xs" style="font-size: 12px; margin-top: 10px; margin-left: 2px; width: 100px; height: 28px;">Actions</button>
						<button id="bio" class="btn btn-primary btn-xs" style="font-size: 12px; margin-top: -10px; margin-left: 2px; width: 100px; height: 28px;">Bio</button>
						<button id="character" class="btn btn-primary btn-xs" style="font-size: 12px; margin-top: -10px; margin-left: 2px; width: 100px; height: 28px;">Character</button>
						<button id="features" class="btn btn-primary btn-xs" style="font-size: 12px; margin-top: -10px; margin-left: 2px; width: 100px; height: 28px;">Features</button>
						<button id="inventory" class="btn btn-primary btn-xs" style="font-size: 12px; margin-top: -10px; margin-left: 2px; width: 100px; height: 28px;">Inventory</button>
						<button id="spells" class="btn btn-primary btn-xs" style="font-size: 12px; margin-top: -10px; margin-left: 2px; width: 100px; height: 28px;">Spells</button>
					</div>
				</div>
				<div class="bioDiv" style="height: 495px; width: 345px; margin-left: -10px; margin-top: -40px; overflow: auto; border: 2px solid #336699; padding: 10px;">
					<ul id="ContentList">
						<button id=bioButton class=backstory style="font-size: 20px;"><b>Backstory</b></button>
						<div id="backstoryDiv" style="margin-left: 20px;">
							<label class=backstoryLabel style="font-size: 13px;">${characterData.notes.backstory ? characterData.notes.backstory : ""}</label>
						</div>
						<button id=bioButton class=allies style="font-size: 20px;"><b>Allies</b></button>
						<div id="alliesDiv" style="margin-left: 20px;">
							<label class=alliesLabel style="font-size: 13px;">${characterData.notes.allies ? characterData.notes.allies : ""}</label>
						</div>
						<button id=bioButton class=enemies style="font-size: 20px;"><b>Enemies</b></button>
						<div id="enemiesDiv" style="margin-left: 20px;">
							<label class=enemiesLabel style="font-size: 13px;">${characterData.notes.enemies ? characterData.notes.enemies : ""}</label>
						</div>
						<button id=bioButton class=organizations style="font-size: 20px;"><b>Organizations</b></button>
						<div id="organizationsDiv" style="margin-left: 20px;">
							<label class=organizationLabel style="font-size: 13px;">${characterData.notes.organizations ? characterData.notes.organizations : ""}</label>
						</div>
						<button id=bioButton class=otherHoldings style="font-size: 20px;"><b>Other holdings</b></button>
						<div id="otherHoldingsDiv" style="margin-left: 20px;">
							<label class=otherHoldingLabel style="font-size: 13px;">${characterData.notes.otherHoldings ? characterData.notes.otherHoldings : ""}</label>
						</div>
						<button id=bioButton class=otherNotes style="font-size: 20px;"><b>Other Notes</b></button>
						<div id="otherNotesDiv" style="margin-left: 20px;">
							<label class=otherNoteLabel style="font-size: 13px;">${characterData.notes.otherNotes ? characterData.notes.otherNotes : ""}</label>
						</div>
						<button id=bioButton class=personalposs style="font-size: 20px;"><b>Personal Possessions</b></button>
						<div id="personalPossessionsDiv" style="margin-left: 20px;">
							<label class=personalPossLabel style="font-size: 13px;">${characterData.notes.personalPossessions ? characterData.notes.personalPossessions : ""}</label>
						</div>
						<button id=bioButton class=shortDes style="font-size: 20px;"><b>Background: ${characterData.background.definition.name}</b></button>
						<div id="backgroundDescription" style="margin-left: 20px;">
							<label class=backgroundDescLabel style="font-size: 13px;">${removeHtmlTags(characterData.background.definition.shortDescription)}
						</div>
						<button id=bioButton class=features style="font-size: 12px;"><b>Background Feature: ${characterData.background.definition.featureName}</b></button>
						<div id="backgroundFeature" style="margin-left: 20px;">
							<label class=backgroundFeatureLabel style="font-size: 13px;">${removeHtmlTags(characterData.background.definition.featureDescription)}
						</div>
						<button id=bioButton class=appearance style="font-size: 16px;"><b>Appearance</b></button>
						<div id="apperance" style="margin-left: 20px;">
							<label class=apperanceLabel style="font-size: 13px;">${characterData.traits.appearance ? characterData.traits.appearance : ""}
						</div>
						<button id=bioButton class=bond style="font-size: 16px;"><b>Bond</b></button>
						<div id="bond" style="margin-left: 20px;">
							<label class=bondLabel style="font-size: 13px;">${characterData.traits.bonds}
						</div>
						<button id=bioButton class=flaws style="font-size: 16px;"><b>Flaws</b></button>
						<div id="flaws" style="margin-left: 20px;">
							<label class=flawsLabel style="font-size: 13px;">${characterData.traits.flaws}
						</div>
						<button id=bioButton class=ideals style="font-size: 16px;"><b>Ideals</b></button>
						<div id="ideals" style="margin-left: 20px;">
							<label class=idealsLabel style="font-size: 13px;">${characterData.traits.ideals}
						</div>
						<button id=bioButton class=personality style="font-size: 16px;"><b>Personality Traits</b></button>
						<div id="personalityTraits" style="margin-left: 20px;">
							<label class=personalityTraitsLabel style="font-size: 13px;">${characterData.traits.personalityTraits}
						</div>
					</ul>
				</div>
			</div>
    `;

	const backstory = overlayBody.querySelector('.backstory');
	backstory.addEventListener('click', function () {
		const message = `${backstory.textContent}\n${characterData.notes.backstory}`;
		if (message !== "") {
			sendDataToSidebar(message, characterData.name);
		}
	});

	const allies = overlayBody.querySelector('.allies');
	allies.addEventListener('click', function () {
		const message = `${allies.textContent}\n${characterData.notes.allies}`;
		if (message !== "") {
			sendDataToSidebar(message, characterData.name);
		}
	});

	const enemies = overlayBody.querySelector('.enemies');
	enemies.addEventListener('click', function () {
		const message = `${enemies.textContent}\n${characterData.notes.enemies}`;
		if (message !== "") {
			sendDataToSidebar(message, characterData.name);
		}
	});

	const organizations = overlayBody.querySelector('.organizations');
	organizations.addEventListener('click', function () {
		const message = `${organizations.textContent}\n${characterData.notes.organizations}`;
		if (message !== "") {
			sendDataToSidebar(message, characterData.name);
		}
	});

	const otherHoldings = overlayBody.querySelector('.otherHoldings');
	otherHoldings.addEventListener('click', function () {
		const message = `${otherHoldings.textContent}\n${characterData.notes.otherHoldings}`;
		if (message !== "") {
			sendDataToSidebar(message, characterData.name);
		}
	});

	const otherNotes = overlayBody.querySelector('.otherNotes');
	otherNotes.addEventListener('click', function () {
		const message = `${otherNotes.textContent}\n${characterData.notes.otherNotes}`;
		if (message !== "") {
			sendDataToSidebar(message, characterData.name);
		}
	});

	const personalPossessions = overlayBody.querySelector('.personalposs');
	personalPossessions.addEventListener('click', function () {
		const message = `${personalPossessions.textContent}\n${characterData.notes.personalPossessions}`;
		if (message !== "") {
			sendDataToSidebar(message, characterData.name);
		}
	});

	const backgroundDescription = overlayBody.querySelector('.shortDes');
	backgroundDescription.addEventListener('click', function () {
		const message = `${backgroundDescription.textContent}\n${removeHtmlTags(characterData.background.definition.shortDescription)}`;
		if (message !== "") {
			sendDataToSidebar(message, characterData.name);
		}
	});

	const backgroundFeature = overlayBody.querySelector('.features');
	backgroundFeature.addEventListener('click', function () {
		const message = `${backgroundFeature.textContent}\n${removeHtmlTags(characterData.background.definition.featureDescription)}`;
		if (message !== "") {
			sendDataToSidebar(message, characterData.name);
		}
	});

	const appearance = overlayBody.querySelector('.appearance');
	appearance.addEventListener('click', function () {
		const message = `${appearance.textContent}\n${characterData.traits.appearance}`;
		if (message !== "") {
			sendDataToSidebar(message, characterData.name);
		}
	});

	const bond = overlayBody.querySelector('.bond');
	bond.addEventListener('click', function () {
		const message = `${bond.textContent}\n${characterData.traits.bonds}`;
		if (message !== "") {
			sendDataToSidebar(message, characterData.name);
		}
	});

	const flaws = overlayBody.querySelector('.flaws');
	flaws.addEventListener('click', function () {
		const message = `${flaws.textContent}\n${characterData.traits.flaws}`;
		if (message !== "") {
			sendDataToSidebar(message, characterData.name);
		}
	});

	const ideals = overlayBody.querySelector('.ideals');
	ideals.addEventListener('click', function () {
		const message = `${ideals.textContent}\n${characterData.traits.ideals}`;
		if (message !== "") {
			sendDataToSidebar(message, characterData.name);
		}
	});

	const personalityTraits = overlayBody.querySelector('.personality');
	personalityTraits.addEventListener('click', function () {
		const message = `${personalityTraits.textContent}\n${characterData.traits.personalityTraits}`;
		if (message !== "") {
			sendDataToSidebar(message, characterData.name);
		}
	});




	//event listeners for the character buttons
	const actionButton = overlayBody.querySelector('#actions');
	actionButton.addEventListener('click', function () {
		showActions(adventureData, buttonPressed, characterData, stats);
	});

	const bioButton = overlayBody.querySelector('#bio');
	bioButton.addEventListener('click', function () {
	});

	const characterButton = overlayBody.querySelector('#character');
	characterButton.addEventListener('click', function () {
		const characterSheetOverlay = document.getElementById('customOverlay');
		characterSheetOverlay.remove();
		showCharacterSheet(adventureData);
	});

	const featuresButton = overlayBody.querySelector('#features');
	featuresButton.addEventListener('click', function () {
		showFeatures(adventureData, buttonPressed, characterData, stats);
	});

	const inventoryButton = overlayBody.querySelector('#inventory');
	inventoryButton.addEventListener('click', function () {
		showInventory(adventureData, buttonPressed, stats);
	});

	const spellsButton = overlayBody.querySelector('#spells');
	spellsButton.addEventListener('click', function () {
		showSpells(adventureData, buttonPressed, characterData, stats);
	});
}

function showFeatures(adventureData, buttonPressed, characterData, stats) {
	if (characterSheetOverlayOpen && buttonPressed == "null") {
		return;
	}

	const characterSheetOverlay = document.getElementById('customOverlay');
	characterSheetOverlay.style.width = "500px";

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
		characterSheetOverlayOpen = false;

		const characterSheetOverlay = document.getElementById('customOverlay');
		if (characterSheetOverlay) {
			characterSheetOverlay.remove();
		}
	});

	const overlayBody = content; //document.querySelector('.panel-body');
	overlayBody.innerHTML = `
			<div id="overlayContainer">
				<div class="Character-menu-container" style="margin-top: -10px; height: 40px; margin-left: 465px;">
					<div class="character-menu" style="border: 2px solid #336699; padding 5px; height: 230px; width: 110px; margin-left: -120px;">
						<button id="actions" class="btn btn-primary btn-xs" style="font-size: 12px; margin-top: 10px; margin-left: 2px; width: 100px; height: 28px;">Actions</button>
						<button id="bio" class="btn btn-primary btn-xs" style="font-size: 12px; margin-top: -10px; margin-left: 2px; width: 100px; height: 28px;">Bio</button>
						<button id="character" class="btn btn-primary btn-xs" style="font-size: 12px; margin-top: -10px; margin-left: 2px; width: 100px; height: 28px;">Character</button>
						<button id="features" class="btn btn-primary btn-xs" style="font-size: 12px; margin-top: -10px; margin-left: 2px; width: 100px; height: 28px;">Features</button>
						<button id="inventory" class="btn btn-primary btn-xs" style="font-size: 12px; margin-top: -10px; margin-left: 2px; width: 100px; height: 28px;">Inventory</button>
						<button id="spells" class="btn btn-primary btn-xs" style="font-size: 12px; margin-top: -10px; margin-left: 2px; width: 100px; height: 28px;">Spells</button>
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

	try {
		// Iterate over each action type
		actionTypes.forEach(actionType => {
			// Get the array of actions based on the current action type
			const actions = actionType === 'class' ? characterData.actions[actionType] : characterData.actions[actionType];

			// Loop through the actions array and add elements to the listFeatures array
			actions.forEach(action => {
				var featureNameButton = document.createElement('button');
				featureNameButton.id = "featureButton";
				featureNameButton.textContent = action.name;

				var featureDescription = document.createElement('p');
				featureDescription.textContent = descriptionToCharacterData(action.snippet, characterData, stats);

				var breakline = document.createElement('hr');

				// Add all elements to the listFeatures array
				listFeatures.push([featureNameButton, featureDescription, breakline]);

				featureNameButton.addEventListener('click', function () {
					message = `${featureNameButton.textContent}\n_______________\n${featureDescription.textContent}`;
					sendDataToSidebar(message, characterData.name);
				})
			});
		});
	} catch { }

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

				featureNameButton.addEventListener('click', function () {
					message = `${featureNameButton.textContent}\n_______________\n${featureDescription.textContent}`;
					sendDataToSidebar(message, characterData.name);
				})
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
		showActions(adventureData, buttonPressed, characterData, stats);
	});

	const bioButton = overlayBody.querySelector('#bio');
	bioButton.addEventListener('click', function () {
		showBio(adventureData, buttonPressed, characterData, stats);
	});

	const characterButton = overlayBody.querySelector('#character');
	characterButton.addEventListener('click', function () {
		const characterSheetOverlay = document.getElementById('customOverlay');
		characterSheetOverlay.remove();
		showCharacterSheet(adventureData);
	});

	const featuresButton = overlayBody.querySelector('#features');
	featuresButton.addEventListener('click', function () {
	});

	const inventoryButton = overlayBody.querySelector('#inventory');
	inventoryButton.addEventListener('click', function () {
		showInventory(adventureData, buttonPressed, characterData, stats);
	});

	const spellsButton = overlayBody.querySelector('#spells');
	spellsButton.addEventListener('click', function () {
		showSpells(adventureData, buttonPressed, characterData, stats);
	});
}

function showInventory(adventureData, buttonPressed, characterData, stats) {
		if (characterSheetOverlayOpen && buttonPressed == "null") {
			return;
		}

		const characterSheetOverlay = document.getElementById('customOverlay');
		characterSheetOverlay.style.width = "500px";

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
	
		const overlayBody = content;//document.querySelector('.panel-body');
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
						<button id="actions" class="btn btn-primary btn-xs" style="font-size: 12px; margin-top: 10px; margin-left: 2px; width: 100px; height: 28px;">Actions</button>
						<button id="bio" class="btn btn-primary btn-xs" style="font-size: 12px; margin-top: -10px; margin-left: 2px; width: 100px; height: 28px;">Bio</button>
						<button id="character" class="btn btn-primary btn-xs" style="font-size: 12px; margin-top: -10px; margin-left: 2px; width: 100px; height: 28px;">Character</button>
						<button id="features" class="btn btn-primary btn-xs" style="font-size: 12px; margin-top: -10px; margin-left: 2px; width: 100px; height: 28px;">Features</button>
						<button id="inventory" class="btn btn-primary btn-xs" style="font-size: 12px; margin-top: -10px; margin-left: 2px; width: 100px; height: 28px;">Inventory</button>
						<button id="spells" class="btn btn-primary btn-xs" style="font-size: 12px; margin-top: -10px; margin-left: 2px; width: 100px; height: 28px;">Spells</button>
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
			itemDescription.textContent = removeHtmlTags(characterData.inventory[i].definition.description).replace(/<br><br>/g, '');

			//breakline
			const breakline = document.createElement('hr');

			allInventoryDiv.appendChild(itemButton);
			allInventoryDiv.appendChild(quantityLabel);
			allInventoryDiv.appendChild(costLabel);
			allInventoryDiv.appendChild(itemDescription);
			allInventoryDiv.appendChild(breakline);

			(function (index) {
				itemButton.addEventListener('click', function () {
					message = `${characterData.inventory[index].definition.name}\n_______________\nQuantity: ${characterData.inventory[index].quantity}\nCost: ${characterData.inventory[index].definition.cost ? characterData.inventory[index].definition.cost : "Unknown"}\n\n${removeHtmlTags(characterData.inventory[index].definition.description).replace('<br><br>','')}`;
					sendDataToSidebar(message, characterData.name);
				});
			})(i);
		}

		//event listeners for the character buttons
		const actionButton = overlayBody.querySelector('#actions');
		actionButton.addEventListener('click', function () {
			showActions(adventureData, buttonPressed, characterData, stats);
		});

		const bioButton = overlayBody.querySelector('#bio');
		bioButton.addEventListener('click', function () {
			showBio(adventureData, buttonPressed, characterData, stats);
		});

		const characterButton = overlayBody.querySelector('#character');
		characterButton.addEventListener('click', function () {
			const characterSheetOverlay = document.getElementById('customOverlay');
			characterSheetOverlay.remove();
			showCharacterSheet(adventureData);
		});

		const featuresButton = overlayBody.querySelector('#features');
		featuresButton.addEventListener('click', function () {
			showFeatures(adventureData, buttonPressed, characterData, stats);
		});

		const inventoryButton = overlayBody.querySelector('#inventory');
		inventoryButton.addEventListener('click', function () {
		});

		const spellsButton = overlayBody.querySelector('#spells');
		spellsButton.addEventListener('click', function () {
			showSpells(adventureData, buttonPressed, characterData, stats);
		});
	}

function showSpells(adventureData, buttonPressed, characterData, stats) {
	if (characterSheetOverlayOpen && buttonPressed == "null") {
		return;
	}

	const characterSheetOverlay = document.getElementById('customOverlay');
	characterSheetOverlay.style.width = "500px";

	const content = document.getElementById('overlayContainer');
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
			const overlayBody = content;
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
			    		<button id="actions" class="btn btn-primary btn-xs" style="font-size: 12px; margin-top: 10px; margin-left: 2px; width: 100px; height: 28px;">Actions</button>
					<button id="bio" class="btn btn-primary btn-xs" style="font-size: 12px; margin-top: -10px; margin-left: 2px; width: 100px; height: 28px;">Bio</button>
					<button id="character" class="btn btn-primary btn-xs" style="font-size: 12px; margin-top: -10px; margin-left: 2px; width: 100px; height: 28px;">Character</button>
					<button id="features" class="btn btn-primary btn-xs" style="font-size: 12px; margin-top: -10px; margin-left: 2px; width: 100px; height: 28px;">Features</button>
					<button id="inventory" class="btn btn-primary btn-xs" style="font-size: 12px; margin-top: -10px; margin-left: 2px; width: 100px; height: 28px;">Inventory</button>
					<button id="spells" class="btn btn-primary btn-xs" style="font-size: 12px; margin-top: -10px; margin-left: 2px; width: 100px; height: 28px;">Spells</button>
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
    							<input class="spellSlots1" value="${characterData.spellSlots[0].available}" disabled=true style="width: 40px;">
							<div style="width: 5px;"></div>
    							<input class="spellSlotsUsed1" value="${data[0].used}" disabled=true style="width: 40px;">
						</div>
						<br>
						</div>
						<div id="level2">
  							<h2><b>Level 2</b></h2>
							<p>Spell Slots&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbspExpended Spell Slots</p>
						<div style="display: flex; justify-content: space-between;">
    							<input class="spellSlots2" value="${characterData.spellSlots[1].available}" disabled=true style="width: 40px;">
							<div style="width: 5px;"></div>
    							<input class="spellSlotsUsed" value="${data[1].used}" disabled=true style="width: 40px;">
						</div>
						<br>
						</div>
						<div id="level3">
  							<h2><b>Level 3</b></h2>
						<p>Spell Slots&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbspExpended Spell Slots</p>
						<div style="display: flex; justify-content: space-between;">
    							<input class="spellSlots3" value="${characterData.spellSlots[2].available}" disabled=true style="width: 40px;">
							<div style="width: 5px;"></div>
    							<input class="spellSlotsUsed" value="${data[2].used}" disabled=true style="width: 40px;">
						</div>
						<br>
						</div>
						<div id="level4">
   							<h2><b>Level 4</b></h2>
						<p>Spell Slots&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbspExpended Spell Slots</p>
						<div style="display: flex; justify-content: space-between;">
    							<input class="spellSlots4" value="${characterData.spellSlots[3].available}" disabled=true style="width: 40px;">
							<div style="width: 5px;"></div>
    							<input class="spellSlotsUsed" value="${data[3].used}" disabled=true style="width: 40px;">
						</div>
						<br>
						</div>
						<div id="level5">
   							<h2><b>Level 5</b></h2>
						<p>Spell Slots&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbspExpended Spell Slots</p>
						<div style="display: flex; justify-content: space-between;">
    							<input class="spellSlots5" value="${characterData.spellSlots[4].available}" disabled=true style="width: 40px;">
							<div style="width: 5px;"></div>
    							<input class="spellSlotsUsed" value="${data[4].used}" disabled=true style="width: 40px;">
						</div>
						<br>
						</div>
						<div id="level6">
  							<h2><b>Level 6</b></h2>
						<p>Spell Slots&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbspExpended Spell Slots</p>
						<div style="display: flex; justify-content: space-between;">
    							<input class="spellSlots6" value="${characterData.spellSlots[5].available}" disabled=true style="width: 40px;">
							<div style="width: 5px;"></div>
    							<input class="spellSlotsUsed" value="${data[5].used}" disabled=true style="width: 40px;">
						</div>
						<br>
						</div>
						<div id="level7">
  							<h2><b>Level 7</b></h2>
						<p>Spell Slots&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbspExpended Spell Slots</p>
						<div style="display: flex; justify-content: space-between;">
    							<input class="spellSlots7" value="${characterData.spellSlots[6].available}" disabled=true style="width: 40px;">
							<div style="width: 5px;"></div>
    							<input class="spellSlotsUsed" value="${data[6].used}" disabled=true style="width: 40px;">
						</div>
						<br>
						</div>
						<div id="level8">
  							<h2><b>Level 8</b></h2>
						<p>Spell Slots&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbspExpended Spell Slots</p>
						<div style="display: flex; justify-content: space-between;">
    							<input class="spellSlots8" value="${characterData.spellSlots[7].available}" disabled=true style="width: 40px;">
							<div style="width: 5px;"></div>
    							<input class="spellSlotsUsed" value="${data[7].used}" disabled=true style="width: 40px;">
						</div>
						<br>
						</div>
						<div id="level9">
  							<h2><b>Level 9</b></h2>
						<p>Spell Slots&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbspExpended Spell Slots</p>
						<div style="display: flex; justify-content: space-between;">
    							<input class="spellSlots9" value="${characterData.spellSlots[8].available}" disabled=true style="width: 40px;">
							<div style="width: 5px;"></div>
    							<input class="spellSlotsUsed" value="${data[8].used}" disabled=true style="width: 40px;">
						</div>
						<br>
						</div>
					</div>
					</ul>
				</div>
			</div>
			`;

			var spellSlotElement9 = document.querySelector('.spellSlots9');
			var spellSlotElement8 = document.querySelector('.spellSlots8');
			var spellSlotElement7 = document.querySelector('.spellSlots7');
			var spellSlotElement6 = document.querySelector('.spellSlots6');
			var spellSlotElement5 = document.querySelector('.spellSlots5');
			var spellSlotElement4 = document.querySelector('.spellSlots4');
			var spellSlotElement3 = document.querySelector('.spellSlots3');
			var spellSlotElement2 = document.querySelector('.spellSlots2');
			var spellSlotElement1 = document.querySelector('.spellSlots1');
			
			const characterLevel = calculateLevel(characterData.currentXp, characterData);

  			// Get the spell slot values based on the character's level
  			const spellSlotValues = characterData.classes[0].definition.spellRules.levelSpellSlots[characterLevel];

			// Set the spell slot values
  			spellSlotElement1.value = spellSlotValues[0];
  			spellSlotElement2.value = spellSlotValues[1];
  			spellSlotElement3.value = spellSlotValues[2];
  			spellSlotElement4.value = spellSlotValues[3];
 			spellSlotElement5.value = spellSlotValues[4];
 			spellSlotElement6.value = spellSlotValues[5];
 		    spellSlotElement7.value = spellSlotValues[6];
 			spellSlotElement8.value = spellSlotValues[7];
 			spellSlotElement9.value = spellSlotValues[8];			

			//warlocks spells are different to other characters as they always cast at highest spell slots avaliable, so they only have set spell slots for the highest spell level avaliable to them
			if (characterData.classes[0].definition.name === "Warlock") {
				const characterLevel = calculateLevel(characterData.currentXp, characterData);
				var spellSlotElement5 = document.querySelector('.spellSlots5');
				var spellSlotElement4 = document.querySelector('.spellSlots4');
				var spellSlotElement3 = document.querySelector('.spellSlots3');
				var spellSlotElement2 = document.querySelector('.spellSlots2');
				var spellSlotElement1 = document.querySelector('.spellSlots1');

				let highestSpellLevel = 0;

				for (let i = 0; i < characterData.classSpells[0].spells.length; i++) {
				    if (characterData.classSpells[0].spells[i].definition.level > highestSpellLevel) {
				 	highestSpellLevel = characterData.classSpells[0].spells[i].definition.level;
				    }
				}

				if (highestSpellLevel === 1) {
					if (characterLevel === 1) {
						spellSlotElement1.disable = false;
						spellSlotElement1.value = '1';
						spellSlotElement1.disable = true;
					} else if (characterLevel > 1 && characterLevel < 11) {
						spellSlotElement1.disable = false;
						spellSlotElement1.value = '2';
						spellSlotElement1.disable = true;
					} else if (characterLevel > 10 && characterLevel < 17) {
						spellSlotElement1.disable = false;
						spellSlotElement1.value = '3';
						spellSlotElement1.disable = true;
					} else if (characterLevel > 16) {
						spellSlotElement1.disable = false;
						spellSlotElement1.value = '4';
						spellSlotElement1.disable = true;
					}
				} else if (highestSpellLevel === 2) {
					if (characterLevel === 1) {
						spellSlotElement2.disable = false;
						spellSlotElement2.value = '1';
						spellSlotElement2.disable = true;
					} else if (characterLevel > 1 && characterLevel < 11) {
						spellSlotElement2.disable = false;
						spellSlotElement2.value = '2';
						spellSlotElement2.disable = true;
					} else if (characterLevel > 10 && characterLevel < 17) {
						spellSlotElement2.disable = false;
						spellSlotElement2.value = '3';
						spellSlotElement2.disable = true;
					} else if (characterLevel > 16) {
						spellSlotElement2.disable = false;
						spellSlotElement2.value = '4';
						spellSlotElement2.disable = true;
					}
				} else if (highestSpellLevel === 3) {
					if (characterLevel === 1) {
						spellSlotElement3.disable = false;
						spellSlotElement3.value = '1';
						spellSlotElement3.disable = true;
					} else if (characterLevel > 1 && characterLevel < 11) {
						spellSlotElement3.disable = false;
						spellSlotElement3.value = '2';
						spellSlotElement3.disable = true;
					} else if (characterLevel > 10 && characterLevel < 17) {
						spellSlotElement3.disable = false;
						spellSlotElement3.value = '3';
						spellSlotElement3.disable = true;
					} else if (characterLevel > 16) {
						spellSlotElement3.disable = false;
						spellSlotElement3.value = '4';
						spellSlotElement3.disable = true;
					}
				} else if (highestSpellLevel === 4) {
					if (characterLevel === 1) {
						spellSlotElement4.disable = false;
						spellSlotElement4.value = '1';
						spellSlotElement4.disable = true;
					} else if (characterLevel > 1 && characterLevel < 11) {
						spellSlotElement4.disable = false;
						spellSlotElement4.value = '2';
						spellSlotElement4.disable = true;
					} else if (characterLevel > 10 && characterLevel < 17) {
						spellSlotElement4.disable = false;
						spellSlotElement4.value = '3';
						spellSlotElement4.disable = true;
					} else if (characterLevel > 16) {
						spellSlotElement5.disable = false;
						spellSlotElement5.value = '4';
						spellSlotElement5.disable = true;
					}
				} else if (highestSpellLevel === 5) {
					if (characterLevel === 1) {
						spellSlotElement5.disable = false;
						spellSlotElement5.value = '1';
						spellSlotElement5.disable = true;
					} else if (characterLevel > 1 && characterLevel < 11) {
						spellSlotElement5.disable = false;
						spellSlotElement5.value = '2';
						spellSlotElement5.disable = true;
					} else if (characterLevel > 10 && characterLevel < 17) {
						spellSlotElement5.disable = false;
						spellSlotElement5.value = '3';
						spellSlotElement5.disable = true;
					} else if (characterLevel > 16) {
						spellSlotElement5.disable = false;
						spellSlotElement5.value = '4';
						spellSlotElement5.disable = true;
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
							try {
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
							} catch(TypeError){
								spellInformation["components"] = "Components: ";
							}

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

							if (spellInformation['school level'].split(' Level ')[1] == 1) {
								const maxSpellSlot = document.querySelector('.spellSlots1');
								const avaliableSpellSlots = document.querySelector('.spellSlotsUsed1');

								if (avaliableSpellSlots.value != maxSpellSlot.value) {
									spellInfo(buttonPressed, adventureData, spellInformation, spellLocation[j][i].definition.level, characterData, stats, true);
								} else {
									spellInfo(buttonPressed, adventureData, spellInformation, spellLocation[j][i].definition.level, characterData, stats, false);
								}
							} else {
								spellInfo(buttonPressed, adventureData, spellInformation, spellLocation[j][i].definition.level, characterData, stats, true);
							}

							
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
				showActions(adventureData, buttonPressed, characterData, stats);
			});

			const bioButton = overlayBody.querySelector('#bio');
			bioButton.addEventListener('click', function () {
				showBio(adventureData, buttonPressed, characterData, stats);
			});

			const characterButton = overlayBody.querySelector('#character');
			characterButton.addEventListener('click', function () {
				const characterSheetOverlay = document.getElementById('customOverlay');
				characterSheetOverlay.remove();
				showCharacterSheet(adventureData);
			});

			const featuresButton = overlayBody.querySelector('#features');
			featuresButton.addEventListener('click', function () {
				showFeatures(adventureData, buttonPressed, characterData, stats);
			});

			const inventoryButton = overlayBody.querySelector('#inventory');
			inventoryButton.addEventListener('click', function () {
				showInventory(adventureData, buttonPressed, characterData, stats);
			});

			const spellsButton = overlayBody.querySelector('#spells');
			spellsButton.addEventListener('click', function () {
			});
		}
	});
}

function spellInfo(buttonPressed, adventureData, spellInformation, spellLevel, characterData, stats, saveSpells) {
	if (characterSheetOverlayOpen && buttonPressed === null) {
		return;
	}

	const characterSheetOverlay = document.getElementById('customOverlay');
	characterSheetOverlay.style.width = "400px";

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
	header.innerHTML = `${characterData.name} - ${spellInformation['name']} ${characterHidden} <span class="glyphicon glyphicon-remove close" aria-hidden="true"></span>`;

	//closes the overlay on button click of the cross
	const closeButton = header.querySelector('.close');
	closeButton.addEventListener('click', function () {
		characterSheetOverlayOpen = false;

		const characterSheetOverlay = document.getElementById('customOverlay');
		if (characterSheetOverlay) {
			characterSheetOverlay.remove();
		}
	});

	overlayBody = content;
	overlayBody.innerHTML = `
        <div id="overlayContainer">
            <button id="backButton" class="btn btn-primary btn-xs" style="height=75px; width=0px; font-size: 25px; margin-top: 0px; margin-left: 0px;">🢀</button>
            <div class="spellDiv" style="height: 400px; width: 365px; margin-left: -10px; margin-top: 25px; overflow: auto; border: 2px solid #336699; padding: 10px;">
                <h2><b>${spellInformation['name']}</b></h2>
                <hr>
                <h5><b>${spellInformation['casting time']}</b></h5>
                <h5><b>${spellInformation['range']}</b></h5>
                <h5><b>${spellInformation['components']}</b></h5>
                <h5><b>${spellInformation['duration']}</b></h5>
                <h5>${spellInformation['description']}</h5>
            </div>
			 <div id=buttonFooter>
			</div>
        <div>
    `;
	let highestSpellLevel = 0;
	var spellIsCantrip = false;

	if (characterData.classes[0].definition.name === "Warlock") {
		var castButton = document.createElement('button');
		const buttonFooter = document.querySelector('#buttonFooter');
		castButton.id = "castSpell";
		castButton.className = "btn btn-primary btn-xs";
		castButton.style.fontSize = '25px';
		castButton.style.marginLeft = '0px';
		castButton.style.marginTop = '5px';
		castButton.textContent = "Cast Spell"

		buttonFooter.appendChild(castButton);

		for (let i = 0; i < characterData.classSpells[0].spells.length; i++) {
			if (characterData.classSpells[0].spells[i].definition.level > highestSpellLevel) {
				highestSpellLevel = characterData.classSpells[0].spells[i].definition.level;
			}
		}
		console.log(spellInformation);
		if (spellInformation['school level'].includes('Cantrip')) {
			castButton.textContent = `Cast Spell as cantrip`;
			spellIsCantrip = true;
		} else {
			if (spellInformation['cast at will'] === true) {//true must mean it can't be cast at will, seems to be backward meaning
				castButton.textContent = `Cast Spell At Highest Level (${highestSpellLevel})`;
			} else {
				castButton.textContent = "Cast Spell at Will";
			}
		}
	} else {
		var castButton = document.createElement('button');
		castButton.id = "castSpell";
		castButton.className = "btn btn-primary btn-xs";
		castButton.style.fontSize = '25px';
		castButton.style.marginLeft = '75px';
		castButton.style.marginTop = '5px';
		castButton.textContent = "Cast Spell";

		overlayBody.appendChild(castButton);
	}

	const backButton = overlayBody.querySelector('#backButton');
	backButton.addEventListener('click', function () {
		showSpells(adventureData, buttonPressed, characterData, stats);
	});

	const castSpell = overlayBody.querySelector('#castSpell');
	castSpell.addEventListener('click', function () {
		const newline = "\n";

		var message = (
			spellInformation.name + newline +
			spellInformation["school level"] + newline +
			spellInformation["casting time"] + newline +
			spellInformation.range + newline +
			spellInformation.components + newline +
			spellInformation.duration + newline +
			newline +
			spellInformation.description.replace(/<br><br>/g, '\n\n')
		);

		if (characterData.classes[0].definition.name === "Warlock") {
			if (spellIsCantrip) {
				sendDataToSidebar(message, characterData.name);
			} else {
				sendDataToSidebar(message + `\n\n[Cast at highest level]`, characterData.name);
			}

			getSpellSlots(function (data) {
				if (data) {
					if (highestSpellLevel == 1) {
						const maxSpellSlots = document.querySelector(`.spellSlots1`);
						if (spellInformation["cast at will"]) {
							data[0].used = data[0].used + 1;
						}
					} else if (highestSpellLevel == 2) {
						const maxSpellSlots = document.querySelector('.spellSlots2');
						if (spellInformation["cast at will"]) {
							data[1].used = data[1].used + 1;
						}
					} else if (highestSpellLevel == 3) {
						const maxSpellSlots = document.querySelector('.spellSlots3');
						if (spellInformation["cast at will"]) {
							data[2].used = data[2].used + 1;
						}
					} else if (highestSpellLevel == 4) {
						const maxSpellSlots = document.querySelector('.spellSlots4');
						if (spellInformation["cast at will"]) {
							data[3].used = data[3].used + 1;
						}
					} else if (highestSpellLevel == 5) {
						const maxSpellSlots = document.querySelector('.spellSlots5');
						if (spellInformation["cast at will"]) {
							data[4].used = data[4].used + 1;
						}
					}

					if (saveSpells === true) {
						saveSpellSlots(data, function () {
							showSpells(adventureData, buttonPressed, characterData, stats);
						});
					}
				}
			});

		} else {
			sendDataToSidebar(message, characterData.name);

			getSpellSlots(function (data) {
				if (data) {
					switch (spellLevel) {
						case 1:
							if (spellInformation["cast at will"]) {
								data[0].used = data[0].used + 1;
							}
							break;
						case 2:
							if (spellInformation["cast at will"]) {
								data[1].used = data[1].used + 1;
							}
							break;
						case 3:
							if (spellInformation["cast at will"]) {
								data[2].used = data[2].used + 1;
							}
							break;
						case 4:
							if (spellInformation["cast at will"]) {
								data[3].used = data[3].used + 1;
							}
							break;
						case 5:
							if (spellInformation["cast at will"]) {
								data[4].used = data[4].used + 1;
							}
							break;
						case 6:
							if (spellInformation["cast at will"]) {
								data[5].used = data[5].used + 1;
							}
							break;
						case 7:
							if (spellInformation["cast at will"]) {
								data[6].used = data[6].used + 1;
							}
							break;
						case 8:
							if (spellInformation["cast at will"]) {
								data[7].used = data[7].used + 1;
							}
							break;
						case 9:
							if (spellInformation["cast at will"]) {
								data[8].used = data[8].used + 1;
							}
							break;
					}

					if (saveSpells === true) {
						saveSpellSlots(data, function () {
							showSpells(adventureData, buttonPressed, characterData, stats);
						});
					}
				}
			});
		}
	});
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

function calculateLevel(xp, characterData) {
    const xpThresholds = [0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000];

	for (let i = 0; i < xpThresholds.length; i++) {
		if (xp > 0) {
			if (xp < xpThresholds[i]) {
				return i;
			}
		} else {
			return characterData.classes[0].level;
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
			} else if (abilityIncrease === "Intellegence") {
				totalIntelligence += characterData.modifiers.race[i].value;
			} else if (abilityIncrease === "Wisdom") {
				totalWisdom += characterData.modifiers.race[i].value;
			} else if (abilityIncrease === "Charisma") {
				totalCharisma += characterData.modifiers.race[i].value;
			}
		}
	}

	for (let i = 0; i < characterData.modifiers.feat.length; i++) {
		const abilities = ["Strength", "Dexterity", "Constitution", "Intellegence", "Wisdom", "Charisma"]
		const type = characterData.modifiers.feat[i].friendlySubtypeName.replace(' Score', '');

		if (abilities.includes(type) && characterData.modifiers.feat[i].type === "bonus") {
			const ability = abilities.includes(type);
			if (type === "Strength" && ability === true) {
				totalStrength += characterData.modifiers.feat[i].value;
			} else if (type === 'Dexterity' && ability === true) {
				totalDexterity += characterData.modifiers.feat[i].value;
			} else if (type === 'Constitution' && type === true) {
				totalConstitution += characterData.modifiers.feat[i].value;
			} else if (type === 'Intellegence' && ability === true) {
				totalIntellegence += characterData.modifiers.feat[i].value;
			} else if (type === 'Wisdom' && ability === true) {
				totalWisdom += characterData.modifiers.feat[i].value;
			} else if (type === 'Charisma' && ability === true) {
				totalCharisma += characterData.modifiers.feat[i].value;
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

	for (let i = 0; i < characterData.modifiers.background.length; i++) {
		const abilities = ["Strength", "Dexterity", "Constitution", "Intellegence", "Wisdom", "Charisma"]
		const type = characterData.modifiers.background[i].friendlySubtypeName.replace(' Score', '');

		if (abilities.includes(type) && characterData.modifiers.background[i].type === "bonus") {
			const ability = abilities.includes(type);
			if (type === "Strength" && ability === true) {
				totalStrength += characterData.modifiers.background[i].value;
			} else if (type === 'Dexterity' && ability === true) {
				totalDexterity += characterData.modifiers.background[i].value;
			} else if (type === 'Constitution' && type === true) {
				totalConstitution += characterData.modifiers.background[i].value;
			} else if (type === 'Intellegence' && ability === true) {
				totalIntellegence += characterData.modifiers.background[i].value;
			} else if (type === 'Wisdom' && ability === true) {
				totalWisdom += characterData.modifiers.background[i].value;
			} else if (type === 'Charisma' && ability === true) {
				totalCharisma += characterData.modifiers.background[i].value;
			}
		}
	}

	for (let i = 0; i < characterData.modifiers.item.length; i++) {
		const abilities = ["Strength", "Dexterity", "Constitution", "Intellegence", "Wisdom", "Charisma"]
		const type = characterData.modifiers.item[i].friendlySubtypeName.replace(' Score', '');

		if (abilities.includes(type) && characterData.modifiers.item[i].type === "bonus") {
			const ability = abilities.includes(type);
			if (type === "Strength" && ability === true) {
				totalStrength += characterData.modifiers.item[i].value;
			} else if (type === 'Dexterity' && ability === true) {
				totalDexterity += characterData.modifiers.item[i].value;
			} else if (type === 'Constitution' && type === true) {
				totalConstitution += characterData.modifiers.item[i].value;
			} else if (type === 'Intellegence' && ability === true) {
				totalIntellegence += characterData.modifiers.item[i].value;
			} else if (type === 'Wisdom' && ability === true) {
				totalWisdom += characterData.modifiers.item[i].value;
			} else if (type === 'Charisma' && ability === true) {
				totalCharisma += characterData.modifiers.item[i].value;
			}
		}
	}

	for (let i = 0; i < characterData.modifiers.condition.length; i++) {
		const abilities = ["Strength", "Dexterity", "Constitution", "Intellegence", "Wisdom", "Charisma"]
		const type = characterData.modifiers.condition[i].friendlySubtypeName.replace(' Score', '');

		if (abilities.includes(type) && characterData.modifiers.condition[i].type === "bonus") {
			const ability = abilities.includes(type);
			if (type === "Strength" && ability === true) {
				totalStrength += characterData.modifiers.condition[i].value;
			} else if (type === 'Dexterity' && ability === true) {
				totalDexterity += characterData.modifiers.condition[i].value;
			} else if (type === 'Constitution' && type === true) {
				totalConstitution += characterData.modifiers.condition[i].value;
			} else if (type === 'Intellegence' && ability === true) {
				totalIntellegence += characterData.modifiers.condition[i].value;
			} else if (type === 'Wisdom' && ability === true) {
				totalWisdom += characterData.modifiers.condition[i].value;
			} else if (type === 'Charisma' && ability === true) {
				totalCharisma += characterData.modifiers.condition[i].value;
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

function removeHtmlTags(htmlString) {
	const doc = new DOMParser().parseFromString(htmlString, 'text/html');
	const paragraphs = doc.body.getElementsByTagName('p');
	let result = "";

	for (const paragraph of paragraphs) {
		result += (paragraph.textContent + '<br><br>');
	}

	return result;
}
//timeing issue here as it gets the spells before the updated spells are updated
function getSpellSlots(callback) {
	chrome.storage.local.get('currentSpellSlots', function (result) {
		if (result.currentSpellSlots) {
			callback(result.currentSpellSlots);
		} else {
			callback(null);
		}
	});
}

function saveSpellSlots(spellSlots, callback = () => { }) {
	chrome.storage.local.get('currentSpellSlots', function (result) {
		if (result.currentSpellSlots != null && spellSlots != null) {
			chrome.storage.local.set({ 'currentSpellSlots': spellSlots }, function () {
				callback();
			});
		} else {
			chrome.storage.local.get('characterData', function (result) {
				const characterData = result.characterData;
				chrome.storage.local.set({ 'currentSpellSlots': characterData.spellSlots }, function () {
					callback();
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

function rollDice(numberOfDice, sides) {
	let total = 0;
	for (let i = 0; i < numberOfDice; i++) {
		total += Math.floor(Math.random() * sides) + 1;
	}
	return total;
}

function fetchJsonDataFromUrl(url) {
	return new Promise((resolve, reject) => {
		fetch(url)
			.then(response => {
				if (!response.ok) {
					throw new Error('Network response was not ok');
				}
				return response.json();
			})
			.then(jsonData => {
				resolve(jsonData);
			})
			.catch(error => {
				reject(error);
			});
	});
}

function calculateDamage(dice, modifier) {
	const [numberOfDice, sides] = dice.split('d').map(Number);
	const damageRoll = rollDice(numberOfDice, sides);
	const totalDamage = damageRoll + modifier;
	return `${totalDamage}`;
}
