// Reservation files attached in this browser session (object URLs for viewing, the File for upload).
// When a trip is saved, files are uploaded to Firebase Storage and the reservation keeps the link.
const files = new Map<string, { url: string; file: File }>();

export function storeAttachment(file: File) {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  files.set(id, { url: URL.createObjectURL(file), file });
  return id;
}

export function attachmentUrl(id?: string) {
  return id ? files.get(id)?.url : undefined;
}

export function attachmentFile(id?: string) {
  return id ? files.get(id)?.file : undefined;
}

export function readAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

// Browsers often leave .eml files without a type; the server decides by name too.
export function fileMimeType(file: File) {
  if (file.type) return file.type;
  if (/\.eml$/i.test(file.name)) return 'message/rfc822';
  if (/\.pdf$/i.test(file.name)) return 'application/pdf';
  return 'text/plain';
}

export const ACCEPTED_FILES = '.pdf,.eml,.txt,.html,.htm,.png,.jpg,.jpeg,.webp,application/pdf,message/rfc822,image/*';
