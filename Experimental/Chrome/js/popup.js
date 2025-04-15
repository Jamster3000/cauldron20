document.addEventListener('DOMContentLoaded', function () {
    // Fetch character info when the button is clicked
    document.getElementById('fetchButton').addEventListener('click', function () {
        showSpinner();
        fetchCharacterInfo();
    });

    document.getElementById('editButton').addEventListener('click', function () {
        chrome.tabs.create({ url: chrome.runtime.getURL('html/edit.html') });
    });

    // Retrieve the stored character ID and populate the input field
    chrome.storage.local.get(['characterId', 'characterData'], function (result) {
        const characterIdInput = document.getElementById('characterIdInput');

        if (result.characterData) {
            displayCharacterInfo(result.characterData);
        } else if (result.characterId) {
            fetchCharacterInfo();
        }
    });

    // Add event listener for Enter key press
    document.getElementById('characterIdInput').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            showSpinner();
            document.getElementById('fetchButton').click();
        }
    });
});

function fetchCharacterInfo() {
    // Get the character ID from the input field
    const characterIdInput = document.getElementById('characterIdInput');
    const characterId = parseInt(characterIdInput.value, 10);

    if (isNaN(characterId) || characterId <= 0) {
        displayError("Invalid Character ID")
        hideSpinner();
        return;
    }

    // Clear input field
    characterIdInput.value = '';

    fetch(`https://character-service.dndbeyond.com/character/v5/character/${characterId}`)
        .then(response => {
            if (!response.ok) {
                if (response.status === 403) {
                    displayError("403: Character must be in public setting not campaign only or private.")
                }
                else {
                    displayError(`HTTP error! Status: ${response.status}`)
                }
                hideSpinner();
            } else {
                return response.json()
            }
        })
        .then(data => {
            calculateCharacterData(data.data);

            chrome.storage.local.get('characterData', function (result) {
                displayCharacterInfo(result.characterData);
            });

            hideSpinner();
        })
        .catch(error => {
            console.log(error.message);
            if (error.message.includes("Cannot read")) {
                displayError("403: Your character might be in campaign only or private. Character must be in public in order for the extension to have permission to read the character.");
            } else {
                displayError(`Error: ${error.message}`);
            }
            hideSpinner();
        });
}

function displayCharacterInfo(characterData) {
    console.log("test");
    const characterInfoElement = document.getElementById('characterInfo');
    console.log("test data", characterData);
    characterInfoElement.innerHTML = `
            <h3>${characterData.Name}</h3>
        `;

    displayError("");
}

function calculateCharacterData(data) {
    let characterData = {};
    console.log("Original Data", data);

    //function calculations
    const characterStats = getCharacterStats(data);

    characterData.AbilityScores = {
        Score: {
            Strength: characterStats.totalStrength,
            Dexterity: characterStats.totalDexterity,
            Constitution: characterStats.totalConstitution,
            Intelligence: characterStats.totalIntellegence,
            Wisdom: characterStats.totalWisdom,
            Charisma: characterStats.totalCharisma
        },
        Modifier: {
            Strength: Math.floor((characterStats.totalStrength - 10) / 2),
            Dexterity: Math.floor((characterStats.totalDexterity - 10) / 2),
            Constitution: Math.floor((characterStats.totalConstitution - 10) / 2),
            Intelligence: Math.floor((characterStats.totalIntellegence - 10) / 2),
            Wisdom: Math.floor((characterStats.totalWisdom - 10) / 2),
            Charisma: Math.floor((characterStats.totalCharisma - 10) / 2)
        }
    };

    characterData.Appearance = {
        Gender: data.gender,
        Faith: data.faith,
        Age: data.age,
        Hair: data.hair,
        Eyes: data.eyes,
        Skin: data.skin,
        Height: data.height,
        Weight: data.weight,
    };

    characterData.Background = {
        Name: data.background.definition.name,
        Description: removeHtmlTags(data.background.definition.description),
        Feature: {
            Name: data.background.definition.featureName,
            Description: removeHtmlTags(data.background.definition.featureDescription)
        },
        Traits: data.traits
    };

    characterData.Race = {
        UsingSubRace: data.race.isSubRace,
        Name: data.race.fullName,
        Description: removeHtmlTags(data.race.description),
        HomebrewRace: data.race.isHomebrew,
        SubraceName: data.race.subRaceShortName,
        Speed: data.race.weightSpeeds.normal.walk,
        FlySpeed: data.race.weightSpeeds.normal.fly,
        SwimSpeed: data.race.weightSpeeds.normal.swim,
        BurrowSpeed: data.race.weightSpeeds.normal.burrow,
        ClimbingSpeed: data.race.weightSpeeds.normal.climb,
        Encumbered: data.race.weightSpeeds.encumbered,
        HeavilyEncumbered: data.race.weightSpeeds.heavilyEncumbered,
        Size: data.race.sizeId = 4 ? "Medium" : 3 ? "Small" : 2 ? "Tiny" : 5 ? "Large" : 6 ? "Huge" : 7 ? "Gargantuan" : "Size Unknown",
    };

    characterData.Notes = {
        Allies: removeHtmlTags(data.notes.allies),
        PersonalPossessions: removeHtmlTags(data.notes.personalPossessions),
        OtherHoldings: removeHtmlTags(data.notes.otherHoldings),
        Organizations: removeHtmlTags(data.notes.organizations),
        Enemies: removeHtmlTags(data.notes.enemies),
        Backstory: removeHtmlTags(data.notes.backstory),
        OtherNotes: removeHtmlTags(data.notes.otherNotes)
    };

    characterData.DeathSaves = {
        Failed: data.deathSaves.failCount,
        Success: data.deathSaves.successCount,
        IsStabilized: data.deathSaves.isStabilized
    };

    characterData.Id = data.id;
    characterData.Name = data.name;
    characterData.XP = data.currentXp;
    characterData.Level = calculateLevel(data.currentXp);
    characterData.ProficiencyBonus = Math.ceil(characterData.Level / 4) + 1;
    characterData.HitPoints = hitPoints(data, characterStats);
    characterData.ArmourClass = armourClass(data, characterStats);
    characterData.Skills = skills(data, characterData, characterStats);
    characterData.SavingThrows = savingThrows(data, characterData, characterStats);
    characterData.Initiative = Math.floor((characterStats.totalDexterity - 10) / 2);
    characterData.Proficiencys = getProficiencies(characterData, data);
    characterData.Currencies = data.currencies;
    characterData.MaxCarryWeight = data.race.sizeId < 3 ? (characterData.AbilityScores.Score.Strength * 15) / 2 : (data.race.sizeId > 4 ? (characterData.AbilityScores.Score.Strength * 15) * 2 : (characterData.AbilityScores.Score.Strength * 15));
    characterData.DragPushLift = characterData.AbilityScores.Score.Strength * 30 * (data.race.sizeId > 4 ? 2 : (data.race.sizeId < 3 ? 0.5 : 1));
    characterData.Inventory = gatherInventory(data, characterData);
    characterData.Classes = gatherClasses(data, characterData);
    characterData.Feats = gatherFeats(data);
    characterData.Actions = gatherActions(data);
    characterData.LastModified = data.dateModified;

    //avoid calling more than once
    const {spellSlots, spellInfo, spells } = gatherSpells(data, characterData);
    characterData.SpellSlots = spellSlots;
    characterData.SpellInfo = spellInfo;
    characterData.Spells = spells;

    //To check for different things that
    //add to the character's stats
    characterData = checkModifiers(data, characterData);
    characterData = gatherCustom(data, characterData);
    characterData.Creatures = gatherCreatures(data);


    // Sort the dictionary alphabetically
    const sortedDictionary = Object.fromEntries(
        Object.entries(characterData).sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    );

    console.log(sortedDictionary);

    chrome.storage.local.set({ 'characterData': characterData }, function () {
        console.log('Character Data stored:', characterData);
    });
}

function displayError(message) {
    const errorMessageElement = document.getElementById('errorMessage');
    errorMessageElement.textContent = message;
}

/*=======================================
functions to calculate character Data
=========================================*/

function gatherCreatures(data) {
    let creatures = {};

    for (let i = 0; i < data.creatures.length; i++) {
        const creature = data.creatures[i].definition; // Corrected typo here
        creatures[i] = {
            ActionsDescription: removeHtmlTags(creature.actionsDescription),
            ArmourClass: creature.armorClass,
            ArmourClassDescription: removeHtmlTags(creature.armorClassDescription),
            AvatarUrl: creature.avatarUrl,
            AverageHitPoints: creature.averageHitPoints,
            ChallengeRating: creature.challengeRatingId,
            ConditionImmunities: creature.conditionImmunities,
            Gear: creature.gear,
            HasLair: creature.hasLair,
            HideCR: creature.hideCr,
            HitPoints: creature.hitPoints,
            Inititative: creature.initiative,
            IsHomebrew: creature.isHomebrew,
            IsLegendary: creature.isLegendary,
            LairChallengeRatingId: creature.lairChallengeRatingId,
            LairDescription: removeHtmlTags(creature.lairDescription),
            Languages: creature.languages,
            Movement: creature.movement,
            Name: creature.name,
            PassivePerception: creature.passivePerception,
            SavingThrows: creature.savingThrows,
            Senses: creature.senses,
            Skills: creature.skills,
            SpecialTraitsDescription: removeHtmlTags(creature.specialTraitsDescription),
            Stats: {
                Strength: creature.stats[0].value,
                Dexterity: creature.stats[1].value,
                Constitution: creature.stats[2].value,
                Intelligence: creature.stats[3].value,
                Wisdom: creature.stats[4].value,
                Charisma: creature.stats[5].value
            },
            Tags: creature.tags
        };
    }

    return creatures;
}

function gatherCustom(data, characterData) {
    const weaponKeywords = [
        "gun", "weapon", "sword", "bow", "blade", "dagger", "axe", "mace",
        "hammer", "spear", "staff", "crossbow", "flail", "halberd", "lance",
        "pike", "scimitar", "sling", "whip", "club", "rapier", "trident",
        "morningstar", "warhammer", "katana", "nunchaku", "shuriken", "throwing star"
    ];

    // Ensure characterData properties are initialized
    characterData.Inventory = characterData.Inventory || {};
    characterData.Actions = characterData.Actions || {};
    characterData.Spells = characterData.Spells || {};

    for (let i = 0; i < data.customActions.length; i++) {
        const customData = data.customActions[i];
        const description = customData.description ? customData.description.toLowerCase() : "";
        const snippet = customData.snippet ? customData.snippet.toLowerCase() : "";

        const isWeapon = weaponKeywords.some(keyword => description.includes(keyword));
        const isWeapon2 = weaponKeywords.some(keyword => snippet.includes(keyword));

        if (customData.displayAsAttack === true || customData.isSilvered === true || isWeapon || isWeapon2) {
            // weapon, add it to inventory and actions
            characterData.Inventory[Object.keys(characterData.Inventory).length + 1] = {
                ActionType: customData.actionType,
                activationType: customData.activationType,
                AoeSize: customData.aoeSize,
                AoeType: customData.aoeType,
                DamageBonus: customData.damageBonus,
                Description: customData.description,
                DiceCount: customData.diceCount,
                DiceType: customData.diceType,
                DisplayAsAttack: customData.displayAsAttack,
                IsMartialArts: customData.isMartialArts,
                IsOffHand: customData.isOffHand,
                IsProficient: customData.isProficient,
                IsSilvered: customData.isSilvered,
                longRange: customData.longRange,
                Name: customData.name,
                OnMissDescription: customData.onMissDescription,
                Range: customData.range,
                SaveFailDescription: customData.saveFailDescription,
                SaveSuccessDescription: customData.saveSuccessDescription,
                Snippet: customData.snippet,
                toHitBonus: customData.toHitBonus
            };

            characterData.Actions[Object.keys(characterData.Actions).length + 1] = {
                ActionType: customData.actionType,
                activationType: customData.activationType,
                AoeSize: customData.aoeSize,
                AoeType: customData.aoeType,
                DamageBonus: customData.damageBonus,
                Description: customData.description,
                DiceCount: customData.diceCount,
                DiceType: customData.diceType,
                DisplayAsAttack: customData.displayAsAttack,
                IsMartialArts: customData.isMartialArts,
                IsOffHand: customData.isOffHand,
                IsProficient: customData.isProficient,
                IsSilvered: customData.isSilvered,
                longRange: customData.longRange,
                Name: customData.name,
                OnMissDescription: customData.onMissDescription,
                Range: customData.range,
                SaveFailDescription: customData.saveFailDescription,
                SaveSuccessDescription: customData.saveSuccessDescription,
                Snippet: customData.snippet,
                toHitBonus: customData.toHitBonus
            };
        } else if (customData.range != null || description.includes("spell")) {
            characterData.Spells[Object.keys(characterData.Spells).length + 1] = {
                ActionType: customData.actionType,
                activationType: customData.activationType,
                AoeSize: customData.aoeSize,
                AoeType: customData.aoeType,
                DamageBonus: customData.damageBonus,
                Description: customData.description,
                DiceCount: customData.diceCount,
                DiceType: customData.diceType,
                DisplayAsAttack: customData.displayAsAttack,
                IsMartialArts: customData.isMartialArts,
                IsOffHand: customData.isOffHand,
                IsProficient: customData.isProficient,
                IsSilvered: customData.isSilvered,
                longRange: customData.longRange,
                Name: customData.name,
                OnMissDescription: customData.onMissDescription,
                Range: customData.range,
                SaveFailDescription: customData.saveFailDescription,
                SaveSuccessDescription: customData.saveSuccessDescription,
                Snippet: customData.snippet,
                toHitBonus: customData.toHitBonus
            };
        } else {
            characterData.Inventory[Object.keys(characterData.Inventory).length + 1] = {
                ActionType: customData.actionType,
                activationType: customData.activationType,
                AoeSize: customData.aoeSize,
                AoeType: customData.aoeType,
                DamageBonus: customData.damageBonus,
                Description: customData.description,
                DiceCount: customData.diceCount,
                DiceType: customData.diceType,
                DisplayAsAttack: customData.displayAsAttack,
                IsMartialArts: customData.isMartialArts,
                IsOffHand: customData.isOffHand,
                IsProficient: customData.isProficient,
                IsSilvered: customData.isSilvered,
                longRange: customData.longRange,
                Name: customData.name,
                OnMissDescription: customData.onMissDescription,
                Range: customData.range,
                SaveFailDescription: customData.saveFailDescription,
                SaveSuccessDescription: customData.saveSuccessDescription,
                Snippet: customData.snippet,
                toHitBonus: customData.toHitBonus
            };
        }
    }

    return characterData;
}

function checkModifiers(data, characterData) {
    const areas = ["race", "class", "background", "feat", "item"];

    for (let k = 0; k < areas.length; k++) {
        const area = areas[k];
        // Skips this iteration if the current iteration of spellArea has no length
        if (!data.modifiers[area] || !Array.isArray(data.modifiers[area])) {
            continue;
        }
        for (let j = 0; j < data.modifiers[area].length; j++) {
            const modifier = data.modifiers[area][j];
            if (modifier.subType.includes("bonus-range") && modifier.type.includes("eldritch-blast")) {
                Object.values(characterData.Spells).forEach(spell => {
                    if (spell.Definition.Name === "Eldritch Blast") {
                        spell.Definition.Range = modifier.value;
                        spell.Definition.FormatSpell.Range = `Range: ${modifier.fixedValue} feet`;
                    }
                });
            }
        }
    }

    return characterData;
}

function gatherActions(data) {
    const areas = ["race", "class", "background", "feat", "item"];
    let actions = {};

    for (let k = 0; k < areas.length; k++) {
        const area = areas[k];
        //skips this iteration if the current iteration of spellArea has no length
        if (!data.actions[area] || !Array.isArray(data.actions[area])) {
            continue;
        }

        for (let i = 0; i < data.actions[area].length; i++) {
            actions[i] = {
                LimitedUse: {
                    MaxUse: data.actions[area][i].limitedUse ? data.actions[area][i].limitedUse.maxUses : 0,
                    CurrentUse: data.actions[area][i].limitedUse ? data.actions[area][i].limitedUse.currentUses : 0
                },
                Name: data.actions[area][i].name,
                Description: data.actions[area][i].description ? removeHtmlTags(data.actions[area][i].description) : removeHtmlTags(data.actions[area][i].snippet),
                OnMissDescription: removeHtmlTags(data.actions[area][i].onMissDescription),
                SaveFailDescription: removeHtmlTags(data.actions[area][i].saveFailDescription),
                SaveSuccessDescription: removeHtmlTags(data.actions[area][i].saveSuccessDescription),
                FixedSaveDc: data.actions[area][i].fixedSaveDc,
                AttackTypeRange: data.actions[area][i].attackType,
                Dice: data.actions[area][i].dice,
                Value: data.actions[area][i].value,
                IsMartialArts: data.actions[area][i].isMartialArts,
                isProficient: data.actions[area][i].isProficient,
                SpellRangeType: data.actions[area][i].spellRangeType,
                DisplayAsAttack: data.actions[area][i].displayAsAttack                
            }            
        }
    }
    return actions;
}

function gatherSpells(data, characterData) {
    spellSlots = {};
    spellInfo = {};
    spells = {};
    const characterSpellSlots = data.classes[0].definition.spellRules.levelSpellSlots[characterData.Level]

    //====
    //Spell Slots
    //====
    for (let i = 0; i < data.spellSlots.length; i++) {
        spellSlots[i] = {
            SpellSlotLevel: data.spellSlots[i].level,
            Used: data.spellSlots[i].used,
            Availale: data.spellSlots[i].available,
        }

        for (let j = 0; j < data.classes.length; j++) {
            spellSlots[i].Availale = characterSpellSlots[i];
        }
    }

    //====
    //Spell Info
    //====
    //spell save
    let abilityModifier;
    switch (characterData.Classes[0].Definition.Name) {
        case "Sorcerer":
        case "Paladin":
        case "Bard":
        case "Warlock":
            abilityModifier = characterData.AbilityScores.Modifier.Charisma;
            break;
        case "Wizard":
        case "Artificer":
            abilityModifier = characterData.AbilityScores.Modifier.Intelligence;
            break;
        case "Cleric":
        case "Druid":
        case "Ranger":
            abilityModifier = characterData.AbilityScores.Modifier.Wisdom;
            break;
        default:
            throw new Error("Unknown class: " + characterData.Classes[0].Definition.Name);
    }

    spellInfo.SpellSave = 8 + abilityModifier + characterData.ProficiencyBonus;
    spellInfo.SpellAttack = characterData.ProficiencyBonus + abilityModifier;

    //====
    //spells
    //====
    const spellAreas = ["race", "class", "background", "feat"];
    //make code cleaner
    //make it look through classSpells > loop through each class > loop through each spell > apply same logic from spells to these classSpells

    for (let k = 0; k < spellAreas.length; k++) {
        const area = spellAreas[k];
        //skips this iteration if the current iteration of spellArea has no length
        if (!data.spells[area] || !Array.isArray(data.spells[area])) {
            continue; 
        }
        for (let i = 0; i < data.spells[area].length; i++) {
            const spell = data.spells[area][i];
            const definition = spell.definition;
            const activation = definition.activation;
            const duration = definition.duration;

            spells[i] = {
                OverrideDC: spell.overrideSaveDc,
                LimitedUse: spell.limitedUse,
                Prepared: spell.prepared,
                CountAsKnownSpell: spell.countsAsKnownSpell,
                UsesSpellSlot: spell.usesSpellSlot,
                alwaysPrepared: spell.alwaysPrepared,
                CastAsRitual: spell.castOnlyAsRitual,
                Definition: {
                    Name: definition.name,
                    Level: definition.level,
                    School: definition.school,
                    Duration: duration,
                    Range: definition.range.rangeValue,
                    AsPartOfWeaponAttack: definition.asPartOfWeaponAttack,
                    Description: removeHtmlTags(definition.description),
                    Concentration: definition.concentration,
                    Ritual: definition.ritual,
                    RangeArea: definition.rangeArea,
                    DamageEffect: definition.damageEffect,
                    ComponentsDescription: removeHtmlTags(definition.componentsDescription),
                    Healing: definition.healing,
                    HealingDice: definition.healingDice,
                    TempHpDice: definition.tempHpDice,
                    AttackType: definition.attackType,
                    canCastAtHigherLevel: definition.canCastAtHigherLevel,
                    IsHomebrew: definition.isHomebrew,
                    RequiresSavingThrow: definition.requiresSavingThrow,
                    RequiresAttackRoll: definition.requiresAttackRoll,
                    AtHigherLevel: definition.atHigherLevels,
                    Conditions: definition.conditions,
                    Tags: definition.tags,
                    CastingTimeDescription: definition.castingTimeDescription,
                    FormatSpell: {
                        Time: `Casting Time: ${activation.activationTime} ${getActivationType(activation.activationType)}`,
                        Range: `Range: ${definition.range.rangeValue} feet`,
                        Duration: getDurationText(duration),
                        Components: `Components: ${getComponentsText(definition.components, definition.componentsDescription)}`,
                        SchoolLevel: getSchoolLevelText(definition)
                    }
                }
            };
        }
    }

    for (let l = 0; l < data.classSpells.length; l++) {
        for (let i = 0; i < data.classSpells[l].spells.length; i++) {
            const spell = data.classSpells[l].spells[i];
            const definition = spell.definition;
            const activation = definition.activation;
            const duration = definition.duration;

            spells[i] = {
                OverrideDC: spell.overrideSaveDc,
                LimitedUse: spell.limitedUse,
                Prepared: spell.prepared,
                CountAsKnownSpell: spell.countsAsKnownSpell,
                UsesSpellSlot: spell.usesSpellSlot,
                alwaysPrepared: spell.alwaysPrepared,
                CastAsRitual: spell.castOnlyAsRitual,
                Definition: {
                    Name: definition.name,
                    Level: definition.level,
                    School: definition.school,
                    Duration: duration,
                    Range: definition.range.rangeValue,
                    AsPartOfWeaponAttack: definition.asPartOfWeaponAttack,
                    Description: removeHtmlTags(definition.description),
                    Concentration: definition.concentration,
                    Ritual: definition.ritual,
                    RangeArea: definition.rangeArea,
                    DamageEffect: definition.damageEffect,
                    ComponentsDescription: removeHtmlTags(definition.componentsDescription),
                    Healing: definition.healing,
                    HealingDice: definition.healingDice,
                    TempHpDice: definition.tempHpDice,
                    AttackType: definition.attackType,
                    canCastAtHigherLevel: definition.canCastAtHigherLevel,
                    IsHomebrew: definition.isHomebrew,
                    RequiresSavingThrow: definition.requiresSavingThrow,
                    RequiresAttackRoll: definition.requiresAttackRoll,
                    AtHigherLevel: definition.atHigherLevels,
                    Conditions: definition.conditions,
                    Tags: definition.tags,
                    CastingTimeDescription: definition.castingTimeDescription,
                    FormatSpell: {
                        Time: `Casting Time: ${activation.activationTime} ${getActivationType(activation.activationType)}`,
                        Range: `Range: ${definition.range.rangeValue} feet`,
                        Duration: getDurationText(duration),
                        Components: `Components: ${getComponentsText(definition.components, definition.componentsDescription)}`,
                        SchoolLevel: getSchoolLevelText(definition)
                    }
                }
            };
        }
    }

    return { spellSlots, spellInfo, spells };
}

function getActivationType(type) {
    switch (type) {
        case 1: return 'Action';
        case 3: return 'Bonus Action';
        case 4: return 'Reaction';
        case 6: return 'Minute';
        case 7: return 'Hour';
        default: return 'Unknown';
    }
}

function getDurationText(duration) {
    if (duration.durationType === "Instantaneous") {
        return 'Duration: Instantaneous';
    } else if (duration.durationInterval !== 0) {
        const interval = duration.durationInterval;
        const unit = duration.durationUnit;
        const type = duration.durationType === "Concentration" ? 'Concentration, up to' : '';
        return `Duration: ${type} ${interval} ${unit}${interval > 1 ? 's' : ''}`;
    }
    return '';
}

function getComponentsText(components, componentsDescription) {
    const componentsText = components.map(component => {
        switch (component) {
            case 1: return 'V';
            case 2: return 'S';
            case 3: return `M (${removeHtmlTags(componentsDescription)})`;
            default: return '';
        }
    });
    return componentsText.join(', ');
}

function getSchoolLevelText(definition) {
    const level = definition.level;
    const school = definition.school;
    const ritual = definition.ritual ? ' (ritual)' : '';
    return level === 0 ? `${school} Cantrip` : `${school} Level ${level}${ritual}`;
}

function gatherFeats(data) {
    let Feat = {};
    for (let i = 0; i < data.feats.length; i++) {
        Feat[i] = {
            Name: data.feats[i].definition.name,
            Description: removeHtmlTags(data.feats[i].definition.description),
            Snippet: removeHtmlTags(data.feats[i].definition.snippet),
            ActivationTime: data.feats[i].definition.activation.activationTime,
            ActivationType: data.feats[i].definition.activation.activationType,

        }
    }

    return Feat;
}

function gatherClasses(data, characterData) {
    let classes = {};
    for (let i = 0; i < data.classes.length; i++) {
        classes[i] = {
            Level: data.classes[i].level,
            IsStartingClass: data.classes[i].isStartingClass,
            HitDiceUsed: data.classes[i].hitDiceUsed,
            Definition: {
                Name: data.classes[i].definition.name,
                Description: removeHtmlTags(data.classes[i].definition.description).replace('<br>', ''),
                AvatarUrl: data.classes[i].definition.avatarUrl,
                LargeAvatarUrl: data.classes[i].definition.largeAvatarUrl,
                PortraitAvatarUrl: data.classes[i].definition.portraitAvatarUrl,
                ClassDetails: data.classes[i].definition.moreDetailsUrl,
                SpellCastingAbility: data.classes[i].definition.spellCastingAbility === 4 ? "Intelligence" : data.classes[i].definition.spellCastingAbility === 5 ? "Wisdom" : data.classes[i].definition.spellCastingAbility === 6 ? "Charisma" : "Spellcasting Ability Unknown",
                ClassFeatures: {},
                HitDice: data.classes[i].definition.hitDice,
                WealthDice: data.classes[i].definition.wealthDice,
                CanCastSpells: data.classes[i].definition.canCastSpells,
                KnowsAllSpells: data.classes[i].definition.knowsAllSpells,
                IsHomebrew: data.classes[i].definition.isHomebrew,
                SpellRules: {
                    IsRitualSpellCaster: data.classes[i].definition.spellRules?.isRitualSpellCaster,
                    NumberCantripsKnown: data.classes[i]?.definition?.spellRules?.levelCantripsKnownMaxes?.[characterData.Level] ?? 0, // Default to 0 if undefined
                    NumberSpellsKnown: data.classes[i]?.definition?.spellRules?.levelSpellKnownMaxes?.[characterData.Level] ?? 0, // Default to 0 if undefined
                    NumberPreparedSpells: data.classes[i]?.definition?.spellRules?.levelPreparedSpellMaxes?.[characterData.Level] ?? 0 // Default to 0 if undefined
                }
            },
            SubClassDefinition: {
                Name: data.classes[i].subclassDefinition.name,
                Description: removeHtmlTags(data.classes[i].subclassDefinition.description),
                AvatarUrl: data.classes[i].subclassDefinition.avatarUrl,
                LargeAvatarUrl: data.classes[i].subclassDefinition.largeAvatarUrl,
                PortraitAvatarUrl: data.classes[i].subclassDefinition.portraitAvatarUrl,
                SubClassDetails: data.classes[i].subclassDefinition.moreDetailsUrl,
                ClassFeatures: {}
            }
        }

        for (let j = 0; j < data.classes[i].definition.classFeatures.length; j++) {
            classes[i].Definition.ClassFeatures[j] = {
                Name: data.classes[i].definition.classFeatures[j].name,
                Description: removeHtmlTags(data.classes[i].definition.classFeatures[j].description),
                RequiredLevel: data.classes[i].definition.classFeatures[j].requiredLevel,
            }
        }

        for (let j = 0; j < data.classes[i].subclassDefinition.classFeatures.length; j++) {
            classes[i].Definition.ClassFeatures[j] = {
                Name: data.classes[i].subclassDefinition.classFeatures[j].name,
                Description: removeHtmlTags(data.classes[i].subclassDefinition.classFeatures[j].description),
                RequiredLevel: data.classes[i].subclassDefinition.classFeatures[j].requiredLevel,
            }
        }
    }

    return classes;
}

function gatherInventory(data, characterData) {
    let inventory = {};

    // Function to process inventory items
    function processInventoryItems(items, characterData) {
        const Finesse = ["Dagger", "Dart", "Rapier", "Scimitar", "Shortsword", "Whip"];
        const simpleWeapons = ["Club", "Dagger", "Greatclub", "Handaxe", "Javelin", "Light Hammer", "Mace", "Quarterstaff", "Staff", "Sickle", "Spear", "Crossbow, light", "Dart", "Shortbow", "Sling"];
        const martialWeapons = ["Battleaxe", "Flail", "Glaive", "Greataxe", "Greatsword", "Halberd", "Lance", "Longsword", "Maul", "Morningstar", "Pike", "Rapier", "Scimitar", "Shortsword", "Trident", "War Pick", "Warhammer", "Whip"];
        const rangedWeapons = ["Shortbow", "Longbow", "Crossbow, light", "Crossbow, hand", "Crossbow, heavy", "Sling", "Dart", "Javelin"];

        for (let i = 0; i < items.length; i++) {
            if (!items[i] || !items[i].definition) {
                continue; // Skip if the item or its definition is undefined
            }

            inventory[i] = {
                Equipped: items[i].equipped,
                IsAttuned: items[i].isAttuned,
                Quantity: items[i].quantity,
                ChargesUsed: items[i].chargesUsed,
                LimitedUse: items[i].limitedUse,
                Definition: {
                    CanEquip: items[i].definition.canEquip,
                    Magic: items[i].definition.magic,
                    Name: items[i].definition.name,
                    Weight: items[i].definition.weight,
                    WeightMultiplier: items[i].definition.weightMultiplier,
                    Capacity: items[i].definition.capacity,
                    CapacityWeight: items[i].definition.capacityWeight,
                    Type: items[i].definition.type,
                    Description: removeHtmlTags(items[i].definition.description),
                    CanAttune: items[i].definition.canAttune,
                    attunementDescription: removeHtmlTags(items[i].definition.attunementDescription),
                    Rarity: items[i].definition.rarity,
                    IsHomebrew: items[i].definition.isHomebrew,
                    Stackable: items[i].definition.stackable,
                    Image: {
                        AvatarUrl: items[i].definition.avatarUrl,
                        Full: items[i].definition.largeAvatarUrl,
                    },
                    FilterType: items[i].definition.filterType,
                    Cost: items[i].definition.cost,
                    Tags: items[i].definition.tags,
                    GrantedModifiers: {},
                    IsConsumable: items[i].definition.isConsumable,
                    WeaponBehavior: items[i].definition.weaponBehaviors,
                    BaseArmourClass: items[i].definition.baseArmorName,
                    StrengthRequirement: items[i].definition.strengthRequirement,
                    ArmorClass: items[i].definition.armorClass,
                    StealthCheck: items[i].definition.stealthCheck,
                    Damage: items[i].definition.damage,
                    DamageType: items[i].definition.damageType,
                    FixedDamage: items[i].definition.fixedDamage,
                    Properties: items[i].definition.properties,
                    AttackType: items[i].definition.attackType,
                    Range: items[i].definition.range,
                    LongRange: items[i].definition.longRange,
                    IsMonkWeapon: items[i].definition.isMonkWeapon,
                    IsContainer: items[i].definition.isContainer,
                    IsCustomItem: items[i].definition.isCustomItem,
                    AttackRoll: "",
                    DamageRoll: ""
                }
            };

            for (let j = 0; j < items[i].definition.grantedModifiers.length; j++) {
                inventory[i].Definition.GrantedModifiers[j] = {
                    Type: items[i].definition.grantedModifiers[j].type,
                    subType: items[i].definition.grantedModifiers[j].subType,
                    Dice: items[i].definition.grantedModifiers[j].dice,
                    Restriction: removeHtmlTags(items[i].definition.grantedModifiers[j].restriction),
                    RequiresAttunement: items[i].definition.grantedModifiers[j].requiresAttunement,
                    Duration: items[i].definition.grantedModifiers[j].duration,
                    Value: items[i].definition.grantedModifiers[j].value,
                    AttackRoll: "",
                    DamageRoll: ""
                };
            }

            let modifier = 0;
            const itemName = items[i].definition.name;
            const isFinesse = Finesse.includes(itemName);
            const isSimpleWeapon = simpleWeapons.includes(itemName);
            const isMartialWeapon = martialWeapons.includes(itemName);
            const isRangedWeapon = rangedWeapons.includes(itemName);
            const isMonk = data.classes[0].definition.name === "Monk";

            if (isFinesse) {
                modifier += Math.max(characterData.AbilityScores.Modifier.Dexterity, characterData.AbilityScores.Modifier.Strength);
            } else if (isRangedWeapon) {
                modifier += characterData.AbilityScores.Modifier.Dexterity;
            } else if (isMonk) {
                modifier += characterData.AbilityScores.Modifier.Dexterity;
            } else {
                modifier += characterData.AbilityScores.Modifier.Strength;
            }

            if (characterData.Proficiencys.Weapons.includes(itemName) || isSimpleWeapon || isMartialWeapon || simpleWeapons.includes(items[i].definition.filterType)) {
                modifier += characterData.ProficiencyBonus;
            }

            inventory[i].Definition.AttackRoll = "1d20+" + modifier;

            // Calculate damage roll
            let damageRolls = [];
            for (let j = 0; j < items[i].definition.weaponBehaviors.length; j++) {
                let damageRoll = items[i].definition.weaponBehaviors[j].damage.diceString;
                if (items[i].definition.properties && Object.keys(items[i].definition.properties).some(prop => prop.name === "Versatile")) {
                    const versatileDamage = items[i].definition.properties.find(prop => prop.name === "Versatile").notes;
                    damageRoll = versatileDamage;
                }
                damageRolls.push(damageRoll + "+" + modifier);
            }

            inventory[i].Definition.DamageRoll = damageRolls.join(" / ");
        }
    }

    function processCustomItems(items) {
        const inventoryLength = Object.keys(inventory).length;
        for (let i = 0; i < items.length; i++) {
            inventory[inventoryLength + 1] = {
                CustomInventoryItem: true,
                Cost: items[i].cost,
                Description: removeHtmlTags(items[i].description),
                Name: items[i].name,
                Quantity: items[i].quantity,
                Weight: items[i].weight,
                Note: items[i].notes
            }
        }
    }

    // Process standard inventory items
    processInventoryItems(data.inventory, characterData);

    // Process custom inventory items
    if (data.customItems) {
        processCustomItems(data.customItems);
    }

    return inventory;
}




function background(data) {
    const characterBackground = {}
    if (data.background.hasCustomBackground === true) {

    } else {
        characterBackground.Name = data.background.definition.name;
        characterBackground.Description = removeHtmlTags(data.background.definition.description);
        characterBackground.Feature = {
            Name: data.background.definition.featureName,
            Description: removeHtmlTags(data.background.definition.featureDescription)
        }
    }

    return characterBackground;
}

function getProficiencies(characterData, data) {
    Proficiencys = {
        Armour: [],
        Weapons: [],
        Tools: [],
        Languages: []
    }

    for (let i = 0; i < data.modifiers.race.length; i++) {
        const iteration = data.modifiers.race[i];
        if (iteration.type === "language") { Proficiencys.Languages.push(iteration.friendlySubtypeName); }
        if (iteration.type === "armor") { Proficiencys.Armour.push(iteration.friendlySubtypeName); }
        if (iteration.type === "weapon") { Proficiencys.Weapons.push(iteration.friendlySubtypeName); }
        if (iteration.type === "tool") { Proficiencys.Tools.push(iteration.friendlySubtypeName); }
    }

    for (let i = 0; i < data.modifiers.class.length; i++) {
        const iteration = data.modifiers.class[i];
        if (iteration.type === "proficiency") {
            if (iteration.subType.includes("armor")) { Proficiencys.Armour.push(iteration.friendlySubtypeName); }
            if (iteration.subType.includes("weapons")) { Proficiencys.Weapons.push(iteration.friendlySubtypeName); }
            if (iteration.subType.includes("tool")) { Proficiencys.Tools.push(iteration.friendlySubtypeName); }
            if (iteration.subType.includes("language")) { Proficiencys.Languages.push(iteration.friendlySubtypeName); }
        }
    }

    for (let i = 0; i < data.modifiers.background.length; i++) {
        const iteration = data.modifiers.background[i];
        if (iteration.type === "language") { Proficiencys.Languages.push(iteration.friendlySubtypeName); }
        if (iteration.type === "armor") { Proficiencys.Armour.push(iteration.friendlySubtypeName); }
        if (iteration.type === "weapon") { Proficiencys.Weapons.push(iteration.friendlySubtypeName); }
        if (iteration.type === "tool") { Proficiencys.Tools.push(iteration.friendlySubtypeName); }
    }

    return Proficiencys;
}

function savingThrows(characterData, data, stats) {
    const savingThrowList = ["Strength", "Dexterity", "Constitution", "Intellegence", "Wisdom", "Charisma"];
    const savingThrowsData = {};

    for (let i = 0; i < savingThrowList.length; i++) {
        const savingThrow = savingThrowList[i];

        // Initialize saving throw entry
        savingThrowsData[savingThrow] = {
            isChecked: false,
            total: 0
        };

        for (let j = 0; j < characterData.modifiers.class.length; j++) {
            if (characterData.modifiers.class[j].friendlySubtypeName === savingThrowList[i] + " Saving Throws") {
                savingThrowsData[savingThrow].isChecked = true;
            }
        }

        for (let j = 0; j < characterData.modifiers.class.length; j++) {
            if (characterData.modifiers.class[j].subType.includes(savingThrow.toLowerCase()) && characterData.modifiers.class[j].type === "proficiency") {
                savingThrowsData[savingThrow].isChecked = true;
            }
        }

        for (let j = 0; j < characterData.modifiers.race.length; j++) {
            if (characterData.modifiers.race[j].subType.includes(savingThrow.toLowerCase()) && characterData.modifiers.race[j].type === "proficiency") {
                savingThrowsData[savingThrow].isChecked = true;
            }
        }

        // Calculate total
        const characterProf = data.ProficiencyBonus;
        let total = 0;

        for (const feature in characterData.classes[0].classFeatures) {
            if (characterData.classes[0].classFeatures[feature].definition.name === "Aura of Protection") {
                total += 3;
            }
        }

        if (savingThrow === "Strength") {
            total += Math.floor((stats.totalStrength - 10) / 2) + characterProf;
        } else if (savingThrow === "Dexterity") {
            total += Math.floor((stats.totalDexterity - 10) / 2) + characterProf;
        } else if (savingThrow === "Constitution") {
            total += Math.floor((stats.totalConstitution - 10) / 2) + characterProf;
        } else if (savingThrow === "Intelligence") {
            total += Math.floor((stats.totalIntelligence - 10) / 2) + characterProf;
        } else if (savingThrow === "Wisdom") {
            total += Math.floor((stats.totalWisdom - 10) / 2) + characterProf;
        } else if (savingThrow === "Charisma") {
            total += Math.floor((stats.totalCharisma - 10) / 2) + characterProf;
        }

        savingThrowsData[savingThrow].total = total;
    }

    return savingThrowsData;
}

function skills(characterData, data, stats) {
    console.log(stats);
    const listSkills = [
        { name: "Acrobatics", ability: "Dexterity" },
        { name: "Animal Handling", ability: "Wisdom" },
        { name: "Arcana", ability: "Intellegence" },
        { name: "Athletics", ability: "Strength" },
        { name: "Deception", ability: "Charisma" },
        { name: "History", ability: "Intellegence" },
        { name: "Insight", ability: "Wisdom" },
        { name: "Intimidation", ability: "Charisma" },
        { name: "Investigation", ability: "Intellegence" },
        { name: "Medicine", ability: "Wisdom" },
        { name: "Nature", ability: "Intellegence" },
        { name: "Perception", ability: "Wisdom" },
        { name: "Performance", ability: "Charisma" },
        { name: "Persuasion", ability: "Charisma" },
        { name: "Religion", ability: "Intellegence" },
        { name: "Sleight of Hand", ability: "Dexterity" },
        { name: "Stealth", ability: "Dexterity" },
        { name: "Survival", ability: "Wisdom" }
    ];
    const skillDictionary = {};

    for (let i = 0; i < listSkills.length; i++) {
        const skillName = listSkills[i].name;
        let isProficient = false;

        // Check proficiency from background, class, and race
        for (let j = 0; j < characterData.modifiers.background.length; j++) {
            if (characterData.modifiers.background[j].subType.includes(skillName.toLowerCase())) {
                isProficient = true;
                break;
            }
        }

        for (let j = 0; j < characterData.modifiers.class.length; j++) {
            if (characterData.modifiers.class[j].subType.includes(skillName.toLowerCase())) {
                isProficient = true;
                break;
            }
        }

        for (let j = 0; j < characterData.modifiers.race.length; j++) {
            if (characterData.modifiers.race[j].subType.includes(skillName.toLowerCase())) {
                isProficient = true;
                break;
            }
        }

        let totalModifier = 0;
        let characterProf = data.ProficiencyBonus;

        for (let j = 0; j < characterData.classes[0].classFeatures.length; j++) {
            if (characterData.classes[0].classFeatures[j].definition.name === "Expertise") {
                characterProf = characterProf * 2;
                break;
            }
        }

        // Calculate modifier based on the related ability score
        const ability = listSkills[i].ability;
        const baseModifier = Math.floor((stats[`total${ability}`] - 10) / 2);

        if (isProficient) {
            totalModifier = baseModifier + characterProf;
        } else {
            totalModifier = baseModifier;
        }

        // Debugging logs
        console.log(`Skill: ${skillName}, Proficient: ${isProficient}, Base Modifier: ${baseModifier}, Total Modifier: ${totalModifier}`);

        // Save data into dictionary
        skillDictionary[skillName] = {
            isProficient: isProficient,
            ability: ability,
            totalModifier: totalModifier
        };
    }

    return skillDictionary;
}

function armourClass(characterData, stats) {
    let totalArmourClass = 0;
    const inventory = characterData.inventory;

    let hasEquippedArmor = false;
    let shieldAC = 0;

    // Loop through inventory to calculate AC from equipped armor and shields
    for (let item of inventory) {
        if (item.definition.armorClass != null) {
            if (item.equipped) {
                const armourAC = checkArmour(item.definition.name, stats, item, characterData);
                if (item.definition.name === "Shield") {
                    shieldAC = 2;  // Store shield AC separately
                } else {
                    totalArmourClass += armourAC;
                    hasEquippedArmor = true;
                }
            }
        }
    }

    // If no armor is equipped, calculate default AC
    if (!hasEquippedArmor) {
        const defaultAC = 10 + Math.floor((stats.totalDexterity - 10) / 2);
        totalArmourClass = defaultAC;
    }

    // Apply shield AC if applicable
    totalArmourClass += shieldAC;

    // Apply class-based AC bonuses
    const characterClass = characterData.classes[0].definition.name;
    const subclass = characterData.classes[0].subclassDefinition ? characterData.classes[0].subclassDefinition.name : "";

    if (characterClass === "Sorcerer" && subclass === "Draconic Bloodline") {
        const sorcererAC = 13 + Math.floor((stats.totalDexterity - 10) / 2);
        totalArmourClass = Math.max(totalArmourClass, sorcererAC);
    } else if (characterClass === "Monk") {
        const dexStat = Math.floor((characterData.stats[1].value - 10) / 2);
        const wisStat = Math.floor((characterData.stats[4].value - 10) / 2);
        const monkAC = 10 + dexStat + wisStat;
        totalArmourClass = Math.max(totalArmourClass, monkAC);
    } else if (characterClass === "Barbarian") {
        const dexStat = Math.floor((characterData.stats[1].value - 10) / 2);
        const conStat = Math.floor((characterData.stats[2].value - 10) / 2);
        const barbarianAC = 10 + dexStat + conStat;
        totalArmourClass = Math.max(totalArmourClass, barbarianAC);
    }

    // Apply race-based AC bonuses
    const raceBaseName = characterData.race.baseName;
    if (raceBaseName === "Lizardfolk") {
        const dexStat = Math.floor((characterData.stats[1].value - 10) / 2);
        const lizardfolkAC = 13 + dexStat;
        totalArmourClass = Math.max(totalArmourClass, lizardfolkAC);
    } else if (raceBaseName === "Locathah") {
        const dexStat = Math.floor((characterData.stats[1].value - 10) / 2);
        const locathahAC = 12 + dexStat;
        totalArmourClass = Math.max(totalArmourClass, locathahAC);
    } else if (raceBaseName === "Loxodon" || raceBaseName === "Tortle") {
        const dexStat = Math.floor((characterData.stats[1].value - 10) / 2);
        const loxodonTortleAC = 13 + dexStat;
        totalArmourClass = Math.max(totalArmourClass, loxodonTortleAC);
    }

    // Check for custom shield items
    for (let item of characterData.customItems) {
        try {
            if (item.name.toLowerCase().includes("shield") || item.notes.toLowerCase().includes("shield") || item.description.toLowerCase().includes("shield")) {
                totalArmourClass += 2;
            }
        } catch (TypeError) { }
    }

    // Check for the Armoured Bonus for a fighting style
    for (let option of characterData.options.class) {
        if (option.definition.name === "Defense") {
            totalArmourClass += 1;
        }
    }

    return totalArmourClass;
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

function hitPoints(data, characterStats) {
    if (data) {
        const conMod = Math.floor((characterStats.totalConstitution - 10) / 2); // Constitution modifier
        const level = data.classes[0].level;
        let hp = data.baseHitPoints + (conMod * level);

        // Adding hit points from modifiers
        for (let modifier of data.modifiers.class) {
            if (modifier.subType === "hit-points-per-level") {
                hp += parseInt(modifier.value) * level;
            }
        }

        // Additional hit points for specific class features
        if (data.classes[0].definition.name === "Sorcerer" && data.classes[0].subclassDefinition.name === "Draconic Bloodline") {
            hp += level; // Draconic Bloodline feature adds 1 HP per level
        }

        return hp + data.temporaryHitPoints;
    } else {
        console.log('Character Data not found in storage');
    }
}

function getCharacterStats(characterData) {
    let totalStrength = characterData.stats[0].value;
    let totalDexterity = characterData.stats[1].value;
    let totalConstitution = characterData.stats[2].value;
    let totalIntellegence = characterData.stats[3].value;
    let totalWisdom = characterData.stats[4].value;
    let totalCharisma = characterData.stats[5].value;

    for (let i = 0; i < characterData.modifiers.race.length; i++) {
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
            } else if (type === 'Constitution' && ability === true) {
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
        const abilities = ["Strength", "Dexterity", "Constitution", "Intelligence", "Wisdom", "Charisma"]
        const type = characterData.modifiers.class[i].friendlySubtypeName.replace(' Score', '');
        if (abilities.includes(type) && characterData.modifiers.class[i].type === "bonus") {
            const ability = abilities.includes(type);
            if (type === "Strength" && ability === true) {
                totalStrength += characterData.modifiers.class[i].value;
            } else if (type === 'Dexterity' && ability === true) {
                totalDexterity += characterData.modifiers.class[i].value;
            } else if (type === 'Constitution' && ability === true) {
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
            } else if (type === 'Constitution' && ability === true) {
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
            } else if (type === 'Constitution' && ability === true) {
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
            } else if (type === 'Constitution' && ability === true) {
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

    for (let i = 0; i < characterData.inventory.length; i++) {
        try {
            if (characterData.inventory[i].definition.grantedModifiers[0].subType === "constitution-score") {
                if (characterData.inventory[i].definition.grantedModifiers[0].type === "set") {
                    totalConstitution = characterData.inventory[i].definition.grantedModifiers[0].value;
                } else if (characterData.inventory[i].definition.grantedModifiers[0].type === "bonus") {
                    totalConstitution += characterData.inventory[i].definition.grantedModifiers[0].value;
                }
            } else if (characterData.inventory[i].definition.grantedModifiers[0].subType === "strength-score") {
                if (characterData.inventory[i].definition.grantedModifiers[0].type === "set") {
                    totalStrength = characterData.inventory[i].definition.grantedModifiers[0].value;
                } else if (characterData.inventory[i].definition.grantedModifiers[0].type === "bonus") {
                    totalStrength += characterData.inventory[i].definition.grantedModifiers[0].value;
                }
            } else if (characterData.inventory[i].definition.grantedModifiers[0].subType === "dexterity-score") {
                if (characterData.inventory[i].definition.grantedModifiers[0].type === "set") {
                    totalDexterity = characterData.inventory[i].definition.grantedModifiers[0].value;
                } else if (characterData.inventory[i].definition.grantedModifiers[0].type === "bonus") {
                    totalDexterity += characterData.inventory[i].definition.grantedModifiers[0].value;
                }
            } else if (characterData.inventory[i].definition.grantedModifiers[0].subType === "intellegence-score") {
                if (characterData.inventory[i].definition.grantedModifiers[0].type === "set") {
                    totalIntellegence = characterData.inventory[i].definition.grantedModifiers[0].value;
                } else if (characterData.inventory[i].definition.grantedModifiers[0].type === "bonus") {
                    totalIntellegence += characterData.inventory[i].definition.grantedModifiers[0].value;
                }
            } else if (characterData.inventory[i].definition.grantedModifiers[0].subType === "wisdom-score") {
                if (characterData.inventory[i].definition.grantedModifiers[0].type === "set") {
                    totalWisdom = characterData.inventory[i].definition.grantedModifiers[0].value;
                } else if (characterData.inventory[i].definition.grantedModifiers[0].type === "bonus") {
                    totalWisdom += characterData.inventory[i].definition.grantedModifiers[0].value;
                }
            } else if (characterData.inventory[i].definition.grantedModifiers[0].subType === "charisma-score") {
                if (characterData.inventory[i].definition.grantedModifiers[0].type === "set") {
                    totalCharisma = characterData.inventory[i].definition.grantedModifiers[0].value;
                } else if (characterData.inventory[i].definition.grantedModifiers[0].type === "bonus") {
                    totalCharisma += characterData.inventory[i].definition.grantedModifiers[0].value;
                }
            }
        } catch (TypeError) {
            continue
        }
    }

    if (characterData.overrideStats[0].value != null) {
        totalStrength = characterData.overrideStats[0].value;
    }

    if (characterData.overrideStats[1].value != null) {
        totalDexterity = characterData.overrideStats[1].value;
    }

    if (characterData.overrideStats[2].value != null) {
        totalConstitution = characterData.overrideStats[2].value;
    }

    if (characterData.overrideStats[3].value != null) {
        totalIntellegence = characterData.overrideStats[3].value;
    }

    if (characterData.overrideStats[4].value != null) {
        totalWisdom = characterData.overrideStats[4].value;
    }

    if (characterData.overrideStats[5].value != null) {
        totalCharisma = characterData.overrideStats[5].value;
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

function removeHtmlTags(htmlString) {
    const doc = new DOMParser().parseFromString(htmlString, 'text/html');
    const paragraphs = doc.body.getElementsByTagName('p');
    let result = "";

    for (const paragraph of paragraphs) {
        result += (paragraph.textContent + '<br><br>');
    }

    return result;
}

function showSpinner() {
    document.getElementById('spinner').style.display = 'block';
}

function hideSpinner() {
    document.getElementById('spinner').style.display = 'none';
}

/* ToDo in this file
save the characterData to local storage
allow for editing of the characterData
*/