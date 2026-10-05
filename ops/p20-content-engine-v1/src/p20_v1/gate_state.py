import datetime as dt
import hashlib
import json
import pathlib

ENGINE_VERSION = "0.2.0"

GATE_ORDER = [
    "production_type",
    "state_overlap",
    "audience_reality",
    "case_reaction",
    "evidence_author",
    "external_benchmark",
    "problem_synthesis",
    "author_gap_interview",
    "research_delta",
    "central_question_thesis",
    "source_freeze",
    "narrative_strategy",
    "segment_blueprint",
    "draft_level_a",
    "draft_level_b",
    "draft_level_c",
    "draft_level_d",
    "korean_quality",
    "independent_evaluation",
    "a2_approval",
]

REQUIRED_ARTIFACTS = {
    "state_overlap": ["01_current_state.md"],
    "audience_reality": ["02_audience_voice.md"],
    "case_reaction": ["03_case_reaction.md"],
    "evidence_author": ["04_evidence_ledger.md"],
    "external_benchmark": ["05_benchmark.md"],
    "problem_synthesis": ["06_problem_synthesis.md"],
    "author_gap_interview": ["07_author_gap.md", "08_author_interview.md"],
    "research_delta": ["09_research_delta.md"],
    "central_question_thesis": ["10_thesis_payoff.md"],
    "source_freeze": ["11_frozen_source_pack.json", "11_frozen_source_pack.sha256"],
    "narrative_strategy": ["12_narrative_strategy.md"],
    "segment_blueprint": ["13_segment_blueprint.md"],
    "draft_level_a": ["14_script.md"],
    "draft_level_b": ["14_script.md"],
    "draft_level_c": ["14_script.md"],
    "draft_level_d": ["14_script.md"],
    "korean_quality": ["15_korean_quality.json"],
    "independent_evaluation": ["16_independent_eval.json"],
    "a2_approval": ["17_a2.md"],
}

DRAFT_GATES = ["draft_level_a", "draft_level_b", "draft_level_c", "draft_level_d"]

class GateError(RuntimeError):
    pass


def now_iso():
    return dt.datetime.now(dt.timezone.utc).isoformat()


def sha256_path(path):
    p = pathlib.Path(path)
    h = hashlib.sha256()
    with p.open("rb") as f:
        for block in iter(lambda: f.read(1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()


def load_state(packet_dir):
    path = pathlib.Path(packet_dir) / "00_run_state.json"
    if not path.exists():
        raise GateError(f"Missing run state: {path}")
    return json.loads(path.read_text(encoding="utf-8"))


def save_state(packet_dir, state):
    path = pathlib.Path(packet_dir) / "00_run_state.json"
    state["updated_at"] = now_iso()
    path.write_text(json.dumps(state, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def first_incomplete_gate(state):
    for gate in GATE_ORDER:
        if state["gates"][gate]["status"] != "PASS":
            return gate
    return None


def _unlock_next(state):
    nxt = first_incomplete_gate(state)
    for gate in GATE_ORDER:
        if state["gates"][gate]["status"] == "LOCKED" and gate == nxt:
            state["gates"][gate]["status"] = "READY"
    return nxt


def init_packet(packet_dir, *, content_id, topic, primary_type, secondary_type=None, type_evidence=None):
    if primary_type not in set("ABCDEFG"):
        raise GateError("primary_type must be A-G")
    if secondary_type and secondary_type not in set("ABCDEFG"):
        raise GateError("secondary_type must be A-G")
    packet = pathlib.Path(packet_dir)
    packet.mkdir(parents=True, exist_ok=True)
    state_path = packet / "00_run_state.json"
    if state_path.exists():
        raise GateError(f"Packet already exists: {state_path}")
    gates = {}
    for gate in GATE_ORDER:
        gates[gate] = {
            "status": "LOCKED",
            "artifacts": [],
            "evidence_refs": [],
            "note": "",
            "completed_at": None,
        }
    gates["production_type"].update({
        "status": "PASS",
        "evidence_refs": list(type_evidence or []),
        "note": f"primary={primary_type}; secondary={secondary_type or '-'}",
        "completed_at": now_iso(),
    })
    gates["state_overlap"]["status"] = "READY"
    state = {
        "engine": "P20_CONTENT_ENGINE_V1",
        "engine_version": ENGINE_VERSION,
        "content_id": content_id,
        "topic": topic,
        "production_type": {"primary": primary_type, "secondary": secondary_type},
        "created_at": now_iso(),
        "updated_at": now_iso(),
        "writer_evaluator_isolation_required": True,
        "one_shot_full_draft_allowed": False,
        "persistent_draft": "14_script.md",
        "gates": gates,
    }
    save_state(packet, state)
    (packet / "14_script.md").write_text(
        f"# {content_id} Persistent Draft\n\n"
        "DRAFT_STATUS: LOCKED\n\n"
        "이 파일은 마지막에 새로 생성하지 않는다. Segment Blueprint 통과 후 Level A부터 같은 파일을 단계적으로 성장시킨다.\n",
        encoding="utf-8",
    )
    return state


def _require_artifacts(packet, gate):
    required = REQUIRED_ARTIFACTS.get(gate, [])
    missing = [name for name in required if not (packet / name).exists()]
    if missing:
        raise GateError(f"{gate}: missing required artifacts: {', '.join(missing)}")
    return required


def _validate_author_gate(packet):
    text = (packet / "08_author_interview.md").read_text(encoding="utf-8")
    valid = (
        "AUTHOR_GATE_STATUS: INTERVIEW_COMPLETED" in text
        or "AUTHOR_GATE_STATUS: EXISTING_SOURCE_COMPLETE" in text
    )
    if not valid:
        raise GateError(
            "author_gap_interview: interview artifact must declare "
            "AUTHOR_GATE_STATUS: INTERVIEW_COMPLETED or EXISTING_SOURCE_COMPLETE"
        )
    if "AUTHOR_GATE_STATUS: EXISTING_SOURCE_COMPLETE" in text and "AUTHOR_SOURCE_REF:" not in text:
        raise GateError("author_gap_interview: EXISTING_SOURCE_COMPLETE requires AUTHOR_SOURCE_REF")


def _validate_source_freeze(packet):
    source_path = packet / "11_frozen_source_pack.json"
    sha_path = packet / "11_frozen_source_pack.sha256"
    expected = sha_path.read_text(encoding="utf-8").strip().split()[0]
    actual = sha256_path(source_path)
    if expected != actual:
        raise GateError(f"source_freeze: SHA mismatch expected={expected} actual={actual}")


def _validate_korean_quality(packet, state):
    payload = json.loads((packet / "15_korean_quality.json").read_text(encoding="utf-8"))
    checks = payload.get("checks", {})
    missing = [f"KS{i:02d}" for i in range(1, 10) if checks.get(f"KS{i:02d}") != "PASS"]
    if missing:
        raise GateError("korean_quality: all KS01-KS09 must PASS; failed/missing=" + ",".join(missing))
    current_sha = sha256_path(packet / "14_script.md")
    if payload.get("script_sha256") != current_sha:
        raise GateError("korean_quality: script_sha256 does not match persistent draft")
    if payload.get("evaluator_context") != "FINAL_SCRIPT_ONLY":
        raise GateError("korean_quality: evaluator_context must be FINAL_SCRIPT_ONLY")


def _validate_independent_eval(packet, state):
    payload = json.loads((packet / "16_independent_eval.json").read_text(encoding="utf-8"))
    if payload.get("eligibility") != "PASS":
        raise GateError("independent_evaluation: eligibility must PASS")
    isolation = payload.get("context_isolation", {})
    if isolation.get("writer_context_shared") is not False:
        raise GateError("independent_evaluation: writer_context_shared must be false")
    if isolation.get("writer_process_visible") is not False:
        raise GateError("independent_evaluation: writer_process_visible must be false")
    current_sha = sha256_path(packet / "14_script.md")
    if payload.get("script_sha256") != current_sha:
        raise GateError("independent_evaluation: script_sha256 does not match persistent draft")


def _validate_a2(packet):
    text = (packet / "17_a2.md").read_text(encoding="utf-8")
    if "A2_STATUS: APPROVED" not in text:
        raise GateError("a2_approval: explicit A2_STATUS: APPROVED marker is required")


def _validate_draft_progress(packet, state, gate):
    script = packet / "14_script.md"
    digest = sha256_path(script)
    size = len(script.read_text(encoding="utf-8"))
    idx = DRAFT_GATES.index(gate)
    if idx > 0:
        prior_gate = DRAFT_GATES[idx - 1]
        prior = state["gates"][prior_gate]
        prior_sha = prior.get("script_sha256")
        prior_chars = prior.get("script_chars")
        if prior_sha == digest:
            raise GateError(f"{gate}: persistent draft did not change from {prior_gate}")
        if gate in {"draft_level_b", "draft_level_c"} and prior_chars is not None and size <= prior_chars:
            raise GateError(f"{gate}: draft must grow from prior level (prior={prior_chars}, current={size})")
    return digest, size


def complete_gate(packet_dir, gate, *, evidence_refs=None, note=""):
    packet = pathlib.Path(packet_dir)
    state = load_state(packet)
    if gate not in GATE_ORDER:
        raise GateError(f"Unknown gate: {gate}")
    current = first_incomplete_gate(state)
    if current != gate:
        raise GateError(f"Gate order violation: first incomplete gate is {current}, requested {gate}")
    if state["gates"][gate]["status"] not in {"READY", "HOLD", "BLOCKED"}:
        raise GateError(f"Gate {gate} is not completable from status={state['gates'][gate]['status']}")

    artifacts = _require_artifacts(packet, gate)
    if gate == "author_gap_interview":
        _validate_author_gate(packet)
    elif gate == "source_freeze":
        _validate_source_freeze(packet)
    elif gate in DRAFT_GATES:
        digest, size = _validate_draft_progress(packet, state, gate)
        state["gates"][gate]["script_sha256"] = digest
        state["gates"][gate]["script_chars"] = size
    elif gate == "korean_quality":
        _validate_korean_quality(packet, state)
    elif gate == "independent_evaluation":
        _validate_independent_eval(packet, state)
    elif gate == "a2_approval":
        _validate_a2(packet)

    state["gates"][gate].update({
        "status": "PASS",
        "artifacts": artifacts,
        "evidence_refs": list(evidence_refs or []),
        "note": note,
        "completed_at": now_iso(),
    })
    _unlock_next(state)
    save_state(packet, state)
    return state


def mark_gate(packet_dir, gate, status, *, note=""):
    if status not in {"HOLD", "BLOCKED"}:
        raise GateError("mark_gate supports HOLD or BLOCKED only")
    packet = pathlib.Path(packet_dir)
    state = load_state(packet)
    current = first_incomplete_gate(state)
    if current != gate:
        raise GateError(f"Gate order violation: first incomplete gate is {current}, requested {gate}")
    state["gates"][gate]["status"] = status
    state["gates"][gate]["note"] = note
    save_state(packet, state)
    return state


def validate_state(packet_dir):
    packet = pathlib.Path(packet_dir)
    state = load_state(packet)
    seen_incomplete = False
    for gate in GATE_ORDER:
        status = state["gates"][gate]["status"]
        if status == "PASS":
            if seen_incomplete:
                raise GateError(f"Invalid state: {gate}=PASS after incomplete predecessor")
        else:
            seen_incomplete = True
            if status not in {"READY", "LOCKED", "HOLD", "BLOCKED"}:
                raise GateError(f"Invalid status for {gate}: {status}")
    unlocked = [g for g in GATE_ORDER if state["gates"][g]["status"] in {"READY", "HOLD", "BLOCKED"}]
    if len(unlocked) > 1:
        raise GateError(f"More than one active gate: {unlocked}")
    current = first_incomplete_gate(state)
    if current and state["gates"][current]["status"] == "LOCKED":
        raise GateError(f"First incomplete gate is incorrectly locked: {current}")
    return state
