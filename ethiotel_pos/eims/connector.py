from .auth import EIMSConnectorAuth
from .base import EIMSConnectorBase
from .callback import EIMSConnectorCallback
from .document_number import EIMSConnectorDocNum
from .payload import EIMSConnectorPayload
from .signing import EIMSConnectorSigning
from .submit import EIMSConnectorSubmit


class EIMSConnector(
    EIMSConnectorBase,
    EIMSConnectorSigning,
    EIMSConnectorAuth,
    EIMSConnectorDocNum,
    EIMSConnectorPayload,
    EIMSConnectorSubmit,
    EIMSConnectorCallback,
):
    """MoR / EIRMS connector for Ethiopian Telecom POS.
    """
