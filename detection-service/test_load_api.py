import logging
logging.basicConfig(level=logging.INFO)
from services.fingerprint import _load_unixcoder
tokenizer, model = _load_unixcoder()
print("Result:", "Success" if tokenizer else "Failed")
