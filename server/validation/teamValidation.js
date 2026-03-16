import Joi from "joi"

export const teamSchema = Joi.object({
    name: Joi.string().required(),
    description: Joi.string().allow(""),
    adminId: Joi.string().required()
})