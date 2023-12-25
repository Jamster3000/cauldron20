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
    const listSkills = ["Acrobatics", "Animal Handling", "Arcana", "Athletics", "Deception", "History", "Insight", "Intimidation", "Investigation", "Medicine", "Nature", "Perception", "Performance", "Persuasion", "Religion", "Sleight of Hand", "Stealth", "Survival"];

    chrome.storage.local.get('characterData', function(result) {
        const characterData = result.characterData;
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

	const getSkillListElement = document.getElementById('skillList');
	for (let i = 0; i<listSkills.length; i++) {
	    //radio button
	    const listElement = document.createElement('input');
	    listElement.type = "radio";
	    listElement.disabled = true;
	    listElement.checked = false;

	    //breakline
	    const breakLine = document.createElement('br');

	    //skill label
            const skillLabel = document.createElement('label');
	    skillLabel.fontSize = "11px;";
	    skillLabel.textContent = listSkills[i];

	    getSkillListElement.appendChild(listElement);
	    getSkillListElement.appendChild(skillLabel);
	    getSkillListElement.appendChild(breakLine);
	}
    });

}

function ljust(str, width, fillChar = '&nbsp;') {
    const padding = Math.max(0, width - str.length);
    return str + fillChar.repeat(padding);
}
