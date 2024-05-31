import z from "zod"

export const createTaskInput = z.object({
    options: z.array(z.object({
        imageUrl: z.string()

    })),
    title: z.string().optional(),
    signature: z.string(),
    amount: z.string()

})


export const userDetails = z.object({
    address: z.string(),
    username: z.string().optional(),
    email: z.string().optional()
})
export const createSubmissionInput = z.object({
    taskId: z.string(),
    selection: z.string(),
});

// Define the Task interface
export interface Task {
    id: number;
    // Define other properties as per your schema
    title: string;
}

// Define the Submission interface
export interface Submission {
    id: number;
    option_id: number;
    // Add other properties as necessary
}

export interface Worker {
    id: number;

    pending_amount: string;

    locked_amount: string;
}

export interface Option {
    id: number;
    image_url: string;
    task_id: number;

}