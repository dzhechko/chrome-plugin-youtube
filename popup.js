document.addEventListener('DOMContentLoaded', () => {
  const baseUrlInput = document.getElementById('baseUrl');
  const apiKeyInput = document.getElementById('apiKey');
  const modelNameInput = document.getElementById('modelName');
  const saveSettingsBtn = document.getElementById('saveSettings');
  const summarizeBtn = document.getElementById('summarizeBtn');
  const summaryDiv = document.getElementById('summary');
  const toggleBaseUrlBtn = document.getElementById('toggleBaseUrl');
  const toggleApiKeyBtn = document.getElementById('toggleApiKey');
  const toggleModelNameBtn = document.getElementById('toggleModelName');
  const sentenceSlider = document.getElementById('sentenceSlider');
  const sentenceCount = document.getElementById('sentenceCount');

  console.log('Popup script loaded');

  // Load saved settings
  chrome.storage.sync.get(['baseUrl', 'apiKey', 'modelName', 'sentenceCount'], (result) => {
    console.log('Loaded settings:', result);
    baseUrlInput.value = result.baseUrl || '';
    apiKeyInput.value = result.apiKey || '';
    modelNameInput.value = result.modelName || 'gpt-3.5-turbo';
    sentenceSlider.value = result.sentenceCount || 10;
    sentenceCount.textContent = sentenceSlider.value;
  });

  sentenceSlider.addEventListener('input', () => {
    sentenceCount.textContent = sentenceSlider.value;
  });

  function toggleVisibility(input, button) {
    if (input.type === 'password') {
      input.type = 'text';
      button.textContent = '🔒';
    } else {
      input.type = 'password';
      button.textContent = '👁️';
    }
  }

  toggleBaseUrlBtn.addEventListener('click', () => toggleVisibility(baseUrlInput, toggleBaseUrlBtn));
  toggleApiKeyBtn.addEventListener('click', () => toggleVisibility(apiKeyInput, toggleApiKeyBtn));
  toggleModelNameBtn.addEventListener('click', () => toggleVisibility(modelNameInput, toggleModelNameBtn));

  saveSettingsBtn.addEventListener('click', () => {
    console.log('Save settings button clicked');
    const settings = {
      baseUrl: baseUrlInput.value,
      apiKey: apiKeyInput.value,
      modelName: modelNameInput.value,
      sentenceCount: parseInt(sentenceSlider.value)
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
        chrome.tabs.sendMessage(tabs[0].id, { 
          action: 'extractAndSummarize',
          sentenceCount: parseInt(sentenceSlider.value)
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.error('Error:', chrome.runtime.lastError);
            summaryDiv.textContent = 'Error: Unable to communicate with the page. Please refresh and try again.';
          } else if (response && response.received) {
            console.log('Message received by content script');
          } else {
            console.error('Unexpected response:', response);
            summaryDiv.textContent = 'Error: Unexpected response from content script.';
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
