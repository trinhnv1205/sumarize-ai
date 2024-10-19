const settings = {
    language: localStorage.getItem('selectedLanguage') || 'vi',  // Default to Vietnamese
    length: 'short'  // Default to short
};

const loadSettingLanguage = () => {
    console.log('Load language: ' + settings.language);
    return settings.language;
}

// register the event listener
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.command === "saveSettingLanguage") {
    const language = message.language;
    // Save the language setting
    localStorage.setItem("selectedLanguage", language);
    settings.language = language;  // Update the settings object
    sendResponse({ status: "success" });
  } else if (message.command === "loadSettingLanguage") {
    sendResponse(settings.language);
  }
});