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

class CloudinaryUploader {
  private cloudName: string;
  private uploadPreset: string;

  constructor(cloudName: string, uploadPreset: string) {
    this.cloudName = cloudName;
    this.uploadPreset = uploadPreset;
  }

  async uploadFile(
    file: File,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", this.uploadPreset);

    if (options.folder) {
      formData.append("folder", options.folder);
    }

    const url = `https://api.cloudinary.com/v1_1/${this.cloudName}/${
      options.resource_type || "auto"
    }/upload`;

    try {
      const response = await fetch(url, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        url: data.secure_url,
        publicId: data.public_id,
        format: data.format,
        resourceType: data.resource_type,
      };
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      throw error;
    }
  }

  async uploadMultiple(
    files: File[],
    options: UploadOptions = {}
  ): Promise<UploadResult[]> {
    const uploadPromises = files.map((file) => this.uploadFile(file, options));
    return Promise.all(uploadPromises);
  }
}

// Initialize with your Cloudinary credentials
export const cloudinaryUploader = new CloudinaryUploader(
  import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "",
  import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || ""
);

export default cloudinaryUploader;
