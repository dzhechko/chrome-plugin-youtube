console.log('Content script loaded');

function extractVideoInfo(sentenceCount) {
  console.log('Extracting video info');
  const title = document.querySelector('h1.ytd-watch-metadata yt-formatted-string')?.textContent;
  const description = document.querySelector('#description-inner')?.textContent;
  let transcript = '';

  console.log('Extracted title and description:', { title, description });

  // Попытка получить транскрипцию
  const transcriptButton = document.querySelector('button[aria-label="Show transcript"]');
  if (transcriptButton) {
    console.log('Transcript button found, clicking');
    transcriptButton.click();
    setTimeout(() => {
      transcript = document.querySelector('#segments-container')?.textContent || '';
      console.log('Transcript extracted:', transcript);
      sendDataForSummarization({ title, description, transcript }, sentenceCount);
    }, 1000);
  } else {
    console.log('No transcript button found');
    sendDataForSummarization({ title, description, transcript }, sentenceCount);
  }
}

function sendDataForSummarization(data, sentenceCount) {
  console.log('Sending data for summarization:', data);
  chrome.runtime.sendMessage({
    action: 'summarize',
    data: { ...data, sentenceCount }
  }, response => {
    if (chrome.runtime.lastError) {
      console.error('Error sending message:', chrome.runtime.lastError);
    } else {
      console.log('Message sent successfully');
    }
  });
}

function insertSummary(summary) {
  console.log('Inserting summary:', summary);
  let summaryContainer = document.getElementById('video-summary-container');
  if (!summaryContainer) {
    summaryContainer = document.createElement('div');
    summaryContainer.id = 'video-summary-container';
    summaryContainer.style.border = '1px solid #ccc';
    summaryContainer.style.padding = '10px';
    summaryContainer.style.marginTop = '10px';
    summaryContainer.style.backgroundColor = '#f9f9f9';
    const videoDescription = document.getElementById('description');
    if (videoDescription) {
      videoDescription.parentNode.insertBefore(summaryContainer, videoDescription.nextSibling);
    } else {
      console.error('Video description element not found');
    }
  }
  summaryContainer.innerHTML = `<h2>Video Summary</h2><p>${summary}</p>`;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received in content script:', request);
  if (request.action === 'displaySummary') {
    insertSummary(request.summary);
  } else if (request.action === 'extractAndSummarize') {
    extractVideoInfo(request.sentenceCount);
  }
  sendResponse({received: true});
  return true;
});

console.log('Content script setup complete');
