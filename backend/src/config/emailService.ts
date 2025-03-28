import nodemailer from "nodemailer";
import {GMAIL_ID, GMAIL_PASSWORD} from "../config/environment.js";
import { MailData } from "../common/types.js";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: GMAIL_ID,
        pass: GMAIL_PASSWORD,
    },
});

async function sendEmail(mailData: MailData) {
    const mailOptions = {
        from: '"Team Neuron" <neuronbc@gmail.com>',
        to: mailData.email,
        subject: mailData.subject,
        html: mailData.message + "<br><br>Best,<br>Team Neuron",
    };

    // Send the mail, ignore errors, not an important email
    await transporter.sendMail(mailOptions).catch();
}

export { sendEmail };