const prompt = document.querySelector("#prompt");
const submitbtn = document.querySelector("#submit");
const chatContainer = document.querySelector(".chat-container");
const imagebtn = document.querySelector("#image");
const image = document.querySelector("#image img");
const imageinput = document.querySelector("#image input");

const API_URL = "http://localhost:5000/api/ai/chat";

let user = {
  message: null,
  file: {
    mime_type: null,
    data: null
  }
};

async function generateResponse(aiChatBox) {
  const text = aiChatBox.querySelector(".ai-chat-area");
  const token = localStorage.getItem("token");

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        message: user.message,
        file: user.file?.data ? user.file : null
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to get AI response");
    }

    let apiResponse = data.reply
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .trim();

    text.innerHTML = apiResponse;

  } catch (error) {
    console.error("AI Chat Error:", error);
    text.innerHTML = `❌ ${error.message}`;
  } finally {
    chatContainer.scrollTo({
      top: chatContainer.scrollHeight,
      behavior: "smooth"
    });

    image.src = "img.svg";
    image.classList.remove("choose");

    user.file = {
      mime_type: null,
      data: null
    };
  }
}

function createChatBox(html, classes) {
  const div = document.createElement("div");
  div.innerHTML = html;
  div.classList.add(classes);
  return div;
}

function handlechatResponse(userMessage) {
  const cleanMessage = userMessage.trim();

  if (!cleanMessage && !user.file?.data) {
    return;
  }

  user.message = cleanMessage;

  let html = `
    <img src="user.png" alt="" id="userImage" width="8%">
    <div class="user-chat-area">
      ${user.message || "📷 Image sent"}
      ${user.file?.data ? `<img src="data:${user.file.mime_type};base64,${user.file.data}" class="chooseimg" />` : ""}
    </div>
  `;

  prompt.value = "";

  const userChatBox = createChatBox(html, "user-chat-box");
  chatContainer.appendChild(userChatBox);

  chatContainer.scrollTo({
    top: chatContainer.scrollHeight,
    behavior: "smooth"
  });

  setTimeout(() => {
    let html = `
      <img src="ai.png" alt="" id="aiImage" width="10%">
      <div class="ai-chat-area">
        <img src="loading.webp" alt="" class="load" width="50px">
      </div>
    `;

    const aiChatBox = createChatBox(html, "ai-chat-box");
    chatContainer.appendChild(aiChatBox);
    generateResponse(aiChatBox);
  }, 500);
}

prompt.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    handlechatResponse(prompt.value);
  }
});

submitbtn.addEventListener("click", () => {
  handlechatResponse(prompt.value);
});

imageinput.addEventListener("change", () => {
  const file = imageinput.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = (e) => {
    const base64string = e.target.result.split(",")[1];

    user.file = {
      mime_type: file.type,
      data: base64string
    };

    image.src = `data:${user.file.mime_type};base64,${user.file.data}`;
    image.classList.add("choose");
  };

  reader.readAsDataURL(file);
});

imagebtn.addEventListener("click", () => {
  imageinput.click();
});