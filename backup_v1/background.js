console.log('Background script loaded');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received in background:', request);
  if (request.action === 'summarize') {
    const { title, description, transcript } = request.data;
    const combinedText = `Title: ${title}\n\nDescription: ${description}\n\nTranscript: ${transcript}`;
    summarizeText(combinedText)
      .then(summary => {
        console.log('Summary generated:', summary);
        chrome.tabs.sendMessage(sender.tab.id, { action: 'displaySummary', summary });
      })
      .catch(error => {
        console.error('Summarization failed:', error);
        chrome.tabs.sendMessage(sender.tab.id, { 
          action: 'displaySummary', 
          summary: `Error: ${error.message}. Please check your API settings.` 
        });
      });
  }
  return true;
});

async function summarizeText(text) {
  console.log('Summarizing text');
  const settings = await chrome.storage.sync.get(['baseUrl', 'apiKey', 'modelName']);
  console.log('Retrieved settings:', settings);
  if (!settings.baseUrl || !settings.apiKey) {
    throw new Error('API settings not configured');
  }

  try {
    const response = await fetch(`${settings.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.apiKey}`
      },
      body: JSON.stringify({
        model: settings.modelName || "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that summarizes YouTube video transcripts."
          },
          {
            role: "user",
            content: `Please summarize the following YouTube video transcript in a concise manner:\n\n${text}`
          }
        ],
        max_tokens: 150
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API request failed: ${response.status} ${response.statusText}. ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const summary = data.choices[0].message.content.trim();
    chrome.runtime.sendMessage({ action: 'displaySummary', summary });
    return summary;
  } catch (error) {
    console.error('Error in summarizeText:', error);
    throw error;
  }
}

console.log('Background script setup complete');
