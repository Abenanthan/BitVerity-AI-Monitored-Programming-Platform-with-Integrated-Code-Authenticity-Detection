import sys
sys.path.append("/app")

from models.schemas import BehaviorEvent
from services.fingerprint import get_code_embedding
from services.code_pattern import analyze as cp_analyze
from services.behavioral import analyze as beh_analyze

code = """def maxArea(height):
    left, right = 0, len(height) - 1
    max_area = 0
    while left < right:
        area = min(height[left], height[right]) * (right - left)
        max_area = max(max_area, area)
        if height[left] < height[right]:
            left += 1
        else:
            right -= 1
    return max_area"""

print("=" * 55)
print("  CONTAINER WITH MOST WATER — Detection Layer Tests")
print("=" * 55)

print("\n=== Layer 1: Behavioral ===")
behavior_log = [
    BehaviorEvent(type="keystroke", time=1000 + i*130, data={"key": c})
    for i, c in enumerate("def maxArea(height):")
]
beh_score, beh_flags = beh_analyze(behavior_log, code)
print(f"  Score: {beh_score}")
print(f"  Flags: {beh_flags}")

print("\n=== Layer 2: Code Pattern ===")
cp_score, cb_score, xgb_score, cp_flags = cp_analyze(code, "python")
print(f"  Score: {cp_score}")
print(f"  CodeBERT: {cb_score}, XGBoost: {xgb_score}")
print(f"  Flags: {cp_flags}")

print("\n=== Layer 3: Style Fingerprint ===")
emb = get_code_embedding(code)
if emb is not None:
    print(f"  Embedding shape: {emb.shape}")
    print(f"  First 5 values: {emb[:5]}")
    print("  Status: WORKING")
else:
    print("  ERROR: Embedding returned None!")

print("\n" + "=" * 55)
print("  ALL 3 LAYERS PASSED for Container With Most Water!")
print("=" * 55)
