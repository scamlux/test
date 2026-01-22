const Delivery = require("../domain/Delivery");
const deliveryRepository = require("../domain/DeliveryRepository");
const pool = require("../infrastructure/database");
const log = require("../../shared/logger");

class CreateDeliveryUseCase {
  async execute({ orderId, expectedDeliveryDate }) {
    const existing = await deliveryRepository.findByOrderId(orderId);
    if (existing) {
      throw new Error(`Delivery already exists for order ${orderId}`);
    }

    const delivery = Delivery.create(orderId, expectedDeliveryDate);
    await deliveryRepository.save(delivery);

    log(
      "DeliveryService",
      delivery.id,
      `Delivery created for order ${orderId}`,
    );
    return delivery.toDomain();
  }
}

class StartDeliveryUseCase {
  async execute(deliveryId) {
    const delivery = await deliveryRepository.findById(deliveryId);
    if (!delivery) {
      throw new Error(`Delivery ${deliveryId} not found`);
    }

    delivery.startDelivery();
    await deliveryRepository.save(delivery);

    log("DeliveryService", deliveryId, `Delivery started`);
    return delivery.toDomain();
  }
}

class ConfirmDeliveryUseCase {
  async execute({ deliveryId, recipientName, signature, notes }) {
    const delivery = await deliveryRepository.findById(deliveryId);
    if (!delivery) {
      throw new Error(`Delivery ${deliveryId} not found`);
    }

    const confirmation = delivery.confirmDelivery(
      recipientName,
      signature,
      notes,
    );
    await deliveryRepository.save(delivery);

    // Save confirmation
    await pool.query(
      `INSERT INTO delivery_confirmations (id, delivery_id, recipient_name, signature_data, notes, confirmed_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        confirmation.id,
        deliveryId,
        recipientName,
        signature,
        notes,
        confirmation.confirmedAt,
      ],
    );

    log(
      "DeliveryService",
      deliveryId,
      `Delivery confirmed by ${recipientName}`,
    );
    return delivery.toDomain();
  }
}

class CancelDeliveryUseCase {
  async execute({ deliveryId, reason }) {
    const delivery = await deliveryRepository.findById(deliveryId);
    if (!delivery) {
      throw new Error(`Delivery ${deliveryId} not found`);
    }

    delivery.cancelDelivery(reason);
    await deliveryRepository.save(delivery);

    log("DeliveryService", deliveryId, `Delivery cancelled: ${reason}`);
    return delivery.toDomain();
  }
}

class GetDeliveryUseCase {
  async execute(deliveryId) {
    const delivery = await deliveryRepository.findById(deliveryId);
    if (!delivery) {
      throw new Error(`Delivery ${deliveryId} not found`);
    }
    return delivery.toDomain();
  }
}

module.exports = {
  CreateDeliveryUseCase: new CreateDeliveryUseCase(),
  StartDeliveryUseCase: new StartDeliveryUseCase(),
  ConfirmDeliveryUseCase: new ConfirmDeliveryUseCase(),
  CancelDeliveryUseCase: new CancelDeliveryUseCase(),
  GetDeliveryUseCase: new GetDeliveryUseCase(),
};
