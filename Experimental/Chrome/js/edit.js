document.addEventListener('DOMContentLoaded', function () {
    chrome.storage.local.get('characterData', function (result) {
        const characterData = result.characterData;
        const title = document.getElementById('title');
        
        if (characterData) {
            title.textContent += " - " + characterData.Name;
            showCharacterData(characterData);
        }
    });

    document.getElementById('searchInput').addEventListener('input', function () {
        if (this.value.trim() !== '') {
            document.body.classList.add('search-active');
        } else {
            document.body.classList.remove('search-active');
        }
    });

    document.getElementById('editForm').addEventListener('submit', function (e) {
        e.preventDefault();
        saveCharacterData();
    });

    document.getElementById('searchInput').addEventListener('input', function () {
        const query = this.value.toLowerCase();
        filterSections(query);
    });
});

function showCharacterData(characterData) {
    const container = document.getElementById('characterDataContainer');
    container.innerHTML = '';

    for (const key in characterData) {
        if (characterData.hasOwnProperty(key)) {
            const section = document.createElement('div');
            section.classList.add('collapsible-section');

            const header = document.createElement('h2');
            header.textContent = formatLabel(key);
            header.classList.add('collapsible-header');
            header.addEventListener('click', function () {
                this.classList.toggle('active');
                const content = this.nextElementSibling;
                if (content.classList.contains('collapsed')) {
                    content.style.maxHeight = null;
                    content.classList.remove('collapsed');
                } else {
                    content.style.maxHeight = content.scrollHeight + 'px';
                    content.classList.add('collapsed');
                }
            });

            const content = document.createElement('div');
            content.classList.add('collapsible-content');

            createFields(content, key, characterData[key], key);

            section.appendChild(header);
            section.appendChild(content);
            container.appendChild(section);
        }
    }
}

function createFields(container, parentKey, data, parentLabel) {
    if (typeof data === 'object' && data !== null) {
        for (const key in data) {
            if (data.hasOwnProperty(key)) {
                let fullKey = `${parentKey}.${key}`;
                let displayKey = key;

                // Check if the key is numeric and replace it with the corresponding name
                if (!isNaN(key) && data[key].Name) {
                    displayKey = data[key].Name;
                }

                const iterationContainer = document.createElement('div');
                iterationContainer.classList.add('iteration-container');

                if (typeof data[key] === 'object' && data[key] !== null) {
                    const subContainer = document.createElement('div');
                    subContainer.classList.add('nested-container');
                    createFields(subContainer, fullKey, data[key], `${parentLabel} > ${displayKey}`);
                    iterationContainer.appendChild(subContainer);
                } else {
                    const field = createField(fullKey, data[key], `${parentLabel} > ${displayKey}`);
                    iterationContainer.appendChild(field);
                }

                container.appendChild(iterationContainer);
            }
        }
    } else {
        const field = createField(parentKey, data, parentLabel);
        container.appendChild(field);
    }
}

function createField(key, value, displayKey) {
    const fieldContainer = document.createElement('div');
    fieldContainer.classList.add('field-container');

    const label = document.createElement('label');
    label.textContent = formatLabel(displayKey);
    label.setAttribute('for', key);

    const textarea = document.createElement('textarea');
    // Replace <br><br> with newlines and remove any HTML tags
    let cleanValue = value;
    if (typeof cleanValue === 'string') {
        cleanValue = cleanValue.replace(/<br><br>/g, '\n\n')  // Replace <br><br> with double newline
                               .replace(/<br>/g, '\n')         // Replace single <br> with single newline
                               .replace(/<[^>]*>/g, '');       // Remove any other HTML tags
    }
    textarea.value = cleanValue;
    textarea.id = key;
    textarea.name = key;
    
    // Auto-resize function
    function autoResize() {
        // Reset height to auto to get the correct scrollHeight
        textarea.style.height = 'auto';
        // Add a small buffer (2px) to prevent scrollbar flickering
        textarea.style.height = (textarea.scrollHeight + 2) + 'px';
    }

    // Apply initial sizing
    textarea.addEventListener('input', autoResize);
    
    // Also resize on window resize
    window.addEventListener('resize', () => autoResize());

    fieldContainer.appendChild(label);
    fieldContainer.appendChild(textarea);

    // Trigger initial resize after the element is added to the DOM
    requestAnimationFrame(() => {
        autoResize();
    });

    return fieldContainer;
}

// Add this CSS either through JavaScript or in your stylesheet
const style = document.createElement('style');
style.textContent = `
    textarea {
        width: 100%;
        min-height: 60px;
        padding: 8px;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-family: inherit;
        font-size: inherit;
        line-height: 1.5;
        resize: vertical;
        overflow-y: hidden;
        box-sizing: border-box;
    }

    .field-container {
        margin-bottom: 15px;
    }
`;
document.head.appendChild(style);

function formatLabel(key) {
    return key
        .replace(/\./g, ' > ')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2');
}

function saveCharacterData() {
    const characterData = {};
    const container = document.getElementById('characterDataContainer');

    container.querySelectorAll('.field-container').forEach(fieldContainer => {
        const key = fieldContainer.querySelector('label').getAttribute('for');
        const textarea = fieldContainer.querySelector('textarea');
        let value = textarea.value;

        try {
            value = JSON.parse(value);
        } catch (e) {
            // Not a JSON string, keep as is
        }

        setNestedValue(characterData, key.split('.'), value);
    });

    chrome.storage.local.set({ 'characterData': characterData }, function () {
        console.log('Character Data saved:', characterData);
        alert('Character data saved successfully!');
    });
}

function setNestedValue(obj, keys, value) {
    const lastKey = keys.pop();
    const lastObj = keys.reduce((obj, key) =>
        obj[key] = obj[key] || {},
        obj);
    lastObj[lastKey] = value;
}

function filterSections(query) {
    const sections = document.querySelectorAll('.collapsible-section');
    sections.forEach(section => {
        const header = section.querySelector('.collapsible-header');
        const content = section.querySelector('.collapsible-content');

        header.innerHTML = header.textContent;

        const nestedContainers = section.querySelectorAll('.nested-container');
        nestedContainers.forEach(container => {
            container.style.display = 'none';
        });

        const text = header.textContent.toLowerCase() + ' ' + content.textContent.toLowerCase();
        if (text.includes(query)) {
            section.style.display = '';
            highlightMatches(section, query);
        } else {
            section.style.display = 'none';
        }
    });
}

function highlightMatches(section, query) {
    const content = section.querySelector('.collapsible-content');
    const iterationContainers = content.querySelectorAll('.iteration-container');
    let sectionHasMatch = false;

    const header = section.querySelector('.collapsible-header');
    if (header.textContent.toLowerCase().includes(query)) {
        header.innerHTML = highlightText(header.textContent, query);
    }

    iterationContainers.forEach(container => {
        let containerHasMatch = false;

        const fields = container.querySelectorAll('.field-container');
        fields.forEach(field => {
            const label = field.querySelector('label');
            const textarea = field.querySelector('textarea');
            const labelText = label.textContent.toLowerCase();
            const textareaValue = textarea.value.toLowerCase();

            label.innerHTML = label.textContent;

            if (labelText.includes(query) || textareaValue.includes(query)) {
                field.style.display = '';
                if (labelText.includes(query)) {
                    label.innerHTML = highlightText(label.textContent, query);
                }
                containerHasMatch = true;
                sectionHasMatch = true;
            } else {
                field.style.display = 'none';
            }
        });

        container.style.display = containerHasMatch ? '' : 'none';

        if (containerHasMatch) {
            let parent = container.parentElement;
            while (parent && parent.classList.contains('nested-container')) {
                parent.style.display = '';
                parent = parent.parentElement;
            }
        }
    });

    if (!sectionHasMatch && !header.textContent.toLowerCase().includes(query)) {
        section.style.display = 'none';
    }
}

function highlightText(text, query) {
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<span class="highlight">$1</span>');
}
