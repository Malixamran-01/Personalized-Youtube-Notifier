document.addEventListener('DOMContentLoaded', () => {
  const channelInput = document.getElementById('channelInput');
  const addChannelBtn = document.getElementById('addChannelBtn');
  const uploadsContainer = document.getElementById('uploadsContainer');
  const message = document.getElementById('message');
  const videoPlayer = document.getElementById('videoPlayer');
  const playerFrame = document.getElementById('playerFrame');
  const closePlayer = document.getElementById('closePlayer');
  const keywordInput = document.getElementById('keywordInput');
  const addKeywordBtn = document.getElementById('addKeywordBtn');
  const keywordsList = document.getElementById('keywordsList');
  const notificationToggle = document.getElementById('notificationToggle');

  // Load saved keywords and notification preference
  loadKeywords();
  loadNotificationPreference();

  // Load on popup open
  loadAndDisplayChannels();

  // Theme toggle functionality
  const themeToggle = document.getElementById('themeToggle');
  const body = document.body;

  // Load saved theme preference
  chrome.storage.local.get(['theme'], (result) => {
    if (result.theme === 'dark') {
      body.setAttribute('data-theme', 'dark');
    }
  });

  themeToggle.addEventListener('click', () => {
    const isDark = body.getAttribute('data-theme') === 'dark';
    if (isDark) {
      body.removeAttribute('data-theme');
      chrome.storage.local.set({ theme: 'light' });
    } else {
      body.setAttribute('data-theme', 'dark');
      chrome.storage.local.set({ theme: 'dark' });
    }
  });

  // Channel list management
  const channelsContainer = document.querySelector('.channels-container');

  async function updateChannelsList() {
    const { channelIds = [] } = await chrome.storage.local.get(['channelIds']);
    channelsContainer.innerHTML = '';

    if (channelIds.length === 0) {
      channelsContainer.innerHTML = '<div class="empty-state">No channels added yet</div>';
      return;
    }

    const channelPromises = channelIds.map(async (channelId) => {
      try {
        const res = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`);
        if (!res.ok) throw new Error('Failed to fetch channel info');
        
        const text = await res.text();
        const parser = new DOMParser();
        const xml = parser.parseFromString(text, 'text/xml');
        const channelTitle = xml.querySelector('title')?.textContent || 'Unknown Channel';

        return { channelId, channelTitle };
      } catch (err) {
        return { channelId, channelTitle: 'Unknown Channel' };
      }
    });

    const channels = await Promise.all(channelPromises);
    
    channels.forEach(({ channelId, channelTitle }) => {
      const channelItem = document.createElement('div');
      channelItem.className = 'channel-item';
      channelItem.innerHTML = `
        <div class="channel-info">
          <span class="channel-name" title="${channelTitle}">${channelTitle}</span>
        </div>
        <button class="remove-channel-btn" data-channel-id="${channelId}">Remove</button>
      `;

      const removeBtn = channelItem.querySelector('.remove-channel-btn');
      removeBtn.addEventListener('click', async () => {
        if (confirm(`Are you sure you want to remove ${channelTitle}?`)) {
          await removeChannel(channelId);
          showMessage(`Channel ${channelTitle} removed successfully!`, 'success');
          updateChannelsList();
          loadAndDisplayChannels();
        }
      });

      channelsContainer.appendChild(channelItem);
    });
  }

  // Update the addChannelBtn click handler to refresh the channels list
  addChannelBtn.addEventListener('click', async () => {
    const channelId = channelInput.value.trim();
    if (!channelId) {
      showMessage('Please enter a channel ID', 'error');
      return;
    }

    // Validate channel ID format
    if (!/^UC[\w-]{22}$/.test(channelId)) {
      showMessage('Invalid channel ID format. Channel IDs start with UC and are 24 characters long.', 'error');
      return;
    }

    showMessage('Adding channel...', 'loading');
    addChannelBtn.disabled = true;

    try {
      const { channelIds = [] } = await chrome.storage.local.get(['channelIds']);
      if (channelIds.includes(channelId)) {
        showMessage('Channel already added.', 'error');
        return;
      }

      // Verify channel exists by fetching feed
      const res = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`);
      if (!res.ok) {
        throw new Error('Channel not found');
      }

      channelIds.push(channelId);
      await chrome.storage.local.set({ channelIds });
      channelInput.value = '';
      showMessage('Channel added successfully!', 'success');
      await updateChannelsList();
    } catch (err) {
      showMessage(err.message === 'Channel not found' ? 'Channel not found. Please check the ID.' : 'Error adding channel. Please try again.', 'error');
    } finally {
      addChannelBtn.disabled = false;
    }
  });

  // Add new keyword
  addKeywordBtn.addEventListener('click', async () => {
    const keyword = keywordInput.value.trim().toLowerCase();
    if (!keyword) {
      showMessage('Please enter a keyword', 'error');
      return;
    }

    const { keywords = [] } = await chrome.storage.local.get(['keywords']);
    if (keywords.includes(keyword)) {
      showMessage('Keyword already added', 'error');
      return;
    }

    keywords.push(keyword);
    await chrome.storage.local.set({ keywords });
    keywordInput.value = '';
    showMessage('Keyword added successfully!', 'success');
    loadKeywords();
  });

  // Close video player
  closePlayer.addEventListener('click', () => {
    videoPlayer.classList.remove('active');
    playerFrame.src = '';
  });

  // Add filter toggle functionality
  const filterOptions = document.querySelectorAll('.filter-option');
  let currentFilter = 'all';

  filterOptions.forEach(option => {
    option.addEventListener('click', () => {
      filterOptions.forEach(opt => opt.classList.remove('active'));
      option.classList.add('active');
      currentFilter = option.dataset.filter;
      loadAndDisplayChannels();
    });
  });

  // Load and show all recent uploads
  async function loadAndDisplayChannels() {
    uploadsContainer.innerHTML = `
      <div class="loading">
        <div class="loading-spinner"></div>
        <span>Loading recent uploads...</span>
      </div>
    `;

    const { channelIds = [] } = await chrome.storage.local.get(['channelIds']);

    if (channelIds.length === 0) {
      uploadsContainer.innerHTML = `
        <div class="empty-state">
          No channels added yet. Add a channel to see recent uploads!
        </div>
      `;
      return;
    }

    const videosList = document.createElement('div');
    videosList.className = 'videos-list';

    const channelPromises = channelIds.map(async (channelId) => {
      try {
        const res = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`);
        if (!res.ok) throw new Error('Failed to fetch feed');
        
        const text = await res.text();
        const parser = new DOMParser();
        const xml = parser.parseFromString(text, 'text/xml');
        const entries = xml.querySelectorAll('entry');
        const channelTitle = xml.querySelector('title')?.textContent || 'Unknown Channel';

        if (entries.length === 0) {
          throw new Error('No videos found');
        }

        const videos = await Promise.all(
          Array.from(entries)
            .slice(0, 3)
            .map(entry => processVideo(entry, channelTitle, channelId))
        );

        return videos;
      } catch (err) {
        console.error(`Error fetching feed for ${channelId}:`, err);
        return [];
      }
    });

    try {
      const allVideos = (await Promise.all(channelPromises)).flat();
      
      // Filter videos based on current filter
      const filteredVideos = currentFilter === 'all' 
        ? allVideos 
        : allVideos.filter(video => video.matchesKeyword);

      // Sort by keyword matches first, then by channel
      filteredVideos.sort((a, b) => {
        if (a.matchesKeyword !== b.matchesKeyword) {
          return b.matchesKeyword - a.matchesKeyword;
        }
        return a.channelTitle.localeCompare(b.channelTitle);
      });

      if (filteredVideos.length === 0) {
        uploadsContainer.innerHTML = `
          <div class="empty-state">
            No videos found matching the current filter.
          </div>
        `;
        return;
      }

      filteredVideos.forEach(video => {
        videosList.appendChild(createVideoItem(video));
      });

      uploadsContainer.innerHTML = '';
      uploadsContainer.appendChild(videosList);
    } catch (err) {
      console.error('Error loading channels:', err);
      uploadsContainer.innerHTML = `
        <div class="error">
          ❌ Error loading channels. Please try refreshing the popup.
        </div>
      `;
    }
  }

  // Remove a channel
  async function removeChannel(channelId) {
    const { channelIds = [] } = await chrome.storage.local.get(['channelIds']);
    const updatedChannelIds = channelIds.filter(id => id !== channelId);
    await chrome.storage.local.set({ channelIds: updatedChannelIds });
    showMessage('Channel removed successfully!', 'success');
    await updateChannelsList();
    loadAndDisplayChannels();
  }

  // Load and display keywords
  async function loadKeywords() {
    const { keywords = [] } = await chrome.storage.local.get(['keywords']);
    keywordsList.innerHTML = '';
    
    keywords.forEach(keyword => {
      const keywordTag = document.createElement('div');
      keywordTag.className = 'keyword-tag';
      keywordTag.innerHTML = `
        ${keyword}
        <span class="remove-keyword">×</span>
      `;
      
      keywordTag.querySelector('.remove-keyword').addEventListener('click', async () => {
        const { keywords = [] } = await chrome.storage.local.get(['keywords']);
        const updated = keywords.filter(k => k !== keyword);
        await chrome.storage.local.set({ keywords: updated });
        loadKeywords();
      });
      
      keywordsList.appendChild(keywordTag);
    });
  }

  // Load notification preference
  async function loadNotificationPreference() {
    const { notificationsEnabled = true } = await chrome.storage.local.get(['notificationsEnabled']);
    notificationToggle.checked = notificationsEnabled;
  }

  // Save notification preference
  notificationToggle.addEventListener('change', async () => {
    await chrome.storage.local.set({ notificationsEnabled: notificationToggle.checked });
    showMessage(`Notifications ${notificationToggle.checked ? 'enabled' : 'disabled'}`, 'success');
  });

  // Update the video processing to check for keywords
  async function processVideo(entry, channelTitle, channelId) {
    const videoId = entry.getElementsByTagNameNS("http://www.youtube.com/xml/schemas/2015", "videoId")[0]?.textContent;
    const title = entry.querySelector('title')?.textContent || 'Untitled Video';
    const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
    
    // Check if video matches any keywords
    const { keywords = [], notificationsEnabled = true } = await chrome.storage.local.get(['keywords', 'notificationsEnabled']);
    const matchesKeyword = keywords.some(keyword => title.toLowerCase().includes(keyword));
    
    return {
      videoId,
      title,
      thumbnailUrl,
      matchesKeyword,
      channelTitle,
      channelId
    };
  }

  // Update the video display to show keyword matches
  function createVideoItem({ videoId, title, thumbnailUrl, matchesKeyword, channelTitle }) {
    const videoItem = document.createElement('div');
    videoItem.className = 'video-item';
    
    videoItem.innerHTML = `
      <div class="video-thumbnail">
        <img src="${thumbnailUrl}" alt="${title}">
        <div class="play-icon"></div>
        <div class="video-overlay">
          <div>
            <div class="video-title">${title}</div>
            <div class="video-meta">
              <span class="channel-name">${channelTitle}</span>
              ${matchesKeyword ? '<span class="keyword-badge">🔔 Keyword Match</span>' : ''}
            </div>
          </div>
        </div>
      </div>
    `;
    
    videoItem.addEventListener('click', () => {
      playerFrame.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
      videoPlayer.classList.add('active');
    });

    return videoItem;
  }

  // Helper function to show messages
  function showMessage(text, type = 'error') {
    message.textContent = text;
    message.className = type;
    if (type !== 'loading') {
      setTimeout(() => {
        message.textContent = '';
        message.className = '';
      }, 3000);
    }
  }

  // Initialize the channels list
  updateChannelsList();
});
