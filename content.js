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