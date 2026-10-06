import {
  Badge,
  Box,
  Divider,
  Group,
  NavLink,
  Stack,
  Text,
  UnstyledButton,
} from "@mantine/core";
import {
  Building2,
  FileSpreadsheet,
  FileText,
  Key,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldCheck,
  Truck,
  Users,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export function Sidebar() {
  const { user, isSuperAdmin, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { label: "Empresas", icon: Building2, path: "/companies" },
    { label: "Comprobantes", icon: FileText, path: "/documents" },
    { label: "Guías de Remisión", icon: Truck, path: "/despatches" },
    { label: "API Keys (POS / ERP)", icon: Key, path: "/api-keys" },
    ...(isSuperAdmin
      ? [
          { label: "Desarrolladores", icon: Users, path: "/users" },
          { label: "Configuración Sistema", icon: Settings, path: "/settings" },
        ]
      : []),
  ];

  return (
    <Box
      component="nav"
      w={260}
      h="100vh"
      p="md"
      style={{
        borderRight: "1px solid var(--mantine-color-gray-2)",
        backgroundColor: "#ffffff",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Brand Header */}
      <Box mb="lg">
        <Group justify="space-between" align="center" mb={6}>
          <Group gap="xs">
            <Box
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                backgroundColor: "var(--mantine-color-teal-6)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FileSpreadsheet size={20} strokeWidth={2.2} />
            </Box>
            <Box>
              <Text
                fw={800}
                size="lg"
                style={{ letterSpacing: "-0.5px", lineHeight: 1.1 }}
              >
                FACTOS
              </Text>
              <Text
                size="10px"
                fw={600}
                c="dimmed"
                style={{ letterSpacing: "0.5px" }}
              >
                GESTIÓN PRIVADA
              </Text>
            </Box>
          </Group>
          <Badge size="xs" variant="light" color="teal">
            v1.0
          </Badge>
        </Group>

        {isSuperAdmin && (
          <Group
            gap={6}
            mt="xs"
            px={8}
            py={4}
            style={{
              borderRadius: 6,
              backgroundColor: "var(--mantine-color-violet-0)",
            }}
          >
            <ShieldCheck size={14} color="var(--mantine-color-violet-7)" />
            <Text size="xs" fw={600} c="violet.9">
              Super Administrador
            </Text>
          </Group>
        )}
      </Box>

      {/* Nav Links */}
      <Stack gap={4} style={{ flex: 1 }}>
        <Text
          size="xs"
          fw={700}
          c="dimmed"
          px="xs"
          mb={4}
          style={{ letterSpacing: "0.6px", textTransform: "uppercase" }}
        >
          Módulos
        </Text>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname.startsWith(item.path);

          return (
            <NavLink
              key={item.path}
              label={item.label}
              leftSection={
                <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
              }
              active={isActive}
              onClick={() => navigate(item.path)}
              style={{
                borderRadius: 8,
                fontWeight: isActive ? 600 : 500,
                color: isActive
                  ? "var(--mantine-color-teal-8)"
                  : "var(--mantine-color-gray-7)",
                backgroundColor: isActive
                  ? "var(--mantine-color-teal-0)"
                  : "transparent",
                transition: "all 0.15s ease",
              }}
            />
          );
        })}
      </Stack>

      <Divider my="sm" />

      {/* User Footer Card */}
      <Box>
        <Group justify="space-between" align="center" wrap="nowrap">
          <Box style={{ overflow: "hidden" }}>
            <Text size="sm" fw={600} truncate>
              {user?.name}
            </Text>
            <Text size="xs" c="dimmed" truncate>
              {user?.email}
            </Text>
          </Box>
          <UnstyledButton
            onClick={handleLogout}
            p={6}
            style={{
              borderRadius: 6,
              color: "var(--mantine-color-gray-6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            title="Cerrar sesión"
          >
            <LogOut size={18} />
          </UnstyledButton>
        </Group>
      </Box>
    </Box>
  );
}
