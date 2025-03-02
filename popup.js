document.getElementById('sortByVotes').addEventListener('click', () => {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {action: 'sortByVotes'});
    });
  });
  
  document.getElementById('sortByComments').addEventListener('click', () => {
    console.log("Sort by Comments button clicked");
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (tabs[0]) {
        console.log("Sending message to tab:", tabs[0].id);
        chrome.tabs.sendMessage(tabs[0].id, {action: 'sortByComments'}, (response) => {
          console.log("Response received:", response);
          if (chrome.runtime.lastError) {
            console.error("Error:", chrome.runtime.lastError);
          }
        });
      } else {
        console.error("No active tab found");
      }
    });
  });
  
  document.getElementById('reset').addEventListener('click', () => {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {action: 'reset'});
    });
  });