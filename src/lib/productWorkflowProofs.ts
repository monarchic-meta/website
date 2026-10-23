export interface WorkflowCall {
  tool: string;
  arguments: Record<string, unknown>;
}

export interface ProductWorkflowProof {
  slug: string;
  title: string;
  request: string;
  calls: WorkflowCall[];
  execution: string;
  output?: Record<string, unknown>;
  expectedResult?: string;
  outputKind: "Exact deterministic output" | "Representative contract excerpt" | "Expected result";
  permission: string;
  boundary: string;
  usageExplanation: string;
}

export const productWorkflowProofs: Record<string, ProductWorkflowProof> = {
  "mcp-browserops": {
    slug: "mcp-browserops",
    title: "Open a page and return browser observations",
    request: "Check the example page and return what a browser can actually observe.",
    calls: [{
      tool: "browser_observe_url",
      arguments: {
        url: "https://example.com",
        receipt_path: "artifacts/example-observation.json",
        safety_boundaries: [
          "no credential theft",
          "no CAPTCHA bypass",
          "no stealth scraping",
          "no unrestricted automation",
          "bounded task context required",
        ],
      },
    }],
    execution: "Starts an isolated browser task, loads one bounded URL, and returns an observation receipt with the page state and runtime failures.",
    outputKind: "Representative contract excerpt",
    output: {
      contract: "browserops.observation_receipt.v1.0",
      url: "https://example.com/",
      title: "Example Domain",
      status: "observed",
      evidence: { screenshotCaptured: true, consoleErrors: 0, failedRequests: 0 },
    },
    permission: "Requires an authenticated, entitled account. The browser task receives only the bounded request context supplied for this call.",
    boundary: "BrowserOps does not bypass access controls, CAPTCHAs, or site policy. Authenticated browsing requires an approved credential flow.",
    usageExplanation: "Browser calls receive a measured runtime receipt. Allowance quantities remain unpublished until the fully allocated rate card is frozen.",
  },
  "mcp-businessmodel": {
    slug: "mcp-businessmodel",
    title: "Check the company-synthesis service before starting work",
    request: "Confirm that the business-model service and its required contracts are ready.",
    calls: [{ tool: "businessmodel_health", arguments: {} }],
    execution: "Runs the read-only hosted health contract and reports whether the synthesis workflow is ready to accept a governed request.",
    outputKind: "Representative contract excerpt",
    output: {
      contract: "businessmodel.health.v1",
      status: "ok",
      synthesisAvailable: true,
      gateReviewAvailable: true,
    },
    permission: "Requires an authenticated, entitled account. This health call uses no provider credential and writes no company state.",
    boundary: "Health confirms service readiness; it does not approve a company synthesis or open downstream execution gates.",
    usageExplanation: "The completed health call receives a measured receipt. Allowance quantities remain unpublished until the fully allocated rate card is frozen.",
  },
  "mcp-cicd": {
    slug: "mcp-cicd",
    title: "Diagnose a delivery pipeline from supplied run data",
    request: "Show me the likely bottlenecks and release risks in the demo pipeline.",
    calls: [{ tool: "diagnose_pipeline_run", arguments: {} }],
    execution: "Runs the deterministic demonstration diagnosis and returns stage, dependency, and release-gate findings without contacting a provider.",
    outputKind: "Representative contract excerpt",
    output: {
      contract: "cicd-mcp.pipeline-diagnosis.v1",
      status: "complete",
      findings: ["critical-path stage identified", "release requirement missing"],
      providerCalls: 0,
    },
    permission: "Requires an authenticated, entitled account. The demonstration call needs no GitHub, GitLab, or cloud credential.",
    boundary: "Live pipeline collection is a separate operation and requires a request-scoped read credential.",
    usageExplanation: "The diagnosis receives a measured receipt. Allowance quantities remain unpublished until the fully allocated rate card is frozen.",
  },
  "mcp-codequality": {
    slug: "mcp-codequality",
    title: "Review supplied source without cloning a repository",
    request: "Find the low-effort quality problems in this parser.",
    calls: [{
      tool: "analyze_inline_sources",
      arguments: {
        files: [{
          path: "src/parser.ts",
          content: "export function parse(raw: string) { return JSON.parse(raw); }\n",
        }],
        lowHangingFruitOnly: true,
        maxFindings: 10,
      },
    }],
    execution: "Analyzes only the supplied source payload and returns a bounded list of structured findings.",
    outputKind: "Representative contract excerpt",
    output: {
      contract: "codequality.inline-analysis.v1",
      filesAnalyzed: 1,
      findingCount: 1,
      findings: [{ path: "src/parser.ts", category: "error-handling", severity: "medium" }],
    },
    permission: "Requires an authenticated, entitled account. The call receives inline source and does not need repository or provider access.",
    boundary: "The analysis covers only the submitted files and cannot infer repository-wide behavior from missing code.",
    usageExplanation: "The completed analysis receives a measured receipt. Allowance quantities remain unpublished until the fully allocated rate card is frozen.",
  },
  "mcp-codeintel": {
    slug: "mcp-codeintel",
    title: "Map a retained codebase from its indexed structure",
    request: "Show me the components, entry points, and relationships in this repository.",
    calls: [{
      tool: "codeintel_hosted_map_v1",
      arguments: {
        tenant: "your-workspace-id",
        project: "your-project-id",
        repository: "your-repository-id",
        revision: "your-indexed-revision",
        freshness: "require-current",
        scope: ["repository"],
      },
    }],
    execution: "Reads the tenant-scoped durable index and returns a bounded component and relationship map without rebuilding or uploading state on the read path.",
    outputKind: "Representative contract excerpt",
    output: {
      schema: "codeintel.hosted-map.v1",
      status: "ready",
      summary: {
        files: 42,
        objects: 318,
        relationships: 704,
        languages: ["typescript"],
      },
      freshness: { status: "current" },
    },
    permission: "Requires an authenticated, entitled account and a tenant-scoped retained repository. Replace the example identifiers with your authorized workspace, project, repository, and indexed revision.",
    boundary: "The map reflects the retained revision and the capabilities of its language servers. It does not claim runtime coverage or semantic certainty beyond indexed source files.",
    usageExplanation: "The completed map receives a measured receipt. Allowance quantities remain unpublished until the fully allocated rate card is frozen.",
  },
  "mcp-codeprofiler": {
    slug: "mcp-codeprofiler",
    title: "Build a bounded profiling plan before running probes",
    request: "Assess this retained codebase and identify the measurements that fit the stated performance concern.",
    calls: [{
      tool: "codeprofiler_hosted_assess_v1",
      arguments: {
        tenant: "your-workspace-id",
        project: "your-project-id",
        target: "your-repository-id",
        revision: "your-source-revision",
        files: [{ path: "src/index.ts", content: "export const ready = true;\n" }],
        symptoms: ["Build latency increased after dependency changes"],
        scenario: "Representative build and startup path",
        constraints: ["Do not access production data"],
        mode: "standard",
      },
    }],
    execution: "Inspects a bounded retained source snapshot, detects the stack, and returns a measurement plan before any profiler job is dispatched.",
    outputKind: "Representative contract excerpt",
    output: {
      status: "ready",
      inventory: { languages: ["typescript"] },
      recommendedProfilers: [
        { profiler: "scc", availableForBoundedRun: true },
        { profiler: "tokei", availableForBoundedRun: true },
      ],
      confidence: 0.9,
    },
    permission: "Requires an authenticated, entitled account. Replace the example identifiers and supply source files from that revision. Assessment does not start an external profiler.",
    boundary: "Assessment recommends measurements; it does not prove a bottleneck. Approved profiling jobs remain bounded and read-only, and their tool output remains untrusted.",
    usageExplanation: "The completed assessment receives a measured receipt. Allowance quantities remain unpublished until the fully allocated rate card is frozen.",
  },
  "mcp-copydev": {
    slug: "mcp-copydev",
    title: "Find vague language before copy reaches production",
    request: "Tell me which claims in this product sentence are too vague to defend.",
    calls: [{
      tool: "copy_review_detect_vagueness",
      arguments: {
        text: "Unlock seamless growth with a powerful next-generation platform.",
        product: "Example product",
        audience: "founders",
      },
    }],
    execution: "Runs a deterministic language review and returns the vague phrases, why they are weak, and which facts would make them specific.",
    outputKind: "Representative contract excerpt",
    output: {
      contract: "copydev.vagueness-report.v1",
      verdict: "revise",
      phrases: ["seamless growth", "powerful", "next-generation"],
    },
    permission: "Requires an authenticated, entitled account. The call reads only the copy in the request.",
    boundary: "The review identifies language problems; it does not verify product claims or publish changes.",
    usageExplanation: "The completed review receives a measured receipt. Allowance quantities remain unpublished until the fully allocated rate card is frozen.",
  },
  "mcp-create-project": {
    slug: "mcp-create-project",
    title: "Check the governed scaffold service before creation",
    request: "Confirm that maintained templates and the read-only hosted profile are healthy.",
    calls: [{ tool: "create_project_health", arguments: {} }],
    execution: "Checks the hosted project-creation contract and reports template and policy readiness without creating a repository.",
    outputKind: "Representative contract excerpt",
    output: {
      contract: "create-project.health.v1",
      status: "ok",
      hostedMode: "readonly",
      templatesAvailable: true,
    },
    permission: "Requires an authenticated, entitled account. This call performs no filesystem or provider mutation.",
    boundary: "Project creation remains a separately governed operation with an explicit destination and write policy.",
    usageExplanation: "The health call receives a measured receipt. Allowance quantities remain unpublished until the fully allocated rate card is frozen.",
  },
  "mcp-leadgenerator": {
    slug: "mcp-leadgenerator",
    title: "Score a supplied account against a defined offer",
    request: "Rank this software company against the supplied hosted-MCP offer.",
    calls: [{
      tool: "score_provided_leads",
      arguments: {
        business_model_report: {
          company_name: "Example vendor",
          offerings: ["Hosted MCP operations"],
          customers: ["Software teams"],
          go_to_market_motion: ["Self-service"],
        },
        provided_organizations: [{
          company_name: "Example Systems",
          industry: "Software",
          notes: "Evaluating agent infrastructure",
        }],
        max_accounts: 1,
      },
    }],
    execution: "Scores only the supplied organization against the supplied business model and returns its fit reasons without live enrichment.",
    outputKind: "Representative contract excerpt",
    output: {
      contract: "leadgenerator.provided-lead-score.v1",
      accountCount: 1,
      accounts: [{ companyName: "Example Systems", fit: "high", evidenceSource: "provided" }],
    },
    permission: "Requires an authenticated, entitled account. The hosted read-only profile disables live enrichment for this call.",
    boundary: "A supplied-data score is research support, not proof that a person or company consented to outreach.",
    usageExplanation: "The completed score receives a measured receipt. Allowance quantities remain unpublished until the fully allocated rate card is frozen.",
  },
  "mcp-nutrition": {
    slug: "mcp-nutrition",
    title: "Calculate a dilution from explicit units",
    request: "How much of a 100 mg in 2 mL stock gives a 50 mg amount?",
    calls: [{
      tool: "nutrition_dilution",
      arguments: {
        desired: 50,
        desired_unit: "mg",
        stock_amount: 100,
        stock_unit: "mg",
        stock_volume_ml: 2,
      },
    }],
    execution: "Validates the units and applies the deterministic dilution formula to the supplied values.",
    outputKind: "Representative contract excerpt",
    output: {
      contract: "nutrition.dilution.v1",
      desiredAmount: { value: 50, unit: "mg" },
      requiredStockVolumeMl: 1,
    },
    permission: "Requires an authenticated, entitled account. The calculation uses no patient record or external provider.",
    boundary: "This is a mathematical calculation, not medical advice or a recommendation to prepare or administer a substance.",
    usageExplanation: "The calculation receives a measured receipt. Allowance quantities remain unpublished until the fully allocated rate card is frozen.",
  },
  "mcp-repo-fleet": {
    "slug": "mcp-repo-fleet",
    "title": "Browse the hosted public repository fleet",
    "request": "Show the public repositories in the hosted fleet catalog.",
    "calls": [
        {
            "tool": "repo_fleet_hosted_overview_v1",
            "arguments": {}
        }
    ],
    "execution": "Reads the embedded public fleet catalog and returns a bounded repository overview.",
    "expectedResult": "A repository count, matching public repository entries, and suggested discovery calls.",
    "permission": "Requires an authenticated, entitled account and read access.",
    "boundary": "This hosted profile exposes the public fleet catalog. It does not clone repositories, sync private source, or accept local filesystem paths.",
    "outputKind": "Expected result",
    "usageExplanation": "Usage is recorded for each operation. Included allowance quantities are not yet published."
},
  "mcp-seo": {
    "slug": "mcp-seo",
    "title": "Plan improvements from a saved site audit",
    "request": "Prioritize fixes from my completed site audit.",
    "calls": [
        {
            "tool": "seo_hosted_plan_improvements_v1",
            "arguments": {
                "tenant": "your-workspace-id",
                "project": "your-project-id",
                "audit_ref": "seo_audit_0123456789abcdef0123456789abcdef",
                "priorities": [
                    "Fix broken internal links"
                ],
                "constraints": [
                    "Preserve existing routes"
                ]
            }
        }
    ],
    "execution": "Reads the retained audit and produces evidence-bound work orders and a patch plan.",
    "expectedResult": "Recommendations and a plan reference for a later apply request. The findings depend on the saved audit.",
    "outputKind": "Expected result",
    "permission": "Requires an authenticated, entitled account and a completed audit in the same workspace and project. Replace audit_ref with the auditRef returned by seo_hosted_assess_site_v1. The sample reference is a placeholder.",
    "boundary": "Create the audit first using an authorized site binding and collected site evidence. This planning call does not collect that evidence or publish changes.",
    "usageExplanation": "Usage is recorded for each operation. Included allowance quantities are not yet published."
},
  "mcp-explicitmem": {
    "slug": "mcp-explicitmem",
    "title": "Remember a release rule, then retrieve it",
    "request": "Remember that production releases require two reviewers, then find that rule.",
    "calls": [
        {
            "tool": "explicitmem_hosted_remember_v1",
            "arguments": {
                "tenant": "your-workspace-id",
                "project": "your-project-id",
                "content": {
                    "text": "Production releases require two reviewers."
                },
                "scope": {
                    "kind": "project"
                },
                "kind": "constraint"
            }
        },
        {
            "tool": "explicitmem_hosted_recall_v1",
            "arguments": {
                "tenant": "your-workspace-id",
                "project": "your-project-id",
                "query": "What are the release approval requirements?",
                "scope": {
                    "kind": "project"
                },
                "kinds": [
                    "constraint"
                ],
                "limit": 5
            }
        }
    ],
    "execution": "Stores the constraint in the authorized private project, then retrieves matching memories with provenance.",
    "expectedResult": "The remember call returns a storage result. Recall returns a bounded context brief and supporting memories; identifiers and scores depend on the stored project.",
    "permission": "Requires an authenticated, entitled account and a write-enabled key for remember. Recall can use a read-only key. Replace the workspace and project identifiers with your own.",
    "boundary": "The gateway checks ownership. Supplying another workspace identifier does not grant access. Project and usage limits still apply.",
    "outputKind": "Expected result",
    "usageExplanation": "Usage is recorded for each operation. Included allowance quantities are not yet published."
},
  "mcp-incidentops": {
    slug: "mcp-incidentops",
    title: "Turn incident records into a responder handoff",
    request: "Given this alert, log, deploy, and owner data, should we roll back and what should the responder do next?",
    calls: [
      {
        tool: "build_incident_response_packet",
        arguments: {
          evidence: {
            schema: "incidentops.evidence.v1",
            incidentId: "inc-42",
            title: "5xx spike after deploy",
            status: "investigating",
            severity: "sev2",
            startedAt: "2026-08-01T12:00:00Z",
            services: ["api"],
            environments: ["production"],
            alerts: [
              {
                id: "alert-5xx",
                provider: "custom",
                service: "api",
                environment: "production",
                severity: "sev2",
                title: "5xx rate above 5%",
                startedAt: "2026-08-01T12:01:00Z",
                evidence: ["5xx rate exceeded 5% for three data points"],
              },
            ],
            logs: [
              {
                id: "log-1",
                provider: "custom",
                service: "api",
                environment: "production",
                timestamp: "2026-08-01T12:02:00Z",
                level: "error",
                message: "upstream timeout",
              },
            ],
            deploys: [
              {
                id: "deploy-42",
                provider: "github",
                service: "api",
                environment: "production",
                repository: "acme/api",
                commitSha: "abc123",
                startedAt: "2026-08-01T11:54:00Z",
                status: "success",
                rollbackCommand: "gh workflow run rollback-api.yml",
              },
            ],
            ownership: [
              {
                service: "api",
                repository: "acme/api",
                owner: "@platform",
                team: "Platform",
                rollbackHint: "Run the last-known-good deployment workflow.",
              },
            ],
          },
        },
      },
    ],
    execution: "Reviews the supplied records, ranks the current hypothesis, and assembles rollback, recovery, communication, closure, and follow-up artifacts.",
    outputKind: "Representative contract excerpt",
    output: {
      schema: "incidentops.response-packet.v1",
      incidentId: "inc-42",
      generatedAt: "1970-01-01T00:00:00.000Z",
      summary: {
        primaryService: "api",
        severity: "sev2",
        owner: "@platform",
        ownerTeam: "Platform",
        evidenceCounts: { alerts: 1, logs: 1, deploys: 1, owners: 1 },
        currentHypothesis: {
          category: "recent_deploy",
          confidence: "high",
          evidence: ["Deploy deploy-42 completed 6m before incident start."],
        },
        recommendedResponseMode: "rollback",
        rollbackRecommended: true,
        rollbackCommand: "gh workflow run rollback-api.yml",
        readyToClose: false,
        closureBlockers: [
          "Recovery verification complete",
          "Customer and internal communications are current",
        ],
        topAction: {
          rank: 1,
          action: "rollback",
          priority: "critical",
          title: "Rollback api deploy abc123",
          owner: "@platform",
          command: "gh workflow run rollback-api.yml",
          rationale: "A successful deploy completed shortly before incident onset and has an executable rollback command.",
        },
      },
    },
    permission: "This call analyzes request data only. It needs no provider token, filesystem access, ambient AWS access, or write permission.",
    boundary: "Live connector tools have separate request-scoped credential requirements. Guarded provider writes require an explicit execution flag and confirmation phrase.",
    usageExplanation: "The completed call receives a measured receipt. Allowance quantities remain unpublished until the fully allocated rate card is frozen.",
  },
  "mcp-infraprofiler": {
    "slug": "mcp-infraprofiler",
    "title": "Profile an authorized infrastructure system",
    "request": "Show the cost and latency evidence for my configured system.",
    "calls": [
        {
            "tool": "infraprofiler_hosted_profile_system_v1",
            "arguments": {
                "tenant": "your-workspace-id",
                "project": "your-project-id",
                "system": "your-system-id",
                "window": {
                    "value": 24,
                    "unit": "hours"
                },
                "focus": [
                    "cost",
                    "latency"
                ]
            }
        }
    ],
    "execution": "Builds a bounded profile from the authorized telemetry binding for the selected system and time window.",
    "expectedResult": "A system profile with observed resource evidence and a profile reference that later diagnosis calls can use.",
    "permission": "Requires an authenticated, entitled account and a configured telemetry binding. Replace the example workspace, project, and system identifiers.",
    "boundary": "The call uses configured telemetry access. It cannot infer measurements for an unconfigured system or prove a bottleneck from absent data.",
    "outputKind": "Expected result",
    "usageExplanation": "Usage is recorded for each operation. Included allowance quantities are not yet published."
},
  "mcp-releaseops": {
    slug: "mcp-releaseops",
    title: "Verify a tag pack before an operator cuts the tag",
    request: "Can v1.2.0 be tagged from abc123?",
    calls: [
      {
        tool: "releaseops_verify_tag_pack",
        arguments: {
          tag_name: "v1.2.0",
          target_ref: "abc123",
          existing_tags: ["v1.1.0"],
          worktree_clean: true,
        },
      },
    ],
    execution: "Checks the supplied tag name, target ref, existing-tag list, and worktree state, then binds the verdict into a deterministic receipt hash.",
    outputKind: "Exact deterministic output",
    output: {
      contract: "releaseops.tag-pack.v1",
      verdict: "PASS",
      tag_name: "v1.2.0",
      target_ref: "abc123",
      worktree_clean: true,
      blockers: [],
      receipt_hash: "2a2f8eda6ba32eba5ec3d1bb6207a918a12caee1c21fa2200d6b7e07f92dd603",
    },
    permission: "No repository, provider, network, subprocess, or mutation access is used. The caller supplies the facts to check.",
    boundary: "The receipt hash detects changed output; it is not a signature. This call does not independently inspect the repository or create a tag.",
    usageExplanation: "The completed call receives a measured receipt. Allowance quantities remain unpublished until the fully allocated rate card is frozen.",
  },
  "mcp-repointel": {
    slug: "mcp-repointel",
    title: "Orient an agent before it changes retrieval code",
    request: "Give me the indexed map of ExplicitMem before I change retrieval.",
    calls: [
      {
        tool: "get_repository_summary",
        arguments: { repo: "explicitmem-mcp-ff694657" },
      },
    ],
    execution: "Resolves an already-indexed repository ID and returns its stored summary, entry points, component and workflow counts, and source-file citations.",
    outputKind: "Representative contract excerpt",
    output: {
      repoId: "explicitmem-mcp-ff694657",
      name: "ExplicitMem-MCP",
      vcs: ["git", "jj"],
      indexedRevision: "git:9a214d8dce07ea012f555e8964b76ce306bb3c87",
      indexedAt: "2026-08-01T00:36:18.381Z",
      detectedEcosystems: ["node"],
      languages: ["javascript", "json", "markdown", "python", "shell", "typescript", "yaml"],
      documentationPaths: [
        ".monarchic/feature-flags/README.md",
        "datasets/beam/README.md",
        "datasets/locomo/README.md",
        "README.md",
      ],
      summary: "ExplicitMem-MCP is a repository indexed by RepoIntel MCP. Version control: git, jj. Project classification: mcp-server (75% confidence). Detected ecosystems: node. Inventory: 194 files, 129 components, 58 workflows.",
      citations: [
        ".monarchic/feature-flags/README.md",
        "datasets/beam/README.md",
        "datasets/locomo/README.md",
      ],
      metrics: {
        fileCount: 194,
        directoryCount: 19,
        componentCount: 129,
        workflowCount: 58,
        interfaceCount: 2,
        symbolCount: 20381,
      },
    },
    permission: "Requires an authenticated, entitled account and an indexed repository accessible to its workspace. Use list_repositories to find an authorized repository ID before requesting a summary.",
    boundary: "The summary covers the indexed repository snapshot. Supplying a repository ID does not grant access to another workspace or import a new repository.",
    usageExplanation: "The completed summary receives a measured receipt. Allowance quantities remain unpublished until the fully allocated rate card is frozen.",
  },
};

for (const [slug, proof] of Object.entries(productWorkflowProofs)) {
  if (proof.slug !== slug) {
    throw new Error(`Workflow proof key ${slug} does not match payload slug ${proof.slug}`);
  }
  if (proof.calls.length === 0) {
    throw new Error(`Workflow proof ${slug} must include at least one tool call`);
  }
}

export function getProductWorkflowProof(slug: string): ProductWorkflowProof | null {
  return productWorkflowProofs[slug] ?? null;
}
