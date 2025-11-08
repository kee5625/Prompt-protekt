// Wait for the page to load
let typingTimer;
const TYPING_DELAY = 1000; // 1 second after user stops typing
const WORKER_URL = 'https://your-worker.workers.dev/api/endpoint';

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

// Function to send data to Cloudflare Worker
async function sendToWorker(text) {
  try {
    const response = await fetch(WORKER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text,
        timestamp: new Date().toISOString()
      })
    });
    
    if (response.ok) {
      console.log('Successfully sent to worker');
    } else {
      console.error('Worker response error:', response.status);
    }
  } catch (error) {
    console.error('Error sending to worker:', error);
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
      typingTimer = setTimeout(() => {
        const text = getTextFromElement(e.target);
        console.log('User stopped typing:', text);
        if (text && text.trim()) {
          let processedText = text.toUpperCase();
          
          // Detect NER replacements if enabled
          if (settings.NER) {
            const replacements = detectNERReplacements(processedText);
            updateAlertsUI(replacements);
            console.log('NER detected', replacements.length, 'potential replacements');
            if (replacements.length > 0) {
              createIndicator(`Found ${replacements.length} sensitive item(s) - Check alerts!`);
            }
          }
          
          setTextInElement(e.target, processedText);
          //sendToWorker(processedText);
        }
      }, TYPING_DELAY);
    });
    
    // Also detect when user stops typing by pressing a key and releasing
    textarea.addEventListener('keyup', function(e) {
      clearTimeout(typingTimer);
      typingTimer = setTimeout(() => {
        const text = getTextFromElement(e.target);
        console.log('User stopped typing:', text);
        if (text && text.trim()) {
          let processedText = text.toUpperCase();
          
          // Detect NER replacements if enabled
          if (settings.NER) {
            const replacements = detectNERReplacements(processedText);
            updateAlertsUI(replacements);
            console.log('NER detected', replacements.length, 'potential replacements');
            if (replacements.length > 0) {
              createIndicator(`Found ${replacements.length} sensitive item(s) - Check alerts!`);
            }
          }
          
          setTextInElement(e.target, processedText);
          //sendToWorker(processedText);
        }
      }, TYPING_DELAY);
    });
  } else if (promptArea) {
    console.log('Found prompt-area, setting up listener');
    
    // Use MutationObserver to watch for changes in the prompt-area
    const observer = new MutationObserver((mutations) => {
      clearTimeout(typingTimer);
      
      typingTimer = setTimeout(() => {
        const text = getTextFromElement(promptArea);
        console.log('Text changed in prompt-area:', text);
        if (text && text.trim()) {
          let processedText = text.toUpperCase();
          
          // Detect NER replacements if enabled
          if (settings.NER) {
            const replacements = detectNERReplacements(processedText);
            updateAlertsUI(replacements);
            console.log('NER detected', replacements.length, 'potential replacements');
            if (replacements.length > 0) {
              createIndicator(`Found ${replacements.length} sensitive item(s) - Check alerts!`);
            }
          }
          
          setTextInElement(promptArea, processedText);
          //sendToWorker(processedText);
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
  NER: false,
  PE: false,
  TokenSave: false
};

// Mock NER mapping - maps original entities to fake/anonymized versions
const nerMappings = {
  persons: {
    'John Doe': 'Person A',
    'Jane Smith': 'Person B',
    'Michael Johnson': 'Person C',
    'Sarah Williams': 'Person D',
    'David Brown': 'Person E'
  },
  emails: {
    'john.doe@example.com': 'user1@anonymous.com',
    'jane.smith@company.com': 'user2@anonymous.com',
    'contact@business.com': 'contact@anonymous.com',
    'support@service.com': 'support@anonymous.com'
  },
  phones: {
    '+1-555-123-4567': '+1-XXX-XXX-0001',
    '(555) 987-6543': '(XXX) XXX-0002',
    '555-246-8101': 'XXX-XXX-0003'
  },
  organizations: {
    'Acme Corporation': 'Company A',
    'TechStart Inc': 'Company B',
    'Global Solutions': 'Company C',
    'Innovation Labs': 'Company D'
  },
  locations: {
    '123 Main Street': '[Address Redacted]',
    'New York': '[City Redacted]',
    'California': '[State Redacted]',
    'United States': '[Country Redacted]'
  },
  dates: {
    '2024-01-15': '[Date Redacted]',
    'January 15, 2024': '[Date Redacted]',
    '01/15/2024': '[Date Redacted]'
  },
  ssn: {
    '123-45-6789': 'XXX-XX-XXXX',
    '987-65-4321': 'XXX-XX-XXXX'
  },
  creditCards: {
    '4532-1234-5678-9012': 'XXXX-XXXX-XXXX-XXXX',
    '5425-2334-3010-9903': 'XXXX-XXXX-XXXX-XXXX'
  }
};

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
  
  // Check all mapped entities
  Object.keys(nerMappings).forEach(category => {
    Object.keys(nerMappings[category]).forEach(original => {
      const regex = new RegExp(original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      const matches = text.match(regex);
      
      if (matches && matches.length > 0) {
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
  
  return detectedReplacements;
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
              const replacements = detectNERReplacements(currentText);
              updateAlertsUI(replacements);
              if (replacements.length > 0) {
                createIndicator(`NER: Found ${replacements.length} sensitive item(s)`);
              } else {
                createIndicator('NER: No sensitive data detected');
              }
            }
          } else if (promptArea) {
            const currentText = getTextFromElement(promptArea);
            if (currentText && currentText.trim()) {
              const replacements = detectNERReplacements(currentText);
              updateAlertsUI(replacements);
              if (replacements.length > 0) {
                createIndicator(`NER: Found ${replacements.length} sensitive item(s)`);
              } else {
                createIndicator('NER: No sensitive data detected');
              }
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
    popup.style.display = isOpen ? 'block' : 'none';
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