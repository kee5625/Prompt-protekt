// Wait for the page to load
let typingTimer;
const TYPING_DELAY = 1000; // 1 second after user stops typing
const WORKER_URL = 'https://security-hf.karthik-rachamolla.workers.dev/';

// Create visual indicator
function createIndicator(text) {
  const indicator = document.createElement('div');
  indicator.id = 'typing-indicator';
  indicator.textContent = `✓ ${text}`;
  document.body.appendChild(indicator);
  
  // Remove after 2 seconds
  setTimeout(() => {
    indicator.style.opacity = '0';
    setTimeout(() => indicator.remove(), 300);
  }, 2000);
}

// Function to send data to Cloudflare Worker and get NER mappings
async function sendToWorkerForNER(text) {
  try {
    console.log('Sending text to Cloudflare Worker for NER analysis:', text);
    const response = await fetch(WORKER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text,
        action: 'ner_detection',
        timestamp: new Date().toISOString()
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('Received NER mappings from worker:', data);
      return data; // Expected format: { persons: {...}, emails: {...}, ... }
    } else {
      console.error('Worker response error:', response.status);
      return null;
    }
  } catch (error) {
    console.error('Error sending to worker:', error);
    return null;
  }
}

// Function to get text from an element
function getTextFromElement(element) {
  // Try multiple methods to get text
  if (element.value !== undefined) {
    return element.value;
  }
  if (element.textContent) {
    return element.textContent;
  }
  if (element.innerText) {
    return element.innerText;
  }
  // Check for contenteditable
  if (element.isContentEditable) {
    return element.textContent || element.innerText;
  }
  // Check for <p> tag inside
  const pTag = element.querySelector('p');
  if (pTag) {
    return pTag.textContent || pTag.innerText;
  }
  return '';
}

// Function to set text in an element
function setTextInElement(element, text) {
  // Try multiple methods to set text
  if (element.value !== undefined) {
    element.value = text;
    // Trigger input event to notify any listeners
    element.dispatchEvent(new Event('input', { bubbles: true }));
  } else if (element.isContentEditable) {
    element.textContent = text;
  } else {
    // Check for <p> tag inside
    const pTag = element.querySelector('p');
    if (pTag) {
      pTag.textContent = text;
    } else {
      element.textContent = text;
    }
  }
}

// Function to setup the listener
function setupListener() {
  // Try to find both textarea and the prompt-area div
  const textarea = document.getElementById('prompt-textarea');
  const promptArea = document.getElementById('prompt-area');
  
  if (textarea) {
    console.log('Found prompt-textarea, setting up listener');
    console.log('Element type:', textarea.tagName, 'isContentEditable:', textarea.isContentEditable);
    
    textarea.addEventListener('input', function(e) {
      // Clear the previous timer
      clearTimeout(typingTimer);
      
      // Set a new timer
      typingTimer = setTimeout(async () => {
        const text = getTextFromElement(e.target);
        console.log('User stopped typing:', text);
        if (text && text.trim()) {
          // Detect NER replacements if enabled
          if (settings.NER) {
            // Send text to Cloudflare Worker and get NER mappings
            const workerMappings = await sendToWorkerForNER(text);
            
            // Update nerMappings if worker returned valid data
            if (workerMappings && typeof workerMappings === 'object') {
              nerMappings = workerMappings;
              console.log('Updated nerMappings from worker:', nerMappings);
            }
            
            const replacements = detectNERReplacements(text);
            updateAlertsUI(replacements);
            addRedUnderlines(e.target, replacements);
            console.log('NER detected', replacements.length, 'potential replacements');
            if (replacements.length > 0) {
              createIndicator(`Found ${replacements.length} sensitive item(s) - Check alerts!`);
            }
          }
        }
      }, TYPING_DELAY);
    });
    
    // Also detect when user stops typing by pressing a key and releasing
    textarea.addEventListener('keyup', function(e) {
      clearTimeout(typingTimer);
      typingTimer = setTimeout(async () => {
        const text = getTextFromElement(e.target);
        console.log('User stopped typing:', text);
        if (text && text.trim()) {
          // Detect NER replacements if enabled
          if (settings.NER) {
            // Send text to Cloudflare Worker and get NER mappings
            const workerMappings = await sendToWorkerForNER(text);
            
            // Update nerMappings if worker returned valid data
            if (workerMappings && typeof workerMappings === 'object') {
              nerMappings = workerMappings;
              console.log('Updated nerMappings from worker:', nerMappings);
            }
            
            const replacements = detectNERReplacements(text);
            updateAlertsUI(replacements);
            addRedUnderlines(e.target, replacements);
            console.log('NER detected', replacements.length, 'potential replacements');
            if (replacements.length > 0) {
              createIndicator(`Found ${replacements.length} sensitive item(s) - Check alerts!`);
            }
          }
        }
      }, TYPING_DELAY);
    });
  } else if (promptArea) {
    console.log('Found prompt-area, setting up listener');
    
    // Use MutationObserver to watch for changes in the prompt-area
    const observer = new MutationObserver((mutations) => {
      clearTimeout(typingTimer);
      
      typingTimer = setTimeout(async () => {
        const text = getTextFromElement(promptArea);
        console.log('Text changed in prompt-area:', text);
        if (text && text.trim()) {
          // Detect NER replacements if enabled
          if (settings.NER) {
            // Send text to Cloudflare Worker and get NER mappings
            const workerMappings = await sendToWorkerForNER(text);
            
            // Update nerMappings if worker returned valid data
            if (workerMappings && typeof workerMappings === 'object') {
              nerMappings = workerMappings;
              console.log('Updated nerMappings from worker:', nerMappings);
            }
            
            const replacements = detectNERReplacements(text);
            updateAlertsUI(replacements);
            addRedUnderlines(promptArea, replacements);
            console.log('NER detected', replacements.length, 'potential replacements');
            if (replacements.length > 0) {
              createIndicator(`Found ${replacements.length} sensitive item(s) - Check alerts!`);
            }
          }
        }
      }, TYPING_DELAY);
    });
    
    // Start observing the prompt-area for changes
    observer.observe(promptArea, {
      childList: true,
      subtree: true,
      characterData: true
    });
  } else {
    // If element not found, try again after a delay
    setTimeout(setupListener, 1000);
  }
}

// Start looking for the textarea
setupListener();

// Settings state
const settings = {
  NER: true,  // Enabled by default
  PE: false,
  TokenSave: false
};

// NER mapping - will be populated by the response from Cloudflare Worker
// Starts empty - only uses data from worker
let nerMappings = {};

// Function to apply NER anonymization
function applyNER(text) {
  let anonymizedText = text;
  
  // Replace all mapped entities with their fake versions
  Object.keys(nerMappings).forEach(category => {
    Object.keys(nerMappings[category]).forEach(original => {
      const fake = nerMappings[category][original];
      // Use global replace with case-insensitive matching
      const regex = new RegExp(original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      anonymizedText = anonymizedText.replace(regex, fake);
    });
  });
  
  return anonymizedText;
}

// Function to detect potential NER replacements without applying them
function detectNERReplacements(text) {
  const detectedReplacements = [];
  const seenPairs = new Set(); // To avoid duplicate entries
  
  console.log('Detecting NER replacements in text:', text);
  
  // Check all mapped entities
  Object.keys(nerMappings).forEach(category => {
    Object.keys(nerMappings[category]).forEach(original => {
      const regex = new RegExp(original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      const matches = text.match(regex);
      
      if (matches && matches.length > 0) {
        console.log(`Found match for "${original}" in category "${category}":`, matches);
        // Create a unique key for this original text (case-insensitive)
        const uniqueKey = `${category}:${matches[0].toLowerCase()}`;
        
        // Only add if we haven't seen this exact match before
        if (!seenPairs.has(uniqueKey)) {
          seenPairs.add(uniqueKey);
          detectedReplacements.push({
            category: category,
            original: matches[0], // Use the actual matched text (preserves case)
            replacement: nerMappings[category][original],
            count: matches.length, // Track how many instances found
            applied: false
          });
        }
      }
    });
  });
  
  console.log('Total replacements detected:', detectedReplacements);
  return detectedReplacements;
}

// Function to add red underlines to sensitive text
function addRedUnderlines(element, replacements) {
  console.log('addRedUnderlines called with element:', element, 'replacements:', replacements);
  
  if (!element || replacements.length === 0) return;
  
  // Remove existing underlines first
  removeRedUnderlines();
  
  // Determine the target element - try multiple approaches
  let targetElement = null;
  
  if (element.isContentEditable) {
    targetElement = element;
    console.log('Using contentEditable element');
  } else if (element.querySelector('p')) {
    targetElement = element.querySelector('p');
    console.log('Using <p> element');
  } else if (element.value !== undefined) {
    // For regular input/textarea elements, we can't add underlines
    console.log('Cannot add underlines to input/textarea elements');
    return;
  } else {
    // Try using the element itself if it has text content
    targetElement = element;
    console.log('Using element itself');
  }
  
  if (!targetElement) {
    console.log('No target element found');
    return;
  }
  
  const text = targetElement.textContent || targetElement.innerText;
  if (!text) {
    console.log('No text content found');
    return;
  }
  
  console.log('Target element text:', text);
  
  // Create a map of positions to highlight
  const highlights = [];
  replacements.forEach(rep => {
    const regex = new RegExp(rep.original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    let match;
    const tempRegex = new RegExp(regex.source, regex.flags);
    
    while ((match = tempRegex.exec(text)) !== null) {
      highlights.push({
        start: match.index,
        end: match.index + match[0].length,
        original: match[0],
        replacement: rep.replacement,
        category: rep.category
      });
    }
  });
  
  // Sort highlights by start position
  highlights.sort((a, b) => a.start - b.start);
  
  // Build new HTML with underlined spans
  let newHTML = '';
  let lastIndex = 0;
  
  highlights.forEach((highlight, index) => {
    // Add text before highlight
    newHTML += escapeHtml(text.substring(lastIndex, highlight.start));
    
    // Add highlighted text with underline
    const uniqueId = `underline-${index}`;
    newHTML += `<span class="ner-underline" data-id="${uniqueId}" data-original="${escapeHtml(highlight.original)}" data-replacement="${escapeHtml(highlight.replacement)}" data-category="${escapeHtml(highlight.category)}">${escapeHtml(highlight.original)}</span>`;
    
    lastIndex = highlight.end;
  });
  
  // Add remaining text
  newHTML += escapeHtml(text.substring(lastIndex));
  
  // Update the element
  targetElement.innerHTML = newHTML;
  
  // Add event listeners to underlined spans
  const underlinedSpans = targetElement.querySelectorAll('.ner-underline');
  underlinedSpans.forEach(span => {
    span.addEventListener('mouseenter', showReplacementPopup);
    span.addEventListener('mouseleave', hideReplacementPopup);
    span.addEventListener('click', applyInlineReplacement);
  });
}

// Function to remove red underlines
function removeRedUnderlines() {
  const underlines = document.querySelectorAll('.ner-underline');
  underlines.forEach(span => {
    const text = span.textContent;
    const textNode = document.createTextNode(text);
    span.parentNode.replaceChild(textNode, span);
  });
  
  // Remove any existing popups
  const existingPopup = document.getElementById('ner-replacement-popup');
  if (existingPopup) {
    existingPopup.remove();
  }
}

// Helper function to escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Function to show replacement popup on hover
function showReplacementPopup(event) {
  const span = event.target;
  const original = span.dataset.original;
  const replacement = span.dataset.replacement;
  const category = span.dataset.category;
  
  // Remove existing popup
  hideReplacementPopup();
  
  // Create popup
  const popup = document.createElement('div');
  popup.id = 'ner-replacement-popup';
  popup.className = 'ner-popup';
  
  popup.innerHTML = `
    <div class="ner-popup-header">
      <span class="ner-popup-category">${category}</span>
    </div>
    <div class="ner-popup-body">
      <div class="ner-popup-original">
        <strong>Found:</strong> ${escapeHtml(original)}
      </div>
      <div class="ner-popup-replacement">
        <strong>Suggest:</strong> ${escapeHtml(replacement)}
      </div>
    </div>
    <div class="ner-popup-footer">
      <button class="ner-popup-btn">Replace</button>
    </div>
  `;
  
  document.body.appendChild(popup);
  
  // Position popup near the underlined text
  const rect = span.getBoundingClientRect();
  popup.style.left = rect.left + 'px';
  popup.style.top = (rect.bottom + 5) + 'px';
  
  // Add click handler to replace button
  const replaceBtn = popup.querySelector('.ner-popup-btn');
  replaceBtn.addEventListener('click', () => {
    applyInlineReplacement.call(span);
  });
}

// Function to hide replacement popup
function hideReplacementPopup() {
  const popup = document.getElementById('ner-replacement-popup');
  if (popup) {
    popup.remove();
  }
}

// Function to apply inline replacement when clicking underlined text or popup button
function applyInlineReplacement(event) {
  const span = event.target.classList.contains('ner-underline') ? event.target : this;
  const original = span.dataset.original;
  const replacement = span.dataset.replacement;
  
  // Get the parent element (textarea or contenteditable)
  const textarea = document.getElementById('prompt-textarea');
  const promptArea = document.getElementById('prompt-area');
  const element = textarea || promptArea;
  
  if (!element) return;
  
  // Replace the text
  const currentText = getTextFromElement(element);
  const regex = new RegExp(original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
  const newText = currentText.replace(regex, replacement);
  
  setTextInElement(element, newText);
  
  // Hide popup
  hideReplacementPopup();
  
  // Show indicator
  createIndicator(`Replaced: ${original}`);
  
  // Re-detect and update underlines
  if (settings.NER) {
    setTimeout(() => {
      const text = getTextFromElement(element);
      const replacements = detectNERReplacements(text);
      updateAlertsUI(replacements);
      addRedUnderlines(element, replacements);
    }, 100);
  }
}

// Function to update alerts in the UI
function updateAlertsUI(replacements) {
  const alertsContent = document.querySelector('#prompt-protekt-popup .tab-content');
  
  if (!alertsContent) return;
  
  if (replacements.length === 0) {
    alertsContent.innerHTML = '<p class="empty-state">No sensitive data detected.</p>';
    return;
  }
  
  // Group replacements by category
  const groupedReplacements = {};
  replacements.forEach(rep => {
    if (!groupedReplacements[rep.category]) {
      groupedReplacements[rep.category] = [];
    }
    groupedReplacements[rep.category].push(rep);
  });
  
  // Build the alerts HTML
  let html = '<div>';
  
  Object.keys(groupedReplacements).forEach(category => {
    html += `
      <div class="category-section">
        <h4 class="category-header">${category}</h4>
    `;
    
    groupedReplacements[category].forEach((rep, index) => {
      const uniqueId = `${category}-${index}`;
      const countBadge = rep.count > 1 ? `<span class="count-badge">${rep.count}x</span>` : '';
      
      html += `
        <div class="alert-item" data-id="${uniqueId}">
          <div class="alert-content">
            <div class="alert-details">
              <div class="found-text">Found: <span class="found-value">${rep.original}</span>${countBadge}</div>
              <div class="replace-text">Replace with: <span class="replace-value">${rep.replacement}</span></div>
            </div>
            <button class="replace-btn">Replace All</button>
          </div>
        </div>
      `;
    });
    
    html += '</div>';
  });
  
  html += '</div>';
  alertsContent.innerHTML = html;
  
  // Add click handlers to replace buttons
  const replaceButtons = alertsContent.querySelectorAll('.replace-btn');
  replaceButtons.forEach((btn, index) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const alertItem = btn.closest('.alert-item');
      const replacement = replacements[index];
      const count = replacement.count;
      
      // Replace ALL instances
      applyReplacementAll(replacement.original, replacement.replacement);
      
      // Remove the alert item with success feedback
      alertItem.classList.add('success');
      btn.textContent = `✓ ${count > 1 ? count + ' instances' : 'Applied'}`;
      btn.disabled = true;
      
      setTimeout(() => {
        alertItem.remove();
        // Check if no more alerts
        if (alertsContent.querySelectorAll('.alert-item').length === 0) {
          alertsContent.innerHTML = '<p class="empty-state">All replacements applied!</p>';
        }
      }, 1500);
    });
  });
}

// Function to apply a single replacement (all instances)
function applyReplacementAll(original, replacement) {
  const textarea = document.getElementById('prompt-textarea');
  const promptArea = document.getElementById('prompt-area');
  
  const element = textarea || promptArea;
  if (!element) return;
  
  const currentText = getTextFromElement(element);
  const regex = new RegExp(original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
  
  // Count how many instances will be replaced
  const matches = currentText.match(regex);
  const count = matches ? matches.length : 0;
  
  // Replace all instances globally
  const newText = currentText.replace(regex, replacement);
  
  setTextInElement(element, newText);
  createIndicator(`Replaced ${count} instance(s) of "${original}"`);
  console.log(`Replaced ${count} instance(s) of "${original}" with "${replacement}"`);
}

// Function to apply a single replacement (legacy - single instance)
function applyReplacement(original, replacement) {
  const textarea = document.getElementById('prompt-textarea');
  const promptArea = document.getElementById('prompt-area');
  
  const element = textarea || promptArea;
  if (!element) return;
  
  const currentText = getTextFromElement(element);
  const regex = new RegExp(original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
  const newText = currentText.replace(regex, replacement);
  
  setTextInElement(element, newText);
  createIndicator(`Replaced: ${original}`);
  console.log(`Replaced "${original}" with "${replacement}"`);
}

// Function to add entity to NER mapping dynamically
function addToNERMapping(category, original, fake) {
  if (!nerMappings[category]) {
    nerMappings[category] = {};
  }
  nerMappings[category][original] = fake;
  console.log(`Added to NER mapping: ${category} - "${original}" -> "${fake}"`);
}

// Create bottom-right interface
function createBottomRightInterface() {
  // Main container (collapsed state - just the button)
  const container = document.createElement('div');
  container.id = 'prompt-protekt-container';

  // Toggle button (always visible)
  const toggleButton = document.createElement('button');
  toggleButton.id = 'prompt-protekt-toggle';
  toggleButton.innerHTML = '⚙️';

  // Popup panel (hidden by default)
  const popup = document.createElement('div');
  popup.id = 'prompt-protekt-popup';

  // Tab buttons container
  const tabButtons = document.createElement('div');
  tabButtons.className = 'tab-buttons';

  // Alerts tab button
  const alertsTabBtn = document.createElement('button');
  alertsTabBtn.textContent = 'Alerts';
  alertsTabBtn.className = 'tab-button active';

  // Settings tab button
  const settingsTabBtn = document.createElement('button');
  settingsTabBtn.textContent = 'Settings';
  settingsTabBtn.className = 'tab-button';

  tabButtons.appendChild(alertsTabBtn);
  tabButtons.appendChild(settingsTabBtn);

  // Alerts content
  const alertsContent = document.createElement('div');
  alertsContent.className = 'tab-content alerts active';
  alertsContent.innerHTML = '<p class="empty-state">No alerts at this time.</p>';

  // Settings content
  const settingsContent = document.createElement('div');
  settingsContent.className = 'tab-content';

  // Create toggle switches for settings
  const toggles = [
    { id: 'NER', label: 'NER' },
    { id: 'PE', label: 'PE' },
    { id: 'TokenSave', label: 'Token Save' }
  ];

  toggles.forEach(toggle => {
    const toggleContainer = document.createElement('div');
    toggleContainer.className = 'toggle-container';

    const label = document.createElement('span');
    label.textContent = toggle.label;
    label.className = 'toggle-label';

    // Toggle switch
    const toggleSwitch = document.createElement('label');
    toggleSwitch.className = 'toggle-switch';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `toggle-${toggle.id}`;
    checkbox.checked = settings[toggle.id];  // Set initial state from settings

    const slider = document.createElement('span');
    slider.className = 'toggle-slider';

    const sliderButton = document.createElement('span');
    sliderButton.className = 'toggle-slider-button';
    slider.appendChild(sliderButton);

    // Toggle functionality
    checkbox.addEventListener('change', function() {
      settings[toggle.id] = this.checked;
      console.log(`${toggle.label} is now: ${this.checked ? 'ON' : 'OFF'}`);
      
      if (this.checked) {
        
        // NER functionality - Named Entity Recognition/Anonymization
        if (toggle.id === 'NER') {
          console.log('NER functionality activated');
          console.log('Current NER mappings:', nerMappings);
          
          // Detect NER replacements in any existing text in the textarea
          const textarea = document.getElementById('prompt-textarea');
          const promptArea = document.getElementById('prompt-area');
          
          if (textarea) {
            const currentText = getTextFromElement(textarea);
            if (currentText && currentText.trim()) {
              // Send to worker and get updated mappings
              (async () => {
                const workerMappings = await sendToWorkerForNER(currentText);
                if (workerMappings && typeof workerMappings === 'object') {
                  nerMappings = workerMappings;
                  console.log('Updated nerMappings from worker:', nerMappings);
                }
                
                const replacements = detectNERReplacements(currentText);
                updateAlertsUI(replacements);
                addRedUnderlines(textarea, replacements);
                if (replacements.length > 0) {
                  createIndicator(`NER: Found ${replacements.length} sensitive item(s)`);
                } else {
                  createIndicator('NER: No sensitive data detected');
                }
              })();
            }
          } else if (promptArea) {
            const currentText = getTextFromElement(promptArea);
            if (currentText && currentText.trim()) {
              // Send to worker and get updated mappings
              (async () => {
                const workerMappings = await sendToWorkerForNER(currentText);
                if (workerMappings && typeof workerMappings === 'object') {
                  nerMappings = workerMappings;
                  console.log('Updated nerMappings from worker:', nerMappings);
                }
                
                const replacements = detectNERReplacements(currentText);
                updateAlertsUI(replacements);
                addRedUnderlines(promptArea, replacements);
                if (replacements.length > 0) {
                  createIndicator(`NER: Found ${replacements.length} sensitive item(s)`);
                } else {
                  createIndicator('NER: No sensitive data detected');
                }
              })();
            }
          }
        }
        
        // Placeholder for PE functionality
        if (toggle.id === 'PE') {
          console.log('PE functionality activated');
          // TODO: Add PE logic here
        }
        
        // Placeholder for Token Save functionality
        if (toggle.id === 'TokenSave') {
          console.log('Token Save functionality activated');
          // TODO: Add Token Save logic here
        }
      } else {
        
        // Disable NER functionality
        if (toggle.id === 'NER') {
          console.log('NER functionality deactivated');
          // Clear alerts when NER is disabled
          const alertsContent = document.querySelector('#prompt-protekt-popup .tab-content');
          if (alertsContent) {
            alertsContent.innerHTML = '<p class="empty-state">No alerts at this time.</p>';
          }
          // Remove red underlines
          removeRedUnderlines();
          createIndicator('NER: Detection disabled');
        }
        
        if (toggle.id === 'PE') {
          console.log('PE functionality deactivated');
          // TODO: Add logic to disable PE
        }
        
        if (toggle.id === 'TokenSave') {
          console.log('Token Save functionality deactivated');
          // TODO: Add logic to disable Token Save
        }
      }
    });

    toggleSwitch.appendChild(checkbox);
    toggleSwitch.appendChild(slider);

    toggleContainer.appendChild(label);
    toggleContainer.appendChild(toggleSwitch);
    settingsContent.appendChild(toggleContainer);
  });

  // Tab switching functionality
  alertsTabBtn.addEventListener('click', () => {
    alertsTabBtn.classList.add('active');
    settingsTabBtn.classList.remove('active');
    alertsContent.classList.add('active');
    settingsContent.classList.remove('active');
  });

  settingsTabBtn.addEventListener('click', () => {
    settingsTabBtn.classList.add('active');
    alertsTabBtn.classList.remove('active');
    settingsContent.classList.add('active');
    alertsContent.classList.remove('active');
  });

  // Toggle popup visibility
  let isOpen = false;
  toggleButton.addEventListener('click', () => {
    isOpen = !isOpen;
    if (isOpen) {
      popup.classList.add('show');
    } else {
      popup.classList.remove('show');
    }
  });

  // Assemble the interface
  popup.appendChild(tabButtons);
  popup.appendChild(alertsContent);
  popup.appendChild(settingsContent);
  container.appendChild(toggleButton);
  container.appendChild(popup);
  document.body.appendChild(container);
}

// Initialize the interface when the page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', createBottomRightInterface);
} else {
  createBottomRightInterface();
}