"""
Cluster service — groups similar posts using TF-IDF + K-Means.

Reduces N posts into K topical clusters so the AI processes
coherent problem themes rather than scattered individual posts.
"""

import logging
from typing import List

import numpy as np
from sklearn.cluster import KMeans
from sklearn.feature_extraction.text import TfidfVectorizer

from app.schemas import ClusterResult, NormalizedPost

logger = logging.getLogger(__name__)

# ── Clustering parameters ──
MIN_POSTS_FOR_CLUSTERING = 5  # Below this, skip clustering
MAX_CLUSTERS = 10             # Upper bound on cluster count
MIN_CLUSTER_SIZE = 2          # Discard clusters with < this many posts


def _determine_k(n_posts: int) -> int:
    """
    Heuristic for choosing K (number of clusters).
    We want ~5 meaningful clusters but adjust for data size.
    """
    if n_posts < MIN_POSTS_FOR_CLUSTERING:
        return 1
    # Roughly sqrt(n/2), capped at MAX_CLUSTERS
    k = max(3, min(int(np.sqrt(n_posts / 2)), MAX_CLUSTERS))
    return min(k, n_posts)  # Can't have more clusters than posts


def cluster_posts(posts: List[NormalizedPost]) -> List[ClusterResult]:
    """
    Main entry point — clusters posts by topic similarity.

    Strategy:
      1. Vectorize text using TF-IDF (captures term importance)
      2. Apply K-Means clustering
      3. Select the most representative post per cluster (closest to centroid)
      4. Return ClusterResult objects sorted by average engagement

    Args:
        posts: Filtered, normalized posts from a single platform.

    Returns:
        List of ClusterResult, each containing related posts and
        a representative text for the AI to process.
    """
    if not posts:
        return []

    # Too few posts → treat all as one cluster
    if len(posts) < MIN_POSTS_FOR_CLUSTERING:
        combined_text = max((p.text for p in posts), key=len)
        avg_eng = sum(p.engagement for p in posts) / len(posts)
        return [ClusterResult(
            cluster_id=0,
            representative_text=combined_text,
            posts=posts,
            avg_engagement=avg_eng,
        )]

    # ── Step 1: TF-IDF Vectorization ──
    texts = [p.text for p in posts]
    vectorizer = TfidfVectorizer(
        max_features=5000,
        stop_words="english",
        ngram_range=(1, 2),     # Unigrams + bigrams for better topic capture
        min_df=1,
        max_df=0.95,            # Ignore terms in >95% of docs (too common)
    )
    tfidf_matrix = vectorizer.fit_transform(texts)

    # ── Step 2: K-Means Clustering ──
    k = _determine_k(len(posts))
    kmeans = KMeans(n_clusters=k, random_state=42, n_init=10, max_iter=300)
    labels = kmeans.fit_predict(tfidf_matrix)

    # ── Step 3: Build clusters and find representatives ──
    clusters: dict[int, List[int]] = {}
    for idx, label in enumerate(labels):
        clusters.setdefault(label, []).append(idx)

    results: List[ClusterResult] = []
    for cluster_id, indices in clusters.items():
        if len(indices) < MIN_CLUSTER_SIZE:
            continue  # Discard tiny clusters

        cluster_posts_list = [posts[i] for i in indices]

        # Find the post closest to cluster centroid (most representative)
        centroid = kmeans.cluster_centers_[cluster_id]
        cluster_vectors = tfidf_matrix[indices]
        distances = np.linalg.norm(cluster_vectors.toarray() - centroid, axis=1)
        representative_idx = indices[int(np.argmin(distances))]
        representative_text = posts[representative_idx].text

        avg_engagement = sum(p.engagement for p in cluster_posts_list) / len(cluster_posts_list)

        results.append(ClusterResult(
            cluster_id=cluster_id,
            representative_text=representative_text,
            posts=cluster_posts_list,
            avg_engagement=avg_engagement,
        ))

    # Sort by engagement — higher engagement clusters first
    results.sort(key=lambda c: c.avg_engagement, reverse=True)

    logger.info(f"Cluster: {len(posts)} posts → {len(results)} clusters (k={k})")
    return results
