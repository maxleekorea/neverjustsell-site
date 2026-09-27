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

    def test_ir_reproducible(self):
        self.assertEqual(router.shadow_ir(self.cmd), self.cmd['shadow_ir'])

    def test_status_does_not_change_hash(self):
        before=router.command_hash(self.cmd)
        self.cmd['status']='RUNNING'
        self.assertEqual(before, router.command_hash(self.cmd))

    def test_unknown_action_fails_closed(self):
        self.cmd['action']='BAD.ACTION'
        self.cmd['command_hash']=router.command_hash(self.cmd)
        self.cmd['shadow_ir']=router.shadow_ir(self.cmd)
        with self.assertRaises(router.Reject):
            c=router.validate_schema(self.cmd)
            router.validate_action(c,self.reg,'SHADOW_ENCODE')

    def test_write_action_blocked_in_pilot(self):
        c=dict(self.cmd)
        c['action']='P30.TEST_WORKFLOW.RUN'
        c['target_ref']='maxleekorea/neverjustsell-site'
        c['approval_level']='A2'
        c['mode']='DUAL_RUN'
        c['command_hash']=router.command_hash(c)
        c['shadow_ir']=router.shadow_ir(c)
        with self.assertRaises(router.RouterError):
            cc=router.validate_schema(c)
            router.validate_action(cc,self.reg,'DUAL_RUN')

if __name__=='__main__':
    unittest.main()
