const settings = {
    language: 'vi',  // Default to Vietnamese
    length: 'short'  // Default to short
};

const saveSettingLanguage = (language) => {
    settings.language = language;
    console.log('Save language: ' + language);
    browser.storage.local.set({language: language});
}

const saveSettingLength = (length) => {
    settings.length = length;
    console.log('Save length: ' + length);
    browser.storage.local.set({length: length});
}

const loadSettingLanguage = () => {
    console.log('Load language: ' + settings.language);
    return settings.language;
}

const loadSettingLength = () => {
    console.log('Load length: ' + settings.length);
    return settings.length;
}

// register the event listener
browser.runtime.onMessage.addListener((message) => {
    if (message.command === 'saveSettingLanguage') {
        saveSettingLanguage(message.language);
    } else if (message.command === 'saveSettingLength') {
        saveSettingLength(message.length);
    } else if (message.command === 'loadSettingLanguage') {
        return Promise.resolve(loadSettingLanguage());
    } else if (message.command === 'loadSettingLength') {
        return Promise.resolve(loadSettingLength());
    }
});