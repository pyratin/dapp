var crypto = require('crypto');
var belriumJS = require('belrium-js');
var ed = require('../utils/ed.js');
var httpCall = require('../utils/httpCall.js');
var constants = require('../utils/constants.js');
var schema = require('../schema/transactions.js');
var addressHelper = require('../utils/address.js');
var z_schema = require('../utils/zschema-express.js');
var TransactionTypes = require('../utils/transaction-types.js');

// OutTransfer
app.route.put('/transaction/withdrawal', async function (req, cb) {
    var validateSchema = await z_schema.validate(req.query, schema.outTransfer);

    var ac_params = {
        secret: req.query.secret,
        countryCode: req.query.countryCode
    };
    var response = await httpCall.call('POST', `/api/accounts/open`, ac_params);

    if(response && !response.success) {
        return response;
    }

    if(response && response.account) {

        if(!response.account.status) {
            return {error: "wallet not verified!"};
        }

        let fee = String(constants.fees.outTransfer * constants.fixedPoint);
        let type = TransactionTypes.OUT_TRANSFER; // withdraw money to mainchain
        let options = {
            fee: fee,
            type: type,
            args: JSON.stringify([constants.defaultCurrency, String(req.query.amount)])
        };
        let secret = req.query.secret;

        let transaction = belriumJS.dapp.createInnerTransaction(options, secret);

        let dappId = req.query.dappId;

        let params = {
            transaction: transaction
        };

        /*var data = {
           secret: secret,
           fee: fee,
           type: type,
           args: JSON.stringify([constants.defaultCurrency, String(req.query.amount)])
        };*/
        console.log("outTransfer data: ", params);
        var res = await httpCall.call('PUT', `/api/dapps/${dappId}/transactions/signed`, params);

        return res;

    } else {
        return response;
    }
});

// InTransfer (Internal transfer in DAPP)
app.route.put('/transaction/inTransfer', async function (req, cb) {
    var validateSchema = await z_schema.validate(req.query, schema.inTransfer);

    var hash = crypto.createHash('sha256').update(req.query.secret, 'utf8').digest();
    var keypair = ed.MakeKeypair(hash);
    var publicKey = keypair.publicKey.toString('hex');
    var senderId = addressHelper.generateBase58CheckAddress(publicKey);
    var recipientId = req.query.recipientId;

    if (req.query.publicKey) {
        if (publicKey != req.query.publicKey) {
            return {error: "Invalid passphrase"};
        }
    }

    if(req.query.recepientCountryCode != addressHelper.getCountryCodeFromAddress(recipientId)) {
        return {msg: "Recipient country code mismatched!"};
    }

    recipientId = recipientId.slice(0, -2);

    var response = await httpCall.call('GET', `/api/accounts/info?address=${[senderId, recipientId]}`);

    if(response && response.info && !response.info.length) {
        return {msg: "Account not found"};
    }

    if(response.info.map(function(obj) { return obj.address; }).indexOf(recipientId) < 0) {
        return {msg: "Recipient not found"};
    }

    if(response.info.map(function(obj) { return obj.address; }).indexOf(senderId) < 0) {
        return {msg: "Sender not found"};
    }

    for(i=0; i<response.info.length; i++) {
        var data = response.info[i];
        if(data.address == senderId) {
            if(data.countryCode != req.query.senderCountryCode) {
                return {msg: "Sender country code mismatched!"};
            }
            if(!data.status) {
                return {msg: "Sender wallet not verified!"};
            }
        }
        if(data.address == recipientId) {
            if(data.countryCode != req.query.recepientCountryCode) {
                return {msg: "Recipient country code mismatched!"};
            }
            if(!data.status) {
                return {msg: "Recipient wallet not verified!"};
            }
        }
    }

    let fee = String(constants.fees.inTransfer * constants.fixedPoint);
    let type = TransactionTypes.IN_TRANSFER; // transaction within sidechain
    let options = {
        fee: fee,
        type: type,
        args: JSON.stringify([constants.defaultCurrency, String(req.query.amount), recipientId])
    }
    let secret = req.query.secret;

    let transaction = belriumJS.dapp.createInnerTransaction(options, secret);

    let dappId = req.query.dappId;

    let params = {
        transaction: transaction
    };

    /*let newData = {
        secret: secret,
        fee: fee,
        type: type, // internal transfer
        args: JSON.stringify([constants.defaultCurrency, String(req.query.amount), recipientId])
    };*/
    console.log("inTransfer data: ", params);
    var res = await httpCall.call('PUT', `/api/dapps/${dappId}/transactions/signed`, params);

    return res;
});

// Get Unconfirmed Transactions
app.route.get('/transaction/unconfirmed',  async function (req) {
    var dappId = req.query.dappId;
    var offset = (req.query.offset)? req.query.offset: 0;
    var limit = (req.query.limit)? req.query.limit: 20;

    var res = await httpCall.call('GET', `/api/dapps/${dappId}/transactions/unconfirmed?offset=${offset}&limit=${limit}`);
    var addresses = new Set();

    res.transactions.forEach(function(trs, index) {
        trs.args = JSON.parse(trs.args);
        trs.recipientId = addressHelper.isBase58CheckAddress(trs.args[trs.args.length-1])? trs.args[trs.args.length-1]: null;
        trs.currency = trs.args[0];
        trs.amount = parseInt(trs.args[1]);

        addresses.add(trs.senderId);
        addresses.add(trs.recipientId);
        delete trs.args;
    });

    var response = await httpCall.call('GET', `/api/accounts/info?address=${addresses}`);

    if(!response) {
        return response;
    }

    response.info.forEach(function(row, index1) {
        res.transactions.forEach(function(trs, index2) {
            if(row.address == trs.senderId) {
                trs.senderCountryCode = row.countryCode;
                trs.senderId = trs.senderId + ((row && row.countryCode)? row.countryCode: '');
            }
            if(row.address == trs.recipientId) {
                trs.recepientCountryCode = row.countryCode;
                trs.recipientId = trs.recipientId + ((row && row.countryCode)? row.countryCode: '');
                //trs.args[trs.args.length-1] = addressHelper.isBase58CheckAddress(trs.args[trs.args.length-1])? trs.args[trs.args.length-1].concat((row && row.countryCode)? row.countryCode: ''): null;
            }
        });
    });

    return res;
});

// Get Transactions by transactionId
app.route.get('/transaction/confirmed',  async function (req) {
    var dappId = req.query.dappId;
    var offset = (req.query.offset)? req.query.offset: 0;
    var limit = (req.query.limit)? req.query.limit: 20;

    var res = await httpCall.call('GET', `/api/dapps/${dappId}/transactions?offset=${offset}&limit=${limit}`);
    var addresses = new Set();

    res.transactions.forEach(function(trs, index) {
        trs.args = JSON.parse(trs.args);
        trs.recipientId = addressHelper.isBase58CheckAddress(trs.args[trs.args.length-1])? trs.args[trs.args.length-1]: null;
        trs.currency = trs.args[0];
        trs.amount = parseInt(trs.args[1]);

        addresses.add(trs.senderId);
        addresses.add(trs.recipientId);
        delete trs.args;
    });

    var response = await httpCall.call('GET', `/api/accounts/info?address=${Array.from(addresses)}`);

    if(!response) {
        return response;
    }

    response.info.forEach(function(row, index1) {
        res.transactions.forEach(function(trs, index2) {
            if(row.address == trs.senderId) {
                trs.senderCountryCode = row.countryCode;
                trs.senderId = trs.senderId + ((row && row.countryCode)? row.countryCode: '');
            }
            if(row.address == trs.recipientId) {
                trs.recepientCountryCode = row.countryCode;
                trs.recipientId = trs.recipientId + ((row && row.countryCode)? row.countryCode: '');
                //trs.args[trs.args.length-1] = addressHelper.isBase58CheckAddress(trs.args[trs.args.length-1])? trs.args[trs.args.length-1].concat((row && row.countryCode)? row.countryCode: ''): null;
            }
        });
    });

    return res;
});

// Get Internal Transactions
app.route.get('/transaction/transfers',  async function (req) {
    var dappId = req.query.dappId;
    var offset = (req.query.offset)? req.query.offset: 0;
    var limit = (req.query.limit)? req.query.limit: 20;

    var res = await httpCall.call('GET', `/api/dapps/${dappId}/transfers?offset=${offset}&limit=${limit}`);
    var addresses = new Set();

    res.transfers.forEach(function(trs, index) {
        addresses.add(trs.senderId);
        addresses.add(trs.recipientId);
    });

    var response = await httpCall.call('GET', `/api/accounts/info?address=${Array.from(addresses)}`);

    if(!response) {
        return response;
    }

    response.info.forEach(function(row, index1) {
        res.transfers.forEach(function(trs, index2) {
            if(row.address == trs.senderId) {
                trs.senderCountryCode = row.countryCode;
                trs.senderId = trs.senderId + ((row && row.countryCode)? row.countryCode: '');
            }
            if(row.address == trs.recipientId) {
                trs.recepientCountryCode = row.countryCode;
                trs.recipientId = trs.recipientId + ((row && row.countryCode)? row.countryCode: '');
            }
        });
    });

    return res;
});
