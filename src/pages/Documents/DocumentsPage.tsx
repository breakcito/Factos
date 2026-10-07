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
  FileSpreadsheet,
  FileText,
  RefreshCw,
  Search,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../../api/client";
import type { Company, Document } from "../../api/types";
import { EmptyState } from "../../components/Common/EmptyState";
import { StatusBadge } from "../../components/Common/StatusBadge";

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
  const [search, setSearch] = useState("");

  // Modals & Drawer
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [voidModalOpen, setVoidModalOpen] = useState(false);
  const [voidReason, setVoidReason] = useState("");
  const [voiding, setVoiding] = useState(false);

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
          setSelectedDoc(found);
          setDrawerOpen(true);
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
  }, [page, selectedCompanyId, selectedType, selectedStatus, search]);

  const handleOpenDetail = (doc: Document) => {
    setSelectedDoc(doc);
    setDrawerOpen(true);
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

    setVoiding(true);
    try {
      await api.documents.void(selectedDoc.id, voidReason);
      notifications.show({
        title: "Anulación iniciada",
        message: "La solicitud de anulación ha sido enviada a SUNAT.",
        color: "teal",
      });
      setVoidModalOpen(false);
      loadDocuments();
    } catch (err: any) {
      notifications.show({
        title: "Error al anular",
        message: err.message,
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
              Comprobante {selectedDoc?.series}-{selectedDoc?.correlative}
            </Text>
          </Group>
        }
        position="right"
        size="lg"
      >
        {selectedDoc && (
          <Stack gap="md" mt="md">
            <Box>
              <Text size="xs" fw={700} c="dimmed" tt="uppercase">
                Estado SUNAT
              </Text>
              <Group justify="space-between" mt={4}>
                <StatusBadge status={selectedDoc.status} size="lg" />
                <Text size="lg" fw={800}>
                  {formatCurrency(selectedDoc.total, selectedDoc.currency)}
                </Text>
              </Group>
              {selectedDoc.sunat_description && (
                <Text size="xs" c="dimmed" mt={4}>
                  <b>Respuesta SUNAT:</b> {selectedDoc.sunat_description}
                </Text>
              )}
            </Box>

            <Divider />

            <Box>
              <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb="xs">
                Datos del Receptor (Cliente)
              </Text>
              <Text size="sm" fw={600}>
                {selectedDoc.client_name}
              </Text>
              <Text size="xs" c="dimmed">
                Doc: {selectedDoc.client_doc_number} (
                {selectedDoc.client_doc_type})
              </Text>
              {selectedDoc.client_address && (
                <Text size="xs" c="dimmed">
                  Dirección: {selectedDoc.client_address}
                </Text>
              )}
              {selectedDoc.client_email && (
                <Text size="xs" c="dimmed">
                  Email: {selectedDoc.client_email}
                </Text>
              )}
            </Box>

            <Divider />

            <Box>
              <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb="xs">
                Archivos Electrónicos Oficiales
              </Text>
              <Group gap="sm">
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
              </Group>
            </Box>

            {selectedDoc.status === "accepted" && (
              <Box mt="md">
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
