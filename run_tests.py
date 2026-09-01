import urllib.request
import json
import time

test_cases = [
    {
        "id": "Test 1 — Correct answer",
        "task_name": "palindrome number",
        "prompt_input": "give me python code for palindrome number",
        "model_output": "def is_palindrome(n):\n    if n < 0:\n        return False\n    s = str(n)\n    return s == s[::-1]\n\nprint(is_palindrome(121))\nprint(is_palindrome(123))",
        "target_model": "claude-3.5-sonnet",
        "judge_model": "gpt-oss:120b-cloud"
    },
    {
        "id": "Test 2 — Completely wrong answer",
        "task_name": "palindrome number",
        "prompt_input": "give me python code for palindrome number",
        "model_output": 'num = int(input("Enter a number: "))\n\nif num % 2 == 0:\n    print("Even")\nelse:\n    print("Odd")',
        "target_model": "claude-3.5-sonnet",
        "judge_model": "gpt-oss:120b-cloud"
    },
    {
        "id": "Test 3 — Partially correct / flawed answer",
        "task_name": "palindrome number",
        "prompt_input": "give me python code for palindrome number",
        "model_output": "def palindrome(n):\n    return str(n) == str(n)[::-1]\n\nprint(palindrome(121))",
        "target_model": "claude-3.5-sonnet",
        "judge_model": "gpt-oss:120b-cloud"
    },
    {
        "id": "Test 4 — Weird prompt/output mismatch",
        "task_name": "calculate factorial",
        "prompt_input": "write Python code to calculate factorial of a number",
        "model_output": "def is_palindrome(n):\n    return str(n) == str(n)[::-1]",
        "target_model": "claude-3.5-sonnet",
        "judge_model": "gpt-oss:120b-cloud"
    },
    {
        "id": "Test 5 — Correct task but bad/irrelevant output",
        "task_name": "Python sorting",
        "prompt_input": "write Python code to sort a list of numbers in ascending order",
        "model_output": "The capital of France is Paris.\nPython was created by Guido van Rossum.",
        "target_model": "claude-3.5-sonnet",
        "judge_model": "gpt-oss:120b-cloud"
    },
    {
        "id": "Test 6 — Correct answer with unnecessary content",
        "task_name": "palindrome number",
        "prompt_input": "give me a simple Python function to check whether a number is a palindrome",
        "model_output": "def is_palindrome(n):\n    return str(n) == str(n)[::-1]\n\n# This function converts the number to a string and compares it\n# with its reverse.\n\nprint(is_palindrome(121))",
        "target_model": "claude-3.5-sonnet",
        "judge_model": "gpt-oss:120b-cloud"
    }
]

results = []
for tc in test_cases:
    print(f"Executing {tc['id']}...")
    payload = {
        "task_name": tc["task_name"],
        "prompt_input": tc["prompt_input"],
        "model_output": tc["model_output"],
        "target_model": tc["target_model"],
        "judge_model": tc["judge_model"]
    }
    req_data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        "http://localhost:8001/evaluations/run",
        data=req_data,
        headers={"Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            results.append({"test": tc["id"], "payload": payload, "response": data})
            print(f"-> Finished {tc['id']}: Score={data.get('score')} | Status={data.get('status')}")
    except Exception as e:
        print(f"-> Error on {tc['id']}: {e}")
        results.append({"test": tc["id"], "error": str(e)})

with open("test_validation_results.json", "w", encoding="utf-8") as f:
    json.dump(results, f, indent=2)

print("\nDone! Saved to test_validation_results.json")
