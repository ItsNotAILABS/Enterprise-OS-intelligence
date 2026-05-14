/**
 * PROTO-018: Clean Internet Protocol (CIP)  (Medina)
 *
 * Internal protocol for sovereign "clean internet" traffic governance.
 * Creates explicit allow/block/quarantine decisions using:
 * - Zone-level policies
 * - Pattern-level sanitization rules
 * - Provenance-weighted trust scoring
 *
 * Ring: Sovereign Ring | Organism placement: Internal infrastructure protocol
 * Wire: intelligence-wire/cip
 */

const PHI = 1.618033988749895;
const PHI_INV = 0.618033988749895;

const DEFAULT_ZONE = 'default';
const DEFAULT_MIN_TRUST = PHI_INV;

class CleanInternetProtocol {
  constructor(config = {}) {
    this.protocolId = 'PROTO-018';
    this.name = 'Clean Internet Protocol';
    this.version = '1.0.0';
    this.bootTime = Date.now();

    this.zones = new Map();
    this.decisions = [];
    this.maxDecisionHistory = Math.max(config.maxDecisionHistory || 5000, 100);

    this.createZone(DEFAULT_ZONE, {
      allowedDomains: [],
      blockedPatterns: ['malware', 'phishing', 'credential dump', 'token leak'],
      minTrustScore: DEFAULT_MIN_TRUST,
    });
  }

  createZone(zoneId, policy = {}) {
    if (!zoneId || typeof zoneId !== 'string') {
      throw new Error('zoneId must be a non-empty string');
    }

    const zonePolicy = {
      zoneId,
      allowedDomains: new Set(policy.allowedDomains || []),
      blockedPatterns: new Set(
        (policy.blockedPatterns || []).map((p) => String(p).toLowerCase())
      ),
      minTrustScore: Number.isFinite(policy.minTrustScore)
        ? Math.max(0, Math.min(1, policy.minTrustScore))
        : DEFAULT_MIN_TRUST,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.zones.set(zoneId, zonePolicy);
    return this.getZone(zoneId);
  }

  updateZone(zoneId, patch = {}) {
    const zone = this._requireZone(zoneId);
    if (Array.isArray(patch.allowedDomains)) {
      zone.allowedDomains = new Set(patch.allowedDomains);
    }
    if (Array.isArray(patch.blockedPatterns)) {
      zone.blockedPatterns = new Set(
        patch.blockedPatterns.map((p) => String(p).toLowerCase())
      );
    }
    if (Number.isFinite(patch.minTrustScore)) {
      zone.minTrustScore = Math.max(0, Math.min(1, patch.minTrustScore));
    }
    zone.updatedAt = Date.now();
    return this.getZone(zoneId);
  }

  getZone(zoneId) {
    const zone = this._requireZone(zoneId);
    return {
      zoneId: zone.zoneId,
      allowedDomains: Array.from(zone.allowedDomains),
      blockedPatterns: Array.from(zone.blockedPatterns),
      minTrustScore: zone.minTrustScore,
      createdAt: zone.createdAt,
      updatedAt: zone.updatedAt,
    };
  }

  evaluateRequest(input = {}) {
    const requestId = input.requestId || `cip-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
    const zoneId = input.zoneId || DEFAULT_ZONE;
    const actor = input.actor || 'anonymous';
    const url = String(input.url || '');
    const content = String(input.content || '');
    const provenance = input.provenance || {};

    const zone = this._requireZone(zoneId);
    const normalized = this._normalize(url, content);
    const reasons = [];
    let decision = 'allow';

    const domainAllowed = this._isAllowedDomain(normalized.domain, zone.allowedDomains);
    if (!domainAllowed) {
      reasons.push(`domain_not_allowlisted:${normalized.domain || 'unknown'}`);
      decision = 'quarantine';
    }

    const matchedPattern = this._matchBlockedPattern(normalized.combinedText, zone.blockedPatterns);
    if (matchedPattern) {
      reasons.push(`blocked_pattern:${matchedPattern}`);
      decision = 'block';
    }

    const trustScore = this._trustScore(provenance);
    if (trustScore < zone.minTrustScore) {
      reasons.push(`trust_below_threshold:${trustScore.toFixed(3)}<${zone.minTrustScore.toFixed(3)}`);
      if (decision !== 'block') decision = 'quarantine';
    }

    const record = {
      requestId,
      zoneId,
      actor,
      url,
      domain: normalized.domain,
      trustScore,
      decision,
      reasons,
      timestamp: Date.now(),
    };

    this._recordDecision(record);
    return record;
  }

  recordOutcome(requestId, outcome = {}) {
    const idx = this.decisions.findIndex((d) => d.requestId === requestId);
    if (idx === -1) {
      return { updated: false, reason: 'request_not_found' };
    }

    this.decisions[idx] = {
      ...this.decisions[idx],
      outcome: {
        status: outcome.status || 'unknown',
        note: outcome.note || '',
        at: Date.now(),
      },
    };

    return { updated: true, requestId };
  }

  status() {
    const totals = this.decisions.reduce(
      (acc, d) => {
        acc.total++;
        acc[d.decision] = (acc[d.decision] || 0) + 1;
        return acc;
      },
      { total: 0, allow: 0, quarantine: 0, block: 0 }
    );

    return {
      protocolId: this.protocolId,
      name: this.name,
      version: this.version,
      zones: this.zones.size,
      decisions: totals,
      uptimeMs: Date.now() - this.bootTime,
    };
  }

  _requireZone(zoneId) {
    if (!this.zones.has(zoneId)) {
      throw new Error(`Unknown zone: ${zoneId}`);
    }
    return this.zones.get(zoneId);
  }

  _normalize(url, content) {
    let domain = '';
    if (url) {
      try {
        domain = new URL(url).hostname.toLowerCase();
      } catch {
        domain = '';
      }
    }
    return {
      domain,
      combinedText: `${url}\n${content}`.toLowerCase(),
    };
  }

  _isAllowedDomain(domain, allowedDomains) {
    if (allowedDomains.size === 0) return true;
    if (!domain) return false;
    if (allowedDomains.has(domain)) return true;
    for (const allow of allowedDomains) {
      if (domain.endsWith(`.${allow}`)) return true;
    }
    return false;
  }

  _matchBlockedPattern(text, blockedPatterns) {
    for (const pattern of blockedPatterns) {
      if (pattern && text.includes(pattern)) {
        return pattern;
      }
    }
    return null;
  }

  _trustScore(provenance = {}) {
    const verifiedIdentity = provenance.verifiedIdentity ? PHI_INV : 0;
    const signedPayload = provenance.signedPayload ? PHI_INV * PHI_INV : 0;
    const mfa = provenance.mfa ? PHI_INV * PHI_INV * PHI_INV : 0;
    const historicalRisk = Number.isFinite(provenance.historicalRisk)
      ? Math.max(0, Math.min(1, provenance.historicalRisk))
      : 0.5;

    const score = verifiedIdentity + signedPayload + mfa + (1 - historicalRisk) * 0.2;
    return Math.max(0, Math.min(1, score));
  }

  _recordDecision(record) {
    this.decisions.push(record);
    if (this.decisions.length > this.maxDecisionHistory) {
      this.decisions.shift();
    }
  }
}

module.exports = {
  PHI,
  PHI_INV,
  DEFAULT_ZONE,
  DEFAULT_MIN_TRUST,
  CleanInternetProtocol,
};

