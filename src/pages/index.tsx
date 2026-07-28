import React from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';

import styles from './index.module.css';

const contractCards = [
  {
    eyebrow: 'Participant',
    title: 'module.v1',
    text: 'Identity, repository, knowledge profile, accepted and emitted schemas, validation, and the exact release claim.',
    href: '/docs/home/current-release#consume-it-directly',
  },
  {
    eyebrow: 'Product',
    title: 'knowledge artifact manifest',
    text: 'One finalized knowledge product with portable payload location, provenance, media type, byte size, and SHA-256 integrity.',
    href: '/docs/shared-conventions/manifests-and-integrity-rules#normative-knowledge-artifact-manifest-boundary',
  },
  {
    eyebrow: 'Conformance',
    title: 'knowledge profile claim',
    text: 'A machine-readable Profile 1 claim covering public schemas, fixtures, seam discipline, compatibility, and offline validation.',
    href: '/docs/shared-conventions/contract-profiles-and-promotion-ladder#profile-1--published-interop-artifact',
  },
];

const exclusions = [
  'run lifecycle',
  'run bundles',
  'operational errors',
  'retries & rollback',
  'staging mechanics',
  'MCP schemas',
];

export default function Home(): React.ReactElement {
  return (
    <Layout
      title="Knowledge interoperability contracts"
      description="A small, machine-readable, offline-verifiable contract surface for shared knowledge artifacts."
    >
      <main className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.heroGrid} aria-hidden="true" />
          <div className={styles.heroInner}>
            <div className={styles.releasePill}>
              <span className={styles.releaseDot} />
              kb-interop.v1-rc1 · authority review
            </div>
            <p className={styles.kicker}>KB CONTRACTS / BOUNDED AUTHORITY</p>
            <h1>Knowledge products that travel with proof.</h1>
            <p className={styles.lede}>
              Three schemas, checked-in evidence, and one offline command. Enough structure for repositories to exchange knowledge artifacts without sharing internals—or pretending to own a universal runtime.
            </p>
            <div className={styles.actions}>
              <Link className={styles.primaryAction} to="/docs/home/current-release">
                Inspect the release <span aria-hidden="true">→</span>
              </Link>
              <Link className={styles.secondaryAction} to="/docs/intro">
                Adoption path
              </Link>
            </div>
            <div className={styles.command}>
              <span className={styles.prompt}>$</span>
              <code>npm run contract:validate</code>
              <span className={styles.commandMeta}>deterministic · offline · clean-tree</span>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.kicker}>THE RELEASE SURFACE</p>
              <h2>Small enough to understand. Strict enough to trust.</h2>
            </div>
            <Link to="/docs/registry-governance/adr-0006-knowledge-interoperability-authority-boundary">
              Read the authority decision →
            </Link>
          </div>
          <div className={styles.contractGrid}>
            {contractCards.map((card, index) => (
              <Link className={styles.contractCard} to={card.href} key={card.title}>
                <span className={styles.cardNumber}>0{index + 1}</span>
                <span className={styles.cardEyebrow}>{card.eyebrow}</span>
                <h3>{card.title}</h3>
                <p>{card.text}</p>
                <span className={styles.cardLink}>Open contract →</span>
              </Link>
            ))}
          </div>
        </section>

        <section className={`${styles.section} ${styles.boundarySection}`}>
          <div className={styles.boundaryCopy}>
            <p className={styles.kicker}>THE PRUNING RULE</p>
            <h2>Knowledge interoperability is not execution architecture.</h2>
            <p>
              Operational pages are preserved as labeled guidance, not silently promoted into the release. Producer-native evidence can be referenced opaquely without importing its lifecycle or shape.
            </p>
            <Link className={styles.textLink} to="/docs/home/home#what-is-not-a-kb-interoperability-contract">
              See the documentation authority map →
            </Link>
          </div>
          <div className={styles.exclusionPanel}>
            <div className={styles.exclusionHeader}>
              <span>OUTSIDE V1 AUTHORITY</span>
              <span>producer-owned</span>
            </div>
            <div className={styles.exclusionGrid}>
              {exclusions.map((item) => (
                <div key={item}><span aria-hidden="true">×</span>{item}</div>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.proofStrip}>
          <div><strong>3</strong><span>Draft 2020-12 schemas</span></div>
          <div><strong>85</strong><span>declared invalid cases</span></div>
          <div><strong>2</strong><span>compatibility proofs</span></div>
          <div><strong>1</strong><span>pinned SHA-256 inventory</span></div>
        </section>

        <section className={styles.finalCta}>
          <p className={styles.kicker}>READY TO INTEGRATE?</p>
          <h2>Resolve the registry. Pin the release. Validate the artifact.</h2>
          <div className={styles.actions}>
            <Link className={styles.primaryAction} to="/docs/intro">Start with Profile 1 →</Link>
            <Link className={styles.secondaryAction} to="/docs/shared-conventions/knowledge-contract-compatibility">Compatibility policy</Link>
          </div>
        </section>
      </main>
    </Layout>
  );
}
