import string

def is_palindrome(text: str) -> bool:
    """
    Checks if a given string is a palindrome.
    
    A palindrome is a word, phrase, number, or other sequence of characters 
    that reads the same forward and backward, ignoring spaces, punctuation, and capitalization.
    
    Args:
        text: The string to check.
        
    Returns:
        True if the string is a palindrome, False otherwise.
    """
    # Remove punctuation and whitespace, and convert to lowercase
    cleaned = "".join(char.lower() for char in text if char.isalnum())
    return cleaned == cleaned[::-1]

def main():
    print("--- Palindrome Checker ---")
    test_cases = [
        "racecar",
        "A man, a plan, a canal: Panama",
        "hello",
        "No 'x' in Nixon",
        "12321",
        "12345"
    ]
    
    for case in test_cases:
        result = is_palindrome(case)
        print(f"'{case}' -> {result}")

if __name__ == "__main__":
    main()
