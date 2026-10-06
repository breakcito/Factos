import { Box, Button, Center, Stack, Text, Title } from "@mantine/core";
import { Inbox } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  actionText?: string;
  onAction?: () => void;
}

export function EmptyState({
  title,
  description,
  icon,
  actionText,
  onAction,
}: EmptyStateProps) {
  return (
    <Center py={48}>
      <Stack
        align="center"
        gap="sm"
        style={{ maxWidth: 400, textAlign: "center" }}
      >
        <Box
          p="md"
          style={{
            borderRadius: "50%",
            backgroundColor: "var(--mantine-color-gray-1)",
            color: "var(--mantine-color-gray-6)",
          }}
        >
          {icon || <Inbox size={36} strokeWidth={1.5} />}
        </Box>
        <Title order={4} fw={600} c="gray.8">
          {title}
        </Title>
        {description && (
          <Text size="sm" c="dimmed">
            {description}
          </Text>
        )}
        {actionText && onAction && (
          <Button size="sm" variant="light" onClick={onAction} mt="xs">
            {actionText}
          </Button>
        )}
      </Stack>
    </Center>
  );
}
