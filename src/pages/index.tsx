
import React from "react";
import Link from "@docusaurus/Link";
import Layout from "@theme/Layout";

import Card from "../components/Card";
import CardBody from "../components/Card/CardBody";
import CardFooter from "../components/Card/CardFooter";
import CardImage from "../components/Card/CardImage";

import styles from "./index.module.css";

const cards = [
  {
    img: "/img/sticker_observability.png",
    title: "Instant visibility",
    text: "Know what ran, failed, or stalled.",
    link: "/docs/shared-conventions/observability-indexes-contract",
  },
  {
    img: "/img/sticker_pipeline.png",
    title: "Standard interfaces",
    text: "Replace glue code with contracts.",
    link: "/docs/bus-contracts/integration-seams-and-allowed-io",
  },
  {
    img: "/img/sticker_debug.png",
    title: "Failure containment",
    text: "Stop cascades with invariants.",
    link: "/docs/shared-conventions/error-taxonomy-and-stop-rules",
  },
  {
    img: "/img/sticker_publishing.png",
    title: "Trusted outputs",
    text: "Reproducible knowledge artifacts.",
    link: "/docs/publishing/snapshot-publishing-contract",
  },
];

export default function Home() {
  const section = { maxWidth: 1100, margin: "0 auto", padding: "64px 20px" };

  return (
    <Layout title="KB Manual">
      <main className="landing-root">

        {/* HERO */}
        <section style={{ ...section, textAlign: "center" }}>
          <div style={{ fontSize: 12, border: "1px solid #000", display: "inline-block", padding: "6px 12px", borderRadius: 999 }}>
            Production reference architecture
          </div>

          <h1 style={{ fontSize: 48, margin: "24px 0 12px" }}>
            Contracts for reliable knowledge pipelines
          </h1>

          <p style={{ color: "#555", maxWidth: 780, margin: "0 auto" }}>
            A frozen system of interfaces, invariants, and observability surfaces for multi-repo ML/LLM pipelines.
          </p>

          <div style={{ marginTop: 24 }}>
            <Link to="/docs/intro">Start here →</Link>{" | "}
            <Link to="/docs/shared-conventions/observability-indexes-contract">Observability →</Link>
          </div>
        </section>

        {/* TOPOLOGY */}
        <section style={{ ...section, paddingTop: 0, textAlign: "center" }}>
        {/* <img src="/img/topology_strip.png" style={{ maxWidth: "100%" }} /> */}
        <img src="/img/pipeline_banner.png" style={{ maxWidth: "100%" }} />
        <p style={{ color: "#555", marginTop: 8 }}>
            Explicit contracts between every pipeline stage.
          </p>
        </section>

        {/* CARDS */}
        <section style={section}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
              gap: 16,
            }}
          >
            {cards.map((c) => (
              <Card key={c.link} className={styles.cardNoBorder} shadow="lw">
                <CardImage
                  cardImageUrl={c.img}
                  alt={c.title}
                  title={c.title}
                  className={styles.cardTopImage}
                />

                <CardBody className={styles.cardBodyCenter}>
                  <div className={styles.cardTitle}>{c.title}</div>
                  <p className={styles.cardText}>{c.text}</p>
                </CardBody>

                <CardFooter className="text--center">
                  <Link to={c.link}>Open →</Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>

        {/* AI SCOUT */}
        <section style={section}>
          <p><strong>Ask your AI to explore the system:</strong></p>
          <pre style={{ border: "1px solid #000", padding: 12 }}>
Visit https://kb-contracts.matuteiglesias.link and explain how this architecture could improve reliability, observability, and governance in a production ML or LLM pipeline.
          </pre>
        </section>

        {/* MONETIZATION */}
        <section style={section}>
          <h2>Want this applied to your system?</h2>
          <p>Architecture sessions to adapt this framework to real pipelines.</p>
          <a href="mailto:matuteiglesias@gmail.com">Request a session →</a>
        </section>

      </main>
    </Layout>
  );
}
