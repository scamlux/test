const { connect } = require("../infrastructure/database");
const { v4: uuid } = require("uuid");

class RequestLogRepository {
  async log(logData) {
    const {
      serviceName,
      method,
      endpoint,
      statusCode,
      requestBody,
      responseBody,
      durationMs,
      errorMessage,
    } = logData;

    try {
      const db = await connect();
      const collection = db.collection("request_logs");

      await collection.insertOne({
        _id: uuid(),
        service_name: serviceName,
        method,
        endpoint,
        status_code: statusCode,
        request_body: requestBody,
        response_body: responseBody,
        duration_ms: durationMs,
        error_message: errorMessage || null,
        created_at: new Date(),
      });
    } catch (err) {
      console.error("Error logging request to MongoDB:", err.message);
    }
  }

  async getLogs(serviceName, limit = 100) {
    try {
      const db = await connect();
      const collection = db.collection("request_logs");

      return await collection
        .find({ service_name: serviceName })
        .sort({ created_at: -1 })
        .limit(limit)
        .toArray();
    } catch (err) {
      console.error("Error fetching logs:", err.message);
      return [];
    }
  }

  async getAllLogs(limit = 500) {
    try {
      const db = await connect();
      const collection = db.collection("request_logs");

      return await collection
        .find({})
        .sort({ created_at: -1 })
        .limit(limit)
        .toArray();
    } catch (err) {
      console.error("Error fetching logs:", err.message);
      return [];
    }
  }

  async getLogsByStatus(statusCode, limit = 100) {
    try {
      const db = await connect();
      const collection = db.collection("request_logs");

      return await collection
        .find({ status_code: statusCode })
        .sort({ created_at: -1 })
        .limit(limit)
        .toArray();
    } catch (err) {
      console.error("Error fetching logs:", err.message);
      return [];
    }
  }

  async getMetrics() {
    try {
      const db = await connect();
      const collection = db.collection("request_logs");

      const totalRequests = await collection.countDocuments();
      const errorRequests = await collection.countDocuments({
        status_code: { $gte: 400 },
      });
      const avgResponseTime = await collection
        .aggregate([
          { $group: { _id: null, avg_duration: { $avg: "$duration_ms" } } },
        ])
        .toArray();

      return {
        total_requests: totalRequests,
        error_count: errorRequests,
        success_count: totalRequests - errorRequests,
        error_rate:
          totalRequests > 0
            ? ((errorRequests / totalRequests) * 100).toFixed(2)
            : 0,
        avg_response_time: avgResponseTime[0]?.avg_duration || 0,
      };
    } catch (err) {
      console.error("Error calculating metrics:", err.message);
      return {};
    }
  }
}

module.exports = new RequestLogRepository();
