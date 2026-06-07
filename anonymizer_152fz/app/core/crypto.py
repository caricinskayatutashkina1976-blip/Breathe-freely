import base64
import hashlib

from cryptography.fernet import Fernet


def derive_fernet_key(secret_key: str) -> bytes:
    digest = hashlib.sha256(secret_key.encode("utf-8")).digest()
    return base64.urlsafe_b64encode(digest)


class AESCipher:
    """AES-256 (Fernet) шифрование маппингов псевдонимов для хранения в БД."""

    def __init__(self, secret_key: str):
        self._fernet = Fernet(derive_fernet_key(secret_key))

    def encrypt(self, value: str) -> str:
        return self._fernet.encrypt(value.encode("utf-8")).decode("utf-8")

    def decrypt(self, token: str) -> str:
        return self._fernet.decrypt(token.encode("utf-8")).decode("utf-8")
