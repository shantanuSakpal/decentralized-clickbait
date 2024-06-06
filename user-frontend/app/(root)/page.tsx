"use client";
import Appbar from "@/components/Appbar";
import {Hero} from "@/components/Hero";
import AllTasks from "@/components/AllTasks";

export default function Home() {
   const user = localStorage.getItem("token")
    return (
        <main>
            <Appbar/>
            <Hero/>
            {
                user ? <AllTasks/> : <p className="p-10 text-2xl text-center">Login to see tasks</p>
            }


        </main>
    );
}