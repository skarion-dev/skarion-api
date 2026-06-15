import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { MicrosoftService } from '../microsoft/microsoft.service';
import axios from 'axios';

@Injectable()
export class SharepointService {
  private readonly folderPath = '3.00 Employee Deliverables/By Rianul';
  private readonly candidateGroupsPath = 'Candidate Groups';
  private readonly siteName = 'Skarion';
  private readonly graphBase = 'https://graph.microsoft.com/v1.0';

  constructor(private readonly msService: MicrosoftService) {}

  async uploadResume(
    fileName: string,
    fileBuffer: Buffer,
    candidateName?: string,
  ): Promise<{ url: string; name: string }> {
    const token = await this.msService.getAccessToken();
    const targetFolder = candidateName
      ? `${this.folderPath}/${candidateName}`
      : this.folderPath;
    const siteUrl = `${this.graphBase}/sites/${await this.getSiteId(token)}`;
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
      console.error('SharePoint upload error:', error?.response?.data ?? error.message);
      throw new HttpException('Failed to upload resume to SharePoint', HttpStatus.BAD_GATEWAY);
    }
  }

  async downloadResumeByWebUrl(webUrl: string): Promise<{
    buffer: Buffer;
    contentType: string;
    fileName: string;
  }> {
    const token = await this.msService.getAccessToken();
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
      const contentType = (response.headers['content-type'] as string) || 'application/octet-stream';
      let fileName = 'resume';
      const disposition = response.headers['content-disposition'] as string;
      if (disposition) {
        const match = disposition.match(/filename[^;=\n]*=((['""]).*?\2|[^;\n]*)/);
        if (match) fileName = match[1].replace(/['"]/g, '');
      } else {
        const urlParts = webUrl.split('/');
        const last = urlParts[urlParts.length - 1].split('?')[0];
        if (last) fileName = decodeURIComponent(last);
      }
      return { buffer: Buffer.from(response.data as ArrayBuffer), contentType, fileName };
    } catch (error: any) {
      console.error('SharePoint download error:', error?.response?.data ?? error.message);
      throw new HttpException('Failed to download resume from SharePoint', HttpStatus.BAD_GATEWAY);
    }
  }

  /**
   * Creates a folder named "Skarion {n} ({candidateName})" inside
   * Shared Documents/Candidate Groups and returns its webUrl.
   */
  async createCandidateGroupFolder(
    folderName: string,
    fileBuffer?: Buffer,
    fileName?: string,
  ): Promise<{ folderUrl: string }> {
    const token = await this.msService.getAccessToken();
    const siteId = await this.getSiteId(token);
    const parentPath = this.candidateGroupsPath;

    try {
      const res = await axios.post(
        `${this.graphBase}/sites/${siteId}/drive/root:/${parentPath}:/children`,
        {
          name: folderName,
          folder: {},
          '@microsoft.graph.conflictBehavior': 'rename',
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );
      return { folderUrl: res.data?.webUrl ?? '' };
    } catch (error: any) {
      console.error('SharePoint folder creation error:', error?.response?.data ?? error.message);
      // Non-fatal: return empty string so candidate creation still succeeds
      return { folderUrl: '' };
    }
  }

  /**
   * Uploads a file into a candidate's group folder (by folder path).
   */
  async uploadToCandidateFolder(
    candidateFolderName: string,
    fileName: string,
    fileBuffer: Buffer,
  ): Promise<{ url: string; name: string }> {
    const token = await this.msService.getAccessToken();
    const siteId = await this.getSiteId(token);
    const filePath = `${this.candidateGroupsPath}/${candidateFolderName}/${fileName}`;
    const uploadUrl = `${this.graphBase}/sites/${siteId}/drive/root:/${filePath}:/content`;
    try {
      const response = await axios.put(uploadUrl, fileBuffer, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/octet-stream',
        },
      });
      return { url: response.data?.webUrl ?? '', name: fileName };
    } catch (error: any) {
      console.error('SharePoint chat upload error:', error?.response?.data ?? error.message);
      throw new HttpException('Failed to upload file to SharePoint', HttpStatus.BAD_GATEWAY);
    }
  }

  private async getSiteId(token: string): Promise<string> {
    const url = `${this.graphBase}/sites/inuberry.sharepoint.com:/sites/${this.siteName}`;
    try {
      const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      return res.data.id as string;
    } catch (err: any) {
      console.error('Failed to resolve SharePoint site ID:', err?.response?.data ?? err.message);
      throw new HttpException('Failed to resolve SharePoint site', HttpStatus.BAD_GATEWAY);
    }
  }
}
