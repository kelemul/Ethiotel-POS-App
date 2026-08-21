import json
import pathlib
import unittest


REPO_ROOT = pathlib.Path(__file__).resolve().parents[3]
WORKSPACE_PATH = REPO_ROOT / "ethiotel_pos" / "ethiotel_pos" / "workspace" / "pos_awesome" / "pos_awesome.json"
HOOKS_PATH = REPO_ROOT / "ethiotel_pos" / "hooks.py"
PATCHES_PATH = REPO_ROOT / "ethiotel_pos" / "patches.txt"
PATCH_PATH = "ethiotel_pos.patches.add_gift_card_to_workspace.execute"
PATCH_MODULE = "ethiotel_pos.patches.add_gift_card_to_workspace"
LEDGER_PATCH_PATH = "ethiotel_pos.patches.add_submission_ledger_to_workspace.execute"
LEDGER_PATCH_MODULE = "ethiotel_pos.patches.add_submission_ledger_to_workspace"


class TestGiftCardWorkspaceExposure(unittest.TestCase):
    def test_workspace_json_exposes_gift_card_doctype(self):
        workspace = json.loads(WORKSPACE_PATH.read_text())
        links = workspace.get("links") or []
        content = json.loads(workspace.get("content") or "[]")

        self.assertTrue(
            any(link.get("type") == "Link" and link.get("link_to") == "POS Gift Card" for link in links)
        )
        self.assertTrue(
            any(
                block.get("type") == "card" and (block.get("data") or {}).get("card_name") == "Gift Cards"
                for block in content
            )
        )

    def test_migration_chain_runs_gift_card_workspace_patch(self):
        hooks = HOOKS_PATH.read_text()
        patches = PATCHES_PATH.read_text().splitlines()

        self.assertIn(PATCH_PATH, hooks)
        self.assertIn(PATCH_MODULE, patches)

    def test_workspace_json_exposes_submission_ledger_doctype(self):
        workspace = json.loads(WORKSPACE_PATH.read_text())
        links = workspace.get("links") or []
        content = json.loads(workspace.get("content") or "[]")

        self.assertTrue(
            any(
                link.get("type") == "Link" and link.get("link_to") == "POS Invoice Submission Ledger"
                for link in links
            )
        )
        self.assertTrue(
            any(
                block.get("type") == "card"
                and (block.get("data") or {}).get("card_name") == "Submission Ledger"
                for block in content
            )
        )

    def test_migration_chain_runs_submission_ledger_workspace_patch(self):
        hooks = HOOKS_PATH.read_text()
        patches = PATCHES_PATH.read_text().splitlines()

        self.assertIn(LEDGER_PATCH_PATH, hooks)
        self.assertIn(LEDGER_PATCH_MODULE, patches)


if __name__ == "__main__":
    unittest.main()
