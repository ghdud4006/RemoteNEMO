# [Firefox Extensions](https://github.com/muaz-khan/Firefox-Extensions)

> Enable screen capturing in Firefox for both localhost/127.0.0.1 and `https://www.webrtc-experiment.com` pages.

## Install from Firefox Addons Store

* [https://addons.mozilla.org/en-US/firefox/addon/enable-screen-capturing/](https://addons.mozilla.org/en-US/firefox/addon/enable-screen-capturing/)

## How to reuse same addon for your own domains?

Means that, you **don't need to publish your own addon**, you can reuse above link in your own domains/applications!

You should copy/paste following code in your own webpage/domain (HTML/PHP/Python/etc.):

```javascript
// request addon to enable screen capturing for your domains
window.postMessage({
	enableScreenCapturing: true,
	domains: ["www.yourdomain.com", "yourdomain.com"]
}, "*");

// watch addon's response
// addon will return "enabledScreenCapturing=true" for success
// else "enabledScreenCapturing=false" for failure (i.e. user rejection)
window.addEventListener("message", function(event) {
	var addonMessage = event.data;

	if(!addonMessage || typeof addonMessage.enabledScreenCapturing === 'undefined') return;

    if(addonMessage.enabledScreenCapturing === true) {
    	// addonMessage.domains === [array-of-your-domains]
    	alert(JSON.stringify(addonMessage.domains) + ' are enabled for screen capturing.');
    }
    else {
    	// reason === 'user-rejected'
    	alert(addonMessage.reason);
    }
}, false);
```

## Simplest Demo

Try this demo after installing above addon:

* [https://www.webrtc-experiment.com/getScreenId/](https://www.webrtc-experiment.com/getScreenId/)

## Wanna Deploy it Yourself?

1. Open [`index.js`](https://github.com/muaz-khan/Firefox-Extensions/blob/master/enable-screen-capturing/index.js)
2. Go to line 7
3. Replace `arrayOfMyOwnDomains` array with your own list of domains

```javascript
// replace your own domains with below array
var arrayOfMyOwnDomains = ['webrtc-experiment.com', 'www.webrtc-experiment.com', 'localhost', '127.0.0.1'];
```

## How to Deploy?

1) Signup here: 

* https://addons.mozilla.org/en-US/firefox/users/register

2) Use unique-addon-name here: 

* https://github.com/muaz-khan/Firefox-Extensions/blob/master/enable-screen-capturing/package.json#L3 

3) Add your own domains here: 

* https://github.com/muaz-khan/Firefox-Extensions/blob/master/enable-screen-capturing/index.js#L7

4) Make XPI of the directory.

```
[sudo] npm install jpm --global

jpm run -b nightly 		# test in Firefox Nightly without making the XPI

jpm xpi					# it will create xpi file
```

5) Submit the XPI here: 

* https://addons.mozilla.org/en-US/developers/addon/submit/1

Follow all steps. Read them carefully. This is hard/tough step to follow. Select valid browsers. E.g. Firefox 38 to Firefox 45. And submit your addon for "review".

It will take 2-3 hours for a Mozilla guy to review your addon. Then it will be available to public.

## License

[Firefox-Extensions](https://github.com/muaz-khan/Firefox-Extensions) are released under [MIT licence](https://www.webrtc-experiment.com/licence/) . Copyright (c) [Muaz Khan](http://www.MuazKhan.com/).
