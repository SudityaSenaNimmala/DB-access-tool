import mongoose from 'mongoose';
import DBInstance from '../models/DBInstance.js';

class QueryExecutor {
  constructor() {
    this.connections = new Map();
  }

  async getConnection(dbInstanceId) {
    // Check if we already have a connection
    if (this.connections.has(dbInstanceId.toString())) {
      const conn = this.connections.get(dbInstanceId.toString());
      if (conn.readyState === 1) {
        return conn;
      }
      // Connection is not ready, remove it
      this.connections.delete(dbInstanceId.toString());
    }

    // Get DB instance and create new connection
    const dbInstance = await DBInstance.findById(dbInstanceId);
    if (!dbInstance) {
      throw new Error('Database instance not found');
    }

    const connectionString = dbInstance.getConnectionString();
    const conn = await mongoose.createConnection(connectionString, {
      dbName: dbInstance.database,
    }).asPromise();

    this.connections.set(dbInstanceId.toString(), conn);
    return conn;
  }

  async executeQuery(request) {
    const { dbInstanceId, queryType, query } = request;
    
    try {
      const conn = await this.getConnection(dbInstanceId);
      const db = conn.db;

      // Parse the query string to JSON
      let parsedQuery;
      try {
        parsedQuery = JSON.parse(query);
      } catch (e) {
        throw new Error(`Invalid query JSON: ${e.message}`);
      }

      // Get collection name from query
      const collectionName = parsedQuery.collection;
      if (!collectionName) {
        throw new Error('Collection name not specified in query');
      }
      const coll = db.collection(collectionName);

      let result;
      const startTime = Date.now();

      switch (queryType) {
        case 'find':
          result = await coll.find(parsedQuery.filter || parsedQuery || {})
            .limit(parsedQuery.limit || 100)
            .skip(parsedQuery.skip || 0)
            .sort(parsedQuery.sort || {})
            .toArray();
          break;

        case 'findOne':
          result = await coll.findOne(parsedQuery.filter || parsedQuery || {});
          break;

        case 'aggregate':
          const pipeline = Array.isArray(parsedQuery) ? parsedQuery : parsedQuery.pipeline || [];
          result = await coll.aggregate(pipeline).toArray();
          break;

        case 'insertOne':
          result = await coll.insertOne(parsedQuery.document || parsedQuery);
          break;

        case 'insertMany':
          result = await coll.insertMany(parsedQuery.documents || parsedQuery);
          break;

        case 'updateOne':
          result = await coll.updateOne(
            parsedQuery.filter || {},
            parsedQuery.update || {},
            parsedQuery.options || {}
          );
          break;

        case 'updateMany':
          result = await coll.updateMany(
            parsedQuery.filter || {},
            parsedQuery.update || {},
            parsedQuery.options || {}
          );
          break;

        case 'deleteOne':
          result = await coll.deleteOne(parsedQuery.filter || parsedQuery || {});
          break;

        case 'deleteMany':
          result = await coll.deleteMany(parsedQuery.filter || parsedQuery || {});
          break;

        case 'count':
          result = await coll.countDocuments(parsedQuery.filter || parsedQuery || {});
          break;

        case 'distinct':
          result = await coll.distinct(
            parsedQuery.field,
            parsedQuery.filter || {}
          );
          break;

        default:
          throw new Error(`Unsupported query type: ${queryType}`);
      }

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        result,
        executionTime,
        rowCount: Array.isArray(result) ? result.length : 1,
      };
    } catch (error) {
      console.error('Query execution error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async closeConnection(dbInstanceId) {
    if (this.connections.has(dbInstanceId.toString())) {
      const conn = this.connections.get(dbInstanceId.toString());
      await conn.close();
      this.connections.delete(dbInstanceId.toString());
    }
  }

  async closeAllConnections() {
    for (const [id, conn] of this.connections) {
      await conn.close();
    }
    this.connections.clear();
  }
}

export default new QueryExecutor();
