try {
  const app = require('../src/app');
  module.exports = (req, res) => {
    return app(req, res);
  };
} catch (error) {
  console.error("DIAGNOSTIC_INIT_ERROR:", error);
  module.exports = (req, res) => {
    res.status(500).json({ 
      error: "Initialization Failure", 
      message: error.message,
      stack: error.stack,
      hint: "Check if all dependencies are in root package.json and no ReferenceErrors exist."
    });
  };
}
