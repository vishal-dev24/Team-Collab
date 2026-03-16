// Quick Check: validation/messageValidation.js
import Joi from 'joi';

export const messageSchema = Joi.object({
    content: Joi.string().required(),
    senderId: Joi.string().required(), // Ya Joi.objectId() agar joi-objectid use kar rahe ho
    teamId: Joi.string().required(),
    senderName: Joi.string().optional()
});
