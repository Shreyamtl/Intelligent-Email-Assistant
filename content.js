// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getEmailContext") {
    const emailText = getEmailTextFromPage();
    sendResponse({text: emailText});
  }
  return true;
});

function getEmailTextFromPage() {
  try {
    // Gmail
    if (window.location.host === 'mail.google.com') {
      return document.querySelector('.ii.gt')?.innerText || 
             document.querySelector('.a3s.aiL')?.innerText || '';
    }
    // Outlook
    else if (window.location.host.includes('outlook.')) {
      return document.querySelector('[role="textbox"]')?.innerText || '';
    }
    return '';
  } catch (error) {
    console.error('Error getting email content:', error);
    return '';
  }
}

// Add toolbar button to email clients
function addToolbarButton() {
  // Gmail
  if (window.location.host === 'mail.google.com') {
    const toolbar = document.querySelector('.G-Ni.J-J5-Ji') || 
                   document.querySelector('.aDh');
    if (toolbar && !document.getElementById('cohere-assistant-btn')) {
      const button = document.createElement('div');
      button.id = 'cohere-assistant-btn';
      button.className = 'T-I J-J5-Ji T-I-Js-Gs mA T-I-ax7 L3';
      button.setAttribute('role', 'button');
      button.innerHTML = `
        <div class="asa">
          <div class="J-J5-Ji J-JN-M-I J-J5-JiMj Rm Rm-ayJ aTp-aUr-JN">
            <span class="aBj" style="color:#5f6368">
              <span class="aKX">AI Assistant</span>
            </span>
          </div>
        </div>
      `;
      button.addEventListener('click', () => {
        const emailText = getEmailTextFromPage();
        chrome.runtime.sendMessage({
          action: "openPopupWithText", 
          text: emailText
        });
      });
      toolbar.prepend(button);
    }
  }
}

// Initial button injection
setTimeout(addToolbarButton, 3000);

// Watch for DOM changes for SPA navigation
const observer = new MutationObserver(addToolbarButton);
observer.observe(document.body, {
  childList: true,
  subtree: true,
  attributes: false,
  characterData: false
});