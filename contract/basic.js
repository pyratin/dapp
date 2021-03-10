'use strict';
/* global app */

module.exports = {

  load(
    status
  ) {

    app.sdb.create(
      'Basic', 
      {
        status
      }
    );
  }
};
