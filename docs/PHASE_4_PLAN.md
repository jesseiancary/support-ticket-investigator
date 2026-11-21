# Phase 4 — Investigation & Structured Reports

> **Goal:** Combine the ticket with retrieved context and ask the LLM to produce a
> **structured, schema-validated, evidence-cited** engineering investigation report —
> plus follow-up Q&A over the same context. This is where RAG becomes a product.

## Target output (contract)

```jsonc
{
  "category": "Payment Processing",
  "severity": "High",                 // Low | Medium | High | Critical
  "suspectedCause": "Payment gateway timeout",
  "evidence": [
    { "statement": "Two requests exceeded the configured timeout",
      "citation": { "chunkId": "...", "sourceType": "app_log", "documentTitle": "..." } }
  ],
  "recommendedActions": ["Check gateway availability", "Inspect retry configuration"],
  "additionalInformationNeeded": ["Transaction IDs", "Approximate failure timestamps"]
}
```

Every `evidence.citation` **must** reference a chunk that was actually retrieved.

## Learning objectives (secondary goal)

- Constructing context windows from retrieved content + instructions
- Getting reliable structured output and validating it
- Grounding answers in evidence and detecting what information is missing

## Prerequisites

- [ ] Phase 3 complete (`retrieve()` returns ranked chunks with ids)
- [ ] `OPENAI_API_KEY` configured

---

### PR 4.1 — OpenAI chat provider wrapper

**Objective:** A tested, mockable chat client.

- [ ] **Test-first:** unit tests against a **fake** chat provider asserting retry, timeout, and output passthrough (red)
- [ ] Define a `ChatProvider` interface + OpenAI implementation
- [ ] Add retry/backoff + request timeout + token/cost logging
- [ ] Provide a deterministic fake for tests/CI

**Acceptance criteria**
- [ ] Core behavior is unit-tested with no network calls
- [ ] One flagged integration test may exercise the real API

---

### PR 4.2 — Context construction

**Objective:** Assemble the prompt context from the ticket + retrieved chunks.

- [ ] **Test-first:** tests asserting the context includes the ticket, each chunk with a stable citation id, and respects a token budget (red)
- [ ] Build a context assembler: system instructions + ticket + enumerated retrieved chunks (each tagged with its `chunkId`/source)
- [ ] Enforce a token budget: drop lowest-ranked chunks if over budget (log what was dropped)
- [ ] Keep the assembler pure/testable (no network)

**Acceptance criteria**
- [ ] Each chunk in context carries an identifier the model can cite
- [ ] Over-budget contexts are trimmed deterministically from the bottom rank
- [ ] The assembler is unit-tested without the LLM

---

### PR 4.3 — Structured report generation

**Objective:** Produce a schema-valid report via structured output + validation.

- [ ] Define the `InvestigationReport` Zod schema in `packages/shared` (matches the contract above)
- [ ] **Test-first:** tests feeding a canned model response through validation, including one malformed response that triggers repair/retry (red)
- [ ] Request JSON structured output from the model constrained to the schema
- [ ] Validate with Zod; on failure, run one bounded repair attempt, then fail cleanly
- [ ] Expose `POST /api/investigate` (ticket in → report out) with Supertest coverage

**Acceptance criteria**
- [ ] Responses always conform to `InvestigationReport` or fail with a typed error
- [ ] Malformed model output is handled by the repair/retry path, not a crash
- [ ] `POST /api/investigate` returns a valid report end-to-end over seeded data

---

### PR 4.4 — Grounding & citations

**Objective:** Make evidence verifiably tied to retrieved chunks.

- [ ] **Test-first:** test asserting every `evidence.citation.chunkId` exists in the retrieved set; a fabricated citation is rejected (red)
- [ ] Post-validate the report: cross-check each citation against the retrieved chunk ids
- [ ] Drop or flag any evidence item whose citation can't be resolved
- [ ] Return the resolved citation metadata (source type, document title) with each evidence item

**Acceptance criteria**
- [ ] No report can cite a chunk that wasn't retrieved (anti-hallucination guard)
- [ ] Each surviving evidence item links back to a real source
- [ ] Citation resolution is unit-tested

---

### PR 4.5 — Missing-information detection

**Objective:** Populate `additionalInformationNeeded` from genuine gaps.

- [ ] **Test-first:** tests where sparse tickets yield specific missing-info items (e.g., transaction IDs, timestamps) (red)
- [ ] Instruct the model to list concrete missing inputs that would raise confidence
- [ ] Keep items specific and actionable (reject vague placeholders in tests where feasible)

**Acceptance criteria**
- [ ] Under-specified tickets produce concrete, useful missing-info requests
- [ ] The field is always present (possibly empty) and schema-valid

---

### PR 4.6 — Follow-up Q&A

**Objective:** Conversational exploration of causes over the same retrieved context.

- [ ] **Test-first:** Supertest spec for `POST /api/investigations/:id/followup` asserting answers stay grounded in retrieved context (red)
- [ ] Persist the investigation (ticket, retrieved chunk ids, report) so follow-ups reuse context
- [ ] Implement a follow-up endpoint that answers questions, citing the same chunk set, and can request re-retrieval if the question shifts topic
- [ ] Return citations with follow-up answers too

**Acceptance criteria**
- [ ] Follow-up answers reference retrieved evidence, not ungrounded model knowledge
- [ ] Conversation state is persisted and reloadable
- [ ] Endpoint is integration-tested over seeded data

---

### PR 4.7 — CI gate: hermetic (no-network) LLM tests

**Objective:** Now that the suite exercises an LLM, guarantee CI stays runnable
without secrets or network. **This gate is meaningful only once LLM-calling code
exists — adding it earlier would have gated nothing.**

- [ ] Ensure every LLM/embeddings test uses the fake `ChatProvider` / `EmbeddingsProvider`
- [ ] Add a CI step that runs the full suite with **no `OPENAI_API_KEY`** set (and, where feasible, network egress blocked) to prove hermeticity
- [ ] Keep the single real-API integration test behind an opt-in flag that is **excluded** from the blocking CI gate
- [ ] Document how to run the opt-in live test locally

**Acceptance criteria**
- [ ] CI passes the full investigate + follow-up suite with no API key present
- [ ] The live-API test never runs in (and never blocks) the default PR gate
- [ ] A missing key can never cause a false CI failure

---

## Definition of Done (Phase 4)

- [ ] `POST /api/investigate` returns a validated, grounded, cited report
- [ ] Citations are guaranteed to resolve to retrieved chunks
- [ ] Follow-up Q&A works and stays grounded
- [ ] LLM calls are mockable; the suite runs green without network access
- [ ] CI gates the LLM-dependent suite as hermetic (no key/network required); the live-API test stays opt-in
