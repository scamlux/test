const outbox = [];

function addEvent(topic, payload) {
  outbox.push({
    id: Date.now() + Math.random(),
    topic,
    payload,
    sent: false,
  });
}

function getPendingEvents() {
  return outbox.filter((e) => !e.sent);
}

function markSent(id) {
  const event = outbox.find((e) => e.id === id);
  if (event) event.sent = true;
}

module.exports = {
  addEvent,
  getPendingEvents,
  markSent,
};
