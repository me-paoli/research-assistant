-- Migration: Add full-text search capabilities to interview_chunks table
-- Date: 2024-12-01

-- 1️⃣ Add full-text search column
ALTER TABLE interview_chunks
  ADD COLUMN IF NOT EXISTS fts tsvector
  GENERATED ALWAYS AS (to_tsvector('english', clean_text)) STORED;

-- 2️⃣ Create GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS interview_chunks_fts_idx
  ON interview_chunks USING gin(fts);

-- 3️⃣ Create hybrid search function that combines full-text and semantic search
CREATE OR REPLACE FUNCTION public.hybrid_search(
  query_text      text,
  query_embedding vector(1536),
  match_count     int   default 20,
  ft_weight       float default 1,
  sem_weight      float default 1,
  rrf_k           int   default 50
)
RETURNS SETOF interview_chunks
LANGUAGE sql
STABLE PARALLEL SAFE
AS $$
WITH
ft AS (
  SELECT id,
         row_number() OVER (ORDER BY ts_rank_cd(fts, websearch_to_tsquery(query_text)) DESC) AS r
  FROM   interview_chunks
  WHERE  fts @@ websearch_to_tsquery(query_text)
  LIMIT  match_count * 2
),
sem AS (
  SELECT id,
         row_number() OVER (ORDER BY embedding <#> query_embedding) AS r
  FROM   interview_chunks
  ORDER  BY r
  LIMIT  match_count * 2
)
SELECT  c.*
FROM    ft
FULL JOIN sem USING (id)
JOIN    interview_chunks c USING (id)
ORDER BY
  COALESCE(1.0/(rrf_k + ft.r), 0)*ft_weight +
  COALESCE(1.0/(rrf_k + sem.r),0)*sem_weight
DESC
LIMIT match_count;
$$;

-- 4️⃣ Create a simpler full-text only search function
CREATE OR REPLACE FUNCTION public.full_text_search(
  query_text   text,
  match_count  int default 20
)
RETURNS SETOF interview_chunks
LANGUAGE sql
STABLE PARALLEL SAFE
AS $$
SELECT c.*
FROM interview_chunks c
WHERE fts @@ websearch_to_tsquery(query_text)
ORDER BY ts_rank_cd(fts, websearch_to_tsquery(query_text)) DESC
LIMIT match_count;
$$;

-- 5️⃣ Create a semantic search only function
CREATE OR REPLACE FUNCTION public.semantic_search(
  query_embedding vector(1536),
  match_count    int default 20
)
RETURNS SETOF interview_chunks
LANGUAGE sql
STABLE PARALLEL SAFE
AS $$
SELECT c.*
FROM interview_chunks c
ORDER BY embedding <#> query_embedding
LIMIT match_count;
$$;

-- 6️⃣ Add comments for documentation
COMMENT ON FUNCTION public.hybrid_search IS 'Combines full-text and semantic search using Reciprocal Rank Fusion (RRF)';
COMMENT ON FUNCTION public.full_text_search IS 'Performs full-text search only using PostgreSQL tsvector';
COMMENT ON FUNCTION public.semantic_search IS 'Performs semantic search only using vector similarity'; 