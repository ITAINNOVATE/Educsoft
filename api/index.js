try {
  const app = require('../src/app');
  module.exports = (req, res) => {
    return app(req, res);
  };
} catch (error) {
  console.error("CRITICAL_INIT_ERROR:", error);
  module.exports = (req, res) => {
    res.status(500).json({ 
      error: "Critical Initialization Failure", 
      message: error.message,
      stack: error.stack,
      hint: "Check if all dependencies are in the root package.json"
    });
  };
}
