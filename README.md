# 🎯 Personalized YouTube Notifier - Chrome Extension

Get smart, keyword-based YouTube video alerts directly in your browser!  
No more missing the videos **you actually care about** 🎬✨

![Screenshot](./screenshot.png)

---

## 🚀 Features

✅ **Smart Notifications**  
Get real-time Chrome notifications for new uploads from your favorite YouTube channels that match your custom keywords.

✅ **Recent Uploads in Popup**  
Open the extension to browse and **play** the latest videos from selected channels — all inside an iframe.

✅ **Keyword Filter Toggle**  
Switch between seeing **All Videos** and only those that match your personalized keywords.

✅ **Easy Channel Management**  
Add or remove channels by simply pasting the YouTube Channel ID (not username or handle).

✅ **Persistent Settings**  
All your preferences (channels, keywords, toggles) are stored using `chrome.storage.local`.

✅ **Modern UI**  
Clean and responsive popup with intuitive controls for keyword management, notifications, and content view.

---

## 🛠️ Built With

- **Manifest V3** - Chrome Extension API
- **JavaScript** - For background logic & DOM manipulation
- **HTML/CSS** - Styled popup with interactive UI
- **YouTube RSS Feed** - For fetching real-time uploads (`https://www.youtube.com/feeds/videos.xml?channel_id=...`)
- **Notifications API** - For real-time system alerts
- **Alarms API** - To check for new uploads every 15 minutes
- **Chrome Storage API** - To persist user data

---

## 🧠 How It Works

1. You add your favorite YouTube **channel IDs**.
2. Optionally, enter **keywords** like `trailer`, `review`, `tech`, etc.
3. The extension fetches each channel's RSS feed every 15 minutes and checks for new videos.
4. If a video matches any keyword (or all if none are set), you'll get a Chrome notification.
5. When you open the extension popup:
   - You can **view thumbnails**, **play videos**, and **filter** results.
   - Easily toggle between **All Videos** and **Keyword Matches Only**.

---

## 📦 Installation

1. Clone or [download this repo](https://github.com/your-username/yt-custom-notifier).
2. Open **Chrome** and go to `chrome://extensions/`.
3. Enable **Developer Mode** (top right).
4. Click **Load unpacked** and select the project folder.
5. Done! Click the extension icon and start adding channels!

---

## 💡 Tip: Finding YouTube Channel IDs

Use tools like [commentpicker.com/youtube-channel-id](https://commentpicker.com/youtube-channel-id.php) or right-click on a channel and choose `Copy Link`, then extract the ID (it starts with `UC...`).

---

## 📸 UI Preview

| Add Channels & Keywords | Filter by Matches |
|-------------------------|-------------------|
| ![UI](./screenshot.png) | ![UI](./screenshot.png) |

---

## 🧪 To-Do / Upcoming Ideas

- [ ] Dark mode toggle
- [ ] Pin favorite channels
- [ ] "Mark as watched" option
- [ ] Desktop widget for quick view
- [ ] Optional sound alert for matches

---

## 🤝 Contributing

Pull requests and suggestions are welcome!  
If you have a cool idea or want to improve UX, feel free to fork and submit a PR.

---

## 📄 License

MIT © 2025 [Malixamran]
