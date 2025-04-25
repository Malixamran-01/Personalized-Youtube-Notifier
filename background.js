const FEED_URL = 'https://www.youtube.com/feeds/videos.xml?channel_id=';

async function fetchFeed(channelId) {
  const res = await fetch(FEED_URL + channelId);
  const xml = await res.text();

  const entries = [];
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match;

  while ((match = entryRegex.exec(xml)) !== null) {
    const entryXml = match[1];

    const titleMatch = entryXml.match(/<title>(.*?)<\/title>/);
    const videoIdMatch = entryXml.match(/<yt:videoId>(.*?)<\/yt:videoId>/);

    if (titleMatch && videoIdMatch) {
      entries.push({
        title: titleMatch[1],
        videoId: videoIdMatch[1]
      });
    }
  }

  return entries;
}

// Core logic: check for updates
async function checkForUpdates() {
  const {
    channelIds = [],
    keywords = [],
    notified = {},
    notificationsEnabled = true
  } = await chrome.storage.local.get(['channelIds', 'keywords', 'notified', 'notificationsEnabled']);

  if (!notificationsEnabled || channelIds.length === 0) {
    chrome.action.setBadgeText({ text: '' });
    return;
  }

  let hasNewMatches = false;
  let matchCount = 0;

  for (const channelId of channelIds) {
    try {
      const entries = await fetchFeed(channelId);

      for (const { title, videoId } of entries) {
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

        const isMatch = keywords.length === 0 || keywords.some(keyword =>
          title.toLowerCase().includes(keyword.toLowerCase())
        );

        if (isMatch && !notified[videoId]) {
          hasNewMatches = true;
          matchCount++;

          if (notificationsEnabled) {
            chrome.notifications.create(videoId, {
              type: 'basic',
              iconUrl: 'https://www.youtube.com/s/desktop/e0e5081a/img/favicon_144x144.png',
              title: '🎯 New Video Match!',
              message: title,
              priority: 2,
              buttons: [
                { title: 'Watch Now' }
              ]
            });

            // Handle notification click
            chrome.notifications.onClicked.addListener((notificationId) => {
              if (notificationId === videoId) {
                chrome.tabs.create({ url: videoUrl });
              }
            });

            // Handle button click
            chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
              if (notificationId === videoId && buttonIndex === 0) {
                chrome.tabs.create({ url: videoUrl });
              }
            });
          }

          notified[videoId] = true;
        }
      }
    } catch (err) {
      console.error(`❌ Failed to fetch feed for ${channelId}:`, err);
    }
  }

  // Update badge
  if (hasNewMatches) {
    chrome.action.setBadgeText({ text: matchCount.toString() });
    chrome.action.setBadgeBackgroundColor({ color: '#ea4335' });
  } else {
    chrome.action.setBadgeText({ text: '' });
  }

  await chrome.storage.local.set({ notified });
}

// 🕒 Alarm to run every 15 minutes
chrome.alarms.create('checkYouTube', { periodInMinutes: 15 });

// When triggered by alarm
chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === 'checkYouTube') checkForUpdates();
});

// Also trigger when extension loads
chrome.runtime.onStartup.addListener(checkForUpdates);
chrome.runtime.onInstalled.addListener(checkForUpdates);

// Listen for storage changes to update badge
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local') {
    if (changes.keywords || changes.notificationsEnabled) {
      checkForUpdates();
    }
  }
});
