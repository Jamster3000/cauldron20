setTimeout(function () {
    chrome.tabs.onActivated.addListener(function(activeInfo) {
        chrome.tabs.get(activeInfo.tabId, function(tab) {
            var cauldronURLPattern = /^https:\/\/www\.cauldron-vtt\.net/;
    
            if (tab.url && cauldronURLPattern.test(tab.url)) {
                console.log("Cauldron Tab URL:", tab.url);
		chrome.storage.local.set({"url": tab.url});
            }
        });
    });
},0);