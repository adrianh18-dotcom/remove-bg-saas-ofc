import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import Replicate from 'replicate';

export const config = {
  api: {
    bodyParser: false,
  },
};

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).end('Method Not Allowed');
  }

  const form = new formidable.IncomingForm({ keepExtensions: true });

  form.parse(req, async (err: any, fields: any, files: any) => {
    if (err || !files.image) {
      return res.status(400).json({ error: 'Erro ao processar imagem' });
    }

    const file = Array.isArray(files.image) ? files.image[0] : files.image;
    const imagePath = file.filepath;
    const fileData = fs.readFileSync(imagePath, { encoding: 'base64' });

    try {
      const output = await replicate.run('cjwbw/rembg:latest', {
        input: { image: fileData },
      });

      const imageBuffer = Buffer.from(output as string, 'base64');
      res.setHeader('Content-Type', 'image/png');
      res.send(imageBuffer);
    } catch (error) {
      console.error('Falha na remoção de fundo:', error);
      res.status(500).json({ error: 'Falha na remoção de fundo' });
    }
  });
}
