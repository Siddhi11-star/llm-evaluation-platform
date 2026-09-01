"""
Verification script for Judge Agent pairwise comparison.
Tests 5 distinct scenarios against http://127.0.0.1:8002/judge/compare.
"""

import urllib.request
import json
import time
import sys

BASE_URL = "http://127.0.0.1:8002/judge/compare"

test_cases = [
    {
        "case_id": "Case 1: Clearly correct A vs clearly wrong B",
        "prompt": "Give me Python code for a palindrome number.",
        "model_a": "Claude 3.5 Sonnet",
        "model_b": "GPT-4o",
        "response_a": "def is_palindrome(n):\n    if n < 0:\n        return False\n    return str(n) == str(n)[::-1]\n\nprint(is_palindrome(121)) # True\nprint(is_palindrome(-121)) # False",
        "response_b": "num = int(input('Enter number: '))\nif num % 2 == 0:\n    print('Even')\nelse:\n    print('Odd')",
        "judge_model": "gpt-oss:120b-cloud"
    },
    {
        "case_id": "Case 2: Clearly wrong A vs clearly correct B",
        "prompt": "Write Python code to calculate the factorial of a non-negative integer n.",
        "model_a": "GPT-4o",
        "model_b": "Claude 3.5 Sonnet",
        "response_a": "def factorial(n):\n    return str(n) == str(n)[::-1] # checks palindrome",
        "response_b": "def factorial(n):\n    if n < 0:\n        raise ValueError('n must be non-negative')\n    if n in (0, 1):\n        return 1\n    result = 1\n    for i in range(2, n + 1):\n        result *= i\n    return result\n\nprint(factorial(5)) # 120",
        "judge_model": "gpt-oss:120b-cloud"
    },
    {
        "case_id": "Case 3: Both correct but different styles/depth",
        "prompt": "Optimize this Python function for high-throughput string deduplication while preserving order:\n\ndef dedupe(items):\n    res = []\n    for x in items:\n        if x not in res:\n            res.append(x)\n    return res",
        "model_a": "Gemini 2.0 Flash",
        "model_b": "DeepSeek V3",
        "response_a": "def dedupe(items):\n    # O(N) using dict.fromkeys to preserve insertion order in Python 3.7+\n    return list(dict.fromkeys(items))\n\n# Complexity:\n# - Time: O(N)\n# - Space: O(N) dict overhead",
        "response_b": "def dedupe(items):\n    seen = set()\n    seen_add = seen.add\n    return [x for x in items if not (x in seen or seen_add(x))]\n\n# Technical breakdown:\n# - Set lookup O(1) with local method binding `seen_add`\n# - Preserves order with list comprehension",
        "judge_model": "gpt-oss:120b-cloud"
    },
    {
        "case_id": "Case 4: Both partially correct / flawed edge cases",
        "prompt": "Write a Python function to check if a string is a valid IPv4 address without external libraries.",
        "model_a": "Llama 3.3 70B",
        "model_b": "Mistral Large 2",
        "response_a": "def is_valid_ipv4(ip):\n    parts = ip.split('.')\n    if len(parts) != 4:\n        return False\n    return all(p.isdigit() and 0 <= int(p) <= 255 for p in parts)",
        "response_b": "def is_valid_ipv4(ip):\n    parts = ip.split('.')\n    return len(parts) == 4 and all(0 <= int(p) <= 255 for p in parts)",
        "judge_model": "gpt-oss:120b-cloud"
    },
    {
        "case_id": "Case 5: Completely unrelated response",
        "prompt": "Write Python code to sort a list of numbers in ascending order using merge sort.",
        "model_a": "Claude 3.5 Sonnet",
        "model_b": "Random Bot",
        "response_a": "def merge_sort(arr):\n    if len(arr) <= 1:\n        return arr\n    mid = len(arr) // 2\n    left = merge_sort(arr[:mid])\n    right = merge_sort(arr[mid:])\n    return merge(left, right)\n\ndef merge(left, right):\n    res = []\n    i = j = 0\n    while i < len(left) and j < len(right):\n        if left[i] <= right[j]:\n            res.append(left[i])\n            i += 1\n        else:\n            res.append(right[j])\n            j += 1\n    res.extend(left[i:])\n    res.extend(right[j:])\n    return res",
        "response_b": "The capital of France is Paris. Python was created by Guido van Rossum in the late 1980s.",
        "judge_model": "gpt-oss:120b-cloud"
    }
]

def run_all():
    results = []
    print(f"=== Starting Judge Agent Verification ({len(test_cases)} cases) ===\n")
    
    for i, tc in enumerate(test_cases, 1):
        print(f"[{i}/{len(test_cases)}] Executing: {tc['case_id']}")
        payload = {
            "prompt": tc["prompt"],
            "model_a": tc["model_a"],
            "model_b": tc["model_b"],
            "response_a": tc["response_a"],
            "response_b": tc["response_b"],
            "judge_model": tc["judge_model"]
        }
        
        t0 = time.time()
        req_data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            BASE_URL,
            data=req_data,
            headers={"Content-Type": "application/json"}
        )
        
        try:
            with urllib.request.urlopen(req, timeout=120) as resp:
                elapsed = time.time() - t0
                data = json.loads(resp.read().decode("utf-8"))
                results.append({
                    "case_id": tc["case_id"],
                    "elapsed_sec": round(elapsed, 2),
                    "result": data
                })
                safe_verdict = data.get('verdictSummary', '').encode('ascii', 'replace').decode('ascii')
                print(f"   Winner: {data.get('winnerName')} ({data.get('winnerKey')})")
                print(f"   Scores: A={data.get('overallA')} | B={data.get('overallB')} (Margin={data.get('margin')}, Confidence={data.get('confidence')}%)")
                print(f"   Verdict: {safe_verdict}")
                for f in data.get("factors", []):
                    safe_rat = f.get('rationale', '').encode('ascii', 'replace').decode('ascii')
                    print(f"     - {f['label']}: A={f['scoreA']} vs B={f['scoreB']} (Winner: {f['winner']}) | {safe_rat}")
                print(f"   Completed in {elapsed:.2f}s\n")
        except Exception as e:
            print(f"   ERROR: {e}\n")
            results.append({
                "case_id": tc["case_id"],
                "error": str(e)
            })

    with open("judge_verification_results.json", "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)

    print("=== Verification Finished! Results saved to judge_verification_results.json ===")

if __name__ == "__main__":
    run_all()
