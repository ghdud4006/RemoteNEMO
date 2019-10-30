# How to use?

> Please make sure you've [installed](https://github.com/muaz-khan/RTCMultiConnection/tree/master/docs/installation-guide.md) RTCMultiConnection.

* [Getting Started guide for RTCMultiConnection](https://github.com/muaz-khan/RTCMultiConnection/tree/master/docs/getting-started.md)

```html
<!-- or -->
<script src="/dist/RTCMultiConnection.min.js"></script>

<!-- Heroku Link -->
<script src="https://rtcmulticonnection.herokuapp.com/dist/RTCMultiConnection.min.js"></script>

<!-- or specific version -->
<script src="https://github.com/muaz-khan/RTCMultiConnection/releases/download/3.4.7/RTCMultiConnection.js"></script>

<!-- or CDN -->
<script src="https://rawgit.com/muaz-khan/RTCMultiConnection/master/dist/RTCMultiConnection.min.js"></script>

<!-- another CDN -->
<script src="https://cdn.jsdelivr.net/npm/rtcmulticonnection@latest/dist/RTCMultiConnection.min.js"></script>

<!-- another CDN -->
<script src="https://unpkg.com/rtcmulticonnection@latest/dist/RTCMultiConnection.min.js"></script>

<!-- bundle CDN -->
<script src="https://bundle.run/rtcmulticonnection@latest"></script>
```

If you're sharing files, you also need to link:

```html
<script src="https://cdn.webrtc-experiment.com:443/FileBufferReader.js"></script>
```

> You can link multiple files from `dev` directory. Order doesn't matters.

Use socket.io:

```html
<script src="https://rtcmulticonnection.herokuapp.com/socket.io/socket.io.js"></script>
```

## Set different socket URL

By default, RTCMultiConnection uses default port of your domain.

You can use custom ports either via `config.json` file:

```json
{
  "socketURL": "https://yourdomain.com:9001/",
  "socketMessageEvent": "RTCMultiConnection-Message"
}
```

Or simply override in your HTML code:

```javascript
connection.socketURL = 'https://yourdomain.com:9001/';

// if your server is already having "message" event
// then you can use something else, unique.
connection.socketMessageEvent = 'unique-message';
```

**For testing purpose**, you can use this as well:

```json
{
  "socketURL": "https://rtcmulticonnection.herokuapp.com:443/",
  "socketMessageEvent": "RTCMultiConnection-Message"
}
```

Or:

```javascript
connection.socketURL = 'https://rtcmulticonnection.herokuapp.com:443/';
```

Here is a demo explaining how to use above `socketURL`:

* https://jsfiddle.net/zd9Lsdfk/50/

## Integrate in your own applications?

* https://github.com/muaz-khan/RTCMultiConnection-Server/wiki/Integrate-inside-nodejs-applications

# Other Documents

1. [Installation Guide](https://github.com/muaz-khan/RTCMultiConnection/tree/master/docs/installation-guide.md)
2. [How to Use?](https://github.com/muaz-khan/RTCMultiConnection/tree/master/docs/how-to-use.md)
3. [API Reference](https://github.com/muaz-khan/RTCMultiConnection/tree/master/docs/api.md)
4. [Upgrade from v2 to v3](https://github.com/muaz-khan/RTCMultiConnection/tree/master/docs/upgrade.md)
5. [How to write iOS/Android applications?](https://github.com/muaz-khan/RTCMultiConnection/tree/master/docs/ios-android.md)
6. [Tips & Tricks](https://github.com/muaz-khan/RTCMultiConnection/blob/master/docs/tips-tricks.md)

## License

[RTCMultiConnection](https://github.com/muaz-khan/RTCMultiConnection) is released under [MIT licence](https://github.com/muaz-khan/RTCMultiConnection/blob/master/LICENSE.md) . Copyright (c) [Muaz Khan](http://www.MuazKhan.com/).
