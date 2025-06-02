export function generateReceiptId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const array = new Uint8Array(8);
  crypto.getRandomValues(array);
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars[array[i] % chars.length];
  }
  return `CAKE-${result}`;
}
