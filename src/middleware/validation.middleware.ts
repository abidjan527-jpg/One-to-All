import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

const chatSchema = Joi.object({
  model: Joi.string().required(),
  messages: Joi.array()
    .items(
      Joi.object({
        role: Joi.string().valid('user', 'assistant', 'system').required(),
        content: Joi.string().required(),
      })
    )
    .required()
    .min(1),
  temperature: Joi.number().min(0).max(2),
  max_tokens: Joi.number().min(1).max(4096),
  top_p: Joi.number().min(0).max(1),
});

const embeddingsSchema = Joi.object({
  input: Joi.alternatives().try(
    Joi.string(),
    Joi.array().items(Joi.string())
  ).required(),
  model: Joi.string(),
});

export const validateChatRequest = (req: Request, res: Response, next: NextFunction) => {
  const { error } = chatSchema.validate(req.body);

  if (error) {
    return res.status(400).json({
      error: 'Validation error',
      message: error.details.map(d => d.message).join(', '),
    });
  }

  next();
};

export const validateEmbeddingsRequest = (req: Request, res: Response, next: NextFunction) => {
  const { error } = embeddingsSchema.validate(req.body);

  if (error) {
    return res.status(400).json({
      error: 'Validation error',
      message: error.details.map(d => d.message).join(', '),
    });
  }

  next();
};
