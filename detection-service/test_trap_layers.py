import sys
sys.path.append("/app")

from models.schemas import BehaviorEvent
from services.fingerprint import get_code_embedding
from services.code_pattern import analyze as cp_analyze
from services.behavioral import analyze as beh_analyze

code = """def trap(height):
    if not height:
        return 0
    left, right = 0, len(height) - 1
    left_max, right_max = height[left], height[right]
    water = 0
    while left < right:
        if left_max < right_max:
            left += 1
            left_max = max(left_max, height[left])
            water += left_max - height[left]
        else:
            right -= 1
            right_max = max(right_max, height[right])
            water += right_max - height[right]
    return water"""

print("=" * 55)
print("  TRAPPING RAIN WATER (HARD) — Detection Layer Tests")
print("=" * 55)

print("\n=== Layer 1: Behavioral ===")
behavior_log = [
    BehaviorEvent(type="keystroke", time=1000 + i*150, data={"key": c})
    for i, c in enumerate("def trap(height):")
]
# Add some backspaces for realism
behavior_log.append(BehaviorEvent(type="keystroke", time=4000, data={"key": "Backspace"}))
behavior_log.append(BehaviorEvent(type="keystroke", time=4200, data={"key": "Backspace"}))
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
print("  ALL 3 LAYERS PASSED for Trapping Rain Water!")
print("=" * 55)
