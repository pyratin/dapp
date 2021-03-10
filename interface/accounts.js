'use strict';
/* global app */

const schema = require('../schema/accounts.js');
const httpCall = require('../utils/httpCall.js');
const addressHelper = require('../utils/address.js');
const z_schema = require('../utils/zschema-express.js');

// Get Account Details by Secret of User
app.route.post(
  '/accounts/open', 
  async (req) => {

    await z_schema.validate(
      req.query, 
      schema.open
    );

    const dappId = req.query.dappId;

    const ac_params = {
      secret: req.query.secret,
      countryCode: req.query.countryCode
    };

    const response = await httpCall.call(
      'POST', 
      '/api/accounts/open', 
      ac_params
    );

    if(
      response && 
      !response.success
    ) {

      return response;
    }

    const params = {
      secret: req.query.secret
    };

    const res = await httpCall.call(
      'POST', 
      `
        /api/dapps/${
          dappId
        }/login
      `
        .trim(), 
      params
    );

    const address = res.account.address.concat(req.query.countryCode);

    return {
      ...res,
      account: {
        ...res.account,
        address
      }
    };
  }
);

// Get Account Balance By Address
app.route.post(
  '/accounts/balance',  
  async (
    req
  ) => {

    await z_schema.validate(
      req.query, 
      schema.getBalance
    );

    const dappId = req.query.dappId;

    const countryCode = addressHelper.getCountryCodeFromAddress(
      req.query.address
    );

    const address = req.query
      .address.slice(
        0, -2
      );

    const response = await httpCall.call(
      'GET', 
      `
        /api/accounts/info?address=${
          [
            address
          ]
        }
      `
        .trim()
    );

    if(
      (
        response.info
          .map(
            (
              obj
            ) => { 
              return obj.address; 
            }
          )
          .indexOf(
            address
          ) 
      ) < 
      0
    ) {

      return {
        msg: 'Account not found'
      };
    }

    if(
      (
        response.info[
          0
        ]
          .countryCode
      ) != 
      countryCode
    ) {

      return {
        msg: 'Country code mismatched'
      };
    }

    const res = await httpCall.call(
      'GET', 
      `
        /api/dapps/${
          dappId
        }/accounts/${
          address
        }
      `
        .trim()
    );

    return res;
  }
);
