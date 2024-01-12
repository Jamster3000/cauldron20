let characterSheetOverlayOpen = false;

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
            viewCharacter.style.bottom = '15px';
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
    playArea.style.bottom = '60px';
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

    chrome.storage.local.get('characterData', function(result) {
        const characterData = result.characterData;
		const stats = getCharacterStats(characterData);
		console.log(characterData);
        console.log(adventureData);

        const overlayContainer = document.createElement('div');
        overlayContainer.id = 'customOverlay';
        overlayContainer.classList.add('panel', 'panel-primary');
        overlayContainer.style.display = 'none';
        overlayContainer.style.position = 'fixed';
        overlayContainer.style.top = '50px';
        overlayContainer.style.left = '25px';
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
		 });

		const dexButton = overlayBody.querySelector('#dexButton');
		dexButton.addEventListener('click', function() {
			console.log("Your dexterity:", stats.totalDexterity);
		});
	
		const conButton = overlayBody.querySelector('#conButton');
			conButton.addEventListener('click', function() {
    			console.log("Your constitution:", stats.totalConstitution);
		});

		const intButton = overlayBody.querySelector('#intButton');
		intButton.addEventListener('click', function() {
    			console.log("Your intelligence:", stats.totalintellegence);
		});

		const wisButton = overlayBody.querySelector('#wisButton');
		wisButton.addEventListener('click', function() {
				console.log("Your wisdom:", stats.totalWisdom);
		});

		const chaButton = overlayBody.querySelector('#chaButton');
		chaButton.addEventListener('click', function() {
  		  console.log("Your charisma:", stats.totalCharisma);
		});

		//event listeners for the character buttons
		const actionButton = overlayBody.querySelector('#actions');
		actionButton.addEventListener('click', function() {
			console.log("action button pressed");
			showActions(adventureData);
		});
	
		const bioButton = overlayBody.querySelector('#bio');
		bioButton.addEventListener('click', function() {
			console.log("bio button pressed");
			showBio(adventureData);
		});

		const characterButton = overlayBody.querySelector('#character');
		characterButton.addEventListener('click', function() {
			console.log('character button pressed');
			showCharacterSheet(adventureData, "null");
		});

		const featuresButton = overlayBody.querySelector('#features');
		featuresButton.addEventListener('click', function() {
			console.log('features button pressed');
			showFeatures(adventureData);
		});

		const inventoryButton = overlayBody.querySelector('#inventory');
		inventoryButton.addEventListener('click', function() {
			console.log('inventory button pressed');
			showInventory(adventureData);
		});

		const spellsButton = overlayBody.querySelector('#spells');
		spellsButton.addEventListener('click', function() {
			console.log('spells button pressed');
			showSpells(adventureData);
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
		for (let i = 0; i<listSkills.length; i++) {
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
				total = Math.floor((stats.totalStrength-10)/2) + characterProf;
			} else if (listSkills[i].ability === "Dex") {
				total = Math.floor((stats.totalDexterity-10)/2) + characterProf;
			} else if (listSkills[i].ability === "Int") {
				total = Math.floor((stats.totalConstitution-10)/2) + characterProf;
			} else if (listSkills[i].ability === "Wis") {
				total = Math.floor((stats.totalWisdom-10)/2) + characterProf;
			} else if (listSkills[i].ability === "Cha") {
				total = Math.floor((stats.totalCharisma-10)/2) + characterProf;
			}
				skillModifier.textContent = total >= 0 ? `+${total}` : total;

			skillModifier.addEventListener('click', function () {
        			handleSkillButtonClick(listSkills[i].name, total);
    			});
			} else {	
			let total = 0;

			if (listSkills[i].ability === "Str") {
				total = Math.floor((stats.totalStrength-10)/2);
			} else if (listSkills[i].ability === "Dex") {
				total = Math.floor((stats.totalDexterity-10)/2);
			} else if (listSkills[i].ability === "Con") {
				total = Math.floor((stats.totalConstitution-10)/2);
			} else if (listSkills[i].ability === "Int") {
				total = Math.floor((stats.totalIntellegence-10)/2);
			} else if (listSkills[i].ability === "Wis") {
				total = Math.floor((stats.totalWisdom-10)/2);
			} else if (listSkills[i].ability === "Cha") {
				total = Math.floor((stats.totalCharisma-10)/2);
			}
			skillModifier.textContent = total >= 0 ? `+${total}` : total;

			skillModifier.addEventListener('click', function () {
       				handleSkillButtonClick(listSkills[i].name, total);
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
        			handleSkillButtonClick(savingThrowList[i], total);
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
        			handleSkillButtonClick(savingThrowList[i], total);
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

function showActions(adventureData) {
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

		// clear content of overlay
		const content = document.getElementById('overlayContainer');
		content.innerHTML = '';

		const header = document.getElementById('titleBar');
		header.innerHTML = `${characterData.name} - Action ${characterHidden} <span class="glyphicon glyphicon-remove close" aria-hidden="true"></span>`;

		const overlayBody = document.createElement('div');
		overlayBody.classList.add('panel-body');

		overlayBody.innerHTML = `
            <style>
                .vertical-line {
                    border-left: 1px solid #000; /* Adjust the color and size as needed */
                    height: 30px; /* Adjust the height as needed */
                    margin: 0 10px; /* Adjust the margin as needed */
                }
            </style>
			<div>
				<div class="Character-menu-container" style="margin-top: -10px; height: 40px; margin-left: 485px;">
					<div class="character-menu" style="border: 2px solid #336699; padding 5px; height: 230px; width: 110px; margin-left: -120px;">
						<button id="actions" class="btn btn-primary btn-xs open_menu" style="font-size: 12px; margin-top: 10px; margin-left: 2px; width: 100px; height: 28px;">Actions</button>
						<button id="bio" class="btn btn-primary btn-xs open_menu" style="font-size: 12px; margin-top: -10px; margin-left: 2px; width: 100px; height: 28px;">Bio</button>
						<button id="character" class="btn btn-primary btn-xs open_menu" style="font-size: 12px; margin-top: -10px; margin-left: 2px; width: 100px; height: 28px;">Character</button>
						<button id="features" class="btn btn-primary btn-xs open_menu" style="font-size: 12px; margin-top: -10px; margin-left: 2px; width: 100px; height: 28px;">Features</button>
						<button id="inventory" class="btn btn-primary btn-xs open_menu" style="font-size: 12px; margin-top: -10px; margin-left: 2px; width: 100px; height: 28px;">Inventory</button>
						<button id="spells" class="btn btn-primary btn-xs open_menu" style="font-size: 12px; margin-top: -10px; margin-left: 2px; width: 100px; height: 28px;">Spells</button>
					</div>
				</div>
				<div id="actionsList" style="height: 400px; width: 350px; margin-top: -10px; overflow: auto; border: 2px solid #336699; padding: 10px;">
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
        `;

		//closes the overlay on button click of the cross
		const closeButton = header.querySelector('.close');
		closeButton.addEventListener('click', function () {
			overlayContainer.style.display = 'none';
			characterSheetOverlayOpen = false;

			const characterSheetOverlay = document.getElementById('customOverlay');
			if (characterSheetOverlay) {
				characterSheetOverlay.remove();
			}
		});
		
		for (let i = 0; i < characterData.inventory.length; i++) {
			var allActionsDiv = overlayBody.querySelector('#allActions');

			const weaponReach = ["Glaive", "Halberd", "Lance", "Pike", "Whip"];
			const rangeWeapon = ["Crossbow, light", "Dart", "Shortbow", "Sling", "Blowgun", "Crossbow hand", "Crossbow, heavy", "Longbow", "Net"];

			if (characterData.inventory[i].definition.filterType === "Weapon" || characterData.inventory[i].definition.filterType === "Rod"|| characterData.inventory[i].definition.filterType === "Staff") {
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
				if (rangeWeapon.includes(characterData.inventory[i].definition.type)) {
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

				if (rangeWeapon.includes(characterData.inventory[i].definition.type)) {
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

				//label
				var SecondSplitLabel = document.createElement('label');
				SecondSplitLabel.style.fontSize = "22px";
				SecondSplitLabel.style.fontWeight = 'bold';
				SecondSplitLabel.textContent = "｜";

				//description
				var description = document.createElement('label');
				description.textContent = characterData.inventory[i].definition.description.replace(/<[^>]*>/g, '');

				const breakLine = document.createElement('hr');

				allActionsDiv.appendChild(weaponButton);
				allActionsDiv.appendChild(splitLabel);
				allActionsDiv.appendChild(reachLabel);
				allActionsDiv.appendChild(SecondSplitLabel);
				allActionsDiv.appendChild(weaponAttackButton);
				allActionsDiv.appendChild(description);
				allActionsDiv.appendChild(breakLine);
			}
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
			}
		}, 0); // You can adjust the delay time if needed


		//event listeners for the character buttons
		const actionButton = overlayBody.querySelector('#actions');
		actionButton.addEventListener('click', function () {
			console.log("action button pressed");
			showActions(adventureData);
		});

		const bioButton = overlayBody.querySelector('#bio');
		bioButton.addEventListener('click', function () {
			console.log("bio button pressed");
			showBio(adventureData);
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
			showFeatures(adventureData);
		});

		const inventoryButton = overlayBody.querySelector('#inventory');
		inventoryButton.addEventListener('click', function () {
			console.log('inventory button pressed');
			showInventory(adventureData);
		});

		const spellsButton = overlayBody.querySelector('#spells');
		spellsButton.addEventListener('click', function () {
			console.log('spells button pressed');
			showSpells(adventureData);
		});

		// Append overlayBody to the document body
		content.appendChild(overlayBody);
	});
}


function showBio(adventureData) {
	//clear content of overlay
	const content = document.getElementById('overlayContainer');
	content.remove();

	chrome.storage.local.get('characterData', function (result) {
		const characterData = result.characterData;

		let characterHidden = "";

		//get the player's character's current hp
		// the current hp of the viewd character will be based on what the hp for their charatcer is on cauldron
		for (let i = 0; i < adventureData.characters.character.length; i++) {
			if (adventureData.characters.character[i].name === characterData.name) {
				if (adventureData.characters.character[i].hidden === "yes") {
					characterHidden = "[hidden]";
				}
				break;
			}
		}

		//change the header of the overlay window
		const header = document.querySelectorAll('.panel-heading');

		header.forEach(header => {
			if (header && header.textContent && header.textContent.includes(characterData.name)) {
				header.innerHTML = `${characterData.name} - Bio ${characterHidden} <span class="glyphicon glyphicon-remove close" aria-hidden="true"></span>`;

				const overlayContainer = document.getElementById('customOverlay');

				const closeButton = header.querySelector('.close');
				closeButton.addEventListener('click', function () {
					overlayContainer.style.display = 'none';
					characterSheetOverlayOpen = false;

					const characterSheetOverlay = document.getElementById('customOverlay');
					if (characterSheetOverlay) {
						characterSheetOverlay.remove();
					}
				});
			}
		});

		const overlayBody = document.querySelectorAll('.panel-body');
		overlayBody.forEach(overlayBody => {
			overlayBody.innerHTML = `
	        <p>Test</p>
	    `;
		});
	});
}

function showFeatures(adventureData) {
    //clear content of overlay
    const content = document.getElementById('overlayContainer');
    content.remove();

    chrome.storage.local.get('characterData', function(result) {
	const characterData = result.characterData;

	let characterHidden = "";

	//get the player's character's current hp
	// the current hp of the viewd character will be based on what the hp for their charatcer is on cauldron
	for (let i = 0; i<adventureData.characters.character.length; i++) {
	    if (adventureData.characters.character[i].name === characterData.name) {
		if (adventureData.characters.character[i].hidden === "yes") {
		    characterHidden = "[hidden]";
		}
		break;
	    }
	}

	//change the header of the overlay window
        const header = document.querySelectorAll('.panel-heading');

	header.forEach(header => {
  	    if (header && header.textContent && header.textContent.includes(characterData.name)) {
    	        header.innerHTML = `${characterData.name} - Features ${characterHidden} <span class="glyphicon glyphicon-remove close" aria-hidden="true"></span>`;
                
		const overlayContainer = document.getElementById('customOverlay');

		const closeButton = header.querySelector('.close');
		closeButton.addEventListener('click', function() {
	    	    overlayContainer.style.display = 'none';
	    	    characterSheetOverlayOpen = false;

	    	    const characterSheetOverlay = document.getElementById('customOverlay');
	    	    if (characterSheetOverlay) {
	   		    characterSheetOverlay.remove();
	    	    }
		});
  	     }
	});

	const overlayBody = document.querySelectorAll('.panel-body');
        overlayBody.forEach(overlayBody => {
            overlayBody.innerHTML =	`
	        <p>Test</p>
	    `;
        });
    });
}

function showInventory(adventureData) {
    //clear content of overlay
    const content = document.getElementById('overlayContainer');
    content.remove();

    chrome.storage.local.get('characterData', function(result) {
	const characterData = result.characterData;

	let characterHidden = "";

	//get the player's character's current hp
	// the current hp of the viewd character will be based on what the hp for their charatcer is on cauldron
	for (let i = 0; i<adventureData.characters.character.length; i++) {
	    if (adventureData.characters.character[i].name === characterData.name) {
		if (adventureData.characters.character[i].hidden === "yes") {
		    characterHidden = "[hidden]";
		}
		break;
	    }
	}

	//change the header of the overlay window
        const header = document.querySelectorAll('.panel-heading');

	header.forEach(header => {
  	    if (header && header.textContent && header.textContent.includes(characterData.name)) {
    	        header.innerHTML = `${characterData.name} - Inventory ${characterHidden} <span class="glyphicon glyphicon-remove close" aria-hidden="true"></span>`;
                
		const overlayContainer = document.getElementById('customOverlay');

		const closeButton = header.querySelector('.close');
		closeButton.addEventListener('click', function() {
	    	    overlayContainer.style.display = 'none';
	    	    characterSheetOverlayOpen = false;

	    	    const characterSheetOverlay = document.getElementById('customOverlay');
	    	    if (characterSheetOverlay) {
	   		    characterSheetOverlay.remove();
	    	    }
		});
  	     }
	});

	const overlayBody = document.querySelectorAll('.panel-body');
        overlayBody.forEach(overlayBody => {
            overlayBody.innerHTML =	`
	        <p>Test</p>
	    `;
        });
    });
}

function showSpells(adventureData) {
    //clear content of overlay
    const content = document.getElementById('overlayContainer');
    content.remove();

    chrome.storage.local.get('characterData', function(result) {
	const characterData = result.characterData;

	let characterHidden = "";

	//get the player's character's current hp
	// the current hp of the viewd character will be based on what the hp for their charatcer is on cauldron
	for (let i = 0; i<adventureData.characters.character.length; i++) {
	    if (adventureData.characters.character[i].name === characterData.name) {
		if (adventureData.characters.character[i].hidden === "yes") {
		    characterHidden = "[hidden]";
		}
		break;
	    }
	}

	//change the header of the overlay window
        const header = document.querySelectorAll('.panel-heading');

	header.forEach(header => {
  	    if (header && header.textContent && header.textContent.includes(characterData.name)) {
    	        header.innerHTML = `${characterData.name} - Spells ${characterHidden} <span class="glyphicon glyphicon-remove close" aria-hidden="true"></span>`;
                
		const overlayContainer = document.getElementById('customOverlay');

		const closeButton = header.querySelector('.close');
		closeButton.addEventListener('click', function() {
	    	    overlayContainer.style.display = 'none';
	    	    characterSheetOverlayOpen = false;

	    	    const characterSheetOverlay = document.getElementById('customOverlay');
	    	    if (characterSheetOverlay) {
	   		    characterSheetOverlay.remove();
	    	    }
		});
  	     }
	});

	const overlayBody = document.querySelectorAll('.panel-body');
        overlayBody.forEach(overlayBody => {
            overlayBody.innerHTML =	`
	        <p>Test</p>
	    `;
        });
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
    const savingThrowList = ["Strength", "Dexterity", "Constitution", "Intellegence", "Wisdom", "Charisma"];    

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

		console.log(type);
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