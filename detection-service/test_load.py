try:
    from transformers import AutoTokenizer, AutoModel
    import torch
    print("transformers and torch imported successfully.")
    tokenizer = AutoTokenizer.from_pretrained("microsoft/unixcoder-base")
    model = AutoModel.from_pretrained("microsoft/unixcoder-base")
    print("UniXcoder loaded successfully.")
except Exception as e:
    print(f"Error loading: {e}")
