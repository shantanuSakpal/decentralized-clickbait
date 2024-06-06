"use client"
import axios from "axios";
import {useState} from "react"
import Image from "next/image";

export function UploadImage({onImageAdded, image}: {
    onImageAdded: (image: string) => void;
    image?: string;
}) {
    const CLOUDFRONT_URL = process.env.NEXT_PUBLIC_CLOUDFRONT_URL
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL

    const [uploading, setUploading] = useState(false);

    async function getUrl() {
        const headers = {
            'Content-Type': 'application/json',
            'authorization': localStorage.getItem("token")
        }
        const data = {}
        const response = await axios.post(`${BACKEND_URL}/v1/user/generateUploadUrl`,data, {
            headers: headers
        });
        return response
    }

    async function onFileSelect(e: any) {
        setUploading(true);
        try {
            const file = e.target.files[0];
            const response = await getUrl();
            console.log(response.data)
            const presignedUrl = response.data.preSignedUrl;
            const formData = new FormData();
            formData.set("bucket", response.data.fields["bucket"])
            formData.set("X-Amz-Algorithm", response.data.fields["X-Amz-Algorithm"]);
            formData.set("X-Amz-Credential", response.data.fields["X-Amz-Credential"]);
            formData.set("X-Amz-Algorithm", response.data.fields["X-Amz-Algorithm"]);
            formData.set("X-Amz-Date", response.data.fields["X-Amz-Date"]);
            formData.set("key", response.data.fields["key"]);
            formData.set("Policy", response.data.fields["Policy"]);
            formData.set("X-Amz-Signature", response.data.fields["X-Amz-Signature"]);
            formData.set("X-Amz-Algorithm", response.data.fields["X-Amz-Algorithm"]);
            formData.append("file", file);
            const awsResponse = await axios.post(presignedUrl, formData);

            onImageAdded(`${CLOUDFRONT_URL}/${response.data.fields["key"]}`);
            console.log(`${CLOUDFRONT_URL}/${response.data.fields["key"]}`)
        } catch (e) {
            console.log(e)
        }
        setUploading(false);
    }

    if (image) {
        return <Image alt="your image" width="500" height="500" className={"p-2 w-80 rounded aspect-video"} src={image}/>
    }

    return <div>
        <div className="w-20 h-20 rounded border text-2xl ">
            <div className="h-full flex justify-center flex-col relative w-full">
                <div className="h-full flex justify-center w-full items-center text-4xl hover:cursor-pointer">
                    {uploading ? <div className="text-sm">Loading...</div> : <>
                        +
                        <input className="w-full h-full bg-red-400" type="file" style={{
                            position: "absolute",
                            opacity: 0,
                            top: 0,
                            left: 0,
                            bottom: 0,
                            right: 0,
                            width: "100%",
                            height: "100%"
                        }} onChange={onFileSelect}/>
                    </>}
                </div>
            </div>
        </div>
    </div>
}