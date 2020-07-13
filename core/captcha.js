const Jimp = require('jimp');

module.exports = class Captcha {
    _buf(image) {
        return new Promise(function(resolve) {
            image.getBuffer(Jimp.MIME_PNG, function(err, buf) {
                resolve(buf);
            });
        });
    }
    _randomInt(low, high) {
        return Math.floor(Math.random() * (high - low) + low);
    }
    async get(code) {
        // Load fonts
        if (!this.font1) {
            this.font1 = await Jimp.loadFont(Jimp.FONT_SANS_16_BLACK);
        }
        // Get image object        
        let image = await new Jimp(120, 50, 0xFFFFFFFF);
        // Iterate the code string
        for (let x = 0; x < 120; x++) {
            for (let y = 0; y < 50; y++) {
                if (this._randomInt(0, 10) === 1) {
                    image.setPixelColor(0x000000FF, x, y);
                }
            }
        }
        image.pixelate(2);
        let idx = 0;
        for (let chr of code) {
            let y = -2;
            let x = (idx * 20) + this._randomInt(0, 7);
            image.print(this.font1, x, y, chr);
            image.rotate(this._randomInt(0, 5));
            image.scale(1.1);
            image.crop(0, 0, 120, 50);
            idx++;
        }
        for (let x = 0; x < 120; x++) {
            for (let y = 0; y < 50; y++) {
                if (this._randomInt(0, 20) === 1) {
                    image.setPixelColor(0x999999FF, x, y);
                }
            }
        }
        image.rotate(this._randomInt(-3, 3));
        image.scale(1.3);
        image.crop(0, 0, 120, 50);
        // Return image buffer
        let buffer = await this._buf(image);
        return buffer;
    }
};