/**
 * NDAWG PRO — PROVIDER TERMS REGISTRY
 * Authoritative registry tracking terms of service, intellectual property,
 * retention windows, and output reuse permissions per provider and model.
 *
 * Core rule: Default DENY for all storage, caching, and model training flags.
 */

import { ProviderTermsEntry, TermVerificationStatus } from './types.ts';

export const INITIAL_PROVIDER_TERMS: ProviderTermsEntry[] = [
  {
    provider: 'Google Cloud / DeepMind',
    modelId: 'gemini-3.8-flash',
    modelVersion: '3.8-flash',
    officialDocsUrl: 'https://ai.google.dev/gemini-api/docs',
    termsUrl: 'https://ai.google.dev/terms',
    termsCheckedDate: '2026-10-27',
    train_on_output: false, // DEFAULT DENY
    cache_output: true,
    store_output: true,
    allow_knowledge_base_reuse: true,
    data_storage_conditions: 'Encrypted in transit & at rest; enterprise privacy standards.',
    retention_period_days: 30,
    privacy_and_data_handling: 'Zero training on user inputs/outputs; Google Cloud Enterprise terms.',
    license_or_legal_basis: 'Google AI Studio Commercial API Terms',
    verification_status: 'VERIFIED',
    approved_by: 'compliance_officer_apex',
    recheck_due_date: '2026-12-31'
  },
  {
    provider: 'Google Cloud / DeepMind',
    modelId: 'gemini-4-argon',
    modelVersion: '4-argon',
    officialDocsUrl: 'https://ai.google.dev/gemini-api/docs/models/gemini',
    termsUrl: 'https://ai.google.dev/terms',
    termsCheckedDate: '2026-10-27',
    train_on_output: false, // DEFAULT DENY
    cache_output: true,
    store_output: true,
    allow_knowledge_base_reuse: true,
    data_storage_conditions: 'Enterprise tier isolation; hardened STEM/coding inference sandbox.',
    retention_period_days: 30,
    privacy_and_data_handling: 'Zero human review on enterprise tier requests.',
    license_or_legal_basis: 'Google Cloud Platform Commercial Terms of Service',
    verification_status: 'VERIFIED',
    approved_by: 'compliance_officer_apex',
    recheck_due_date: '2026-12-31'
  },
  {
    provider: 'Google Cloud / DeepMind',
    modelId: 'gemini-3.1-flash-lite',
    modelVersion: '3.1-flash-lite',
    officialDocsUrl: 'https://ai.google.dev/gemini-api/docs',
    termsUrl: 'https://ai.google.dev/terms',
    termsCheckedDate: '2026-10-27',
    train_on_output: false, // DEFAULT DENY
    cache_output: true,
    store_output: true,
    allow_knowledge_base_reuse: true,
    data_storage_conditions: 'Transient cache; sub-second latency tier.',
    retention_period_days: 30,
    privacy_and_data_handling: 'Standard enterprise data isolation.',
    license_or_legal_basis: 'Google AI Studio Commercial API Terms',
    verification_status: 'VERIFIED',
    approved_by: 'compliance_officer_apex',
    recheck_due_date: '2026-12-31'
  },
  {
    provider: 'Google Cloud / DeepMind',
    modelId: 'gemini-3.8-live',
    modelVersion: '3.8-live',
    officialDocsUrl: 'https://ai.google.dev/gemini-api/docs',
    termsUrl: 'https://ai.google.dev/terms',
    termsCheckedDate: '2026-10-27',
    train_on_output: false, // DEFAULT DENY
    cache_output: false, // Ephemeral real-time audio
    store_output: true,
    allow_knowledge_base_reuse: true,
    data_storage_conditions: 'Real-time bidirectional WebSocket; zero retention on raw PCM audio stream.',
    retention_period_days: 0,
    privacy_and_data_handling: 'Ephemeral audio buffer; no biometric voice retention.',
    license_or_legal_basis: 'Google Cloud Live API Terms',
    verification_status: 'VERIFIED',
    approved_by: 'compliance_officer_apex',
    recheck_due_date: '2026-12-31'
  },
  {
    provider: 'Google Cloud / DeepMind',
    modelId: 'gemini-3.5-transcribe',
    modelVersion: '3.5-transcribe',
    officialDocsUrl: 'https://ai.google.dev/gemini-api/docs',
    termsUrl: 'https://ai.google.dev/terms',
    termsCheckedDate: '2026-10-27',
    train_on_output: false, // DEFAULT DENY
    cache_output: true,
    store_output: true,
    allow_knowledge_base_reuse: true,
    data_storage_conditions: 'Audio batch transcription with secure transient storage.',
    retention_period_days: 14,
    privacy_and_data_handling: 'Zero model training on spoken inputs.',
    license_or_legal_basis: 'Google Cloud Commercial Speech Terms',
    verification_status: 'VERIFIED',
    approved_by: 'compliance_officer_apex',
    recheck_due_date: '2026-12-31'
  },
  {
    provider: 'Google Cloud / DeepMind',
    modelId: 'gemini-nano-banana-2.1',
    modelVersion: 'nano-banana-2.1',
    officialDocsUrl: 'https://ai.google.dev/gemini-api/docs',
    termsUrl: 'https://ai.google.dev/terms',
    termsCheckedDate: '2026-10-27',
    train_on_output: false, // DEFAULT DENY
    cache_output: true,
    store_output: true,
    allow_knowledge_base_reuse: true,
    data_storage_conditions: 'Image generation buffer; SHA-256 buffer hash tracking.',
    retention_period_days: 30,
    privacy_and_data_handling: 'Watermarked SynthID outputs; no user asset training.',
    license_or_legal_basis: 'Google Imagen / Gemini Visual Terms',
    verification_status: 'VERIFIED',
    approved_by: 'compliance_officer_apex',
    recheck_due_date: '2026-12-31'
  },
  {
    provider: 'Google Cloud / DeepMind',
    modelId: 'gemini-omni-1.1-flash',
    modelVersion: 'omni-1.1-flash',
    officialDocsUrl: 'https://ai.google.dev/gemini-api/docs',
    termsUrl: 'https://ai.google.dev/terms',
    termsCheckedDate: '2026-10-27',
    train_on_output: false, // DEFAULT DENY
    cache_output: true,
    store_output: true,
    allow_knowledge_base_reuse: true,
    data_storage_conditions: 'Interactions API video processing buffer.',
    retention_period_days: 7,
    privacy_and_data_handling: 'Video frames processed in secure container sandbox.',
    license_or_legal_basis: 'Google Interactions API Terms',
    verification_status: 'VERIFIED',
    approved_by: 'compliance_officer_apex',
    recheck_due_date: '2026-12-31'
  },
  {
    provider: 'Google Cloud / DeepMind',
    modelId: 'gemini-2.5-flash',
    modelVersion: '2.5-flash-preview',
    officialDocsUrl: 'https://ai.google.dev/gemini-api/docs',
    termsUrl: 'https://ai.google.dev/terms',
    termsCheckedDate: '2026-10-15',
    train_on_output: false, // DEFAULT DENY: API customer data is not used to train Google models by default
    cache_output: true, // Authorized: Context caching supported within ephemeral TTL
    store_output: true, // Authorized: Storing user queries/outputs for customer app functionality
    allow_knowledge_base_reuse: true, // Permitted with user attribution and citation
    data_storage_conditions: 'Encrypted in transit & at rest; transient caching with explicit TTL.',
    retention_period_days: 30,
    privacy_and_data_handling: 'Customer data processed under Google Cloud Enterprise Privacy Agreement.',
    license_or_legal_basis: 'Google Cloud Platform Commercial Terms of Service',
    verification_status: 'VERIFIED',
    approved_by: 'compliance_officer_apex',
    recheck_due_date: '2026-12-15'
  },
  {
    provider: 'Google Cloud / DeepMind',
    modelId: 'gemini-2.5-pro',
    modelVersion: '2.5-pro-preview',
    officialDocsUrl: 'https://ai.google.dev/gemini-api/docs/models/gemini',
    termsUrl: 'https://ai.google.dev/terms',
    termsCheckedDate: '2026-10-15',
    train_on_output: false, // DEFAULT DENY
    cache_output: true,
    store_output: true,
    allow_knowledge_base_reuse: true,
    data_storage_conditions: 'Standard enterprise encryption; no model retraining on enterprise inputs.',
    retention_period_days: 30,
    privacy_and_data_handling: 'Zero human review on enterprise tier requests.',
    license_or_legal_basis: 'Google AI Studio Commercial API License',
    verification_status: 'VERIFIED',
    approved_by: 'compliance_officer_apex',
    recheck_due_date: '2026-12-15'
  },
  {
    provider: 'Anthropic',
    modelId: 'claude-3-5-sonnet',
    modelVersion: '20241022',
    officialDocsUrl: 'https://docs.anthropic.com',
    termsUrl: 'https://www.anthropic.com/legal/consumer-terms',
    termsCheckedDate: '2026-10-01',
    train_on_output: false, // DEFAULT DENY: Commercial API terms strictly prohibit model training
    cache_output: true, // Prompt caching supported via ephemeral server cache
    store_output: true, // Customer storage permitted
    allow_knowledge_base_reuse: true, // Permitted for customer retrieval-augmented use
    data_storage_conditions: 'Prompt caching held in memory up to 5 minutes; API data deleted after 30 days.',
    retention_period_days: 30,
    privacy_and_data_handling: 'Zero training on API inputs or outputs under commercial terms.',
    license_or_legal_basis: 'Anthropic Commercial Terms of Service',
    verification_status: 'VERIFIED',
    approved_by: 'compliance_officer_apex',
    recheck_due_date: '2026-11-30'
  },
  {
    provider: 'OpenAI',
    modelId: 'gpt-4o',
    modelVersion: '2024-08-06',
    officialDocsUrl: 'https://platform.openai.com/docs',
    termsUrl: 'https://openai.com/policies/business-terms',
    termsCheckedDate: '2026-09-20',
    train_on_output: false, // DEFAULT DENY
    cache_output: true,
    store_output: true,
    allow_knowledge_base_reuse: true,
    data_storage_conditions: 'Zero data retention option available; standard 30-day abuse monitoring.',
    retention_period_days: 30,
    privacy_and_data_handling: 'Enterprise API data not used to train OpenAI models.',
    license_or_legal_basis: 'OpenAI Business Terms of Service',
    verification_status: 'NEEDS_RECHECK', // Flagged for periodic terms recheck
    approved_by: 'compliance_officer_apex',
    recheck_due_date: '2026-10-20'
  },
  {
    provider: 'Meta (Open Weights)',
    modelId: 'llama-3.3-70b-instruct',
    modelVersion: '3.3-release',
    officialDocsUrl: 'https://llama.meta.com/docs',
    termsUrl: 'https://llama.meta.com/llama3/license',
    termsCheckedDate: '2026-10-10',
    train_on_output: true, // Permitted under Meta Llama Community License for fine-tuning derivatives
    cache_output: true,
    store_output: true,
    allow_knowledge_base_reuse: true,
    data_storage_conditions: 'Self-hosted or cloud inference provider parameters apply.',
    retention_period_days: 365,
    privacy_and_data_handling: 'Governed by local deployment host policies.',
    license_or_legal_basis: 'Meta Llama 3 Community License Agreement',
    verification_status: 'VERIFIED',
    approved_by: 'compliance_officer_apex',
    recheck_due_date: '2026-12-31'
  },
  {
    provider: 'Third-Party Unverified Scraper / Model',
    modelId: 'unverified-external-model-x',
    modelVersion: '1.0-alpha',
    officialDocsUrl: 'https://unverified-sample.org',
    termsUrl: 'https://unverified-sample.org/terms',
    termsCheckedDate: '2026-01-01',
    train_on_output: false, // MUST BE STRICT FALSE (DENY)
    cache_output: false, // MUST BE STRICT FALSE (DENY)
    store_output: false, // MUST BE STRICT FALSE (DENY)
    allow_knowledge_base_reuse: false, // MUST BE STRICT FALSE (DENY)
    data_storage_conditions: 'Terms unverified. No storage permitted.',
    retention_period_days: 0,
    privacy_and_data_handling: 'Unknown data residency and processing policies.',
    license_or_legal_basis: 'Unverified / No commercial license on file',
    verification_status: 'UNVERIFIED',
    approved_by: 'UNVERIFIED_PENDING_LEGAL_AUDIT',
    recheck_due_date: '2026-10-22'
  }
];

export class ProviderTermsRegistry {
  private registry: Map<string, ProviderTermsEntry>;

  constructor(initialEntries: ProviderTermsEntry[] = INITIAL_PROVIDER_TERMS) {
    this.registry = new Map();
    for (const entry of initialEntries) {
      this.registry.set(this.normalizeKey(entry.modelId), { ...entry });
    }
  }

  private normalizeKey(key: string): string {
    return key.toLowerCase().trim();
  }

  public getAllEntries(): ProviderTermsEntry[] {
    return Array.from(this.registry.values());
  }

  public getTerms(modelIdOrProvider: string): ProviderTermsEntry | null {
    const key = this.normalizeKey(modelIdOrProvider);
    if (this.registry.has(key)) {
      return { ...this.registry.get(key)! };
    }

    // Try finding by prefix match or provider name
    for (const [id, entry] of this.registry.entries()) {
      if (id.includes(key) || entry.provider.toLowerCase().includes(key)) {
        return { ...entry };
      }
    }

    return null;
  }

  /**
   * Evaluates if a specific action (TRAIN, CACHE, STORE, KB_REUSE) is legally permitted
   * for the given provider model.
   * STRICT DEFAULT DENY on missing or unverified terms.
   */
  public validateActionPermissions(
    modelId: string,
    actionType: 'TRAIN' | 'CACHE' | 'STORE' | 'KB_REUSE'
  ): { allowed: boolean; reason: string } {
    const entry = this.getTerms(modelId);

    // If provider is unknown in the registry, STRICT DENY
    if (!entry) {
      return {
        allowed: false,
        reason: `Provider '${modelId}' is not registered in Provider Terms Registry. Action '${actionType}' is DENIED by default.`
      };
    }

    // If terms are UNVERIFIED or EXPIRED, strict rejection for any persistent storage/training
    if (entry.verification_status === 'UNVERIFIED' || entry.verification_status === 'EXPIRED') {
      return {
        allowed: false,
        reason: `Provider terms for '${entry.modelId}' are ${entry.verification_status}. All storage, caching, and knowledge base reuse is DENIED until administrator verification.`
      };
    }

    // Check specific permission flags
    switch (actionType) {
      case 'TRAIN':
        if (!entry.train_on_output) {
          return {
            allowed: false,
            reason: `Model training on outputs from '${entry.modelId}' is strictly PROHIBITED under '${entry.license_or_legal_basis}'. Commercial API terms forbid training competing models.`
          };
        }
        return { allowed: true, reason: `Training authorized under license '${entry.license_or_legal_basis}'.` };

      case 'CACHE':
        if (!entry.cache_output) {
          return {
            allowed: false,
            reason: `Ephemeral caching of outputs from '${entry.modelId}' is disabled under current provider terms.`
          };
        }
        return { allowed: true, reason: 'Ephemeral caching authorized.' };

      case 'STORE':
        if (!entry.store_output) {
          return {
            allowed: false,
            reason: `Persistent storage of outputs from '${entry.modelId}' is prohibited by provider terms (store_output=false).`
          };
        }
        return { allowed: true, reason: 'Persistent storage authorized.' };

      case 'KB_REUSE':
        if (!entry.allow_knowledge_base_reuse) {
          return {
            allowed: false,
            reason: `Adding outputs from '${entry.modelId}' into long-term verified knowledge base is prohibited (allow_knowledge_base_reuse=false).`
          };
        }
        return { allowed: true, reason: 'Knowledge base reuse authorized with provenance citation.' };
    }
  }

  /**
   * Confirms whether provider is verified and permitted to receive user data.
   * Prevents sending data to unapproved or privacy-violating endpoints.
   */
  public checkProviderAllowedForData(modelId: string): { allowed: boolean; reason: string } {
    const entry = this.getTerms(modelId);
    if (!entry) {
      return {
        allowed: false,
        reason: `Unknown provider '${modelId}'. Data transmission blocked by Provider Terms Registry.`
      };
    }

    if (entry.verification_status === 'UNVERIFIED') {
      return {
        allowed: false,
        reason: `Provider '${entry.modelId}' terms are UNVERIFIED. Cannot dispatch user data to unverified provider.`
      };
    }

    if (entry.verification_status === 'EXPIRED') {
      return {
        allowed: false,
        reason: `Provider '${entry.modelId}' compliance verification has EXPIRED (recheck due: ${entry.recheck_due_date}). Re-audit required.`
      };
    }

    return { allowed: true, reason: `Provider verified under ${entry.license_or_legal_basis}.` };
  }

  /**
   * Updates provider terms. Requires authenticated ADMIN credential.
   * Cannot unilaterally claim user consent.
   */
  public updateTerms(
    entry: ProviderTermsEntry,
    adminToken?: string
  ): { success: boolean; error?: string } {
    if (!adminToken || adminToken !== 'NDAWG_APEX_ADMIN_AUTHORIZED_2026') {
      return {
        success: false,
        error: 'Unauthorized: Only authenticated administrator with valid compliance token can alter Provider Terms Registry.'
      };
    }

    if (!entry.modelId || !entry.provider) {
      return { success: false, error: 'Model ID and Provider are required.' };
    }

    this.registry.set(this.normalizeKey(entry.modelId), {
      ...entry,
      termsCheckedDate: new Date().toISOString().slice(0, 10)
    });

    return { success: true };
  }

  /**
   * Returns list of providers needing recheck or verification
   */
  public getPendingReviewEntries(): ProviderTermsEntry[] {
    const today = new Date().toISOString().slice(0, 10);
    return Array.from(this.registry.values()).filter(
      (entry) =>
        entry.verification_status === 'UNVERIFIED' ||
        entry.verification_status === 'NEEDS_RECHECK' ||
        entry.recheck_due_date < today
    );
  }
}
