import { NextResponse } from "next/server";
import connectDB from "@/app/utils/mongodb";
import MainText from "@/app/models/mainText";
import SubText from "@/app/models/subText";

// 서브텍스트의 배경색에 따라 메인텍스트를 그룹화하여 반환
export async function GET(req) {
    await connectDB();

    try {
        const mainTextUids = await MainText.aggregate([
            {
                $lookup: {
                    from: "subtexts",
                    localField: "sub_text_uid",
                    foreignField: "uid",
                    as: "subtextDetails",
                },
            },
            {
                $unwind: "$subtextDetails",
            },
            {
                $match: {
                    "subtextDetails.background_color": { $in: ["dark", "light"] },
                },
            },
            {
                $group: {
                    _id: "$subtextDetails.background_color",
                    mainTextUids: { $push: "$uid" },
                },
            },
            {
                $project: {
                    _id: 0,
                    background_color: "$_id",
                    mainTextUids: 1,
                },
            },
        ]);

        let darkMainTextUids = [];
        let lightMainTextUids = [];

        mainTextUids.forEach((group) => {
            if (group.background_color === "dark") {
                darkMainTextUids = group.mainTextUids;
            } else if (group.background_color === "light") {
                lightMainTextUids = group.mainTextUids;
            }
        });

        return NextResponse.json({ dark: darkMainTextUids, light: lightMainTextUids });
    } catch (error) {
        return NextResponse.json({ error: `Failed to fetch main texts: ${error.message}` }, { status: 500 });
    }
}
