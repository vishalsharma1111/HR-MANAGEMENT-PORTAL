import os
import glob
from typing import List, Dict, Any
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

KNOWLEDGE_BASE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "knowledge_base")

class HRKnowledgeVectorStore:
    def __init__(self, kb_dir: str = KNOWLEDGE_BASE_DIR):
        self.kb_dir = kb_dir
        self.chunks: List[Dict[str, Any]] = []
        self.vectorizer: Optional[TfidfVectorizer] = None
        self.tfidf_matrix = None
        self.is_indexed = False
        self.build_index()

    def build_index(self):
        """Ingest all approved HR policy markdown documents, chunk them, and build TF-IDF index."""
        doc_files = glob.glob(os.path.join(self.kb_dir, "*.md"))
        self.chunks = []

        for fpath in doc_files:
            fname = os.path.basename(fpath)
            with open(fpath, "r", encoding="utf-8") as f:
                content = f.read()

            # Split by markdown headers
            sections = content.split("\n## ")
            doc_title = sections[0].replace("# ", "").strip()

            for sec in sections[1:]:
                lines = sec.split("\n")
                sec_title = lines[0].strip()
                body = "\n".join(lines[1:]).strip()

                if len(body) < 20:
                    continue

                self.chunks.append({
                    "doc_title": doc_title,
                    "section_title": sec_title,
                    "source_file": fname,
                    "content": f"## {sec_title}\n{body}",
                    "plain_text": f"{doc_title} {sec_title} {body}"
                })

        if not self.chunks:
            self.is_indexed = False
            return

        corpus = [c["plain_text"] for c in self.chunks]
        self.vectorizer = TfidfVectorizer(
            ngram_range=(1, 2),
            stop_words="english",
            max_df=0.9,
            min_df=1
        )
        self.tfidf_matrix = self.vectorizer.fit_transform(corpus)
        self.is_indexed = True

    def search(self, query: str, top_k: int = 3, threshold: float = 0.12) -> List[Dict[str, Any]]:
        """Retrieve most relevant chunks matching the query."""
        if not self.is_indexed or self.vectorizer is None or self.tfidf_matrix is None:
            return []

        query_vec = self.vectorizer.transform([query])
        sims = cosine_similarity(query_vec, self.tfidf_matrix)[0]

        ranked_indices = sims.argsort()[::-1]
        results = []

        for idx in ranked_indices:
            score = float(sims[idx])
            if score < threshold or len(results) >= top_k:
                break
            chunk = self.chunks[idx].copy()
            chunk["similarity_score"] = round(score, 4)
            results.append(chunk)

        return results

vector_store = HRKnowledgeVectorStore()
