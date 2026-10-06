import { Badge } from "@mantine/core";

interface StatusBadgeProps {
  status: string;
  size?: "xs" | "sm" | "md" | "lg";
}

export function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
  switch (status) {
    case "accepted":
      return (
        <Badge color="teal" variant="light" size={size}>
          Aceptado SUNAT
        </Badge>
      );
    case "rejected":
      return (
        <Badge color="red" variant="light" size={size}>
          Rechazado SUNAT
        </Badge>
      );
    case "voided":
      return (
        <Badge color="gray" variant="light" size={size}>
          Anulado
        </Badge>
      );
    case "void_pending":
      return (
        <Badge color="orange" variant="light" size={size}>
          Anulación en Proceso
        </Badge>
      );
    case "waiting_sunat":
    case "processing":
    case "pending":
      return (
        <Badge color="yellow" variant="light" size={size}>
          En Proceso
        </Badge>
      );
    case "production":
      return (
        <Badge color="blue" variant="filled" size={size}>
          Producción
        </Badge>
      );
    case "beta":
      return (
        <Badge color="amber" variant="light" size={size}>
          Beta / Pruebas
        </Badge>
      );
    case "superadmin":
      return (
        <Badge color="violet" variant="light" size={size}>
          Super Admin
        </Badge>
      );
    case "developer":
      return (
        <Badge color="cyan" variant="light" size={size}>
          Desarrollador
        </Badge>
      );
    case "active":
      return (
        <Badge color="teal" variant="dot" size={size}>
          Activo
        </Badge>
      );
    case "inactive":
      return (
        <Badge color="gray" variant="dot" size={size}>
          Inactivo
        </Badge>
      );
    default:
      return (
        <Badge color="gray" variant="light" size={size}>
          {status}
        </Badge>
      );
  }
}
