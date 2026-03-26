try {
  const app = require('../backend/src/app');
  module.exports = (req, res) => {
    return app(req, res);
  };
} catch (error) {
  console.error("Vercel Init Crash:", error);
  const express = require('express');
  const app = express();
  app.all('*', (req, res) => {
    res.status(500).json({
      error: "Critical Initialization Failure",
      message: error.message,
      stack: error.stack,
      dir: __dirname,
      cwd: process.cwd()
    });
  });
  module.exports = app;
}
