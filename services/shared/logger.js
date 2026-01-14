function log(service, orderId, message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${service}] [orderId=${orderId}] ${message}`);
}

module.exports = log;
