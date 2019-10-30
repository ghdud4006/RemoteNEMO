var imageHandler = {
    lastImageURL: null,
    lastImageIndex: 0,
    images: [],

    ismousedown: false,
    prevX: 0,
    prevY: 0,
    load: function(width, height) {
        var t = imageHandler;
        points[points.length] = ['image', [imageHandler.lastImageURL, t.prevX, t.prevY, width, height, imageHandler.lastImageIndex], drawHelper.getOptions()];
        document.getElementById('drag-last-path').click();

        // share to webrtc
        syncPoints(true);
    },
    mousedown: function(e) {
        var x = e.pageX - canvas.offsetLeft,
            y = e.pageY - canvas.offsetTop;

        var t = this;

        t.prevX = x;
        t.prevY = y;

        t.ismousedown = true;
    },
    mouseup: function(e) {
        var x = e.pageX - canvas.offsetLeft,
            y = e.pageY - canvas.offsetTop;

        var t = this;
        if (t.ismousedown) {
            points[points.length] = ['image', [imageHandler.lastImageURL, t.prevX, t.prevY, x - t.prevX, y - t.prevY, imageHandler.lastImageIndex], drawHelper.getOptions()];

            t.ismousedown = false;
        }

    },
    mousemove: function(e) {
        var x = e.pageX - canvas.offsetLeft,
            y = e.pageY - canvas.offsetTop;

        var t = this;
        if (t.ismousedown) {
            tempContext.clearRect(0, 0, innerWidth, innerHeight);

            drawHelper.image(tempContext, [imageHandler.lastImageURL, t.prevX, t.prevY, x - t.prevX, y - t.prevY, imageHandler.lastImageIndex]);
        }
    }
};
