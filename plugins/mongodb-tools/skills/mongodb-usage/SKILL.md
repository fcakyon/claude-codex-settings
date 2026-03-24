---
name: mongodb-usage
description: "Query MongoDB databases, inspect collections and schemas, check indexes, and apply best practices for schema design and aggregation pipelines. Operates in read-only mode. Use when the user asks to query MongoDB, show collections, get collection schemas, list databases, search records, or check database indexes."
---

# MongoDB Best Practices

> **READ-ONLY mode**: This MCP cannot write, update, or delete data.

## 1. Schema Design Patterns

### Embedding vs Referencing

**Embed when:** data is accessed together, child documents are bounded, one-to-few relationships, data rarely changes.

**Reference when:** data is accessed independently, many-to-many relationships, documents would exceed 16MB, referenced data updates frequently.

### Common Patterns

- **Subset pattern:** Store frequently accessed subset in parent, full data in a separate collection
- **Bucket pattern:** Group time-series data into buckets (e.g., hourly readings in one document)
- **Computed pattern:** Store pre-computed values for expensive calculations

## 2. Index Strategies

### ESR Rule for Compound Indexes

Order fields by:

1. **E**quality (exact match fields)
2. **S**ort (sort order fields)
3. **R**ange (range query fields like `$gt`, `$lt`)

### Index Types

| Type | Purpose |
|------|---------|
| **Single field** | Basic index on one field |
| **Compound** | Multiple fields; order matters for queries |
| **Multikey** | Automatically created for array fields |
| **Text** | Full-text search on string content |
| **TTL** | Auto-expire documents after a time period |

Index fields used in queries, sorts, and `$match` stages. Covered queries (all fields in index) are fastest. Too many indexes slow writes.

## 3. Aggregation Pipeline

Place `$match` and `$project` early to reduce the document set. Use `$limit` early when possible. Avoid `$lookup` on large collections without indexes.

```javascript
// Example: count active orders by category
[
  { $match: { status: "active" } },
  { $group: { _id: "$category", count: { $sum: 1 } } },
  { $sort: { count: -1 } }
]
```

Additional stages:

```javascript
{ $project: { name: 1, total: { $sum: "$items.price" } } }
{ $lookup: { from: "orders", localField: "_id", foreignField: "userId", as: "orders" } }
{ $facet: { /* multiple aggregations in one query */ } }
```

## 4. Connection Best Practices

| Format | Connection string |
|--------|-------------------|
| **Atlas** | `mongodb+srv://user:pass@cluster.mongodb.net/database` |
| **Local** | `mongodb://localhost:27017/database` |
| **Replica set** | `mongodb://host1,host2,host3/database?replicaSet=rs0` |

Use connection pooling (default in drivers). Set appropriate pool size for your workload. Don't create new connections per request.

## 5. Anti-Patterns to Avoid

- **Unbounded arrays** that grow without limit
- **Massive documents** approaching 16MB
- **Too many collections** where embedding would suffice
- **Missing indexes** causing collection scans
- **`$where` operator** instead of aggregation (security risk)
- **Storing files in documents** instead of GridFS
