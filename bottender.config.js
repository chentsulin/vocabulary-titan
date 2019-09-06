module.exports = {
  session: {
    driver: 'memory',
    expiresIn: 10, // 10 min
    stores: {
      memory: {
        maxSize: 1000,
      },
    },
  },

  initialState: {
    word: '',
  },

  channels: {
    messenger: {
      enabled: false,
      path: '/messenger',
      accessToken: '__FILL_YOUR_TOKEN_HERE__',
      appSecret: '__FILL_YOUR_SECRET_HERE__',
      verifyToken: '__FILL_YOUR_VERIFYTOKEN_HERE__',
    },
    line: {
      enabled: true,
      path: '/line',
      channelSecret: process.env.channelSecret,
      accessToken: process.env.accessToken,
    },
    telegram: {
      enabled: true,
      path: '/telegram',
      accessToken: process.env.telegramAccessToken,
    },
  },
};
