'use strict';
/* global app */

module.exports = () => {

  app.registerContract(
    1000,
    'basic.load'
  );

  app.setDefaultFee(
    0, 
    'BEL'
  );
};
