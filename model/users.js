
module.exports = {
  name: 'users',
  fields: [
    {
      name: 'fName',
      type: 'String',
      length: 256,
      index: true
    },
    {
      name: 'lName',
      type: 'String',
      length: 256,
      index: true
    },
    {
      name: 'email',
      type: 'String',
      index: true,
      length: 256
    },
  ]
};
