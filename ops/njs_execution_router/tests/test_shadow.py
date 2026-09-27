import json
import sys
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(HERE))

import router
import shadow_runner
from shadow_adapters import ShadowAdapterError, build_shadow_request_plan


class ShadowExecutionTests(unittest.TestCase):
    def setUp(self):
        self.base = json.loads((HERE / 'fixtures/job-20260927-0001.json').read_text(encoding='utf-8'))
        self.registry = json.loads((HERE / 'fixtures/action-registry.json').read_text(encoding='utf-8'))

    def command(self, action, target, payload, precondition=None):
        c = router.normalize_command(self.base)
        c['job_id'] = 'JOB-TEST-SHADOW'
        c['action'] = action
        c['target_ref'] = target
        c['approval_level'] = 'A2'
        c['mode'] = 'SHADOW_EXECUTION'
        c['idempotency_key'] = f'test|{action}|1'
        c['payload_json'] = payload
        c['precondition_json'] = precondition or {}
        c['status'] = 'VALIDATED'
        c['command_hash'] = router.command_hash(c)
        c['shadow_ir'] = router.shadow_ir(c)
        return c

    def test_cloudflare_plan_is_not_sent(self):
        c = self.command(
            'CLOUDFLARE.CACHE.PURGE_URLS',
            'neverjustsell.com',
            {'files': ['https://neverjustsell.com/', 'https://classroom.neverjustsell.com/knowledge']},
        )
        result = shadow_runner.run_shadow(c, self.registry)
        self.assertEqual(result['status'], 'SUCCEEDED')
        plan = result['readback_json']['request_plan']
        self.assertFalse(plan['network_call_performed'])
        self.assertEqual(plan['transport_state'], 'NOT_SENT')
        self.assertEqual(plan['request']['method'], 'POST')
        self.assertIn('/purge_cache', plan['request']['url_template'])
        self.assertEqual(plan['required_permission'], 'Cache Purge')
        self.assertEqual(result['canonical_effect'], 'NONE')

    def test_cloudflare_off_domain_rejected(self):
        c = self.command(
            'CLOUDFLARE.CACHE.PURGE_URLS',
            'neverjustsell.com',
            {'files': ['https://example.com/']},
        )
        result = shadow_runner.run_shadow(c, self.registry)
        self.assertEqual(result['status'], 'REJECTED')
        self.assertEqual(result['error_code'], 'CLOUDFLARE_HOST_NOT_ALLOWED')

    def test_cloudflare_purge_everything_not_in_schema(self):
        c = self.command(
            'CLOUDFLARE.CACHE.PURGE_URLS',
            'neverjustsell.com',
            {'purge_everything': True},
        )
        result = shadow_runner.run_shadow(c, self.registry)
        self.assertEqual(result['status'], 'REJECTED')
        self.assertEqual(result['error_code'], 'CLOUDFLARE_PAYLOAD_FIELDS_INVALID')

    def test_cafe24_plan_is_not_sent_and_version_pinned(self):
        c = self.command(
            'CAFE24.PRODUCT_STATUS.UPDATE',
            'P30_CAFE24',
            {'shop_no': 1, 'display': 'T', 'selling': 'T', 'api_version': '2026-09-01'},
            {'before_state_read_required': True},
        )
        result = shadow_runner.run_shadow(c, self.registry)
        self.assertEqual(result['status'], 'SUCCEEDED')
        plan = result['readback_json']['request_plan']
        self.assertFalse(plan['network_call_performed'])
        self.assertEqual(plan['request']['method'], 'PUT')
        self.assertEqual(plan['request']['headers_template']['X-Cafe24-Api-Version'], '2026-09-01')
        self.assertEqual(plan['request']['body']['request'], {'display': 'T', 'selling': 'T'})
        self.assertEqual(plan['required_scope'], 'mall.write_product')

    def test_cafe24_precondition_is_required(self):
        c = self.command(
            'CAFE24.PRODUCT_STATUS.UPDATE',
            'P30_CAFE24',
            {'display': 'F'},
        )
        result = shadow_runner.run_shadow(c, self.registry)
        self.assertEqual(result['status'], 'BLOCKED')
        self.assertEqual(result['error_code'], 'PRECONDITION_REQUIRED')

    def test_cafe24_invalid_flag_rejected(self):
        c = self.command(
            'CAFE24.PRODUCT_STATUS.UPDATE',
            'P30_CAFE24',
            {'display': 'YES'},
            {'before_state_read_required': True},
        )
        result = shadow_runner.run_shadow(c, self.registry)
        self.assertEqual(result['status'], 'REJECTED')
        self.assertEqual(result['error_code'], 'DISPLAY_INVALID')

    def test_base_router_still_cannot_execute_shadow_write(self):
        c = self.command(
            'CLOUDFLARE.CACHE.PURGE_URLS',
            'neverjustsell.com',
            {'files': ['https://neverjustsell.com/']},
        )
        with self.assertRaises(router.Block):
            router.validate_action(c, self.registry, 'SHADOW_EXECUTION')

    def test_shadow_phase_is_mandatory(self):
        c = self.command(
            'CLOUDFLARE.CACHE.PURGE_URLS',
            'neverjustsell.com',
            {'files': ['https://neverjustsell.com/']},
        )
        c['mode'] = 'ROUND_TRIP'
        c['command_hash'] = router.command_hash(c)
        c['shadow_ir'] = router.shadow_ir(c)
        result = shadow_runner.run_shadow(c, self.registry)
        self.assertEqual(result['status'], 'BLOCKED')
        self.assertEqual(result['error_code'], 'SHADOW_PHASE_REQUIRED')


if __name__ == '__main__':
    unittest.main()
