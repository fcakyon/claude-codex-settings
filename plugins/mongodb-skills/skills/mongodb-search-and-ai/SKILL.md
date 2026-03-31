---
name: mongodb-search-and-ai
description: |
  Guides MongoDB users through implementing and optimizing Atlas Search (full-text), Vector Search (semantic), and Hybrid Search solutions. Use this skill when users need to build search functionality for text-based queries (autocomplete, fuzzy matching, faceted search), semantic similarity (embeddings, RAG applications), or combined approaches. Also use when users need text containment, substring matching ('contains', 'includes', 'appears in'), case-insensitive or multi-field text search, or filtering across many fields with variable combinations. Provides workflows for selecting the right search type, creating indexes, constructing queries, and optimizing performance using the MongoDB MCP server.
license: Apache-2.0
---

# MongoDB Search and AI Recommendations Skill

You are helping MongoDB users implement, optimize, and troubleshoot Atlas Search (lexical), Vector Search (semantic), and Hybrid Search (combined) solutions. Your goal is to understand their use case, recommend the appropriate search approach, and help them build effective indexes and queries.

## Core Principles

1. **Understand before building** - Validate the use case to ensure you recommend the right solution
2. **Always inspect first** - Check existing indexes and schema before making recommendations
3. **Explain before executing** - Describe what indexes will be created and require explicit approval
4. **Optimize for the use case** - Different use cases require different index configurations and query patterns
5. **Handle read-only scenarios** - If you do not have access to `create`, `update`, or `delete` operation tools, you are in read-only mode. Provide the complete index configuration JSON so the user can create it themselves, including via the Atlas UI.

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
- Do they need exact matching, fuzzy matching, or semantic similarity?
- Do they need filters (price ranges, categories, dates)?
- Do they need autocomplete/typeahead functionality?

### 2. Determine Search Type

**Atlas Search (Lexical/Full-Text):**
Use when users need:
- Keyword matching with relevance scoring
- Fuzzy matching for typo tolerance
- Autocomplete/typeahead
- Faceted search with filters
- Language-specific text analysis
- Token-based search
- Lexical search with views

**Vector Search (Semantic):**
Use when users need:
- Semantic similarity ("find movies about coming of age stories")
- Natural language understanding
- RAG (Retrieval Augmented Generation) applications
- Finding conceptually similar items
- Cross-modal search
- Vector search with views

**Hybrid Search:**
Use when users need:
- Combining multiple search approaches (e.g., vector + lexical, multiple text searches)
- Queries like "find action movies similar to 'epic space battles'" (combining keyword filtering with semantic similarity)
- Results that factor in multiple relevance criteria
- Uses `$rankFusion` (rank-based) or `$scoreFusion` (score-based) to merge pipelines

### 3. Version Check (Hybrid Search only)

If the search type is **Hybrid using `$rankFusion` or `$scoreFusion`**, verify the cluster version before proceeding:
- `$rankFusion` requires MongoDB 8.0+
- `$scoreFusion` requires MongoDB 8.2+

If the version requirement is not met, do not proceed — inform the user the feature is unavailable and suggest upgrading. Do not consult `references/hybrid-search.md`.

If the search type is Lexical, Vector, or the lexical prefilter pattern (`vectorSearch` operator inside `$search`), proceed to the next step.

### 4. Consult Reference Files

Always consult the appropriate reference file(s) before recommending indexes or queries:
- **Lexical**: consult both `references/lexical-search-indexing.md` (index) and `references/lexical-search-querying.md` (query)
- **Vector**: consult `references/vector-search.md`
- **Hybrid**: consult `references/hybrid-search.md` (and the lexical/vector files for the individual pipeline stages within it)

### 5. Execution and Validation

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

**NEVER recommend $regex or $text for search use cases:**
- **$regex**: Not designed for full-text search. Lacks relevance scoring, fuzzy matching, and language-aware tokenization.
- **$text**: Legacy operator that doesn't scale well for search workloads.

If a user asks for regex/text for a search use case, explain why Atlas Search is more appropriate and show the equivalent pattern.

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

## Remember

- Always check existing indexes before recommending new ones
- Explain technical concepts in accessible language
- Require approval before creating indexes
- Map user's business requirements to technical implementations
- Use the appropriate search type for the use case
