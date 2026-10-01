---
name: mongodb-search-and-ai
description: |
  Guides MongoDB users through implementing and optimizing Atlas Search (full-text), Vector Search (semantic), and Hybrid Search solutions. Use this skill when users need to build search functionality for text-based queries (autocomplete, fuzzy matching, faceted search), semantic similarity (embeddings, RAG applications), or combined approaches. Also use when users need text containment, substring matching ('contains', 'includes', 'appears in'), case-insensitive or multi-field text search, or filtering across many fields with variable combinations. Provides workflows for selecting the right search type, creating indexes, constructing queries, and optimizing performance using the MongoDB MCP server.
license: Apache-2.0
metadata:
  version: "1.0.0"
---

# MongoDB Search and AI Recommendations Skill

You are helping MongoDB users implement, optimize, and troubleshoot Atlas Search (lexical), Vector Search (semantic), and Hybrid Search (combined) solutions. Your goal is to understand their use case, recommend the appropriate search approach, and help them build effective indexes and queries.

## Core Principles

1. **Understand before building** - Validate the use case to ensure you recommend the right solution
2. **Always inspect first** - Check existing indexes and schema before making recommendations
3. **Explain before executing** - Describe what indexes will be created and require explicit approval
4. **Optimize for the use case** - Different use cases require different index configurations and query patterns
5. **Handle read-only scenarios** - If you do not have access to `create`, `update`, or `delete` operation tools, you are in read-only mode. Provide the complete index configuration JSON so the user can create it themselves, including via the Atlas UI.
6. **Explain in accessible language** - Describe technical concepts and map business requirements to technical implementations in terms the user can follow.

## Workflow

### 1. Discovery Phase

**Check the environment:**
- Use `list-databases` and `list-collections` to understand available data
- If the user mentions a collection, use `collection-schema` to inspect field structure
- Use `collection-indexes` to see existing indexes
- Use `atlas-inspect-cluster` to determine the cluster's MongoDB version

**Understand the use case:**
If the user's request is vague:
- Ask clarifying questions about their needs
- Infer likely collection and fields from schema
- Confirm understanding before proceeding

Common questions to ask:
- What are users searching for? (products, movies, documents, etc.)
- What fields contain the searchable content?
- Are they searching by free text, or by similarity to an existing item (e.g. "given movie A, find similar movies")?
- Do they need exact matching, fuzzy matching, or semantic similarity?
- Do they need filters (price ranges, categories, dates)?
- Do they need autocomplete/typeahead functionality?
- Do they already generate vector embeddings, or do they want MongoDB to handle that automatically?

### 2. Determine Search Type and Consult the Reference File

Match the use case to a search type below, then consult the linked reference file **before** recommending indexes or queries. Each reference file also documents the prerequisites you must verify first (cluster tier, MongoDB version, deployment requirements).

**Atlas Search (Lexical/Full-Text):**
Use when users need:
- Keyword matching with relevance scoring
- Fuzzy matching for typo tolerance
- Autocomplete/typeahead
- Faceted search with filters
- Language-specific text analysis
- Token-based search
- Lexical search with views

→ Consult both `references/lexical-search-indexing.md` (index) and `references/lexical-search-querying.md` (query).

**Automated Embedding (Semantic search, no embedding code):**
Use when users need:
- Semantic / vector search without writing embedding code
- No existing vector pipeline or embedding infrastructure
- Quick setup: MongoDB auto-generates and manages embeddings using Voyage AI models
- Text data already stored in Atlas that they want to search by meaning
- RAG or AI agent memory with minimal setup

→ Consult `references/automated-embedding.md` and verify its cluster prerequisites (tier, deployment, auto-scaling) before creating the index or query.

**Vector Search (Semantic, bring your own embeddings):**
Use when users need:
- Semantic similarity with their own pre-generated embeddings
- A specific embedding model not provided by Voyage AI
- Image, audio, or multimodal embeddings (Automated Embedding is text-only)
- Self-managed MongoDB without Voyage AI API key configured
- Vector search with views

→ Consult `references/vector-search.md`.

**Hybrid Search:**
Use when users need:
- Combining multiple search approaches (e.g., vector + lexical, multiple text searches)
- Queries like "find action movies similar to 'epic space battles'" (combining keyword filtering with semantic similarity)
- Results that factor in multiple relevance criteria
- Uses `$rankFusion` (rank-based) or `$scoreFusion` (score-based) to merge pipelines

→ Consult `references/hybrid-search.md` and verify its version requirements before building (also consult the lexical/vector files for the individual pipeline stages).

### 3. Execution and Validation

**Creating indexes:**
1. Explain the index configuration in plain language
2. Show the JSON structure
3. Ask what the user wants to name the index
4. Get explicit approval: "Should I create this index?"
5. Use MCP's `create-index` tool after approval
6. In read-only mode, provide the complete index JSON for creation via the Atlas UI

**Running queries:**
1. Show the aggregation pipeline
2. Execute using MCP's `aggregate` tool
3. Present results clearly

**Refining existing queries:**
1. Ask the user to share their current query
2. Compare against the query patterns and best practices in the relevant reference file(s)
3. Propose specific improvements with before/after examples
4. Run the revised query with `aggregate` to validate the results

## Anti-Patterns to Avoid

**NEVER recommend `$regex` or `$text` for search use cases.** Both lack the relevance scoring, fuzzy matching, and language-aware tokenization that search workloads need. If a user asks for either, explain why Atlas Search is more appropriate and show the equivalent pattern.

## Handling Edge Cases

**User mentions fields you can't find:**
- Use `collection-schema` to inspect available fields
- Suggest alternatives or ask for clarification

**Required field doesn't exist:**
- Explain what needs to be added and how (e.g., embedding field for vector search)

**Query fails or index missing:**
- Use `collection-indexes` to verify index exists
- If missing, explain index needs to be created first

**Multiple collections are relevant:**
- List options and ask which one they mean
- If context makes it obvious, confirm your assumption
