import base64
import json

from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding

import frappe


class EIMSConnectorSigning:
    def _normalize_pem(self, raw_text, label):
        text = raw_text.strip()
        text = text.replace("\\n", "\n")
        begin_marker = f"-----BEGIN {label}-----"
        end_marker = f"-----END {label}-----"
        body = text.replace(begin_marker, "").replace(end_marker, "")
        body = body.replace("\n", " ")
        base64_chars = "".join(body.split())
        wrapped_lines = [base64_chars[i:i + 64] for i in range(0, len(base64_chars), 64)]
        rebuilt_pem = begin_marker + "\n" + "\n".join(wrapped_lines) + "\n" + end_marker + "\n"
        return rebuilt_pem

    def _sign_data(self, data_bytes, default_client):
        decrypted_private_key = default_client.get_password("private_key")
        certificate_text = default_client.public_certificate

        if not decrypted_private_key or not certificate_text:
            frappe.throw(
                "Private Key and Public Certificate must be configured on the "
                "default Client Data row to use HTTPS EIMS endpoints.",
                title="EIMS Configuration Error"
            )

        normalized_key_text = self._normalize_pem(decrypted_private_key, "PRIVATE KEY")

        try:
            private_key = serialization.load_pem_private_key(
                normalized_key_text.encode("utf-8"), password=None
            )
        except ValueError:
            frappe.throw(
                "Stored Private Key could not be parsed as a valid PEM key. "
                "Please re-paste the full key (including BEGIN/END lines) into "
                "the Private Key field on the default Client Data row.",
                title="EIMS Configuration Error"
            )

        signature = private_key.sign(
            data_bytes,
            padding.PKCS1v15(),
            hashes.SHA512()
        )
        signature_b64 = base64.b64encode(signature).decode()
        certificate_b64 = base64.b64encode(certificate_text.encode("utf-8")).decode()

        return signature_b64, certificate_b64

    def _build_signed_envelope(self, json_string, default_client):
        data_bytes = json_string.encode("utf-8")
        signature_b64, certificate_b64 = self._sign_data(data_bytes, default_client)

        envelope = {
            "request": json.loads(json_string),
            "signature": signature_b64,
            "certificate": certificate_b64
        }
        envelope_string = json.dumps(envelope, separators=(",", ":"), ensure_ascii=False)
        return envelope_string

    def _build_signed_item(self, payload_dict, default_client):
        json_string = json.dumps(payload_dict, separators=(",", ":"))
        data_bytes = json_string.encode("utf-8")
        signature_b64, certificate_b64 = self._sign_data(data_bytes, default_client)

        return {
            "request": json.loads(json_string),
            "signature": signature_b64,
            "certificate": certificate_b64
        }
