const belriumJS = require('belrium-js');

const httpCall = require('../utils/httpCall.js');
const constants = require('../utils/constants.js');

app.route.get('/basic/load',  async function () {

  let dappId = __dirname.split(
    /\//
  )
    .slice(
      -2
    )[
      0
    ];

  var options = {
    type: 1000,
    fee: '100000000',
    args: JSON.stringify(['running'])
  };

  let transaction = belriumJS.dapp.createInnerTransaction(
    options, 
    constants.secret
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
})

