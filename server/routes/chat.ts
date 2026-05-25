import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { nimChat } from '../services/nvidia-nim';

const router = express.Router();
const prisma = new PrismaClient();

router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { message, sessionId } = req.body;

    let conversation = await prisma.conversation.findFirst({
      where: { sessionId, status: 'ACTIVE' },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({ data: { sessionId } });
    }

    await prisma.message.create({
      data: { conversationId: conversation.id, role: 'USER', content: message },
    });

    const systemPrompt = `You are PAULI, the AI assistant for THE PAULI EFFECT comic series. Help readers understand physics concepts, navigate the story, and answer questions. Be friendly and enthusiastic about science.`;

    const assistantMessage = await nimChat(
      [{ role: 'user', content: message }],
      { systemPrompt },
    );

    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'ASSISTANT',
        content: assistantMessage,
      },
    });

    res.json({ message: assistantMessage, conversationId: conversation.id });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to process chat' });
  }
});

export default router;
