var constants = require('../utils/constants.js');

module.exports = {

  init: function(
    status
  ) {

    console.log('calling contract basics');

    app.sdb.create('Basic', {
      status
    });
  }
};
