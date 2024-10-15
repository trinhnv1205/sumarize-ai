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

  let isDragging = false;

  button.addEventListener("mousedown", (e) => {
    isDragging = false;
    const onMouseMove = () => {
      isDragging = true;
    };
    document.addEventListener("mousemove", onMouseMove);

    button.addEventListener(
      "mouseup",
      () => {
        document.removeEventListener("mousemove", onMouseMove);
        if (!isDragging) {
          popupContainer.style.display = "block";
          document.getElementById("loading-spinner").style.display = "block";
          fetchData();
        }
      },
      { once: true }
    );
  });

  makeDraggable(button); // Make the button draggable
  return button;
}

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

    localStorage.setItem("button-left", element.style.left);
    localStorage.setItem("button-top", element.style.top);
  }
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

  // Load the saved language from the background script
  chrome.runtime.sendMessage({ command: "loadLanguage" }, (response) => {
    if (response && response.language) {
      select.value = response.language;
    }
  });

  select.addEventListener("change", () => {
    // Save the selected language to the background script
    chrome.runtime.sendMessage({
      command: "saveLanguage",
      language: select.value,
    });
  });

  popupContainer.appendChild(select);
}

function hidePopup() {
  const popup = document.getElementById("popup");
  if (popup) {
    popup.style.display = "none";
  }
}

// Main Logic Functions
function fetchData() {
  // load the selected language from the background script
  chrome.runtime.sendMessage({ command: "loadLanguage" }, (response) => {
    let targetLanguage = "en";
    if (response && response.language) {
      targetLanguage = response.language;
    }

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
  });
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
