from app.core.crypto import AESCipher


def test_aes_roundtrip():
    cipher = AESCipher("test-secret-key-32-characters!!")
    original = "Иван Петров"
    encrypted = cipher.encrypt(original)
    assert encrypted != original
    assert cipher.decrypt(encrypted) == original
