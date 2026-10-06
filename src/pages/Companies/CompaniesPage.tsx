import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Card,
  Divider,
  Drawer,
  FileInput,
  Grid,
  Group,
  Loader,
  Modal,
  NumberInput,
  PasswordInput,
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
  Building2,
  Edit2,
  Eye,
  FlaskConical,
  Mail,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Trash2,
  Webhook,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../../api/client";
import type { Company, User } from "../../api/types";
import { EmptyState } from "../../components/Common/EmptyState";
import { StatusBadge } from "../../components/Common/StatusBadge";
import { useAuth } from "../../context/AuthContext";

export function CompaniesPage() {
  const { isSuperAdmin } = useAuth();
  const [searchParams] = useSearchParams();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [queryingRuc, setQueryingRuc] = useState(false);
  const [creatingTestCompany, setCreatingTestCompany] = useState(false);

  // Modals / Drawer
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [certificateFile, setCertificateFile] = useState<File | null>(null);

  // Form for creation & update
  const form = useForm({
    initialValues: {
      user_id: "",
      ruc: "",
      business_name: "",
      trademark_name: "",
      address: "",
      ubigeo: "",
      department: "",
      province: "",
      district: "",
      establishment_code: "0000",
      sol_user: "",
      sol_pass: "",
      client_id: "",
      client_secret: "",
      certificate_pass: "",
      webhook_url: "",
      webhook_secret: "",
      is_production: false,
      is_active: true,
      email_notifications_active: true,
      company_copy_emails_text: "",
      send_to_client_email: true,
      mail_host: "",
      mail_port: 587,
      mail_username: "",
      mail_password: "",
      mail_encryption: "tls",
      mail_from_address: "",
      mail_from_name: "",
    },
    validate: {
      ruc: (val) =>
        /^(10|15|17|20)\d{9}$/.test(val)
          ? null
          : "El RUC debe tener 11 dígitos y empezar con 10, 15, 17 o 20",
      business_name: (val) =>
        val.trim().length > 0 ? null : "Razón social requerida",
      sol_user: (val) =>
        val.trim().length > 0 ? null : "Usuario SOL requerido",
    },
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [compList, userList] = await Promise.all([
        api.companies.getAll({ search: search || undefined }),
        isSuperAdmin ? api.users.getAll() : Promise.resolve([]),
      ]);
      setCompanies(compList);
      setUsers(userList);

      const targetId = searchParams.get("id");
      if (targetId) {
        const found = compList.find((c) => c.id === targetId);
        if (found) {
          setSelectedCompany(found);
          setDrawerOpen(true);
        }
      }

      if (searchParams.get("action") === "new") {
        setCreateModalOpen(true);
      }
    } catch (err: any) {
      notifications.show({
        title: "Error",
        message: err.message || "Error al cargar empresas",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search]);

  const handleQueryRuc = async () => {
    const ruc = form.values.ruc.trim();
    if (ruc.length !== 11) {
      notifications.show({
        title: "RUC Inválido",
        message: "Ingrese los 11 dígitos del RUC para consultar",
        color: "yellow",
      });
      return;
    }

    setQueryingRuc(true);
    try {
      const res = await api.services.ruc(ruc);
      const data = res.data;
      form.setFieldValue("business_name", data.razon_social || "");
      form.setFieldValue("trademark_name", data.nombre_comercial || "");
      form.setFieldValue("address", data.direccion || "");
      form.setFieldValue("department", data.departamento || "");
      form.setFieldValue("province", data.provincia || "");
      form.setFieldValue("district", data.distrito || "");
      form.setFieldValue("ubigeo", data.ubigeo || "");

      notifications.show({
        title: "RUC Consultado",
        message: `Datos encontrados: ${data.razon_social}`,
        color: "teal",
      });
    } catch (err: any) {
      notifications.show({
        title: "No se pudo consultar",
        message: err.message || "RUC no encontrado en la pasarela",
        color: "red",
      });
    } finally {
      setQueryingRuc(false);
    }
  };

  const handleSubmitCompany = async (values: typeof form.values) => {
    const formData = new FormData();

    Object.entries(values).forEach(([key, val]) => {
      if (key === "company_copy_emails_text") {
        const emails = (val as string)
          .split(",")
          .map((e) => e.trim())
          .filter((e) => e.length > 0);
        emails.forEach((email, idx) =>
          formData.append(`company_copy_emails[${idx}]`, email),
        );
      } else if (
        key === "is_production" ||
        key === "is_active" ||
        key === "email_notifications_active" ||
        key === "send_to_client_email"
      ) {
        formData.append(key, val ? "1" : "0");
      } else if (val !== null && val !== undefined && val !== "") {
        formData.append(key, String(val));
      }
    });

    if (certificateFile) {
      formData.append("certificate", certificateFile);
    }

    try {
      if (selectedCompany && editModalOpen) {
        await api.companies.update(selectedCompany.id, formData);
        notifications.show({
          title: "Empresa Actualizada",
          message: "La empresa emisora ha sido actualizada correctamente.",
          color: "teal",
        });
        setEditModalOpen(false);
      } else {
        await api.companies.create(formData);
        notifications.show({
          title: "Empresa Creada",
          message: "La empresa emisora ha sido registrada correctamente.",
          color: "teal",
        });
        setCreateModalOpen(false);
      }
      form.reset();
      setCertificateFile(null);
      loadData();
    } catch (err: any) {
      notifications.show({
        title: "Error al procesar",
        message: err.message || "Verifique los campos ingresados",
        color: "red",
        autoClose: 8000,
      });
    }
  };

  const handleOpenEdit = (comp: Company) => {
    setSelectedCompany(comp);
    setCertificateFile(null);
    form.setValues({
      user_id: comp.user_id ? String(comp.user_id) : "",
      ruc: comp.ruc,
      business_name: comp.business_name,
      trademark_name: comp.trademark_name || "",
      address: comp.address || "",
      ubigeo: comp.ubigeo || "",
      department: comp.department || "",
      province: comp.province || "",
      district: comp.district || "",
      establishment_code: comp.establishment_code || "0000",
      sol_user: comp.sol_user,
      sol_pass: "",
      client_id: comp.client_id || "",
      client_secret: "",
      certificate_pass: "",
      webhook_url: comp.webhook_url || "",
      webhook_secret: "",
      is_production: comp.is_production,
      is_active: comp.is_active,
      email_notifications_active: comp.email_notifications_active,
      company_copy_emails_text: comp.company_copy_emails?.join(", ") || "",
      send_to_client_email: comp.send_to_client_email,
      mail_host: comp.mail_host || "",
      mail_port: comp.mail_port || 587,
      mail_username: comp.mail_username || "",
      mail_password: "",
      mail_encryption: comp.mail_encryption || "tls",
      mail_from_address: comp.mail_from_address || "",
      mail_from_name: comp.mail_from_name || "",
    });
    setEditModalOpen(true);
  };

  const handleDeleteCompany = async (comp: Company) => {
    if (
      !confirm(`¿Está seguro de eliminar la empresa ${comp.business_name}?`)
    ) {
      return;
    }

    try {
      await api.companies.delete(comp.id);
      notifications.show({
        title: "Empresa Eliminada",
        message: "La empresa emisora ha sido removida.",
        color: "teal",
      });
      loadData();
    } catch (err: any) {
      notifications.show({
        title: "No se pudo eliminar",
        message: err.message,
        color: "red",
      });
    }
  };

  const handleOpenDrawer = (comp: Company) => {
    setSelectedCompany(comp);
    setDrawerOpen(true);
  };

  const hasTestCompany = companies.some((c) => !c.is_production);

  const handleCreateTestCompany = async () => {
    setCreatingTestCompany(true);
    try {
      const res = await api.companies.createTestCompany();
      notifications.show({
        title: "Empresa de Prueba Creada",
        message: `Empresa ${res.business_name} (RUC: ${res.ruc}) asociada en modo Beta para pruebas con SUNAT.`,
        color: "teal",
      });
      loadData();
    } catch (err: any) {
      notifications.show({
        title: "No se pudo crear la empresa de prueba",
        message: err.message || "Ocurrió un error al provisionar la empresa.",
        color: "red",
      });
    } finally {
      setCreatingTestCompany(false);
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
            Empresas Emisoras
          </Title>
          <Text size="sm" c="dimmed">
            Configure credenciales SUNAT, certificados digitales, webhooks y
            correos de cada empresa
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
          {!hasTestCompany && (
            <Button
              leftSection={<FlaskConical size={16} />}
              variant="light"
              color="blue"
              size="sm"
              loading={creatingTestCompany}
              onClick={handleCreateTestCompany}
            >
              Crear Empresa de Prueba (Beta)
            </Button>
          )}
          <Button
            leftSection={<Plus size={16} />}
            color="teal"
            size="sm"
            onClick={() => {
              form.reset();
              setCertificateFile(null);
              setSelectedCompany(null);
              setCreateModalOpen(true);
            }}
          >
            Nueva Empresa
          </Button>
        </Group>
      </Group>

      {/* Main Companies Table Card */}
      <Card
        withBorder
        radius="md"
        p="lg"
        style={{ backgroundColor: "#ffffff" }}
      >
        <Group justify="space-between" mb="lg">
          <TextInput
            placeholder="Buscar por RUC o Razón Social..."
            leftSection={<Search size={16} />}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            style={{ width: 340 }}
          />

          <Badge variant="light" color="teal" size="lg">
            {companies.length} Empresas Registradas
          </Badge>
        </Group>

        {loading ? (
          <Box py="xl" ta="center">
            <Loader color="teal" />
          </Box>
        ) : companies.length === 0 ? (
          <EmptyState
            title="No hay empresas registradas"
            description="Comience creando una empresa de prueba SUNAT Beta automática con un solo clic o registre una empresa manualmente."
            icon={<Building2 size={36} />}
            actionText="Crear Empresa de Prueba (Beta)"
            onAction={handleCreateTestCompany}
            secondaryActionText="Registrar Empresa Manual"
            onSecondaryAction={() => setCreateModalOpen(true)}
          />
        ) : (
          <Table.ScrollContainer minWidth={800}>
            <Table verticalSpacing="md" highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>RUC & Razón Social</Table.Th>
                  <Table.Th>Desarrollador</Table.Th>
                  <Table.Th>Ambiente SUNAT</Table.Th>
                  <Table.Th>Certificado</Table.Th>
                  <Table.Th>Comprobantes</Table.Th>
                  <Table.Th>Estado</Table.Th>
                  <Table.Th style={{ textAlign: "right" }}>Acciones</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {companies.map((comp) => (
                  <Table.Tr key={comp.id}>
                    <Table.Td>
                      <Text size="sm" fw={700} c="gray.9">
                        {comp.business_name}
                      </Text>
                      <Group gap={6}>
                        <Text
                          size="xs"
                          fw={600}
                          style={{ fontFamily: "monospace" }}
                          c="dimmed"
                        >
                          {comp.ruc}
                        </Text>
                        {comp.trademark_name && (
                          <Badge size="xs" variant="outline" color="gray">
                            {comp.trademark_name}
                          </Badge>
                        )}
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Text size="xs" fw={600}>
                        {comp.user?.name || "Administrador"}
                      </Text>
                      <Text size="11px" c="dimmed">
                        {comp.user?.email}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        variant="filled"
                        color={comp.is_production ? "blue" : "yellow"}
                        size="sm"
                      >
                        {comp.is_production ? "Producción" : "Beta / Pruebas"}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Group gap={4}>
                        <Shield
                          size={14}
                          color={
                            comp.certificate_path
                              ? "var(--mantine-color-teal-6)"
                              : "var(--mantine-color-gray-5)"
                          }
                        />
                        <Text
                          size="xs"
                          c={comp.certificate_path ? "teal.7" : "dimmed"}
                          fw={500}
                        >
                          {comp.certificate_path ? "Cargado" : "Faltante"}
                        </Text>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Badge variant="light" color="teal" size="sm">
                        {comp.documents_count ?? 0} emitidos
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <StatusBadge
                        status={comp.is_active ? "active" : "inactive"}
                      />
                    </Table.Td>
                    <Table.Td style={{ textAlign: "right" }}>
                      <Group gap={6} justify="flex-end">
                        <Tooltip label="Ver Detalle Completo">
                          <ActionIcon
                            variant="light"
                            color="teal"
                            size="sm"
                            onClick={() => handleOpenDrawer(comp)}
                          >
                            <Eye size={14} />
                          </ActionIcon>
                        </Tooltip>

                        <Tooltip label="Editar Empresa">
                          <ActionIcon
                            variant="light"
                            color="blue"
                            size="sm"
                            onClick={() => handleOpenEdit(comp)}
                          >
                            <Edit2 size={14} />
                          </ActionIcon>
                        </Tooltip>

                        <Tooltip label="Eliminar Empresa">
                          <ActionIcon
                            variant="light"
                            color="red"
                            size="sm"
                            onClick={() => handleDeleteCompany(comp)}
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

      {/* Modal: Create / Edit Company */}
      <Modal
        opened={createModalOpen || editModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          setEditModalOpen(false);
        }}
        title={
          <Title order={4}>
            {editModalOpen
              ? `Editar Empresa: ${selectedCompany?.business_name}`
              : "Registrar Nueva Empresa Emisora"}
          </Title>
        }
        size="xl"
        centered
        radius="md"
      >
        <form onSubmit={form.onSubmit(handleSubmitCompany)}>
          <Tabs defaultValue="general" color="teal">
            <Tabs.List mb="md">
              <Tabs.Tab value="general" leftSection={<Building2 size={15} />}>
                1. Datos Fiscales
              </Tabs.Tab>
              <Tabs.Tab value="sunat" leftSection={<Shield size={15} />}>
                2. Credenciales SOL & Certificado
              </Tabs.Tab>
              <Tabs.Tab value="webhooks" leftSection={<Webhook size={15} />}>
                3. Webhooks & Notificaciones
              </Tabs.Tab>
              <Tabs.Tab value="mail" leftSection={<Mail size={15} />}>
                4. Correo Propio (Opcional)
              </Tabs.Tab>
            </Tabs.List>

            {/* Tab 1: Datos Fiscales */}
            <Tabs.Panel value="general">
              <Stack gap="md">
                {isSuperAdmin && (
                  <Select
                    label="Asignar a Desarrollador / Cuenta"
                    placeholder="Seleccione el usuario dueño de esta empresa"
                    data={users.map((u) => ({
                      value: String(u.id),
                      label: `${u.name} (${u.email})`,
                    }))}
                    {...form.getInputProps("user_id")}
                  />
                )}

                <Grid gap="md">
                  <Grid.Col span={{ base: 12, sm: 8 }}>
                    <TextInput
                      label="Número de RUC"
                      placeholder="20601234567"
                      maxLength={11}
                      required
                      {...form.getInputProps("ruc")}
                    />
                  </Grid.Col>
                  <Grid.Col
                    span={{ base: 12, sm: 4 }}
                    style={{ display: "flex", alignItems: "flex-end" }}
                  >
                    <Button
                      fullWidth
                      variant="light"
                      color="teal"
                      onClick={handleQueryRuc}
                      loading={queryingRuc}
                    >
                      Autocompletar RUC
                    </Button>
                  </Grid.Col>
                </Grid>

                <TextInput
                  label="Razón Social (según ficha RUC)"
                  placeholder="MI EMPRESA S.A.C."
                  required
                  {...form.getInputProps("business_name")}
                />

                <TextInput
                  label="Nombre Comercial"
                  placeholder="Factos Tech"
                  {...form.getInputProps("trademark_name")}
                />

                <TextInput
                  label="Dirección Fiscal"
                  placeholder="AV. LOS PROCERES 123 - URB. CENTRAL"
                  {...form.getInputProps("address")}
                />

                <Grid gap="md">
                  <Grid.Col span={{ base: 12, sm: 3 }}>
                    <TextInput
                      label="Ubigeo"
                      placeholder="150101"
                      maxLength={6}
                      {...form.getInputProps("ubigeo")}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 3 }}>
                    <TextInput
                      label="Departamento"
                      placeholder="LIMA"
                      {...form.getInputProps("department")}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 3 }}>
                    <TextInput
                      label="Provincia"
                      placeholder="LIMA"
                      {...form.getInputProps("province")}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 3 }}>
                    <TextInput
                      label="Distrito"
                      placeholder="LIMA"
                      {...form.getInputProps("district")}
                    />
                  </Grid.Col>
                </Grid>

                <Grid gap="md">
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <TextInput
                      label="Código de Establecimiento SUNAT"
                      placeholder="0000"
                      maxLength={4}
                      {...form.getInputProps("establishment_code")}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <Switch
                      label="Ambiente de Producción SUNAT"
                      description="Desactivado para Beta / Pruebas"
                      mt="sm"
                      {...form.getInputProps("is_production", {
                        type: "checkbox",
                      })}
                    />
                  </Grid.Col>
                </Grid>
              </Stack>
            </Tabs.Panel>

            {/* Tab 2: SOL & Certificado */}
            <Tabs.Panel value="sunat">
              <Stack gap="md">
                <Grid gap="md">
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <TextInput
                      label="Usuario Secundario SOL"
                      placeholder="MODDATOS"
                      required
                      {...form.getInputProps("sol_user")}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <PasswordInput
                      label="Clave SOL"
                      placeholder={editModalOpen ? "••••••••" : "moddatos"}
                      required={!editModalOpen}
                      {...form.getInputProps("sol_pass")}
                    />
                  </Grid.Col>
                </Grid>

                <Divider
                  my="xs"
                  label="Credenciales GRE (Para Guías de Remisión)"
                  labelPosition="center"
                />

                <Grid gap="md">
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <TextInput
                      label="Client ID (API SUNAT GRE)"
                      placeholder="test-85e5b0ae-255c-..."
                      {...form.getInputProps("client_id")}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <PasswordInput
                      label="Client Secret (API SUNAT GRE)"
                      placeholder="test-Hty/M6QshYv..."
                      {...form.getInputProps("client_secret")}
                    />
                  </Grid.Col>
                </Grid>

                <Divider
                  my="xs"
                  label="Certificado Digital Firma Electrónica"
                  labelPosition="center"
                />

                <FileInput
                  label="Archivo del Certificado (.pem, .pfx, .crt)"
                  placeholder="Seleccionar archivo cert.pem"
                  value={certificateFile}
                  onChange={setCertificateFile}
                />

                <PasswordInput
                  label="Contraseña del Certificado Digital"
                  placeholder={editModalOpen ? "••••••••" : "123456"}
                  required={!editModalOpen}
                  {...form.getInputProps("certificate_pass")}
                />
              </Stack>
            </Tabs.Panel>

            {/* Tab 3: Webhooks & Notificaciones */}
            <Tabs.Panel value="webhooks">
              <Stack gap="md">
                <TextInput
                  label="URL del Webhook de Recepción"
                  placeholder="https://su-sistema.com/api/webhooks/factos"
                  {...form.getInputProps("webhook_url")}
                />

                <PasswordInput
                  label="Secreto del Webhook (Para validación HMAC)"
                  placeholder="secret_webhook_key_123"
                  {...form.getInputProps("webhook_secret")}
                />

                <Divider my="xs" />

                <Switch
                  label="Activar notificaciones por correo electrónico"
                  {...form.getInputProps("email_notifications_active", {
                    type: "checkbox",
                  })}
                />

                <Switch
                  label="Enviar comprobante automáticamente al correo del cliente"
                  {...form.getInputProps("send_to_client_email", {
                    type: "checkbox",
                  })}
                />

                <TextInput
                  label="Correos de Copia Oculta de la Empresa (CC)"
                  placeholder="contabilidad@empresa.pe, gerencia@empresa.pe"
                  description="Separar múltiples correos con comas"
                  {...form.getInputProps("company_copy_emails_text")}
                />
              </Stack>
            </Tabs.Panel>

            {/* Tab 4: Correo Propio SMTP */}
            <Tabs.Panel value="mail">
              <Stack gap="md">
                <Text size="xs" c="dimmed">
                  Si completa estos datos, los comprobantes de esta empresa se
                  enviarán desde este servidor SMTP. Si los deja vacíos, se
                  enviarán automáticamente a través del correo central del
                  facturador configurado por el super administrador.
                </Text>

                <Grid gap="md">
                  <Grid.Col span={{ base: 12, sm: 8 }}>
                    <TextInput
                      label="Host SMTP"
                      placeholder="smtp.gmail.com"
                      {...form.getInputProps("mail_host")}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 4 }}>
                    <NumberInput
                      label="Puerto"
                      placeholder="587"
                      {...form.getInputProps("mail_port")}
                    />
                  </Grid.Col>
                </Grid>

                <TextInput
                  label="Usuario SMTP"
                  placeholder="facturacion@miempresa.pe"
                  {...form.getInputProps("mail_username")}
                />
                <PasswordInput
                  label="Contraseña SMTP"
                  placeholder="••••••••"
                  {...form.getInputProps("mail_password")}
                />

                <Grid gap="md">
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <TextInput
                      label="Correo Remitente"
                      placeholder="facturacion@miempresa.pe"
                      {...form.getInputProps("mail_from_address")}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <TextInput
                      label="Nombre Remitente"
                      placeholder="Facturación Mi Empresa"
                      {...form.getInputProps("mail_from_name")}
                    />
                  </Grid.Col>
                </Grid>
              </Stack>
            </Tabs.Panel>
          </Tabs>

          <Group justify="flex-end" mt="xl">
            <Button
              variant="default"
              onClick={() => {
                setCreateModalOpen(false);
                setEditModalOpen(false);
              }}
            >
              Cancelar
            </Button>
            <Button type="submit" color="teal">
              {editModalOpen ? "Guardar Cambios" : "Registrar Empresa"}
            </Button>
          </Group>
        </form>
      </Modal>

      {/* Drawer: Company Detail */}
      <Drawer
        opened={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={
          <Group gap="xs">
            <Building2 size={20} color="var(--mantine-color-teal-6)" />
            <Text fw={700} size="md">
              {selectedCompany?.business_name}
            </Text>
          </Group>
        }
        position="right"
        size="lg"
      >
        {selectedCompany && (
          <Stack gap="lg" mt="md">
            <Box>
              <Text size="xs" fw={700} c="dimmed" tt="uppercase">
                Identificación
              </Text>
              <Text size="lg" fw={800} style={{ fontFamily: "monospace" }}>
                RUC: {selectedCompany.ruc}
              </Text>
              <Group gap="xs" mt={4}>
                <Badge
                  color={selectedCompany.is_production ? "blue" : "yellow"}
                >
                  {selectedCompany.is_production
                    ? "Producción"
                    : "Beta / Pruebas"}
                </Badge>
                <StatusBadge
                  status={selectedCompany.is_active ? "active" : "inactive"}
                />
              </Group>
            </Box>

            <Divider />

            <Box>
              <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb="xs">
                Domicilio Fiscal
              </Text>
              <Text size="sm">
                {selectedCompany.address || "No especificada"}
              </Text>
              <Text size="xs" c="dimmed">
                {selectedCompany.district} - {selectedCompany.province} -{" "}
                {selectedCompany.department} (Ubigeo: {selectedCompany.ubigeo})
              </Text>
            </Box>

            <Divider />

            <Box>
              <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb="xs">
                Credenciales SUNAT
              </Text>
              <Text size="sm">
                <b>Usuario SOL:</b> {selectedCompany.sol_user}
              </Text>
              <Text size="sm">
                <b>Certificado Digital:</b>{" "}
                {selectedCompany.certificate_path ? "Configurado" : "Pendiente"}
              </Text>
              <Text size="sm">
                <b>Credenciales GRE:</b>{" "}
                {selectedCompany.client_id ? "Configurado" : "Pendiente"}
              </Text>
            </Box>

            <Divider />

            <Box>
              <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb="xs">
                Integración & Webhook
              </Text>
              <Text size="sm" style={{ wordBreak: "break-all" }}>
                <b>URL:</b> {selectedCompany.webhook_url || "No configurada"}
              </Text>
            </Box>

            <Group justify="flex-end" mt="xl">
              <Button
                variant="light"
                color="blue"
                leftSection={<Edit2 size={16} />}
                onClick={() => {
                  setDrawerOpen(false);
                  handleOpenEdit(selectedCompany);
                }}
              >
                Editar Empresa
              </Button>
            </Group>
          </Stack>
        )}
      </Drawer>
    </Stack>
  );
}
