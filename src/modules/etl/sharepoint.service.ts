import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { MicrosoftService } from '../microsoft/microsoft.service';
import axios from 'axios';

@Injectable()
export class SharepointService {
  // Drive root for the specific folder
  private readonly folderPath = '3.00 Employee Deliverables/By Rianul';
  private readonly siteName = 'Skarion';
  private readonly graphBase = 'https://graph.microsoft.com/v1.0';

  constructor(private readonly msService: MicrosoftService) {}

  /**
   * Uploads a file buffer to SharePoint and returns the web URL.
   */
  async uploadResume(
    fileName: string,
    fileBuffer: Buffer,
    candidateName?: string,
  ): Promise<{ url: string; name: string }> {
    const token = await this.msService.getAccessToken();

    // Build target folder path — optionally per-candidate
    const targetFolder = candidateName
      ? `${this.folderPath}/${candidateName}`
      : this.folderPath;

    const siteUrl = `${this.graphBase}/sites/${await this.getSiteId(token)}`;

    // Upload via simple PUT (≤4MB; for larger files a chunked session would be needed)
    const uploadUrl = `${siteUrl}/drive/root:/${targetFolder}/${fileName}:/content`;

    try {
      const response = await axios.put(uploadUrl, fileBuffer, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/octet-stream',
        },
      });

      const webUrl: string = response.data?.webUrl ?? '';
      return { url: webUrl, name: fileName };
    } catch (error: any) {
      console.error(
        'SharePoint upload error:',
        error?.response?.data ?? error.message,
      );
      throw new HttpException(
        'Failed to upload resume to SharePoint',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  /**
   * Downloads a file from SharePoint by its stored webUrl.
   * Resolves the Graph API download URL and fetches the raw bytes,
   * so the client doesn't need to be authenticated with Microsoft.
   *
   * @param webUrl  The SharePoint webUrl stored on the JobApplication record
   * @returns       { buffer, contentType, fileName }
   */
  async downloadResumeByWebUrl(webUrl: string): Promise<{
    buffer: Buffer;
    contentType: string;
    fileName: string;
  }> {
    const token = await this.msService.getAccessToken();
    const siteId = await this.getSiteId(token);

    // Encode the webUrl so Graph can resolve it to a drive item
    const encodedUrl = encodeURIComponent(webUrl);
    const itemUrl = `${this.graphBase}/sites/${siteId}/drive/root:/${encodeURIComponent(this.folderPath)}`;

    // Try to extract the file path from the webUrl then use it to locate the item
    // Pattern: ...SharePoint/Shared%20Documents/<rest>
    let itemPath = webUrl;
    const sharedDocsMatch = webUrl.match(/Shared%20Documents\/(.*?)(\?|$)/);
    if (!sharedDocsMatch) {
      const altMatch = webUrl.match(/Shared Documents\/(.*?)(\?|$)/);
      if (altMatch) {
        itemPath = decodeURIComponent(altMatch[1]);
      }
    } else {
      itemPath = decodeURIComponent(sharedDocsMatch[1]);
    }

    // Use the shares API to get a download URL from the webUrl directly
    // Encode as base64url as required by Graph
    const base64Url = Buffer.from(webUrl)
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
    const sharesUrl = `${this.graphBase}/shares/u!${base64Url}/driveItem/content`;

    try {
      const response = await axios.get(sharesUrl, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'arraybuffer',
        maxRedirects: 5,
      });

      const contentType =
        (response.headers['content-type'] as string) ||
        'application/octet-stream';

      // Try to extract filename from Content-Disposition or the webUrl
      let fileName = 'resume';
      const disposition = response.headers['content-disposition'] as string;
      if (disposition) {
        const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (match) fileName = match[1].replace(/['"]/g, '');
      } else {
        const urlParts = webUrl.split('/');
        const last = urlParts[urlParts.length - 1].split('?')[0];
        if (last) fileName = decodeURIComponent(last);
      }

      return {
        buffer: Buffer.from(response.data as ArrayBuffer),
        contentType,
        fileName,
      };
    } catch (error: any) {
      console.error(
        'SharePoint download error:',
        error?.response?.data ?? error.message,
      );
      throw new HttpException(
        'Failed to download resume from SharePoint',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  /** Resolves the SharePoint site ID from the known site name. */
  private async getSiteId(token: string): Promise<string> {
    const url = `${this.graphBase}/sites/inuberry.sharepoint.com:/sites/${this.siteName}`;
    try {
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data.id as string;
    } catch (err: any) {
      console.error(
        'Failed to resolve SharePoint site ID:',
        err?.response?.data ?? err.message,
      );
      throw new HttpException(
        'Failed to resolve SharePoint site',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }
}

