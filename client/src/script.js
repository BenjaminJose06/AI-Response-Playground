// Initialize slider readouts: ensure output value matches slider position
document.querySelectorAll('.control').forEach(group => {
  const slider = group.querySelector('input[type="range"]');
  const output = group.querySelector('output');
  if (slider && output) {
    output.value = slider.value; // initial value
    slider.addEventListener('input', () => {
      output.value = slider.value; // update on user input
    });
  }
});

// Import profile icons
import bot  from '../assets/bot.svg';
import user from '../assets/user.svg';

// DOM references
const form = document.querySelector('form');
const chatContainer = document.querySelector('#chat_container');

// Global state
let loadInterval;
let conversationHistory = [
  { role: "system", content: "You are a helpful assistant." }
];

/**
 * Loader animation: cycles through dots while waiting for response
 */
function loader(element) {
  element.textContent = '';
  loadInterval = setInterval(() => {
    element.textContent += '.';
    if (element.textContent === '....') {
      element.textContent = '';
    }
  }, 300);
}

/**
 * Typing effect: renders response text character by character
 */
function typeText(element, text) {
  let index = 0;
  let interval = setInterval(() => {
    if (index < text.length) {
      element.innerHTML += text.charAt(index);
      index++;
    } else {
      clearInterval(interval);
    }
  }, 20);
}

/**
 * Unique ID generator for message elements
 */
function generateUniqueId() {
  const timestamp = Date.now();
  const randomNumber = Math.random();
  const hexadecimalString = randomNumber.toString(16);
  return `id-${timestamp}-${hexadecimalString}`;
}

/**
 * Chat bubble (user or AI)
 */
function chatStripe(isAi, value, uniqueId) {
  return `
    <div class="wrapper ${isAi ? 'ai' : ''}">
      <div class="chat">
        <div class="profile">
          <img 
            src="${isAi ? bot : user}" 
            alt="${isAi ? 'bot' : 'user'}" 
          />
        </div>
        <div class="message" id="${uniqueId}">${value}</div>
      </div>
    </div>
  `;
}

/**
 * Handle message submission:
 *  - Append user message
 *  - Append bot placeholder
 *  - Send request to backend
 *  - Stream or display response
 */
const handleSubmit = async (e) => {
  e.preventDefault();

  // Extract user input
  const data = new FormData(form);
  const userPrompt = data.get('prompt');

  // Add user bubble
  chatContainer.innerHTML += chatStripe(false, userPrompt);
  form.reset();

  // Add user message to conversation history
  conversationHistory.push({ role: "user", content: userPrompt });

  // Add placeholder for bot response
  const uniqueId = generateUniqueId();
  chatContainer.innerHTML += chatStripe(true, " ", uniqueId);
  chatContainer.scrollTop = chatContainer.scrollHeight;

  const messageDiv = document.getElementById(uniqueId);
  loader(messageDiv);

  // Collect current parameter values
  const temperature = parseFloat(document.getElementById('temperature').value);
  const top_p = parseFloat(document.getElementById('top_p').value);
  const top_k = parseInt(document.getElementById('top_k').value);
  const max_tokens = parseInt(document.getElementById('max_tokens').value);
  const repeat_penalty = parseFloat(document.getElementById('repeat_penalty').value);
  const presence_penalty = parseFloat(document.getElementById('presence_penalty').value);
  const frequency_penalty = parseFloat(document.getElementById('frequency_penalty').value);

  // Send request to backend (Ollama)
  const response = await fetch('https://ai-response-playground.onrender.com', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: "llama3.2:3b", 
      messages: conversationHistory,
      options: {
        temperature,
        top_p,
        top_k,
        num_predict: max_tokens,
        repeat_penalty,
        presence_penalty,
        frequency_penalty
      }
    })
  });

  clearInterval(loadInterval);
  messageDiv.innerHTML = " ";

  if (response.ok) {
    const data = await response.json();
    const parsedData = data.bot.trim();
    typeText(messageDiv, parsedData);
    // Save AI reply to conversation history
    conversationHistory.push({ role: "assistant", content: parsedData });
  } else {
    const err = await response.text();
    messageDiv.innerHTML = "Something went wrong";
    alert(err);
  }
};

// Event listeners for form submission
form.addEventListener('submit', handleSubmit);

// Allow pressing Enter to submit
form.addEventListener('keyup', (e) => {
  if (e.key === "Enter") {
    handleSubmit(e);
  }
});
