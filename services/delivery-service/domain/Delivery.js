// ===================================
// DOMAIN LAYER - Delivery Aggregate
// ===================================

class Delivery {
  constructor(
    id,
    orderId,
    status = "PENDING",
    expectedDeliveryDate = null,
    actualDeliveryDate = null,
  ) {
    this.id = id;
    this.orderId = orderId;
    this.status = status;
    this.deliveryDate = null;
    this.expectedDeliveryDate = expectedDeliveryDate;
    this.actualDeliveryDate = actualDeliveryDate;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  static create(orderId, expectedDeliveryDate) {
    const { v4: uuid } = require("uuid");
    return new Delivery(uuid(), orderId, "PENDING", expectedDeliveryDate);
  }

  startDelivery() {
    if (this.status !== "PENDING") {
      throw new Error("Can only start delivery from PENDING status");
    }
    this.status = "IN_TRANSIT";
    this.deliveryDate = new Date();
    this.updatedAt = new Date();
  }

  confirmDelivery(recipientName, signature, notes) {
    if (this.status !== "IN_TRANSIT") {
      throw new Error("Can only confirm delivery that is IN_TRANSIT");
    }
    this.status = "DELIVERED";
    this.actualDeliveryDate = new Date();
    this.updatedAt = new Date();

    return {
      id: require("uuid").v4(),
      deliveryId: this.id,
      recipientName,
      signature,
      notes,
      confirmedAt: this.actualDeliveryDate,
    };
  }

  cancelDelivery(reason) {
    if (this.status === "DELIVERED") {
      throw new Error("Cannot cancel already delivered items");
    }
    this.status = "CANCELLED";
    this.updatedAt = new Date();
  }

  toDomain() {
    return {
      id: this.id,
      orderId: this.orderId,
      status: this.status,
      deliveryDate: this.deliveryDate,
      expectedDeliveryDate: this.expectedDeliveryDate,
      actualDeliveryDate: this.actualDeliveryDate,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

module.exports = Delivery;
