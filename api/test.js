module.exports = (req, res) => {
  res.status(200).json({ 
    ok: true, 
    message: "Isolated API test branch", 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV
  });
};
