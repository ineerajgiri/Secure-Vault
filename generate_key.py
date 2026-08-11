"""
Generate a Fernet key for .env (FERNET_KEY).

Standalone — does not import Django, models, or the vault encryption module.
Requires only: pip install cryptography

Usage (from project root):
    python generate_key.py

Copy the printed value into .env as:
    FERNET_KEY=<pasted-value>

Keep this key secret. Losing it means you cannot decrypt existing files.
Rotating it without re-encrypting files will break decryption.
"""

from cryptography.fernet import Fernet


def main() -> None:
    key = Fernet.generate_key().decode("utf-8")
    print("Add this line to your .env file:\n")
    print(f"FERNET_KEY={key}")


if __name__ == "__main__":
    main()
