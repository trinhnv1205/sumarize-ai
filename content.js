const appscriptId =
  "YOUR_APPSCRIPT_ID";

function saveSelectedLanguage(language) {
  console.log("saveSelectedLanguage:", language);
  browser.runtime.sendMessage({
    command: "saveSettingLanguage",
    language: language,
  });
}

function saveSelectedLength(length) {
  console.log("saveSelectedLength:", length);
  browser.runtime.sendMessage({
    command: "saveSettingLength",
    length: length,
  });
}

function loadSelectedLanguage() {
  return browser.runtime
    .sendMessage({
      command: "loadSettingLanguage",
    })
    .then((response) => {
      console.log("loadSelectedLanguage:", response);
      return response;
    });
}

function loadSelectedLength() {
  return browser.runtime
    .sendMessage({
      command: "loadSettingLength",
    })
    .then((response) => {
      console.log("loadSelectedLength:", response);
      return response;
    });
}

function createLoadingSpinner() {
  const spinner = document.createElement("div");
  spinner.id = "loading-spinner";
  spinner.textContent = "⌛";
  return spinner;
}

function createPopupContainer() {
  const container = document.createElement("div");
  container.id = "my-popup";

  const storedLeft = localStorage.getItem("popup-left");
  const storedTop = localStorage.getItem("popup-top");
  if (storedLeft && storedTop) {
    container.style.left = storedLeft;
    container.style.top = storedTop;
  } else {
    container.style.left = "1rem";
    container.style.top = "1rem";
  }

  return container;
}

function createCloseButton(popupContainer) {
  const button = document.createElement("button");
  button.textContent = "❌";
  button.className = "close-btn";
  button.addEventListener("click", () => {
    popupContainer.style.display = "none";
  });
  popupContainer.appendChild(button);
}

function createPopupContent() {
  const content = document.createElement("div");
  content.id = "popup-content";
  return content;
}

function createShowPopupButton(popupContainer) {
  const button = document.createElement("button");
  button.id = "show-popup-button";
  button.className = "show-popup-button";
  button.textContent = "📄";
  button.addEventListener("click", () => {
    popupContainer.style.display = "block";
    document.getElementById("loading-spinner").style.display = "block";
    summarizeText();
  });
  return button;
}

function fetchWithRetry(url, options, retries = 5, delay = 1000) {
  return new Promise((resolve, reject) => {
    const attemptFetch = (n) => {
      fetch(url, options)
        .then((response) => {
          if (!response.ok) {
            throw new Error("Network response was not ok");
          }
          return response.json();
        })
        .then((data) => resolve(data))
        .catch((error) => {
          if (n === 1) {
            reject(error);
          } else {
            setTimeout(() => {
              attemptFetch(n - 1);
            }, delay);
          }
        });
    };
    attemptFetch(retries);
  });
}

function summarizeText() {
  let targetLanguage = document.getElementById("language-select").value;
  let targetLength = document.getElementById("length-select").value;
  console.log("fetchData:", targetLanguage, targetLength);

  const endpoint = `https://script.google.com/macros/s/${appscriptId}/exec?path=summarize`;

  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: document.body.innerText,
      target_language: targetLanguage,
      target_length: targetLength,
    }),
  };

  fetchWithRetry(endpoint, options)
    .then((data) => {
      const popupContent = document.getElementById("popup-content");
      popupContent.textContent = ""; // Clear existing content

      // Parse and display the JSON response
      const summaryData = data.summary;
      const title = document.createElement("h1");
      title.textContent = summaryData.title;
      popupContent.appendChild(title);

      const summaryList = document.createElement("ul");
      summaryData.summary.forEach((item) => {
        const listItem = document.createElement("li");
        listItem.textContent = item;
        summaryList.appendChild(listItem);
      });
      popupContent.appendChild(summaryList);

      document.getElementById("loading-spinner").style.display = "none"; // Hide spinner
    })
    .catch((error) => {
      console.error("Error:", error);
      document.getElementById("popup-content").textContent =
        "Error fetching data";
      document.getElementById("loading-spinner").style.display = "none"; // Hide spinner
    });
}

function createLanguageSelect(popupContainer) {
  const select = document.createElement("select");
  select.id = "language-select";
  select.className = "language-select";

  const languages = [
    { code: "vi", name: "Vietnamese" },
    { code: "ko", name: "Korean" },
    { code: "en", name: "English" },
    { code: "es", name: "Spanish" },
    { code: "fr", name: "French" },
    { code: "de", name: "German" },
  ];

  languages.forEach((lang) => {
    const option = document.createElement("option");
    option.value = lang.code;
    option.textContent = lang.name;
    select.appendChild(option);
  });

  const savedLanguage = loadSelectedLanguage().then((response) => {
    select.value = response;
  });
  if (savedLanguage) {
    select.value = savedLanguage;
  }

  select.addEventListener("change", () => {
    saveSelectedLanguage(select.value);
    summarizeText();
  });

  popupContainer.appendChild(select);
}

function createLengthSelect(popupContainer) {
  const select = document.createElement("select");
  select.id = "length-select";
  select.className = "length-select";

  const lengths = [
    { code: "short", name: "Short" },
    { code: "medium", name: "Medium" },
    { code: "long", name: "Long" },
  ];

  lengths.forEach((len) => {
    const option = document.createElement("option");
    option.value = len.code;
    option.textContent = len.name;
    select.appendChild(option);
  });

  const savedLength = loadSelectedLength().then((response) => {
    select.value = response;
  });
  if (savedLength) {
    select.value = savedLength;
  }

  select.addEventListener("change", () => {
    saveSelectedLength(select.value);
    summarizeText();
  });

  popupContainer.appendChild(select);
}

function makeDraggable(element) {
  let isDragging = false;
  let offsetX, offsetY;
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;

  function onMouseMove(e) {
    if (isDragging) {
      const newX = Math.max(
        0,
        Math.min(e.clientX - offsetX, screenWidth - element.offsetWidth)
      );
      const newY = Math.max(
        0,
        Math.min(e.clientY - offsetY, screenHeight - element.offsetHeight)
      );
      element.style.left = `${newX}px`;
      element.style.top = `${newY}px`;
      element.style.bottom = "auto";
      element.style.right = "auto";
    }
  }

  function onMouseUp() {
    if (isDragging) {
      isDragging = false;
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);

      localStorage.setItem("popup-left", element.style.left);
      localStorage.setItem("popup-top", element.style.top);
    }
  }

  element.addEventListener("mousedown", (e) => {
    isDragging = true;
    offsetX = e.clientX - element.getBoundingClientRect().left;
    offsetY = e.clientY - element.getBoundingClientRect().top;
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  });
}

function makeZIndexOnTop(element) {
  element.style.zIndex = "9999";
}

function makeFullScreenOnMobile(element) {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  if (isMobile) {
    element.style.width = "100%";
    element.style.height = "100%";
    element.style.left = "0";
    element.style.top = "0";
    element.style.bottom = "auto";
    element.style.right = "auto";
  }
}

(function initializePopup() {
  const cssLink = document.createElement("link");
  cssLink.rel = "stylesheet";
  cssLink.href = "styles.css";
  document.head.appendChild(cssLink);

  const popupContainer = createPopupContainer();
  createCloseButton(popupContainer);
  createLanguageSelect(popupContainer);
  createLengthSelect(popupContainer);
  popupContainer.appendChild(createPopupContent());
  popupContainer.appendChild(createLoadingSpinner());
  document.body.appendChild(popupContainer);

  const showPopupButton = createShowPopupButton(popupContainer);
  document.body.appendChild(showPopupButton);

  makeDraggable(popupContainer);
  makeDraggable(showPopupButton);
  makeZIndexOnTop(popupContainer);
  makeZIndexOnTop(showPopupButton);
  makeFullScreenOnMobile(popupContainer);
})();
