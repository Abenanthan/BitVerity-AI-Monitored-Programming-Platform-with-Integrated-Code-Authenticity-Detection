import asyncio
import sys
sys.path.append("/app")

from services.fingerprint import get_code_embedding

code = "def twoSum(nums, target): return [0, 1]"
emb = get_code_embedding(code)

if emb is not None:
    print(f"✅ Fingerprinting works! Embedding shape: {emb.shape}")
else:
    print("❌ Fingerprinting returned None!")
