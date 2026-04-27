interface UploadOptions {
  folder?: string;
  resource_type?: "image" | "raw" | "video" | "auto";
  onProgress?: (progress: number) => void;
}

interface UploadResult {
  url: string;
  publicId: string;
  format: string;
  resourceType: string;
}

async function generateSignature(
  params: Record<string, string>,
  apiSecret: string
): Promise<string> {
  const sortedString =
    Object.keys(params)
      .sort()
      .map((key) => `${key}=${params[key]}`)
      .join("&") + apiSecret;

  const encoded = new TextEncoder().encode(sortedString);
  const hashBuffer = await crypto.subtle.digest("SHA-1", encoded);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

class CloudinaryUploader {
  private cloudName: string;
  private apiKey: string;
  private apiSecret: string;

  constructor(cloudName: string, apiKey: string, apiSecret: string) {
    this.cloudName = cloudName;
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
  }

  async uploadFile(
    file: File,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    const timestamp = String(Math.floor(Date.now() / 1000));
    const sigParams: Record<string, string> = { timestamp };
    if (options.folder) sigParams.folder = options.folder;

    const signature = await generateSignature(sigParams, this.apiSecret);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", this.apiKey);
    formData.append("timestamp", timestamp);
    formData.append("signature", signature);
    if (options.folder) formData.append("folder", options.folder);

    const resourceType = options.resource_type || "auto";
    const url = `https://api.cloudinary.com/v1_1/${this.cloudName}/${resourceType}/upload`;

    const response = await fetch(url, { method: "POST", body: formData });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Upload failed: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      url: data.secure_url,
      publicId: data.public_id,
      format: data.format,
      resourceType: data.resource_type,
    };
  }

  async uploadMultiple(
    files: File[],
    options: UploadOptions = {}
  ): Promise<UploadResult[]> {
    return Promise.all(files.map((file) => this.uploadFile(file, options)));
  }
}

export const cloudinaryUploader = new CloudinaryUploader(
  import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "",
  import.meta.env.VITE_CLOUDINARY_API_KEY || "",
  import.meta.env.VITE_CLOUDINARY_API_SECRET || ""
);

export default cloudinaryUploader;
