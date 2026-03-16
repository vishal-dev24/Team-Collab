import Joi from "joi"

export const taskSchema = Joi.object({
    title: Joi.string().required(),
    description: Joi.string().allow(""),
    status: Joi.string().valid("todo", "in-progress", "done").optional(),
    projectId: Joi.string().required(),
    assignedTo: Joi.string().required()
})