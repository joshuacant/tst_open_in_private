"use strict";
const kTST_ID = 'treestyletab@piro.sakura.ne.jp';
const ext_ID = 'tst-open_in_private@dontpokebadgers.com';
var closeExistingTab = true;
var removeFromHistory = false;

async function registerToTST() {
  var success = await browser.runtime.sendMessage(kTST_ID, {
    type: 'register-self',
    name: ext_ID,
    //style: '.tab {color: red;}'
  });
  if (success) {
    //console.log(ext_ID + " successfully registered");
    clearTimeout(registrationTimer);
    await addPrivateMenuItem();
  }
}

async function loadOptions(options) {
  if (Object.keys(options).length == 0) {
    //console.log("no options");
    createOptions();
  }
  else {
    closeExistingTab = options.closeExistingTab;
    //console.log(options);
  }
}

async function reloadOptions(options) {
  closeExistingTab = options.closeExistingTab.newValue;
  //console.log(options);
}

async function createOptions() {
  browser.storage.local.set({
    closeExistingTab: closeExistingTab
  });
  //console.log("creating default options");
  var reloadingOptions = browser.storage.local.get();
  reloadingOptions.then(loadOptions);
}

async function addPrivateMenuItem() {
  await browser.runtime.sendMessage(kTST_ID, {
    type: 'fake-contextMenu-remove-all'
  });
  var id = 1;
  var type = 'normal';
  var title = 'Open Tab in Private Window';
  var parentId = null;
  let params = {id, type, title, contexts: ['tab']};
  await browser.runtime.sendMessage(kTST_ID, {
    type: 'fake-contextMenu-create',
    params
  });
}

function toPrivateWindow(tab) {
  if (!tab.url.startsWith('http')) { return; }
  browser.windows.create({"url":tab.url, "incognito":true});
  if (closeExistingTab) {
    browser.tabs.remove(tab.id);
  }
  if (removeFromHistory) {
    browser.history.deleteUrl({"url": tab.url});
  }
}

var registrationTimer = setInterval(registerToTST, 2000);
var initalizingOptions = browser.storage.local.get();
initalizingOptions.then(loadOptions);
browser.storage.onChanged.addListener(reloadOptions);
browser.runtime.onMessageExternal.addListener((aMessage, aSender) => {
  switch (aSender.id) {
    case kTST_ID:
      //console.log(aMessage.type)
      switch (aMessage.type) {
        case 'ready':
          //console.log("re-registering");
          registerToTST();
          break;
        case 'fake-contextMenu-click':
          //console.log("menu item clicked " + aMessage.info.menuItemId);
          toPrivateWindow(aMessage.tab);
          break;
      }
      break;
  }
});

//var success = await browser.runtime.sendMessage(kTST_ID, {
//  type: 'unregister-self'
//});
