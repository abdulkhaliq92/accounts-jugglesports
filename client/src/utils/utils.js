export function toCommas(value) {
  const num = Number(value ?? 0);
  return num
    .toFixed(2)
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}


export function safeName(obj) {
  return obj?.name ?? '';
}
