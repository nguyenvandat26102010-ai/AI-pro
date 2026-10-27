/**
 * NDAWG PRO — PART 11 / V9 UPGRADE
 * Automated Test Suite: Universal Human Knowledge & Frontier AI (Directives Part 2–5)
 *
 * Verifies:
 * - 15 Universal Knowledge Domains (A through O) with subdomains, sample topics, and coverage
 * - High-risk Domain Disclaimers (Health, Law, Engineering)
 * - 6 Open Academic & Encyclopedic Connectors (arXiv, OpenAlex, Wikipedia, World Bank, Gutenberg, Corpus)
 * - Cross-Domain Semantic Search & Language Filtering
 * - Universal RAG Engine: Matched Domains, Evidence-Grounded Passages, Academic Citations & Provenance Tiers
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { UniversalKnowledgeTaxonomy } from '../core/universalTaxonomy.ts';

describe('NDAWG PRO V9 — Universal Human Knowledge & Frontier AI Suite', () => {
  const taxonomy = new UniversalKnowledgeTaxonomy();

  // Test 1: Complete 15 Domains (A through O) Integrity
  test('V9.1: Taxonomy seeds all 15 Universal Knowledge Domains (A through O)', () => {
    const domains = taxonomy.getAllDomains();
    assert.equal(domains.length, 15, 'Taxonomy must have exactly 15 primary domains');

    const expectedCodes = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O'];
    const actualCodes = domains.map(d => d.code);
    assert.deepEqual(actualCodes, expectedCodes, 'Domains must follow exact A through O sequence');

    // Verify all domain fields are populated
    for (const d of domains) {
      assert.ok(d.id.startsWith('dom_'), `Domain ${d.code} ID must have prefix dom_`);
      assert.ok(d.name.length > 5, `Domain ${d.code} must have descriptive name`);
      assert.ok(d.englishName.length > 3, `Domain ${d.code} must have English name`);
      assert.ok(d.subdomains.length >= 3, `Domain ${d.code} must have at least 3 subdomains`);
      assert.ok(d.sampleTopics.length >= 2, `Domain ${d.code} must have sample topics`);
      assert.ok(d.supportedLanguages.length >= 2, `Domain ${d.code} must support multilingual indexing`);
      assert.ok(d.indexedRecordsCount > 0, `Domain ${d.code} must have positive indexed count`);
      assert.ok(d.coverageScore >= 50 && d.coverageScore <= 100, `Domain ${d.code} coverage must be reasonable percentage`);
    }
  });

  // Test 2: Specific Domain Identifiers & Taxonomy Requirements
  test('V9.2: Domain A (Formal Sciences) and Domain E (Computing) conform to Part 2 specifications', () => {
    const formal = taxonomy.getDomainById('dom_formal_sciences');
    assert.ok(formal, 'Domain A must exist');
    assert.equal(formal?.code, 'A');
    assert.ok(formal?.subdomains.some(s => s.includes('Toán học') || s.includes('Logic')));

    const computing = taxonomy.getDomainById('dom_computing_tech');
    assert.ok(computing, 'Domain E must exist');
    assert.equal(computing?.code, 'E');
    assert.ok(computing?.subdomains.some(s => s.includes('Trí tuệ nhân tạo') || s.includes('AI/ML')));
    assert.ok(computing?.sampleTopics.includes('Cơ chế Attention và Transformer'));
  });

  // Test 3: Domain Safety & Disclaimers on Health, Law, and Physical Infrastructure
  test('V9.3: High-risk domains (Health, Law, Engineering) carry mandatory non-fabrication disclaimers', () => {
    const health = taxonomy.getDomainById('dom_health_life');
    assert.ok(health?.disclaimer, 'Health & Life Sciences must contain explicit clinical disclaimer');
    const healthDisc = (health?.disclaimer || '').toLowerCase();
    assert.ok(healthDisc.includes('bác sĩ') || healthDisc.includes('y tế'), 'Disclaimer must mention medical review');

    const law = taxonomy.getDomainById('dom_law_governance');
    assert.ok(law?.disclaimer, 'Law & Governance must contain explicit legal counsel disclaimer');
    const lawDisc = (law?.disclaimer || '').toLowerCase();
    assert.ok(lawDisc.includes('luật sư') || lawDisc.includes('pháp lý'), 'Disclaimer must mention legal consultation');

    const engineering = taxonomy.getDomainById('dom_engineering_applied');
    assert.ok(engineering?.disclaimer, 'Engineering domain must advise physical safety validation');
  });

  // Test 4: Open Connectors Registry
  test('V9.4: Open Connectors Registry exposes 6 verified open academic & public repositories', () => {
    const connectors = taxonomy.getConnectors();
    assert.equal(connectors.length, 6, 'Must have 6 open connectors configured');

    const connectorIds = connectors.map(c => c.id);
    assert.ok(connectorIds.includes('conn_arxiv'), 'arXiv connector present');
    assert.ok(connectorIds.includes('conn_openalex'), 'OpenAlex connector present');
    assert.ok(connectorIds.includes('conn_wikipedia'), 'Wikipedia connector present');
    assert.ok(connectorIds.includes('conn_worldbank'), 'World Bank connector present');
    assert.ok(connectorIds.includes('conn_gutenberg'), 'Gutenberg connector present');
    assert.ok(connectorIds.includes('conn_user_corpus'), 'User corpus connector present');

    for (const c of connectors) {
      assert.equal(c.status, 'ONLINE', `Connector ${c.id} should report ONLINE`);
      assert.ok(c.license.length > 3, `Connector ${c.id} must declare license`);
      assert.ok(c.attribution.length > 5, `Connector ${c.id} must declare attribution`);
      assert.ok(c.rateLimitPerMin > 0, `Connector ${c.id} must have bounded rate limits`);
    }
  });

  // Test 5: Search & Multilingual Taxonomy Filter
  test('V9.5: searchDomains() performs keyword, category, topic, and language filtering', () => {
    const aiResults = taxonomy.searchDomains('Transformer');
    assert.ok(aiResults.length > 0, 'Must match computing domain for Transformer query');
    assert.equal(aiResults[0].code, 'E');

    const frenchResults = taxonomy.searchDomains('Văn học', 'Fr');
    assert.ok(frenchResults.length > 0, 'Must match Humanities or Language with French support');

    const mathResults = taxonomy.searchDomains('Định lý Fermat');
    assert.ok(mathResults.some(d => d.code === 'A'), 'Must match Formal Sciences for Fermat theorem');
  });

  // Test 6: Universal RAG Query & Citation Generation
  test('V9.6: queryUniversalRAG() generates evidence-grounded passages with academic citations and latency', () => {
    const query = 'Attention Transformer mô hình ngôn ngữ lớn LLM';
    const ragResult = taxonomy.queryUniversalRAG(query);

    assert.equal(ragResult.query, query);
    assert.ok(ragResult.matchedDomains.length >= 1, 'Must match at least 1 domain');
    assert.equal(ragResult.matchedDomains[0].code, 'E', 'Must rank Computing & Digital Technology as top match');
    assert.ok(ragResult.topPassages.length >= 1, 'Must synthesize top passages');

    const passage = ragResult.topPassages[0];
    assert.ok(passage.citation.length > 10, 'Passage must include academic citation');
    assert.ok(passage.citation.includes('NDAWG Universal Knowledge Fabric'), 'Citation must cite knowledge fabric');
    assert.ok(passage.confidence > 0.8, 'Confidence must be calibrated');
    assert.ok(['GOLD_VERIFIED', 'SILVER_VERIFIED', 'BRONZE_REVIEW'].includes(passage.verificationTier));
    assert.ok(ragResult.retrievalLatencyMs >= 0, 'Latency must be measurable');
    assert.ok(ragResult.disclaimer.length > 5, 'Must provide honest disclaimer');
  });

  // Test 7: Fallback & Graceful Degradation on Unmatched Query
  test('V9.7: queryUniversalRAG() handles arbitrary or rare queries gracefully without crashing', () => {
    const rareQuery = 'xyz123abc_unrecognized_domain_token_999';
    const result = taxonomy.queryUniversalRAG(rareQuery);

    assert.ok(result, 'Must return valid result structure even on rare tokens');
    assert.ok(result.matchedDomains.length > 0, 'Falls back to default verified domain');
    assert.ok(result.topPassages.length > 0, 'Supplies structured guidance passage');
  });
});
