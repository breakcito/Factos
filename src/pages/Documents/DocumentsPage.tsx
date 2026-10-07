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
  Paper,
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
  Building2,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileCode,
  FileSpreadsheet,
  FileText,
  RefreshCw,
  Search,
  User,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../../api/client";
import type { Company, Document } from "../../api/types";
import { EmptyState } from "../../components/Common/EmptyState";
import { StatusBadge } from "../../components/Common/StatusBadge";
import { playNotificationSound } from "../../utils/sound";

export function DocumentsPage() {
  const [searchParams] = useSearchParams();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDocs, setTotalDocs] = useState(0);

  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedEnvironment, setSelectedEnvironment] = useState<string>("");
  const [search, setSearch] = useState("");

  // Modals & Drawer
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [voidModalOpen, setVoidModalOpen] = useState(false);
  const [voidReason, setVoidReason] = useState("");
  const [voiding, setVoiding] = useState(false);
  const [pollingIds, setPollingIds] = useState<string[]>([]);

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

  const loadCompanies = async () => {
    try {
      const data = await api.companies.getAll();
      setCompanies(data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const res = await api.documents.getAll({
        company_id: selectedCompanyId || undefined,
        type_code: selectedType || undefined,
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

      setDocuments(res.data);
      setPage(res.current_page);
      setTotalPages(res.last_page);
      setTotalDocs(res.total);

      // Check if URL specifies an ID to view
      const targetId = searchParams.get("id");
      if (targetId) {
        const found = res.data.find((d) => d.id === targetId);
        if (found) {
          handleOpenDetail(found);
        }
      }
    } catch (err: any) {
      notifications.show({
        title: "Error",
        message: err.message || "No se pudieron cargar los comprobantes",
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
    loadDocuments();
  }, [page, selectedCompanyId, selectedType, selectedStatus, selectedEnvironment, search]);

  // Automatically track any documents in void_pending status
  useEffect(() => {
    const pendingInList = documents
      .filter((d) => d.status === "void_pending")
      .map((d) => d.id);
    if (pendingInList.length > 0) {
      setPollingIds((prev) => Array.from(new Set([...prev, ...pendingInList])));
    }
  }, [documents]);

  // Polling watcher for pending void requests
  useEffect(() => {
    if (pollingIds.length === 0) return;

    const interval = setInterval(async () => {
      for (const id of pollingIds) {
        try {
          const updated = await api.documents.getById(id);
          if (updated.status !== "void_pending") {
            // Finished processing with SUNAT
            setPollingIds((prev) => prev.filter((pId) => pId !== id));

            // Update in documents list
            setDocuments((prev) =>
              prev.map((d) => (d.id === id ? { ...d, ...updated } : d)),
            );

            // Update active detail drawer if currently open
            setSelectedDoc((current) =>
              current?.id === id ? { ...current, ...updated } : current,
            );

            if (updated.status === "voided") {
              playNotificationSound("success");
              notifications.show({
                title: "¡Comprobante Anulado con Éxito!",
                message: `El comprobante ${updated.series}-${updated.correlative} fue dado de baja formalmente ante SUNAT.`,
                color: "teal",
                icon: <CheckCircle2 size={18} />,
                autoClose: 7000,
              });
            } else if (updated.status === "accepted") {
              playNotificationSound("error");
              notifications.show({
                title: "Error al Procesar Baja ante SUNAT",
                message:
                  updated.void_sunat_description ||
                  `SUNAT no completó la baja del comprobante ${updated.series}-${updated.correlative}.`,
                color: "red",
                icon: <XCircle size={18} />,
                autoClose: 9000,
              });
            }
          }
        } catch (err) {
          console.debug("Error checking void status for document", id, err);
        }
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [pollingIds]);

  const handleOpenDetail = async (doc: Document) => {
    setSelectedDoc(doc);
    setDrawerOpen(true);
    setLoadingDetail(true);
    try {
      const fullDoc = await api.documents.getById(doc.id);
      setSelectedDoc(fullDoc);
    } catch (err) {
      console.error("Error loading full document details:", err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleOpenVoid = (doc: Document) => {
    setSelectedDoc(doc);
    setVoidReason("");
    setVoidModalOpen(true);
  };

  const handleExecuteVoid = async () => {
    if (!selectedDoc || !voidReason.trim()) {
      notifications.show({
        title: "Motivo requerido",
        message:
          "Debe ingresar un motivo para anular el comprobante ante SUNAT.",
        color: "yellow",
      });
      return;
    }

    const docId = selectedDoc.id;
    const docSeriesCorrelative = `${selectedDoc.series}-${selectedDoc.correlative}`;
    setVoiding(true);

    try {
      await api.documents.void(docId, voidReason);

      // Immediate UI update to void_pending
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === docId
            ? { ...d, status: "void_pending" as const, void_reason: voidReason }
            : d,
        ),
      );

      setSelectedDoc((prev) =>
        prev?.id === docId
          ? {
              ...prev,
              status: "void_pending" as const,
              void_reason: voidReason,
            }
          : prev,
      );

      setVoidModalOpen(false);
      setPollingIds((prev) => Array.from(new Set([...prev, docId])));

      playNotificationSound("info");
      notifications.show({
        title: "Comunicación de Baja Enviada",
        message: `La solicitud de anulación para ${docSeriesCorrelative} fue enviada a SUNAT. Te notificaremos cuando se confirme.`,
        color: "blue",
        autoClose: 6000,
      });
    } catch (err: any) {
      playNotificationSound("error");
      notifications.show({
        title: "Error al anular",
        message: err.message || "No se pudo comunicar la baja a SUNAT.",
        color: "red",
        autoClose: 8000,
      });
    } finally {
      setVoiding(false);
    }
  };

  const getTypeName = (code: string) => {
    switch (code) {
      case "01":
        return "Factura";
      case "03":
        return "Boleta";
      case "07":
        return "Nota de Crédito";
      case "08":
        return "Nota de Débito";
      default:
        return code;
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
            Comprobantes Electrónicos
          </Title>
          <Text size="sm" c="dimmed">
            Facturas, Boletas de Venta y Notas de Crédito emitidas ante SUNAT
          </Text>
        </Box>

        <Button
          leftSection={<RefreshCw size={16} />}
          variant="default"
          size="sm"
          onClick={loadDocuments}
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
              placeholder="Buscar serie, correlativo, cliente..."
              leftSection={<Search size={16} />}
              value={search}
              onChange={(e) => setSearch(e.currentTarget.value)}
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 2.5 }}>
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

          <Grid.Col span={{ base: 12, sm: 2.5 }}>
            <Select
              placeholder="Tipo de comprobante"
              clearable
              data={[
                { value: "01", label: "01 - Factura Electrónica" },
                { value: "03", label: "03 - Boleta de Venta" },
                { value: "07", label: "07 - Nota de Crédito" },
                { value: "08", label: "08 - Nota de Débito" },
              ]}
              value={selectedType}
              onChange={(val) => setSelectedType(val || "")}
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 2 }}>
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

          <Grid.Col span={{ base: 12, sm: 2 }}>
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

      {/* Main Documents Table */}
      <Card
        withBorder
        radius="md"
        p="lg"
        style={{ backgroundColor: "#ffffff" }}
      >
        <Group justify="space-between" mb="md">
          <Text size="sm" fw={600} c="gray.7">
            {totalDocs} comprobantes encontrados
          </Text>
        </Group>

        {loading ? (
          <Box py="xl" ta="center">
            <Loader color="teal" />
          </Box>
        ) : documents.length === 0 ? (
          <EmptyState
            title="No se encontraron comprobantes"
            description="No hay registros que coincidan con los filtros aplicados."
            icon={<FileSpreadsheet size={36} />}
          />
        ) : (
          <Table.ScrollContainer minWidth={850}>
            <Table verticalSpacing="sm" highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Comprobante</Table.Th>
                  <Table.Th>Emisor</Table.Th>
                  <Table.Th>Cliente</Table.Th>
                  <Table.Th>Fecha Emisión</Table.Th>
                  <Table.Th>Total</Table.Th>
                  <Table.Th>Estado SUNAT</Table.Th>
                  <Table.Th style={{ textAlign: "right" }}>
                    Descargas / Acciones
                  </Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {documents.map((doc) => (
                  <Table.Tr key={doc.id}>
                    <Table.Td>
                      <Group gap={6}>
                        <Badge
                          size="xs"
                          variant="light"
                          color={doc.type_code === "01" ? "blue" : "teal"}
                        >
                          {getTypeName(doc.type_code)}
                        </Badge>
                        {doc.is_production === false ? (
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
                          {doc.series}-{doc.correlative}
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
                        {doc.company?.business_name || doc.company_id}
                      </Text>
                      <Text size="11px" c="dimmed">
                        {doc.company?.ruc}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text
                        size="xs"
                        fw={500}
                        truncate
                        style={{ maxWidth: 180 }}
                      >
                        {doc.client_name}
                      </Text>
                      <Text size="11px" c="dimmed">
                        {doc.client_doc_number}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="xs">{doc.issue_date}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" fw={700}>
                        {formatCurrency(doc.total, doc.currency)}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <StatusBadge status={doc.status} />
                    </Table.Td>
                    <Table.Td style={{ textAlign: "right" }}>
                      <Group gap={6} justify="flex-end">
                        <Tooltip label="Ver Detalle">
                          <ActionIcon
                            variant="light"
                            color="teal"
                            size="sm"
                            onClick={() => handleOpenDetail(doc)}
                          >
                            <Eye size={14} />
                          </ActionIcon>
                        </Tooltip>

                        <Tooltip label="Descargar XML">
                          <ActionIcon
                            component="a"
                            href={api.documents.getXmlUrl(doc.id)}
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
                            href={api.documents.getCdrUrl(doc.id)}
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
                            href={api.documents.getPdfUrl(doc.id)}
                            target="_blank"
                            variant="light"
                            color="indigo"
                            size="sm"
                          >
                            <FileText size={14} />
                          </ActionIcon>
                        </Tooltip>

                        {doc.status === "accepted" && (
                          <Tooltip label="Anular Comprobante">
                            <ActionIcon
                              variant="light"
                              color="red"
                              size="sm"
                              onClick={() => handleOpenVoid(doc)}
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

      {/* Drawer: Document Detail */}
      <Drawer
        opened={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={
          <Group gap="xs">
            <FileText size={20} color="var(--mantine-color-teal-6)" />
            <Text fw={700} size="md">
              {getTypeName(selectedDoc?.type_code || "01")}{" "}
              {selectedDoc?.series}-{selectedDoc?.correlative}
            </Text>
          </Group>
        }
        position="right"
        size="xl"
      >
        {selectedDoc && (
          <Stack gap="md" mt="md">
            {/* Status Header & Total */}
            <Paper
              withBorder
              p="md"
              radius="md"
              style={{ backgroundColor: "#fafafa" }}
            >
              <Group justify="space-between" align="center">
                <Box>
                  <Text size="xs" fw={700} c="dimmed" tt="uppercase">
                    Estado SUNAT & Entorno
                  </Text>
                  <Group gap={8} mt={4}>
                    <StatusBadge status={selectedDoc.status} size="lg" />
                    {selectedDoc.is_production === false ? (
                      <Badge size="md" variant="outline" color="orange">
                        Prueba / Beta
                      </Badge>
                    ) : (
                      <Badge size="md" variant="outline" color="green">
                        Producción
                      </Badge>
                    )}
                  </Group>
                </Box>
                <Box ta="right">
                  <Text size="xs" fw={700} c="dimmed" tt="uppercase">
                    Total Comprobante
                  </Text>
                  <Text size="xl" fw={800} c="teal.8">
                    {formatCurrency(selectedDoc.total, selectedDoc.currency)}
                  </Text>
                </Box>
              </Group>

              {selectedDoc.sunat_description && (
                <Text size="xs" c="dimmed" mt="xs">
                  <b>Respuesta SUNAT:</b> {selectedDoc.sunat_description}
                </Text>
              )}
            </Paper>

            {/* In-process Voiding Banner */}
            {selectedDoc.status === "void_pending" && (
              <Paper
                withBorder
                p="sm"
                radius="md"
                style={{
                  backgroundColor: "#fefce8",
                  borderColor: "#fef08a",
                }}
              >
                <Group gap="xs">
                  <Loader size="xs" color="yellow" />
                  <Text size="xs" fw={700} c="yellow.9">
                    Anulación en proceso de verificación ante SUNAT
                  </Text>
                </Group>
                <Text size="xs" c="yellow.9" mt={4}>
                  Se envió la comunicación de baja. El facturador está consultando el estado automáticamente y te notificará con sonido apenas SUNAT confirme.
                </Text>
                {selectedDoc.void_reason && (
                  <Text size="xs" c="dimmed" mt={4}>
                    <b>Motivo enviado:</b> {selectedDoc.void_reason}
                  </Text>
                )}
                {selectedDoc.void_ticket && (
                  <Text size="xs" c="dimmed" mt={2} style={{ fontFamily: "monospace" }}>
                    <b>Ticket de baja:</b> {selectedDoc.void_ticket}
                  </Text>
                )}
              </Paper>
            )}

            {/* Voided Banner */}
            {selectedDoc.status === "voided" && (
              <Paper
                withBorder
                p="sm"
                radius="md"
                style={{
                  backgroundColor: "#fef2f2",
                  borderColor: "#fecaca",
                }}
              >
                <Group justify="space-between" align="center">
                  <Group gap={6}>
                    <Ban size={16} color="var(--mantine-color-red-6)" />
                    <Text size="xs" fw={700} c="red.8">
                      Comprobante Dado de Baja ante SUNAT
                    </Text>
                  </Group>
                  {selectedDoc.voided_at && (
                    <Text size="11px" c="dimmed">
                      {new Date(selectedDoc.voided_at).toLocaleString("es-PE")}
                    </Text>
                  )}
                </Group>
                {selectedDoc.void_reason && (
                  <Text size="xs" c="gray.8" mt={4}>
                    <b>Motivo de baja:</b> {selectedDoc.void_reason}
                  </Text>
                )}
                {selectedDoc.void_ticket && (
                  <Text size="xs" c="gray.7" mt={2} style={{ fontFamily: "monospace" }}>
                    <b>Ticket SUNAT:</b> {selectedDoc.void_ticket}
                  </Text>
                )}
                {selectedDoc.void_sunat_description && (
                  <Text size="xs" c="gray.7" mt={2}>
                    <b>Respuesta de baja:</b> {selectedDoc.void_sunat_description}
                  </Text>
                )}
              </Paper>
            )}

            {/* Issuer and Client details */}
            <Grid gap="sm">
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Paper withBorder p="sm" radius="md" h="100%">
                  <Group gap={6} mb={4}>
                    <Building2 size={14} color="var(--mantine-color-teal-6)" />
                    <Text size="xs" fw={700} c="dimmed" tt="uppercase">
                      Emisor
                    </Text>
                  </Group>
                  <Text size="xs" fw={600} truncate>
                    {selectedDoc.company?.business_name || selectedDoc.company_id}
                  </Text>
                  <Text size="xs" c="dimmed" style={{ fontFamily: "monospace" }}>
                    RUC: {selectedDoc.company?.ruc || "-"}
                  </Text>
                  <Text size="11px" c="dimmed" mt={4}>
                    Emisión: {selectedDoc.issue_date} {selectedDoc.issue_time}
                  </Text>
                </Paper>
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Paper withBorder p="sm" radius="md" h="100%">
                  <Group gap={6} mb={4}>
                    <User size={14} color="var(--mantine-color-blue-6)" />
                    <Text size="xs" fw={700} c="dimmed" tt="uppercase">
                      Receptor (Cliente)
                    </Text>
                  </Group>
                  <Text size="xs" fw={600} truncate>
                    {selectedDoc.client_name}
                  </Text>
                  <Text size="xs" c="dimmed" style={{ fontFamily: "monospace" }}>
                    Doc: {selectedDoc.client_doc_number} ({selectedDoc.client_doc_type})
                  </Text>
                  {selectedDoc.client_address && (
                    <Text size="11px" c="dimmed" truncate mt={4}>
                      {selectedDoc.client_address}
                    </Text>
                  )}
                  {selectedDoc.client_email && (
                    <Text size="11px" c="dimmed">
                      {selectedDoc.client_email}
                    </Text>
                  )}
                </Paper>
              </Grid.Col>
            </Grid>

            {/* Items / Products Section */}
            <Box>
              <Group justify="space-between" mb="xs">
                <Text size="xs" fw={700} c="dimmed" tt="uppercase">
                  Ítems del Comprobante ({selectedDoc.items?.length ?? 0})
                </Text>
                {loadingDetail && (
                  <Group gap={4}>
                    <Loader size="xs" color="teal" />
                    <Text size="11px" c="dimmed">
                      Actualizando ítems...
                    </Text>
                  </Group>
                )}
              </Group>

              {loadingDetail && !selectedDoc.items ? (
                <Box py="xl" ta="center">
                  <Loader size="sm" color="teal" />
                  <Text size="xs" c="dimmed" mt="xs">
                    Cargando ítems detallados...
                  </Text>
                </Box>
              ) : selectedDoc.items && selectedDoc.items.length > 0 ? (
                <Table.ScrollContainer minWidth={500}>
                  <Table verticalSpacing="xs" striped highlightOnHover withTableBorder>
                    <Table.Thead>
                      <Table.Tr style={{ backgroundColor: "var(--mantine-color-gray-0)" }}>
                        <Table.Th style={{ width: 36 }}>#</Table.Th>
                        <Table.Th>Descripción</Table.Th>
                        <Table.Th style={{ textAlign: "right", width: 80 }}>Cant.</Table.Th>
                        <Table.Th style={{ textAlign: "right", width: 90 }}>P. Unit.</Table.Th>
                        <Table.Th style={{ textAlign: "right", width: 95 }}>Total</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {selectedDoc.items.map((item, idx) => (
                        <Table.Tr key={item.id || idx}>
                          <Table.Td>
                            <Text size="xs" c="dimmed">
                              {idx + 1}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="xs" fw={600}>
                              {item.description}
                            </Text>
                            {(item.internal_code || item.code) && (
                              <Text size="10px" c="dimmed" style={{ fontFamily: "monospace" }}>
                                Cód: {item.internal_code || item.code}
                              </Text>
                            )}
                          </Table.Td>
                          <Table.Td style={{ textAlign: "right" }}>
                            <Text size="xs" fw={500}>
                              {item.quantity} {item.unit_code}
                            </Text>
                          </Table.Td>
                          <Table.Td style={{ textAlign: "right" }}>
                            <Text size="xs">
                              {formatCurrency(item.unit_price, selectedDoc.currency)}
                            </Text>
                          </Table.Td>
                          <Table.Td style={{ textAlign: "right" }}>
                            <Text size="xs" fw={700}>
                              {formatCurrency(item.total, selectedDoc.currency)}
                            </Text>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </Table.ScrollContainer>
              ) : (
                <Paper withBorder p="sm" ta="center" radius="sm">
                  <Text size="xs" c="dimmed">
                    No se encontraron ítems detallados para este comprobante.
                  </Text>
                </Paper>
              )}
            </Box>

            {/* Financial Summary */}
            <Paper withBorder p="sm" radius="md" style={{ backgroundColor: "#fafafa" }}>
              <Stack gap={6}>
                {selectedDoc.total_taxable !== undefined && (
                  <Group justify="space-between">
                    <Text size="xs" c="dimmed">
                      Operaciones Gravadas:
                    </Text>
                    <Text size="xs" fw={600}>
                      {formatCurrency(selectedDoc.total_taxable, selectedDoc.currency)}
                    </Text>
                  </Group>
                )}
                {selectedDoc.total_igv !== undefined && (
                  <Group justify="space-between">
                    <Text size="xs" c="dimmed">
                      IGV (18%):
                    </Text>
                    <Text size="xs" fw={600}>
                      {formatCurrency(selectedDoc.total_igv, selectedDoc.currency)}
                    </Text>
                  </Group>
                )}
                <Divider my={2} />
                <Group justify="space-between">
                  <Text size="sm" fw={700}>
                    Importe Total:
                  </Text>
                  <Text size="md" fw={800} c="teal.8">
                    {formatCurrency(selectedDoc.total, selectedDoc.currency)}
                  </Text>
                </Group>
              </Stack>
            </Paper>

            <Divider />

            {/* Official Electronic Files */}
            <Box>
              <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb="xs">
                Archivos Electrónicos Oficiales
              </Text>
              <Group gap="xs" wrap="wrap">
                <Button
                  component="a"
                  href={api.documents.getXmlUrl(selectedDoc.id)}
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
                  href={api.documents.getCdrUrl(selectedDoc.id)}
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
                  href={api.documents.getPdfUrl(selectedDoc.id)}
                  target="_blank"
                  variant="light"
                  color="indigo"
                  size="xs"
                  leftSection={<FileText size={14} />}
                >
                  Representación PDF
                </Button>

                {(selectedDoc.status === "voided" ||
                  selectedDoc.void_cdr_path ||
                  selectedDoc.links?.void_cdr) && (
                  <Button
                    component="a"
                    href={api.documents.getVoidCdrUrl(selectedDoc.id)}
                    target="_blank"
                    variant="light"
                    color="red"
                    size="xs"
                    leftSection={<Download size={14} />}
                  >
                    CDR de Baja
                  </Button>
                )}

                {(selectedDoc.status === "voided" ||
                  selectedDoc.void_xml_path ||
                  selectedDoc.links?.void_xml) && (
                  <Button
                    component="a"
                    href={api.documents.getVoidXmlUrl(selectedDoc.id)}
                    target="_blank"
                    variant="light"
                    color="orange"
                    size="xs"
                    leftSection={<FileCode size={14} />}
                  >
                    XML de Baja
                  </Button>
                )}
              </Group>
            </Box>

            {/* Actions */}
            {selectedDoc.status === "accepted" && (
              <Box mt="xs">
                <Button
                  fullWidth
                  variant="outline"
                  color="red"
                  leftSection={<Ban size={16} />}
                  onClick={() => {
                    setDrawerOpen(false);
                    handleOpenVoid(selectedDoc);
                  }}
                >
                  Solicitar Anulación / Baja SUNAT
                </Button>
              </Box>
            )}

            {selectedDoc.status === "void_pending" && (
              <Box mt="xs">
                <Button
                  fullWidth
                  variant="light"
                  color="yellow"
                  disabled
                  leftSection={<Clock size={16} />}
                >
                  Anulación en proceso ante SUNAT...
                </Button>
              </Box>
            )}
          </Stack>
        )}
      </Drawer>

      {/* Modal: Void Document */}
      <Modal
        opened={voidModalOpen}
        onClose={() => setVoidModalOpen(false)}
        title={<Text fw={700}>Anulación de Comprobante ante SUNAT</Text>}
        centered
        radius="md"
      >
        <Stack gap="md">
          <Text size="sm">
            Está a punto de enviar una Comunicación de Baja / Anulación a SUNAT
            para el comprobante{" "}
            <b>
              {selectedDoc?.series}-{selectedDoc?.correlative}
            </b>
            .
          </Text>

          <Textarea
            label="Motivo de la anulación"
            placeholder="Ej: Error en digitación de RUC del cliente"
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
