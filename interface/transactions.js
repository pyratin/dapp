'use strict';
/* global app */

const crypto = require('crypto');
const belriumJS = require('belrium-js');
const ed = require('../utils/ed.js');
const httpCall = require('../utils/httpCall.js');
const constants = require('../utils/constants.js');
const schema = require('../schema/transactions.js');
const addressHelper = require('../utils/address.js');
const z_schema = require('../utils/zschema-express.js');
const TransactionTypes = require('../utils/transaction-types.js');

// OutTransfer
app.route.put(
  '/transaction/withdrawal', 
  async function (
    req,
  ) {

    await z_schema.validate(req.query, schema.outTransfer);

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

    if(
      response && 
      response.account
    ) {

      if(
        !response.account.status
      ) {

        return {
          error: 'wallet not verified!'
        };
      }

      const fee = String(
        constants.fees.outTransfer * 
        constants.fixedPoint
      );

      const type = TransactionTypes.OUT_TRANSFER;

      const options = {
        fee: fee,
        type: type,
        args: JSON.stringify(
          [
            constants.defaultCurrency, 
            String(req.query.amount)
          ]
        )
      };

      const secret = req.query.secret;

      const transaction = belriumJS.dapp
        .createInnerTransaction(
          options, 
          secret
        );

      const dappId = req.query.dappId;

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

    else {

      return response;
    }
  }
);

// InTransfer (Internal transfer in DAPP)
app.route.put(
  '/transaction/inTransfer', 
  async (
    req
  ) => {

    await z_schema.validate(
      req.query, 
      schema.inTransfer
    );

    const hash = crypto.createHash(
      'sha256'
    )
      .update(
        req.query.secret, 
        'utf8'
      )
      .digest();

    const keypair = ed.MakeKeypair(
      hash
    );

    const publicKey = keypair.publicKey
      .toString(
        'hex'
      );

    const senderId = addressHelper.generateBase58CheckAddress(
      publicKey
    );

    let recipientId = req.query.recipientId;

    if (
      req.query.publicKey
    ) {

      if (
        publicKey != 
        req.query.publicKey
      ) {

        return {
          error: 'Invalid passphrase'
        };
      }
    }

    if(
      req.query.recepientCountryCode != 
      (
        addressHelper.getCountryCodeFromAddress(
          recipientId
        )
      )
    ) {

      return {
        msg: 'Recipient country code mismatched!'
      };
    }

    recipientId = recipientId.slice(
      0, -2
    );

    var response = await httpCall.call(
      'GET', 
      `
        /api/accounts/info?address=${
          [
            senderId, 
            recipientId
          ]
        }
      `
        .trim()
    );

    if(
      response && 
      response.info && 
      (
        !response.info
          .length
      )
    ) {

      return {
        msg: 'Account not found'
      };
    }

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
          .indexOf(recipientId)
      ) < 
      0
    ) {

      return {
        msg: 'Recipient not found'
      };
    }

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
          .indexOf(senderId)
      ) < 
      0
    ) {

      return {
        msg: 'Sender not found'
      };
    }

    for(
      let i = 0; 
      i < response.info.length; 
      i++
    ) {

      const data = response.info[
        i
      ];

      if(
        data.address == senderId
      ) {

        if(
          data.countryCode != 
          req.query.senderCountryCode
        ) {

          return {
            msg: 'Sender country code mismatched!'
          };
        }

        if(
          !data.status
        ) {

          return {
            msg: 'Sender wallet not verified!'
          };
        }
      }

      if(
        data.address == 
        recipientId
      ) {

        if(
          data.countryCode != 
          req.query.recepientCountryCode
        ) {

          return {
            msg: 'Recipient country code mismatched!'
          };
        }

        if(
          !data.status
        ) {

          return {
            msg: 'Recipient wallet not verified!'
          };
        }
      }
    }

    const fee = String(
      constants.fees.inTransfer * 
      constants.fixedPoint
    );

    const type = TransactionTypes.IN_TRANSFER;

    const options = {
      fee: fee,
      type: type,
      args: JSON.stringify(
        [
          constants.defaultCurrency, 
          String(
            req.query
              .amount
          ), 
          recipientId
        ]
      )
    };

    const secret = req.query.secret;

    const transaction = belriumJS.dapp
      .createInnerTransaction(
        options, 
        secret
      );

    const dappId = req.query.dappId;

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

// Get Unconfirmed Transactions
app.route.get(
  '/transaction/unconfirmed',  
  async function (
    req
  ) {

    const dappId = req.query.dappId;

    const offset = (req.query.offset)? req.query.offset: 0;

    const limit = (req.query.limit)? req.query.limit: 20;

    const res = await httpCall.call(
      'GET', 
      `
        /api/dapps/${
          dappId
        }/transactions/unconfirmed?offset=${
          offset
        }&limit=${
          limit
        }
      `
        .trim()
    );

    const addresses = new Set();

    res.transactions
      .forEach(
        (
          trs
        ) => {

          trs.args = JSON.parse(
            trs.args
          );

          trs.recipientId = addressHelper.isBase58CheckAddress(
            trs.args[trs.args.length-1]
          ) ? 
            trs.args[trs.args.length-1] : 
            null;

          trs.currency = trs.args[
            0
          ];

          trs.amount = parseInt(
            trs.args[
              1
            ]
          );

          addresses.add(
            trs.senderId
          );

          addresses.add(
            trs.recipientId
          );

          delete trs.args;
        }
      );

    const response = await httpCall.call(
      'GET', 
      `
        /api/accounts/info?address=${
          addresses
        }
      `
        .trim()
    );

    if(
      !response
    ) {

      return response;
    }

    response.info
      .forEach(
        function(
          row
        ) {

          res.transactions
            .forEach(
              function(
                trs
              ) {

                if(
                  row.address == 
                  trs.senderId
                ) {

                  trs.senderCountryCode = row.countryCode;

                  trs.senderId = trs.senderId + 
                    (
                      (
                        row && 
                        row.countryCode
                      ) ? 
                        row.countryCode : 
                        ''
                    );
                }

                if(
                  row.address == 
                  trs.recipientId
                ) {

                  trs.recepientCountryCode = row.countryCode;

                  trs.recipientId = trs.recipientId + 
                    (
                      (
                        row && 
                        row.countryCode
                      ) ? 
                        row.countryCode : 
                        ''
                    );
                }
              }
            );
        }
      );

    return res;
  }
);

// Get Transactions by transactionId
app.route.get(
  '/transaction/confirmed',  
  async (
    req
  ) => {

    const dappId = __dirname.split(
      /\//
    )
      .slice(
        -2
      )[
        0
      ];

    const offset = (
      req.query.offset
    ) ? 
      (
        req.query
          .offset
      ) : 
      0;

    const limit = (
      req.query.limit
    ) ? 
      (
        req.query
          .limit
      ) : 
      20;

    const res = await httpCall.call(
      'GET', 
      `
        /api/dapps/${
          dappId
        }/transactions?offset=${
          offset
        }&limit=${
          limit
        }
      `
        .trim()
    );

    const addresses = new Set();

    res.transactions
      .forEach(
        (
          trs
        ) => {

          trs.args = JSON.parse(trs.args);

          trs.recipientId = (
            addressHelper.isBase58CheckAddress(
              trs.args[
                trs.args.length-1
              ]
            )
          ) ? 
            trs.args[trs.args.length-1]: 
            null;

          trs.currency = trs.args[0];

          trs.amount = parseInt(
            trs.args[
              1
            ]
          );

          addresses.add(
            trs.senderId
          );

          addresses.add(
            trs.recipientId
          );

          delete trs.args;
        }
      );

    const response = await httpCall.call(
      'GET', 
      `
        /api/accounts/info?address=${
          Array.from(
            addresses
          )
        }
      `
        .trim()
    );

    if(!response) {

      return response;
    }

    response.info.forEach(
      (
        row
      ) => {

        res.transactions.forEach(
          (
            trs
          ) => {

            if(
              row.address == 
              trs.senderId
            ) {

              trs.senderCountryCode = row.countryCode;
              trs.senderId = trs.senderId + 
                (
                  (
                    row && 
                    row.countryCode
                  ) ? 
                    row.countryCode : 
                    ''
                );
            }

            if(
              row.address == 
              trs.recipientId
            ) {

              trs.recepientCountryCode = row.countryCode;

              trs.recipientId = trs.recipientId + 
                (
                  (
                    row && 
                    row.countryCode
                  ) ? 
                    row.countryCode : 
                    ''
                );
            }
          }
        );
      }
    );

    return res;
  }
);

// Get Internal Transactions
app.route.get(
  '/transaction/transfers',  
  async function (
    req
  ) {

    const dappId = __dirname.split(
      /\//
    )
      .slice(
        -2
      )[
        0
      ];

    const offset = (
      req.query.offset
    ) ? 
      req.query.offset : 
      0;

    const limit = (
      req.query.limit
    ) ? 
      (
        req.query
          .limit
      ) : 
      20;

    const res = await httpCall.call(
      'GET', 
      `
        /api/dapps/${
          dappId
        }/transfers?offset=${
          offset
        }&limit=${
          limit
        }
      `
        .trim()
    );

    const addresses = new Set();

    res.transfers.forEach(
      (
        trs
      ) => {

        addresses.add(trs.senderId);
        addresses.add(trs.recipientId);
      }
    );

    const response = await httpCall.call(
      'GET', 
      `
        /api/accounts/info?address=${
          Array.from(
            addresses
          )
        }
      `
        .trim()
    );

    if(!response) {
      return response;
    }

    response.info
      .forEach(
        (
          row
        ) => {

          res.transfers
            .forEach(
              function(
                trs
              ) {

                if(
                  row.address == 
                  trs.senderId
                ) {

                  trs.senderCountryCode = row.countryCode;

                  trs.senderId = trs.senderId + 
                    (
                      (
                        row && 
                        row.countryCode
                      ) ? 
                        row.countryCode : 
                        ''
                    );
                }

                if(
                  row.address == 
                  trs.recipientId
                ) {

                  trs.recepientCountryCode = row.countryCode;

                  trs.recipientId = trs.recipientId + 
                    (
                      (
                        row && 
                        row.countryCode
                      ) ? 
                        row.countryCode : 
                        ''
                    );
                }
              }
            );
        }
      );

    return res;
  }
);
