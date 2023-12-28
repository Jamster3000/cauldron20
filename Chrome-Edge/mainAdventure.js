setTimeout(function () {
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
        showCharacterSheet();
    });

}, 0);

function changePlayArea() {
    const playArea = document.querySelector('.playarea');
    playArea.style.bottom = '60px';
}

function showCharacterSheet() {
    const listSkills = [{ name: "Acrobatics", ability: "Dex" },{ name: "Animal Handling", ability: "Wis" },{ name: "Arcana", ability: "Int" },{ name: "Athletics", ability: "Str" },{ name: "Deception", ability: "Cha" },{ name: "History", ability: "Int" },{ name: "Insight", ability: "Wis" },{ name: "Intimidation", ability: "Cha" },{ name: "Investigation", ability: "Int" },{ name: "Medicine", ability: "Wis" },{ name: "Nature", ability: "Int" },{ name: "Perception", ability: "Wis" },{ name: "Performance", ability: "Cha" },{ name: "Persuasion", ability: "Cha" },{ name: "Religion", ability: "Int" },{ name: "Sleight of Hand", ability: "Dex" },{ name: "Stealth", ability: "Dex" },{ name: "Survival", ability: "Wis" }];
    const savingThrowList = ["Strength", "Dexterity", "Constitution", "Intellegence", "Wisdom", "Charisma"];    

    chrome.storage.local.get('characterData', function(result) {
        const characterData = result.characterData;
	const stats = getCharacterStats(characterData);
	console.log(characterData);

        const overlayContainer = document.createElement('div');
        overlayContainer.id = 'customOverlay';
        overlayContainer.classList.add('panel', 'panel-primary');
        overlayContainer.style.display = 'none';
        overlayContainer.style.position = 'fixed';
        overlayContainer.style.inset = 'opx';
        overlayContainer.style.top = '50px';
        overlayContainer.style.left = '25px';
        overlayContainer.style.backgroundColor = 'rgba(255,255,255, 1)';
        overlayContainer.style.zIndex = '999999';

        // Create overlay header
        const overlayHeader = document.createElement('div');
        overlayHeader.classList.add('panel-heading');
        overlayHeader.innerHTML = `${characterData.name} <span class="glyphicon glyphicon-remove close" aria-hidden="true"></span>`;

	const closeButton = overlayHeader.querySelector('.close');
	closeButton.addEventListener('click', function() {
	    overlayContainer.style.display = 'none';
	});

        // Create overlay body
        const overlayBody = document.createElement('div');
        overlayBody.classList.add('panel-body');

	//html for the main page of the character sheet
	overlayBody.innerHTML = `
			<div style="display: flex;">
    			    <div style="border: 2px solid #336699; padding: 10px; margin-right: 10px;">
       		            	    <h5 style="font-weight: bold;">STR</h5>
        			    <button id="strButton" style="margin-right: 5px;">${characterData.stats[0].value} (${characterData.stats[0].value >= 10 ? '+' : ''}${Math.floor((characterData.stats[0].value-10)/2)})</button>
        			    <h5 style="font-weight: bold;">DEX</h5>
        			    <button id="dexButton" style="margin-right: 5px;">${characterData.stats[1].value} (${characterData.stats[1].value >= 10 ? '+' : ''}${Math.floor((characterData.stats[1].value-10)/2)})</button>
        			    <h5 style="font-weight: bold;">CON</h5>
        			    <button id="conButton" style="margin-right: 5px;">${characterData.stats[2].value} (${characterData.stats[2].value >= 10 ? '+' : ''}${Math.floor((characterData.stats[2].value-10)/2)})</button>
        			    <h5 style="font-weight: bold;">INT</h5>
        			    <button id="intButton" style="margin-right: 5px;">${characterData.stats[3].value} (${characterData.stats[3].value >= 10 ? '+' : ''}${Math.floor((characterData.stats[3].value-10)/2)})</button>
        			    <h5 style="font-weight: bold;">WIS</h5>
        			    <button id="wisButton" style="margin-right: 5px;">${characterData.stats[4].value} (${characterData.stats[4].value >= 10 ? '+' : ''}${Math.floor((characterData.stats[4].value-10)/2)})</button>
        			    <h5 style="font-weight: bold;">CHA</h5>
        			    <button id="chaButton" style="margin-right: 5px;">${characterData.stats[5].value} (${characterData.stats[5].value >= 10 ? '+' : ''}${Math.floor((characterData.stats[5].value-10)/2)})</button>
    			    </div>
			    <div style="border: 2px solid #336699; padding: 15px; margin-right: 10px;">
				<ul id="skillList">
				</ul>
			    </div>
			    <div style="border: 2px solid #336699; padding 15px; margin-right: 10px; height: 165px">
				<ul id="savingThrowElement">
			        </ul>
			    </div>
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
	    console.log("Your strength:", characterData.stats[0].value);
	 });

	const dexButton = overlayBody.querySelector('#dexButton');
	dexButton.addEventListener('click', function() {
	    console.log("Your dexterity:", characterData.stats[1].value);
	});
	
	const conButton = overlayBody.querySelector('#conButton');
        conButton.addEventListener('click', function() {
    	    console.log("Your constitution:", characterData.stats[2].value);
	});

	const intButton = overlayBody.querySelector('#intButton');
	intButton.addEventListener('click', function() {
    	    console.log("Your intelligence:", characterData.stats[3].value);
	});

	const wisButton = overlayBody.querySelector('#wisButton');
	wisButton.addEventListener('click', function() {
            console.log("Your wisdom:", characterData.stats[4].value);
	});

	const chaButton = overlayBody.querySelector('#chaButton');
	chaButton.addEventListener('click', function() {
  	  console.log("Your charisma:", characterData.stats[5].value);
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
		    total = Math.floor((characterData.stats[0].value-10)/2) + characterProf;
		} else if (listSkills[i].ability === "Dex") {
		    total = Math.floor((characterData.stats[1].value-10)/2) + characterProf;
		} else if (listSkills[i].ability === "Int") {
		    total = Math.floor((characterData.stats[3].value-10)/2) + characterProf;
		} else if (listSkills[i].ability === "Wis") {
		    total = Math.floor((characterData.stats[4].value-10)/2) + characterProf;
		} else if (listSkills[i].ability === "Cha") {
		    total = Math.floor((characterData.stats[5].value-10)/2) + characterProf;
		}
	        skillModifier.textContent = total >= 0 ? `+${total}` : total;

		skillModifier.addEventListener('click', function () {
        		handleSkillButtonClick(listSkills[i].name, total);
    		});
	    } else {	
		let total = 0;

		if (listSkills[i].ability === "Str") {
		    total = Math.floor((characterData.stats[0].value-10)/2);
		} else if (listSkills[i].ability === "Dex") {
		    total = Math.floor((characterData.stats[1].value-10)/2);
		} else if (listSkills[i].ability === "Int") {
		    total = Math.floor((characterData.stats[3].value-10)/2);
		} else if (listSkills[i].ability === "Wis") {
		    total = Math.floor((characterData.stats[4].value-10)/2);
		} else if (listSkills[i].ability === "Cha") {
		    total = Math.floor((characterData.stats[5].value-10)/2);
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
		    total = Math.floor((characterData.stats[0].value-10)/2) + characterProf;
		} else if (savingThrowList[i] === "Dexterity") {
        	    total = Math.floor((characterData.stats[1].value - 10) / 2) + characterProf;
    	        } else if (savingThrowList[i] === "Constitution") {
        	    total = Math.floor((characterData.stats[2].value - 10) / 2) + characterProf;
    		} else if (savingThrowList[i] === "Intelligence") {
        	    total = Math.floor((characterData.stats[3].value - 10) / 2) + characterProf;
    		} else if (savingThrowList[i] === "Wisdom") {
        	    total = Math.floor((characterData.stats[4].value - 10) / 2) + characterProf;
    		} else if (savingThrowList[i] === "Charisma") {
        	    total = Math.floor((characterData.stats[5].value - 10) / 2) + characterProf;
   		}
		
		savingThrowButton.textContent = total >= 0 ? `+${total}` : total;

		savingThrowButton.addEventListener('click', function () {
        		handleSkillButtonClick(savingThrowList[i], total);
    		});
	    } else {
		 let total = 0;

	        if (savingThrowList[i] === "Strength") {
		    total = Math.floor((characterData.stats[0].value-10) / 2)
		} else if (savingThrowList[i] === "Dexterity") {
        	    total = Math.floor((characterData.stats[1].value - 10) / 2); 	 
    	        } else if (savingThrowList[i] === "Constitution") {
        	    total = Math.floor((characterData.stats[2].value - 10) / 2);
    		} else if (savingThrowList[i] === "Intelligence") {
        	    total = Math.floor((characterData.stats[3].value - 10) / 2);
    		} else if (savingThrowList[i] === "Wisdom") {
        	    total = Math.floor((characterData.stats[4].value - 10) / 2);
    		} else if (savingThrowList[i] === "Charisma") {
        	    total = Math.floor((characterData.stats[5].value - 10) / 2);
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
    console.log(characterData);
    const savingThrowList = ["Strength", "Dexterity", "Constitution", "Intellegence", "Wisdom", "Charisma"];    

    
}