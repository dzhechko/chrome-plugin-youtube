document.addEventListener('DOMContentLoaded', () => {
  const baseUrlInput = document.getElementById('baseUrl');
  const apiKeyInput = document.getElementById('apiKey');
  const modelNameInput = document.getElementById('modelName');
  const saveSettingsBtn = document.getElementById('saveSettings');
  const summarizeBtn = document.getElementById('summarizeBtn');
  const summaryDiv = document.getElementById('summary');
  const toggleApiKeyBtn = document.getElementById('toggleApiKey');

  console.log('Popup script loaded');

  // Load saved settings
  chrome.storage.sync.get(['baseUrl', 'apiKey', 'modelName'], (result) => {
    console.log('Loaded settings:', result);
    baseUrlInput.value = result.baseUrl || '';
    apiKeyInput.value = result.apiKey || '';
    modelNameInput.value = result.modelName || 'gpt-3.5-turbo';
  });

  toggleApiKeyBtn.addEventListener('click', () => {
    if (apiKeyInput.type === 'password') {
      apiKeyInput.type = 'text';
      toggleApiKeyBtn.textContent = '🔒';
    } else {
      apiKeyInput.type = 'password';
      toggleApiKeyBtn.textContent = '👁️';
    }
  });

  saveSettingsBtn.addEventListener('click', () => {
    console.log('Save settings button clicked');
    const settings = {
      baseUrl: baseUrlInput.value,
      apiKey: apiKeyInput.value,
      modelName: modelNameInput.value
    };
    console.log('Saving settings:', settings);
    chrome.storage.sync.set(settings, () => {
      console.log('Settings saved');
      summaryDiv.textContent = 'Settings saved successfully!';
    });
  });

  summarizeBtn.addEventListener('click', () => {
    console.log('Summarize button clicked');
    summaryDiv.textContent = 'Summarizing...';
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        console.log('Sending message to content script');
        chrome.tabs.sendMessage(tabs[0].id, { action: 'extractAndSummarize' }, (response) => {
          if (chrome.runtime.lastError) {
            console.error('Error:', chrome.runtime.lastError);
            summaryDiv.textContent = 'Error: Unable to communicate with the page. Please refresh and try again.';
          } else {
            console.log('Message sent successfully, waiting for response');
          }
        });
      } else {
        console.error('No active tab found');
        summaryDiv.textContent = 'Error: No active tab found';
      }
    });
  });

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Message received in popup:', request);
    if (request.action === 'displaySummary') {
      summaryDiv.innerHTML = `<p>${request.summary}</p>`;
    }
  });

  console.log('Event listeners added');
});
