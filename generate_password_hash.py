#!/usr/bin/env python3
"""
Helper script to generate password hash for admin panel.
Usage: python generate_password_hash.py
"""
from werkzeug.security import generate_password_hash
import getpass

if __name__ == '__main__':
    print("=" * 60)
    print("Admin Password Hash Generator")
    print("=" * 60)
    print()
    
    password = getpass.getpass("Enter password: ")
    password_confirm = getpass.getpass("Confirm password: ")
    
    if password != password_confirm:
        print("\n❌ Passwords do not match!")
        exit(1)
    
    if len(password) < 8:
        print("\n⚠️  Warning: Password is less than 8 characters. Consider using a stronger password.")
        response = input("Continue anyway? (y/n): ")
        if response.lower() != 'y':
            exit(0)
    
    hash_value = generate_password_hash(password)
    
    print("\n" + "=" * 60)
    print("✅ Password hash generated successfully!")
    print("=" * 60)
    print()
    print("Add this to your .env file:")
    print(f"ADMIN_PASSWORD_HASH={hash_value}")
    print()
    print("Or set it as an environment variable:")
    print(f"export ADMIN_PASSWORD_HASH='{hash_value}'")
    print()

