'use strict';

var constants = require('../utils/constants.js');

module.exports = {
  registerUsers: {
    type: 'object',
      properties: {
        fName: {
          type: "string"
        },
        lName: {
          type: "string"
        },
        phoneNo: {
          type: "number"
        },
        email: {
          type: "string"
        },
        password: {
          type: "string"
        },
        dappName: {
          type: "string"
        },
        role: {
          type: "string",
          enum: ["merchant", "user", 'superadmin','miniadmin','clinicmaster','clinicadmin','clinicauthorizer','clinicissuer','patient']
        },
        hash: {
          type: "string",
          maxLength: 256
        },
        countryCode: {
          type: 'string',
          minLength: 2,
          maxLength: 2
        }
      },
      required: ['fName', 'lName', 'email', 'phoneNo', 'password', 'role', 'dappName', 'countryCode']
  }
};
