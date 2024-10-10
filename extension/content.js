// Element Creation Functions
function createLoadingSpinner() {
  const spinner = document.createElement("div");
  spinner.id = "loading-spinner";
  spinner.innerHTML = "⏳";
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
  button.innerHTML = "❌";
  button.className = "close-btn";
  button.addEventListener("click", () => {
    popupContainer.style.display = "none";
  });
  popupContainer.appendChild(button);
}

function createCopyButton(popupContainer) {
  const button = document.createElement("button");
  button.innerHTML = "📄";
  button.className = "copy-btn";
  button.addEventListener("click", () => {
    const text = document.getElementById("popup-content").textContent;
    navigator.clipboard
      .writeText(text)
      .then(() => {
        alert("Content copied to clipboard!");
      })
      .catch((err) => {
        console.error("Error copying text:", err);
      });
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
  button.className = "material-icon-button";
  button.innerHTML = "👁️";
  button.addEventListener("click", () => {
    popupContainer.style.display = "block";
    document.getElementById("loading-spinner").style.display = "block";
    fetchData();
  });
  return button;
}

function createTranslateButton(popupContainer) {
  const button = document.createElement("button");
  button.innerHTML = "🌐";
  button.className = "translate-btn";
  button.addEventListener("click", () => {
    const text = document.getElementById("popup-content").textContent;
    translateText(text);
  });
  popupContainer.appendChild(button);
}

function createLanguageSelect(popupContainer) {
  const select = document.createElement("select");
  select.id = "language-select";
  select.className = "language-select";

  const languages = [
    { code: "en", name: "English" },
    { code: "vi", name: "Vietnamese" },
    // { code: "es", name: "Spanish" },
    // { code: "fr", name: "French" },
    // { code: "de", name: "German" },
  ];

  languages.forEach((lang) => {
    const option = document.createElement("option");
    option.value = lang.code;
    option.textContent = lang.name;
    select.appendChild(option);
  });

  const savedLanguage = localStorage.getItem("selected-language");
  if (savedLanguage) {
    select.value = savedLanguage;
  }

  select.addEventListener("change", () => {
    localStorage.setItem("selected-language", select.value);
  });

  popupContainer.appendChild(select);
}

// Utility Functions
function makeDraggable(element) {
  let isDragging = false;
  let offsetX, offsetY;

  element.addEventListener("mousedown", (e) => {
    isDragging = true;
    offsetX = e.clientX - element.getBoundingClientRect().left;
    offsetY = e.clientY - element.getBoundingClientRect().top;
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  });

  function onMouseMove(e) {
    if (isDragging) {
      const newX = e.clientX - offsetX;
      const newY = e.clientY - offsetY;
      element.style.left = `${Math.max(0, newX)}px`;
      element.style.top = `${Math.max(0, newY)}px`;
      element.style.bottom = "auto";
      element.style.right = "auto";
    }
  }

  function onMouseUp() {
    isDragging = false;
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);

    localStorage.setItem("popup-left", element.style.left);
    localStorage.setItem("popup-top", element.style.top);
  }
}

function hidePopup() {
  const popup = document.getElementById("popup");
  if (popup) {
    popup.style.display = "none";
  }
}

// Main Logic Functions
function fetchData() {
  const targetLanguage = localStorage.getItem("selected-language") || "vi";

  const data = {
    title: document.title + "[Tóm tắt trừ 2 đến 4 dòng]",
    text: document.body.innerText,
    language: targetLanguage,
  };

  document.getElementById("loading-spinner").style.display = "block";

  fetch("https://ai-proxy-31b697729d07.herokuapp.com/api/generate_summary", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
    .then((response) => response.text())
    .then((response) => {
      document.getElementById("loading-spinner").style.display = "none";
      const lines = response.split("\n").filter((line) => line.trim() !== "");
      const ul = document.createElement("ul");
      document.getElementById("popup-content").innerHTML = "";
      document.getElementById("popup-content").appendChild(ul);

      let index = 0;
      function addLine() {
        if (index < lines.length) {
          const li = document.createElement("li");
          ul.appendChild(li);
          li.classList.add("show");
          addWords(li, lines[index].split(" "), () => {
            index++;
            setTimeout(addLine, 500); // Adjust the delay as needed
          });
        } else {
          document.getElementById("loading-spinner").style.display = "none";
        }
      }

      function addWords(li, words, callback) {
        let wordIndex = 0;
        function addWord() {
          if (wordIndex < words.length) {
            li.textContent += (wordIndex > 0 ? " " : "") + words[wordIndex];
            wordIndex++;
            setTimeout(addWord, 50); // Adjust the delay as needed
          } else {
            callback();
          }
        }
        addWord();
      }

      addLine();
    })
    .catch((error) => {
      console.error("Error fetching data:", error);
      document.getElementById("popup-content").textContent =
        "Error fetching data";
      document.getElementById("loading-spinner").style.display = "none";
    });
}

function translateText(text) {
  document.getElementById("loading-spinner").style.display = "block";

  const targetLanguage = localStorage.getItem("selected-language") || "vi";

  if (chrome.runtime && chrome.runtime.sendMessage) {
    try {
      chrome.runtime.sendMessage(
        {
          action: "fetchData",
          url: "https://script.google.com/macros/s/AKfycbwLyNm0QfFr5Ndm6P-JSaOByPTryhlHK9SYjsaoMAc5zsUO5zb8AZgf7vE7KzP3naRv/exec?path=translate",
          data: { text: text, target_language: targetLanguage },
        },
        (response) => {
          if (response.error) {
            console.error("Error:", response.error);
            document.getElementById("popup-content").textContent =
              "Error translating text";
          } else {
            document.getElementById("popup-content").innerHTML =
              response.data.translation || "Translation failed";
          }
          document.getElementById("loading-spinner").style.display = "none";
        }
      );
    } catch (error) {
      document.getElementById("popup-content").textContent =
        "Error translating text";
      document.getElementById("loading-spinner").style.display = "none";
    }
  }
}

// Initialization
(function initializePopup() {
  const cssLink = document.createElement("link");
  cssLink.rel = "stylesheet";
  cssLink.href = "styles.css";
  document.head.appendChild(cssLink);

  const popupContainer = createPopupContainer();
  createCloseButton(popupContainer);
  createLanguageSelect(popupContainer);
  popupContainer.appendChild(createPopupContent());
  popupContainer.appendChild(createLoadingSpinner());
  document.body.appendChild(popupContainer);

  const showPopupButton = createShowPopupButton(popupContainer);
  document.body.appendChild(showPopupButton);

  makeDraggable(popupContainer);

  document.addEventListener("click", (event) => {
    if (
      event.target === popupContainer ||
      popupContainer.contains(event.target)
    ) {
      return;
    }
    hidePopup(popupContainer);
  });
})();