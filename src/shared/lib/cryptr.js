/*
cryptr is a simple aes-256-gcm encrypt and decrypt module for node.js

Copyright (c) 2014 Maurice Butler

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
const crypto = require("crypto");

const algorithm = "aes-256-gcm";
const ivLength = 16;
const saltLength = 64;
const tagLength = 16;
const tagPosition = saltLength + ivLength;
const encryptedPosition = tagPosition + tagLength;

function Cryptr(secret) {
    if (!secret || typeof secret !== "string") {
        throw new Error("Cryptr: secret must be a non-0-length string");
    }

    function getKey(salt) {
        return crypto.pbkdf2Sync(secret, salt, 100000, 32, "sha512");
    }
    this.encrypt = function encrypt(value) {
        if (value == null) {
            throw new Error("value must not be null or undefined");
        }
        const iv = crypto.randomBytes(ivLength);
        const salt = crypto.randomBytes(saltLength);
        const key = getKey(salt);
        const cipher = crypto.createCipheriv(algorithm, key, iv);
        const encrypted = Buffer.concat([cipher.update(String(value), "utf8"), cipher.final()]);
        const tag = cipher.getAuthTag();
        return Buffer.concat([salt, iv, tag, encrypted]).toString("hex");
    };

    this.decrypt = function decrypt(value) {
        if (value == null) {
            throw new Error("value must not be null or undefined");
        }
        const stringValue = Buffer.from(String(value), "hex");
        const salt = stringValue.slice(0, saltLength);
        const iv = stringValue.slice(saltLength, tagPosition);
        const tag = stringValue.slice(tagPosition, encryptedPosition);
        const encrypted = stringValue.slice(encryptedPosition);
        const key = getKey(salt);
        const decipher = crypto.createDecipheriv(algorithm, key, iv);
        decipher.setAuthTag(tag);
        return decipher.update(encrypted) + decipher.final("utf8");
    };
}

module.exports = Cryptr;
