// background.js
// This script runs in the background and listens for browser events.

// Example: Listen for when the extension is installed
chrome.runtime.onInstalled.addListener(() => {
  console.log('Neurivox | OS extension installed.');
});

// Example: Listen for when the extension icon is clicked (if no popup is defined, or for specific actions)
// Note: If "action.default_popup" is set in manifest.json, this listener is generally not triggered
// when the icon is clicked; instead, the popup HTML is opened.
// However, it can still be used for other types of actions.
chrome.action.onClicked.addListener((tab) => {
  console.log('Neurivox | OS icon clicked!', tab);
  // Example: If you wanted to open the full app page in a new tab instead of the popup
  // chrome.tabs.create({ url: chrome.runtime.getURL("index.html") });
});

// You can add more listeners here for various browser events:
// chrome.tabs.onUpdated.addListener(...)
// chrome.downloads.onCreated.addListener(...)
// etc.