---
name: mongodb-usage
description: This skill should be used when user asks to "query MongoDB", "show database collections", "get collection schema", "list MongoDB databases", "search records in MongoDB", or "check database indexes".
---

# MongoDB Best Practices

## MCP Limitation

**This MCP operates in READ-ONLY mode.** No write, update, or delete operations are possible.

## Schema Design Patterns

### Embedding vs Referencing

**Embed when:**

- Data is accessed together frequently
- Child documents are bounded (won't grow unbounded)
- One-to-few relationships
- Data doesn't change frequently

**Reference when:**

- Data is accessed independently
- Many-to-many relationships
- Documents would exceed 16MB limit
- Frequent updates to referenced data

### Common Patterns

**Subset pattern:** Store frequently accessed subset in parent, full data in separate collection.

**Bucket pattern:** Group time-series data into buckets (e.g., hourly readings in one document).

**Computed pattern:** Store pre-computed values for expensive calculations.

## Index Strategies

### Index Guidelines

- Index fields used in queries, sorts, and aggregation $match stages
- Compound indexes support queries on prefix fields
- Covered queries (all fields in index) are fastest
- Too many indexes slow writes

### Index Types

- **Single field:** Basic index on one field
- **Compound:** Multiple fields, order matters for queries
- **Multikey:** Automatically created for array fields
- **Text:** Full-text search on string content
- **TTL:** Auto-expire documents after time period

### ESR Rule

For compound indexes, order fields by:

1. **E**quality (exact match fields)
2. **S**ort (sort order fields)
3. **R**ange (range query fields like $gt, $lt)

## Aggregation Pipeline

### Performance Tips

- Put `$match` and `$project` early to reduce documents
- Use `$limit` early when possible
- Avoid `$lookup` on large collections without indexes
- Use `$facet` for multiple aggregations in one query

### Common Stages

```javascript
// Filter documents
{ $match: { status: "active" } }

// Reshape documents
{ $project: { name: 1, total: { $sum: "$items.price" } } }

// Group and aggregate
{ $group: { _id: "$category", count: { $sum: 1 } } }

// Sort results
{ $sort: { count: -1 } }

// Join collections
{ $lookup: { from: "orders", localField: "_id", foreignField: "userId", as: "orders" } }
```

## Connection Best Practices

### Connection String Formats

- **Atlas:** `mongodb+srv://user:pass@cluster.mongodb.net/database`
- **Local:** `mongodb://localhost:27017/database`
- **Replica set:** `mongodb://host1,host2,host3/database?replicaSet=rs0`

### Connection Pooling

- Use connection pooling in applications (default in drivers)
- Set appropriate pool size for your workload
- Don't create new connections per request

## Anti-Patterns to Avoid

- **Unbounded arrays:** Arrays that grow without limit
- **Massive documents:** Documents approaching 16MB
- **Too many collections:** Use embedding instead
- **Missing indexes:** Queries doing collection scans
- **$where operator:** Use aggregation instead for security
- **Storing files in documents:** Use GridFS for large files
