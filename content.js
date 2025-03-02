(function() {
    let originalOrder = [];
    let isModified = false;
  
    function initialize() {
      // Store the original order of posts
      const stories = Array.from(document.querySelectorAll('tr.athing'));
      originalOrder = stories.map(story => story.id);
    //   console.log("Initialized with", stories.length, "stories");
      
      // Log the available tables for debugging
      const tables = document.querySelectorAll('table');
    //   console.log("Found", tables.length, "tables on the page");
      tables.forEach((table, index) => {
      });
    }
  
    function getTableElement() {
      // The main content table in Hacker News is inside #hnmain
      const hnmain = document.getElementById('hnmain');
      if (!hnmain) {
        console.error("Could not find #hnmain element");
        return null;
      }
      
      // The posts are in a table inside #hnmain
      const tables = hnmain.querySelectorAll('table');
      if (tables.length < 2) {
        console.error("Could not find the posts table");
        return null;
      }
      
      // The second table contains the posts
    //   console.log("Found posts table:", tables[1]);
      return tables[1];
    }
  
    function getPostDetails() {
      const stories = Array.from(document.querySelectorAll('tr.athing.submission'));
    //   console.log(`Found ${stories.length} stories with class 'athing submission'`);
      
      if (stories.length === 0) {
        // Try with just 'athing' class as fallback
        const fallbackStories = Array.from(document.querySelectorAll('tr.athing'));
        if (fallbackStories.length > 0) {
          return processStories(fallbackStories);
        }
        return [];
      }
      
      return processStories(stories);
    }
  
    function processStories(stories) {
      const details = [];
      
      stories.forEach(story => {
        const id = story.id;
        const subtext = story.nextElementSibling;
        if (!subtext) {
        //   console.log(`No subtext found for story ${id}`);
          return;
        }
        
        // Get votes
        const scoreElement = subtext.querySelector('.score');
        let score = 0;
        if (scoreElement) {
          const scoreText = scoreElement.textContent;
          const scoreMatch = scoreText.match(/\d+/);
          if (scoreMatch) {
            score = parseInt(scoreMatch[0], 10);
          }
        }
        
        // Get comments
        const links = Array.from(subtext.querySelectorAll('a'));
        let commentCount = 0;
        for (const link of links) {
          if (link.textContent.includes('comment') || link.textContent.includes('discuss')) {
            const commentText = link.textContent;
            const match = commentText.match(/\d+/);
            if (match) {
              commentCount = parseInt(match[0], 10);
            }
            break;
          }
        }
        
        
        details.push({
          id,
          story,
          subtext,
          score,
          commentCount
        });
      });
      
      return details;
    }
  
    function sortByVotes() {
      if (!isModified) {
        initialize();
        isModified = true;
      }
      
      const details = getPostDetails();
      
      // Sort by score (highest first)
      details.sort((a, b) => b.score - a.score);
      reorderPosts(details);
    }
  
    function sortByComments() {
      if (!isModified) {
        initialize();
        isModified = true;
      }
      
      const details = getPostDetails();
      
      // Sort by comment count (highest first)
      details.sort((a, b) => b.commentCount - a.commentCount);
      reorderPosts(details);
    }
  
    function reorderPosts(details) {
      const table = getTableElement();
      if (!table) {
        console.error("Could not find table element");
        return;
      }
      
      // Create a new document fragment to build the new order
      const fragment = document.createDocumentFragment();
      
      // Add posts in the new order
      details.forEach((item, index) => {
        // Clone the nodes to avoid issues with removing them
        const storyClone = item.story.cloneNode(true);
        const subtextClone = item.subtext.cloneNode(true);
        
        fragment.appendChild(storyClone);
        fragment.appendChild(subtextClone);
        
        // Add spacer between posts (except after the last one)
        if (index < details.length - 1) {
          const spacer = document.createElement('tr');
          spacer.className = 'spacer';
          spacer.style.height = '5px';
          fragment.appendChild(spacer);
        }
      });
      
      // Clear the table
      while (table.firstChild) {
        table.removeChild(table.firstChild);
      }
      
      // Add the new content
      table.appendChild(fragment);
    }
  
    function resetToDefault() {
      if (!isModified) return;
      
      const table = getTableElement();
      if (!table) {
        console.error("Could not find table element");
        return;
      }
      
      // Clear the table
      while (table.firstChild) {
        table.removeChild(table.firstChild);
      }
      
      // Get the posts in the original order
      const currentPosts = Array.from(document.querySelectorAll('tr.athing'));
      const subtexts = [];
      
      // Store the current posts and their subtexts
      currentPosts.forEach(post => {
        subtexts.push(post.nextElementSibling);
      });
      
      const postMap = {};
      currentPosts.forEach((post, index) => {
        postMap[post.id] = {
          post: post.cloneNode(true),
          subtext: subtexts[index] ? subtexts[index].cloneNode(true) : null
        };
      });
      
      // Create a fragment to build the original order
      const fragment = document.createDocumentFragment();
      
      // Restore the original order
      originalOrder.forEach((id, index) => {
        if (postMap[id] && postMap[id].post && postMap[id].subtext) {
          fragment.appendChild(postMap[id].post);
          fragment.appendChild(postMap[id].subtext);
          
          // Add spacer between posts (except after the last one)
          if (index < originalOrder.length - 1) {
            const spacer = document.createElement('tr');
            spacer.className = 'spacer';
            spacer.style.height = '5px';
            fragment.appendChild(spacer);
          }
        }
      });
      
      // Add the content back to the table
      table.appendChild(fragment);
      
      isModified = false;
    }
  
    // Listen for messages from the popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    //   console.log("Message received:", message); // Add logging to debug
      
      if (message.action === 'sortByVotes') {
        sortByVotes();
        sendResponse({status: "Sorted by votes"});
      } else if (message.action === 'sortByComments') {
        sortByComments();
        sendResponse({status: "Sorted by comments"});
      } else if (message.action === 'reset') {
        resetToDefault();
        sendResponse({status: "Reset to default"});
      }
      
      return true; // Keep the message channel open for sendResponse
    });
  
    // Initialize on page load
    window.addEventListener('load', () => {
      initialize();
      
      // Auto-sort by votes after a short delay to ensure the page is fully loaded
      setTimeout(() => {
        sortByVotes();
      }, 500);
    });
  })();