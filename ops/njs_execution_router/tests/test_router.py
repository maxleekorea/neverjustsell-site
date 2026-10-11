import json
import sys
import unittest
from pathlib import Path

HERE=Path(__file__).resolve().parent.parent
sys.path.insert(0,str(HERE))
import router

class RouterCoreTests(unittest.TestCase):
    def setUp(self):
        self.cmd=json.loads((HERE/'fixtures/job-20260927-0001.json').read_text(encoding='utf-8'))
        self.reg=json.loads((HERE/'fixtures/action-registry.json').read_text(encoding='utf-8'))

    def test_hash_reproducible(self):
        self.assertEqual(router.command_hash(self.cmd), self.cmd['command_hash'])

    def test_reference_ir_reproducible_and_full_hash(self):
        ir=router.shadow_ir(self.cmd)
        self.assertEqual(ir, self.cmd['shadow_ir'])
        self.assertIn(self.cmd['command_hash'], ir)
        self.assertTrue(ir.startswith('N1|C:'))

    def test_roundtrip_critical_fields(self):
        view=router.roundtrip_critical_view(self.cmd,[self.cmd])
        normalized=router.normalize_command(self.cmd)
        for field in router.CRITICAL_ROUNDTRIP_FIELDS:
            self.assertEqual(view[field], normalized[field])

    def test_reference_ir_tamper_fails_closed(self):
        tampered=self.cmd['shadow_ir'].replace('|P:P30|','|P:P20|')
        with self.assertRaises(router.Reject):
            router.resolve_reference_ir(tampered,[self.cmd])

    def test_status_does_not_change_hash(self):
        before=router.command_hash(self.cmd)
        self.cmd['status']='RUNNING'
        self.assertEqual(before, router.command_hash(self.cmd))

    def test_unknown_action_fails_closed(self):
        c=router.normalize_command(self.cmd)
        c['action']='BAD.ACTION'
        with self.assertRaises(router.Reject):
            router.validate_action(c,self.reg,'SHADOW_ENCODE')

    def test_write_action_blocked_in_pilot(self):
        c=router.normalize_command(self.cmd)
        c['action']='P30.TEST_WORKFLOW.RUN'
        c['target_ref']='maxleekorea/neverjustsell-site'
        c['approval_level']='A2'
        c['mode']='DUAL_RUN'
        with self.assertRaises(router.RouterError):
            router.validate_action(c,self.reg,'DUAL_RUN')

if __name__=='__main__':
    unittest.main()
