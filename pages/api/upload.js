import { supabase } from '../../lib/db';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

// Disable Next.js body parser so formidable can handle multipart
export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const form = formidable({ maxFileSize: 5 * 1024 * 1024 }); // 5MB max

    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve([fields, files]);
      });
    });

    const file = files.image?.[0] || files.image;
    if (!file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Read the file buffer
    const fileBuffer = fs.readFileSync(file.filepath);
    const ext = path.extname(file.originalFilename || '.png').toLowerCase();
    const fileName = `food-${Date.now()}${ext}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('food-images')
      .upload(fileName, fileBuffer, {
        contentType: file.mimetype || 'image/png',
        upsert: false,
      });

    if (error) {
      console.error('Supabase Storage upload error:', error);
      return res.status(500).json({ error: 'Failed to upload image: ' + error.message });
    }

    // Get the public URL
    const { data: publicUrlData } = supabase.storage
      .from('food-images')
      .getPublicUrl(fileName);

    return res.status(201).json({ url: publicUrlData.publicUrl });
  } catch (e) {
    console.error('Upload error:', e);
    return res.status(500).json({ error: 'Image upload failed' });
  }
}
