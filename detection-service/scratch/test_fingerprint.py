import sys
import logging

logging.basicConfig(level=logging.INFO)

# Append to sys.path so we can import services
sys.path.append('.')

from services.fingerprint import get_code_embedding

def test_fingerprint():
    code_snippet_1 = """
def hello_world():
    print("Hello, world!")
"""
    
    code_snippet_2 = """
def hello_world():
    print("Hello, Universe!")
"""

    print("Testing get_code_embedding...")
    emb_1 = get_code_embedding(code_snippet_1)
    if emb_1 is None:
        print("Failed to get embedding 1!")
        return
    else:
        print(f"Embedding 1 generated successfully. Shape: {emb_1.shape}")

    emb_2 = get_code_embedding(code_snippet_2)
    if emb_2 is None:
        print("Failed to get embedding 2!")
        return
    else:
        print(f"Embedding 2 generated successfully. Shape: {emb_2.shape}")

    from sklearn.metrics.pairwise import cosine_similarity
    import numpy as np

    vec1 = np.array(emb_1).reshape(1, -1)
    vec2 = np.array(emb_2).reshape(1, -1)
    similarity = float(cosine_similarity(vec1, vec2)[0][0])
    
    print(f"Similarity between snippet 1 and 2: {similarity:.4f}")

if __name__ == "__main__":
    test_fingerprint()
