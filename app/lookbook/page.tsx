"use client"
import React, { useEffect, useState } from "react"
import Image from "next/image"
import { lookbookData as fallbackData, type LookbookSection } from "../data/lookbookData"

function LookbookPage() {
    const [sections, setSections] = useState<LookbookSection[]>(fallbackData)

    useEffect(() => {
        const load = async () => {
            try {
                const res = await fetch('/api/lookbook', { cache: 'no-store' })
                if (res.ok) {
                    const data = await res.json()
                    if (Array.isArray(data.sections) && data.sections.length) {
                        setSections(data.sections)
                    }
                }
            } catch {}
        }
        load()
    }, [])

    return (
        <div className="py-10">
            {/* Hero Section */}
            <div className="flex flex-col md:flex-row justify-center items-center ">
                <div className="relative w-full md:w-1/2 h-[300px] md:h-[500px]">
                    <Image
                        src="/clarinet-cotton-Adire.jpg"
                        alt="Lookbook Hero"
                        fill
                        className="object-cover "
                        priority
                    />
                </div>
                <div className="relative w-full md:w-1/2 h-[300px] md:h-[500px]">
                    <Image
                        src="/clarinet-cotton-Adire2.jpg"
                        alt="Lookbook Hero"
                        fill
                        className="object-cover "
                        priority
                    />
                </div>
            </div>

            {/* Iterate over each material section */}
            {sections.map((section: LookbookSection) => (
                <div key={section.material} className="">
                    {/* Material Heading */}
                    <h2 className="text-4xl sm:text-6xl md:text-8xl lg:text-[167px] font-medium text-[#8D2741] font-sans text-center leading-tight my-5">
                        {section.material}
                    </h2>


                    {/* Grid of Images */}
                    <div className="grid grid-cols-1 md:grid-cols-3">
                        {section.images.map((img: string, index: number) => (
                            <div
                                key={index}
                                className="relative w-full min-h-[300px] md:min-h-[400px] overflow-hidden shadow-lg"
                            >
                                <Image
                                    src={img}
                                    alt={`${section.material} outfit ${index + 1}`}
                                    fill
                                    className="object-cover hover:scale-105 transition-transform duration-300"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    )
}

export default LookbookPage
