import importlib.util
import pathlib
import sys
import types


REPO_ROOT = pathlib.Path(__file__).resolve().parents[4]


def install_offline_sync_package_stubs():
    for package_name in (
        "ethiotel_pos",
        "ethiotel_pos",
        "ethiotel_pos.api",
        "ethiotel_pos.api.offline_sync",
    ):
        package = types.ModuleType(package_name)
        package.__path__ = []
        sys.modules[package_name] = package


def load_offline_sync_common():
    spec = importlib.util.spec_from_file_location(
        "ethiotel_pos.api.offline_sync.common",
        REPO_ROOT / "ethiotel_pos" / "ethiotel_pos" / "api" / "offline_sync" / "common.py",
    )
    if spec is None:
        raise ImportError("Unable to load ethiotel_pos.api.offline_sync.common")
    if spec.loader is None:
        raise ImportError("Missing loader for ethiotel_pos.api.offline_sync.common")
    module = importlib.util.module_from_spec(spec)
    sys.modules["ethiotel_pos.api.offline_sync.common"] = module
    spec.loader.exec_module(module)
    return module
