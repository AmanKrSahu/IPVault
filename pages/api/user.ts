import type { NextApiRequest, NextApiResponse } from 'next';
import { createOrUpdateUser } from "@/utils/db/actions";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { address, email } = req.body;

    try {
      const user = await createOrUpdateUser(address, email);
      res.status(200).json({ user });
    } catch (error) {
      console.error("Error creating or updating user:", error);
      res.status(500).json({ error: "Failed to create or update user" });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
