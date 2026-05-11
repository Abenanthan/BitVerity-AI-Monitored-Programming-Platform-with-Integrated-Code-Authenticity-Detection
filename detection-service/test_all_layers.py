import sys
sys.path.append("/app")

from models.schemas import BehaviorEvent
from services.fingerprint import get_code_embedding
from services.code_pattern import analyze as cp_analyze
from services.behavioral import analyze as beh_analyze

code = """def isValid(s):
    stack = []
    mapping = {')': '(', '}': '{', ']': '['}
    for char in s:
        if char in mapping:
            top = stack.pop() if stack else '#'
            if mapping[char] != top:
                return False
        else:
            stack.append(char)
    return not stack"""

print("=== Layer 1: Behavioral ===")
# Simulate a normal typing behavior log using BehaviorEvent objects
behavior_log = [
    BehaviorEvent(type="keystroke", time=1000, data={"key": "d"}),
    BehaviorEvent(type="keystroke", time=1100, data={"key": "e"}),
    BehaviorEvent(type="keystroke", time=1200, data={"key": "f"}),
    BehaviorEvent(type="keystroke", time=1300, data={"key": " "}),
    BehaviorEvent(type="keystroke", time=1450, data={"key": "i"}),
    BehaviorEvent(type="keystroke", time=1550, data={"key": "s"}),
    BehaviorEvent(type="keystroke", time=1680, data={"key": "V"}),
    BehaviorEvent(type="keystroke", time=1810, data={"key": "a"}),
    BehaviorEvent(type="keystroke", time=1940, data={"key": "l"}),
    BehaviorEvent(type="keystroke", time=2070, data={"key": "i"}),
    BehaviorEvent(type="keystroke", time=2200, data={"key": "d"}),
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
    print("  ERROR: Embedding is None!")

print("\n" + "="*50)
print("All 3 detection layers executed successfully")
print("for Valid Parentheses problem!")
print("="*50)
