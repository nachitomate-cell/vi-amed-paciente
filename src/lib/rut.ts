export function normalizarRut(rut: string): string {
  if (!rut) return '';
  const cleaned = rut.replace(/[^0-9kK]/g, '').toUpperCase();
  if (cleaned.length < 2) return cleaned;
  const body = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1);
  return `${body}-${dv}`;
}

export function validarRut(rut: string): boolean {
  if (!rut) return false;
  const cleaned = rut.replace(/[^0-9kK]/g, '').toUpperCase();
  if (cleaned.length < 2) return false;
  const body = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1);
  
  let suma = 0;
  let multiplo = 2;
  
  for (let i = body.length - 1; i >= 0; i--) {
    suma += parseInt(body.charAt(i), 10) * multiplo;
    if (multiplo < 7) multiplo += 1;
    else multiplo = 2;
  }
  
  const dvEsperado = 11 - (suma % 11);
  let dvReal = dvEsperado.toString();
  if (dvEsperado === 11) dvReal = '0';
  if (dvEsperado === 10) dvReal = 'K';
  
  return dv === dvReal;
}
