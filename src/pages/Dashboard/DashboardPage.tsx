import {
  Badge,
  Box,
  Button,
  Card,
  Grid,
  Group,
  Loader,
  Paper,
  SimpleGrid,
  Stack,
  Table,
  Text,
  Title,
} from "@mantine/core";
import {
  Building2,
  CheckCircle2,
  Clock,
  Coins,
  FileText,
  Key,
  Plus,
  RefreshCw,
  Settings,
  Truck,
  Users,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import type { DashboardStats } from "../../api/types";
import { StatusBadge } from "../../components/Common/StatusBadge";
import { useAuth } from "../../context/AuthContext";

export function DashboardPage() {
  const { isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await api.dashboard.getStats();
      setStats(data);
    } catch (err) {
      console.error("Error loading dashboard stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (loading && !stats) {
    return (
      <Box
        p="xl"
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "60vh",
        }}
      >
        <Loader color="teal" size="lg" />
      </Box>
    );
  }

  const formatCurrency = (
    val: number | string | null | undefined,
    currency: string = "PEN",
  ) => {
    const num = typeof val === "number" ? val : parseFloat(String(val || 0));
    const safeNum = isNaN(num) ? 0 : num;
    return `${currency === "USD" ? "$" : "S/"} ${safeNum.toLocaleString("es-PE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <Stack gap="xl">
      {/* Top Welcome & Quick Actions */}
      <Group justify="space-between" align="center">
        <Box>
          <Title
            order={2}
            fw={700}
            c="gray.9"
            style={{ letterSpacing: "-0.4px" }}
          >
            {isSuperAdmin
              ? "Panel de Administración Factos"
              : "Panel de Desarrollador Factos"}
          </Title>
          <Text size="sm" c="dimmed">
            {isSuperAdmin
              ? "Visión global del sistema gestor privado, emisores y comprobantes SUNAT"
              : "Métricas de tus empresas emisoras, comprobantes electrónicos y API Keys"}
          </Text>
        </Box>

        <Group gap="xs">
          <Button
            leftSection={<RefreshCw size={16} />}
            variant="default"
            size="sm"
            onClick={loadStats}
            loading={loading}
          >
            Actualizar
          </Button>

          <Button
            leftSection={<Plus size={16} />}
            color="teal"
            size="sm"
            onClick={() => navigate("/companies?action=new")}
          >
            Nueva Empresa
          </Button>

          {isSuperAdmin ? (
            <Button
              leftSection={<Settings size={16} />}
              variant="light"
              color="gray"
              size="sm"
              onClick={() => navigate("/settings")}
            >
              Configuración
            </Button>
          ) : (
            <Button
              leftSection={<Key size={16} />}
              variant="light"
              color="violet"
              size="sm"
              onClick={() => navigate("/api-keys")}
            >
              Mis API Keys
            </Button>
          )}
        </Group>
      </Group>

      {/* Metrics Grid */}
      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="lg">
        {/* Empresas Card */}
        <Paper
          withBorder
          p="lg"
          radius="md"
          style={{ backgroundColor: "#ffffff" }}
        >
          <Group justify="space-between" align="flex-start" mb="xs">
            <Text size="xs" fw={700} c="dimmed" tt="uppercase">
              Empresas Emisoras
            </Text>
            <Box
              p={8}
              style={{
                borderRadius: 8,
                backgroundColor: "var(--mantine-color-teal-0)",
                color: "var(--mantine-color-teal-7)",
              }}
            >
              <Building2 size={20} />
            </Box>
          </Group>
          <Title order={2} fw={700} c="gray.9">
            {stats?.companies.total ?? 0}
          </Title>
          <Group gap="xs" mt="xs">
            <Badge size="xs" color="teal" variant="light">
              {stats?.companies.active ?? 0} Activas
            </Badge>
            <Badge size="xs" color="blue" variant="light">
              {stats?.companies.production ?? 0} Producción
            </Badge>
            <Badge size="xs" color="yellow" variant="light">
              {stats?.companies.beta ?? 0} Beta
            </Badge>
          </Group>
        </Paper>

        {/* Comprobantes Card */}
        <Paper
          withBorder
          p="lg"
          radius="md"
          style={{ backgroundColor: "#ffffff" }}
        >
          <Group justify="space-between" align="flex-start" mb="xs">
            <Text size="xs" fw={700} c="dimmed" tt="uppercase">
              Comprobantes Emitidos
            </Text>
            <Box
              p={8}
              style={{
                borderRadius: 8,
                backgroundColor: "var(--mantine-color-blue-0)",
                color: "var(--mantine-color-blue-7)",
              }}
            >
              <FileText size={20} />
            </Box>
          </Group>
          <Title order={2} fw={700} c="gray.9">
            {stats?.documents.total ?? 0}
          </Title>
          <Group gap="xs" mt="xs">
            <Group gap={4}>
              <CheckCircle2 size={12} color="var(--mantine-color-teal-6)" />
              <Text size="xs" c="teal.7" fw={600}>
                {stats?.documents.accepted ?? 0}
              </Text>
            </Group>
            <Group gap={4}>
              <Clock size={12} color="var(--mantine-color-yellow-6)" />
              <Text size="xs" c="yellow.8" fw={600}>
                {stats?.documents.pending ?? 0}
              </Text>
            </Group>
            <Group gap={4}>
              <XCircle size={12} color="var(--mantine-color-red-6)" />
              <Text size="xs" c="red.7" fw={600}>
                {stats?.documents.rejected ?? 0}
              </Text>
            </Group>
          </Group>
        </Paper>

        {/* Facturación Total Card */}
        <Paper
          withBorder
          p="lg"
          radius="md"
          style={{ backgroundColor: "#ffffff" }}
        >
          <Group justify="space-between" align="flex-start" mb="xs">
            <Text size="xs" fw={700} c="dimmed" tt="uppercase">
              Monto Aceptado (S/.)
            </Text>
            <Box
              p={8}
              style={{
                borderRadius: 8,
                backgroundColor: "var(--mantine-color-emerald-0)",
                color: "var(--mantine-color-teal-7)",
              }}
            >
              <Coins size={20} />
            </Box>
          </Group>
          <Title order={2} fw={700} c="gray.9">
            {formatCurrency(stats?.documents.total_pen ?? 0, "PEN")}
          </Title>
          <Text size="xs" c="dimmed" mt="xs">
            USD: {formatCurrency(stats?.documents.total_usd ?? 0, "USD")}
          </Text>
        </Paper>

        {/* Guías GRE & Cuentas (Superadmin) OR API Keys & Integración (Developer) Card */}
        <Paper
          withBorder
          p="lg"
          radius="md"
          style={{ backgroundColor: "#ffffff" }}
        >
          <Group justify="space-between" align="flex-start" mb="xs">
            <Text size="xs" fw={700} c="dimmed" tt="uppercase">
              {isSuperAdmin ? "Guías GRE & Cuentas" : "API Keys & Integración"}
            </Text>
            <Box
              p={8}
              style={{
                borderRadius: 8,
                backgroundColor: isSuperAdmin
                  ? "var(--mantine-color-violet-0)"
                  : "var(--mantine-color-indigo-0)",
                color: isSuperAdmin
                  ? "var(--mantine-color-violet-7)"
                  : "var(--mantine-color-indigo-7)",
              }}
            >
              {isSuperAdmin ? <Truck size={20} /> : <Key size={20} />}
            </Box>
          </Group>
          <Title order={2} fw={700} c="gray.9">
            {isSuperAdmin
              ? `${stats?.despatches.total ?? 0} GRE`
              : `${stats?.api_keys?.total ?? 0} Keys`}
          </Title>
          <Group gap="xs" mt="xs">
            {isSuperAdmin ? (
              <Group gap={4}>
                <Users size={14} color="var(--mantine-color-gray-6)" />
                <Text size="xs" c="dimmed">
                  {stats?.users.total ?? 0} Usuarios ({stats?.users.developers ?? 0} Devs)
                </Text>
              </Group>
            ) : (
              <Group gap={4}>
                <Badge size="xs" color="indigo" variant="light">
                  {stats?.api_keys?.active ?? 0} Activas
                </Badge>
                <Text size="xs" c="dimmed">
                  • {stats?.despatches.total ?? 0} Guías GRE
                </Text>
              </Group>
            )}
          </Group>
        </Paper>
      </SimpleGrid>

      {/* Main Content Grid: Recent Documents & Recent Companies */}
      <Grid gap="xl">
        {/* Left Column: Recent Documents */}
        <Grid.Col span={{ base: 12, lg: 8 }}>
          <Card
            withBorder
            radius="md"
            p="lg"
            style={{ backgroundColor: "#ffffff" }}
          >
            <Group justify="space-between" mb="md">
              <Box>
                <Title order={4} fw={600} c="gray.9">
                  Comprobantes Recientes
                </Title>
                <Text size="xs" c="dimmed">
                  Últimos comprobantes electrónicos procesados en el facturador
                </Text>
              </Box>
              <Button
                variant="subtle"
                size="xs"
                color="teal"
                onClick={() => navigate("/documents")}
              >
                Ver todos
              </Button>
            </Group>

            {stats?.recent_documents && stats.recent_documents.length > 0 ? (
              <Table.ScrollContainer minWidth={600}>
                <Table verticalSpacing="sm" highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Comprobante</Table.Th>
                      <Table.Th>Emisor</Table.Th>
                      <Table.Th>Cliente</Table.Th>
                      <Table.Th>Monto</Table.Th>
                      <Table.Th>Estado SUNAT</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {stats.recent_documents.map((doc) => (
                      <Table.Tr
                        key={doc.id}
                        style={{ cursor: "pointer" }}
                        onClick={() => navigate(`/documents?id=${doc.id}`)}
                      >
                        <Table.Td>
                          <Text
                            size="sm"
                            fw={600}
                            style={{ fontFamily: "monospace" }}
                          >
                            {doc.series}-{doc.correlative}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {doc.issue_date}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text
                            size="xs"
                            fw={500}
                            truncate
                            style={{ maxWidth: 160 }}
                          >
                            {doc.company?.business_name || doc.company_id}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {doc.company?.ruc}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text
                            size="xs"
                            fw={500}
                            truncate
                            style={{ maxWidth: 160 }}
                          >
                            {doc.client_name}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {doc.client_doc_number}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" fw={600}>
                            {formatCurrency(doc.total, doc.currency)}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <StatusBadge status={doc.status} />
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>
            ) : (
              <Box py="xl" ta="center">
                <Text size="sm" c="dimmed">
                  No hay comprobantes emitidos todavía.
                </Text>
              </Box>
            )}
          </Card>
        </Grid.Col>

        {/* Right Column: Empresas Activas */}
        <Grid.Col span={{ base: 12, lg: 4 }}>
          <Card
            withBorder
            radius="md"
            p="lg"
            style={{ backgroundColor: "#ffffff" }}
          >
            <Group justify="space-between" mb="md">
              <Box>
                <Title order={4} fw={600} c="gray.9">
                  Empresas Registradas
                </Title>
                <Text size="xs" c="dimmed">
                  Entidades activas en Factos
                </Text>
              </Box>
              <Button
                variant="subtle"
                size="xs"
                color="teal"
                onClick={() => navigate("/companies")}
              >
                Ver todas
              </Button>
            </Group>

            <Stack gap="sm">
              {stats?.recent_companies && stats.recent_companies.length > 0 ? (
                stats.recent_companies.map((comp) => (
                  <Paper
                    key={comp.id}
                    withBorder
                    p="sm"
                    radius="sm"
                    style={{ cursor: "pointer", transition: "all 0.15s ease" }}
                    onClick={() => navigate(`/companies?id=${comp.id}`)}
                  >
                    <Group
                      justify="space-between"
                      align="flex-start"
                      wrap="nowrap"
                    >
                      <Box style={{ overflow: "hidden" }}>
                        <Text size="sm" fw={600} truncate>
                          {comp.business_name}
                        </Text>
                        <Text
                          size="xs"
                          c="dimmed"
                          style={{ fontFamily: "monospace" }}
                        >
                          RUC: {comp.ruc}
                        </Text>
                        <Text size="xs" c="gray.6" mt={2}>
                          {isSuperAdmin
                            ? `Dev: ${comp.user?.name || "Administrador"}`
                            : `${comp.documents_count ?? 0} comprobantes emitidos`}
                        </Text>
                      </Box>
                      <Badge
                        size="xs"
                        variant="light"
                        color={comp.is_production ? "blue" : "yellow"}
                      >
                        {comp.is_production ? "Prod" : "Beta"}
                      </Badge>
                    </Group>
                  </Paper>
                ))
              ) : (
                <Text size="sm" c="dimmed" ta="center" py="md">
                  No hay empresas registradas.
                </Text>
              )}
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}
