import React from "react";
import Link from "@docusaurus/Link";
import { Container, SimpleGrid, Card, Group, Text, Image, Button, Title } from "@mantine/core";

type Tile = {
  icon: string;
  title: string;
  body: string;
  primaryCta: { label: string; to: string };
  secondaryCta?: { label: string; to: string };
};

const TILES: Tile[] = [
  {
    icon: "/img/sticker_observability.png",
    title: "Instant system visibility",
    body: "Know what ran, what failed, and what’s stale — without log diving.",
    primaryCta: { label: "Observability model", to: "/docs/shared-conventions/observability-indexes-contract" },
    secondaryCta: { label: "Run records", to: "/docs/shared-conventions/run-record-contract" },
  },
  {
    icon: "/img/sticker_pipeline.png",
    title: "Standard interfaces",
    body: "Replace brittle glue code with stable contracts between pipeline stages.",
    primaryCta: { label: "Integration seams", to: "/docs/bus-contracts/integration-seams-and-allowed-io" },
    secondaryCta: { label: "Ecosystem registry", to: "/docs/registry-governance/ecosystem-map-and-registry" },
  },
  {
    icon: "/img/sticker_debug.png",
    title: "Failure containment",
    body: "Stop cascades with manifests, invariants, and explicit stop rules.",
    primaryCta: { label: "Stop rules", to: "/docs/shared-conventions/error-taxonomy-and-stop-rules" },
    secondaryCta: { label: "Manifests", to: "/docs/shared-conventions/manifests-and-integrity-rules" },
  },
  {
    icon: "/img/sticker_publishing.png",
    title: "Trusted knowledge outputs",
    body: "Turn data into reproducible summaries, digests, and snapshots.",
    primaryCta: { label: "Snapshot contract", to: "/docs/publishing/snapshot-publishing-contract" },
    secondaryCta: { label: "Consumer interface", to: "/docs/publishing/site-consumer-interface" },
  },
];

function TileCard({ tile }: { tile: Tile }) {
  return (
    <Card radius="lg" withBorder padding="lg" style={{ height: "100%" }}>
      <Group align="flex-start" gap="md" wrap="nowrap">
        <Image src={tile.icon} alt="" w={44} h={44} style={{ flex: "0 0 auto" }} />
        <div>
          <Text fw={700} size="md">
            {tile.title}
          </Text>
          <Text c="dimmed" size="sm" mt={6} lh={1.45}>
            {tile.body}
          </Text>

          <Group gap="sm" mt="md">
            <Button
              variant="filled"
              color="dark"
              size="xs"
              component={Link}
              to={tile.primaryCta.to}
            >
              {tile.primaryCta.label} →
            </Button>

            {tile.secondaryCta && (
              <Button
                variant="subtle"
                color="dark"
                size="xs"
                component={Link}
                to={tile.secondaryCta.to}
              >
                {tile.secondaryCta.label}
              </Button>
            )}
          </Group>
        </div>
      </Group>
    </Card>
  );
}

// npm install typescript @types/react @types/react-dom --save-dev

export default function HomepageFeatures(): JSX.Element {
  return (
    <section style={{ padding: "64px 0" }}>
      <Container size="lg">
        <Title order={2} style={{ letterSpacing: "-0.01em" }}>
          Start with a painkiller
        </Title>
        <Text c="dimmed" mt={6} mb="lg" size="sm" maw={720} lh={1.5}>
          Each entry point routes you to the authoritative contract pages, so an engineer
          (or their AI copilot) can map the system quickly and apply it safely.
        </Text>

        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg">
          {TILES.map((t) => (
            <TileCard key={t.title} tile={t} />
          ))}
        </SimpleGrid>
      </Container>
    </section>
  );
}
