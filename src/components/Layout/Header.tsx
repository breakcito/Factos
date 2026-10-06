import { Badge, Box, Group, Text, Title } from "@mantine/core";
import { Activity } from "lucide-react";
import { useLocation } from "react-router-dom";

export function Header() {
  const location = useLocation();

  const getPageTitle = () => {
    if (location.pathname.startsWith("/dashboard")) return "Panel de Control";
    if (location.pathname.startsWith("/companies")) return "Empresas Emisoras";
    if (location.pathname.startsWith("/documents"))
      return "Comprobantes de Pago";
    if (location.pathname.startsWith("/despatches")) return "Guías de Remisión";
    if (location.pathname.startsWith("/users"))
      return "Gestión de Desarrolladores";
    if (location.pathname.startsWith("/settings"))
      return "Configuración del Sistema";
    return "Factos";
  };

  return (
    <Box
      component="header"
      h={60}
      px="xl"
      style={{
        borderBottom: "1px solid var(--mantine-color-gray-2)",
        backgroundColor: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <Title order={3} fw={700} c="gray.9" style={{ letterSpacing: "-0.3px" }}>
        {getPageTitle()}
      </Title>

      <Group gap="sm">
        <Badge variant="dot" color="teal" size="sm">
          API En Línea
        </Badge>
        <Group gap={4} c="dimmed">
          <Activity size={14} />
          <Text size="xs" fw={500}>
            SUNAT Conectado
          </Text>
        </Group>
      </Group>
    </Box>
  );
}
