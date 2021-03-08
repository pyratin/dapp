var constants = require('../utils/constants.js');

module.exports = {

  load: function(
    status
  ) {

    console.log('calling contract basics');

    app.sdb.create('Basic', {
      status
    });
  }
};
