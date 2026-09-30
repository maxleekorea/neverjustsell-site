import argparse
import datetime as dt
import hashlib
import json
import os
import pathlib
import shutil
import sys

from jsonschema import validate

from .api import responses_create
from .naver import search as naver_search

ROOT = pathlib.Path(__file__).resolve().parents[2]

def read_text(path):
    return pathlib.Path(path).read_text(encoding="utf-8")

def read_json(path):
    return json.loads(read_text(path))

def sha256_file(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for block in iter(lambda: f.read(1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()

def write_json(path, obj):
    path = pathlib.Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

def execution_plan(mode, topic, model, fixture):
    return {
        "engine": "P20_CONTENT_ENGINE_V1",
        "engine_version": "0.1.0",
        "mode": mode,
        "topic": topic,
        "model": model or None,
        "context_isolation": {
            "conversation": None,
            "previous_response_id": None,
            "store": False,
            "writer_web_access": False,
            "evaluator_web_access": False
        },
        "source_policy": {
            "legacy_writer_runtime": "RUNTIME_DISABLED",
            "source_evidence_reuse": "ACTIVE",
            "research_web_search": mode in {"research_only", "full"},
            "naver_optional": True
        },
        "fixture": fixture or None
    }

def dry_run(args, out):
    fixture = pathlib.Path(args.fixture)
    if not fixture.exists():
        raise SystemExit(f"Fixture does not exist: {fixture}")
    dst = out / "source_pack.md"
    shutil.copyfile(fixture, dst)
    digest = sha256_file(dst)
    (out / "source_pack.sha256").write_text(digest + "  source_pack.md\n", encoding="utf-8")
    manifest = {
        "run_id": args.run_id,
        "created_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        "mode": "dry_run",
        "topic": args.topic,
        "source_pack_format": "markdown_fixture",
        "source_pack_sha256": digest,
        "openai_key_present": bool(os.environ.get("OPENAI_API_KEY")),
        "naver_credentials_present": bool(os.environ.get("NAVER_CLIENT_ID") and os.environ.get("NAVER_CLIENT_SECRET")),
        "result": "PASS",
        "note": "No external network/API calls were made."
    }
    write_json(out / "run_manifest.json", manifest)
    return manifest

def live_research(args, out):
    schema = read_json(ROOT / "schemas/source_pack.schema.json")
    research_prompt = read_text(ROOT / "prompts/research.md")
    naver = naver_search(args.naver_query or args.topic, targets=["news","blog","cafearticle"])
    discovery = json.dumps(naver, ensure_ascii=False)
    user_text = (
        f"TOPIC:\n{args.topic}\n\n"
        f"RESEARCH_CUTOFF:\n{args.research_cutoff}\n\n"
        "OPTIONAL_NAVER_DISCOVERY_RESULTS (discovery leads, not automatically verified facts):\n"
        + discovery
    )
    raw = responses_create(
        model=args.model,
        system_text=research_prompt,
        user_text=user_text,
        tools=[{"type": "web_search"}],
        json_schema=schema,
        schema_name="p20_source_pack"
    )
    pack = json.loads(raw)
    validate(instance=pack, schema=schema)
    source_path = out / "source_pack.json"
    write_json(source_path, pack)
    digest = sha256_file(source_path)
    (out / "source_pack.sha256").write_text(digest + "  source_pack.json\n", encoding="utf-8")
    return pack, digest, naver

def produce(args, out, source_text):
    protocol = read_text(ROOT / "prompts/production_hybrid_v1.md")
    common = read_text(ROOT / "prompts/common_contract.md")
    user_text = f"COMMON CONTRACT:\n{common}\n\nFROZEN SOURCE PACK:\n{source_text}"
    script = responses_create(
        model=args.model,
        system_text=protocol,
        user_text=user_text,
        tools=None,
        json_schema=None
    )
    (out / "script.md").write_text(script.strip() + "\n", encoding="utf-8")
    return script

def evaluate(args, out, source_text, script):
    schema = read_json(ROOT / "schemas/evaluation.schema.json")
    evaluator = read_text(ROOT / "prompts/evaluator.md")
    common = read_text(ROOT / "prompts/common_contract.md")
    user_text = (
        f"COMMON CONTRACT:\n{common}\n\n"
        f"FROZEN SOURCE PACK:\n{source_text}\n\n"
        f"ANONYMOUS SCRIPT:\n{script}"
    )
    raw = responses_create(
        model=args.model,
        system_text=evaluator,
        user_text=user_text,
        tools=None,
        json_schema=schema,
        schema_name="p20_script_evaluation"
    )
    result = json.loads(raw)
    validate(instance=result, schema=schema)
    write_json(out / "evaluation.json", result)
    return result

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--mode", choices=["dry_run","research_only","full"], required=True)
    p.add_argument("--topic", default="CNT-000200 regression fixture")
    p.add_argument("--content-id", default="CNT-UNASSIGNED")
    p.add_argument("--run-id", default=os.environ.get("GITHUB_RUN_ID","local"))
    p.add_argument("--model", default=os.environ.get("OPENAI_MODEL",""))
    p.add_argument("--research-cutoff", default=dt.datetime.now().astimezone().isoformat())
    p.add_argument("--naver-query", default="")
    p.add_argument("--fixture", default=str(ROOT / "fixtures/cnt-000200/source_pack.md"))
    p.add_argument("--out", default="run_output")
    args = p.parse_args()

    out = pathlib.Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    write_json(out / "execution_plan.json", execution_plan(args.mode,args.topic,args.model,args.fixture))

    if args.mode == "dry_run":
        manifest = dry_run(args,out)
        print(json.dumps(manifest,ensure_ascii=False))
        return

    pack, digest, naver = live_research(args,out)
    manifest = {
        "run_id": args.run_id,
        "content_id": args.content_id,
        "created_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        "mode": args.mode,
        "topic": args.topic,
        "model": args.model,
        "source_pack_sha256": digest,
        "naver_enabled": naver.get("enabled",False),
        "production_protocol": "HYBRID_V1",
        "writer_context_shared": False,
        "evaluator_context_shared": False
    }

    if args.mode == "research_only":
        manifest["result"] = "RESEARCH_COMPLETE"
        write_json(out / "run_manifest.json", manifest)
        print(json.dumps(manifest,ensure_ascii=False))
        return

    source_text = json.dumps(pack,ensure_ascii=False,indent=2)
    script = produce(args,out,source_text)
    evaluation = evaluate(args,out,source_text,script)
    manifest["eligibility"] = evaluation["eligibility"]
    manifest["result"] = "FULL_COMPLETE"
    manifest["script_sha256"] = sha256_file(out / "script.md")
    write_json(out / "run_manifest.json", manifest)
    print(json.dumps(manifest,ensure_ascii=False))

if __name__ == "__main__":
    main()
