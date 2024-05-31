// types.ts
export interface Option {
    id: number ;
    image_url: string ;
    task_id: number ;
}

export interface Task {
    id: number ;
    amount: string ;
    title: string ;
    options: Option[] ;
}

export interface  Tasks{
    tasks : Task[]
}

