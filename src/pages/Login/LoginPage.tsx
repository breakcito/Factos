import {
  Alert,
  Box,
  Button,
  Card,
  Center,
  Container,
  Group,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { AlertCircle, FileSpreadsheet, Lock, Mail } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm({
    initialValues: {
      email: "",
      password: "",
    },
    validate: {
      email: (value) =>
        /^\S+@\S+$/.test(value) ? null : "Correo electrónico inválido",
      password: (value) =>
        value.length >= 6
          ? null
          : "La contraseña debe tener al menos 6 caracteres",
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    setError(null);
    try {
      await login(values.email, values.password);
      navigate("/dashboard");
    } catch (err: any) {
      setError(
        err.message || "Error al iniciar sesión. Verifique sus credenciales.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      style={{
        minHeight: "100vh",
        backgroundColor: "#f8fafc",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Container size={420} my={40}>
        <Center mb="lg">
          <Group gap="xs">
            <Box
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: "var(--mantine-color-teal-6)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(13, 148, 136, 0.25)",
              }}
            >
              <FileSpreadsheet size={26} strokeWidth={2.2} />
            </Box>
            <Box>
              <Title
                order={2}
                fw={800}
                style={{ letterSpacing: "-0.5px", lineHeight: 1.1 }}
              >
                FACTOS
              </Title>
              <Text
                size="xs"
                fw={600}
                c="dimmed"
                style={{ letterSpacing: "0.8px" }}
              >
                SISTEMA GESTOR PRIVADO
              </Text>
            </Box>
          </Group>
        </Center>

        <Card
          withBorder
          shadow="sm"
          p="xl"
          radius="md"
          style={{
            backgroundColor: "#ffffff",
            borderColor: "var(--mantine-color-gray-2)",
          }}
        >
          <Title order={3} fw={700} ta="center" mb={4} c="gray.9">
            Acceso al Sistema
          </Title>
          <Text c="dimmed" size="sm" ta="center" mb="lg">
            Ingrese sus credenciales de super usuario o desarrollador
          </Text>

          {error && (
            <Alert
              icon={<AlertCircle size={16} />}
              title="Acceso Denegado"
              color="red"
              variant="light"
              mb="md"
            >
              {error}
            </Alert>
          )}

          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="md">
              <TextInput
                label="Correo electrónico"
                placeholder="admin@factos.pe"
                leftSection={<Mail size={16} />}
                required
                {...form.getInputProps("email")}
              />

              <PasswordInput
                label="Contraseña"
                placeholder="••••••••"
                leftSection={<Lock size={16} />}
                required
                {...form.getInputProps("password")}
              />

              <Button
                type="submit"
                fullWidth
                mt="md"
                color="teal"
                loading={loading}
                size="md"
                fw={600}
              >
                Iniciar Sesión
              </Button>
            </Stack>
          </form>
        </Card>

        <Text ta="center" size="xs" c="dimmed" mt="xl">
          Factos © {new Date().getFullYear()} • Plataforma Privada de
          Facturación Electrónica SUNAT
        </Text>
      </Container>
    </Box>
  );
}
