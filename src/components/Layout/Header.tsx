import {
  Badge,
  Box,
  Button,
  Grid,
  Group,
  Loader,
  Modal,
  Paper,
  SegmentedControl,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { Activity, Coins, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { api } from "../../api/client";

export function Header() {
  const location = useLocation();

  // Exchange rate modal state
  const [tcModalOpen, setTcModalOpen] = useState(false);
  const [tcSource, setTcSource] = useState<"sunat" | "sbs">("sunat");
  const [tcDate, setTcDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [tcLoading, setTcLoading] = useState(false);
  const [tcData, setTcData] = useState<{
    date: string;
    source: string;
    currency: string;
    compra: number;
    venta: number;
  } | null>(null);
  const [tcError, setTcError] = useState<string | null>(null);

  const fetchTc = async (source = tcSource, date = tcDate) => {
    setTcLoading(true);
    setTcError(null);
    try {
      const res = await api.services.exchangeRate({ source, date });
      setTcData(res.data);
    } catch (err: any) {
      setTcError(
        err.message || "No se pudo obtener el tipo de cambio solicitado.",
      );
    } finally {
      setTcLoading(false);
    }
  };

  // Initial quiet fetch for header button
  useEffect(() => {
    fetchTc("sunat", new Date().toISOString().split("T")[0]);
  }, []);

  const handleSourceChange = (val: string) => {
    const src = val as "sunat" | "sbs";
    setTcSource(src);
    fetchTc(src, tcDate);
  };

  const handleDateChange = (val: string) => {
    setTcDate(val);
    fetchTc(tcSource, val);
  };

  const getPageTitle = () => {
    if (location.pathname.startsWith("/dashboard")) return "Panel de Control";
    if (location.pathname.startsWith("/companies")) return "Empresas Emisoras";
    if (location.pathname.startsWith("/documents"))
      return "Comprobantes de Pago";
    if (location.pathname.startsWith("/despatches")) return "Guías de Remisión";
    if (location.pathname.startsWith("/api-keys")) return "API Keys (POS / ERP)";
    if (location.pathname.startsWith("/users"))
      return "Gestión de Desarrolladores";
    if (location.pathname.startsWith("/settings"))
      return "Configuración del Sistema";
    return "Factos";
  };

  return (
    <>
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
        <Title
          order={3}
          fw={700}
          c="gray.9"
          style={{ letterSpacing: "-0.3px" }}
        >
          {getPageTitle()}
        </Title>

        <Group gap="sm">
          {/* Quick Exchange Rate Pill */}
          <Button
            variant="light"
            color="teal"
            size="xs"
            leftSection={<Coins size={14} />}
            onClick={() => {
              setTcModalOpen(true);
              fetchTc();
            }}
          >
            {tcData
              ? `T/C: S/ ${Number(tcData.venta || 0).toFixed(3)} (${tcData.source})`
              : "Tipo de Cambio"}
          </Button>

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

      {/* Modal: Tipo de Cambio SBS / SUNAT */}
      <Modal
        opened={tcModalOpen}
        onClose={() => setTcModalOpen(false)}
        title={
          <Group gap="xs">
            <Coins size={18} color="var(--mantine-color-teal-6)" />
            <Text fw={700} size="sm">
              Consulta de Tipo de Cambio Oficial
            </Text>
          </Group>
        }
        centered
        radius="md"
      >
        <Stack gap="md">
          {/* Selector SUNAT vs SBS */}
          <Box>
            <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb={6}>
              Origen Oficial de la Consulta
            </Text>
            <SegmentedControl
              fullWidth
              size="sm"
              value={tcSource}
              onChange={handleSourceChange}
              data={[
                { label: "SUNAT (Comprobantes)", value: "sunat" },
                { label: "SBS (Bancario)", value: "sbs" },
              ]}
              color="teal"
            />
          </Box>

          {/* Date Picker */}
          <Group align="flex-end" grow>
            <TextInput
              label="Fecha de Consulta"
              type="date"
              size="xs"
              value={tcDate}
              onChange={(e) => handleDateChange(e.currentTarget.value)}
            />
            <Button
              leftSection={<RefreshCw size={14} />}
              variant="default"
              size="xs"
              onClick={() => fetchTc()}
              loading={tcLoading}
              style={{ maxWidth: 120 }}
            >
              Actualizar
            </Button>
          </Group>

          {/* Result Cards */}
          {tcLoading ? (
            <Box py="xl" ta="center">
              <Loader size="sm" color="teal" />
              <Text size="xs" c="dimmed" mt="xs">
                Consultando tipo de cambio con {tcSource.toUpperCase()}...
              </Text>
            </Box>
          ) : tcError ? (
            <Paper
              withBorder
              p="sm"
              radius="sm"
              style={{ backgroundColor: "#fef2f2" }}
            >
              <Text size="xs" c="red.7" fw={600}>
                {tcError}
              </Text>
            </Paper>
          ) : tcData ? (
            <Stack gap="xs">
              <Grid gap="sm">
                <Grid.Col span={6}>
                  <Paper
                    withBorder
                    p="md"
                    radius="md"
                    ta="center"
                    style={{ backgroundColor: "#fafafa" }}
                  >
                    <Text size="xs" fw={700} c="dimmed" tt="uppercase">
                      Compra
                    </Text>
                    <Title order={2} fw={800} c="teal.8" mt={4}>
                      S/ {Number(tcData.compra || 0).toFixed(3)}
                    </Title>
                    <Text size="10px" c="dimmed" mt={2}>
                      USD a PEN
                    </Text>
                  </Paper>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Paper
                    withBorder
                    p="md"
                    radius="md"
                    ta="center"
                    style={{ backgroundColor: "#fafafa" }}
                  >
                    <Text size="xs" fw={700} c="dimmed" tt="uppercase">
                      Venta
                    </Text>
                    <Title order={2} fw={800} c="blue.8" mt={4}>
                      S/ {Number(tcData.venta || 0).toFixed(3)}
                    </Title>
                    <Text size="10px" c="dimmed" mt={2}>
                      USD a PEN
                    </Text>
                  </Paper>
                </Grid.Col>
              </Grid>

              <Group justify="space-between" mt="xs">
                <Badge size="xs" variant="light" color="teal">
                  Fuente: {tcData.source}
                </Badge>
                <Text size="xs" c="dimmed">
                  Fecha oficial: {tcData.date}
                </Text>
              </Group>
            </Stack>
          ) : null}
        </Stack>
      </Modal>
    </>
  );
}

