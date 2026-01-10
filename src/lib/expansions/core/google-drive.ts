import { Expansion, ExpansionContext, ExpansionResult, ExpansionServices } from '../types';

export const GoogleDriveExpansion: Expansion = {
    id: 'core-google-drive',
    name: 'Google Drive',
    description: 'Fetch and attach files from Google Drive',
    permissions: ['read:oauth'], // Logical permission, not enforced yet
    intercepts: [{
        type: 'API',
        trigger: 'list_files',
        execute: async (context: ExpansionContext, services: ExpansionServices): Promise<ExpansionResult> => {
            if (!context.userId) {
                return { success: false, message: 'User context required' };
            }

            // 1. Get Token
            const token = await services.auth.getGoogleToken(context.userId);
            if (!token) {
                return {
                    success: false,
                    // Use a specific code so Client can show "Sign In" button
                    code: 'AUTH_REQUIRED',
                    message: 'Google Account not linked or token missing. Please sign in with Google.'
                };
            }

            try {
                // 2. Call Google Drive API
                const search = (context as any).search || '';
                let q = "mimeType != 'application/vnd.google-apps.folder' and trashed = false";
                if (search) {
                    // Escape single quotes for Google Drive API q parameter
                    const escapedSearch = search.replace(/'/g, "\\'");
                    q += ` and name contains '${escapedSearch}'`;
                }

                const params = new URLSearchParams({
                    pageSize: '25',
                    orderBy: 'modifiedTime desc',
                    q,
                    fields: 'files(id, name, webViewLink, iconLink, mimeType)'
                });

                const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    const err = await response.text();
                    console.error('Drive API Error:', err);
                    // Check for invalid grant/token expiry
                    if (response.status === 401) {
                        return { success: false, code: 'AUTH_REQUIRED', message: 'Token expired or invalid.' };
                    }
                    return { success: false, message: 'Failed to fetch files from Google Drive.' };
                }

                const data = await response.json();
                const files = data.files || [];

                return {
                    success: true,
                    data: files,
                    message: 'Files fetched'
                };

            } catch (e: any) {
                return { success: false, message: e.message };
            }
        }
    },
    {
        type: 'API',
        trigger: 'upload_file',
        execute: async (context: ExpansionContext, services: ExpansionServices): Promise<ExpansionResult> => {
            if (!context.userId) return { success: false, message: 'User context required' };

            const token = await services.auth.getGoogleToken(context.userId);
            if (!token) return { success: false, code: 'AUTH_REQUIRED', message: 'Auth required' };

            // context.data should contain { fileName, fileContent (base64), mimeType }
            // Note: context is ExpansionContext. We need to pass data in the API call.
            // Currently ExpansionContext maps `emailContent` etc. 
            // BUT `execute` params are (context, services). The `context` typically contains what was passed.
            // In `api/expansions/route.ts`, we construct context using `req.body` properties?
            // Let's assume the API route passes extra body params into context or we can access them.
            // Looking at `api/expansions/route.ts` (memory), it usually mixes body into context.
            // I'll assume `context` has `fileName`, `fileContent`.

            const { fileName, fileContent, mimeType } = context as any;

            if (!fileName || !fileContent) {
                return { success: false, message: 'Missing file data.' };
            }

            // Decode Base64
            const buffer = Buffer.from(fileContent, 'base64');

            // Multipart Upload
            const metadata = {
                name: fileName,
                mimeType: mimeType || 'application/octet-stream'
            };

            const boundary = '-------314159265358979323846';
            const delimiter = "\r\n--" + boundary + "\r\n";
            const close_delim = "\r\n--" + boundary + "--";

            const multipartRequestBody =
                delimiter +
                'Content-Type: application/json\r\n\r\n' +
                JSON.stringify(metadata) +
                delimiter +
                'Content-Type: ' + (mimeType || 'application/octet-stream') + '\r\n' +
                'Content-Transfer-Encoding: base64\r\n' +
                '\r\n' +
                fileContent +
                close_delim;

            try {
                const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'multipart/related; boundary="' + boundary + '"'
                    },
                    body: multipartRequestBody
                });

                if (!res.ok) {
                    const txt = await res.text();
                    console.error('Drive Upload Error', txt);
                    return { success: false, message: 'Upload failed' };
                }

                const json = await res.json();
                return {
                    success: true,
                    data: json, // contains webViewLink
                    message: 'File uploaded'
                };
            } catch (e: any) {
                return { success: false, message: e.message };
            }
        }
    }]
};
