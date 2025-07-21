// DOM Elements
const generateBtn = document.getElementById('generate');
const copyBtn = document.getElementById('copyBtn');
const contextInput = document.getElementById('context');
const draftInput = document.getElementById('draftContext');
const summaryInput = document.getElementById('summaryContext');
const toneSelect = document.getElementById('tone');
const resultDiv = document.getElementById('result');
const loadingDiv = document.getElementById('loading');
const replyModeBtn = document.getElementById('replyModeBtn');
const draftModeBtn = document.getElementById('draftModeBtn');
const summaryModeBtn = document.getElementById('summaryModeBtn');
const replyMode = document.getElementById('replyMode');
const draftMode = document.getElementById('draftMode');
const summaryMode = document.getElementById('summaryMode');
const summaryOptions = document.getElementById('summaryOptions');
const summaryTypeSelect = document.getElementById('summaryType');

let currentMode = 'reply';

// Mode switching
replyModeBtn.addEventListener('click', () => {
  currentMode = 'reply';
  replyMode.style.display = 'block';
  draftMode.style.display = 'none';
  summaryMode.style.display = 'none';
  summaryOptions.style.display = 'none';
  toneSelect.style.display = 'block';
  replyModeBtn.classList.add('active');
  draftModeBtn.classList.remove('active');
  summaryModeBtn.classList.remove('active');
});

draftModeBtn.addEventListener('click', () => {
  currentMode = 'draft';
  replyMode.style.display = 'none';
  draftMode.style.display = 'block';
  summaryMode.style.display = 'none';
  summaryOptions.style.display = 'none';
  toneSelect.style.display = 'block';
  replyModeBtn.classList.remove('active');
  draftModeBtn.classList.add('active');
  summaryModeBtn.classList.remove('active');
});

summaryModeBtn.addEventListener('click', () => {
  currentMode = 'summary';
  replyMode.style.display = 'none';
  draftMode.style.display = 'none';
  summaryMode.style.display = 'block';
  summaryOptions.style.display = 'block';
  toneSelect.style.display = 'none';
  replyModeBtn.classList.remove('active');
  draftModeBtn.classList.remove('active');
  summaryModeBtn.classList.add('active');
});

// Generate Click Handler
generateBtn.addEventListener('click', async () => {
  let context;
  if (currentMode === 'reply') {
    context = contextInput.value.trim();
  } else if (currentMode === 'draft') {
    context = draftInput.value.trim();
  } else {
    context = summaryInput.value.trim();
  }
  
  if (!context) {
    showError(`Please provide ${currentMode === 'reply' ? 'the email content' : currentMode === 'draft' ? 'a description' : 'an email'} to ${currentMode === 'reply' ? 'generate a reply' : currentMode === 'draft' ? 'draft an email' : 'summarize'}.`);
    return;
  }

  showLoading(true);
  clearResult();

  try {
    let response;
    if (currentMode === 'reply') {
      response = await generateReply(context, toneSelect.value);
    } else if (currentMode === 'draft') {
      response = await generateNewEmail(context, toneSelect.value);
    } else {
      response = await summarizeEmail(context, summaryTypeSelect.value);
    }
    showResult(response);
    copyBtn.disabled = false;
  } catch (error) {
    console.error('Error:', error);
    showError(`Error generating ${currentMode === 'reply' ? 'reply' : currentMode === 'draft' ? 'email' : 'summary'}. Please try again.`);
    copyBtn.disabled = true;
  } finally {
    showLoading(false);
  }
});

// Copy to Clipboard Click Handler
copyBtn.addEventListener('click', async () => {
  if (!resultDiv.innerText.trim()) return;
  
  try {
    await navigator.clipboard.writeText(resultDiv.innerText);
    showCopySuccess();
  } catch (err) {
    console.error('Failed to copy: ', err);
    showError('Failed to copy to clipboard. Please try again.');
  }
});

// Helper Functions
function showLoading(show) {
  loadingDiv.style.display = show ? 'block' : 'none';
  generateBtn.disabled = show;
}

function clearResult() {
  resultDiv.innerText = '';
  resultDiv.style.color = 'inherit';
  resultDiv.style.borderColor = '#ddd';
}

function showResult(text) {
  resultDiv.innerText = text;
  resultDiv.style.borderColor = '#3498db';
}

function showError(message) {
  resultDiv.innerText = message;
  resultDiv.style.color = '#e74c3c';
  resultDiv.style.borderColor = '#e74c3c';
}

function showCopySuccess() {
  const originalText = copyBtn.textContent;
  copyBtn.textContent = '✓ Copied!';
  copyBtn.style.backgroundColor = '#27ae60';
  
  setTimeout(() => {
    copyBtn.textContent = originalText;
    copyBtn.style.backgroundColor = '#2ecc71';
  }, 2000);
}

function cleanAIResponse(text) {
  // Remove any text before the first line that looks like an email start
  if (text.includes('Subject:')) {
    text = text.substring(text.indexOf('Subject:'));
  }
  
  // Remove common AI response patterns
  const unwantedPatterns = [
    /^.*Here (is|are).*?\n\n/im,
    /^.*I('d| would).*?\n\n/im,
    /^.*(hope|let me know).*?$/im,
    /^.*(generated|created).*?\n\n/im,
    /^.*(below|following).*?\n\n/im
  ];
  
  unwantedPatterns.forEach(pattern => {
    text = text.replace(pattern, '');
  });
  
  // Trim any remaining whitespace
  return text.trim();
}

// Cohere API Integration - Reply Generation
async function generateReply(context, tone) {
  const apiKey = '';
  
  const prompt = `You are an email assistant helping craft responses. The original email is:
  
  ${context}
  
  Generate a ${tone} reply to this email. Follow these rules STRICTLY:
  1. Provide ONLY the email reply content, nothing else
  2. Do not include any introductory text like "Here's a reply"
  3. Do not include any concluding text like "Let me know if this helps"
  4. The response should be immediately usable as an email
  5. Keep it professional but match the requested ${tone} tone
  6. The email should not have any personal lines from yourself asking or telling anything after or before the email
  7. DO NOT add any side note or PS or anything after the email has ended i.e. after the sender's name

  Email reply:`;

  const response = await fetch('https://api.cohere.ai/v1/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'Cohere-Version': '2022-12-06'
    },
    body: JSON.stringify({
      model: 'command',
      prompt: prompt,
      max_tokens: 300,
      temperature: 0.7,
      k: 0,
      stop_sequences: [],
      return_likelihoods: 'NONE'
    })
  });

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }

  const data = await response.json();
  return cleanAIResponse(data.generations[0].text.trim());
}

// Cohere API Integration - New Email Drafting
async function generateNewEmail(context, tone) {
  const apiKey = 'ENTER YOUR API KEY HERE';
  
  const prompt = `You are an email assistant drafting new emails. The user wants to write about:
  
  ${context}
  
  Generate a ${tone} email based on this description. Follow these rules STRICTLY:
  1. Start directly with "Subject: [email subject]" on the first line
  2. Follow with the email body after one blank line
  3. Provide ONLY the email content, nothing else
  4. Do not include any introductory or concluding text
  5. The response should be immediately usable as an email
  6. Keep it professional but match the requested ${tone} tone
  7. The email should not have any personal lines from yourself asking or telling anything after or before the email
  7. DO NOT add any side note or PS or anything after the email has ended i.e. after the sender's name


  Email content:`;

  const response = await fetch('https://api.cohere.ai/v1/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'Cohere-Version': '2022-12-06'
    },
    body: JSON.stringify({
      model: 'command',
      prompt: prompt,
      max_tokens: 400,
      temperature: 0.7,
      k: 0,
      stop_sequences: [],
      return_likelihoods: 'NONE'
    })
  });

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }

  const data = await response.json();
  return cleanAIResponse(data.generations[0].text.trim());
}

// Cohere API Integration - Email Summarization
async function summarizeEmail(context, summaryType) {
  const apiKey = 'G0zzb8DUYSJ4KjKy5xZE7WlXpI4IgpPACG7Pu12C';
  
  let formatInstruction = '';
  if (summaryType === 'concise') {
    formatInstruction = 'Provide a concise summary in bullet points format. Focus on the main points and key information.';
  } else if (summaryType === 'key_details') {
    formatInstruction = 'Extract only the most critical details like dates, deadlines, names, and specific requirements. List them clearly.';
  } else if (summaryType === 'action_items') {
    formatInstruction = 'List all action items, tasks, or requests mentioned in the email. Be specific about what needs to be done and any deadlines.';
  }
  
  const prompt = `You are an email assistant summarizing important information from emails. The email content is:
  
  ${context}
  
  ${formatInstruction} Follow these rules STRICTLY:
  1. Provide ONLY the summary content, nothing else
  2. Do not include any introductory text like "Here's the summary"
  3. Be concise but include all important details
  4. Organize the information clearly
  5. If there are deadlines or dates, highlight them
  6. The email should not have any personal lines from yourself asking or telling anything after or before the email
  7. DO NOT add any lines after summarizing, just give the summary only


  Summary:`;

  const response = await fetch('https://api.cohere.ai/v1/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'Cohere-Version': '2022-12-06'
    },
    body: JSON.stringify({
      model: 'command',
      prompt: prompt,
      max_tokens: 400,
      temperature: 0.5,
      k: 0,
      stop_sequences: [],
      return_likelihoods: 'NONE'
    })
  });

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }

  const data = await response.json();
  return cleanAIResponse(data.generations[0].text.trim());
}

// Get email content from page when popup opens in reply or summary mode
chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
  if (!tabs[0]?.id) return;
  
  chrome.tabs.sendMessage(tabs[0].id, {action: "getEmailContext"}, (response) => {
    if (chrome.runtime.lastError) {
      // Silently ignore connection errors
      return;
    }
    if (response?.text) {
      if (currentMode === 'reply') {
        contextInput.value = response.text;
      } else if (currentMode === 'summary') {
        summaryInput.value = response.text;
      }
    }
  });
});
