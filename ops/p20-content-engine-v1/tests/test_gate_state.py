import json
import pathlib
import tempfile
import unittest

from p20_v1.gate_state import GateError, complete_gate, first_incomplete_gate, init_packet, load_state, sha256_path, validate_state


class GateStateTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.packet = pathlib.Path(self.tmp.name) / "packet"
        self.state = init_packet(
            self.packet,
            content_id="CNT-TEST",
            topic="test topic",
            primary_type="D",
            secondary_type="F",
            type_evidence=["registry:test"],
        )

    def tearDown(self):
        self.tmp.cleanup()

    def _write(self, name, content="ok\n"):
        (self.packet / name).write_text(content, encoding="utf-8")

    def _complete_simple(self, gate, filename):
        self._write(filename)
        complete_gate(self.packet, gate)

    def test_init_locks_downstream(self):
        self.assertEqual(first_incomplete_gate(self.state), "state_overlap")
        self.assertEqual(self.state["gates"]["state_overlap"]["status"], "READY")
        self.assertEqual(self.state["gates"]["audience_reality"]["status"], "LOCKED")

    def test_cannot_skip_gate(self):
        self._write("02_audience_voice.md")
        with self.assertRaises(GateError):
            complete_gate(self.packet, "audience_reality")

    def test_author_gate_requires_explicit_status(self):
        gates = [
            ("state_overlap", "01_current_state.md"),
            ("audience_reality", "02_audience_voice.md"),
            ("case_reaction", "03_case_reaction.md"),
            ("evidence_author", "04_evidence_ledger.md"),
            ("external_benchmark", "05_benchmark.md"),
            ("problem_synthesis", "06_problem_synthesis.md"),
        ]
        for gate, file in gates:
            self._complete_simple(gate, file)
        self._write("07_author_gap.md")
        self._write("08_author_interview.md", "not completed\n")
        with self.assertRaises(GateError):
            complete_gate(self.packet, "author_gap_interview")
        self._write("08_author_interview.md", "AUTHOR_GATE_STATUS: INTERVIEW_COMPLETED\n")
        state = complete_gate(self.packet, "author_gap_interview")
        self.assertEqual(first_incomplete_gate(state), "research_delta")

    def test_source_freeze_requires_matching_sha(self):
        sequence = [
            ("state_overlap", "01_current_state.md"),
            ("audience_reality", "02_audience_voice.md"),
            ("case_reaction", "03_case_reaction.md"),
            ("evidence_author", "04_evidence_ledger.md"),
            ("external_benchmark", "05_benchmark.md"),
            ("problem_synthesis", "06_problem_synthesis.md"),
        ]
        for gate, file in sequence:
            self._complete_simple(gate, file)
        self._write("07_author_gap.md")
        self._write("08_author_interview.md", "AUTHOR_GATE_STATUS: INTERVIEW_COMPLETED\n")
        complete_gate(self.packet, "author_gap_interview")
        self._complete_simple("research_delta", "09_research_delta.md")
        self._complete_simple("central_question_thesis", "10_thesis_payoff.md")
        self._write("11_frozen_source_pack.json", '{"a":1}\n')
        self._write("11_frozen_source_pack.sha256", "bad\n")
        with self.assertRaises(GateError):
            complete_gate(self.packet, "source_freeze")
        digest = sha256_path(self.packet / "11_frozen_source_pack.json")
        self._write("11_frozen_source_pack.sha256", digest + "  11_frozen_source_pack.json\n")
        state = complete_gate(self.packet, "source_freeze")
        self.assertEqual(first_incomplete_gate(state), "narrative_strategy")

    def test_validate_rejects_downstream_pass(self):
        state = load_state(self.packet)
        state["gates"]["audience_reality"]["status"] = "PASS"
        (self.packet / "00_run_state.json").write_text(json.dumps(state), encoding="utf-8")
        with self.assertRaises(GateError):
            validate_state(self.packet)

    def _advance_to_drafts(self):
        simple = [
            ("state_overlap", "01_current_state.md"),
            ("audience_reality", "02_audience_voice.md"),
            ("case_reaction", "03_case_reaction.md"),
            ("evidence_author", "04_evidence_ledger.md"),
            ("external_benchmark", "05_benchmark.md"),
            ("problem_synthesis", "06_problem_synthesis.md"),
        ]
        for gate, file in simple:
            self._complete_simple(gate, file)
        self._write("07_author_gap.md")
        self._write("08_author_interview.md", "AUTHOR_GATE_STATUS: INTERVIEW_COMPLETED\n")
        complete_gate(self.packet, "author_gap_interview")
        self._complete_simple("research_delta", "09_research_delta.md")
        self._complete_simple("central_question_thesis", "10_thesis_payoff.md")
        self._write("11_frozen_source_pack.json", '{"a":1}\n')
        digest = sha256_path(self.packet / "11_frozen_source_pack.json")
        self._write("11_frozen_source_pack.sha256", digest + "  11_frozen_source_pack.json\n")
        complete_gate(self.packet, "source_freeze")
        self._complete_simple("narrative_strategy", "12_narrative_strategy.md")
        self._complete_simple("segment_blueprint", "13_segment_blueprint.md")

    def test_persistent_draft_must_change_and_grow(self):
        self._advance_to_drafts()
        self._write("14_script.md", "# draft\n" + "a" * 300)
        complete_gate(self.packet, "draft_level_a")
        with self.assertRaises(GateError):
            complete_gate(self.packet, "draft_level_b")
        self._write("14_script.md", "# draft\n" + "a" * 500)
        complete_gate(self.packet, "draft_level_b")
        self._write("14_script.md", "# draft\n" + "a" * 700)
        complete_gate(self.packet, "draft_level_c")
        self._write("14_script.md", "# draft\n" + "b" * 650)
        state = complete_gate(self.packet, "draft_level_d")
        self.assertEqual(first_incomplete_gate(state), "korean_quality")

    def test_korean_and_independent_eval_are_hard_gates(self):
        self._advance_to_drafts()
        for gate, n in [("draft_level_a",300),("draft_level_b",500),("draft_level_c",700),("draft_level_d",650)]:
            self._write("14_script.md", f"# {gate}\n" + gate[0] * n)
            complete_gate(self.packet, gate)
        digest = sha256_path(self.packet / "14_script.md")
        bad = {"script_sha256": digest, "evaluator_context":"FINAL_SCRIPT_ONLY", "checks":{f"KS{i:02d}":"PASS" for i in range(1,9)}}
        self._write("15_korean_quality.json", json.dumps(bad))
        with self.assertRaises(GateError):
            complete_gate(self.packet, "korean_quality")
        good = {"script_sha256": digest, "evaluator_context":"FINAL_SCRIPT_ONLY", "checks":{f"KS{i:02d}":"PASS" for i in range(1,10)}}
        self._write("15_korean_quality.json", json.dumps(good))
        complete_gate(self.packet, "korean_quality")
        bad_eval={"eligibility":"PASS","script_sha256":digest,"context_isolation":{"writer_context_shared":True,"writer_process_visible":False}}
        self._write("16_independent_eval.json", json.dumps(bad_eval))
        with self.assertRaises(GateError):
            complete_gate(self.packet, "independent_evaluation")
        good_eval={"eligibility":"PASS","script_sha256":digest,"context_isolation":{"writer_context_shared":False,"writer_process_visible":False}}
        self._write("16_independent_eval.json", json.dumps(good_eval))
        state=complete_gate(self.packet,"independent_evaluation")
        self.assertEqual(first_incomplete_gate(state),"a2_approval")


if __name__ == "__main__":
    unittest.main()
