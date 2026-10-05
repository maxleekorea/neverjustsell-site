import argparse
import json
import sys

from .gate_state import GateError, complete_gate, first_incomplete_gate, init_packet, mark_gate, validate_state


def main():
    p = argparse.ArgumentParser(description="P20 gate-enforced work packet")
    sub = p.add_subparsers(dest="command", required=True)

    s = sub.add_parser("init")
    s.add_argument("--packet-dir", required=True)
    s.add_argument("--content-id", required=True)
    s.add_argument("--topic", required=True)
    s.add_argument("--primary-type", required=True)
    s.add_argument("--secondary-type", default=None)
    s.add_argument("--type-evidence", action="append", default=[])

    s = sub.add_parser("status")
    s.add_argument("--packet-dir", required=True)

    s = sub.add_parser("complete")
    s.add_argument("--packet-dir", required=True)
    s.add_argument("--gate", required=True)
    s.add_argument("--evidence", action="append", default=[])
    s.add_argument("--note", default="")

    s = sub.add_parser("mark")
    s.add_argument("--packet-dir", required=True)
    s.add_argument("--gate", required=True)
    s.add_argument("--status", choices=["HOLD", "BLOCKED"], required=True)
    s.add_argument("--note", default="")

    args = p.parse_args()
    try:
        if args.command == "init":
            state = init_packet(
                args.packet_dir,
                content_id=args.content_id,
                topic=args.topic,
                primary_type=args.primary_type,
                secondary_type=args.secondary_type,
                type_evidence=args.type_evidence,
            )
        elif args.command == "status":
            state = validate_state(args.packet_dir)
        elif args.command == "complete":
            state = complete_gate(args.packet_dir, args.gate, evidence_refs=args.evidence, note=args.note)
        else:
            state = mark_gate(args.packet_dir, args.gate, args.status, note=args.note)
        print(json.dumps({
            "content_id": state["content_id"],
            "first_incomplete_gate": first_incomplete_gate(state),
            "state": state,
        }, ensure_ascii=False, indent=2))
    except GateError as exc:
        print(f"GATE_ERROR: {exc}", file=sys.stderr)
        raise SystemExit(2)


if __name__ == "__main__":
    main()
