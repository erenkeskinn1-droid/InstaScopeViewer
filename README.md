# InstaScopeViewer - Chrome Extension

InstaScopeViewer is a Google Chrome extension that allows users to quickly and conveniently analyze Instagram profiles and their details directly through the browser.

# Features
* Scraping and parsing public data from target profiles.
* Fast and user-friendly interface (Popup UI).
* Silent data extraction in the background using DOM manipulation.

# Requirements & Important Notes
⚠️ **Important Note:** In order for the extension to successfully fetch follower and following data, **you must have an active Instagram session (be logged in) in your browser.** Otherwise, due to API and security restrictions enforced by Meta, this data cannot be displayed to anonymous users.

# Technologies Used
* JavaScript (ES6+)
* HTML5 & CSS3
* Chrome Extension API (Manifest V3)

# Installation (Developer Mode)
1. Download this repository to your local machine (Download as ZIP or via `git clone`).
2. Open the extensions page in Google Chrome by navigating to `chrome://extensions/`.
3. Enable **"Developer mode"** using the toggle in the top right corner.
4. Click the **"Load unpacked"** button in the top left corner and select the downloaded project folder.
5. The extension will now be loaded and ready to use in your browser!
