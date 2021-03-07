const util = require("../utils/util");
const belriumJS = require('belrium-js');
const httpCall = require('../utils/httpCall.js');
const constants = require('../utils/constants.js');

app.route.put('/user',  async function (req) {

  let fName = req.query.fName;
  let lName = req.query.lName;
  let email = req.query.email

  let dappId = util.getDappID();

  var options = {
    type: 1000,
    fee: String(constants.fees.registerUsers * constants.fixedPoint),
    args: JSON.stringify([fName, lName, email])
  };

  let transaction = belriumJS.dapp.createInnerTransaction(options, constants.admin.secret);

  let params = { transaction: transaction };

  var res = await httpCall.call(
    'PUT', 
    `/api/dapps/${dappId}/transactions/signed`, 
    params
  );

  return res;
})

