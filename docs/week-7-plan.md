# Week 7: fast, tested, monitored

Scope follows the lead's PDF, pages 3-4. Week 8 is a separate launch phase.

1. Repair earlier integration defects: saved-search ownership and verified email; migration/model alignment;
   durable notification history and safe retries; cursor pagination, loading/error recovery and real job URLs.
2. Cache filtered job queries in shared Redis. Add PostgreSQL trigram indexes, bounded queries, cache
   invalidation and an isolated, reproducible cold/warm benchmark.
3. Record per-source scrape runs. Schedule sources separately and protect against overlapping workers.
   Add liveness/readiness endpoints, Sentry and an administrator-only pipeline dashboard.
4. Test backend and frontend important paths, including negative cases and migration upgrades.
5. Run CI on pushes and pull requests. Document setup, failure recovery and measured acceptance evidence.

Acceptance: successful backend tests against PostgreSQL/Redis; frontend unit/browser tests, lint,
typecheck and production build; a repeatable warm-search p95 below one second on the local benchmark;
health reflects failed/stale/never-run sources rather than inventing healthy status.

External acceptance remains explicit: configure actual Clerk/Sentry/email accounts; confirm a Sentry
event reaches the project and confirm email delivery to an authorized recipient. Code checks cannot
prove third-party delivery or Codeaza deployment.

Earlier scope gap: three registered sources do not fulfill the 10/50-source roadmap milestones.
Historical duplicate vacancies already stored are preserved for review; conservative URL deduplication
prevents new duplicates sharing the same canonical application URL. Similar-title jobs with different
URLs are not automatically merged.
