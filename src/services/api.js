const API_BASE = process.env.REACT_APP_BACKEND_URL;

export const buscarEmpleado = async (cedula) => {
  const response = await fetch(`${API_BASE}/empleados/${cedula}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Error consultando empleado");
  }
  return response.json();
};