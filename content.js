// Wait for the page to load
let typingTimer;
const TYPING_DELAY = 1000; // 1 second after user stops typing
const NER_WORKER_URL = 'placeholder_for_ner_worker_url';
const PE_WORKER_URL = 'placeholder_for_pe_worker_url';
const TOKEN_SAVE_WORKER_URL = 'placeholder_for_token_save_worker_url';

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
    const response = await fetch(NER_WORKER_URL, {
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

// Function to send data to PE (Prompt Engineering) Worker
async function sendToWorkerForPE(text) {
  try {
    console.log('Sending text to Cloudflare Worker for PE analysis:', text);
    const response = await fetch(PE_WORKER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text,
        action: 'prompt_engineering',
        timestamp: new Date().toISOString()
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('Received PE response from worker:', data);
      return data;
    } else {
      console.error('PE Worker response error:', response.status);
      return null;
    }
  } catch (error) {
    console.error('Error sending to PE worker:', error);
    return null;
  }
}

// Function to send data to Token Save Worker
async function sendToWorkerForTokenSave(text) {
  try {
    console.log('Sending text to Cloudflare Worker for Token Save analysis:', text);
    const response = await fetch(TOKEN_SAVE_WORKER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text,
        action: 'token_save',
        timestamp: new Date().toISOString()
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('Received Token Save response from worker:', data);
      return data;
    } else {
      console.error('Token Save Worker response error:', response.status);
      return null;
    }
  } catch (error) {
    console.error('Error sending to Token Save worker:', error);
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

// Login state
let isLoggedIn = false;

// Default NER mapping - can be updated by the response from Cloudflare Worker
let nerMappings = {
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

// Helper function to escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Function to update alerts in the UI
function updateAlertsUI(replacements) {
  const alertsContent = document.querySelector('#prompt-protekt-popup .tab-content');
  const toggleButton = document.getElementById('prompt-protekt-toggle');
  
  if (!alertsContent) return;
  
  if (replacements.length === 0) {
    alertsContent.innerHTML = '<p class="empty-state">No sensitive data detected.</p>';
    // Reset button to normal state (green settings cog)
    if (toggleButton) {
      toggleButton.innerHTML = '⚙️';
      toggleButton.classList.remove('alert-mode');
    }
    return;
  }
  
  // Change button to red alarm mode
  if (toggleButton) {
    toggleButton.innerHTML = '🚨';
    toggleButton.classList.add('alert-mode');
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
  
  // Add "Replace All" button at the top
  html += `
    <div class="replace-all-container">
      <button class="replace-all-btn"> Replace All Alerts</button>
    </div>
  `;
  
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
            <button class="replace-btn" data-index="${index}">Replace</button>
          </div>
        </div>
      `;
    });
    
    html += '</div>';
  });
  
  html += '</div>';
  alertsContent.innerHTML = html;
  
  // Add click handler to "Replace All" button
  const replaceAllBtn = alertsContent.querySelector('.replace-all-btn');
  if (replaceAllBtn) {
    replaceAllBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      
      // Replace all items
      replacements.forEach(rep => {
        applyReplacementAll(rep.original, rep.replacement);
      });
      
      // Clear all alerts
      alertsContent.innerHTML = '<p class="empty-state">All replacements applied!</p>';
      
      // Reset button to normal state
      if (toggleButton) {
        toggleButton.innerHTML = '⚙️';
        toggleButton.classList.remove('alert-mode');
      }
      
      // Show success indicator
      createIndicator(`Applied all ${replacements.length} replacement(s)!`);
    });
  }
  
  // Add click handlers to individual replace buttons
  const replaceButtons = alertsContent.querySelectorAll('.replace-btn');
  replaceButtons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const alertItem = btn.closest('.alert-item');
      const index = parseInt(btn.dataset.index);
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
        const remainingAlerts = alertsContent.querySelectorAll('.alert-item').length;
        if (remainingAlerts === 0) {
          alertsContent.innerHTML = '<p class="empty-state">All replacements applied!</p>';
          // Reset button to normal state
          const toggleButton = document.getElementById('prompt-protekt-toggle');
          if (toggleButton) {
            toggleButton.innerHTML = '⚙️';
            toggleButton.classList.remove('alert-mode');
          }
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

// Function to show optimized text popup
function showOptimizedTextPopup(optimizedText) {
  // Remove any existing popup
  const existingPopup = document.getElementById('optimized-text-popup');
  if (existingPopup) {
    existingPopup.remove();
  }
  
  // Create popup overlay
  const overlay = document.createElement('div');
  overlay.id = 'optimized-text-popup';
  overlay.className = 'optimized-popup-overlay';
  
  // Create popup content
  const popupContent = document.createElement('div');
  popupContent.className = 'optimized-popup-content';
  
  // Header with title and close button
  const header = document.createElement('div');
  header.className = 'optimized-popup-header';
  
  const title = document.createElement('h3');
  title.textContent = ' Optimized Text (Resource Saver Mode)';
  title.className = 'optimized-popup-title';
  
  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '✕';
  closeBtn.className = 'optimized-popup-close';
  closeBtn.addEventListener('click', () => {
    overlay.remove();
  });
  
  header.appendChild(title);
  header.appendChild(closeBtn);
  
  // Body with optimized text
  const body = document.createElement('div');
  body.className = 'optimized-popup-body';
  
  const textArea = document.createElement('textarea');
  textArea.className = 'optimized-popup-textarea';
  textArea.value = optimizedText;
  textArea.readOnly = false;
  
  body.appendChild(textArea);
  
  // Footer with info
  const footer = document.createElement('div');
  footer.className = 'optimized-popup-footer';
  footer.innerHTML = '<p class="optimized-popup-info"> PE enhancement was skipped to save resources. You can copy this text or close this popup.</p>';
  
  // Assemble popup
  popupContent.appendChild(header);
  popupContent.appendChild(body);
  popupContent.appendChild(footer);
  overlay.appendChild(popupContent);
  
  // Add to body
  document.body.appendChild(overlay);
  
  // Close on overlay click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.remove();
    }
  });
  
  // Select text for easy copying
  textArea.focus();
  textArea.select();
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

  // Token Save action button (always visible)
  const tokenSaveButton = document.createElement('button');
  tokenSaveButton.id = 'token-save-action-btn';
  tokenSaveButton.innerHTML = '⬆️';
  tokenSaveButton.title = 'Optimize & Enhance Prompt';
  
  // Initially disable if not logged in
  if (!isLoggedIn) {
    tokenSaveButton.disabled = true;
    tokenSaveButton.classList.add('disabled');
    tokenSaveButton.title = 'Login required to use this feature';
  }
  
  // Token Save button click handler
  tokenSaveButton.addEventListener('click', async () => {
    // Check login status
    if (!isLoggedIn) {
      createIndicator('Please login to use this feature');
      return;
    }
    
    const textarea = document.getElementById('prompt-textarea');
    const promptArea = document.getElementById('prompt-area');
    const element = textarea || promptArea;
    
    if (!element) {
      createIndicator('No text field found');
      return;
    }
    
    const currentText = getTextFromElement(element);
    if (!currentText || !currentText.trim()) {
      createIndicator('No text to optimize');
      return;
    }
    
    // Show loading state
    tokenSaveButton.disabled = true;
    tokenSaveButton.innerHTML = '⏳';
    createIndicator('Optimizing prompt...');
    
    try {
      // Step 1: Token Save
      const tokenResponse = await sendToWorkerForTokenSave(currentText);
      
      if (tokenResponse && tokenResponse.optimizedText) {
        // Update the text with optimized version
        setTextInElement(element, tokenResponse.optimizedText);
        createIndicator('Token Save: Complete ✓');
        
        // Check use_resource_saver flag from response
        const useResourceSaver = tokenResponse.use_resource_saver === true;
        
        if (useResourceSaver) {
          // Show popup with optimized text instead of proceeding to PE
          showOptimizedTextPopup(tokenResponse.optimizedText);
          
          // Reset button
          tokenSaveButton.disabled = false;
          tokenSaveButton.innerHTML = '⬆️';
        } else {
          // Step 2: Auto-activate Prompt Enhancement (only if resource saver is false)
          setTimeout(async () => {
            createIndicator('Enhancing prompt...');
            const peResponse = await sendToWorkerForPE(tokenResponse.optimizedText);
            
            if (peResponse && peResponse.enhancedText) {
              // Update with enhanced version
              setTextInElement(element, peResponse.enhancedText);
              createIndicator('Prompt Enhancement: Complete ✓');
            } else if (peResponse) {
              console.log('PE Response:', peResponse);
              createIndicator('Prompt Enhancement: Complete ✓');
            } else {
              createIndicator('Prompt Enhancement: Failed');
            }
            
            // Reset button
            tokenSaveButton.disabled = false;
            tokenSaveButton.innerHTML = '⬆️';
          }, 500);
        }
      } else if (tokenResponse) {
        console.log('Token Save Response:', tokenResponse);
        createIndicator('Token Save: Complete ✓');
        
        // Reset button
        tokenSaveButton.disabled = false;
        tokenSaveButton.innerHTML = '⬆️';
      } else {
        createIndicator('Token Save: Failed');
        tokenSaveButton.disabled = false;
        tokenSaveButton.innerHTML = '⬆️';
      }
    } catch (error) {
      console.error('Error in Token Save process:', error);
      createIndicator('Optimization failed');
      tokenSaveButton.disabled = false;
      tokenSaveButton.innerHTML = '⬆️';
    }
  });

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

  // Login tab button
  const loginTabBtn = document.createElement('button');
  loginTabBtn.textContent = 'Login';
  loginTabBtn.className = 'tab-button';

  tabButtons.appendChild(alertsTabBtn);
  tabButtons.appendChild(loginTabBtn);

  // Alerts content
  const alertsContent = document.createElement('div');
  alertsContent.className = 'tab-content alerts active';
  alertsContent.innerHTML = '<p class="empty-state">No alerts at this time.</p>';

  // Login content
  const loginContent = document.createElement('div');
  loginContent.className = 'tab-content login-content';

  // Create login form
  const loginForm = document.createElement('div');
  loginForm.className = 'login-form';

  // Email/Username field
  const emailContainer = document.createElement('div');
  emailContainer.className = 'login-field-container';
  
  const emailLabel = document.createElement('label');
  emailLabel.textContent = 'Email';
  emailLabel.className = 'login-label';
  emailLabel.htmlFor = 'login-email';
  
  const emailInput = document.createElement('input');
  emailInput.type = 'email';
  emailInput.id = 'login-email';
  emailInput.className = 'login-input';
  emailInput.placeholder = 'Enter your email';
  
  emailContainer.appendChild(emailLabel);
  emailContainer.appendChild(emailInput);

  // Password field
  const passwordContainer = document.createElement('div');
  passwordContainer.className = 'login-field-container';
  
  const passwordLabel = document.createElement('label');
  passwordLabel.textContent = 'Password';
  passwordLabel.className = 'login-label';
  passwordLabel.htmlFor = 'login-password';
  
  const passwordInput = document.createElement('input');
  passwordInput.type = 'password';
  passwordInput.id = 'login-password';
  passwordInput.className = 'login-input';
  passwordInput.placeholder = 'Enter your password';
  
  passwordContainer.appendChild(passwordLabel);
  passwordContainer.appendChild(passwordInput);

  // Login button
  const loginButton = document.createElement('button');
  loginButton.textContent = 'Login';
  loginButton.className = 'login-button';
  loginButton.addEventListener('click', () => {
    // Handle logout
    if (isLoggedIn) {
      isLoggedIn = false;
      
      // Disable Token Save button
      tokenSaveButton.disabled = true;
      tokenSaveButton.classList.add('disabled');
      tokenSaveButton.title = 'Login required to use this feature';
      
      // Reset login form
      loginButton.textContent = 'Login';
      loginButton.className = 'login-button';
      emailInput.disabled = false;
      passwordInput.disabled = false;
      emailInput.value = '';
      passwordInput.value = '';
      
      createIndicator('Logged out successfully');
      return;
    }
    
    // Handle login
    const email = emailInput.value;
    const password = passwordInput.value;
    
    if (!email || !password) {
      createIndicator('Please enter both email and password');
      return;
    }
    
    // TODO: Implement actual login functionality with backend
    // For now, simulate successful login
    console.log('Login attempt:', { email, password: '***' });
    
    // Simulate login success
    isLoggedIn = true;
    
    // Enable Token Save button
    tokenSaveButton.disabled = false;
    tokenSaveButton.classList.remove('disabled');
    tokenSaveButton.title = 'Optimize & Enhance Prompt';
    
    // Update login form to show logged in state
    loginButton.textContent = 'Logout';
    loginButton.className = 'login-button logout';
    emailInput.disabled = true;
    passwordInput.disabled = true;
    
    createIndicator('Login successful!');
  });

  loginForm.appendChild(emailContainer);
  loginForm.appendChild(passwordContainer);
  loginForm.appendChild(loginButton);
  loginContent.appendChild(loginForm);

  // Tab switching functionality
  alertsTabBtn.addEventListener('click', () => {
    alertsTabBtn.classList.add('active');
    loginTabBtn.classList.remove('active');
    alertsContent.classList.add('active');
    loginContent.classList.remove('active');
  });

  loginTabBtn.addEventListener('click', () => {
    loginTabBtn.classList.add('active');
    alertsTabBtn.classList.remove('active');
    loginContent.classList.add('active');
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
  popup.appendChild(loginContent);
  container.appendChild(toggleButton);
  container.appendChild(tokenSaveButton);
  container.appendChild(popup);
  document.body.appendChild(container);
}

// Initialize the interface when the page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', createBottomRightInterface);
} else {
  createBottomRightInterface();
}