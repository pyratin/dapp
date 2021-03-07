'use strict';

var request = require('request');
var constants = require('./constants.js');
const URL = constants.URL;
module.exports = {
	call: async function(method, url_path, payload, cb){
		var options = {
			method: method,
			url: URL + '' + url_path,
			headers:{
				'Content-Type':'application/json',
				'magic': '594fe0f3',
				'version': ''
			},
			body: JSON.stringify(payload)
		};
		return new Promise((resolve, reject) => {
			function callback(error, response, body) {
				if(error) return reject(error);
				try {
                resolve(JSON.parse(body));
            } catch(e) {
                reject(e);
            }
			}
			request(options, callback);
		});
	}
}
