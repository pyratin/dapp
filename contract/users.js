var constants = require('../utils/constants.js');

module.exports = {

  registerUsers: function(fName, lName, address, email) {

    console.log("calling contract registerUsers: ", this);

    app.sdb.create('User', {
      fName: fName,
      lName: lName,
      email: email,
    });
  }
};
