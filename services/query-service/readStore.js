// Read database (CQRS Read Model)
// In-memory implementation (логически MongoDB)

const orders = new Map();

function createOrder(orderId, payload) {
  orders.set(orderId, {
    orderId,
    status: "CREATED",
    product: payload?.product,
    quantity: payload?.quantity,
  });
}

function reserveInventory(orderId) {
  const order = orders.get(orderId);
  if (order) order.status = "INVENTORY_RESERVED";
}

function paymentFailed(orderId) {
  const order = orders.get(orderId);
  if (order) order.status = "PAYMENT_FAILED";
}

function cancelOrder(orderId) {
  const order = orders.get(orderId);
  if (order) order.status = "CANCELLED";
}

function getOrder(orderId) {
  return orders.get(orderId);
}

function getAllOrders() {
  return Array.from(orders.values());
}

module.exports = {
  createOrder,
  reserveInventory,
  paymentFailed,
  cancelOrder,
  getOrder,
  getAllOrders,
};
