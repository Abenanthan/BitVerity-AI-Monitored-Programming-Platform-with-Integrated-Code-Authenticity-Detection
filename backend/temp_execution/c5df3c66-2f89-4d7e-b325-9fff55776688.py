def lengthOfLongestSubstring(s: str) -> int:
    char_set = set()
    left = 0
    max_length = 0

    for right in range(len(s)):
        # If duplicate found, shrink window from the left
        while s[right] in char_set:
            char_set.remove(s[left])
            left += 1
        # Add current character and update max length
        char_set.add(s[right])
        max_length = max(max_length, right - left + 1)

    return max_length


import sys
_s = sys.stdin.read().rstrip('\r\n')
print(lengthOfLongestSubstring(_s))