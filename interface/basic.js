const belriumJS = require('belrium-js');

const httpCall = require('../utils/httpCall.js');

app.route.get('/basic/load',  async function () {

  let secret = 'frozen hour curious thunder relief accuse soccer region resource marine juice chicken';

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
    fee: '0',
    args: JSON.stringify(['running'])
  };

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
