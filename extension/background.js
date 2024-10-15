chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "fetchData") {
    fetch(request.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request.data),
    })
      .then((response) => response.json())
      .then((data) => sendResponse({ data }))
      .catch((error) => sendResponse({ error: error.toString() }));
    return true; // Will respond asynchronously.
  }
});

let selectedLanguage = null;

// Load the saved language from storage when the background script starts
chrome.storage.local.get("selectedLanguage", (result) => {
  if (result.selectedLanguage) {
    selectedLanguage = result.selectedLanguage;
  }
});

// Listen for messages from the content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.command === "saveLanguage") {
    selectedLanguage = message.language;
    chrome.storage.local.set({ selectedLanguage: message.language }, () => {
      sendResponse({ status: "success" });
    });
    return true; // Indicates that the response will be sent asynchronously
  } else if (message.command === "loadLanguage") {
    sendResponse({ language: selectedLanguage });
  }
});