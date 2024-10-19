function saveSelectedLanguage(language) {
  console.log("saveSelectedLanguage:", language);
  browser.runtime.sendMessage({
    command: "saveSettingLanguage",
    language: language,
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
          
          summarizeText();
        }
      },
      { once: true }
    );
  });

  makeDraggable(button); // Make the button draggable
  return button;
}

function fetchWithRetry(url, options, retries = 5, delay = 1000) {
  return new Promise((resolve, reject) => {
    const attemptFetch = (n) => {
      fetch(url, options)
        .then((response) => {
          return response.text();
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

  const endpoint = `https://ai-proxy-31b697729d07.herokuapp.com/api/generate_summary`;

  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: document.title + "[Tóm tắt trừ 2 đến 4 dòng]",
      text: document.body.innerText,
      language: targetLanguage,
    }),
  };

  fetchWithRetry(endpoint, options)
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
    { code: "en", name: "English" },
  ];

  languages.forEach((lang) => {
    const option = document.createElement("option");
    option.value = lang.code;
    option.textContent = lang.name;
    select.appendChild(option);
  });

  loadSelectedLanguage().then((response) => {
    select.value = response;
  });

  select.addEventListener("change", () => {
    saveSelectedLanguage(select.value);
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

function makeDraggableWithClick(element) {
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
    element.isDragging = false;
    offsetX = e.clientX - element.getBoundingClientRect().left;
    offsetY = e.clientY - element.getBoundingClientRect().top;
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  });

  element.addEventListener("click", (e) => {
    if (isDragging) {
      element.isDragging = true;
    }
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
  popupContainer.appendChild(createPopupContent());
  popupContainer.appendChild(createLoadingSpinner());
  document.body.appendChild(popupContainer);

  const showPopupButton = createShowPopupButton(popupContainer);
  document.body.appendChild(showPopupButton);

  makeDraggable(popupContainer);
  makeDraggableWithClick(showPopupButton);
  makeZIndexOnTop(popupContainer);
  makeZIndexOnTop(showPopupButton);
  makeFullScreenOnMobile(popupContainer);
})();