// Vercel serverless function entry point
// This file delegates to the compiled Express app

const app = require('../dist/index.js').default;

module.exports = app;
