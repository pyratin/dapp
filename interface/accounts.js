var belriumJS = require('belrium-js');
var schema = require('../schema/accounts.js');
var httpCall = require('../utils/httpCall.js');
var constants = require('../utils/constants.js');
var addressHelper = require('../utils/address.js');
var z_schema = require('../utils/zschema-express.js');
var TransactionTypes = require('../utils/transaction-types.js');

// Get Account Details by Secret of User
app.route.post('/accounts/open', async function (req, cb) {
    var validateSchema = await z_schema.validate(req.query, schema.open);

    var dappId = req.query.dappId;
    var ac_params = {
        secret: req.query.secret,
        countryCode: req.query.countryCode
    };

    var response = await httpCall.call('POST', `/api/accounts/open`, ac_params);

    if(response && !response.success) {
        return response;
    }

    var params = {
        secret: req.query.secret
    };
    var res = await httpCall.call('POST', `/api/dapps/${dappId}/login`, params);
    res.account.address = res.account.address.concat(req.query.countryCode);
    return res;
});

// Get Account Balance By Address
app.route.post('/accounts/balance',  async function (req, cb) {
    var validateSchema = await z_schema.validate(req.query, schema.getBalance);

    var dappId = req.query.dappId;
    var countryCode = addressHelper.getCountryCodeFromAddress(req.query.address);
    var address = req.query.address.slice(0, -2);

    var response = await httpCall.call('GET', `/api/accounts/info?address=${[address]}`);

    if(response.info.map(function(obj) { return obj.address; }).indexOf(address) < 0) {
        return {msg: "Account not found"};
    }
    if(response.info[0].countryCode != countryCode) {
        return {msg: "Country code mismatched"};
    }

    var res = await httpCall.call('GET', `/api/dapps/${dappId}/accounts/${address}`);
    return res;
});
