module.exports = {
  fixedPoint : Math.pow(10, 10),
  defaultCurrency: 'BEL', // default currency symbole for Belrium
  totalSupply: 2100000000000000000,
  URL: "http://localhost:9305",
  BKBS_URL: "http://47.254.241.229:8080",
  admin: {
    secret: "frozen hour curious thunder relief accuse soccer region resource marine juice chicken",
    countryCode: "IN"
  },
  superUser: {
    email: "belfricsexchange@gmail.com",
    password: "Be@My*20T",
    secret: "kQuZcJaPzcBm"
  },
  cipher: {
    algorithm: "aes-256-cbc",
    key: "CentralServerSecret"
  },
  regex: /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{7,20}$/,
  fees: {
    send: 0.001,
    inTransfer: 0.001,
    outTransfer: 0.001,
    defaultFee: 0,
    registerUsers: 0,
    updateUser: 0
  }
}
