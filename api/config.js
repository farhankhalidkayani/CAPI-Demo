export default function handler(req, res) {
  res.status(200).json({ pixelId: process.env.META_PIXEL_ID || null });
}
