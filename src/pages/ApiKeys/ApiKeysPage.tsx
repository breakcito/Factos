import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Card,
  Code,
  CopyButton,
  Group,
  Loader,
  Modal,
  Select,
  Stack,
  Switch,
  Table,
  Tabs,
  Text,
  TextInput,
  Title,
  Tooltip,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import {
  AlertTriangle,
  Check,
  Copy,
  Key,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Terminal,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../../api/client";
import type { ApiKey, User } from "../../api/types";
import { EmptyState } from "../../components/Common/EmptyState";
import { StatusBadge } from "../../components/Common/StatusBadge";
import { useAuth } from "../../context/AuthContext";

export function ApiKeysPage() {
  const { isSuperAdmin } = useAuth();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createdKeyData, setCreatedKeyData] = useState<ApiKey | null>(null);
  const [regenerateTarget, setRegenerateTarget] = useState<ApiKey | null>(null);
  const [regenerating, setRegenerating] = useState(false);

  const form = useForm({
    initialValues: {
      name: "",
      user_id: "",
    },
    validate: {
      name: (val) =>
        val.trim().length > 0 ? null : "Ingrese un nombre descriptivo",
    },
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [keysList, userList] = await Promise.all([
        api.apiKeys.getAll({ search: search || undefined }),
        isSuperAdmin ? api.users.getAll() : Promise.resolve([]),
      ]);
      setApiKeys(keysList);
      setUsers(userList);
    } catch (err: any) {
      notifications.show({
        title: "Error",
        message: err.message || "No se pudieron cargar las API Keys",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search]);

  const handleCreateApiKey = async (values: typeof form.values) => {
    try {
      const res = await api.apiKeys.create({
        name: values.name,
        user_id: values.user_id ? Number(values.user_id) : undefined,
      });

      setCreatedKeyData(res);
      notifications.show({
        title: "API Key Generada",
        message:
          "Clave creada con éxito. No expirará salvo que decida regenerarla.",
        color: "teal",
      });
      form.reset();
      loadData();
    } catch (err: any) {
      notifications.show({
        title: "Error al generar",
        message: err.message,
        color: "red",
      });
    }
  };

  const handleToggleActive = async (key: ApiKey) => {
    try {
      await api.apiKeys.update(key.id, { is_active: !key.is_active });
      notifications.show({
        title: key.is_active ? "API Key Desactivada" : "API Key Activada",
        message: `El estado de la clave "${key.name}" ha sido actualizado.`,
        color: "teal",
      });
      loadData();
    } catch (err: any) {
      notifications.show({
        title: "Error al actualizar",
        message: err.message,
        color: "red",
      });
    }
  };

  const handleRegenerateKey = async () => {
    if (!regenerateTarget) return;
    setRegenerating(true);
    try {
      const res = await api.apiKeys.regenerate(regenerateTarget.id);
      setCreatedKeyData(res);
      setRegenerateTarget(null);
      notifications.show({
        title: "Clave Regenerada",
        message:
          "Se generó un nuevo secreto. La clave anterior ha quedado revocada.",
        color: "teal",
      });
      loadData();
    } catch (err: any) {
      notifications.show({
        title: "Error al regenerar",
        message: err.message,
        color: "red",
      });
    } finally {
      setRegenerating(false);
    }
  };

  const handleDeleteKey = async (key: ApiKey) => {
    if (
      !confirm(
        `¿Está seguro de eliminar lógicamente la API Key "${key.name}"? Los sistemas que la usen perderán acceso inmediatamente.`,
      )
    ) {
      return;
    }

    try {
      await api.apiKeys.delete(key.id);
      notifications.show({
        title: "API Key Revocada",
        message: "La clave fue eliminada de forma lógica (soft delete).",
        color: "teal",
      });
      loadData();
    } catch (err: any) {
      notifications.show({
        title: "Error al revocar",
        message: err.message,
        color: "red",
      });
    }
  };

  return (
    <Stack gap="xl">
      {/* Top Header Bar */}
      <Group justify="space-between" align="center">
        <Box>
          <Title
            order={2}
            fw={700}
            c="gray.9"
            style={{ letterSpacing: "-0.4px" }}
          >
            API Keys de Integración (POS / ERP)
          </Title>
          <Text size="sm" c="dimmed">
            Genere claves permanentes para conectar sistemas externos con el
            facturador. Cada clave solo tiene acceso a las empresas asociadas a
            su cuenta.
          </Text>
        </Box>

        <Group gap="xs">
          <Button
            leftSection={<RefreshCw size={16} />}
            variant="default"
            size="sm"
            onClick={loadData}
            loading={loading}
          >
            Actualizar
          </Button>
          <Button
            leftSection={<Plus size={16} />}
            color="teal"
            size="sm"
            onClick={() => {
              form.reset();
              setCreatedKeyData(null);
              setCreateModalOpen(true);
            }}
          >
            Nueva API Key
          </Button>
        </Group>
      </Group>

      {/* Main Table Card */}
      <Card
        withBorder
        radius="md"
        p="lg"
        style={{ backgroundColor: "#ffffff" }}
      >
        <Group justify="space-between" mb="lg">
          <TextInput
            placeholder="Buscar por nombre de integración..."
            leftSection={<Search size={16} />}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            style={{ width: 340 }}
          />

          <Badge variant="light" color="teal" size="lg">
            {apiKeys.length} API Keys Registradas
          </Badge>
        </Group>

        {loading ? (
          <Box py="xl" ta="center">
            <Loader color="teal" />
          </Box>
        ) : apiKeys.length === 0 ? (
          <EmptyState
            title="No hay API Keys generadas"
            description="Genere su primera clave permanente para comenzar a integrar sus sistemas POS, ERP o aplicaciones web."
            icon={<Key size={36} />}
            actionText="Generar API Key"
            onAction={() => {
              form.reset();
              setCreatedKeyData(null);
              setCreateModalOpen(true);
            }}
          />
        ) : (
          <Table.ScrollContainer minWidth={850}>
            <Table verticalSpacing="md" highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Nombre / Sistema</Table.Th>
                  <Table.Th>Cuenta / Desarrollador</Table.Th>
                  <Table.Th>Clave API</Table.Th>
                  <Table.Th>Último Uso</Table.Th>
                  <Table.Th>Estado</Table.Th>
                  <Table.Th style={{ textAlign: "right" }}>Acciones</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {apiKeys.map((k) => (
                  <Table.Tr key={k.id}>
                    <Table.Td>
                      <Text size="sm" fw={700} c="gray.9">
                        {k.name}
                      </Text>
                      <Text size="11px" c="dimmed">
                        Creada:{" "}
                        {new Date(k.created_at).toLocaleDateString("es-PE")}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="xs" fw={600}>
                        {k.user?.name || "Administrador"}
                      </Text>
                      <Text size="11px" c="dimmed">
                        {k.user?.email}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Group gap={6}>
                        <Code
                          style={{ fontFamily: "monospace", fontSize: "11px" }}
                        >
                          {k.key.substring(0, 18)}...
                          {k.key.substring(k.key.length - 6)}
                        </Code>
                        <CopyButton value={k.key}>
                          {({ copied, copy }) => (
                            <Tooltip
                              label={
                                copied ? "¡Copiado!" : "Copiar clave completa"
                              }
                            >
                              <ActionIcon
                                size="xs"
                                color={copied ? "teal" : "gray"}
                                variant="subtle"
                                onClick={copy}
                              >
                                {copied ? (
                                  <Check size={12} />
                                ) : (
                                  <Copy size={12} />
                                )}
                              </ActionIcon>
                            </Tooltip>
                          )}
                        </CopyButton>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Text size="xs" c="dimmed">
                        {k.last_used_at
                          ? new Date(k.last_used_at).toLocaleString("es-PE")
                          : "Nunca usada"}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Switch
                        size="xs"
                        color="teal"
                        checked={k.is_active}
                        onChange={() => handleToggleActive(k)}
                        label={
                          <StatusBadge
                            status={k.is_active ? "active" : "inactive"}
                            size="xs"
                          />
                        }
                      />
                    </Table.Td>
                    <Table.Td style={{ textAlign: "right" }}>
                      <Group gap={6} justify="flex-end">
                        <Tooltip label="Regenerar clave">
                          <ActionIcon
                            variant="light"
                            color="blue"
                            size="sm"
                            onClick={() => setRegenerateTarget(k)}
                          >
                            <RefreshCw size={14} />
                          </ActionIcon>
                        </Tooltip>

                        <Tooltip label="Revocar / Eliminar (Lógica)">
                          <ActionIcon
                            variant="light"
                            color="red"
                            size="sm"
                            onClick={() => handleDeleteKey(k)}
                          >
                            <Trash2 size={14} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        )}
      </Card>

      {/* Integration Guide Section */}
      <Card
        withBorder
        radius="md"
        p="lg"
        style={{ backgroundColor: "#ffffff" }}
      >
        <Group gap="xs" mb="sm">
          <Terminal size={18} color="var(--mantine-color-teal-6)" />
          <Title order={4} fw={600}>
            Guía Rápida de Conexión para Desarrolladores
          </Title>
        </Group>
        <Text size="xs" c="dimmed" mb="md">
          Utilice la API Key generada en el encabezado{" "}
          <Code>Authorization: Bearer &lt;API_KEY&gt;</Code> o en{" "}
          <Code>X-API-KEY: &lt;API_KEY&gt;</Code>.
        </Text>

        <Tabs defaultValue="curl" color="teal">
          <Tabs.List mb="xs">
            <Tabs.Tab value="curl">cURL</Tabs.Tab>
            <Tabs.Tab value="php">PHP</Tabs.Tab>
            <Tabs.Tab value="node">Node.js / TypeScript</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="curl">
            <Code block style={{ fontSize: "12px" }}>
              {`curl -X POST /api/v1/invoices \\
  -H "Content-Type: application/json" \\
  -H "Accept: application/json" \\
  -H "Authorization: Bearer factos_live_TU_API_KEY_AQUI" \\
  -d '{
    "company_id": "TU-COMPANY-UUID",
    "series": "F001",
    "correlative": "1",
    "issue_date": "2026-10-06",
    "total": 118.00
  }'`}
            </Code>
          </Tabs.Panel>

          <Tabs.Panel value="php">
            <Code block style={{ fontSize: "12px" }}>
              {`$response = Http::withToken('factos_live_TU_API_KEY_AQUI')
    ->post('/api/v1/invoices', [
        'company_id' => 'TU-COMPANY-UUID',
        'series' => 'F001',
        'correlative' => '1',
        'total' => 118.00,
    ]);`}
            </Code>
          </Tabs.Panel>

          <Tabs.Panel value="node">
            <Code block style={{ fontSize: "12px" }}>
              {`const res = await fetch('/api/v1/invoices', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer factos_live_TU_API_KEY_AQUI'
  },
  body: JSON.stringify({ company_id: 'TU-COMPANY-UUID', total: 118.00 })
});`}
            </Code>
          </Tabs.Panel>
        </Tabs>
      </Card>

      {/* Modal: Create API Key */}
      <Modal
        opened={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title={<Title order={4}>Generar Nueva API Key</Title>}
        centered
        radius="md"
      >
        {!createdKeyData ? (
          <form onSubmit={form.onSubmit(handleCreateApiKey)}>
            <Stack gap="md">
              <TextInput
                label="Nombre de la Integración / Sistema"
                placeholder="Ej: Sistema POS Tienda Central, ERP Odoo"
                required
                {...form.getInputProps("name")}
              />

              {isSuperAdmin && (
                <Select
                  label="Asignar al Desarrollador / Cuenta"
                  placeholder="Seleccione la cuenta dueña (opcional)"
                  data={users.map((u) => ({
                    value: String(u.id),
                    label: `${u.name} (${u.email})`,
                  }))}
                  {...form.getInputProps("user_id")}
                />
              )}

              <Group
                gap={6}
                p="xs"
                style={{
                  borderRadius: 6,
                  backgroundColor: "var(--mantine-color-teal-0)",
                }}
              >
                <ShieldCheck size={16} color="var(--mantine-color-teal-7)" />
                <Text size="xs" c="teal.9">
                  Esta clave no expira y solo da acceso a las empresas asociadas
                  a esta cuenta.
                </Text>
              </Group>

              <Group justify="flex-end" mt="md">
                <Button
                  variant="default"
                  onClick={() => setCreateModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" color="teal">
                  Generar Clave
                </Button>
              </Group>
            </Stack>
          </form>
        ) : (
          <Stack gap="md">
            <Text size="sm" fw={600} c="teal.8">
              ¡Clave generada exitosamente para "{createdKeyData.name}"!
            </Text>
            <Text size="xs" c="dimmed">
              Copie esta clave ahora y guárdela de forma segura en sus variables
              de entorno:
            </Text>

            <Code block style={{ wordBreak: "break-all", fontSize: "12px" }}>
              {createdKeyData.key}
            </Code>

            <CopyButton value={createdKeyData.key}>
              {({ copied, copy }) => (
                <Button
                  color={copied ? "teal" : "blue"}
                  onClick={copy}
                  leftSection={
                    copied ? <Check size={16} /> : <Copy size={16} />
                  }
                >
                  {copied
                    ? "¡Clave Copiada al Portapapeles!"
                    : "Copiar API Key"}
                </Button>
              )}
            </CopyButton>

            <Button variant="default" onClick={() => setCreateModalOpen(false)}>
              Listo, cerrar
            </Button>
          </Stack>
        )}
      </Modal>

      {/* Modal: Confirm Regeneration */}
      <Modal
        opened={!!regenerateTarget}
        onClose={() => setRegenerateTarget(null)}
        title={
          <Group gap="xs">
            <AlertTriangle size={18} color="var(--mantine-color-yellow-6)" />
            <Text fw={700}>¿Regenerar API Key?</Text>
          </Group>
        }
        centered
        radius="md"
      >
        <Stack gap="md">
          <Text size="sm">
            Está a punto de regenerar la clave para{" "}
            <b>{regenerateTarget?.name}</b>. La clave anterior dejará de
            funcionar de inmediato en todos los sistemas POS o ERP que la estén
            utilizando.
          </Text>

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={() => setRegenerateTarget(null)}>
              Cancelar
            </Button>
            <Button
              color="yellow"
              onClick={handleRegenerateKey}
              loading={regenerating}
            >
              Confirmar Regeneración
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
