# Official references

Checked while preparing this specification on 13 October 2026. Recheck versions and deployment capabilities during implementation. The UX choices, XP formulas, feature scope, collection designs, and 12 phases are original proposed product decisions. These references support the underlying platform facts, not a claim that a particular architecture is mandatory.

| Reference | Used for |
| --- | --- |
| [GPT-6.1 Sol](https://developers.openai.com/api/docs/models/gpt-6.1-sol) | Preserving the requested model; actual selection is made in the coding client |
| [OpenAI coding best practices](https://learn.chatgpt.com/docs/learn/best-practices) | Clear goals, context, constraints, and completion criteria |
| [GPT-6 prompting guidance](https://developers.openai.com/api/docs/guides/latest-model) | Workflow structure, useful autonomy, bounded delegation and verification |
| [Next.js authentication](https://nextjs.org/docs/app/guides/authentication) | Data-access authorization and minimal DTOs |
| [Next.js installation](https://nextjs.org/docs/app/getting-started/installation) | Verify supported runtime and setup during Phase 1 |
| [Next.js deployment](https://nextjs.org/docs/app/getting-started/deploying) | Node and container deployment baseline |
| [Auth.js Google provider](https://authjs.dev/reference/core/providers/google) | Google integration and callback configuration |
| [Auth.js Next.js reference](https://authjs.dev/reference/nextjs) | Check version/release status; do not assume prerelease examples are stable APIs |
| [Google OpenID Connect](https://developers.google.com/identity/openid-connect/openid-connect) | Verified identity, issuer/subject, and avoiding email as account key |
| [Atlas encryption at rest](https://www.mongodb.com/docs/atlas/security-encryption-at-rest-overview/) | Always-enabled database storage protection |
| [Atlas encryption architecture](https://www.mongodb.com/docs/atlas/architecture/current/data-encryption/) | Transit, storage, and field-level encryption distinctions |
| [MongoDB explicit CSFLE](https://www.mongodb.com/docs/manual/core/csfle/fundamentals/manual-encryption/) | Official-library explicit encryption/decryption |
| [MongoDB encryption keys](https://www.mongodb.com/docs/manual/core/csfle/fundamentals/manage-keys/) | Key vault and key management lifecycle |
| [MongoDB encryption specification](https://github.com/mongodb/specifications/blob/master/source/client-side-encryption/client-side-encryption.md) | Local-provider key requirements |
| [MongoDB Node transactions](https://www.mongodb.com/docs/drivers/node/current/crud/transactions/) | Atomic state changes and supported retry behavior |

No claim is made that this document pack validates a live deployment, guarantees security, provides institution verification, or determines applicable legal obligations. Record real configuration and verification results during the build.
