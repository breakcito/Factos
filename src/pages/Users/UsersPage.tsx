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
  PasswordInput,
  Select,
  Stack,
  Switch,
  Table,
  Text,
  TextInput,
  Title,
  Tooltip,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import {
  Check,
  Copy,
  Edit2,
  Key,
  RefreshCw,
  Search,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../../api/client";
import type { User } from "../../api/types";
import { EmptyState } from "../../components/Common/EmptyState";
import { StatusBadge } from "../../components/Common/StatusBadge";
import { useAuth } from "../../context/AuthContext";

export function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [tokenModalOpen, setTokenModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [tokenLoading, setTokenLoading] = useState(false);

  // Forms
  const createForm = useForm({
    initialValues: {
      name: "",
      email: "",
      password: "",
      role: "developer",
      is_active: true,
      create_test_company: true,
    },
    validate: {
      name: (val) =>
        val.trim().length > 0 ? null : "El nombre es obligatorio",
      email: (val) =>
        /^\S+@\S+$/.test(val) ? null : "Correo electrónico inválido",
      password: (val) =>
        val.length >= 6
          ? null
          : "La contraseña debe tener al menos 6 caracteres",
    },
  });

  const editForm = useForm({
    initialValues: {
      name: "",
      email: "",
      password: "",
      role: "developer",
      is_active: true,
    },
    validate: {
      name: (val) =>
        val.trim().length > 0 ? null : "El nombre es obligatorio",
      email: (val) =>
        /^\S+@\S+$/.test(val) ? null : "Correo electrónico inválido",
    },
  });

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await api.users.getAll({ search: search || undefined });
      setUsers(data);
    } catch (err: any) {
      notifications.show({
        title: "Error",
        message: err.message || "No se pudieron cargar los usuarios",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [search]);

  const handleCreateUser = async (values: typeof createForm.values) => {
    try {
      const res = await api.users.create(values);
      notifications.show({
        title: "Usuario Creado",
        message: `Cuenta de desarrollador para ${values.name} creada exitosamente.${res.test_company ? " Se asoció la empresa de prueba SUNAT Beta." : ""}`,
        color: "teal",
      });
      createForm.reset();
      setCreateModalOpen(false);
      loadUsers();

      if (res.api_key) {
        setSelectedUser(res.user);
        setGeneratedToken(res.api_key);
        setTokenModalOpen(true);
      }
    } catch (err: any) {
      notifications.show({
        title: "Error al crear",
        message: err.message,
        color: "red",
      });
    }
  };

  const handleOpenEdit = (u: User) => {
    setSelectedUser(u);
    editForm.setValues({
      name: u.name,
      email: u.email,
      password: "",
      role: u.role,
      is_active: u.is_active,
    });
    setEditModalOpen(true);
  };

  const handleUpdateUser = async (values: typeof editForm.values) => {
    if (!selectedUser) return;
    try {
      await api.users.update(selectedUser.id, {
        name: values.name,
        email: values.email,
        password: values.password || undefined,
        role: values.role,
        is_active: values.is_active,
      });
      notifications.show({
        title: "Usuario Actualizado",
        message: "Los datos del usuario han sido actualizados.",
        color: "teal",
      });
      setEditModalOpen(false);
      loadUsers();
    } catch (err: any) {
      notifications.show({
        title: "Error al actualizar",
        message: err.message,
        color: "red",
      });
    }
  };

  const handleDeleteUser = async (u: User) => {
    if (u.id === currentUser?.id) {
      notifications.show({
        title: "Operación no permitida",
        message: "No puedes eliminar tu propia cuenta de super usuario.",
        color: "red",
      });
      return;
    }

    if (!confirm(`¿Está seguro de eliminar al usuario ${u.name}?`)) {
      return;
    }

    try {
      await api.users.delete(u.id);
      notifications.show({
        title: "Usuario Eliminado",
        message: "El usuario ha sido eliminado.",
        color: "teal",
      });
      loadUsers();
    } catch (err: any) {
      notifications.show({
        title: "No se pudo eliminar",
        message: err.message,
        color: "red",
      });
    }
  };

  const handleGenerateToken = async (u: User) => {
    setSelectedUser(u);
    setGeneratedToken(null);
    setTokenModalOpen(true);
  };

  const executeTokenGeneration = async () => {
    if (!selectedUser) return;
    setTokenLoading(true);
    try {
      const res = await api.users.createToken(
        selectedUser.id,
        `Token-${selectedUser.name}-${Date.now()}`,
      );
      setGeneratedToken(res.token);
      notifications.show({
        title: "Token Creado",
        message: "Token API generado exitosamente para el desarrollador.",
        color: "teal",
      });
    } catch (err: any) {
      notifications.show({
        title: "Error al generar token",
        message: err.message,
        color: "red",
      });
    } finally {
      setTokenLoading(false);
    }
  };

  return (
    <Stack gap="xl">
      {/* Top Bar */}
      <Group justify="space-between" align="center">
        <Box>
          <Title
            order={2}
            fw={700}
            c="gray.9"
            style={{ letterSpacing: "-0.4px" }}
          >
            Desarrolladores & Cuentas de Acceso
          </Title>
          <Text size="sm" c="dimmed">
            Cree y gestione cuentas para desarrolladores de empresas que usarán
            el facturador Factos
          </Text>
        </Box>

        <Group gap="xs">
          <Button
            leftSection={<RefreshCw size={16} />}
            variant="default"
            size="sm"
            onClick={loadUsers}
            loading={loading}
          >
            Actualizar
          </Button>
          <Button
            leftSection={<UserPlus size={16} />}
            color="teal"
            size="sm"
            onClick={() => setCreateModalOpen(true)}
          >
            Nuevo Desarrollador
          </Button>
        </Group>
      </Group>

      {/* Filter and Table Card */}
      <Card
        withBorder
        radius="md"
        p="lg"
        style={{ backgroundColor: "#ffffff" }}
      >
        <Group justify="space-between" mb="lg">
          <TextInput
            placeholder="Buscar por nombre o correo..."
            leftSection={<Search size={16} />}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            style={{ width: 320 }}
          />

          <Badge variant="light" color="gray" size="lg">
            {users.length} Cuentas Registradas
          </Badge>
        </Group>

        {loading ? (
          <Box py="xl" ta="center">
            <Loader color="teal" />
          </Box>
        ) : users.length === 0 ? (
          <EmptyState
            title="No se encontraron usuarios"
            description="Comience creando cuentas para otros desarrolladores o empresas."
            icon={<Users size={36} />}
            actionText="Crear Desarrollador"
            onAction={() => setCreateModalOpen(true)}
          />
        ) : (
          <Table.ScrollContainer minWidth={700}>
            <Table verticalSpacing="md" highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Usuario / Desarrollador</Table.Th>
                  <Table.Th>Rol</Table.Th>
                  <Table.Th>Estado</Table.Th>
                  <Table.Th>Empresas Asignadas</Table.Th>
                  <Table.Th>Fecha de Registro</Table.Th>
                  <Table.Th style={{ textAlign: "right" }}>Acciones</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {users.map((u) => (
                  <Table.Tr key={u.id}>
                    <Table.Td>
                      <Text size="sm" fw={600} c="gray.9">
                        {u.name}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {u.email}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <StatusBadge status={u.role} />
                    </Table.Td>
                    <Table.Td>
                      <StatusBadge
                        status={u.is_active ? "active" : "inactive"}
                      />
                    </Table.Td>
                    <Table.Td>
                      <Badge variant="light" color="teal" size="sm">
                        {u.companies_count ?? 0} empresas
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="xs" c="dimmed">
                        {new Date(u.created_at).toLocaleDateString("es-PE")}
                      </Text>
                    </Table.Td>
                    <Table.Td style={{ textAlign: "right" }}>
                      <Group gap={6} justify="flex-end">
                        <Tooltip label="Generar Token API para este desarrollador">
                          <ActionIcon
                            variant="light"
                            color="blue"
                            size="sm"
                            onClick={() => handleGenerateToken(u)}
                          >
                            <Key size={14} />
                          </ActionIcon>
                        </Tooltip>

                        <Tooltip label="Editar Usuario">
                          <ActionIcon
                            variant="light"
                            color="gray"
                            size="sm"
                            onClick={() => handleOpenEdit(u)}
                          >
                            <Edit2 size={14} />
                          </ActionIcon>
                        </Tooltip>

                        {u.id !== currentUser?.id && (
                          <Tooltip label="Eliminar Usuario">
                            <ActionIcon
                              variant="light"
                              color="red"
                              size="sm"
                              onClick={() => handleDeleteUser(u)}
                            >
                              <Trash2 size={14} />
                            </ActionIcon>
                          </Tooltip>
                        )}
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        )}
      </Card>

      {/* Modal: Create User */}
      <Modal
        opened={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title={<Text fw={700}>Crear Cuenta de Desarrollador</Text>}
        centered
        radius="md"
      >
        <form onSubmit={createForm.onSubmit(handleCreateUser)}>
          <Stack gap="md">
            <TextInput
              label="Nombre del Desarrollador / Contacto"
              placeholder="Juan Pérez (Tech SAC)"
              required
              {...createForm.getInputProps("name")}
            />

            <TextInput
              label="Correo Electrónico (Login)"
              placeholder="juan@tech.pe"
              required
              {...createForm.getInputProps("email")}
            />

            <PasswordInput
              label="Contraseña"
              placeholder="••••••••"
              required
              {...createForm.getInputProps("password")}
            />

            <Select
              label="Rol"
              data={[
                {
                  value: "developer",
                  label: "Desarrollador (Acceso a sus empresas)",
                },
                {
                  value: "superadmin",
                  label: "Super Administrador (Acceso total)",
                },
              ]}
              {...createForm.getInputProps("role")}
            />

            <Switch
              label="Cuenta Activa"
              {...createForm.getInputProps("is_active", { type: "checkbox" })}
            />

            <Switch
              label="Crear Empresa de Prueba SUNAT Beta automáticamente"
              description="Clona una empresa de prueba con RUC 20000000001 y credenciales MODDATOS para que este usuario pueda testear inmediatamente."
              color="teal"
              {...createForm.getInputProps("create_test_company", { type: "checkbox" })}
            />

            <Group justify="flex-end" mt="md">
              <Button
                variant="default"
                onClick={() => setCreateModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" color="teal">
                Crear Cuenta
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Modal: Edit User */}
      <Modal
        opened={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={<Text fw={700}>Editar Usuario: {selectedUser?.name}</Text>}
        centered
        radius="md"
      >
        <form onSubmit={editForm.onSubmit(handleUpdateUser)}>
          <Stack gap="md">
            <TextInput
              label="Nombre"
              required
              {...editForm.getInputProps("name")}
            />

            <TextInput
              label="Correo Electrónico"
              required
              {...editForm.getInputProps("email")}
            />

            <PasswordInput
              label="Nueva Contraseña (Opcional)"
              placeholder="Dejar en blanco para mantener la actual"
              {...editForm.getInputProps("password")}
            />

            {selectedUser?.id !== currentUser?.id && (
              <>
                <Select
                  label="Rol"
                  data={[
                    { value: "developer", label: "Desarrollador" },
                    { value: "superadmin", label: "Super Administrador" },
                  ]}
                  {...editForm.getInputProps("role")}
                />

                <Switch
                  label="Cuenta Activa"
                  {...editForm.getInputProps("is_active", { type: "checkbox" })}
                />
              </>
            )}

            <Group justify="flex-end" mt="md">
              <Button variant="default" onClick={() => setEditModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" color="teal">
                Guardar Cambios
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Modal: Generate Token */}
      <Modal
        opened={tokenModalOpen}
        onClose={() => setTokenModalOpen(false)}
        title={<Text fw={700}>Token API para {selectedUser?.name}</Text>}
        centered
        radius="md"
        size="md"
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Genere un token Bearer personal para que este desarrollador pueda
            consumir la API de Factos desde sus sistemas (ERP, e-commerce o
            scripts).
          </Text>

          {!generatedToken ? (
            <Button
              leftSection={<Key size={16} />}
              color="teal"
              fullWidth
              onClick={executeTokenGeneration}
              loading={tokenLoading}
            >
              Generar Nuevo Token API
            </Button>
          ) : (
            <Box>
              <Text size="xs" fw={700} c="dimmed" mb={4}>
                Token Generado (Cópielo ahora):
              </Text>
              <Code block style={{ wordBreak: "break-all", fontSize: "12px" }}>
                {generatedToken}
              </Code>
              <Group justify="space-between" mt="sm">
                <CopyButton value={generatedToken}>
                  {({ copied, copy }) => (
                    <Button
                      size="sm"
                      color={copied ? "teal" : "blue"}
                      onClick={copy}
                      leftSection={
                        copied ? <Check size={14} /> : <Copy size={14} />
                      }
                    >
                      {copied ? "Copiado al portapapeles" : "Copiar Token"}
                    </Button>
                  )}
                </CopyButton>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setTokenModalOpen(false)}
                >
                  Cerrar
                </Button>
              </Group>

              <Text size="xs" c="dimmed" mt="md">
                Uso en cabecera HTTP: <br />
                <Code>
                  Authorization: Bearer {generatedToken.substring(0, 15)}...
                </Code>
              </Text>
            </Box>
          )}
        </Stack>
      </Modal>
    </Stack>
  );
}
