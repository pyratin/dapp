const jwt = require('jsonwebtoken');
const constants = require('./constants');

module.exports = {

    parseRequestToken: function(token) {
        try {
    				return jwt.verify(token, constants.cipher.key);
        } catch (e) {
            return false;
        }
    },

    generateToken: function(data) {
        const token = jwt.sign(data, constants.cipher.key, {
            expiresIn: 60 * 60 * 24 * 7
        });
        return token;
    }
};
