import json
import sys
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(HERE))

import router
import shadow_runner


class ShadowExecutionTests(unittest.TestCase):
    def setUp(self):
        self.base = json.loads((HERE / 'fixtures/job-20260927-0001.json').read_text(encoding='utf-8'))
        self.registry = json.loads((HERE / 'fixtures/action-registry.json').read_text(encoding='utf-8'))

    def command(self, action, target, payload, precondition=None, approval='A2'):
        c = router.normalize_command(self.base)
        c['job_id'] = 'JOB-TEST-SHADOW'
        c['action'] = action
        c['target_ref'] = target
        c['approval_level'] = approval
        c['mode'] = 'SHADOW_EXECUTION'
        c['idempotency_key'] = f'test|{action}|1'
        c['payload_json'] = payload
        c['precondition_json'] = precondition or {}
        c['status'] = 'VALIDATED'
        c['command_hash'] = router.command_hash(c)
        c['shadow_ir'] = router.shadow_ir(c)
        return c

    def cloudflare_command(self, files=None, approval='A3', precondition=None):
        return self.command(
            'CLOUDFLARE.CACHE.PURGE_URLS',
            'neverjustsell.com',
            {'files': files or ['https://neverjustsell.com/', 'https://classroom.neverjustsell.com/knowledge']},
            precondition if precondition is not None else {
                'zone_identity_required': True,
                'provider_ack_required': True,
                'edge_probe_required': True,
            },
            approval=approval,
        )

    def test_cloudflare_plan_is_not_sent(self):
        result = shadow_runner.run_shadow(self.cloudflare_command(), self.registry)
        self.assertEqual(result['status'], 'SUCCEEDED')
        plan = result['readback_json']['request_plan']
        self.assertFalse(plan['network_call_performed'])
        self.assertEqual(plan['transport_state'], 'NOT_SENT')
        self.assertEqual(plan['request']['method'], 'POST')
        self.assertIn('/purge_cache', plan['request']['url_template'])
        self.assertEqual(plan['required_permission'], 'Cache Purge')
        self.assertEqual(plan['mutability_semantics'], 'WRITE_IRREVERSIBLE')
        self.assertEqual(result['canonical_effect'], 'NONE')

    def test_cloudflare_preflight_verifies_zone_identity(self):
        result = shadow_runner.run_shadow(self.cloudflare_command(), self.registry)
        plan = result['readback_json']['request_plan']
        self.assertEqual(plan['preflight']['request']['method'], 'GET')
        assertions = plan['preflight']['required_assertions']
        self.assertIn({'path': 'result.name', 'op': 'EQ', 'value': 'neverjustsell.com'}, assertions)
        self.assertIn({'path': 'result.status', 'op': 'EQ', 'value': 'active'}, assertions)

    def test_cloudflare_provider_ack_is_not_eviction_proof(self):
        result = shadow_runner.run_shadow(self.cloudflare_command(), self.registry)
        plan = result['readback_json']['request_plan']
        self.assertEqual(plan['provider_ack']['required_http_status'], 200)
        self.assertEqual(plan['provider_ack']['meaning'], 'REQUEST_ACCEPTED_NOT_EVICTION_PROOF')
        self.assertFalse(plan['postcondition']['global_eviction_proof'])
        self.assertEqual(plan['postcondition']['inconclusive_state'], 'UNVERIFIED')
        self.assertEqual(plan['postcondition']['required_assertion']['value'], 'HIT')

    def test_cloudflare_has_no_false_rollback(self):
        result = shadow_runner.run_shadow(self.cloudflare_command(), self.registry)
        rollback = result['readback_json']['request_plan']['rollback']
        self.assertFalse(rollback['supported'])
        self.assertEqual(rollback['recovery'], 'ORIGIN_REFILL_OR_CONTROLLED_REWARM_ONLY')

    def test_cloudflare_a2_is_blocked(self):
        result = shadow_runner.run_shadow(self.cloudflare_command(approval='A2'), self.registry)
        self.assertEqual(result['status'], 'BLOCKED')
        self.assertEqual(result['error_code'], 'APPROVAL_TOO_LOW')

    def test_cloudflare_precondition_is_required(self):
        result = shadow_runner.run_shadow(self.cloudflare_command(precondition={}), self.registry)
        self.assertEqual(result['status'], 'BLOCKED')
        self.assertEqual(result['error_code'], 'PRECONDITION_REQUIRED')

    def test_cloudflare_off_domain_rejected(self):
        c = self.cloudflare_command(files=['https://example.com/'])
        result = shadow_runner.run_shadow(c, self.registry)
        self.assertEqual(result['status'], 'REJECTED')
        self.assertEqual(result['error_code'], 'CLOUDFLARE_HOST_NOT_ALLOWED')

    def test_cloudflare_purge_everything_not_in_schema(self):
        c = self.command(
            'CLOUDFLARE.CACHE.PURGE_URLS',
            'neverjustsell.com',
            {'purge_everything': True},
            {'zone_identity_required': True},
            approval='A3',
        )
        result = shadow_runner.run_shadow(c, self.registry)
        self.assertEqual(result['status'], 'REJECTED')
        self.assertEqual(result['error_code'], 'CLOUDFLARE_PAYLOAD_FIELDS_INVALID')

    def test_cafe24_plan_is_not_sent_and_version_pinned(self):
        c = self.command(
            'CAFE24.PRODUCT_STATUS.UPDATE',
            'P30_CAFE24',
            {'shop_no': 1, 'display': 'T', 'selling': 'T', 'api_version': '2026-09-01'},
            {'before_state_read_required': True, 'rollback_required': True},
        )
        result = shadow_runner.run_shadow(c, self.registry)
        self.assertEqual(result['status'], 'SUCCEEDED')
        plan = result['readback_json']['request_plan']
        self.assertFalse(plan['network_call_performed'])
        self.assertEqual(plan['request']['method'], 'PUT')
        self.assertEqual(plan['request']['headers_template']['X-Cafe24-Api-Version'], '2026-09-01')
        self.assertEqual(plan['request']['body']['request'], {'display': 'T', 'selling': 'T'})
        self.assertEqual(plan['required_scopes'], ['mall.read_product', 'mall.write_product'])
        self.assertEqual(plan['mutability_semantics'], 'WRITE_REVERSIBLE')

    def test_cafe24_before_state_is_exact_product_read(self):
        c = self.command(
            'CAFE24.PRODUCT_STATUS.UPDATE',
            'P30_CAFE24',
            {'shop_no': 1, 'display': 'F'},
            {'before_state_read_required': True, 'rollback_required': True},
        )
        result = shadow_runner.run_shadow(c, self.registry)
        before = result['readback_json']['request_plan']['before_state']
        self.assertEqual(before['request']['method'], 'GET')
        self.assertIn('/api/v2/admin/products/${CAFE24_SHADOW_PRODUCT_NO}?shop_no=1', before['request']['url_template'])
        self.assertEqual(before['snapshot_fields'], ['product_no', 'display'])
        self.assertEqual(before['failure_state'], 'BLOCKED')

    def test_cafe24_postcondition_requires_exact_match(self):
        c = self.command(
            'CAFE24.PRODUCT_STATUS.UPDATE',
            'P30_CAFE24',
            {'display': 'F', 'selling': 'T'},
            {'before_state_read_required': True, 'rollback_required': True},
        )
        result = shadow_runner.run_shadow(c, self.registry)
        post = result['readback_json']['request_plan']['postcondition']
        self.assertEqual(post['success_rule'], 'ALL_EXPECTED_FIELDS_EXACT_MATCH')
        self.assertEqual(post['expected_fields'], {'product.display': 'F', 'product.selling': 'T'})
        self.assertEqual(post['failure_state'], 'UNVERIFIED')

    def test_cafe24_rollback_uses_before_snapshot(self):
        c = self.command(
            'CAFE24.PRODUCT_STATUS.UPDATE',
            'P30_CAFE24',
            {'display': 'F', 'selling': 'T'},
            {'before_state_read_required': True, 'rollback_required': True},
        )
        result = shadow_runner.run_shadow(c, self.registry)
        rollback = result['readback_json']['request_plan']['rollback']
        self.assertTrue(rollback['supported'])
        self.assertEqual(rollback['source'], 'BEFORE_STATE_SNAPSHOT')
        self.assertEqual(
            rollback['request']['body']['request'],
            {'display': '${BEFORE_STATE.display}', 'selling': '${BEFORE_STATE.selling}'},
        )
        self.assertEqual(rollback['verification']['expected'], 'MATCH_BEFORE_STATE_SNAPSHOT')

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
            {'before_state_read_required': True, 'rollback_required': True},
        )
        result = shadow_runner.run_shadow(c, self.registry)
        self.assertEqual(result['status'], 'REJECTED')
        self.assertEqual(result['error_code'], 'DISPLAY_INVALID')

    def test_base_router_still_cannot_execute_shadow_write(self):
        c = self.cloudflare_command()
        with self.assertRaises(router.Block):
            router.validate_action(c, self.registry, 'SHADOW_EXECUTION')

    def test_shadow_phase_is_mandatory(self):
        c = self.cloudflare_command()
        c['mode'] = 'ROUND_TRIP'
        c['command_hash'] = router.command_hash(c)
        c['shadow_ir'] = router.shadow_ir(c)
        result = shadow_runner.run_shadow(c, self.registry)
        self.assertEqual(result['status'], 'BLOCKED')
        self.assertEqual(result['error_code'], 'SHADOW_PHASE_REQUIRED')

    def test_mutability_contract_mismatch_is_rejected(self):
        c = self.command(
            'CAFE24.PRODUCT_STATUS.UPDATE',
            'P30_CAFE24',
            {'display': 'F'},
            {'before_state_read_required': True, 'rollback_required': True},
        )
        registry = [dict(r) for r in self.registry]
        for row in registry:
            if row['action'] == 'CAFE24.PRODUCT_STATUS.UPDATE':
                row['mutability'] = 'WRITE_IRREVERSIBLE'
        result = shadow_runner.run_shadow(c, registry)
        self.assertEqual(result['status'], 'REJECTED')
        self.assertEqual(result['error_code'], 'SHADOW_MUTABILITY_MISMATCH')


if __name__ == '__main__':
    unittest.main()
