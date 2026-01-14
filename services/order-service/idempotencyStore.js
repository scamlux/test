const processedKeys = new Set();

function isProcessed(key) {
  return processedKeys.has(key);
}

function markProcessed(key) {
  processedKeys.add(key);
}

module.exports = {
  isProcessed,
  markProcessed,
};
