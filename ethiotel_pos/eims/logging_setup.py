import logging
import os

import frappe


def get_eims_logger():
    logger = logging.getLogger("eims_connector")
    if not logger.handlers:
        log_dir = frappe.utils.get_site_path("logs")
        os.makedirs(log_dir, exist_ok=True)
        log_path = os.path.join(log_dir, "eims_connector.log")
        handler = logging.FileHandler(log_path)
        formatter = logging.Formatter("%(asctime)s [%(levelname)s] %(message)s")
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        logger.setLevel(logging.DEBUG)
        logger.propagate = False
    return logger


eims_logger = get_eims_logger()
