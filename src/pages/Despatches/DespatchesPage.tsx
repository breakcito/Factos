import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Card,
  Divider,
  Drawer,
  Grid,
  Group,
  Loader,
  Modal,
  Pagination,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Textarea,
  Title,
  Tooltip,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  Ban,
  Download,
  Eye,
  FileCode,
  FileText,
  MapPin,
  RefreshCw,
  Search,
  Truck,
} from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../../api/client";
import type { Company, Despatch } from "../../api/types";
import { EmptyState } from "../../components/Common/EmptyState";
import { StatusBadge } from "../../components/Common/StatusBadge";

export function DespatchesPage() {
  const [despatches, setDespatches] = useState<Despatch[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDespatches, setTotalDespatches] = useState(0);

  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedEnvironment, setSelectedEnvironment] = useState<string>("");
  const [search, setSearch] = useState("");

  // Modals & Drawer
  const [selectedDespatch, setSelectedDespatch] = useState<Despatch | null>(
    null,
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [voidModalOpen, setVoidModalOpen] = useState(false);
  const [voidReason, setVoidReason] = useState("");
  const [voiding, setVoiding] = useState(false);

  const loadCompanies = async () => {
    try {
      const data = await api.companies.getAll();
      setCompanies(data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadDespatches = async () => {
    setLoading(true);
    try {
      const res = await api.despatches.getAll({
        company_id: selectedCompanyId || undefined,
        status: selectedStatus || undefined,
        is_production:
          selectedEnvironment === "prod"
            ? true
            : selectedEnvironment === "beta"
              ? false
              : undefined,
        search: search || undefined,
        page,
        per_page: 15,
      });

      setDespatches(res.data);
      setPage(res.current_page);
      setTotalPages(res.last_page);
      setTotalDespatches(res.total);
    } catch (err: any) {
      notifications.show({
        title: "Error",
        message: err.message || "No se pudieron cargar las guías",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  useEffect(() => {
    loadDespatches();
  }, [page, selectedCompanyId, selectedStatus, selectedEnvironment, search]);

  const handleOpenDetail = (despatch: Despatch) => {
    setSelectedDespatch(despatch);
    setDrawerOpen(true);
  };

  const handleOpenVoid = (despatch: Despatch) => {
    setSelectedDespatch(despatch);
    setVoidReason("");
    setVoidModalOpen(true);
  };

  const handleExecuteVoid = async () => {
    if (!selectedDespatch || !voidReason.trim()) {
      notifications.show({
        title: "Motivo requerido",
        message: "Debe ingresar un motivo para anular la guía ante SUNAT.",
        color: "yellow",
      });
      return;
    }

    setVoiding(true);
    try {
      await api.despatches.void(selectedDespatch.id, voidReason);
      notifications.show({
        title: "Guía Anulada",
        message: "La guía de remisión ha sido anulada ante SUNAT.",
        color: "teal",
      });
      setVoidModalOpen(false);
      loadDespatches();
    } catch (err: any) {
      notifications.show({
        title: "Error al anular",
        message: err.message,
        color: "red",
      });
    } finally {
      setVoiding(false);
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
            Guías de Remisión Electrónica
          </Title>
          <Text size="sm" c="dimmed">
            Guías de remitente emitidas bajo normativa SUNAT con código QR y
            sustento de traslado
          </Text>
        </Box>

        <Button
          leftSection={<RefreshCw size={16} />}
          variant="default"
          size="sm"
          onClick={loadDespatches}
          loading={loading}
        >
          Actualizar
        </Button>
      </Group>

      {/* Filters Bar Card */}
      <Card
        withBorder
        radius="md"
        p="md"
        style={{ backgroundColor: "#ffffff" }}
      >
        <Grid gap="sm" align="center">
          <Grid.Col span={{ base: 12, sm: 3 }}>
            <TextInput
              placeholder="Buscar serie, número, destinatario..."
              leftSection={<Search size={16} />}
              value={search}
              onChange={(e) => setSearch(e.currentTarget.value)}
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 3 }}>
            <Select
              placeholder="Todas las empresas"
              clearable
              data={companies.map((c) => ({
                value: c.id,
                label: `${c.ruc} - ${c.business_name}`,
              }))}
              value={selectedCompanyId}
              onChange={(val) => setSelectedCompanyId(val || "")}
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 3 }}>
            <Select
              placeholder="Estado SUNAT"
              clearable
              data={[
                { value: "accepted", label: "Aceptado" },
                { value: "pending", label: "En Proceso" },
                { value: "rejected", label: "Rechazado" },
                { value: "voided", label: "Anulado" },
              ]}
              value={selectedStatus}
              onChange={(val) => setSelectedStatus(val || "")}
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 3 }}>
            <Select
              placeholder="Entorno"
              clearable
              data={[
                { value: "prod", label: "Producción" },
                { value: "beta", label: "Beta / Prueba" },
              ]}
              value={selectedEnvironment}
              onChange={(val) => setSelectedEnvironment(val || "")}
            />
          </Grid.Col>
        </Grid>
      </Card>

      {/* Main Despatches Table */}
      <Card
        withBorder
        radius="md"
        p="lg"
        style={{ backgroundColor: "#ffffff" }}
      >
        <Group justify="space-between" mb="md">
          <Text size="sm" fw={600} c="gray.7">
            {totalDespatches} guías encontradas
          </Text>
        </Group>

        {loading ? (
          <Box py="xl" ta="center">
            <Loader color="teal" />
          </Box>
        ) : despatches.length === 0 ? (
          <EmptyState
            title="No se encontraron guías de remisión"
            description="No hay registros que coincidan con los filtros aplicados."
            icon={<Truck size={36} />}
          />
        ) : (
          <Table.ScrollContainer minWidth={850}>
            <Table verticalSpacing="sm" highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Guía (Serie-Correlativo)</Table.Th>
                  <Table.Th>Emisor</Table.Th>
                  <Table.Th>Destinatario</Table.Th>
                  <Table.Th>Fecha Traslado</Table.Th>
                  <Table.Th>Modalidad</Table.Th>
                  <Table.Th>Estado SUNAT</Table.Th>
                  <Table.Th style={{ textAlign: "right" }}>
                    Descargas / Acciones
                  </Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {despatches.map((desp) => (
                  <Table.Tr key={desp.id}>
                    <Table.Td>
                      <Group gap={6}>
                        <Badge size="xs" variant="light" color="violet">
                          GRE
                        </Badge>
                        {desp.is_production === false ? (
                          <Badge size="xs" variant="outline" color="orange">
                            Beta
                          </Badge>
                        ) : (
                          <Badge size="xs" variant="outline" color="green">
                            Prod
                          </Badge>
                        )}
                        <Text
                          size="sm"
                          fw={700}
                          style={{ fontFamily: "monospace" }}
                        >
                          {desp.series}-{desp.correlative}
                        </Text>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Text
                        size="xs"
                        fw={600}
                        truncate
                        style={{ maxWidth: 180 }}
                      >
                        {desp.company?.business_name || desp.company_id}
                      </Text>
                      <Text size="11px" c="dimmed">
                        {desp.company?.ruc}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text
                        size="xs"
                        fw={500}
                        truncate
                        style={{ maxWidth: 180 }}
                      >
                        {desp.recipient_name}
                      </Text>
                      <Text size="11px" c="dimmed">
                        {desp.recipient_doc_number}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="xs">{desp.transfer_date}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        size="xs"
                        variant="outline"
                        color={desp.transport_mode === "01" ? "blue" : "gray"}
                      >
                        {desp.transport_mode === "01" ? "Público" : "Privado"}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <StatusBadge status={desp.status} />
                    </Table.Td>
                    <Table.Td style={{ textAlign: "right" }}>
                      <Group gap={6} justify="flex-end">
                        <Tooltip label="Ver Detalle de Traslado">
                          <ActionIcon
                            variant="light"
                            color="teal"
                            size="sm"
                            onClick={() => handleOpenDetail(desp)}
                          >
                            <Eye size={14} />
                          </ActionIcon>
                        </Tooltip>

                        <Tooltip label="Descargar XML">
                          <ActionIcon
                            component="a"
                            href={api.despatches.getXmlUrl(desp.id)}
                            target="_blank"
                            variant="light"
                            color="blue"
                            size="sm"
                          >
                            <FileCode size={14} />
                          </ActionIcon>
                        </Tooltip>

                        <Tooltip label="Descargar CDR">
                          <ActionIcon
                            component="a"
                            href={api.despatches.getCdrUrl(desp.id)}
                            target="_blank"
                            variant="light"
                            color="green"
                            size="sm"
                          >
                            <Download size={14} />
                          </ActionIcon>
                        </Tooltip>

                        <Tooltip label="Ver PDF">
                          <ActionIcon
                            component="a"
                            href={api.despatches.getPdfUrl(desp.id)}
                            target="_blank"
                            variant="light"
                            color="indigo"
                            size="sm"
                          >
                            <FileText size={14} />
                          </ActionIcon>
                        </Tooltip>

                        {desp.status === "accepted" && (
                          <Tooltip label="Anular Guía">
                            <ActionIcon
                              variant="light"
                              color="red"
                              size="sm"
                              onClick={() => handleOpenVoid(desp)}
                            >
                              <Ban size={14} />
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

        {totalPages > 1 && (
          <Group justify="center" mt="xl">
            <Pagination
              total={totalPages}
              value={page}
              onChange={setPage}
              color="teal"
            />
          </Group>
        )}
      </Card>

      {/* Drawer: Despatch Detail */}
      <Drawer
        opened={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={
          <Group gap="xs">
            <Truck size={20} color="var(--mantine-color-teal-6)" />
            <Text fw={700} size="md">
              Guía de Remisión {selectedDespatch?.series}-
              {selectedDespatch?.correlative}
            </Text>
          </Group>
        }
        position="right"
        size="lg"
      >
        {selectedDespatch && (
          <Stack gap="md" mt="md">
            <Box>
              <Text size="xs" fw={700} c="dimmed" tt="uppercase">
                Estado SUNAT & Entorno
              </Text>
              <Group justify="space-between" mt={4}>
                <Group gap={8}>
                  <StatusBadge status={selectedDespatch.status} size="lg" />
                  {selectedDespatch.is_production === false ? (
                    <Badge size="md" variant="outline" color="orange">
                      Prueba / Beta
                    </Badge>
                  ) : (
                    <Badge size="md" variant="outline" color="green">
                      Producción
                    </Badge>
                  )}
                </Group>
                <Badge size="md" color="gray" variant="light">
                  Peso: {selectedDespatch.total_weight}{" "}
                  {selectedDespatch.weight_unit}
                </Badge>
              </Group>
              {selectedDespatch.sunat_description && (
                <Text size="xs" c="dimmed" mt={4}>
                  <b>Respuesta SUNAT:</b> {selectedDespatch.sunat_description}
                </Text>
              )}
            </Box>

            <Divider />

            <Box>
              <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb="xs">
                Puntos de Traslado
              </Text>
              <Stack gap="xs">
                <Group align="flex-start" gap="xs">
                  <MapPin size={16} color="var(--mantine-color-teal-6)" />
                  <Box>
                    <Text size="xs" fw={600}>
                      Punto de Partida (Origen):
                    </Text>
                    <Text size="xs" c="dimmed">
                      {selectedDespatch.origin_address} (Ubigeo:{" "}
                      {selectedDespatch.origin_ubigeo})
                    </Text>
                  </Box>
                </Group>

                <Group align="flex-start" gap="xs">
                  <MapPin size={16} color="var(--mantine-color-red-6)" />
                  <Box>
                    <Text size="xs" fw={600}>
                      Punto de Llegada (Destino):
                    </Text>
                    <Text size="xs" c="dimmed">
                      {selectedDespatch.destination_address} (Ubigeo:{" "}
                      {selectedDespatch.destination_ubigeo})
                    </Text>
                  </Box>
                </Group>
              </Stack>
            </Box>

            <Divider />

            <Box>
              <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb="xs">
                Archivos Electrónicos Oficiales
              </Text>
              <Group gap="sm">
                <Button
                  component="a"
                  href={api.despatches.getXmlUrl(selectedDespatch.id)}
                  target="_blank"
                  variant="light"
                  color="blue"
                  size="xs"
                  leftSection={<FileCode size={14} />}
                >
                  XML Firmado
                </Button>
                <Button
                  component="a"
                  href={api.despatches.getCdrUrl(selectedDespatch.id)}
                  target="_blank"
                  variant="light"
                  color="teal"
                  size="xs"
                  leftSection={<Download size={14} />}
                >
                  Constancia CDR
                </Button>
                <Button
                  component="a"
                  href={api.despatches.getPdfUrl(selectedDespatch.id)}
                  target="_blank"
                  variant="light"
                  color="indigo"
                  size="xs"
                  leftSection={<FileText size={14} />}
                >
                  Representación PDF
                </Button>
              </Group>
            </Box>
          </Stack>
        )}
      </Drawer>

      {/* Modal: Void Despatch */}
      <Modal
        opened={voidModalOpen}
        onClose={() => setVoidModalOpen(false)}
        title={<Text fw={700}>Anulación de Guía de Remisión</Text>}
        centered
        radius="md"
      >
        <Stack gap="md">
          <Text size="sm">
            Está a punto de anular la guía de remisión{" "}
            <b>
              {selectedDespatch?.series}-{selectedDespatch?.correlative}
            </b>{" "}
            ante SUNAT.
          </Text>

          <Textarea
            label="Motivo de la anulación"
            placeholder="Ej: Cambio de ruta o error en datos del transporte"
            required
            rows={3}
            value={voidReason}
            onChange={(e) => setVoidReason(e.currentTarget.value)}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={() => setVoidModalOpen(false)}>
              Cancelar
            </Button>
            <Button color="red" onClick={handleExecuteVoid} loading={voiding}>
              Confirmar Anulación
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
