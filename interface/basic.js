const belriumJS = require('belrium-js');

const httpCall = require('../utils/httpCall.js');
const constants = require('../utils/constants.js');

app.route.get('/basic/load',  async function () {

  let secret = 'sentence weasel match weather apple onion release keen lens deal fruit matrix';

  let dappId = __dirname.split(
    /\//
  )
    .slice(
      -2
    )[
      0
    ];

  let fee = String(constants.fees.registerResult * constants.fixedPoint);

  var options = {
    type: 1000,
    fee,
    args: JSON.stringify(['running'])
  };
  console.log('MAHA fee', fee);

  let transaction = belriumJS.dapp.createInnerTransaction(
    options, 
    secret
  );

  let params = { 
    transaction: transaction 
  };

  var res = await httpCall.call(
    'PUT', 
    `/api/dapps/${dappId}/transactions/signed`, 
    params
  );

  return res;
});
