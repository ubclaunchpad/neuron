import './index.css'; 

function ClassPreferencesCard({ classData, fullWith }) {
    let card_width;
    if (fullWith) {
        card_width = "90%";
    } else {
        card_width = "40%";
    }

    const RANK1_COLOR = "rgba(67, 133, 172, 1)";
    const RANK2_COLOR = "rgba(67, 133, 172, 0.7)";
    const RANK3_COLOR = "rgba(67, 133, 172, 0.3)";

    const rank = classData.class_rank;
    const name = classData.class_name;
    const instruction = classData.instructions;
    const start_time = classData.start_time;
    const end_time = classData.end_time;

    const timeDifference = (end, start) => {
        // Assume classes are done within one day, end time > start time 
        if (end === null || end === undefined || end ==="" || start === null || start === undefined || start === "") return "";

        const e = end.split(":");
        const s = start.split(":");
        if (e[1] < s[1]) {
            return `${Number(e[0]) - 1 - Number(s[0])} hour ${-(Number(e[1]) - Number(s[1]))} min`;
        } else if (e[1] > s[1]) {
            return `${Number(e[0]) - Number(s[0])} hour ${(Number(e[1]) - Number(s[1]))} min`;
        } else {
            return `${Number(e[0]) - Number(s[0])} hour`;
        }
    };

    let lineColor; 
    if (rank === 1) {
        lineColor = RANK1_COLOR;
    } else if (rank === 2) {
        lineColor = RANK2_COLOR;
    } else {
        lineColor = RANK3_COLOR;
    }

    const formatTime = (time) => {
        if (time === null || time === undefined || time === "") return "";

        const [hour, minute] = time.split(":").map(Number);
        const period = hour >= 12 ? "PM" : "AM";
        const formattedHour = hour % 12 || 12;
        return `${formattedHour}:${minute.toString().padStart(2, "0")} ${period}`;
    };

    return (
        <div className="class-pref-card" style={{width: card_width}} >
            <div className="vertical-line" style={{ backgroundColor: lineColor }} />
            <div className="card-content">
                <div className="column segment-1">
                    <div className="card-text">
                        <h2 className="class-pref-time">{formatTime(start_time)}</h2>
                        <p>{timeDifference(end_time, start_time)}</p>
                    </div>
                </div>
                <div className="column segment-2">
                    <div className="card-text">
                        <h2>{name}</h2>
                        <p>{instruction.substring(0, 50)}{instruction.length > 40 ? '...' : ''}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ClassPreferencesCard;