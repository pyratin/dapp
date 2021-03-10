'use strict';
/* global app */

const belriumJS = require('belrium-js');

const httpCall = require('../utils/httpCall.js');

app.route.get(
  '/basic/load',  
  async () => {

    const secret = 'strong nephew series vintage venture dignity identify protect clever asset yellow sea';

    const dappId = __dirname.split(
      /\//
    )
      .slice(
        -2
      )[
        0
      ];

    const options = {
      type: 1000,
      fee: '0',
      args: JSON.stringify(
        [
          'running'
        ]
      )
    };

    const transaction = belriumJS.dapp.createInnerTransaction(
      options, 
      secret
    );

    const params = { 
      transaction: transaction 
    };

    const res = await httpCall.call(
      'PUT', 
      `
        /api/dapps/${
          dappId
        }/transactions/signed
      `
        .trim(), 
      params
    );

    return res;
  }
);
