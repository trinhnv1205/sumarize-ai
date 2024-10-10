chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "fetchData") {
    fetch(request.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request.data)
    })
      .then(response => response.json())
      .then(data => sendResponse({ data }))
      .catch(error => sendResponse({ error: error.toString() }));
    return true;  // Will respond asynchronously.
  }
});
