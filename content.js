// Wait for the page to load
let typingTimer;
const TYPING_DELAY = 1000; // 1 second after user stops typing
const WORKER_URL = 'https://your-worker.workers.dev/api/endpoint';

// Create visual indicator
function createIndicator(text) {
  const indicator = document.createElement('div');
  indicator.id = 'typing-indicator';
  indicator.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 10px 20px;
    background-color: #4CAF50;
    color: white;
    border-radius: 5px;
    font-family: Arial, sans-serif;
    font-size: 14px;
    z-index: 10000;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    transition: opacity 0.3s;
    max-width: 300px;
    word-wrap: break-word;
  `;
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
          const uppercaseText = text.toUpperCase();
          setTextInElement(e.target, uppercaseText);
          createIndicator('Converted to uppercase');
          //sendToWorker(uppercaseText);
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
          const uppercaseText = text.toUpperCase();
          setTextInElement(e.target, uppercaseText);
          createIndicator('Converted to uppercase');
          //sendToWorker(uppercaseText);
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
          const uppercaseText = text.toUpperCase();
          setTextInElement(promptArea, uppercaseText);
          createIndicator('Converted to uppercase');
          //sendToWorker(uppercaseText);
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

// Create bottom-right interface
function createBottomRightInterface() {
  // Main container (collapsed state - just the button)
  const container = document.createElement('div');
  container.id = 'prompt-protekt-container';
  container.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 10000;
    font-family: Arial, sans-serif;
  `;

  // Toggle button (always visible)
  const toggleButton = document.createElement('button');
  toggleButton.id = 'prompt-protekt-toggle';
  toggleButton.innerHTML = '⚙️';
  toggleButton.style.cssText = `
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background-color: #4CAF50;
    color: white;
    border: none;
    font-size: 24px;
    cursor: pointer;
    box-shadow: 0 4px 6px rgba(0,0,0,0.3);
    transition: all 0.3s;
  `;
  toggleButton.onmouseover = () => {
    toggleButton.style.transform = 'scale(1.1)';
  };
  toggleButton.onmouseout = () => {
    toggleButton.style.transform = 'scale(1)';
  };

  // Popup panel (hidden by default)
  const popup = document.createElement('div');
  popup.id = 'prompt-protekt-popup';
  popup.style.cssText = `
    display: none;
    position: absolute;
    bottom: 60px;
    right: 0;
    width: 300px;
    background-color: white;
    border-radius: 10px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    overflow: hidden;
  `;

  // Tab buttons container
  const tabButtons = document.createElement('div');
  tabButtons.style.cssText = `
    display: flex;
    background-color: #f1f1f1;
    border-bottom: 2px solid #ddd;
  `;

  // Alerts tab button
  const alertsTabBtn = document.createElement('button');
  alertsTabBtn.textContent = 'Alerts';
  alertsTabBtn.className = 'tab-button active';
  alertsTabBtn.style.cssText = `
    flex: 1;
    padding: 12px;
    border: none;
    background-color: #4CAF50;
    color: white;
    cursor: pointer;
    font-size: 14px;
    font-weight: bold;
    transition: background-color 0.3s;
  `;

  // Settings tab button
  const settingsTabBtn = document.createElement('button');
  settingsTabBtn.textContent = 'Settings';
  settingsTabBtn.className = 'tab-button';
  settingsTabBtn.style.cssText = `
    flex: 1;
    padding: 12px;
    border: none;
    background-color: #f1f1f1;
    color: #333;
    cursor: pointer;
    font-size: 14px;
    font-weight: bold;
    transition: background-color 0.3s;
  `;

  tabButtons.appendChild(alertsTabBtn);
  tabButtons.appendChild(settingsTabBtn);

  // Alerts content
  const alertsContent = document.createElement('div');
  alertsContent.className = 'tab-content';
  alertsContent.style.cssText = `
    display: block;
    padding: 15px;
    max-height: 300px;
    overflow-y: auto;
    color: #333;
  `;
  alertsContent.innerHTML = '<p style="margin: 0; color: #666;">No alerts at this time.</p>';

  // Settings content
  const settingsContent = document.createElement('div');
  settingsContent.className = 'tab-content';
  settingsContent.style.cssText = `
    display: none;
    padding: 15px;
  `;

  // Create toggle switches for settings
  const toggles = [
    { id: 'NER', label: 'NER' },
    { id: 'PE', label: 'PE' },
    { id: 'TokenSave', label: 'Token Save' }
  ];

  toggles.forEach(toggle => {
    const toggleContainer = document.createElement('div');
    toggleContainer.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
      padding: 10px;
      background-color: #f9f9f9;
      border-radius: 5px;
    `;

    const label = document.createElement('span');
    label.textContent = toggle.label;
    label.style.cssText = `
      font-size: 14px;
      color: #333;
      font-weight: 500;
    `;

    // Toggle switch
    const toggleSwitch = document.createElement('label');
    toggleSwitch.style.cssText = `
      position: relative;
      display: inline-block;
      width: 50px;
      height: 24px;
    `;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `toggle-${toggle.id}`;
    checkbox.style.cssText = `
      opacity: 0;
      width: 0;
      height: 0;
    `;

    const slider = document.createElement('span');
    slider.style.cssText = `
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: #ccc;
      transition: 0.4s;
      border-radius: 24px;
    `;

    const sliderButton = document.createElement('span');
    sliderButton.style.cssText = `
      position: absolute;
      content: "";
      height: 18px;
      width: 18px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: 0.4s;
      border-radius: 50%;
    `;
    slider.appendChild(sliderButton);

    // Toggle functionality
    checkbox.addEventListener('change', function() {
      settings[toggle.id] = this.checked;
      console.log(`${toggle.label} is now: ${this.checked ? 'ON' : 'OFF'}`);
      
      if (this.checked) {
        slider.style.backgroundColor = '#4CAF50';
        sliderButton.style.transform = 'translateX(26px)';
        
        // Placeholder for NER functionality
        if (toggle.id === 'NER') {
          console.log('NER functionality activated');
          // TODO: Add NER logic here
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
        slider.style.backgroundColor = '#ccc';
        sliderButton.style.transform = 'translateX(0)';
        
        // Placeholder for disabling functionality
        if (toggle.id === 'NER') {
          console.log('NER functionality deactivated');
          // TODO: Add logic to disable NER
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
    alertsTabBtn.style.backgroundColor = '#4CAF50';
    alertsTabBtn.style.color = 'white';
    settingsTabBtn.style.backgroundColor = '#f1f1f1';
    settingsTabBtn.style.color = '#333';
    alertsContent.style.display = 'block';
    settingsContent.style.display = 'none';
  });

  settingsTabBtn.addEventListener('click', () => {
    settingsTabBtn.style.backgroundColor = '#4CAF50';
    settingsTabBtn.style.color = 'white';
    alertsTabBtn.style.backgroundColor = '#f1f1f1';
    alertsTabBtn.style.color = '#333';
    settingsContent.style.display = 'block';
    alertsContent.style.display = 'none';
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