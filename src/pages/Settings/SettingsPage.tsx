import {
  Alert,
  Box,
  Button,
  Card,
  Code,
  Divider,
  Grid,
  Group,
  Loader,
  NumberInput,
  Paper,
  PasswordInput,
  SegmentedControl,
  Select,
  Stack,
  Tabs,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import {
  AlertCircle,
  Building,
  CheckCircle2,
  DollarSign,
  Key,
  Mail,
  Send,
  UserCheck,
} from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../../api/client";
import type { SystemSettingsData } from "../../api/types";
import { playNotificationSound } from "../../utils/sound";

export function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingMail, setTestingMail] = useState(false);
  const [testMailRecipient, setTestMailRecipient] = useState("");

  // Live test states
  const [testingService, setTestingService] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [testDniInput, setTestDniInput] = useState("47586940");
  const [testRucInput, setTestRucInput] = useState("20000000001");
  const [testTcSource, setTestTcSource] = useState<"sunat" | "sbs">("sunat");
  const [testTcDate, setTestTcDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );

  const mailForm = useForm({
    initialValues: {
      mail_mailer: "smtp",
      mail_host: "smtp.gmail.com",
      mail_port: 587,
      mail_username: "",
      mail_password: "",
      mail_encryption: "tls",
      mail_from_address: "",
      mail_from_name: "Factos Facturador",
    },
  });

  const apisForm = useForm({
    initialValues: {
      api_key_dni_ruc: "",
      api_key_tc: "",
      dni_ruc_url: "https://dniruc.apisperu.com/api/v1",
      exchange_rate_url: "https://tipocambio.apisperu.com/api/v1",
    },
  });

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data: SystemSettingsData = await api.settings.get();
      mailForm.setValues({
        mail_mailer: data.mail.mail_mailer || "smtp",
        mail_host: data.mail.mail_host || "smtp.gmail.com",
        mail_port: data.mail.mail_port || 587,
        mail_username: data.mail.mail_username || "",
        mail_password: data.mail.has_password ? "********" : "",
        mail_encryption: data.mail.mail_encryption || "tls",
        mail_from_address: data.mail.mail_from_address || "",
        mail_from_name: data.mail.mail_from_name || "Factos Facturador",
      });

      apisForm.setValues({
        api_key_dni_ruc: data.apisperu.api_key_dni_ruc || "",
        api_key_tc: data.apisperu.api_key_tc || "",
        dni_ruc_url:
          data.apisperu.dni_ruc_url || "https://dniruc.apisperu.com/api/v1",
        exchange_rate_url:
          data.apisperu.exchange_rate_url ||
          "https://tipocambio.apisperu.com/api/v1",
      });
    } catch (err: any) {
      notifications.show({
        title: "Error",
        message:
          err.message ||
          "No se pudieron cargar las configuraciones del sistema",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSaveMail = async (values: typeof mailForm.values) => {
    setSaving(true);
    try {
      await api.settings.update({ mail: values as any });
      notifications.show({
        title: "Éxito",
        message:
          "Configuración de correo del facturador guardada correctamente.",
        color: "teal",
      });
      loadSettings();
    } catch (err: any) {
      notifications.show({
        title: "Error al guardar",
        message: err.message,
        color: "red",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveApis = async (values: typeof apisForm.values) => {
    setSaving(true);
    try {
      await api.settings.update({ apisperu: values });
      notifications.show({
        title: "Éxito",
        message: "Credenciales de ApisPerú guardadas correctamente.",
        color: "teal",
      });
      loadSettings();
    } catch (err: any) {
      notifications.show({
        title: "Error al guardar",
        message: err.message,
        color: "red",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestMail = async () => {
    if (!testMailRecipient) {
      notifications.show({
        title: "Campo requerido",
        message: "Ingrese una dirección de correo para la prueba",
        color: "yellow",
      });
      return;
    }

    setTestingMail(true);
    try {
      const res = await api.settings.testMail({
        recipient: testMailRecipient,
        mail_host: mailForm.values.mail_host,
        mail_port: Number(mailForm.values.mail_port),
        mail_username: mailForm.values.mail_username,
        mail_password: mailForm.values.mail_password,
        mail_encryption: mailForm.values.mail_encryption,
        mail_from_address: mailForm.values.mail_from_address,
        mail_from_name: mailForm.values.mail_from_name,
      });

      notifications.show({
        title: "Prueba Exitosa",
        message: res.message || "Correo de prueba enviado satisfactoriamente",
        color: "teal",
      });
    } catch (err: any) {
      notifications.show({
        title: "Fallo de Envío",
        message: err.message || "No se pudo conectar al servidor SMTP",
        color: "red",
        autoClose: 10000,
      });
    } finally {
      setTestingMail(false);
    }
  };

  const handleRunServiceTest = async (type: "dni" | "ruc" | "tc") => {
    setTestingService(true);
    setTestResult(null);
    setTestError(null);

    const query =
      type === "dni"
        ? testDniInput
        : type === "ruc"
          ? testRucInput
          : testTcDate || undefined;
    const token =
      type === "tc"
        ? apisForm.values.api_key_tc
        : apisForm.values.api_key_dni_ruc;

    try {
      const res = await api.settings.testApisPeru({
        type,
        query,
        token,
        source: type === "tc" ? testTcSource : undefined,
      });
      setTestResult(res);
      playNotificationSound("success");
      notifications.show({
        title: "Consulta Exitosa",
        message:
          type === "tc"
            ? `Tipo de cambio (${testTcSource.toUpperCase()}) consultado con éxito`
            : `Servicio ${type.toUpperCase()} respondió correctamente`,
        color: "teal",
      });
    } catch (err: any) {
      setTestError(err.message || "Error en la consulta");
      playNotificationSound("error");
      notifications.show({
        title: "Error en consulta",
        message: err.message,
        color: "red",
      });
    } finally {
      setTestingService(false);
    }
  };

  if (loading) {
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

  return (
    <Stack gap="xl">
      <Box>
        <Title
          order={2}
          fw={700}
          c="gray.9"
          style={{ letterSpacing: "-0.4px" }}
        >
          Configuración Global del Facturador
        </Title>
        <Text size="sm" c="dimmed">
          Administre la pasarela de correo central y los tokens de consulta
          externa (DNI, RUC y Tipo de Cambio)
        </Text>
      </Box>

      <Tabs defaultValue="mail" color="teal">
        <Tabs.List>
          <Tabs.Tab value="mail" leftSection={<Mail size={16} />}>
            Correo del Sistema (SMTP)
          </Tabs.Tab>
          <Tabs.Tab value="apisperu" leftSection={<Key size={16} />}>
            Tokens de Consulta (ApisPerú)
          </Tabs.Tab>
        </Tabs.List>

        {/* Tab 1: Mail Configuration */}
        <Tabs.Panel value="mail" pt="lg">
          <Grid gap="xl">
            <Grid.Col span={{ base: 12, md: 7 }}>
              <Card
                withBorder
                radius="md"
                p="xl"
                style={{ backgroundColor: "#ffffff" }}
              >
                <Title order={4} fw={600} mb="xs">
                  Credenciales del Servidor SMTP
                </Title>
                <Text size="xs" c="dimmed" mb="lg">
                  Este correo se utiliza para enviar notificaciones automáticas
                  y como respaldo cuando una empresa emisora no tiene SMTP
                  propio configurado.
                </Text>

                <form onSubmit={mailForm.onSubmit(handleSaveMail)}>
                  <Stack gap="md">
                    <Grid gap="md">
                      <Grid.Col span={{ base: 12, sm: 6 }}>
                        <Select
                          label="Driver / Método"
                          data={[
                            { value: "smtp", label: "SMTP (Recomendado)" },
                            { value: "log", label: "Log (Depuración local)" },
                            {
                              value: "sendmail",
                              label: "Sendmail del servidor",
                            },
                          ]}
                          {...mailForm.getInputProps("mail_mailer")}
                        />
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, sm: 6 }}>
                        <Select
                          label="Cifrado de Conexión"
                          data={[
                            {
                              value: "tls",
                              label: "TLS (Puerto 587 habitual)",
                            },
                            {
                              value: "ssl",
                              label: "SSL (Puerto 465 habitual)",
                            },
                            { value: "none", label: "Sin cifrado" },
                          ]}
                          {...mailForm.getInputProps("mail_encryption")}
                        />
                      </Grid.Col>
                    </Grid>

                    <Grid gap="md">
                      <Grid.Col span={{ base: 12, sm: 8 }}>
                        <TextInput
                          label="Host del Servidor SMTP"
                          placeholder="smtp.gmail.com"
                          required
                          {...mailForm.getInputProps("mail_host")}
                        />
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, sm: 4 }}>
                        <NumberInput
                          label="Puerto"
                          placeholder="587"
                          required
                          min={1}
                          max={65535}
                          {...mailForm.getInputProps("mail_port")}
                        />
                      </Grid.Col>
                    </Grid>

                    <TextInput
                      label="Usuario / Correo Electrónico SMTP"
                      placeholder="facturacion@factos.pe"
                      required
                      {...mailForm.getInputProps("mail_username")}
                    />

                    <PasswordInput
                      label="Contraseña de Aplicación SMTP"
                      placeholder="••••••••••••••••"
                      description="En Gmail u Outlook utilice una Contraseña de Aplicación dedicada"
                      {...mailForm.getInputProps("mail_password")}
                    />

                    <Divider my="xs" />

                    <Grid gap="md">
                      <Grid.Col span={{ base: 12, sm: 6 }}>
                        <TextInput
                          label="Correo Remitente (From)"
                          placeholder="facturacion@factos.pe"
                          required
                          {...mailForm.getInputProps("mail_from_address")}
                        />
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, sm: 6 }}>
                        <TextInput
                          label="Nombre Remitente"
                          placeholder="Factos Facturador"
                          required
                          {...mailForm.getInputProps("mail_from_name")}
                        />
                      </Grid.Col>
                    </Grid>

                    <Group justify="flex-end" mt="md">
                      <Button type="submit" color="teal" loading={saving}>
                        Guardar Configuración
                      </Button>
                    </Group>
                  </Stack>
                </form>
              </Card>
            </Grid.Col>

            {/* Test Mail Column */}
            <Grid.Col span={{ base: 12, md: 5 }}>
              <Card
                withBorder
                radius="md"
                p="xl"
                style={{ backgroundColor: "#ffffff" }}
              >
                <Group gap="xs" mb="xs">
                  <Send size={18} color="var(--mantine-color-teal-6)" />
                  <Title order={4} fw={600}>
                    Probar Envío de Correo
                  </Title>
                </Group>
                <Text size="xs" c="dimmed" mb="md">
                  Envíe un correo de verificación en tiempo real para confirmar
                  que las credenciales SMTP funcionan correctamente.
                </Text>

                <Stack gap="md">
                  <TextInput
                    label="Correo Destinatario de Prueba"
                    placeholder="su-correo@ejemplo.com"
                    value={testMailRecipient}
                    onChange={(e) =>
                      setTestMailRecipient(e.currentTarget.value)
                    }
                    required
                  />

                  <Button
                    leftSection={<Send size={16} />}
                    variant="light"
                    color="teal"
                    onClick={handleTestMail}
                    loading={testingMail}
                  >
                    Enviar Correo de Prueba
                  </Button>
                </Stack>
              </Card>
            </Grid.Col>
          </Grid>
        </Tabs.Panel>

        {/* Tab 2: ApisPerú Configuration */}
        <Tabs.Panel value="apisperu" pt="lg">
          <Grid gap="xl">
            <Grid.Col span={{ base: 12, md: 7 }}>
              <Card
                withBorder
                radius="md"
                p="xl"
                style={{ backgroundColor: "#ffffff" }}
              >
                <Title order={4} fw={600} mb="xs">
                  Credenciales ApisPerú
                </Title>
                <Text size="xs" c="dimmed" mb="lg">
                  Permite a Factos y a los desarrolladores consultar
                  automáticamente nombres de personas por DNI, datos de empresas
                  por RUC y tipo de cambio oficial SBS/SUNAT.
                </Text>

                <form onSubmit={apisForm.onSubmit(handleSaveApis)}>
                  <Stack gap="md">
                    <PasswordInput
                      label="Token Bearer - DNI y RUC"
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      required
                      {...apisForm.getInputProps("api_key_dni_ruc")}
                    />

                    <TextInput
                      label="URL Base DNI / RUC"
                      placeholder="https://dniruc.apisperu.com/api/v1"
                      required
                      {...apisForm.getInputProps("dni_ruc_url")}
                    />

                    <Divider my="xs" />

                    <PasswordInput
                      label="Token Bearer - Tipo de Cambio"
                      placeholder="269a1a077e76910681d9f80e60aca5154b727fedf..."
                      required
                      {...apisForm.getInputProps("api_key_tc")}
                    />

                    <TextInput
                      label="URL Base Tipo de Cambio"
                      placeholder="https://tipocambio.apisperu.com/api/v1"
                      required
                      {...apisForm.getInputProps("exchange_rate_url")}
                    />

                    <Group justify="flex-end" mt="md">
                      <Button type="submit" color="teal" loading={saving}>
                        Guardar Credenciales
                      </Button>
                    </Group>
                  </Stack>
                </form>
              </Card>
            </Grid.Col>

            {/* Test ApisPeru Column */}
            <Grid.Col span={{ base: 12, md: 5 }}>
              <Card
                withBorder
                radius="md"
                p="xl"
                style={{ backgroundColor: "#ffffff" }}
              >
                <Group gap="xs" mb="xs">
                  <CheckCircle2 size={18} color="var(--mantine-color-teal-6)" />
                  <Title order={4} fw={600}>
                    Comprobador en Vivo
                  </Title>
                </Group>
                <Text size="xs" c="dimmed" mb="md">
                  Verifique que sus tokens tienen saldo disponible y responden
                  con datos verídicos.
                </Text>

                <Stack gap="md">
                  {/* Test DNI */}
                  <Group align="flex-end" grow>
                    <TextInput
                      label="DNI a Consultar"
                      value={testDniInput}
                      onChange={(e) => setTestDniInput(e.currentTarget.value)}
                      maxLength={8}
                    />
                    <Button
                      leftSection={<UserCheck size={16} />}
                      variant="light"
                      color="teal"
                      onClick={() => handleRunServiceTest("dni")}
                      loading={testingService}
                    >
                      Probar DNI
                    </Button>
                  </Group>

                  {/* Test RUC */}
                  <Group align="flex-end" grow>
                    <TextInput
                      label="RUC a Consultar"
                      value={testRucInput}
                      onChange={(e) => setTestRucInput(e.currentTarget.value)}
                      maxLength={11}
                    />
                    <Button
                      leftSection={<Building size={16} />}
                      variant="light"
                      color="blue"
                      onClick={() => handleRunServiceTest("ruc")}
                      loading={testingService}
                    >
                      Probar RUC
                    </Button>
                  </Group>

                  {/* Test Tipo de Cambio */}
                  <Paper
                    withBorder
                    p="xs"
                    radius="sm"
                    style={{ backgroundColor: "#fafafa" }}
                  >
                    <Stack gap="xs">
                      <Group justify="space-between" align="center">
                        <Text size="xs" fw={700} c="dimmed" tt="uppercase">
                          Tipo de Cambio
                        </Text>
                        <SegmentedControl
                          size="xs"
                          value={testTcSource}
                          onChange={(val) =>
                            setTestTcSource(val as "sunat" | "sbs")
                          }
                          data={[
                            { label: "SUNAT", value: "sunat" },
                            { label: "SBS", value: "sbs" },
                          ]}
                          color="teal"
                        />
                      </Group>

                      <Group gap="xs" grow>
                        <TextInput
                          type="date"
                          size="xs"
                          value={testTcDate}
                          onChange={(e) => setTestTcDate(e.currentTarget.value)}
                        />
                        <Button
                          leftSection={<DollarSign size={15} />}
                          variant="light"
                          color="violet"
                          size="xs"
                          onClick={() => handleRunServiceTest("tc")}
                          loading={testingService}
                        >
                          Consultar {testTcSource.toUpperCase()}
                        </Button>
                      </Group>
                    </Stack>
                  </Paper>

                  {/* Results box */}
                  {testError && (
                    <Alert
                      icon={<AlertCircle size={16} />}
                      title="Error de Respuesta"
                      color="red"
                      variant="light"
                    >
                      {testError}
                    </Alert>
                  )}

                  {testResult && (
                    <Box mt="xs">
                      <Text size="xs" fw={700} c="dimmed" mb={4}>
                        Respuesta Obtenida:
                      </Text>
                      <Code
                        block
                        style={{
                          maxHeight: 180,
                          overflowY: "auto",
                          fontSize: "11px",
                        }}
                      >
                        {JSON.stringify(testResult, null, 2)}
                      </Code>
                    </Box>
                  )}
                </Stack>
              </Card>
            </Grid.Col>
          </Grid>
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}
