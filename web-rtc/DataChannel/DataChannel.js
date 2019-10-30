'use strict';

// Last time updated: 2017-07-29 4:31:53 PM UTC

// __________________
// DataChannel v1.0.0

// Open-Sourced: https://github.com/muaz-khan/DataChannel

// --------------------------------------------------
// Muaz Khan     - www.MuazKhan.com
// MIT License   - www.WebRTC-Experiment.com/licence
// --------------------------------------------------

(function() {

    window.DataChannel = function(channel, extras) {
        if (channel) {
            this.automatic = true;
        }

        this.channel = channel || location.href.replace(/\/|:|#|%|\.|\[|\]/g, '');

        extras = extras || {};

        var self = this;
        var dataConnector;
        var fileReceiver;
        var textReceiver;

        this.onmessage = function(message, userid) {
            console.debug(userid, 'sent message:', message);
        };

        this.channels = {};
        this.onopen = function(userid) {
            console.debug(userid, 'is connected with you.');
        };

        this.onclose = function(event) {
            console.error('data channel closed:', event);
        };

        this.onerror = function(event) {
            console.error('data channel error:', event);
        };

        // by default; received file will be auto-saved to disk
        this.autoSaveToDisk = true;
        this.onFileReceived = function(fileName) {
            console.debug('File <', fileName, '> received successfully.');
        };

        this.onFileSent = function(file) {
            console.debug('File <', file.name, '> sent successfully.');
        };

        this.onFileProgress = function(packets) {
            console.debug('<', packets.remaining, '> items remaining.');
        };

        function prepareInit(callback) {
            for (var extra in extras) {
                self[extra] = extras[extra];
            }
            self.direction = self.direction || 'many-to-many';
            if (self.userid) {
                window.userid = self.userid;
            }

            if (!self.openSignalingChannel) {
                if (typeof self.transmitRoomOnce === 'undefined') {
                    self.transmitRoomOnce = true;
                }

                // socket.io over node.js: https://github.com/muaz-khan/WebRTC-Experiment/blob/master/Signaling.md
                self.openSignalingChannel = function(config) {
                    config = config || {};

                    channel = config.channel || self.channel || 'default-channel';
                    var socket = new window.Firebase('https://' + (self.firebase || 'webrtc-experiment') + '.firebaseIO.com/' + channel);
                    socket.channel = channel;

                    socket.on('child_added', function(data) {
                        config.onmessage(data.val());
                    });

                    socket.send = function(data) {
                        this.push(data);
                    };

                    if (!self.socket) {
                        self.socket = socket;
                    }

                    if (channel !== self.channel || (self.isInitiator && channel === self.channel)) {
                        socket.onDisconnect().remove();
                    }

                    if (config.onopen) {
                        setTimeout(config.onopen, 1);
                    }

                    return socket;
                };

                if (!window.Firebase) {
                    var script = document.createElement('script');
                    script.src = 'https://cdn.webrtc-experiment.com/firebase.js';
                    script.onload = callback;
                    document.documentElement.appendChild(script);
                } else {
                    callback();
                }
            } else {
                callback();
            }
        }

        function init() {
            if (self.config) {
                return;
            }

            self.config = {
                ondatachannel: function(room) {
                    if (!dataConnector) {
                        self.room = room;
                        return;
                    }

                    var tempRoom = {
                        id: room.roomToken,
                        owner: room.broadcaster
                    };

                    if (self.ondatachannel) {
                        return self.ondatachannel(tempRoom);
                    }

                    if (self.joinedARoom) {
                        return;
                    }

                    self.joinedARoom = true;

                    self.join(tempRoom);
                },
                onopen: function(userid, _channel) {
                    self.onopen(userid, _channel);
                    self.channels[userid] = {
                        channel: _channel,
                        send: function(data) {
                            self.send(data, this.channel);
                        }
                    };
                },
                onmessage: function(data, userid) {
                    if (IsDataChannelSupported && !data.size) {
                        data = JSON.parse(data);
                    }

                    if (!IsDataChannelSupported) {
                        if (data.userid === window.userid) {
                            return;
                        }

                        data = data.message;
                    }

                    if (data.type === 'text') {
                        textReceiver.receive(data, self.onmessage, userid);
                    } else if (typeof data.maxChunks !== 'undefined') {
                        fileReceiver.receive(data, self);
                    } else {
                        self.onmessage(data, userid);
                    }
                },
                onclose: function(event) {
                    var myChannels = self.channels;
                    var closedChannel = event.currentTarget;

                    for (var userid in myChannels) {
                        if (closedChannel === myChannels[userid].channel) {
                            delete myChannels[userid];
                        }
                    }

                    self.onclose(event);
                },
                openSignalingChannel: self.openSignalingChannel
            };

            dataConnector = IsDataChannelSupported ?
                new DataConnector(self, self.config) :
                new SocketConnector(self.channel, self.config);

            fileReceiver = new FileReceiver(self);
            textReceiver = new TextReceiver(self);

            if (self.room) {
                self.config.ondatachannel(self.room);
            }
        }

        this.open = function(_channel) {
            self.joinedARoom = true;

            if (self.socket) {
                self.socket.onDisconnect().remove();
            } else {
                self.isInitiator = true;
            }

            if (_channel) {
                self.channel = _channel;
            }

            prepareInit(function() {
                init();
                if (IsDataChannelSupported) {
                    dataConnector.createRoom(_channel);
                }
            });
        };

        this.connect = function(_channel) {
            if (_channel) {
                self.channel = _channel;
            }

            prepareInit(init);
        };

        // manually join a room
        this.join = function(room) {
            if (!room.id || !room.owner) {
                throw 'Invalid room info passed.';
            }

            if (!dataConnector) {
                init();
            }

            if (!dataConnector.joinRoom) {
                return;
            }

            dataConnector.joinRoom({
                roomToken: room.id,
                joinUser: room.owner
            });
        };

        this.send = function(data, _channel) {
            if (!data) {
                throw 'No file, data or text message to share.';
            }

            if (typeof data.size !== 'undefined' && typeof data.type !== 'undefined') {
                FileSender.send({
                    file: data,
                    channel: dataConnector,
                    onFileSent: function(file) {
                        self.onFileSent(file);
                    },
                    onFileProgress: function(packets, uuid) {
                        self.onFileProgress(packets, uuid);
                    },

                    _channel: _channel,
                    root: self
                });

                return;
            }
            TextSender.send({
                text: data,
                channel: dataConnector,
                _channel: _channel,
                root: self
            });
        };

        this.onleave = function(userid) {
            console.debug(userid, 'left!');
        };

        this.leave = this.eject = function(userid) {
            dataConnector.leave(userid, self.autoCloseEntireSession);
        };

        this.openNewSession = function(isOpenNewSession, isNonFirebaseClient) {
            if (isOpenNewSession) {
                if (self.isNewSessionOpened) {
                    return;
                }
                self.isNewSessionOpened = true;

                if (!self.joinedARoom) {
                    self.open();
                }
            }

            if (!isOpenNewSession || isNonFirebaseClient) {
                self.connect();
            }

            if (!isNonFirebaseClient) {
                return;
            }

            // for non-firebase clients

            setTimeout(function() {
                self.openNewSession(true);
            }, 5000);
        };

        if (typeof this.preferSCTP === 'undefined') {
            this.preferSCTP = isFirefox || chromeVersion >= 32 ? true : false;
        }

        if (typeof this.chunkSize === 'undefined') {
            this.chunkSize = isFirefox || chromeVersion >= 32 ? 13 * 1000 : 1000; // 1000 chars for RTP and 13000 chars for SCTP
        }

        if (typeof this.chunkInterval === 'undefined') {
            this.chunkInterval = isFirefox || chromeVersion >= 32 ? 100 : 500; // 500ms for RTP and 100ms for SCTP
        }

        if (self.automatic) {
            if (window.Firebase) {
                console.debug('checking presence of the room..');
                new window.Firebase('https://' + (extras.firebase || self.firebase || 'muazkh') + '.firebaseIO.com/' + self.channel).once('value', function(data) {
                    console.debug('room is present?', data.val() !== null);
                    self.openNewSession(data.val() === null);
                });
            } else {
                self.openNewSession(false, true);
            }
        }
    };

    function DataConnector(root, config) {
        var self = {};
        var that = this;

        self.userToken = (root.userid = root.userid || uniqueToken()).toString();
        self.sockets = [];
        self.socketObjects = {};

        var channels = '--';
        var isbroadcaster = false;
        var isGetNewRoom = true;
        var rtcDataChannels = [];

        function newPrivateSocket(_config) {
            var socketConfig = {
                channel: _config.channel,
                onmessage: socketResponse,
                onopen: function() {
                    if (isofferer && !peer) {
                        initPeer();
                    }

                    _config.socketIndex = socket.index = self.sockets.length;
                    self.socketObjects[socketConfig.channel] = socket;
                    self.sockets[_config.socketIndex] = socket;
                }
            };

            socketConfig.callback = function(_socket) {
                socket = _socket;
                socketConfig.onopen();
            };

            var socket = root.openSignalingChannel(socketConfig);
            var isofferer = _config.isofferer;
            var gotstream;
            var inner = {};
            var peer;

            var peerConfig = {
                onICE: function(candidate) {
                    if (!socket) {
                        return setTimeout(function() {
                            peerConfig.onICE(candidate);
                        }, 2000);
                    }

                    socket.send({
                        userToken: self.userToken,
                        candidate: {
                            sdpMLineIndex: candidate.sdpMLineIndex,
                            candidate: JSON.stringify(candidate.candidate)
                        }
                    });
                },
                onopen: onChannelOpened,
                onmessage: function(event) {
                    config.onmessage(event.data, _config.userid);
                },
                onclose: config.onclose,
                onerror: root.onerror,
                preferSCTP: root.preferSCTP
            };

            function initPeer(offerSDP) {
                if (root.direction === 'one-to-one' && window.isFirstConnectionOpened) {
                    return;
                }

                if (!offerSDP) {
                    peerConfig.onOfferSDP = sendsdp;
                } else {
                    peerConfig.offerSDP = offerSDP;
                    peerConfig.onAnswerSDP = sendsdp;
                }

                peer = new RTCPeerConnection(peerConfig);
            }

            function onChannelOpened(channel) {
                channel.peer = peer.peer;
                rtcDataChannels.push(channel);

                config.onopen(_config.userid, channel);

                if (root.direction === 'many-to-many' && isbroadcaster && channels.split('--').length > 3 && defaultSocket) {
                    defaultSocket.send({
                        newParticipant: socket.channel,
                        userToken: self.userToken
                    });
                }

                window.isFirstConnectionOpened = gotstream = true;
            }

            function sendsdp(sdp) {
                sdp = JSON.stringify(sdp);
                var part = parseInt(sdp.length / 3);

                var firstPart = sdp.slice(0, part),
                    secondPart = sdp.slice(part, sdp.length - 1),
                    thirdPart = '';

                if (sdp.length > part + part) {
                    secondPart = sdp.slice(part, part + part);
                    thirdPart = sdp.slice(part + part, sdp.length);
                }

                socket.send({
                    userToken: self.userToken,
                    firstPart: firstPart
                });

                socket.send({
                    userToken: self.userToken,
                    secondPart: secondPart
                });

                socket.send({
                    userToken: self.userToken,
                    thirdPart: thirdPart
                });
            }

            function socketResponse(response) {
                if (response.userToken === self.userToken) {
                    return;
                }

                if (response.firstPart || response.secondPart || response.thirdPart) {
                    if (response.firstPart) {
                        // sdp sender's user id passed over "onopen" method
                        _config.userid = response.userToken;

                        inner.firstPart = response.firstPart;
                        if (inner.secondPart && inner.thirdPart) {
                            selfInvoker();
                        }
                    }
                    if (response.secondPart) {
                        inner.secondPart = response.secondPart;
                        if (inner.firstPart && inner.thirdPart) {
                            selfInvoker();
                        }
                    }

                    if (response.thirdPart) {
                        inner.thirdPart = response.thirdPart;
                        if (inner.firstPart && inner.secondPart) {
                            selfInvoker();
                        }
                    }
                }

                if (response.candidate && !gotstream && peer) {
                    if (!inner.firstPart || !inner.secondPart || !inner.thirdPart) {
                        return setTimeout(function() {
                            socketResponse(response);
                        }, 400);
                    }

                    peer.addICE({
                        sdpMLineIndex: response.candidate.sdpMLineIndex,
                        candidate: JSON.parse(response.candidate.candidate)
                    });

                    console.debug('ice candidate', response.candidate.candidate);
                }

                if (response.left) {
                    if (peer && peer.peer) {
                        peer.peer.close();
                        peer.peer = null;
                    }

                    if (response.closeEntireSession) {
                        leaveChannels();
                    } else if (socket) {
                        socket.send({
                            left: true,
                            userToken: self.userToken
                        });
                        socket = null;
                    }

                    root.onleave(response.userToken);
                }

                if (response.playRoleOfBroadcaster) {
                    setTimeout(function() {
                        self.roomToken = response.roomToken;
                        root.open(self.roomToken);
                        self.sockets = swap(self.sockets);
                    }, 600);
                }
            }

            var invokedOnce = false;

            function selfInvoker() {
                if (invokedOnce) {
                    return;
                }

                invokedOnce = true;
                inner.sdp = JSON.parse(inner.firstPart + inner.secondPart + inner.thirdPart);

                if (isofferer) {
                    peer.addAnswerSDP(inner.sdp);
                } else {
                    initPeer(inner.sdp);
                }

                console.debug('sdp', inner.sdp.sdp);
            }
        }

        function onNewParticipant(channel) {
            if (!channel || channels.indexOf(channel) !== -1 || channel === self.userToken) {
                return;
            }

            channels += channel + '--';

            var newChannel = uniqueToken();

            newPrivateSocket({
                channel: newChannel,
                closeSocket: true
            });

            if (!defaultSocket) {
                return;
            }

            defaultSocket.send({
                participant: true,
                userToken: self.userToken,
                joinUser: channel,
                channel: newChannel
            });
        }

        function uniqueToken() {
            return (Math.round(Math.random() * 60535) + 5000000).toString();
        }

        function leaveChannels(channel) {
            var alert = {
                left: true,
                userToken: self.userToken
            };

            var socket;

            // if room initiator is leaving the room; close the entire session
            if (isbroadcaster) {
                if (root.autoCloseEntireSession) {
                    alert.closeEntireSession = true;
                } else {
                    self.sockets[0].send({
                        playRoleOfBroadcaster: true,
                        userToken: self.userToken,
                        roomToken: self.roomToken
                    });
                }
            }

            if (!channel) {
                // closing all sockets
                var sockets = self.sockets,
                    length = sockets.length;

                for (var i = 0; i < length; i++) {
                    socket = sockets[i];
                    if (socket) {
                        socket.send(alert);

                        if (self.socketObjects[socket.channel]) {
                            delete self.socketObjects[socket.channel];
                        }

                        delete sockets[i];
                    }
                }

                that.left = true;
            }

            // eject a specific user!
            if (channel) {
                socket = self.socketObjects[channel];
                if (socket) {
                    socket.send(alert);

                    if (self.sockets[socket.index]) {
                        delete self.sockets[socket.index];
                    }

                    delete self.socketObjects[channel];
                }
            }
            self.sockets = swap(self.sockets);
        }

        window.addEventListener('beforeunload', function() {
            leaveChannels();
        }, false);

        window.addEventListener('keydown', function(e) {
            if (e.keyCode === 116) {
                leaveChannels();
            }
        }, false);

        var defaultSocket = root.openSignalingChannel({
            onmessage: function(response) {
                if (response.userToken === self.userToken) {
                    return;
                }

                if (isGetNewRoom && response.roomToken && response.broadcaster) {
                    config.ondatachannel(response);
                }

                if (response.newParticipant) {
                    onNewParticipant(response.newParticipant);
                }

                if (response.userToken && response.joinUser === self.userToken && response.participant && channels.indexOf(response.userToken) === -1) {
                    channels += response.userToken + '--';

                    console.debug('Data connection is being opened between you and', response.userToken || response.channel);
                    newPrivateSocket({
                        isofferer: true,
                        channel: response.channel || response.userToken,
                        closeSocket: true
                    });
                }
            },
            callback: function(socket) {
                defaultSocket = socket;
            }
        });

        return {
            createRoom: function(roomToken) {
                self.roomToken = (roomToken || uniqueToken()).toString();

                isbroadcaster = true;
                isGetNewRoom = false;

                (function transmit() {
                    if (defaultSocket) {
                        defaultSocket.send({
                            roomToken: self.roomToken,
                            broadcaster: self.userToken
                        });
                    }

                    if (!root.transmitRoomOnce && !that.leaving) {
                        if (root.direction === 'one-to-one') {
                            if (!window.isFirstConnectionOpened) {
                                setTimeout(transmit, 3000);
                            }
                        } else {
                            setTimeout(transmit, 3000);
                        }
                    }
                })();
            },
            joinRoom: function(_config) {
                self.roomToken = _config.roomToken;
                isGetNewRoom = false;

                newPrivateSocket({
                    channel: self.userToken
                });

                defaultSocket.send({
                    participant: true,
                    userToken: self.userToken,
                    joinUser: _config.joinUser
                });
            },
            send: function(message, _channel) {
                var _channels = rtcDataChannels;
                var data;
                var length = _channels.length;

                if (!length) {
                    return;
                }

                data = JSON.stringify(message);

                if (_channel) {
                    if (_channel.readyState === 'open') {
                        _channel.send(data);
                    }
                    return;
                }
                for (var i = 0; i < length; i++) {
                    if (_channels[i].readyState === 'open') {
                        _channels[i].send(data);
                    }
                }
            },
            leave: function(userid, autoCloseEntireSession) {
                if (autoCloseEntireSession) {
                    root.autoCloseEntireSession = true;
                }
                leaveChannels(userid);
                if (!userid) {
                    self.joinedARoom = isbroadcaster = false;
                    isGetNewRoom = true;
                }
            }
        };
    }

    var moz = !!navigator.mozGetUserMedia;
    var IsDataChannelSupported = !((moz && !navigator.mozGetUserMedia) || (!moz && !navigator.webkitGetUserMedia));

    function getRandomString() {
        return (Math.random() * new Date().getTime()).toString(36).replace(/\./g, '-');
    }

    var userid = getRandomString();

    var isMobileDevice = navigator.userAgent.match(/Android|iPhone|iPad|iPod|BlackBerry|IEMobile/i);
    var isChrome = !!navigator.webkitGetUserMedia;
    var isFirefox = !!navigator.mozGetUserMedia;

    var chromeVersion = 50;
    if (isChrome) {
        chromeVersion = !!navigator.mozGetUserMedia ? 0 : parseInt(navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./)[2]);
    }

    function swap(arr) {
        var swapped = [];
        var length = arr.length;

        for (var i = 0; i < length; i++) {
            if (arr[i]) {
                swapped.push(arr[i]);
            }
        }

        return swapped;
    }

    function listenEventHandler(eventName, eventHandler) {
        window.removeEventListener(eventName, eventHandler);
        window.addEventListener(eventName, eventHandler, false);
    }

    // IceServersHandler.js

    var IceServersHandler = (function() {
        function getIceServers(connection) {
            var iceServers = [];

            iceServers.push(getSTUNObj('stun:stun.l.google.com:19302'));

            iceServers.push(getTURNObj('stun:webrtcweb.com:7788', 'muazkh', 'muazkh')); // coTURN
            iceServers.push(getTURNObj('turn:webrtcweb.com:7788', 'muazkh', 'muazkh')); // coTURN
            iceServers.push(getTURNObj('turn:webrtcweb.com:8877', 'muazkh', 'muazkh')); // coTURN

            iceServers.push(getTURNObj('turns:webrtcweb.com:7788', 'muazkh', 'muazkh')); // coTURN
            iceServers.push(getTURNObj('turns:webrtcweb.com:8877', 'muazkh', 'muazkh')); // coTURN

            // iceServers.push(getTURNObj('turn:webrtcweb.com:3344', 'muazkh', 'muazkh')); // resiprocate
            // iceServers.push(getTURNObj('turn:webrtcweb.com:4433', 'muazkh', 'muazkh')); // resiprocate

            // check if restund is still active: http://webrtcweb.com:4050/
            iceServers.push(getTURNObj('stun:webrtcweb.com:4455', 'muazkh', 'muazkh')); // restund
            iceServers.push(getTURNObj('turn:webrtcweb.com:4455', 'muazkh', 'muazkh')); // restund
            iceServers.push(getTURNObj('turn:webrtcweb.com:5544?transport=tcp', 'muazkh', 'muazkh')); // restund

            return iceServers;
        }

        function getSTUNObj(stunStr) {
            var urlsParam = 'urls';
            if (typeof isPluginRTC !== 'undefined') {
                urlsParam = 'url';
            }

            var obj = {};
            obj[urlsParam] = stunStr;
            return obj;
        }

        function getTURNObj(turnStr, username, credential) {
            var urlsParam = 'urls';
            if (typeof isPluginRTC !== 'undefined') {
                urlsParam = 'url';
            }

            var obj = {
                username: username,
                credential: credential
            };
            obj[urlsParam] = turnStr;
            return obj;
        }

        return {
            getIceServers: getIceServers
        };
    })();

    function RTCPeerConnection(options) {
        var w = window;
        var PeerConnection = w.mozRTCPeerConnection || w.webkitRTCPeerConnection;
        var SessionDescription = w.mozRTCSessionDescription || w.RTCSessionDescription;
        var IceCandidate = w.mozRTCIceCandidate || w.RTCIceCandidate;

        var iceServers = {
            iceServers: IceServersHandler.getIceServers()
        };

        var optional = {
            optional: []
        };

        if (!navigator.onLine) {
            iceServers = null;
            console.warn('No internet connection detected. No STUN/TURN server is used to make sure local/host candidates are used for peers connection.');
        }

        var peerConnection = new PeerConnection(iceServers, optional);

        openOffererChannel();
        peerConnection.onicecandidate = onicecandidate;

        function onicecandidate(event) {
            if (!event.candidate || !peerConnection) {
                return;
            }

            if (options.onICE) {
                options.onICE(event.candidate);
            }
        }

        var constraints = options.constraints || {
            optional: [],
            mandatory: {
                OfferToReceiveAudio: false,
                OfferToReceiveVideo: false
            }
        };

        function onSdpError(e) {
            var message = JSON.stringify(e, null, '\t');

            if (message.indexOf('RTP/SAVPF Expects at least 4 fields') !== -1) {
                message = 'It seems that you are trying to interop RTP-datachannels with SCTP. It is not supported!';
            }

            console.error('onSdpError:', message);
        }

        function onSdpSuccess() {}

        function createOffer() {
            if (!options.onOfferSDP) {
                return;
            }

            peerConnection.createOffer(function(sessionDescription) {
                peerConnection.setLocalDescription(sessionDescription);
                options.onOfferSDP(sessionDescription);
            }, onSdpError, constraints);
        }

        function createAnswer() {
            if (!options.onAnswerSDP) {
                return;
            }

            options.offerSDP = new SessionDescription(options.offerSDP);
            peerConnection.setRemoteDescription(options.offerSDP, onSdpSuccess, onSdpError);

            peerConnection.createAnswer(function(sessionDescription) {
                peerConnection.setLocalDescription(sessionDescription);
                options.onAnswerSDP(sessionDescription);
            }, onSdpError, constraints);
        }

        if (!moz) {
            createOffer();
            createAnswer();
        }

        var channel;

        function openOffererChannel() {
            if (moz && !options.onOfferSDP) {
                return;
            }

            if (!moz && !options.onOfferSDP) {
                return;
            }

            _openOffererChannel();
            if (moz) {
                createOffer();
            }
        }

        function _openOffererChannel() {
            // protocol: 'text/chat', preset: true, stream: 16
            // maxRetransmits:0 && ordered:false
            var dataChannelDict = {};

            console.debug('dataChannelDict', dataChannelDict);

            channel = peerConnection.createDataChannel('channel', dataChannelDict);
            setChannelEvents();
        }

        function setChannelEvents() {
            channel.onmessage = options.onmessage;
            channel.onopen = function() {
                options.onopen(channel);
            };
            channel.onclose = options.onclose;
            channel.onerror = options.onerror;
        }

        if (options.onAnswerSDP && moz && options.onmessage) {
            openAnswererChannel();
        }

        if (!moz && !options.onOfferSDP) {
            openAnswererChannel();
        }

        function openAnswererChannel() {
            peerConnection.ondatachannel = function(event) {
                channel = event.channel;
                setChannelEvents();
            };

            if (moz) {
                createAnswer();
            }
        }

        function useless() {}

        return {
            addAnswerSDP: function(sdp) {
                sdp = new SessionDescription(sdp);
                peerConnection.setRemoteDescription(sdp, onSdpSuccess, onSdpError);
            },
            addICE: function(candidate) {
                peerConnection.addIceCandidate(new IceCandidate({
                    sdpMLineIndex: candidate.sdpMLineIndex,
                    candidate: candidate.candidate
                }));
            },

            peer: peerConnection,
            channel: channel,
            sendData: function(message) {
                if (!channel) {
                    return;
                }

                channel.send(message);
            }
        };
    }

    var FileConverter = {
        DataURLToBlob: function(dataURL, fileType, callback) {

            function processInWebWorker() {
                var blob = URL.createObjectURL(new Blob(['function getBlob(_dataURL, _fileType) {var binary = atob(_dataURL.substr(_dataURL.indexOf(",") + 1)),i = binary.length,view = new Uint8Array(i);while (i--) {view[i] = binary.charCodeAt(i);};postMessage(new Blob([view], {type: _fileType}));};this.onmessage =  function (e) {var data = JSON.parse(e.data); getBlob(data.dataURL, data.fileType);}'], {
                    type: 'application/javascript'
                }));

                var worker = new Worker(blob);
                URL.revokeObjectURL(blob);
                return worker;
            }

            if (!!window.Worker && !isMobileDevice) {
                var webWorker = processInWebWorker();

                webWorker.onmessage = function(event) {
                    callback(event.data);
                };

                webWorker.postMessage(JSON.stringify({
                    dataURL: dataURL,
                    fileType: fileType
                }));
            } else {
                var binary = atob(dataURL.substr(dataURL.indexOf(',') + 1)),
                    i = binary.length,
                    view = new Uint8Array(i);

                while (i--) {
                    view[i] = binary.charCodeAt(i);
                }

                callback(new Blob([view]));
            }
        }
    };

    function FileReceiver(root) {
        var content = {};
        var packets = {};
        var numberOfPackets = {};

        function receive(data) {
            var uuid = data.uuid;

            if (typeof data.packets !== 'undefined') {
                numberOfPackets[uuid] = packets[uuid] = parseInt(data.packets);
            }

            if (root.onFileProgress) {
                root.onFileProgress({
                    remaining: packets[uuid]--,
                    length: numberOfPackets[uuid],
                    received: numberOfPackets[uuid] - packets[uuid],

                    maxChunks: numberOfPackets[uuid],
                    uuid: uuid,
                    currentPosition: numberOfPackets[uuid] - packets[uuid]
                }, uuid);
            }

            if (!content[uuid]) {
                content[uuid] = [];
            }

            content[uuid].push(data.message);

            if (data.last) {
                var dataURL = content[uuid].join('');

                FileConverter.DataURLToBlob(dataURL, data.fileType, function(blob) {
                    blob.uuid = uuid;
                    blob.name = data.name;
                    // blob.type = data.fileType;
                    blob.extra = data.extra || {};

                    blob.url = (window.URL || window.webkitURL).createObjectURL(blob);

                    if (root.autoSaveToDisk) {
                        FileSaver.SaveToDisk(blob.url, data.name);
                    }

                    if (root.onFileReceived) {
                        root.onFileReceived(blob);
                    }

                    delete content[uuid];
                });
            }
        }

        return {
            receive: receive
        };
    }

    var FileSaver = {
        SaveToDisk: function(fileUrl, fileName) {
            var hyperlink = document.createElement('a');
            hyperlink.href = fileUrl;
            hyperlink.target = '_blank';
            hyperlink.download = fileName || fileUrl;

            var mouseEvent = new MouseEvent('click', {
                view: window,
                bubbles: true,
                cancelable: true
            });

            hyperlink.dispatchEvent(mouseEvent);
            (window.URL || window.webkitURL).revokeObjectURL(hyperlink.href);
        }
    };

    var FileSender = {
        send: function(config) {
            var root = config.root;
            var channel = config.channel;
            var privateChannel = config._channel;
            var file = config.file;

            if (!config.file) {
                console.error('You must attach/select a file.');
                return;
            }

            // max chunk sending limit on chrome is 64k
            // max chunk receiving limit on firefox is 16k
            var packetSize = 15 * 1000;

            if (root.chunkSize) {
                packetSize = root.chunkSize;
            }

            var textToTransfer = '';
            var numberOfPackets = 0;
            var packets = 0;

            file.uuid = getRandomString();

            function processInWebWorker() {
                var blob = URL.createObjectURL(new Blob(['function readFile(_file) {postMessage(new FileReaderSync().readAsDataURL(_file));};this.onmessage =  function (e) {readFile(e.data);}'], {
                    type: 'application/javascript'
                }));

                var worker = new Worker(blob);
                URL.revokeObjectURL(blob);
                return worker;
            }

            if (!!window.Worker && !isMobileDevice) {
                var webWorker = processInWebWorker();

                webWorker.onmessage = function(event) {
                    onReadAsDataURL(event.data);
                };

                webWorker.postMessage(file);
            } else {
                var reader = new FileReader();
                reader.onload = function(e) {
                    onReadAsDataURL(e.target.result);
                };
                reader.readAsDataURL(file);
            }

            function onReadAsDataURL(dataURL, text) {
                var data = {
                    type: 'file',
                    uuid: file.uuid,
                    maxChunks: numberOfPackets,
                    currentPosition: numberOfPackets - packets,
                    name: file.name,
                    fileType: file.type,
                    size: file.size
                };

                if (dataURL) {
                    text = dataURL;
                    numberOfPackets = packets = data.packets = parseInt(text.length / packetSize);

                    file.maxChunks = data.maxChunks = numberOfPackets;
                    data.currentPosition = numberOfPackets - packets;

                    if (root.onFileSent) {
                        root.onFileSent(file);
                    }
                }

                if (root.onFileProgress) {
                    root.onFileProgress({
                        remaining: packets--,
                        length: numberOfPackets,
                        sent: numberOfPackets - packets,

                        maxChunks: numberOfPackets,
                        uuid: file.uuid,
                        currentPosition: numberOfPackets - packets
                    }, file.uuid);
                }

                if (text.length > packetSize) {
                    data.message = text.slice(0, packetSize);
                } else {
                    data.message = text;
                    data.last = true;
                    data.name = file.name;

                    file.url = URL.createObjectURL(file);
                    root.onFileSent(file, file.uuid);
                }

                channel.send(data, privateChannel);

                textToTransfer = text.slice(data.message.length);
                if (textToTransfer.length) {
                    setTimeout(function() {
                        onReadAsDataURL(null, textToTransfer);
                    }, root.chunkInterval || 100);
                }
            }
        }
    };

    function SocketConnector(_channel, config) {
        var socket = config.openSignalingChannel({
            channel: _channel,
            onopen: config.onopen,
            onmessage: config.onmessage,
            callback: function(_socket) {
                socket = _socket;
            }
        });

        return {
            send: function(message) {
                if (!socket) {
                    return;
                }

                socket.send({
                    userid: userid,
                    message: message
                });
            }
        };
    }

    function TextReceiver() {
        var content = {};

        function receive(data, onmessage, userid) {
            // uuid is used to uniquely identify sending instance
            var uuid = data.uuid;
            if (!content[uuid]) {
                content[uuid] = [];
            }

            content[uuid].push(data.message);
            if (data.last) {
                var message = content[uuid].join('');
                if (data.isobject) {
                    message = JSON.parse(message);
                }

                // latency detection
                var receivingTime = new Date().getTime();
                var latency = receivingTime - data.sendingTime;

                onmessage(message, userid, latency);

                delete content[uuid];
            }
        }

        return {
            receive: receive
        };
    }

    var TextSender = {
        send: function(config) {
            var root = config.root;

            var channel = config.channel;
            var _channel = config._channel;
            var initialText = config.text;
            var packetSize = root.chunkSize || 1000;
            var textToTransfer = '';
            var isobject = false;

            if (typeof initialText !== 'string') {
                isobject = true;
                initialText = JSON.stringify(initialText);
            }

            // uuid is used to uniquely identify sending instance
            var uuid = getRandomString();
            var sendingTime = new Date().getTime();

            sendText(initialText);

            function sendText(textMessage, text) {
                var data = {
                    type: 'text',
                    uuid: uuid,
                    sendingTime: sendingTime
                };

                if (textMessage) {
                    text = textMessage;
                    data.packets = parseInt(text.length / packetSize);
                }

                if (text.length > packetSize) {
                    data.message = text.slice(0, packetSize);
                } else {
                    data.message = text;
                    data.last = true;
                    data.isobject = isobject;
                }

                channel.send(data, _channel);

                textToTransfer = text.slice(data.message.length);

                if (textToTransfer.length) {
                    setTimeout(function() {
                        sendText(null, textToTransfer);
                    }, root.chunkInterval || 100);
                }
            }
        }
    };

})();
