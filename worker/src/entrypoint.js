import { WorkerEntrypoint } from "cloudflare:workers";
import productionWorker from "./production.js";
import { ensureProgramSchema } from "./program-schema.js";
import { getProgramCommunityProjection } from "./program-access.js";

export class CommunityAuthRpc extends WorkerEntrypoint {
  async fetch(request) {
    return productionWorker.fetch(request, this.env, this.ctx);
  }

  async communityAccessHealth() {
    return {
      ok: true,
      runtime: "community-auth-rpc-v1"
    };
  }

  async getCommunityIdentity(memberId) {
    const normalized = String(memberId || "").trim();
    if (!normalized || normalized.length > 128) {
      throw new Error("invalid_member_id");
    }

    const projection = await getProgramCommunityProjection(
      this.env,
      normalized,
      { syncPurchases: true }
    );
    return {
      ok: true,
      member_id: normalized,
      ...projection
    };
  }

  async getPaymentE2ECommunityIdentity() {
    if (!this.env.COURSE_DB) {
      return { ok: false, error: "course_db_binding_missing" };
    }

    await ensureProgramSchema(this.env);
    const initial = await this.env.COURSE_DB.prepare(
      "SELECT member_id FROM program_enrollments " +
      "WHERE run_id='system-check-payment-program-run' AND source='purchase' " +
      "ORDER BY updated_at DESC LIMIT 1"
    ).first();

    const memberId = String(initial?.member_id || "").trim();
    if (!memberId) {
      return { ok: false, error: "payment_e2e_member_not_found" };
    }

    const projection = await getProgramCommunityProjection(
      this.env,
      memberId,
      { syncPurchases: true }
    );
    const current = await this.env.COURSE_DB.prepare(
      "SELECT status,source_order_id,updated_at FROM program_enrollments " +
      "WHERE run_id='system-check-payment-program-run' AND member_id=? LIMIT 1"
    ).bind(memberId).first();

    return {
      ok: true,
      member_id: memberId,
      enrollment_status: current?.status || null,
      source_order_present: Boolean(current?.source_order_id),
      ...projection
    };
  }
}

export default productionWorker;
